from flask import Flask, render_template, request, jsonify
import fitz
import tempfile
import ollama

from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings

app = Flask(__name__)

# ---------------- HOME PAGE ----------------

@app.route("/")
def home():
    return render_template("index.html")

# ---------------- ASK AI ROUTE ----------------

@app.route("/ask", methods=["POST"])
def ask_ai():

    pdf_file = request.files["pdf"]
    question = request.form["question"]

    # -------- SAVE PDF --------

    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp_file:
        pdf_file.save(tmp_file.name)
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

    # -------- EMBEDDINGS --------

    embedding_model = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2"
    )

    # -------- VECTOR DB --------

    vector_db = Chroma.from_texts(
        texts=chunks,
        embedding=embedding_model
    )

    # -------- RETRIEVAL --------

    results = vector_db.similarity_search(question, k=5)

    context = "\n".join(
        [result.page_content for result in results]
    )

    # -------- PROMPT --------

    prompt = f"""
    You are a helpful AI assistant.

    Answer ONLY using the provided context.

    If the answer is not clearly present in the context, say:
    "I could not find the exact answer in the document."

    Context:
    {context}

    Question:
    {question}
    """

    # -------- LLAMA3 --------

    response = ollama.chat(
        model="llama3",
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ]
    )

    answer = response["message"]["content"]

    return jsonify({
        "answer": answer
    })

# ---------------- RUN APP ----------------

if __name__ == "__main__":
    app.run(debug=True)