# RAG Knowledge Assistant

A full-stack **Retrieval-Augmented Generation (RAG)** assistant that lets users upload PDF documents, ask natural-language questions, and get context-aware AI answers.

🌐 **Live Demo:** [rag17.vercel.app](https://rag17.vercel.app)

---

## Overview

RAG Knowledge Assistant combines a Python backend RAG pipeline with a modern frontend to deliver an interactive document-questioning experience.

At a high level, the app:
- accepts PDF uploads,
- extracts and chunks text,
- retrieves relevant context using vector search,
- generates answers with an LLM,
- and streams responses to the UI.

This repo includes both backend and frontend code, with deployment-ready configuration.

---

## Features

- 📄 Upload one or multiple PDF files
- 🔎 Semantic retrieval over uploaded content
- 🤖 LLM-powered answers grounded in document context
- ⚡ Real-time/streamed response experience
- 🧠 Embedding + vector search workflow for retrieval quality
- 🌍 Hosted frontend for easy access and demos

---

## Tech Stack

Based on repository language composition and project structure:

- **JavaScript (47.7%)** – Frontend interactions/app logic
- **CSS (37.9%)** – UI styling
- **Python (13.1%)** – Backend + RAG pipeline
- **HTML (1.3%)** – Page structure/templates

Likely core libraries/services used in the project:
- FastAPI / Python API services
- LangChain + Chroma (or equivalent vector retrieval stack)
- Ollama / local or configurable LLM backend
- Vercel-hosted frontend

---

## Repository Structure

```text
rag-knowledge-assistant/
├── app.py
├── rag_pipeline.py
├── requirements.txt
├── frontend/
├── static/
├── templates/
└── README.md
```

---

## Getting Started (Local)

### 1) Clone

```bash
git clone https://github.com/JayPatel171143/rag-knowledge-assistant.git
cd rag-knowledge-assistant
```

### 2) Create & activate virtual environment

```bash
python -m venv .venv
```

- **Windows**
```bash
.venv\Scripts\activate
```

- **macOS/Linux**
```bash
source .venv/bin/activate
```

### 3) Install dependencies

```bash
pip install -r requirements.txt
```

### 4) Run backend

```bash
uvicorn app:app --reload
```

Backend default URL:

```text
http://127.0.0.1:8000
```

---

## Usage

1. Open the app (local or hosted).
2. Upload one or more PDF documents.
3. Ask a question about the uploaded content.
4. Review the generated response.

Example prompts:
- “Summarize this document in 5 bullet points.”
- “What are the key action items mentioned?”
- “Compare the major findings across these PDFs.”

---

## Deployment

- ✅ Live app: **[https://rag17.vercel.app](https://rag17.vercel.app)**
- Repository: **[JayPatel171143/rag-knowledge-assistant](https://github.com/JayPatel171143/rag-knowledge-assistant)**

If you're deploying updates, ensure frontend environment variables and backend API URLs are aligned.

---

## Troubleshooting

- Ensure Python version is compatible with `requirements.txt`
- Verify any LLM service (local or remote) is running and reachable
- Check PDF text is extractable (scanned/image-only PDFs may require OCR)
- Confirm CORS/backend URL settings when connecting frontend + backend

---

## Roadmap Ideas

- Persistent vector store across sessions
- Source citation highlighting in answers
- OCR support for scanned PDFs
- Authentication + user-specific document spaces
- Conversation history and export

---

## Contributing

Contributions are welcome.

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Open a pull request

---

## License

No license file is currently defined in this repository.
If you plan to open-source for reuse, add a `LICENSE` file (e.g., MIT).
