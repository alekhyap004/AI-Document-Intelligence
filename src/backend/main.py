import os
import shutil
import uuid
import json
from fastapi import FastAPI, UploadFile, File, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import desc
from src.backend.ingest import save_pdf, build_index
from src.backend.query import query_document, query_multiple_documents, summarize_document
from src.backend.database import get_db, engine, Base
from src.backend.models import Conversation, Message

# Create tables if they don't exist
Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Request Models ────────────────────────────────────────────

class ChatRequest(BaseModel):
    doc_ids: list[str]
    question: str

class SummarizeRequest(BaseModel):
    doc_id: str

class ExtractRequest(BaseModel):
    doc_id: str
    schema: str

# ─── Health ────────────────────────────────────────────────────

@app.get("/health")
def health_check():
    return {"status": "ok"}

# ─── Upload ────────────────────────────────────────────────────

@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    temp_path = f"/tmp/{file.filename}"
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    doc_id = save_pdf(temp_path, file.filename)
    build_index(doc_id)
    return {"doc_id": doc_id, "message": "PDF uploaded and indexed successfully"}

# ─── Conversations ─────────────────────────────────────────────

@app.post("/conversations")
def create_conversation(db: Session = Depends(get_db)):
    conversation = Conversation(
        id=uuid.uuid4(),
        title="New Conversation"
    )
    db.add(conversation)
    db.commit()
    db.refresh(conversation)
    return {
        "id": str(conversation.id),
        "title": conversation.title,
        "created_at": conversation.created_at
    }

@app.get("/conversations")
def list_conversations(db: Session = Depends(get_db)):
    conversations = db.query(Conversation).order_by(desc(Conversation.created_at)).all()
    return [
        {
            "id": str(c.id),
            "title": c.title,
            "created_at": c.created_at,
            "doc_ids": json.loads(c.doc_ids) if c.doc_ids else []
        }
        for c in conversations
    ]

@app.get("/conversations/{conversation_id}")
def get_conversation(conversation_id: str, db: Session = Depends(get_db)):
    conversation = db.query(Conversation).filter(
        Conversation.id == uuid.UUID(conversation_id)
    ).first()
    if not conversation:
        return {"error": "Conversation not found"}
    messages = [
        {"role": m.role, "content": m.content}
        for m in conversation.messages
    ]
    return {
        "id": str(conversation.id),
        "title": conversation.title,
        "doc_ids": json.loads(conversation.doc_ids) if conversation.doc_ids else [],
        "messages": messages
    }

@app.post("/conversations/{conversation_id}/chat")
def chat_in_conversation(
    conversation_id: str,
    request: ChatRequest,
    db: Session = Depends(get_db)
):
    conversation = db.query(Conversation).filter(
        Conversation.id == uuid.UUID(conversation_id)
    ).first()
    if not conversation:
        return {"error": "Conversation not found"}

    # Update which docs are part of this conversation
    conversation.doc_ids = json.dumps(request.doc_ids)

    # Auto-title from first question
    if conversation.title == "New Conversation" and request.question:
        conversation.title = request.question[:50]

    # Save user message
    user_msg = Message(
        id=uuid.uuid4(),
        conversation_id=uuid.UUID(conversation_id),
        role="user",
        content=request.question
    )
    db.add(user_msg)

    # Get answer from RAG across all docs
    answer = query_multiple_documents(request.doc_ids, request.question)

    # Save assistant message
    assistant_msg = Message(
        id=uuid.uuid4(),
        conversation_id=uuid.UUID(conversation_id),
        role="assistant",
        content=answer
    )
    db.add(assistant_msg)
    db.commit()

    return {"answer": answer}

# ─── Summarize & Extract ───────────────────────────────────────

@app.post("/summarize")
def summarize(request: SummarizeRequest):
    summary = summarize_document(request.doc_id)
    return {"summary": summary}

@app.post("/extract")
def extract(request: ExtractRequest):
    result = query_document(
        request.doc_id,
        f"Extract the following information and return as structured JSON: {request.schema}"
    )
    return {"result": result}