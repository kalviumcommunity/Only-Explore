// src/lib/tokenization.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface TokenInfo {
  text: string;
  tokens: string[];
  tokenCount: number;
  estimatedCost?: number;
  model?: string;
}

export interface TokenOptimization {
  original: TokenInfo;
  optimized: TokenInfo;
  savings: {
    tokens: number;
    cost: number;
    percentage: number;
  };
}

// Token pricing per model (approximate)
export const modelPricing = {
  'gpt-4': { input: 0.03, output: 0.06 }, // per 1K tokens
  'gpt-3.5-turbo': { input: 0.002, output: 0.002 },
  'gemini-1.5-flash': { input: 0.0001, output: 0.0002 },
  'text-embedding-004': { input: 0.00002, output: 0 }
};

// Simple tokenization for demonstration
export function basicTokenize(text: string): string[] {
  // Basic word-based tokenization with punctuation handling
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
    .split(/\s+/)
    .filter(token => token.length > 0);
}

// Advanced tokenization using regex patterns
export function advancedTokenize(text: string): string[] {
  const tokens: string[] = [];
  
  // Pattern to match words, numbers, and punctuation
  const tokenPattern = /\b\w+\b|[^\w\s]/g;
  let match;
  
  while ((match = tokenPattern.exec(text)) !== null) {
    tokens.push(match[0]);
  }
  
  return tokens;
}

// Estimate token count using character-based approximation
export function estimateTokenCount(text: string): number {
  // Rough approximation: ~4 characters per token for English
  return Math.ceil(text.length / 4);
}

// Calculate estimated cost based on token count
export function calculateCost(tokenCount: number, model: string = 'gemini-1.5-flash'): number {
  const pricing = modelPricing[model as keyof typeof modelPricing];
  if (!pricing) return 0;
  
  return (tokenCount / 1000) * pricing.input;
}

// Travel-specific tokenization examples
export const travelTokenizationExamples = [
  {
    query: "Find romantic beach destinations in Southeast Asia under $1000",
    description: "User travel query with location, preference, and budget"
  },
  {
    query: "Plan a 7-day cultural itinerary for Japan including temples, food tours, and traditional experiences",
    description: "Detailed itinerary request with specific interests and duration"
  },
  {
    query: "Book flight from New York to Paris on December 25th for 2 passengers",
    description: "Function calling request with specific parameters"
  },
  {
    query: "What are the visa requirements for US citizens traveling to European countries?",
    description: "Informational query about travel documentation"
  }
];

// Analyze tokenization for travel content
export function analyzeTravelTokenization(text: string): TokenInfo {
  const basicTokens = basicTokenize(text);
  const advancedTokens = advancedTokenize(text);
  const estimatedCount = estimateTokenCount(text);
  
  return {
    text,
    tokens: advancedTokens, // Use advanced tokenization
    tokenCount: advancedTokens.length,
    estimatedCost: calculateCost(advancedTokens.length),
    model: 'gemini-1.5-flash'
  };
}

// Optimize text for token efficiency
export function optimizeTextForTokens(text: string): TokenOptimization {
  const original = analyzeTravelTokenization(text);
  
  // Apply optimization strategies
  let optimizedText = text
    // Remove redundant words
    .replace(/\b(?:very|really|quite|extremely|absolutely)\s+/gi, '')
    // Simplify common phrases
    .replace(/\bin order to\b/gi, 'to')
    .replace(/\bdue to the fact that\b/gi, 'because')
    .replace(/\bat this point in time\b/gi, 'now')
    // Remove filler words
    .replace(/\b(?:actually|basically|essentially|obviously)\s+/gi, '')
    // Simplify travel terminology
    .replace(/\bdestinations?\b/gi, 'places')
    .replace(/\baccommodations?\b/gi, 'hotels')
    .replace(/\bitineraries?\b/gi, 'plans')
    // Remove extra whitespace
    .replace(/\s+/g, ' ')
    .trim();
  
  const optimized = analyzeTravelTokenization(optimizedText);
  
  const tokenSavings = original.tokenCount - optimized.tokenCount;
  const costSavings = (original.estimatedCost || 0) - (optimized.estimatedCost || 0);
  
  return {
    original,
    optimized,
    savings: {
      tokens: tokenSavings,
      cost: costSavings,
      percentage: Math.round((tokenSavings / original.tokenCount) * 100)
    }
  };
}

