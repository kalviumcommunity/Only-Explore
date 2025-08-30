// src/lib/top-k-sampling.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface TopKConfig {
  taskType: 'precise' | 'balanced' | 'creative';
  customTopK?: number;
  userQuery: string;
  context?: string;
}

// Top-K settings for different travel tasks
export const topKSettings = {
  precise: {
    topK: 5,
    description: 'Focused, consistent, reliable responses',
    useCases: ['itinerary planning', 'budget calculations', 'travel facts', 'visa requirements', 'exact costs']
  },
  balanced: {
    topK: 20,
    description: 'Mix of consistency and variety',
    useCases: ['restaurant recommendations', 'activity suggestions', 'cultural insights', 'general advice']
  },
  creative: {
    topK: 50,
    description: 'Diverse, varied, imaginative responses',
    useCases: ['travel stories', 'destination descriptions', 'experience narratives', 'inspiration']
  }
};

// System prompts optimized for different Top-K levels
const systemPrompts = {
  precise: `You are Only Explore, a precise and reliable travel assistant. Provide accurate, factual information with specific details, numbers, and practical advice. Focus on consistency and reliability. Use focused, predictable language.`,
  
  balanced: `You are Only Explore, a knowledgeable travel assistant. Provide helpful advice that balances factual information with interesting insights and creative suggestions. Be informative yet engaging. Use varied but relevant language.`,
  
  creative: `You are Only Explore, a creative travel storyteller and inspiration guide. Paint vivid pictures with words, tell engaging stories, and spark wanderlust with imaginative descriptions and unique perspectives. Use diverse, colorful language.`
};

export async function performTopKSampling(config: TopKConfig): Promise<{
  response: string;
  topK: number;
  taskType: string;
  reasoning: string;
}> {
  try {
    // Determine Top-K and task type
    const topK = config.customTopK || topKSettings[config.taskType].topK;
    const systemPrompt = systemPrompts[config.taskType];
    
    console.log(`🎯 Using Top-K ${topK} for ${config.taskType} task`);

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.7, // Balanced temperature for Top-K demonstration
        topK: topK,
        topP: 0.9
      }
    });

    const prompt = config.context 
      ? `${systemPrompt}\n\nContext: ${config.context}\n\nUser Query: ${config.userQuery}`
      : `${systemPrompt}\n\nUser Query: ${config.userQuery}`;

    const result = await model.generateContent(prompt);
    
    return {
      response: result.response.text(),
      topK,
      taskType: config.taskType,
      reasoning: `Used ${config.taskType} Top-K (${topK}) for ${topKSettings[config.taskType].description.toLowerCase()}`
    };

  } catch (error) {
    console.error('Error in Top-K sampling:', error);
    throw error;
  }
}

// Automatically detect optimal Top-K based on query content
export function detectOptimalTopK(query: string): 'precise' | 'balanced' | 'creative' {
  const queryLower = query.toLowerCase();
  
  // Precise indicators (low Top-K)
  const preciseKeywords = [
    'exact', 'precise', 'calculate', 'budget', 'cost', 'price', 'how much', 
    'visa', 'requirement', 'document', 'time', 'duration', 'distance',
    'facts', 'information', 'when', 'where exactly', 'how long', 'specific'
  ];
  
  // Creative indicators (high Top-K)  
  const creativeKeywords = [
    'describe', 'tell me about', 'story', 'experience', 'inspire', 'imagine',
    'dream', 'adventure', 'magical', 'amazing', 'breathtaking', 'unforgettable',
    'narrative', 'journey', 'feel like', 'atmosphere', 'vibe', 'creative'
  ];
  
  // Check creative first (more specific patterns)
  const creativeScore = creativeKeywords.filter(keyword => queryLower.includes(keyword)).length;
  const preciseScore = preciseKeywords.filter(keyword => queryLower.includes(keyword)).length;
  
  if (creativeScore >= 2 || queryLower.includes('describe') || queryLower.includes('story')) {
    return 'creative';
  }
  
  if (preciseScore >= 2 || queryLower.includes('calculate') || queryLower.includes('exact')) {
    return 'precise';
  }
  
  // Default to balanced
  return 'balanced';
}

// Top-K comparison for demonstration
export async function compareTopKValues(query: string, context?: string): Promise<{
  precise: any;
  balanced: any;
  creative: any;
  comparison: string;
}> {
  const tasks: Array<'precise' | 'balanced' | 'creative'> = ['precise', 'balanced', 'creative'];
  const results: any = {};
  
  for (const taskType of tasks) {
    results[taskType] = await performTopKSampling({
      taskType,
      userQuery: query,
      context
    });
  }
  
  return {
    ...results,
    comparison: `Compared responses across Top-K values: Precise (${topKSettings.precise.topK}), Balanced (${topKSettings.balanced.topK}), Creative (${topKSettings.creative.topK})`
  };
}

// Demonstrate Top-K diversity with multiple runs
export async function demonstrateTopKDiversity(query: string, topK: number, runs: number = 3): Promise<{
  topK: number;
  runs: any[];
  diversity: string;
}> {
  const results = [];
  
  for (let i = 0; i < runs; i++) {
    const result = await performTopKSampling({
      taskType: 'balanced', // Use balanced for demonstration
      customTopK: topK,
      userQuery: query
    });
    
    results.push({
      run: i + 1,
      response: result.response.substring(0, 200) + '...',
      fullResponse: result.response
    });
  }
  
  // Analyze diversity (simple word overlap analysis)
  const allWords = results.map(r => r.fullResponse.toLowerCase().split(/\s+/));
  const commonWords = allWords.reduce((common, words) => 
    common.filter(word => words.includes(word)), allWords[0] || []
  );
  
  const diversity = commonWords.length < 10 ? 'High diversity' : 
                   commonWords.length < 20 ? 'Medium diversity' : 'Low diversity';
  
  return {
    topK,
    runs: results,
    diversity: `${diversity} (${commonWords.length} common words across ${runs} runs)`
  };
}
