import os
import tempfile
import json
import logging
import httpx
import fitz

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from langchain_community.embeddings import HuggingFaceInferenceAPIEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI
app = FastAPI(title="AI Knowledge Assistant API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- EMBEDDINGS ----------------
# We use HuggingFaceInferenceAPIEmbeddings to run the embedding model remotely.
# This requires 0MB of local RAM on Render, preventing Out of Memory crashes.
# Note: You can optionally add a free HUGGINGFACEHUB_API_TOKEN in Render env vars for higher rate limits.
embedding_model = HuggingFaceInferenceAPIEmbeddings(
    api_key=os.getenv("HUGGINGFACEHUB_API_TOKEN"),
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)

# ---------------- GROQ STREAMING ----------------
def stream_groq(prompt: str, api_key: str):
    logger.info("Attempting generation using Groq API...")
    groq_model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    data = {
        "model": groq_model,
        "messages": [{"role": "user", "content": prompt}],
        "stream": True
    }
    
    try:
        with httpx.stream(
            "POST",
            "https://api.groq.com/openai/v1/chat/completions",
            headers=headers,
            json=data,
            timeout=60.0
        ) as response:
            if response.status_code != 200:
                error_body = response.read().decode("utf-8")
                logger.error(f"Groq API error: {response.status_code} - {error_body}")
                yield f"\n[Error: Groq returned status {response.status_code}]"
                return
                
            for line in response.iter_lines():
                if not line:
                    continue
                if line.startswith("data: "):
                    data_str = line[6:].strip()
                    if data_str == "[DONE]":
                        break
                    try:
                        chunk_json = json.loads(data_str)
                        content = chunk_json["choices"][0]["delta"].get("content", "")
                        if content:
                            yield content
                    except Exception as parse_err:
                        logger.warning(f"Error parsing Groq stream chunk: {parse_err}")
    except Exception as e:
        logger.error(f"Failed to stream from Groq: {e}")
        yield f"\n[Error: Failed to fetch from Groq: {str(e)}]"

# ---------------- RAG PROCESSING ----------------
def process_rag_request(pdfs: List[UploadFile], question: str):
    yield "[System: Extracting text from PDFs...]\n"
    all_chunks = []
    all_metadatas = []

    logger.info(f"Received request with PDFs: {[p.filename for p in pdfs]}")

    for pdf in pdfs:
        # Reset file pointer to the beginning to ensure we read the entire file
        pdf.file.seek(0)
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp_file:
            content = pdf.file.read()
            tmp_file.write(content)
            pdf_path = tmp_file.name
            logger.info(f"Read PDF: {pdf.filename}, size: {len(content)} bytes")

        try:
            doc = fitz.open(pdf_path)
            text = ""
            for page in doc:
                text += page.get_text()
            
            logger.info(f"Extracted {len(text)} characters from {pdf.filename}")

            splitter = RecursiveCharacterTextSplitter(
                chunk_size=1500,
                chunk_overlap=250
            )
            chunks = splitter.split_text(text)
            logger.info(f"Split {pdf.filename} into {len(chunks)} chunks")

            for chunk in chunks:
                all_chunks.append(chunk)
                all_metadatas.append({"source": pdf.filename})
        except Exception as parse_err:
            logger.error(f"Error parsing PDF {pdf.filename}: {parse_err}")
            yield f"[System: Error parsing PDF {pdf.filename}: {str(parse_err)}]\n"
        finally:
            try:
                os.remove(pdf_path)
            except Exception:
                pass

    if not all_chunks:
        yield "Error: No text content could be extracted from the uploaded PDFs."
        return

    # Use a unique collection name for each request to ensure isolated vector memory
    import uuid
    collection_name = f"col_{uuid.uuid4().hex}"

    try:
        yield "[System: Creating in-memory vector database...]\n"
        logger.info(f"Indexing {len(all_chunks)} chunks into ChromaDB collection {collection_name}...")
        vector_db = Chroma.from_texts(
            texts=all_chunks,
            embedding=embedding_model,
            metadatas=all_metadatas,
            collection_name=collection_name
        )

        # Retrieve k=6 chunks for better coverage of multiple documents
        results = vector_db.similarity_search(question, k=6)
        
        context_parts = []
        for result in results:
            source = result.metadata.get("source", "Unknown Document")
            context_parts.append(f"[Source Document: {source}]\n{result.page_content}")
        context = "\n\n".join(context_parts)

        prompt = f"""You are a helpful AI assistant.

Answer the question based ONLY on the provided context from the uploaded documents.
Refer to specific documents by name (e.g. "According to file1.pdf...") when answering.
If the answer is not clearly present in the context, say:
"I could not find the exact answer in the documents."

Context:
{context}

Question:
{question}
"""

        groq_key = os.getenv("GROQ_API_KEY")
        if not groq_key:
            yield "Error: GROQ_API_KEY is not configured in the environment variables."
            return

        yield "[System: Generating answer using Groq...]\n"
        yield from stream_groq(prompt, groq_key)
    except Exception as e:
        logger.error(f"Error during RAG execution: {e}", exc_info=True)
        yield f"\n[Backend Error: {str(e)}]"

# ---------------- ROUTE HANDLERS ----------------
@app.post("/ask")
async def ask_ai(
    pdfs: List[UploadFile] = File(...),
    question: str = Form(...)
):
    if not pdfs:
        raise HTTPException(status_code=400, detail="At least one PDF file must be uploaded.")
    if not question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    try:
        stream = process_rag_request(pdfs, question)
        return StreamingResponse(stream, media_type="text/plain")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
