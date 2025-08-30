// src/lib/temperature-control.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface TemperatureConfig {
  taskType: 'factual' | 'balanced' | 'creative';
  customTemperature?: number;
  userQuery: string;
  context?: string;
}

// Temperature settings for different travel tasks
export const temperatureSettings = {
  factual: {
    temperature: 0.2,
    description: 'Precise, consistent, reliable responses',
    useCases: ['budget calculations', 'visa requirements', 'travel facts', 'currency rates', 'travel times']
  },
  balanced: {
    temperature: 0.6,
    description: 'Mix of reliability and creativity',
    useCases: ['food recommendations', 'cultural insights', 'activity suggestions', 'general advice']
  },
  creative: {
    temperature: 0.9,
    description: 'Imaginative, varied, storytelling responses',
    useCases: ['travel stories', 'destination descriptions', 'experience narratives', 'inspiration']
  }
};

// System prompts optimized for different temperature levels
const systemPrompts = {
  factual: `You are Only Explore, a precise and reliable travel assistant. Provide accurate, factual information with specific details, numbers, and practical advice. Focus on consistency and reliability.`,
  
  balanced: `You are Only Explore, a knowledgeable travel assistant. Provide helpful advice that balances factual information with interesting insights and creative suggestions. Be informative yet engaging.`,
  
  creative: `You are Only Explore, a creative travel storyteller and inspiration guide. Paint vivid pictures with words, tell engaging stories, and spark wanderlust with imaginative descriptions and unique perspectives.`
};

export async function performTemperatureControlledPrompting(config: TemperatureConfig): Promise<{
  response: string;
  temperature: number;
  taskType: string;
  reasoning: string;
}> {
  try {
    // Determine temperature and task type
    const temperature = config.customTemperature || temperatureSettings[config.taskType].temperature;
    const systemPrompt = systemPrompts[config.taskType];
    
    console.log(`🌡️ Using temperature ${temperature} for ${config.taskType} task`);

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: temperature,
        topP: 0.8,
        topK: 40
      }
    });

    const prompt = config.context 
      ? `${systemPrompt}\n\nContext: ${config.context}\n\nUser Query: ${config.userQuery}`
      : `${systemPrompt}\n\nUser Query: ${config.userQuery}`;

    const result = await model.generateContent(prompt);
    
    return {
      response: result.response.text(),
      temperature,
      taskType: config.taskType,
      reasoning: `Used ${config.taskType} temperature (${temperature}) for ${temperatureSettings[config.taskType].description.toLowerCase()}`
    };

  } catch (error) {
    console.error('Error in temperature controlled prompting:', error);
    throw error;
  }
}

// Automatically detect optimal temperature based on query content
export function detectOptimalTemperature(query: string): 'factual' | 'balanced' | 'creative' {
  const queryLower = query.toLowerCase();
  
  // Factual indicators (low temperature)
  const factualKeywords = [
    'cost', 'budget', 'price', 'how much', 'visa', 'requirement', 'document', 
    'currency', 'exchange rate', 'time', 'duration', 'distance', 'weather',
    'facts', 'information', 'when', 'where exactly', 'how long', 'calculate'
  ];
  
  // Creative indicators (high temperature)  
  const creativeKeywords = [
    'describe', 'tell me about', 'story', 'experience', 'inspire', 'imagine',
    'dream', 'adventure', 'magical', 'amazing', 'breathtaking', 'unforgettable',
    'narrative', 'journey', 'feel like', 'atmosphere', 'vibe'
  ];
  
  // Check creative first (more specific patterns)
  const creativeScore = creativeKeywords.filter(keyword => queryLower.includes(keyword)).length;
  const factualScore = factualKeywords.filter(keyword => queryLower.includes(keyword)).length;
  
  if (creativeScore >= 2 || queryLower.includes('describe') || queryLower.includes('story')) {
    return 'creative';
  }
  
  if (factualScore >= 2 || queryLower.includes('cost') || queryLower.includes('how much')) {
    return 'factual';
  }
  
  // Default to balanced
  return 'balanced';
}

// Temperature comparison for demonstration
export async function compareTemperatures(query: string, context?: string): Promise<{
  factual: any;
  balanced: any;
  creative: any;
  comparison: string;
}> {
  const tasks: Array<'factual' | 'balanced' | 'creative'> = ['factual', 'balanced', 'creative'];
  const results: any = {};
  
  for (const taskType of tasks) {
    results[taskType] = await performTemperatureControlledPrompting({
      taskType,
      userQuery: query,
      context
    });
  }
  
  return {
    ...results,
    comparison: `Compared responses across temperatures: Factual (${temperatureSettings.factual.temperature}), Balanced (${temperatureSettings.balanced.temperature}), Creative (${temperatureSettings.creative.temperature})`
  };
}
