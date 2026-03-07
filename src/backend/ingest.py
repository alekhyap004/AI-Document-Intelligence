import os
import shutil
import uuid
from llama_index.core import SimpleDirectoryReader, VectorStoreIndex, Settings
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from llama_index.llms.ollama import Ollama

Settings.embed_model = HuggingFaceEmbedding(model_name="BAAI/bge-small-en-v1.5")
Settings.llm = Ollama(model="llama3.2")

UPLOAD_DIR = "uploads"
INDEX_DIR = "indexes"

def save_pdf(file_path: str, filename: str) -> str:
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    
    doc_id = str(uuid.uuid4())
    doc_dir = os.path.join(UPLOAD_DIR, doc_id)
    os.makedirs(doc_dir, exist_ok=True)
    destination = os.path.join(doc_dir, filename)
    shutil.copy(file_path, destination)

    return doc_id

def build_index(doc_id: str) -> None:
    doc_dir = os.path.join(UPLOAD_DIR, doc_id)
    documents = SimpleDirectoryReader(doc_dir).load_data()
    index = VectorStoreIndex.from_documents(documents)
    index_path = os.path.join(INDEX_DIR, doc_id)
    index.storage_context.persist(persist_dir=index_path)
    
    print(f"Index built and saved for doc_id: {doc_id}")