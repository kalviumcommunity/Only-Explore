// src/lib/chain-of-thought.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface CoTConfig {
  userQuery: string;
  taskType: 'itinerary' | 'budget' | 'recommendations' | 'comparison' | 'problem-solving';
  showReasoning?: boolean;
  context?: string;
}

export interface CoTResult {
  reasoning: string[];
  finalAnswer: string;
  taskType: string;
  fullResponse: string;
}

// Chain-of-Thought templates for different travel planning tasks
const cotTemplates = {
  itinerary: `You are Only Explore, an expert travel planner. Use step-by-step reasoning to create the best travel plan.

Think through this systematically:

Step 1: Analyze the user's requirements (destination, duration, interests, budget, travel style)
Step 2: Identify key constraints and preferences  
Step 3: Research relevant activities and attractions for their interests
Step 4: Consider logistics (travel time, location proximity, seasonal factors)
Step 5: Allocate activities across days for optimal flow
Step 6: Provide final structured itinerary

User Query: {query}

Let me think through this step by step:`,

  budget: `You are Only Explore, a travel budget expert. Use systematic reasoning to create accurate cost estimates.

Think through this systematically:

Step 1: Identify all cost categories (flights, accommodation, food, activities, transport, misc)
Step 2: Research typical costs for the destination and travel style
Step 3: Calculate daily expenses based on itinerary  
Step 4: Factor in seasonal pricing and regional differences
Step 5: Add contingency and provide total breakdown
Step 6: Present clear budget with justifications

User Query: {query}

Let me analyze the costs step by step:`,

  recommendations: `You are Only Explore, a travel recommendation specialist. Use logical reasoning to provide the best suggestions.

Think through this systematically:

Step 1: Understand user preferences and constraints
Step 2: Consider destination characteristics and options
Step 3: Evaluate options against user criteria
Step 4: Rank options by relevance and quality
Step 5: Consider practical factors (accessibility, timing, cost)
Step 6: Provide final recommendations with reasoning

User Query: {query}

Let me work through the best recommendations step by step:`,

  comparison: `You are Only Explore, a travel comparison expert. Use structured analysis to compare options fairly.

Think through this systematically:

Step 1: Identify items/destinations to compare
Step 2: Define comparison criteria relevant to user needs
Step 3: Analyze each option against each criterion
Step 4: Consider trade-offs and unique advantages
Step 5: Weigh factors by user priorities
Step 6: Provide clear comparison conclusion

User Query: {query}

Let me compare these options step by step:`,

  'problem-solving': `You are Only Explore, a travel problem-solving expert. Use logical reasoning to find solutions.

Think through this systematically:

Step 1: Clearly identify the travel problem or challenge
Step 2: Break down contributing factors and constraints
Step 3: Brainstorm potential solutions and alternatives
Step 4: Evaluate feasibility and practicality of each option
Step 5: Consider risk factors and contingencies
Step 6: Recommend best solution with backup plans

User Query: {query}

Let me work through this problem step by step:`
};

export async function performChainOfThought(config: CoTConfig): Promise<CoTResult> {
  try {
    const template = cotTemplates[config.taskType];
    const prompt = template.replace('{query}', config.userQuery);
    
    console.log(`🧠 Chain-of-Thought reasoning for ${config.taskType} task`);

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.7,
        topP: 0.9,
        maxOutputTokens: 2000
      }
    });

    const result = await model.generateContent(prompt);
    const fullResponse = result.response.text();
    
    // Parse reasoning steps and final answer
    const { reasoning, finalAnswer } = parseCoTResponse(fullResponse);
    
    return {
      reasoning,
      finalAnswer,
      taskType: config.taskType,
      fullResponse
    };

  } catch (error) {
    console.error('Error in Chain-of-Thought prompting:', error);
    throw error;
  }
}

