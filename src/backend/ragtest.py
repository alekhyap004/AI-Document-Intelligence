from llama_index.core import VectorStoreIndex, SimpleDirectoryReader, Settings
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from llama_index.llms.ollama import Ollama

# Local embedding model
Settings.embed_model = HuggingFaceEmbedding(model_name="BAAI/bge-small-en-v1.5")

# Local LLM
Settings.llm = Ollama(model="llama3.2")

# Load PDF
documents = SimpleDirectoryReader("data").load_data()

# Build index
index = VectorStoreIndex.from_documents(documents)

# Ask a question
query_engine = index.as_query_engine()
response = query_engine.query("Give me a 5 sentence summary about the document")
print(response)