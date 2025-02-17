import chromadb
from chromadb.config import Settings

client = chromadb.Client(Settings(
    chroma_db_impl="duckdb+parquet",
    persist_directory="./data"
))

collection = client.get_or_create_collection(name="call_docs")
print("Collection 'call_docs' is ready!")
