# AI Document Intelligence

A full-stack RAG (Retrieval-Augmented Generation) application that lets you upload PDFs and chat with them using Claude AI. Built from scratch to deeply understand how modern AI document pipelines work.

**Live Demo:** [ai-document-intelligence-murex.vercel.app](https://ai-document-intelligence-murex.vercel.app)

---

## What It Does

- Upload one or more PDFs and ask questions across all of them
- Get AI-powered answers grounded in your documents (not hallucinated)
- Summarize documents in seconds
- Extract structured information using natural language
- Persistent conversation history — pick up where you left off

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, Axios |
| Backend | Python, FastAPI |
| RAG Pipeline | LlamaIndex |
| LLM | Anthropic Claude (claude-sonnet-4-20250514) |
| Embeddings | HuggingFace (BAAI/bge-small-en-v1.5) |
| Database | PostgreSQL (Railway) |
| Deployment | Railway (backend), Vercel (frontend) |

---

## Architecture


User uploads PDF
      ↓
FastAPI /upload endpoint
      ↓
PDF parsed → chunked into text nodes (LlamaIndex SimpleDirectoryReader)
      ↓
Each chunk embedded → BAAI/bge-small-en-v1.5 (HuggingFace)
      ↓
Vectors stored in local index (LlamaIndex VectorStoreIndex)
      ↓
User asks a question
      ↓
Question embedded → similarity search across vector index
      ↓
Top-k most relevant chunks retrieved
      ↓
Claude synthesizes answer from retrieved context
      ↓
Answer + conversation saved to PostgreSQL


---

## Key Technical Decisions

### Why LlamaIndex over LangChain?
LlamaIndex is purpose-built for RAG pipelines — document ingestion, chunking, indexing, and retrieval are first-class concepts rather than generic chain abstractions. For a document intelligence use case this made the pipeline cleaner and easier to reason about.

### Why BAAI/bge-small-en-v1.5 for embeddings?
During development I experimented with several embedding approaches:
- **HuggingFace sentence-transformers** — full GPU version, excellent quality but 2GB+ image size, impractical for deployment
- **FastEmbed** — lightweight alternative, but version conflicts with the LlamaIndex integration at the time of building
- **CPU-only torch + HuggingFace** — final solution: same model quality as full torch, ~200MB on Linux x86, deployable within Railway's free tier limits

The BAAI/bge-small-en-v1.5 model specifically was chosen for its strong performance-to-size ratio on retrieval tasks.

### Why Claude for the LLM?
Initially built with Ollama (llama3.2) running locally for free development iteration. Switched to Claude for production because:
- Ollama requires a local server — not deployable to cloud without significant infrastructure complexity
- Claude's API is lightweight (just HTTP calls), fast, and produces high-quality synthesis from retrieved context
- The switch was a 2-line change in `query.py`, which validated the clean separation between retrieval and generation in the pipeline

### Multi-document querying
Each conversation stores its own `doc_ids`. When a question is asked, the system retrieves top-k nodes from each document's index independently, merges them, and passes the combined context to Claude for synthesis. This allows cross-document reasoning without building a unified index.

### Conversation persistence
PostgreSQL stores conversations, messages, and document metadata. Each conversation is isolated — uploading a PDF in one chat doesn't affect another. Document filenames are stored in a `documents` table so conversations can restore the correct file context on reload.

---

## RAG Concepts Explored

Building this from scratch required understanding several core RAG concepts:

**Chunking** — Documents are split into overlapping text nodes. Chunk size affects the tradeoff between retrieval precision and context completeness.

**Embeddings** — Text is converted to dense vector representations. Semantically similar text produces similar vectors, enabling meaning-based search rather than keyword matching.

**Vector similarity search** — At query time, the question is embedded and compared against stored document vectors using cosine similarity to find the most relevant chunks.

**Response synthesis** — Retrieved chunks are passed as context to the LLM with the original question. The LLM synthesizes a grounded answer, reducing hallucination by anchoring responses in actual document content.

**Retrieval vs. generation separation** — The retrieval step (finding relevant chunks) and generation step (producing an answer) are cleanly decoupled. This makes it easy to swap embedding models or LLMs independently.

---

## Running Locally

**Prerequisites:** Python 3.11+, Node.js 18+, PostgreSQL

```bash
# Clone the repo
git clone https://github.com/alekhyap004/AI-Document-Intelligence
cd AI-Document-Intelligence

# Backend setup
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Environment variables
cp .env.example .env
# Add your ANTHROPIC_API_KEY and DATABASE_URL

# Initialize database
python -m src.backend.init_db

# Start backend
uvicorn src.backend.main:app --reload

# Frontend setup (new terminal)
cd frontend
npm install
npm run dev
```

---

## Project Structure


AI-Document-Intelligence/
├── src/
│   └── backend/
│       ├── main.py          # FastAPI app + all endpoints
│       ├── ingest.py        # PDF parsing + vector indexing
│       ├── query.py         # RAG querying + Claude synthesis
│       ├── database.py      # SQLAlchemy connection
│       ├── models.py        # DB models (Conversation, Message, Document)
│       └── init_db.py       # Table creation
├── frontend/
│   └── src/
│       ├── App.jsx
│       └── components/
│           ├── Sidebar.jsx
│           └── ChatWindow.jsx
├── requirements.txt
├── Procfile
└── railway.json


---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Health check |
| POST | `/upload` | Upload and index a PDF |
| POST | `/conversations` | Create a new conversation |
| GET | `/conversations` | List all conversations |
| GET | `/conversations/{id}` | Get conversation with messages |
| POST | `/conversations/{id}/chat` | Chat with documents |
| POST | `/summarize` | Summarize a document |
| POST | `/extract` | Extract structured data |

---

## What I Learned

This project was built to understand RAG at an implementation level — not just use a pre-built wrapper. The main technical challenges were:

- Understanding why embedding quality matters and how different models trade off size vs. performance
- Managing deployment constraints (image size, CPU vs. GPU torch builds) that don't come up in local development
- Designing conversation isolation so multiple chats with different documents don't bleed into each other
- The difference between retrieval failures (wrong chunks) and generation failures (wrong synthesis) when debugging bad answers
