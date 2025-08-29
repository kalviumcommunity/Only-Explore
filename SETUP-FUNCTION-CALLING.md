# 🚀 Quick Setup Guide - Function Calling

## ✅ What's Been Implemented

The **Function-calling** branch now includes a complete AI function calling system:

### 📁 New Project Structure
```
Only-Explore/
├── src/
│   ├── lib/
│   │   ├── embeddings.ts          # Semantic search (from Step 2)
│   │   └── function-calling.ts    # NEW: Function calling system
│   ├── routes/
│   │   └── chat.ts                # NEW: Chat API endpoints
│   ├── server.ts                  # Updated with chat routes
│   └── scripts/
│       ├── test-setup.ts          # Setup verification
│       ├── test-functions.ts      # NEW: Function calling tests
│       ├── seed.ts                # Database seeding
│       └── example.ts             # Semantic search examples
├── migrations/
│   └── 01_create_travel_docs_table.sql
├── package.json                   # Updated with new scripts
├── tsconfig.json
├── .gitignore
├── README-EMBEDDINGS.md           # Step 2 documentation
├── README-FUNCTION-CALLING.md     # NEW: Function calling docs
└── SETUP-FUNCTION-CALLING.md      # This guide
```

### 🎯 New Features
- ✅ **4 Travel Functions**: searchDestinations, planItinerary, findFlights, findHotels
- ✅ **AI Intent Detection**: Automatically detects when to call functions
- ✅ **Natural Language Processing**: Extracts parameters from user messages
- ✅ **Semantic Integration**: Functions use existing embeddings system
- ✅ **Mock APIs**: Ready for real flight/hotel API integration
- ✅ **RESTful API**: Clean chat endpoints with function calling

## 🛠️ Quick Setup

### 1. Environment Setup
Ensure your `.env` file has:
```bash
GEMINI_API_KEY=your_gemini_api_key_here
DATABASE_URL=your_supabase_postgres_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key
PORT=4000
```

### 2. Install & Start
```bash
npm install
npm run seed    # Seed database with sample data
npm run dev     # Start development server
```

### 3. Test Function Calling
```bash
# Test all function calling scenarios
npm run test-functions

# Test API endpoints
curl http://localhost:4000/api/chat/test
```

## 🎯 Available Functions

### 1. **searchDestinations**
```
"Find me tropical beach destinations in Asia under $1000"
```
- Uses semantic search with embeddings
- Filters by region and budget
- Returns ranked results

### 2. **planItinerary**
```
"Plan a 7-day trip to Italy focusing on art, food, and history with $3000 budget"
```
- Creates detailed day-by-day itinerary
- Calculates budget breakdown
- Integrates with semantic search for destination info

### 3. **findFlights**
```
"Find flights from London to Tokyo on 2025-12-25 for 2 passengers"
```
- Mock flight search (ready for real API)
- Returns flight options with prices
- Handles multiple passengers

### 4. **findHotels**
```
"Find hotels in Bangkok for check-in 2025-11-10 and check-out 2025-11-15 under $100 per night"
```
- Mock hotel search (ready for real API)
- Filters by budget and dates
- Returns hotel options with amenities

## 🧪 Testing Examples

### Test Function Calling
```bash
npm run test-functions
```

This tests 5 scenarios:
1. Destination search with budget constraints
2. Multi-day itinerary planning
3. Flight booking with specific dates
4. Hotel search with date range
5. General travel queries (text response)

### Test API Endpoints
```bash
# Test chat endpoint
curl -X POST http://localhost:4000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Find me beach destinations in Thailand"}'

# Test all functions
curl http://localhost:4000/api/chat/test
```

## 📊 API Endpoints

### Chat with Function Calling
- **POST** `/api/chat` - Process user messages with function calling
- **GET** `/api/chat/test` - Test all function calling scenarios

### Existing Endpoints (from Step 2)
- **GET** `/api/search?q=query&limit=5` - Semantic search
- **POST** `/api/seed` - Seed database
- **GET** `/health` - Health check with features list

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run seed` - Seed database with sample data
- `npm run test` - Test setup and dependencies
- `npm run test-functions` - Test function calling scenarios

## 🎉 What You Can Do Now

### Natural Language Travel Planning
Users can now say things like:
- "I want to find tropical beach destinations in Asia under $1000"
- "Plan a 5-day trip to Tokyo with a budget of $2000"
- "Find flights from New York to Paris on December 15th"
- "Show me hotels in Rome under $150 per night"

### AI-Powered Responses
The AI will:
1. **Detect Intent**: Understand what the user wants
2. **Extract Parameters**: Pull out dates, budgets, destinations
3. **Call Functions**: Execute the appropriate travel function
4. **Generate Response**: Provide natural language explanation of results

## 🚀 Next Steps

### For Production
1. **Integrate Real APIs**: Replace mock data with real flight/hotel APIs
2. **Add Authentication**: Secure sensitive operations
3. **Implement Caching**: Cache frequent function calls
4. **Add Rate Limiting**: Protect against abuse

### For Development
1. **Add More Functions**: Activity booking, weather info, etc.
2. **Enhance UI**: Create a chat interface
3. **Add Analytics**: Track function usage and performance
4. **Improve Error Handling**: Better error messages and recovery

## 📚 Documentation

- **README-FUNCTION-CALLING.md** - Comprehensive implementation guide
- **SETUP-FUNCTION-CALLING.md** - This quick setup guide
- **src/lib/function-calling.ts** - Core function calling logic
- **src/routes/chat.ts** - API endpoints

## 🎯 Example Output

When a user asks: *"Find me beach destinations in Asia under $1000"*

The system responds:
```
I found some excellent tropical beach destinations in Asia that fit your budget:

1. **Bali, Indonesia** - Known for stunning beaches like Seminyak and Nusa Dua, ancient temples, and rich Balinese culture. Perfect for beach lovers and cultural experiences.

2. **Tokyo, Japan** - While not primarily a beach destination, offers incredible food experiences and can be combined with nearby beach trips.

These destinations offer great value for your $1000 budget, with affordable accommodations and activities.
```

---

**Only Explore** - Making travel planning intelligent with AI function calling! 🌍✨
