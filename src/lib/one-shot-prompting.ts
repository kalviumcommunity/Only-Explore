// src/lib/one-shot-prompting.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI('AIzaSyBly_i9JKks9T-G2KE_-Y9thsIYLm0mWiw');

// One-shot examples for different travel tasks
export const oneShotExamples = {
  itinerary: {
    input: "Plan a 2-day trip to Tokyo for culture and food lovers.",
    output: `Day 1: 
- Morning: Visit Sensoji Temple in Asakusa, explore traditional markets
- Afternoon: Shibuya crossing, try authentic sushi at Jiro's
- Evening: Golden Gai district for local bars and yakitori

Day 2:
- Morning: Tsukiji Outer Market for fresh seafood breakfast  
- Afternoon: Meiji Shrine, Harajuku street fashion
- Evening: Ginza for high-end shopping and tempura dinner

Budget: $300-400 per person | Best season: Spring/Fall`
  },

  cuisine: {
    input: "What are must-try foods in Thailand?",
    output: `Street Food:
- Pad Thai: Stir-fried noodles with shrimp/chicken
- Som Tam: Spicy green papaya salad
- Mango Sticky Rice: Sweet dessert with coconut milk

Regional Specialties:
- Tom Yum Goong: Spicy shrimp soup
- Massaman Curry: Rich, Persian-influenced curry
- Khao Soi: Northern Thai curry noodles

Where to try: Chatuchak Market (Bangkok), Sunday Walking Street (Chiang Mai)`
  },

  budget: {
    input: "Break down costs for a 5-day trip to Bali for 2 people.",
    output: `Accommodation: $200 (4 nights boutique hotel)
Flights: $800 (round-trip from major city)
Food: $150 (mix of local warungs and restaurants)  
Transportation: $100 (scooter rental + airport transfers)
Activities: $200 (temples, volcano tour, cooking class)
Miscellaneous: $50 (souvenirs, tips)

Total: $1,500 for 2 people | $375 per person per day`
  },

  culture: {
    input: "What cultural experiences should I have in Japan?",
    output: `Traditional Experiences:
- Tea ceremony in Kyoto temple
- Stay in ryokan with onsen (hot springs)
- Attend sumo wrestling match

Modern Culture:
- Visit anime/manga cafes in Akihabara
- Experience karaoke culture 
- Try pachinko gaming parlors

Etiquette Tips:
- Bow when greeting, remove shoes indoors
- Don't tip at restaurants (considered rude)
- Quiet behavior on public transportation`
  }
};

export interface OneShotTask {
  type: 'itinerary' | 'cuisine' | 'budget' | 'culture';
  userQuery: string;
  temperature?: number;
}

export async function performOneShotPrompting(task: OneShotTask): Promise<string> {
  try {
    const example = oneShotExamples[task.type];
    
    // Build one-shot prompt with example
    const oneShotPrompt = `You are Only Explore, an expert AI travel assistant. Follow the format and style of this example:

Example:
Input: "${example.input}"
Output:
${example.output}

Now answer this user question in the same detailed, structured format:
Input: "${task.userQuery}"
Output:`;

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(oneShotPrompt);
    
    return result.response.text();

  } catch (error) {
    console.error('Error in one-shot prompting:', error);
    throw error;
  }
}

// Automatically detect task type from user query
export function detectTaskType(query: string): 'itinerary' | 'cuisine' | 'budget' | 'culture' {
  const queryLower = query.toLowerCase();
  
  if (queryLower.includes('itinerary') || queryLower.includes('plan') || queryLower.includes('days')) {
    return 'itinerary';
  } else if (queryLower.includes('food') || queryLower.includes('eat') || queryLower.includes('cuisine')) {
    return 'cuisine';
  } else if (queryLower.includes('cost') || queryLower.includes('budget') || queryLower.includes('price')) {
    return 'budget';
  } else if (queryLower.includes('culture') || queryLower.includes('tradition') || queryLower.includes('experience')) {
    return 'culture';
  } else {
    return 'itinerary'; // Default to itinerary for general travel questions
  }
}