// Token analysis for travel destinations
export function analyzeDestinationTokens(destinations: string[]): {
  destinations: Array<{
    name: string;
    tokens: string[];
    tokenCount: number;
    estimatedCost: number;
  }>;
  totalTokens: number;
  averageTokens: number;
  totalCost: number;
} {
  const destinationAnalysis = destinations.map(destination => {
    const analysis = analyzeTravelTokenization(destination);
    return {
      name: destination,
      tokens: analysis.tokens,
      tokenCount: analysis.tokenCount,
      estimatedCost: analysis.estimatedCost || 0
    };
  });
  
  const totalTokens = destinationAnalysis.reduce((sum, dest) => sum + dest.tokenCount, 0);
  const totalCost = destinationAnalysis.reduce((sum, dest) => sum + dest.estimatedCost, 0);
  
  return {
    destinations: destinationAnalysis,
    totalTokens,
    averageTokens: Math.round(totalTokens / destinations.length),
    totalCost
  };
}

// Token-aware text chunking for large travel content
export function chunkTextByTokens(text: string, maxTokensPerChunk: number = 1000): string[] {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const chunks: string[] = [];
  let currentChunk = '';
  let currentTokenCount = 0;
  
  for (const sentence of sentences) {
    const sentenceTokens = analyzeTravelTokenization(sentence.trim()).tokenCount;
    
    if (currentTokenCount + sentenceTokens > maxTokensPerChunk && currentChunk) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence.trim();
      currentTokenCount = sentenceTokens;
    } else {
      currentChunk += ' ' + sentence.trim();
      currentTokenCount += sentenceTokens;
    }
  }
  
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

// Token budgeting for API calls
export function calculateTokenBudget(
  queries: string[], 
  model: string = 'gemini-1.5-flash',
  maxBudget: number = 1.0 // $1.00
): {
  queries: Array<{
    query: string;
    tokens: number;
    cost: number;
    withinBudget: boolean;
  }>;
  totalCost: number;
  budgetRemaining: number;
  recommendations: string[];
} {
  const queryAnalysis = queries.map(query => {
    const tokens = analyzeTravelTokenization(query).tokenCount;
    const cost = calculateCost(tokens, model);
    return {
      query,
      tokens,
      cost,
      withinBudget: cost <= maxBudget
    };
  });
  
  const totalCost = queryAnalysis.reduce((sum, q) => sum + q.cost, 0);
  const budgetRemaining = Math.max(0, maxBudget - totalCost);
  
  const recommendations = [];
  if (totalCost > maxBudget) {
    recommendations.push('Consider optimizing queries to reduce token count');
    recommendations.push('Use shorter, more focused queries');
    recommendations.push('Implement query caching to avoid redundant API calls');
  }
  if (budgetRemaining > 0.1) {
    recommendations.push('Budget allows for additional queries');
  }
  
  return {
    queries: queryAnalysis,
    totalCost,
    budgetRemaining,
    recommendations
  };
}

// Demonstrate tokenization differences across models
export function demonstrateTokenizationDifferences(text: string): {
  text: string;
  tokenizations: Array<{
    method: string;
    tokens: string[];
    tokenCount: number;
    description: string;
  }>;
  insights: string[];
} {
  const tokenizations = [
    {
      method: 'basic',
      tokens: basicTokenize(text),
      tokenCount: basicTokenize(text).length,
      description: 'Simple word-based splitting with punctuation removal'
    },
    {
      method: 'advanced',
      tokens: advancedTokenize(text),
      tokenCount: advancedTokenize(text).length,
      description: 'Regex-based tokenization preserving punctuation'
    },
    {
      method: 'estimated',
      tokens: ['[estimated]'],
      tokenCount: estimateTokenCount(text),
      description: 'Character-based approximation (~4 chars per token)'
    }
  ];
  
  const insights = [
    'Different tokenization methods produce varying token counts',
    'Advanced tokenization preserves more linguistic information',
    'Estimated counts provide quick approximations for budgeting',
    'Real model tokenizers may differ from these examples'
  ];
  
  return {
    text,
    tokenizations,
    insights
  };
}