// Parse CoT response to extract reasoning steps and final answer
function parseCoTResponse(response: string): { reasoning: string[]; finalAnswer: string } {
  const lines = response.split('\n');
  const reasoning: string[] = [];
  let finalAnswerStart = -1;
  
  // Extract step-by-step reasoning
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.match(/^Step \d+:|^\d+\./)) {
      reasoning.push(line);
    } else if (line.toLowerCase().includes('final') || 
               line.toLowerCase().includes('conclusion') ||
               line.toLowerCase().includes('recommendation')) {
      finalAnswerStart = i;
      break;
    }
  }
  
  // Extract final answer
  const finalAnswer = finalAnswerStart >= 0 
    ? lines.slice(finalAnswerStart).join('\n').trim()
    : lines.slice(Math.max(0, lines.length - 10)).join('\n').trim();
    
  return { reasoning, finalAnswer };
}

// Detect optimal CoT task type based on query
export function detectCoTTaskType(query: string): 'itinerary' | 'budget' | 'recommendations' | 'comparison' | 'problem-solving' {
  const queryLower = query.toLowerCase();
  
  // Budget task indicators
  if (queryLower.includes('cost') || queryLower.includes('budget') || queryLower.includes('expensive')) {
    return 'budget';
  }
  
  // Comparison task indicators
  if (queryLower.includes('vs') || queryLower.includes('compare') || queryLower.includes('better') || queryLower.includes('versus')) {
    return 'comparison';
  }
  
  // Problem-solving indicators
  if (queryLower.includes('problem') || queryLower.includes('issue') || queryLower.includes('help') || queryLower.includes('stuck')) {
    return 'problem-solving';
  }
  
  // Itinerary indicators
  if (queryLower.includes('plan') || queryLower.includes('itinerary') || queryLower.includes('schedule') || queryLower.includes('days')) {
    return 'itinerary';
  }
  
  // Default to recommendations
  return 'recommendations';
}

// Compare CoT vs Direct prompting
export async function compareCoTvsDirect(query: string): Promise<{
  chainOfThought: CoTResult;
  directPrompt: string;
  comparison: string;
}> {
  // Chain-of-Thought approach
  const taskType = detectCoTTaskType(query);
  const cotResult = await performChainOfThought({
    userQuery: query,
    taskType
  });
  
  // Direct prompting approach
  const directModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const directPrompt = `You are Only Explore, a travel assistant. Answer this query directly and concisely: ${query}`;
  const directResult = await directModel.generateContent(directPrompt);
  
  return {
    chainOfThought: cotResult,
    directPrompt: directResult.response.text(),
    comparison: `CoT shows reasoning (${cotResult.reasoning.length} steps) while direct gives immediate answer`
  };
}

// Advanced CoT with multiple reasoning paths
export async function performMultiPathCoT(query: string): Promise<{
  paths: CoTResult[];
  synthesis: string;
  bestPath: number;
}> {
  const taskTypes: Array<'itinerary' | 'budget' | 'recommendations'> = ['itinerary', 'budget', 'recommendations'];
  const paths: CoTResult[] = [];
  
  // Generate reasoning from multiple perspectives
  for (const taskType of taskTypes) {
    try {
      const result = await performChainOfThought({
        userQuery: query,
        taskType
      });
      paths.push(result);
    } catch (error) {
      console.error(`Error in ${taskType} path:`, error);
    }
  }
  
  // Synthesize insights from multiple paths
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const synthesisPrompt = `
You are Only Explore. I've analyzed a travel query from multiple perspectives:
1. Itinerary Planning: ${paths[0]?.finalAnswer.substring(0, 200) || 'N/A'}
2. Budget Analysis: ${paths[1]?.finalAnswer.substring(0, 200) || 'N/A'}  
3. General Recommendations: ${paths[2]?.finalAnswer.substring(0, 200) || 'N/A'}

Synthesize these perspectives into one comprehensive travel solution for: "${query}"
`;
  
  const synthesisResult = await model.generateContent(synthesisPrompt);
  
  return {
    paths,
    synthesis: synthesisResult.response.text(),
    bestPath: 0 // Could implement scoring logic
  };
}
