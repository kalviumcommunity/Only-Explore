// src/lib/multi-shot-prompting.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI('AIzaSyBly_i9JKks9T-G2KE_-Y9thsIYLm0mWiw');

// Multi-shot examples for different travel tasks (2-3 examples each)
export const multiShotExamples = {
  itinerary: [
    {
      input: "Plan a 2-day trip to Tokyo for culture lovers.",
      output: `Day 1: 
- Morning: Sensoji Temple in Asakusa, traditional market exploration
- Afternoon: Imperial Palace gardens, Shibuya crossing experience  
- Evening: Authentic sushi dinner in Ginza, Golden Gai nightlife

Day 2:
- Morning: Meiji Shrine, Harajuku street culture
- Afternoon: Traditional tea ceremony, Ueno museums
- Evening: Izakaya hopping in Shinjuku

Budget: $350-450 per person | Best time: Spring/Fall`
    },
    {
      input: "Plan a 3-day trip to Paris for art enthusiasts.",
      output: `Day 1:
- Morning: Louvre Museum (Mona Lisa, Venus de Milo)
- Afternoon: Seine River cruise, Notre Dame area
- Evening: Montmartre sunset, dinner in Le Marais

Day 2:
- Morning: Musée d'Orsay (Impressionist masterpieces)  
- Afternoon: Rodin Museum, Latin Quarter exploration
- Evening: Eiffel Tower illumination, champagne picnic

Day 3:
- Morning: Versailles Palace day trip
- Afternoon: Champs-Élysées shopping, Arc de Triomphe
- Evening: Seine dinner cruise, farewell at Trocadéro

Budget: $500-700 per person | Best time: May-September`
    },
    {
      input: "Plan a 4-day trip to Rome for history buffs.",
      output: `Day 1:
- Morning: Colosseum guided tour, Roman Forum exploration
- Afternoon: Palatine Hill, Capitoline Museums
- Evening: Trastevere dinner, evening stroll

Day 2:
- Morning: Vatican Museums, Sistine Chapel
- Afternoon: St. Peter's Basilica, Vatican Gardens  
- Evening: Campo de' Fiori market, rooftop dining

Day 3:
- Morning: Pantheon, Piazza Navona fountain tour
- Afternoon: Villa Borghese, Galleria Borghese
- Evening: Spanish Steps, Via del Corso shopping

Day 4:
- Morning: Day trip to Ostia Antica ruins
- Afternoon: Return to Rome, Castel Sant'Angelo
- Evening: Final dinner near Piazza di Spagna

Budget: $400-600 per person | Best time: April-June, September-October`
    }
  ],

  cuisine: [
    {
      input: "What are must-try foods in Japan?",
      output: `Traditional Dishes:
- Sushi: Fresh fish over seasoned rice (try: Jiro, Sukiyabashi)
- Ramen: Rich noodle soups (varieties: tonkotsu, miso, shoyu)
- Tempura: Lightly battered vegetables and seafood

Street Food:
- Takoyaki: Octopus balls from Osaka
- Taiyaki: Fish-shaped pastries with sweet filling
- Yakitori: Grilled chicken skewers

Regional Specialties:
- Hokkaido: Fresh crab, uni (sea urchin)
- Osaka: Okonomiyaki (savory pancakes)
- Kyoto: Kaiseki (multi-course haute cuisine)

Where: Tsukiji Market, Dotonbori (Osaka), Local izakayas`
    },
    {
      input: "What are signature dishes in Italy?",
      output: `Pasta Classics:
- Carbonara: Eggs, pecorino, guanciale (try in Rome)
- Bolognese: Rich meat sauce from Bologna
- Cacio e Pepe: Simple cheese and pepper pasta

Pizza Styles:
- Neapolitan: Thin, charred crust (Naples origin)
- Roman: Crispy, thin base with creative toppings
- Sicilian: Thick, airy crust with robust flavors

Regional Specialties:
- Tuscany: Bistecca Fiorentina, Chianti wine
- Venice: Risotto alle vongole, fresh seafood
- Sicily: Arancini, cannoli, granita

Where: Local trattorias, family-run osterias, food markets`
    },
    {
      input: "What foods should I try in Thailand?",
      output: `Iconic Dishes:
- Pad Thai: Stir-fried noodles with tamarind, shrimp
- Tom Yum Goong: Spicy lemongrass shrimp soup
- Green Curry: Coconut-based curry with Thai basil

Street Food:
- Som Tam: Spicy green papaya salad
- Mango Sticky Rice: Sweet dessert with coconut
- Satay: Grilled meat skewers with peanut sauce

Regional Varieties:
- Northern: Khao Soi (curry noodles), sai ua (sausage)
- Central: Massaman curry, boat noodles
- Southern: Fresh seafood, coconut-based dishes

Where: Chatuchak Market (Bangkok), Chiang Mai night bazaars`
    }
  ],

  budget: [
    {
      input: "Break down costs for a 5-day trip to Thailand for 2 people.",
      output: `Accommodation: $300 (boutique hotel, 4 nights)
Flights: $1,200 (round-trip from US, 2 passengers)
Food: $200 (street food + restaurants mix)
Transportation: $80 (tuk-tuks, BTS, taxis)
Activities: $150 (temples, cooking class, massage)
Shopping: $100 (souvenirs, local crafts)
Miscellaneous: $70 (tips, emergencies)

Total: $2,100 for 2 people
Per person: $1,050 | Daily average: $210 per person`
    },
    {
      input: "What's the cost breakdown for 7 days in Japan for 1 person?",
      output: `Accommodation: $420 (business hotel, 6 nights)
Flights: $800 (round-trip from major city)
Food: $350 (mix of restaurants and convenience stores)
Transportation: $200 (JR Pass, local trains)
Activities: $300 (temples, museums, experiences)
Shopping: $150 (electronics, souvenirs)
Miscellaneous: $80 (tips, phone, emergencies)

Total: $2,300 for 1 person
Daily average: $329 per person`
    },
    {
      input: "Budget breakdown for 4 days in Paris for 2 people.",
      output: `Accommodation: $480 (mid-range hotel, 3 nights)  
Flights: $1,000 (round-trip from US, 2 passengers)
Food: $400 (cafes, bistros, one fine dining)
Transportation: $60 (metro passes, occasional taxi)
Activities: $200 (museums, Seine cruise, day tours)
Shopping: $200 (fashion, souvenirs)
Miscellaneous: $60 (tips, emergencies)

Total: $2,400 for 2 people
Per person: $1,200 | Daily average: $300 per person`
    }
  ],

  culture: [
    {
      input: "What cultural experiences are unique to Japan?",
      output: `Traditional Practices:
- Tea ceremony: Meditative ritual in Kyoto temples
- Onsen bathing: Natural hot springs with strict etiquette
- Ryokan stays: Traditional inns with tatami mats

Modern Culture:
- Anime/manga: Visit Akihabara, Studio Ghibli Museum
- Kawaii culture: Harajuku fashion, character cafes
- Technology: Robot restaurants, digital art museums

Social Etiquette:
- Bowing instead of handshakes
- Removing shoes before entering homes
- Quiet behavior on public transportation
- No tipping (considered rude)`
    },
    {
      input: "What cultural aspects define Spanish lifestyle?",
      output: `Daily Rhythms:
- Siesta: Afternoon rest period (2-5 PM)
- Late dining: Lunch at 2 PM, dinner after 9 PM
- Paseo: Evening social walks in town centers

Celebrations:
- Flamenco: Passionate dance from Andalusia
- Festivals: Running of Bulls, La Tomatina, Semana Santa
- Tapas culture: Small plates shared with friends

Social Values:
- Family-centric: Multi-generational gatherings
- Relaxed pace: "Mañana" attitude toward time
- Outdoor living: Terraces, plazas, street life
- Warm hospitality: Welcoming to visitors`
    },
    {
      input: "What are essential cultural insights for India?",
      output: `Religious Diversity:
- Hindu traditions: Temple visits, festivals like Diwali
- Multiple faiths: Buddhism, Sikhism, Christianity, Islam
- Sacred practices: Removing shoes, covering heads

Social Customs:
- Namaste greeting: Palms together, slight bow
- Hierarchy respect: Elder reverence, formal address
- Hospitality: "Atithi Devo Bhava" (guest is god)

Daily Life:
- Spice-rich cuisine: Regional varieties, vegetarian options
- Colorful festivals: Holi, regional celebrations
- Bargaining culture: Markets, auto-rickshaws
- Monsoon seasons: Weather affects travel planning`
    }
  ]
};

