# backend/services/rag_chain.py
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from services.embedder import search_documents
import os

def get_llm():
    return ChatGroq(
        api_key=os.environ["GROQ_API_KEY"],
        model_name="llama-3.1-8b-instant",
        temperature=0.1
    )

def ask_question(collection_name: str, question: str) -> dict:
    docs = search_documents(collection_name, question, k=4)

    if not docs:
        return {
            "answer": "No documents found. Please upload a document first.",
            "sources": []
        }

    context = "\n\n".join([doc.page_content for doc in docs])
    sources = list(set([
        doc.metadata.get("filename", "Unknown")
        for doc in docs
    ]))

    prompt = ChatPromptTemplate.from_messages([
        ("system", """You are a helpful CRM assistant. Answer questions
based ONLY on the provided document context. If the answer is not
in the context, say "I couldn't find that in the uploaded documents."
Always be concise and factual.

Context:
{context}"""),
        ("human", "{question}")
    ])

    chain  = prompt | get_llm()
    result = chain.invoke({"context": context, "question": question})

    return {
        "answer":  result.content,
        "sources": sources
    }