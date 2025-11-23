#!/usr/bin/env python3
"""
RAG Knowledge Base MCP Server

This server demonstrates how to integrate Chameleon Framework with a 
Retrieval Augmented Generation (RAG) system using the MCP protocol.

Features:
- Document search with relevance scoring
- Category filtering
- Recent document retrieval
- Returns results as Chameleon ViewContent components
"""

import asyncio
import json
from datetime import datetime
from typing import List, Dict, Any
from dataclasses import dataclass, asdict

# Simple document store (in production, this would be a vector database)
@dataclass
class Document:
    id: str
    title: str
    content: str
    excerpt: str
    category: str
    tags: List[str]
    timestamp: str
    relevance: float = 1.0

# Sample knowledge base
KNOWLEDGE_BASE = [
    Document(
        id="1",
        title="Introduction to Machine Learning",
        content="Machine learning is a subset of artificial intelligence that enables systems to learn and improve from experience without being explicitly programmed. It focuses on developing computer programs that can access data and use it to learn for themselves.",
        excerpt="Machine learning is a subset of artificial intelligence that enables systems to learn and improve from experience without being explicitly programmed.",
        category="AI & ML",
        tags=["machine learning", "AI", "data science", "algorithms"],
        timestamp="2024-11-20",
        relevance=0.95
    ),
    Document(
        id="2",
        title="Deep Learning Fundamentals",
        content="Deep learning uses neural networks with multiple layers to progressively extract higher-level features from raw input data. It has revolutionized fields like computer vision, natural language processing, and speech recognition.",
        excerpt="Deep learning uses neural networks with multiple layers to progressively extract higher-level features from raw input data.",
        category="AI & ML",
        tags=["deep learning", "neural networks", "machine learning", "AI"],
        timestamp="2024-11-18",
        relevance=0.88
    ),
    Document(
        id="3",
        title="Web Development Best Practices",
        content="Modern web development emphasizes responsive design, accessibility, performance optimization, and maintainable code architecture. Key practices include component-based architecture, progressive enhancement, and continuous integration.",
        excerpt="Modern web development emphasizes responsive design, accessibility, performance optimization, and maintainable code architecture.",
        category="Web Dev",
        tags=["web development", "best practices", "frontend", "architecture"],
        timestamp="2024-11-22",
        relevance=0.92
    ),
    Document(
        id="4",
        title="React Component Patterns",
        content="Learn about common React patterns including compound components, render props, hooks, and context API for building scalable applications. These patterns help create reusable, maintainable code.",
        excerpt="Learn about common React patterns including compound components, render props, hooks, and context API for building scalable applications.",
        category="Web Dev",
        tags=["react", "javascript", "web development", "frontend", "patterns"],
        timestamp="2024-11-15",
        relevance=0.85
    ),
    Document(
        id="5",
        title="Database Normalization",
        content="Database normalization is the process of organizing data to minimize redundancy and improve data integrity through normal forms (1NF, 2NF, 3NF, BCNF). It ensures efficient storage and query performance.",
        excerpt="Database normalization is the process of organizing data to minimize redundancy and improve data integrity through normal forms.",
        category="Databases",
        tags=["database", "SQL", "data modeling", "normalization"],
        timestamp="2024-11-19",
        relevance=0.90
    ),
    Document(
        id="6",
        title="NoSQL vs SQL Databases",
        content="Compare relational SQL databases with NoSQL alternatives like MongoDB, learning when to use each based on your data structure and scalability needs. SQL excels at structured data and complex queries, while NoSQL offers flexibility and horizontal scaling.",
        excerpt="Compare relational SQL databases with NoSQL alternatives like MongoDB, learning when to use each based on your data structure and scalability needs.",
        category="Databases",
        tags=["database", "NoSQL", "SQL", "database design", "MongoDB"],
        timestamp="2024-11-21",
        relevance=0.87
    ),
    Document(
        id="7",
        title="Recent Update: API Security",
        content="New guidelines on implementing OAuth 2.0, JWT tokens, and rate limiting to secure your REST APIs against common vulnerabilities. This includes protection against SQL injection, XSS, CSRF, and DDoS attacks.",
        excerpt="New guidelines on implementing OAuth 2.0, JWT tokens, and rate limiting to secure your REST APIs against common vulnerabilities.",
        category="Security",
        tags=["security", "API", "authentication", "recent", "OAuth", "JWT"],
        timestamp="2024-11-23",
        relevance=0.93
    ),
    Document(
        id="8",
        title="Microservices Architecture",
        content="Microservices architecture decomposes applications into small, independent services that communicate through well-defined APIs. Benefits include scalability, flexibility, and easier maintenance, though it introduces complexity in deployment and monitoring.",
        excerpt="Microservices architecture decomposes applications into small, independent services that communicate through well-defined APIs.",
        category="Architecture",
        tags=["architecture", "microservices", "distributed systems", "API"],
        timestamp="2024-11-17",
        relevance=0.84
    ),
    Document(
        id="9",
        title="GraphQL vs REST",
        content="GraphQL offers a flexible alternative to REST APIs by allowing clients to request exactly the data they need. This reduces over-fetching and under-fetching issues common in REST while providing strong typing and introspection.",
        excerpt="GraphQL offers a flexible alternative to REST APIs by allowing clients to request exactly the data they need.",
        category="API Design",
        tags=["GraphQL", "REST", "API", "web development"],
        timestamp="2024-11-16",
        relevance=0.86
    ),
    Document(
        id="10",
        title="Container Orchestration with Kubernetes",
        content="Kubernetes automates deployment, scaling, and management of containerized applications. It provides features like self-healing, load balancing, service discovery, and automated rollouts and rollbacks.",
        excerpt="Kubernetes automates deployment, scaling, and management of containerized applications.",
        category="DevOps",
        tags=["kubernetes", "containers", "docker", "DevOps", "orchestration"],
        timestamp="2024-11-14",
        relevance=0.89
    ),
]


