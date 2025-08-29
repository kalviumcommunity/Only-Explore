# Only Explore - Function Calling Implementation

This branch implements advanced function calling capabilities using Gemini's function calling feature, allowing the AI to execute specific travel-related functions based on user intent.

## 🚀 Features

- **Intelligent Function Detection**: AI automatically detects when to call specific functions
- **Travel-Specific Functions**: Destination search, itinerary planning, flight booking, hotel search
- **Semantic Integration**: Functions leverage the existing embeddings system
- **Natural Language Processing**: Users can speak naturally, AI extracts parameters
- **Mock API Integration**: Ready for real API integration (flights, hotels)

## 🔧 Available Functions

### 1. `searchDestinations`
Searches for travel destinations using semantic search with optional filters.

**Parameters:**
- `query` (required): Search query for destinations
- `region` (optional): Preferred region
- `budget` (optional): Budget range
- `limit` (optional): Number of results (default: 5)

**Example Usage:**
```
"Find me tropical beach destinations in Southeast Asia under $1000"
```

### 2. `planItinerary`
Creates a detailed travel itinerary for a specific destination.

**Parameters:**
- `destination` (required): Destination city or country
- `days` (required): Number of days for the trip
- `budget` (optional): Total budget in USD
- `interests` (optional): Array of interests (culture, food, adventure, etc.)

**Example Usage:**
```
"Plan a 7-day trip to Italy focusing on art, food, and history with $3000 budget"
```

### 3. `findFlights`
Searches for flights between cities (currently mock data).

**Parameters:**
- `from` (required): Departure city
- `to` (required): Destination city
- `date` (required): Departure date (YYYY-MM-DD)
- `passengers` (optional): Number of passengers (default: 1)

**Example Usage:**
```
"Find flights from London to Tokyo on 2025-12-25 for 2 passengers"
```

### 4. `findHotels`
Searches for hotels in a specific city (currently mock data).

**Parameters:**
- `city` (required): City name
- `checkIn` (required): Check-in date (YYYY-MM-DD)
- `checkOut` (required): Check-out date (YYYY-MM-DD)
- `budget` (optional): Maximum price per night in USD
- `guests` (optional): Number of guests (default: 2)

**Example Usage:**
```
"Find hotels in Bangkok for check-in 2025-11-10 and check-out 2025-11-15 under $100 per night"
```

## 🛠️ Setup

### Prerequisites
- Step 1 (README) completed
- Step 2 (Embeddings) completed
- Gemini API key with function calling access

### Environment Variables
Add to your `.env` file:
```bash
GEMINI_API_KEY=your_gemini_api_key_here
DATABASE_URL=your_supabase_postgres_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key
PORT=4000
```

### Installation
```bash
npm install
npm run seed  # Seed the database with sample data
npm run dev   # Start the development server
```

## 🎯 API Endpoints

### Chat with Function Calling
```bash
POST /api/chat
Content-Type: application/json

{
  "message": "Find me beach destinations in Thailand",
  "sessionId": "optional-session-id"
}
```

**Response:**
```json
{
  "sessionId": "default",
  "response": {
    "type": "function_call",
    "functionCalls": [
      {
        "name": "searchDestinations",
        "args": {
          "query": "beach destinations in Thailand",
          "region": "Thailand"
        },
        "result": {
          "query": "beach destinations in Thailand",
          "results": [...]
        }
      }
    ],
    "finalResponse": "I found some great beach destinations in Thailand..."
  },
  "timestamp": "2025-01-29T10:30:00.000Z"
}
```

### Test Function Calling
```bash
GET /api/chat/test
```

Tests all function calling scenarios and returns results.

### Health Check
```bash
GET /health
```

Returns server status and available features.

## 🧪 Testing

### Test Function Calling
```bash
npm run test-functions
```

### Test API Endpoints
```bash
# Test chat endpoint
curl -X POST http://localhost:4000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Find me beach destinations in Thailand"}'

# Test function calling
curl http://localhost:4000/api/chat/test
```

## 🔍 How It Works

### 1. Function Definition
Functions are defined with clear schemas including:
- Function name and description
- Parameter types and requirements
- Default values where applicable

