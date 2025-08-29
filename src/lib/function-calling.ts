// src/lib/function-calling.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import { searchTravelDocs } from './embeddings.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Define available functions
export interface FunctionDefinition {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
}

// Travel-specific functions
export const travelFunctions: FunctionDefinition[] = [
  {
    name: 'searchDestinations',
    description: 'Search for travel destinations based on preferences',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query for destinations' },
        region: { type: 'string', description: 'Preferred region (optional)' },
        budget: { type: 'string', description: 'Budget range (optional)' },
        limit: { type: 'number', description: 'Number of results to return', default: 5 }
      },
      required: ['query']
    }
  },
  {
    name: 'planItinerary',
    description: 'Create a travel itinerary for specific destination and duration',
    parameters: {
      type: 'object',
      properties: {
        destination: { type: 'string', description: 'Destination city or country' },
        days: { type: 'number', description: 'Number of days for the trip' },
        budget: { type: 'number', description: 'Total budget in USD' },
        interests: { type: 'array', items: { type: 'string' }, description: 'Travel interests like culture, food, adventure' }
      },
      required: ['destination', 'days']
    }
  },
  {
    name: 'findFlights',
    description: 'Search for flights between cities',
    parameters: {
      type: 'object',
      properties: {
        from: { type: 'string', description: 'Departure city' },
        to: { type: 'string', description: 'Destination city' },
        date: { type: 'string', description: 'Departure date in YYYY-MM-DD format' },
        passengers: { type: 'number', description: 'Number of passengers', default: 1 }
      },
      required: ['from', 'to', 'date']
    }
  },
  {
    name: 'findHotels',
    description: 'Search for hotels in a specific city',
    parameters: {
      type: 'object',
      properties: {
        city: { type: 'string', description: 'City name' },
        checkIn: { type: 'string', description: 'Check-in date in YYYY-MM-DD format' },
        checkOut: { type: 'string', description: 'Check-out date in YYYY-MM-DD format' },
        budget: { type: 'number', description: 'Maximum price per night in USD' },
        guests: { type: 'number', description: 'Number of guests', default: 2 }
      },
      required: ['city', 'checkIn', 'checkOut']
    }
  }
];

// Function implementations
export const functionImplementations = {
  async searchDestinations(args: any) {
    const { query, region, budget, limit = 5 } = args;
    
    // Use semantic search to find relevant destinations
    const results = await searchTravelDocs(query, limit);
    
    // Filter by region if specified
    const filteredResults = region 
      ? results.filter(doc => doc.metadata?.region?.toLowerCase().includes(region.toLowerCase()))
      : results;

    return {
      query,
      results: filteredResults.map(doc => ({
        title: doc.title,
        description: doc.content.substring(0, 200) + '...',
        region: doc.metadata?.region,
        type: doc.metadata?.type,
        similarity: doc.similarity
      }))
    };
  },

  async planItinerary(args: any) {
    const { destination, days, budget, interests = [] } = args;
    
    // Search for relevant information about the destination
    const destinationInfo = await searchTravelDocs(`${destination} itinerary ${interests.join(' ')}`, 3);
    
    // Create a basic itinerary structure
    const dailyBudget = budget ? Math.floor(budget / days) : null;
    
    return {
      destination,
      days,
      totalBudget: budget,
      dailyBudget,
      interests,
      itinerary: Array.from({ length: days }, (_, i) => ({
        day: i + 1,
        suggestions: `Day ${i + 1} suggestions for ${destination}`,
        estimatedCost: dailyBudget
      })),
      relatedInfo: destinationInfo.map(doc => ({
        title: doc.title,
        content: doc.content.substring(0, 150) + '...'
      }))
    };
  },

  async findFlights(args: any) {
    const { from, to, date, passengers = 1 } = args;
    
    // Mock flight search (in production, call actual flight API)
    return {
      from,
      to,
      date,
      passengers,
      flights: [
        {
          airline: 'Sample Airways',
          departure: '09:00',
          arrival: '14:30',
          price: 299,
          duration: '5h 30m',
          stops: 0
        },
        {
          airline: 'Budget Air',
          departure: '15:45',
          arrival: '22:15',
          price: 199,
          duration: '6h 30m',
          stops: 1
        }
      ],
      searchTimestamp: new Date().toISOString(),
      note: 'Mock data - integrate with real flight API for production'
    };
  },

  async findHotels(args: any) {
    const { city, checkIn, checkOut, budget, guests = 2 } = args;
    
    // Mock hotel search (in production, call actual hotel API)
    return {
      city,
      checkIn,
      checkOut,
      guests,
      budget,
      hotels: [
        {
          name: 'Grand Plaza Hotel',
          rating: 4.5,
          pricePerNight: budget ? Math.min(budget * 0.8, 150) : 150,
          amenities: ['WiFi', 'Pool', 'Gym', 'Breakfast'],
          location: 'City Center'
        },
        {
          name: 'Budget Inn',
          rating: 3.8,
          pricePerNight: budget ? Math.min(budget * 0.5, 80) : 80,
          amenities: ['WiFi', 'Breakfast'],
          location: 'Near Airport'
        }
      ],
      searchTimestamp: new Date().toISOString(),
      note: 'Mock data - integrate with real hotel API for production'
    };
  }
};

// Main function calling orchestrator
export async function processFunctionCall(userMessage: string) {
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      tools: [{
        functionDeclarations: travelFunctions
      }]
    });

    const chat = model.startChat();
    const result = await chat.sendMessage(userMessage);
    
    const response = result.response;
    const functionCalls = response.functionCalls();

    if (!functionCalls || functionCalls.length === 0) {
      return {
        type: 'text',
        content: response.text()
      };
    }

    // Process each function call
    const functionResults = [];
    
    for (const call of functionCalls) {
      const functionName = call.name;
      const functionArgs = call.args;
      
      console.log(`🔧 Calling function: ${functionName}`);
      console.log(`📝 Arguments:`, functionArgs);

      if (functionImplementations[functionName as keyof typeof functionImplementations]) {
        const implementation = functionImplementations[functionName as keyof typeof functionImplementations];
        const result = await implementation(functionArgs);
        
        functionResults.push({
          name: functionName,
          args: functionArgs,
          result
        });
      } else {
        functionResults.push({
          name: functionName,
          args: functionArgs,
          error: `Function ${functionName} not implemented`
        });
      }
    }

    // Send function results back to model for final response
    const functionResponse = await chat.sendMessage([{
      functionResponse: {
        name: functionCalls[0].name,
        response: functionResults[0]?.result || { error: 'Function execution failed' }
      }
    }]);

    return {
      type: 'function_call',
      functionCalls: functionResults,
      finalResponse: functionResponse.response.text()
    };

  } catch (error) {
    console.error('Error in processFunctionCall:', error);
    throw error;
  }
}