export interface MultiShotTask {
  type: 'itinerary' | 'cuisine' | 'budget' | 'culture';
  userQuery: string;
  temperature?: number;
}

export async function performMultiShotPrompting(task: MultiShotTask): Promise<string> {
  try {
    const examples = multiShotExamples[task.type];
    
    // Build multi-shot prompt with multiple examples
    let multiShotPrompt = `You are Only Explore, an expert AI travel assistant. Follow the format and style of these examples:

`;

    // Add all examples for the task type
    examples.forEach((example, index) => {
      multiShotPrompt += `Example ${index + 1}:
Input: "${example.input}"
Output:
${example.output}

`;
    });

    multiShotPrompt += `Now answer this user question in the same detailed, structured format:
Input: "${task.userQuery}"
Output:`;

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(multiShotPrompt);
    
    return result.response.text();

  } catch (error) {
    console.error('Error in multi-shot prompting:', error);
    throw error;
  }
}

// Enhanced task detection with confidence scoring
export function detectTaskTypeWithConfidence(query: string): { type: 'itinerary' | 'cuisine' | 'budget' | 'culture', confidence: number } {
  const queryLower = query.toLowerCase();
  
  const patterns = {
    itinerary: ['plan', 'itinerary', 'days', 'trip', 'visit', 'schedule', 'agenda'],
    cuisine: ['food', 'eat', 'cuisine', 'dish', 'restaurant', 'taste', 'try', 'cooking'],
    budget: ['cost', 'budget', 'price', 'money', 'expensive', 'cheap', 'spend'],
    culture: ['culture', 'tradition', 'custom', 'experience', 'local', 'people', 'lifestyle']
  };

  let bestMatch = { type: 'itinerary' as const, confidence: 0 };

  for (const [type, keywords] of Object.entries(patterns)) {
    const matches = keywords.filter(keyword => queryLower.includes(keyword)).length;
    const confidence = matches / keywords.length;
    
    if (confidence > bestMatch.confidence) {
      bestMatch = { type: type as keyof typeof patterns, confidence };
    }
  }

  return bestMatch;
}

