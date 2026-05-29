import fitz
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings
import ollama

# STEP 1 — Read PDF
pdf_path = "data/sample.pdf"

doc = fitz.open(pdf_path)

text = ""

for page in doc:
    text += page.get_text()

print("\nPDF Loaded Successfully\n")

# STEP 2 — Chunk Text
splitter = RecursiveCharacterTextSplitter(
    chunk_size=1500,
    chunk_overlap=250
)

chunks = splitter.split_text(text)

print(f"Total Chunks: {len(chunks)}")

# STEP 3 — Load Embedding Model
embedding_model = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)

# STEP 4 — Create Vector Database
vector_db = Chroma.from_texts(
    texts=chunks,
    embedding=embedding_model,
    persist_directory="chroma_db"
)

print("\nEmbeddings Stored Successfully\n")

# STEP 5 — Ask Question
query = input("Ask a question: ")

# STEP 6 — Retrieve Similar Chunks
results = vector_db.similarity_search(query, k=5)

context = "\n".join([result.page_content for result in results])

print("\nRetrieved Context:\n")
print(context)

# STEP 7 — Create Prompt
prompt = f"""
You are a helpful AI assistant.

Answer ONLY using the provided context.

If the answer is not clearly present in the context, say:
"I could not find the exact answer in the document."

Context:
{context}

Question:
{query}
"""

# STEP 8 — Ask Llama3
response = ollama.chat(
    model="llama3",
    messages=[
        {
            "role": "user",
            "content": prompt
        }
    ]
)

# STEP 9 — Print Final Answer
print("\nAI Answer:\n")
print(response['message']['content'])

