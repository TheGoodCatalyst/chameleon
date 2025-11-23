# RAG Knowledge Base Example

A complete example demonstrating integration between the Chameleon Framework and a RAG (Retrieval Augmented Generation) MCP server for knowledge base search and retrieval.

## 🎯 Overview

This example showcases:
- **Beautiful Glassmorphism UI**: Search interface with modern glass effects
- **RAG Implementation**: Document retrieval with relevance scoring
- **MCP Integration**: Server returns Chameleon ViewContent components
- **Real-time Results**: Search results displayed as interactive cards
- **Category Filtering**: Browse documents by topic
- **Recent Updates**: Track latest additions to the knowledge base

## 📁 Files

- `index.html` - Client interface with search UI and Chameleon renderer
- `server.py` - MCP server with RAG capabilities (simplified demo)
- `README.md` - This file

## 🚀 Quick Start

### Option 1: Client Only (Demo Mode)

The HTML client works standalone with in-browser search simulation:

```bash
# Navigate to the example directory
cd examples/rag-knowledge-base

# Start a local server (choose one):
python -m http.server 8000
# or
npx http-server -p 8000

# Open in browser
open http://localhost:8000/index.html
```

The client includes 8 sample documents and performs keyword-based search entirely in the browser.

### Option 2: With MCP Server

To test the Python MCP server:

```bash
# Run the server demo
python server.py
```

This will run test queries and show how the server formats responses as Chameleon components.

**Note**: Full MCP WebSocket integration requires the MCP SDK. The server.py demonstrates the core RAG logic and response formatting.

## 🧠 How It Works

### Search Flow

1. **User Query**: Enter search terms in the glassmorphic search box
2. **Document Retrieval**: System searches across titles, content, and tags
3. **Relevance Scoring**: Documents ranked by keyword matching and category
4. **Response Formatting**: Results converted to Chameleon Card components
5. **UI Rendering**: Cards displayed with glassmorphism effects

### Relevance Scoring

The RAG system calculates relevance based on:
- **Title matches** (5x weight) - highest priority
- **Content matches** (2x weight) - secondary priority
- **Tag matches** (3x weight) - category alignment
- **Recency boost** - for queries about "recent" updates
- **Base relevance** - document quality multiplier

### Sample Queries

Try these searches:
- "machine learning" - AI/ML documents
- "web development" - Frontend and React docs
- "database design" - SQL and NoSQL guides
- "recent updates" - Latest additions (boosted by timestamp)

## 🎨 UI Features

### Glassmorphism Design

The interface uses modern glassmorphism with:
- Semi-transparent backgrounds (70% opacity)
- 16px backdrop blur for frosted glass effect
- Gradient borders with subtle shadows
- Smooth hover animations
- Vibrant animated background gradient

### Interactive Elements

- **Search Box**: Expands on focus with enhanced shadow
- **Query Chips**: Pre-built searches for quick exploration
- **Result Cards**: Hover to lift and reveal actions
- **Action Buttons**: View full document or find related content

## 📊 Sample Knowledge Base

The example includes 10 documents across categories:
- **AI & ML**: Machine learning, deep learning
- **Web Dev**: Best practices, React patterns
- **Databases**: Normalization, SQL vs NoSQL
- **Security**: API security guidelines
- **Architecture**: Microservices, distributed systems
- **API Design**: GraphQL, REST
- **DevOps**: Kubernetes, containers

## 🔧 Extending the Example

### Add Real Vector Search

Replace the keyword-based search with embeddings:

```python
from sentence_transformers import SentenceTransformer
import numpy as np

model = SentenceTransformer('all-MiniLM-L6-v2')

# Embed documents
doc_embeddings = model.encode([doc.content for doc in documents])

# Embed query
query_embedding = model.encode([query])[0]

# Find similar documents
similarities = np.dot(doc_embeddings, query_embedding)
top_indices = np.argsort(similarities)[::-1][:max_results]
```

### Connect to Vector Database

Integrate with Pinecone, Weaviate, or ChromaDB:

```python
import chromadb

client = chromadb.Client()
collection = client.create_collection("knowledge_base")

# Add documents
collection.add(
    documents=[doc.content for doc in documents],
    metadatas=[{"title": doc.title, "category": doc.category} for doc in documents],
    ids=[doc.id for doc in documents]
)

# Query
results = collection.query(
    query_texts=[query],
    n_results=5
)
```

### Add LLM Summarization

Use an LLM to generate context-aware summaries:

```python
from openai import OpenAI

client = OpenAI()

def summarize_results(query, documents):
    context = "\n\n".join([f"{d.title}: {d.excerpt}" for d in documents])
    
    response = client.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "Summarize these search results."},
            {"role": "user", "content": f"Query: {query}\n\nResults:\n{context}"}
        ]
    )
    
    return response.choices[0].message.content
```

## 🏗️ Architecture

```
┌─────────────────┐
│  HTML Client    │
│  - Search UI    │
│  - Chameleon    │
└────────┬────────┘
         │
         │ WebSocket (MCP)
         │
┌────────▼────────┐
│  MCP Server     │
│  - RAG Logic    │
│  - Search       │
└────────┬────────┘
         │
         │
┌────────▼────────┐
│  Vector DB      │
│  (ChromaDB,     │
│   Pinecone,     │
│   Weaviate)     │
└─────────────────┘
```

## 💡 Tips

1. **Start Simple**: The keyword matching works well for demos
2. **Add Embeddings**: For production, use semantic search with vector embeddings
3. **Cache Results**: Store frequent queries to improve performance
4. **Monitor Relevance**: Track which results users interact with
5. **A/B Test Scoring**: Experiment with different relevance weights

## 🔗 Related Examples

- [Weather Dashboard](../weather-dashboard/) - Basic MCP integration
- [Agentic Demo](../agentic-demo/) - Advanced animations
- [Advanced Demo](../advanced-demo/) - State management

## 📚 Resources

- [Chameleon Framework Docs](../../README.md)
- [MCP Protocol Spec](../../specs/README.md)
- [RAG Best Practices](https://arxiv.org/abs/2005.11401)
- [Vector Search Guide](https://www.pinecone.io/learn/vector-search/)

---

**Built with ❤️ using Chameleon Framework**
