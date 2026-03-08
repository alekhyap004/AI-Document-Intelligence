import os
from dotenv import load_dotenv
load_dotenv()
from llama_index.core import StorageContext, load_index_from_storage, VectorStoreIndex, Settings
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from llama_index.llms.ollama import Ollama

Settings.embed_model = HuggingFaceEmbedding(model_name="BAAI/bge-small-en-v1.5")
#Settings.llm = Anthropic(model="claude-sonnet-4-20250514", api_key=os.getenv("ANTHROPIC_API_KEY"))
Settings.llm = Ollama(model="llama3.2", request_timeout=120.0)


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

def query_multiple_documents(doc_ids: list, question: str) -> str:
    from llama_index.core.query_engine import RetrieverQueryEngine
    from llama_index.core.retrievers import VectorIndexRetriever
    from llama_index.core.response_synthesizers import get_response_synthesizer

    all_nodes = []

    for doc_id in doc_ids:
        index_path = os.path.join(INDEX_DIR, doc_id)
        if not os.path.exists(index_path):
            continue
        storage_context = StorageContext.from_defaults(persist_dir=index_path)
        index = load_index_from_storage(storage_context)
        retriever = index.as_retriever(similarity_top_k=3)
        nodes = retriever.retrieve(question)
        all_nodes.extend(nodes)

    if not all_nodes:
        return "No documents found. Please upload some PDFs first."

    # Use response synthesizer directly with retrieved nodes
    synthesizer = get_response_synthesizer()
    response = synthesizer.synthesize(question, nodes=all_nodes)
    return str(response)

def summarize_document(doc_id: str) -> str:
    return query_document(
        doc_id,
        "Please provide a concise summary of this document in 3-5 sentences."
    )