class RAGKnowledgeBase:
    """Simple RAG implementation using keyword matching"""
    
    def __init__(self):
        self.documents = KNOWLEDGE_BASE
    
    def search(self, query: str, max_results: int = 5) -> List[Document]:
        """Search documents by query"""
        query_lower = query.lower()
        terms = [t for t in query_lower.split() if len(t) > 2]
        
        # Score each document
        scored_docs = []
        for doc in self.documents:
            score = self._calculate_relevance(doc, terms, query_lower)
            if score > 0:
                # Create a copy with updated relevance score
                doc_dict = asdict(doc)
                doc_dict['relevance'] = min(score / 10, 1.0)  # Normalize to 0-1
                scored_docs.append((score, Document(**doc_dict)))
        
        # Sort by score and return top results
        scored_docs.sort(reverse=True, key=lambda x: x[0])
        return [doc for _, doc in scored_docs[:max_results]]
    
    def _calculate_relevance(self, doc: Document, terms: List[str], query: str) -> float:
        """Calculate relevance score for a document"""
        score = 0.0
        
        # Check title (highest weight)
        for term in terms:
            if term in doc.title.lower():
                score += 5.0
        
        # Check content
        for term in terms:
            if term in doc.content.lower():
                score += 2.0
        
        # Check tags
        for term in terms:
            for tag in doc.tags:
                if term in tag.lower():
                    score += 3.0
        
        # Boost recent documents if "recent" in query
        if "recent" in query and "recent" in doc.tags:
            score += 10.0
        
        # Use base relevance as multiplier
        score *= doc.relevance
        
        return score
    
    def get_by_category(self, category: str, max_results: int = 5) -> List[Document]:
        """Get documents by category"""
        return [doc for doc in self.documents if doc.category == category][:max_results]
    
    def get_recent(self, max_results: int = 5) -> List[Document]:
        """Get most recent documents"""
        sorted_docs = sorted(self.documents, key=lambda d: d.timestamp, reverse=True)
        return sorted_docs[:max_results]


