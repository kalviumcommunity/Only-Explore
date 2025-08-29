# Only Explore - Embeddings & Semantic Search

This branch implements advanced semantic search capabilities using Gemini embeddings with Supabase Postgres and pgvector.

## 🚀 Features

- **Semantic Search**: Understands travel intent beyond keyword matching
- **Gemini Embeddings**: Uses Google's text-embedding-004 model for high-quality vector representations
- **Vector Database**: PostgreSQL with pgvector extension for efficient similarity search
- **Cosine Similarity**: Normalized vector comparison for accurate results
- **REST API**: Clean Express.js endpoints for search operations

## 📋 Prerequisites

1. **Supabase Account**: Set up a Supabase project with PostgreSQL
2. **Gemini API Key**: Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
3. **Node.js**: Version 18+ with npm

## 🛠️ Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Create a `.env` file in the root directory:

```bash
GEMINI_API_KEY=your_gemini_api_key_here
DATABASE_URL=your_supabase_postgres_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key
PORT=4000
```

### 3. Database Setup

Run the SQL migration in your Supabase SQL editor:

```sql
-- Copy and paste the contents of migrations/01_create_travel_docs_table.sql
```

This creates:
- `travel_docs` table with vector embeddings
- IVFFlat index for fast similarity search
- RPC function for semantic search

### 4. Seed the Database

```bash
npm run seed
```

This populates the database with 5 sample travel documents covering:
- Bali beaches and culture
- Paris romantic itinerary
- Tokyo food adventure
- NYC attractions
- Kenya safari experience

## 🎯 Usage

### Start Development Server

```bash
npm run dev
```

The server runs on `http://localhost:4000`

### API Endpoints

#### Search Travel Documents
```bash
GET /api/search?q=beach vacation&limit=3
```

**Response:**
```json
{
  "query": "beach vacation",
  "results": [
    {
      "id": 1,
      "title": "Explore Bali: Temples, Beaches & Culture",
      "content": "Bali offers stunning beaches like Seminyak and Nusa Dua...",
      "metadata": {
        "region": "Indonesia",
        "type": "destination",
        "keywords": ["beaches", "temples", "culture", "volcano"]
      },
      "similarity": 0.8432
    }
  ],
  "count": 1
}
```

#### Seed Database
```bash
POST /api/seed
```

#### Health Check
```bash
GET /health
```

### Example Queries

Try these semantic search queries:

- `"tropical beach vacation"` → Bali beaches
- `"European city cultural trip"` → Paris itinerary
- `"Asian food experience"` → Tokyo food adventure
- `"wildlife safari adventure"` → Kenya safari
- `"romantic getaway"` → Paris itinerary
- `"city landmarks and museums"` → NYC attractions

## 🔧 How It Works

### 1. Embedding Generation
- Uses Gemini's `text-embedding-004` model
- Converts text to 768-dimensional vectors
- Normalizes vectors for cosine similarity

### 2. Vector Storage
- Stores embeddings in PostgreSQL with pgvector
- Uses IVFFlat index for fast approximate search
- Supports up to 768-dimensional vectors

### 3. Semantic Search
- Converts user query to embedding
- Finds similar documents using cosine distance
- Returns ranked results with similarity scores

### 4. Cosine Similarity
- Measures angle between vectors
- Range: 0 (unrelated) to 1 (identical)
- Normalized for fair comparison

## 📊 Sample Data

The system comes pre-loaded with 5 diverse travel documents:

1. **Bali**: Beaches, temples, culture, volcanoes
2. **Paris**: 5-day romantic itinerary
3. **Tokyo**: Food adventure from sushi to street food
4. **NYC**: Must-see attractions and landmarks
5. **Kenya**: Wildlife safari and Great Migration

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Query    │───▶│  Gemini API     │───▶│ 768-dim Vector  │
└─────────────────┘    │ (Embeddings)    │    └─────────────────┘
                       └─────────────────┘              │
                                                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Search Results │◀───│  pgvector       │◀───│ Cosine Similarity│
│  (Ranked)       │    │ (PostgreSQL)    │    │ Search          │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔍 Why Semantic Search?

**Traditional keyword search** would miss connections like:
- "beach vacation" vs "tropical getaway"
- "European culture" vs "Paris museums"
- "wildlife adventure" vs "safari experience"

**Semantic search** understands:
- Context and meaning
- Related concepts
- Travel intent
- Nuanced preferences

## 🚀 Production Considerations

1. **Rate Limiting**: Implement API rate limiting
2. **Caching**: Cache frequent queries
3. **Monitoring**: Track search performance
4. **Scaling**: Consider vector database scaling
5. **Security**: Validate and sanitize inputs

## 📝 Development

### Build for Production
```bash
npm run build
npm start
```

### Run Example Script
```bash
npx tsx src/scripts/example.ts
```

### Add New Documents
Extend the `seedTravelDocs()` function in `src/lib/embeddings.ts`

## 🤝 Contributing

1. Create feature branch from `Embeddings`
2. Add tests for new functionality
3. Update documentation
4. Submit pull request

## 📚 Resources

- [Gemini API Documentation](https://ai.google.dev/docs)
- [pgvector Documentation](https://github.com/pgvector/pgvector)
- [Supabase Vector Search](https://supabase.com/docs/guides/ai/vector-search)
- [Cosine Similarity](https://en.wikipedia.org/wiki/Cosine_similarity)

---

**Only Explore** - Making travel discovery intelligent with AI-powered semantic search! 🌍✨
