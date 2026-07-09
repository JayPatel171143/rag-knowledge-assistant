# RAG Knowledge Assistant

A local-first Retrieval-Augmented Generation (RAG) app that lets you upload one or more PDF documents, ask questions in natural language, and get streamed answers powered by your local Ollama model.

> This project is configured to run with **Ollama + Llama 3** locally, so you can use it without sending your documents to a cloud AI service.

## Features

- Upload **multiple PDF files** at once
- Extract and chunk PDF text locally
- Build a temporary vector index with **Chroma**
- Retrieve the most relevant passages for each question
- Generate answers with **Llama 3 via Ollama**
- Stream responses back to the browser in real time
- Clean web UI built with **FastAPI** + **Jinja2** + **Tailwind CSS**

## How it works

1. You upload PDF documents in the browser.
2. The backend extracts text using **PyMuPDF**.
3. The text is split into chunks with `RecursiveCharacterTextSplitter`.
4. Chunks are embedded using `sentence-transformers/all-MiniLM-L6-v2`.
5. Chroma retrieves the most relevant chunks for your question.
6. The selected context is sent to **Ollama Llama 3**.
7. The answer is streamed back to the UI.

## Tech stack

- **Backend:** FastAPI, Uvicorn
- **RAG pipeline:** LangChain, ChromaDB, Sentence Transformers
- **PDF extraction:** PyMuPDF
- **Local LLM:** Ollama with `llama3`
- **Frontend:** HTML, JavaScript, Tailwind CSS

## Prerequisites

Before running the project locally, make sure you have:

- **Python 3.10+** installed
- **Ollama** installed and running locally
- The **Llama 3** model pulled in Ollama

### Install Ollama and pull Llama 3

If you have not already done so, install Ollama from:

https://ollama.com/

Then pull the model:

```bash
ollama pull llama3
```

Make sure Ollama is running before starting the app.

## Installation

### 1) Clone the repository

```bash
git clone https://github.com/JayPatel171143/rag-knowledge-assistant.git
cd rag-knowledge-assistant
```

### 2) Create a virtual environment

```bash
python -m venv .venv
```

Activate it:

- **Windows**

```bash
.venv\Scripts\activate
```

- **macOS / Linux**

```bash
source .venv/bin/activate
```

### 3) Install dependencies

```bash
pip install -r requirements.txt
```

## Run locally

Start the FastAPI app with Uvicorn:

```bash
uvicorn app:app --reload
```

Then open your browser at:

```text
http://127.0.0.1:8000
```

## Usage

1. Open the app in your browser.
2. Upload one or more PDF files.
3. Type a question about the uploaded documents.
4. Click **Ask AI**.
5. Wait for the streamed response.

### Example questions

- What is the main topic of the document?
- Summarize the key findings in the uploaded PDFs.
- What does the document say about deployment?
- List the action items mentioned in the report.

## Project structure

```text
rag-knowledge-assistant/
├── app.py
├── rag_pipeline.py
├── requirements.txt
├── templates/
│   └── index.html
├── static/
│   ├── app.js
│   └── style.css
├── data/
│   └── sample.pdf
└── tests/
    ├── pdf_rag_test.py
    ├── chroma_test.py
    └── embedding_test.py
```

## Configuration notes

- The model name used in code is `llama3`.
- If your Ollama model has a different tag, update this line in `rag_pipeline.py`:

```python
ollama.chat(model="llama3", ...)
```

- The embedding model is:

```python
sentence-transformers/all-MiniLM-L6-v2
```

- Chroma is currently used in-memory for each request.

## Troubleshooting

### Ollama connection issues

If the app cannot reach Ollama:

- Confirm Ollama is running
- Confirm `llama3` is installed:

```bash
ollama list
```

- Test Ollama directly:

```bash
ollama run llama3
```

### Slow first response

The first request may take longer because:

- the embedding model is loaded
- PDFs are processed and chunked
- Chroma builds the temporary vector store
- Ollama initializes the model

### Empty or weak answers

If answers are not good:

- Make sure the PDFs contain selectable text, not just images
- Try shorter, more specific questions
- Upload fewer, more relevant PDFs
- Increase or tune chunking parameters in `rag_pipeline.py`

## Limitations

- PDF files must contain extractable text for best results
- The vector store is rebuilt for each request
- Answers depend on the content retrieved from the uploaded documents
- Large PDFs may require more processing time

## Future improvements

- Persist Chroma embeddings between sessions
- Add citation highlighting in the UI
- Support scanned PDFs with OCR
- Add document upload history
- Improve prompt formatting and source tracing

## License

No license file is currently included in the repository. Add one if you want to define how others may use the project.

## Acknowledgements

Built with:

- FastAPI
- LangChain
- ChromaDB
- Ollama
- Llama 3
- Sentence Transformers
- PyMuPDF