def document_to_card(doc: Document) -> Dict[str, Any]:
    """Convert a Document to a Chameleon Card component"""
    return {
        "type": "component",
        "component_name": "card",
        "data": {
            "title": doc.title,
            "subtitle": f"{doc.category} • {doc.timestamp} • Relevance: {int(doc.relevance * 100)}%",
            "content": doc.excerpt,
            "actions": [
                {"id": f"view-{doc.id}", "label": "📖 View Full", "variant": "primary"},
                {"id": f"related-{doc.id}", "label": "🔗 Related", "variant": "text"},
            ]
        },
        "layer": "focus"
    }


# MCP Server Implementation (simplified - in production use the MCP SDK)
class MCPServer:
    """Simplified MCP server for demonstration"""
    
    def __init__(self):
        self.rag = RAGKnowledgeBase()
    
    async def handle_tool_call(self, tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Handle MCP tool calls"""
        
        if tool_name == "search_knowledge_base":
            query = arguments.get("query", "")
            max_results = arguments.get("max_results", 5)
            
            # Search documents
            results = self.rag.search(query, max_results)
            
            # Convert to cards
            cards = [document_to_card(doc) for doc in results]
            
            return {
                "content": cards,
                "metadata": {
                    "query": query,
                    "results_count": len(results),
                    "tool": "search_knowledge_base"
                }
            }
        
        elif tool_name == "get_recent_updates":
            max_results = arguments.get("max_results", 5)
            
            # Get recent documents
            results = self.rag.get_recent(max_results)
            
            # Convert to cards
            cards = [document_to_card(doc) for doc in results]
            
            return {
                "content": cards,
                "metadata": {
                    "results_count": len(results),
                    "tool": "get_recent_updates"
                }
            }
        
        elif tool_name == "get_by_category":
            category = arguments.get("category", "")
            max_results = arguments.get("max_results", 5)
            
            # Get documents by category
            results = self.rag.get_by_category(category, max_results)
            
            # Convert to cards
            cards = [document_to_card(doc) for doc in results]
            
            return {
                "content": cards,
                "metadata": {
                    "category": category,
                    "results_count": len(results),
                    "tool": "get_by_category"
                }
            }
        
        else:
            return {
                "error": f"Unknown tool: {tool_name}"
            }


async def main():
    """Main server entry point"""
    server = MCPServer()
    
    print("=" * 60)
    print("RAG Knowledge Base MCP Server")
    print("=" * 60)
    print("\nAvailable Tools:")
    print("  1. search_knowledge_base(query: str, max_results: int)")
    print("  2. get_recent_updates(max_results: int)")
    print("  3. get_by_category(category: str, max_results: int)")
    print("\nCategories:", set(doc.category for doc in KNOWLEDGE_BASE))
    print("\n" + "=" * 60)
    print("\nDemo Mode - Testing tools:\n")
    
    # Demo: Search
    print("Test 1: Searching for 'machine learning'")
    result = await server.handle_tool_call("search_knowledge_base", {"query": "machine learning", "max_results": 3})
    print(f"  Found {result['metadata']['results_count']} results")
    for card in result['content']:
        print(f"  - {card['data']['title']}")
    
    print("\nTest 2: Getting recent updates")
    result = await server.handle_tool_call("get_recent_updates", {"max_results": 3})
    print(f"  Found {result['metadata']['results_count']} results")
    for card in result['content']:
        print(f"  - {card['data']['title']}")
    
    print("\nTest 3: Getting 'Web Dev' category")
    result = await server.handle_tool_call("get_by_category", {"category": "Web Dev", "max_results": 5})
    print(f"  Found {result['metadata']['results_count']} results")
    for card in result['content']:
        print(f"  - {card['data']['title']}")
    
    print("\n" + "=" * 60)
    print("\nServer is ready!")
    print("In production, this would listen on ws://localhost:3000")
    print("and handle real MCP protocol messages.")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
