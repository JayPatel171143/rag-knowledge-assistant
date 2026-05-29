from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings

# Sample documents
documents = [
    "Machine learning is used in AI systems",
    "Deep learning is a subset of machine learning",
    "Football is a popular sport"
]

# Load embedding model
embedding_model = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)

# Create vector database
vector_db = Chroma.from_texts(
    texts=documents,
    embedding=embedding_model,
    persist_directory="chroma_db"
)

# User query
query = "How is AI related to machine learning?"

# Search similar documents
results = vector_db.similarity_search(query, k=2)

# Print results
print("\nMost Relevant Documents:\n")

for result in results:
    print(result.page_content)