// src/lib/zero-shot-prompting.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI('AIzaSyBly_i9JKks9T-G2KE_-Y9thsIYLm0mWiw');

export interface ZeroShotTask {
  task: string;
  context?: string;
  temperature?: number;
}

export async function performZeroShotPrompting(task: ZeroShotTask): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Zero-shot prompt - no examples, just the task description
    const zeroShotPrompt = `
You are Only Explore, an expert AI travel assistant.

Task: ${task.task}

${task.context ? `Additional Context: ${task.context}` : ''}

Provide a comprehensive, helpful response based solely on your knowledge. Do not ask for examples or clarification.`;

    const result = await model.generateContent(zeroShotPrompt);
    return result.response.text();

  } catch (error) {
    console.error('Error in zero-shot prompting:', error);
    throw error;
  }
}

// Travel-specific zero-shot tasks
export const travelZeroShotTasks = [
  {
    task: "Create a complete 7-day itinerary for first-time visitors to Japan in spring, including daily activities, transportation, and cultural experiences.",
    context: "Budget: $2000 per person, interested in culture, food, and nature"
  },
  {
    task: "Explain the visa requirements for US citizens traveling to different European countries and provide a step-by-step application guide.",
    context: "Tourist travel for 2 weeks"
  },
  {
    task: "Compare the advantages and disadvantages of backpacking vs luxury travel in Southeast Asia, and recommend the best approach for different traveler types.",
    context: "Consider budget, experience, safety, and cultural immersion"
  },
  {
    task: "Design a food tour itinerary for authentic local cuisine in Thailand, avoiding tourist traps and focusing on regional specialties.",
    context: "10-day trip, moderate spice tolerance, interested in street food and cooking classes"
  }
];
