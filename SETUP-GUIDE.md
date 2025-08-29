# 🚀 Quick Setup Guide - Only Explore Embeddings

## ✅ What's Been Implemented

The **Embeddings** branch now includes a complete semantic search system:

### 📁 Project Structure
```
Only-Explore/
├── src/
│   ├── lib/embeddings.ts          # Core embeddings & search logic
│   ├── server.ts                  # Express.js API server
│   └── scripts/
│       ├── example.ts             # Example usage
│       ├── seed.ts                # Database seeding
│       └── test-setup.ts          # Setup verification
├── migrations/
│   └── 01_create_travel_docs_table.sql  # Database schema
├── package.json                   # Dependencies & scripts
├── tsconfig.json                  # TypeScript config
├── .gitignore                     # Git ignore rules
└── README-EMBEDDINGS.md           # Comprehensive documentation
```

### 🎯 Key Features
- ✅ **Gemini Embeddings**: text-embedding-004 model integration
- ✅ **Vector Database**: PostgreSQL with pgvector extension
- ✅ **Semantic Search**: Cosine similarity with normalized vectors
- ✅ **REST API**: Express.js server with search endpoints
- ✅ **Sample Data**: 5 diverse travel documents pre-loaded
- ✅ **TypeScript**: Full type safety and modern ES modules

## 🛠️ Next Steps to Get Running

### 1. Environment Setup
Create a `.env` file in the root directory:
```bash
GEMINI_API_KEY=your_gemini_api_key_here
DATABASE_URL=your_supabase_postgres_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key
PORT=4000
```

### 2. Database Setup
1. Go to your Supabase project SQL editor
2. Copy and paste the contents of `migrations/01_create_travel_docs_table.sql`
3. Run the migration to create the vector-enabled table

### 3. Seed the Database
```bash
npm run seed
```

### 4. Start the Server
```bash
npm run dev
```

### 5. Test the API
```bash
curl "http://localhost:4000/api/search?q=beach%20vacation&limit=3"
```

## 🧪 Test Your Setup

Run the setup verification:
```bash
npx tsx src/scripts/test-setup.ts
```

## 📊 Sample Queries to Try

- `"tropical beach vacation"` → Bali beaches
- `"European city cultural trip"` → Paris itinerary  
- `"Asian food experience"` → Tokyo food adventure
- `"wildlife safari adventure"` → Kenya safari
- `"romantic getaway"` → Paris itinerary
- `"city landmarks and museums"` → NYC attractions

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run seed` - Seed database with sample data

## 📚 Documentation

- **README-EMBEDDINGS.md** - Comprehensive implementation guide
- **SETUP-GUIDE.md** - This quick setup guide
- **migrations/01_create_travel_docs_table.sql** - Database schema

## 🎉 Ready to Explore!

Your semantic search system is now ready to understand travel intent and provide intelligent recommendations. The system can understand that "beach vacation" relates to "tropical getaway" even without shared keywords!

---

**Only Explore** - Making travel discovery intelligent with AI! 🌍✨
