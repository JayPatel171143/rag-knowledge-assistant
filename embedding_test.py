from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

# Load embedding model
model = SentenceTransformer('all-MiniLM-L6-v2')

# Sentences
sentences = [
    "Machine learning is amazing",
    "AI is transforming technology",
    "I love playing football"
]

# Convert into embeddings
embeddings = model.encode(sentences)

# Compare similarity
similarity = cosine_similarity([embeddings[0]], embeddings[1:])

print("Similarity Scores:")
print(similarity)