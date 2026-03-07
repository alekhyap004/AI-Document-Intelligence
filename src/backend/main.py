import os
import shutil
from fastapi import FastAPI, UploadFile, File
from pydantic import BaseModel
from src.backend.ingest import save_pdf, build_index
from src.backend.query import query_document, summarize_document

app = FastAPI()

class ChatRequest(BaseModel):
    doc_id: str
    question: str

class SummarizeRequest(BaseModel):
    doc_id: str

class ExtractRequest(BaseModel):
    doc_id: str
    question: str

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    temp_path = f"/tmp/{file.filename}"
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    doc_id = save_pdf(temp_path, file.filename)
    build_index(doc_id)
    return {"doc_id": doc_id, "message": "PDF uploaded and indexed successfully"}

@app.post("/chat")
def chat(request: ChatRequest):
    answer = query_document(request.doc_id, request.question)
    return {"answer": answer}

@app.post("/summarize")
def summarize(request: SummarizeRequest):
    summary = summarize_document(request.doc_id)
    return {"summary": summary}

@app.post("/extract")
def extract(request: ExtractRequest):
    result = query_document(request.doc_id, request.question)
    return {"result": result}