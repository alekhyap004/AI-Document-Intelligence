import os
from llama_index.core import StorageContext, load_index_from_storage, Settings
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from llama_index.llms.ollama import Ollama

Settings.embed_model = HuggingFaceEmbedding(model_name="BAAI/bge-small-en-v1.5")
Settings.llm = Ollama(model="llama3.2")

INDEX_DIR = "indexes"

def query_document(doc_id: str, question: str) -> str:
    index_path = os.path.join(INDEX_DIR, doc_id)
    
    if not os.path.exists(index_path):
        return "Document not found. Please upload it first."
    
    storage_context = StorageContext.from_defaults(persist_dir=index_path)
    index = load_index_from_storage(storage_context)
    
    query_engine = index.as_query_engine()
    response = query_engine.query(question)

    return str(response)