### 2. Intent Detection
When a user sends a message:
1. Gemini analyzes the message for intent
2. Determines if any functions should be called
3. Extracts parameters from natural language
4. Returns structured function calls

### 3. Function Execution
The system:
1. Validates function parameters
2. Executes the appropriate function
3. Returns results to Gemini
4. Generates natural language response

### 4. Response Generation
Gemini receives function results and generates a conversational response explaining the results.

## 📊 Example Conversations

### Destination Search
**User:** "I want to find tropical beach destinations in Asia under $1000 budget"

**AI Response:**
```
I found some excellent tropical beach destinations in Asia that fit your budget:

1. **Bali, Indonesia** - Known for stunning beaches like Seminyak and Nusa Dua, ancient temples, and rich Balinese culture. Perfect for beach lovers and cultural experiences.

2. **Tokyo, Japan** - While not primarily a beach destination, offers incredible food experiences and can be combined with nearby beach trips.

These destinations offer great value for your $1000 budget, with affordable accommodations and activities.
```

### Itinerary Planning
**User:** "Plan a 5-day trip to Tokyo with a budget of $2000"

**AI Response:**
```
Here's your 5-day Tokyo itinerary with a $2000 budget ($400/day):

**Day 1:** Arrive and explore Shibuya, visit the famous crossing and shopping district
**Day 2:** Visit Tsukiji Outer Market for fresh sushi, then explore Harajuku
**Day 3:** Experience Shinjuku's yakitori alleys and nightlife
**Day 4:** Visit high-end tempura restaurants in Ginza
**Day 5:** Explore traditional markets and depart

**Budget Breakdown:**
- Daily budget: $400
- Accommodation: ~$150/night
- Food: ~$100/day
- Activities: ~$50/day
- Transportation: ~$20/day

**Must-try foods:** Conveyor belt sushi, takoyaki, taiyaki, authentic wagyu
```

## 🏗️ Architecture

```
User Message → Gemini Analysis → Function Detection → Parameter Extraction
                                                           ↓
Function Execution ← Semantic Search ← Database ← Embeddings
                                                           ↓
Results → Gemini → Natural Language Response → User
```

## 🔄 Integration Points

### Current Integrations
- **Semantic Search**: Uses existing embeddings system
- **Mock APIs**: Flight and hotel search (ready for real APIs)
- **Express.js**: RESTful API endpoints

### Future Integrations
- **Real Flight APIs**: Skyscanner, Amadeus, or similar
- **Real Hotel APIs**: Booking.com, Hotels.com, or similar
- **Payment Processing**: Stripe, PayPal for bookings
- **Email Notifications**: SendGrid, Mailgun for confirmations

## 🚀 Production Considerations

### Security
- Validate all function parameters
- Implement rate limiting
- Add authentication for sensitive operations
- Sanitize user inputs

### Performance
- Cache frequent function calls
- Implement request queuing
- Monitor API response times
- Add circuit breakers for external APIs

### Scalability
- Use message queues for heavy operations
- Implement horizontal scaling
- Add database connection pooling
- Monitor resource usage

## 📝 Development

### Adding New Functions
1. Define function schema in `travelFunctions` array
2. Implement function in `functionImplementations` object
3. Add tests in `test-functions.ts`
4. Update documentation

### Example New Function
```typescript
{
  name: 'bookActivity',
  description: 'Book travel activities and tours',
  parameters: {
    type: 'object',
    properties: {
      destination: { type: 'string', description: 'Destination city' },
      activity: { type: 'string', description: 'Activity type' },
      date: { type: 'string', description: 'Activity date' },
      participants: { type: 'number', description: 'Number of participants' }
    },
    required: ['destination', 'activity', 'date']
  }
}
```

## 🤝 Contributing

1. Create feature branch from `Function-calling`
2. Add tests for new functionality
3. Update documentation
4. Submit pull request

## 📚 Resources

- [Gemini Function Calling](https://ai.google.dev/docs/function_calling)
- [Express.js Routing](https://expressjs.com/en/guide/routing.html)
- [TypeScript Function Types](https://www.typescriptlang.org/docs/handbook/functions.html)

---

**Only Explore** - Making travel planning intelligent with AI function calling! 🌍✨
