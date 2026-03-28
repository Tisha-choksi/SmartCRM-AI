# backend/services/embedder.py
from langchain_community.embeddings import SentenceTransformerEmbeddings
from langchain_chroma import Chroma

CHROMA_PATH = "chroma_db"

def get_embeddings():
    return SentenceTransformerEmbeddings(
        model_name="all-MiniLM-L6-v2"
    )

def get_vectorstore(collection_name: str):
    return Chroma(
        collection_name=collection_name,
        embedding_function=get_embeddings(),
        persist_directory=CHROMA_PATH
    )

def add_documents(collection_name: str, chunks: list, metadata: dict):
    store = get_vectorstore(collection_name)
    metadatas = [metadata for _ in chunks]
    store.add_texts(texts=chunks, metadatas=metadatas)

def search_documents(collection_name: str, query: str, k: int = 4):
    store = get_vectorstore(collection_name)
    return store.similarity_search(query, k=k)