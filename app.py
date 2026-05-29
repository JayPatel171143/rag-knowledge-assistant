from fastapi import FastAPI, Request, UploadFile, File, Form
from fastapi.responses import HTMLResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from typing import List

from rag_pipeline import process_rag_request

# ---------------- FASTAPI APP ----------------

app = FastAPI()

# ---------------- STATIC FILES ----------------

app.mount("/static", StaticFiles(directory="static"), name="static")

# ---------------- TEMPLATES ----------------

templates = Jinja2Templates(directory="templates")

# ---------------- HOME ROUTE ----------------

@app.get("/", response_class=HTMLResponse)
async def home(request: Request):

    return templates.TemplateResponse(
        request,
        "index.html"
    )

# ---------------- ASK AI ROUTE ----------------

@app.post("/ask")
async def ask_ai(

    pdfs: List[UploadFile] = File(...),
    question: str = Form(...)

):

    stream = process_rag_request(
        pdfs,
        question
    )

    return StreamingResponse(
        stream,
        media_type="text/plain"
    )