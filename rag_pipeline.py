import fitz
import tempfile
import ollama

from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings

# ---------------- EMBEDDING MODEL ----------------

embedding_model = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)

# ---------------- MAIN RAG FUNCTION ----------------

def process_rag_request(pdfs, question):

    all_chunks = []

    # -------- PROCESS EACH PDF --------

    for pdf in pdfs:

        # -------- SAVE TEMP PDF --------

        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp_file:

            content = pdf.file.read()

            tmp_file.write(content)

            pdf_path = tmp_file.name

        # -------- READ PDF --------

        doc = fitz.open(pdf_path)

        text = ""

        for page in doc:

            text += page.get_text()

        # -------- CHUNKING --------

        splitter = RecursiveCharacterTextSplitter(
            chunk_size=1500,
            chunk_overlap=250
        )

        chunks = splitter.split_text(text)

        # -------- STORE CHUNKS --------

        all_chunks.extend(chunks)

    # -------- VECTOR DATABASE --------

    vector_db = Chroma.from_texts(

        texts=all_chunks,

        embedding=embedding_model

    )

    # -------- RETRIEVAL --------

    results = vector_db.similarity_search(question, k=5)

    context = "\n".join([
        result.page_content for result in results
    ])

    # -------- PROMPT --------

    prompt = f"""
    You are a helpful AI assistant.

    Answer ONLY using the provided context.

    If the answer is not clearly present in the context, say:
    "I could not find the exact answer in the documents."

    Context:
    {context}

    Question:
    {question}
    """

    # -------- OLLAMA STREAM --------

    stream = ollama.chat(

        model="llama3",

        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ],

        stream=True
    )

    # -------- STREAM TOKENS --------

    for chunk in stream:

        if "message" in chunk:

            content = chunk["message"]["content"]

            yield content