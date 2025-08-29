// src/lib/function-calling-updated.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI('AIzaSyBly_i9JKks9T-G2KE_-Y9thsIYLm0mWiw');

// Example travel functions (your business logic)
const functions = {
  searchHotels: (city: string) => {
    return [
      { name: "Grand Palace Hotel", price: "$120/night", rating: 4.5, location: "City Center" },
      { name: "Beachside Resort", price: "$90/night", rating: 4.2, location: "Near Beach" },
      { name: "Budget Inn", price: "$45/night", rating: 3.8, location: "Airport Area" }
    ];
  },
  
  getLocalCuisine: (city: string) => {
    const cuisineMap: { [key: string]: string[] } = {
      "bali": ["Street food: Satay, Nasi Goreng", "Fine dining: Bebek Betutu, Seafood BBQ"],
      "tokyo": ["Sushi, Ramen", "Tempura, Wagyu Beef"],
      "paris": ["Croissants, French Onion Soup", "Escargot, Coq au Vin"],
      "default": ["Local street food", "Traditional restaurant dishes"]
    };
    
    const cityLower = city.toLowerCase();
    return cuisineMap[cityLower] || cuisineMap["default"];
  },

  findFlights: (from: string, to: string, date: string) => {
    return [
      { airline: "Air Asia", price: "$299", departure: "09:00", arrival: "14:30", duration: "5h 30m" },
      { airline: "Emirates", price: "$599", departure: "15:45", arrival: "08:15+1", duration: "16h 30m", stops: 1 },
      { airline: "Budget Air", price: "$199", departure: "23:50", arrival: "06:20+1", duration: "6h 30m" }
    ];
  }
};

// Function definitions for Gemini
const functionDeclarations = [
  {
    name: "searchHotels",
    description: "Get hotel recommendations in a specific city",
    parameters: {
      type: "object",
      properties: {
        city: { 
          type: "string", 
          description: "City name to search hotels in" 
        }
      },
      required: ["city"]
    }
  },
  {
    name: "getLocalCuisine", 
    description: "Get famous cuisine and food recommendations for a city",
    parameters: {
      type: "object",
      properties: {
        city: { 
          type: "string", 
          description: "City name to get cuisine information for" 
        }
      },
      required: ["city"]
    }
  },
  {
    name: "findFlights",
    description: "Search for flights between two cities on a specific date",
    parameters: {
      type: "object", 
      properties: {
        from: { type: "string", description: "Departure city" },
        to: { type: "string", description: "Destination city" },
        date: { type: "string", description: "Travel date in YYYY-MM-DD format" }
      },
      required: ["from", "to", "date"]
    }
  }
];

export async function processFunctionCallingChat(message: string) {
  try {
    // Step 1: Initialize model with function calling capability
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      tools: [{ functionDeclarations }]
    });

    const chat = model.startChat();
    
    // Step 2: Send user message with function definitions
    const result = await chat.sendMessage(message);
    const response = result.response;
    
    // Step 3: Check if AI wants to call a function
    const functionCalls = response.functionCalls();
    
    if (!functionCalls || functionCalls.length === 0) {
      // No function call - return regular text response
      return {
        type: 'text',
        content: response.text(),
        timestamp: new Date().toISOString()
      };
    }

    // Step 4: Execute the function call
    const functionCall = functionCalls[0];
    const functionName = functionCall.name;
    const functionArgs = functionCall.args;
    
    console.log(`🔧 Function called: ${functionName}`);
    console.log(`📝 Arguments:`, functionArgs);

    let functionResult;
    
    // Execute the appropriate function
    switch (functionName) {
      case 'searchHotels':
        functionResult = functions.searchHotels(functionArgs.city);
        break;
      case 'getLocalCuisine':
        functionResult = functions.getLocalCuisine(functionArgs.city);
        break;
      case 'findFlights':
        functionResult = functions.findFlights(functionArgs.from, functionArgs.to, functionArgs.date);
        break;
      default:
        functionResult = { error: `Function ${functionName} not implemented` };
    }

    // Step 5: Send function result back to AI for natural language response
    const finalResult = await chat.sendMessage([{
      functionResponse: {
        name: functionName,
        response: {
          content: functionResult
        }
      }
    }]);

    return {
      type: 'function_call',
      functionName,
      functionArgs,
      functionResult,
      finalResponse: finalResult.response.text(),
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('Error in function calling chat:', error);
    return {
      type: 'error',
      content: 'Sorry, I encountered an error processing your request.',
      timestamp: new Date().toISOString()
    };
  }
}
