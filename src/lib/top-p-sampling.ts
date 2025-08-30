// src/lib/top-p-sampling.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface TopPConfig {
  mode: 'focused' | 'balanced' | 'creative';
  customTopP?: number;
  customTemperature?: number;
  userQuery: string;
  context?: string;
}

// Top-P settings for different travel scenarios
export const topPSettings = {
  focused: {
    topP: 0.5,
    temperature: 0.6,
    description: 'Conservative, high-confidence responses',
    useCases: ['structured itineraries', 'essential travel info', 'must-visit places', 'safety guidelines']
  },
  balanced: {
    topP: 0.8,
    temperature: 0.7,
    description: 'Mix of popular and unique suggestions',
    useCases: ['food recommendations', 'activity suggestions', 'cultural insights', 'general advice']
  },
  creative: {
    topP: 0.95,
    temperature: 0.8,
    description: 'Diverse, imaginative, exploratory responses',
    useCases: ['storytelling', 'hidden gems', 'unique experiences', 'creative descriptions']
  }
};

// Specialized prompts for different Top-P modes
const modePrompts = {
  focused: `You are Only Explore, a reliable travel assistant. Provide well-established, proven recommendations that most travelers would appreciate. Focus on popular, highly-rated, and essential experiences.`,
  
  balanced: `You are Only Explore, a knowledgeable travel guide. Provide a mix of popular must-sees and interesting lesser-known options. Balance mainstream attractions with unique local experiences.`,
  
  creative: `You are Only Explore, an adventurous travel explorer. Suggest unique, off-the-beaten-path experiences alongside creative interpretations of popular destinations. Be imaginative and inspiring.`
};

export async function performTopPSampling(config: TopPConfig): Promise<{
  response: string;
  topP: number;
  temperature: number;
  mode: string;
  reasoning: string;
}> {
  try {
    const settings = topPSettings[config.mode];
    const topP = config.customTopP || settings.topP;
    const temperature = config.customTemperature || settings.temperature;
    const systemPrompt = modePrompts[config.mode];
    
    console.log(`🎯 Using Top-P ${topP} in ${config.mode} mode`);

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: temperature,
        topP: topP,
        topK: 40
      }
    });

    const prompt = config.context 
      ? `${systemPrompt}\n\nContext: ${config.context}\n\nUser Query: ${config.userQuery}`
      : `${systemPrompt}\n\nUser Query: ${config.userQuery}`;

    const result = await model.generateContent(prompt);
    
    return {
      response: result.response.text(),
      topP,
      temperature,
      mode: config.mode,
      reasoning: `Used ${config.mode} mode (Top-P: ${topP}, Temperature: ${temperature}) for ${settings.description.toLowerCase()}`
    };

  } catch (error) {
    console.error('Error in Top-P sampling:', error);
    throw error;
  }
}

// Automatically detect optimal Top-P mode based on query
export function detectOptimalTopPMode(query: string): 'focused' | 'balanced' | 'creative' {
  const queryLower = query.toLowerCase();
  
  // Focused mode indicators (low Top-P)
  const focusedKeywords = [
    'essential', 'must visit', 'top', 'best', 'important', 'main', 'popular',
    'classic', 'famous', 'basic', 'standard', 'itinerary', 'plan', 'safe'
  ];
  
  // Creative mode indicators (high Top-P)
  const creativeKeywords = [
    'unique', 'hidden', 'secret', 'unusual', 'off the beaten path', 'alternative',
    'creative', 'inspire', 'surprise', 'discover', 'explore', 'adventure',
    'story', 'experience', 'local', 'authentic', 'unconventional'
  ];
  
  const focusedScore = focusedKeywords.filter(keyword => queryLower.includes(keyword)).length;
  const creativeScore = creativeKeywords.filter(keyword => queryLower.includes(keyword)).length;
  
  if (creativeScore >= 2 || queryLower.includes('hidden') || queryLower.includes('unique')) {
    return 'creative';
  }
  
  if (focusedScore >= 2 || queryLower.includes('must visit') || queryLower.includes('essential')) {
    return 'focused';
  }
  
  return 'balanced';
}

// Compare different Top-P settings
export async function compareTopPModes(query: string, context?: string): Promise<{
  focused: any;
  balanced: any;
  creative: any;
  comparison: string;
}> {
  const modes: Array<'focused' | 'balanced' | 'creative'> = ['focused', 'balanced', 'creative'];
  const results: any = {};
  
  for (const mode of modes) {
    results[mode] = await performTopPSampling({
      mode,
      userQuery: query,
      context
    });
  }
  
  return {
    ...results,
    comparison: `Compared responses across Top-P values: Focused (${topPSettings.focused.topP}), Balanced (${topPSettings.balanced.topP}), Creative (${topPSettings.creative.topP})`
  };
}

// Advanced Top-P with dynamic adjustment
export async function performDynamicTopP(query: string, userPreferences?: {
  seekingPopular?: boolean;
  wantsUnique?: boolean;
  riskTolerance?: 'low' | 'medium' | 'high';
}): Promise<{
  response: string;
  dynamicTopP: number;
  reasoning: string;
}> {
  let dynamicTopP = 0.8; // default
  let reasoning = 'Using balanced default';
  
  if (userPreferences?.seekingPopular) {
    dynamicTopP = 0.6;
    reasoning = 'Adjusted to focused mode for popular recommendations';
  } else if (userPreferences?.wantsUnique) {
    dynamicTopP = 0.9;
    reasoning = 'Adjusted to creative mode for unique experiences';
  } else if (userPreferences?.riskTolerance === 'low') {
    dynamicTopP = 0.5;
    reasoning = 'Conservative Top-P for risk-averse preferences';
  } else if (userPreferences?.riskTolerance === 'high') {
    dynamicTopP = 0.95;
    reasoning = 'High Top-P for adventurous preferences';
  }

  const result = await performTopPSampling({
    mode: dynamicTopP <= 0.6 ? 'focused' : dynamicTopP >= 0.9 ? 'creative' : 'balanced',
    customTopP: dynamicTopP,
    userQuery: query
  });

  return {
    response: result.response,
    dynamicTopP,
    reasoning
  };
}
