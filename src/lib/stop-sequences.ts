// src/lib/stop-sequences.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface StopSequenceConfig {
  responseType: 'itinerary' | 'list' | 'conversation' | 'budget' | 'custom';
  customStops?: string[];
  userQuery: string;
  context?: string;
  maxLength?: number;
}

// Predefined stop sequences for different travel response types
export const stopSequencePresets = {
  itinerary: {
    stops: ['EndOfDay', '\n\nNext:', 'User:', '\n---'],
    description: 'Structured day-by-day travel plans',
    useCases: ['daily itineraries', 'trip planning', 'schedule organization']
  },
  list: {
    stops: ['\n\n6.', '\n\nAdditionally', 'User:', '\n---', 'Conclusion:'],
    description: 'Clean numbered or bulleted lists',
    useCases: ['restaurant lists', 'attraction recommendations', 'packing lists']
  },
  conversation: {
    stops: ['User:', 'Human:', '\nQ:', '\nUser Question:', 'Assistant:'],
    description: 'Single-sided conversation responses',
    useCases: ['chat responses', 'Q&A format', 'customer service']
  },
  budget: {
    stops: ['Total Budget:', '\n\nNote:', 'Additional costs:', 'User:', '\n---'],
    description: 'Structured financial breakdowns',
    useCases: ['cost calculations', 'expense planning', 'budget analysis']
  },
  custom: {
    stops: [],
    description: 'User-defined stop sequences',
    useCases: ['specialized formatting', 'custom structures']
  }
};

// System prompts optimized for different stop sequence types
const systemPrompts = {
  itinerary: `You are Only Explore, a travel planning expert. Create structured daily itineraries. End each day's plan with "EndOfDay" and start new days with "Day X:". Keep each day concise and actionable.`,
  
  list: `You are Only Explore, a travel recommendation specialist. Provide clear, numbered lists of recommendations. Keep each item concise with key details. Limit to 5 items unless specifically requested otherwise.`,
  
  conversation: `You are Only Explore, a helpful travel assistant. Provide direct, helpful responses to travel questions. Do not generate multiple sides of a conversation - only respond as the assistant.`,
  
  budget: `You are Only Explore, a travel budget advisor. Provide clear cost breakdowns with specific numbers. Structure responses with categories and totals. Be precise with financial information.`
};

export async function performStopSequenceGeneration(config: StopSequenceConfig): Promise<{
  response: string;
  stopSequences: string[];
  responseType: string;
  reasoning: string;
  truncated: boolean;
}> {
  try {
    const preset = stopSequencePresets[config.responseType];
    const stopSequences = config.customStops || preset.stops;
    const systemPrompt = systemPrompts[config.responseType] || systemPrompts.conversation;
    
    console.log(`⏹️ Using stop sequences: ${stopSequences.join(', ')}`);

    // For Gemini, we'll simulate stop sequences by post-processing
    // since Gemini API doesn't have direct stop sequence support
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        maxOutputTokens: config.maxLength || 1000
      }
    });

    const prompt = config.context 
      ? `${systemPrompt}\n\nContext: ${config.context}\n\nUser Query: ${config.userQuery}`
      : `${systemPrompt}\n\nUser Query: ${config.userQuery}`;

    const result = await model.generateContent(prompt);
    let response = result.response.text();
    
    // Apply stop sequences by truncating at first occurrence
    let truncated = false;
    for (const stopSeq of stopSequences) {
      const stopIndex = response.indexOf(stopSeq);
      if (stopIndex !== -1) {
        response = response.substring(0, stopIndex).trim();
        truncated = true;
        break;
      }
    }
    
    return {
      response,
      stopSequences,
      responseType: config.responseType,
      reasoning: `Applied ${config.responseType} stop sequences to create structured response`,
      truncated
    };

  } catch (error) {
    console.error('Error in stop sequence generation:', error);
    throw error;
  }
}

// Automatically detect optimal response type for stop sequences
export function detectResponseType(query: string): 'itinerary' | 'list' | 'conversation' | 'budget' {
  const queryLower = query.toLowerCase();
  
  // Itinerary indicators
  const itineraryKeywords = ['plan', 'itinerary', 'schedule', 'day', 'trip', 'agenda'];
  
  // List indicators
  const listKeywords = ['list', 'recommend', 'suggest', 'top', 'best', 'options'];
  
  // Budget indicators
  const budgetKeywords = ['cost', 'budget', 'price', 'money', 'expense', 'breakdown'];
  
  const itineraryScore = itineraryKeywords.filter(keyword => queryLower.includes(keyword)).length;
  const listScore = listKeywords.filter(keyword => queryLower.includes(keyword)).length;
  const budgetScore = budgetKeywords.filter(keyword => queryLower.includes(keyword)).length;
  
  if (budgetScore >= 2 || queryLower.includes('cost breakdown')) return 'budget';
  if (itineraryScore >= 2 || queryLower.includes('plan') || queryLower.includes('itinerary')) return 'itinerary';
  if (listScore >= 2 || queryLower.includes('recommend') || queryLower.includes('list')) return 'list';
  
  return 'conversation';
}

// Compare responses with and without stop sequences
export async function compareWithWithoutStops(query: string, responseType: 'itinerary' | 'list' | 'conversation' | 'budget'): Promise<{
  withStops: any;
  withoutStops: any;
  comparison: string;
}> {
  // Response with stop sequences
  const withStops = await performStopSequenceGeneration({
    responseType,
    userQuery: query
  });
  
  // Response without stop sequences (simulate by using empty stops)
  const withoutStops = await performStopSequenceGeneration({
    responseType: 'custom',
    customStops: [],
    userQuery: query
  });
  
  return {
    withStops,
    withoutStops,
    comparison: `With stops: ${withStops.response.length} chars, truncated: ${withStops.truncated}. Without stops: ${withoutStops.response.length} chars, truncated: ${withoutStops.truncated}`
  };
}
