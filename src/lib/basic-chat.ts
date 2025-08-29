// src/lib/basic-chat.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI('AIzaSyBly_i9JKks9T-G2KE_-Y9thsIYLm0mWiw');

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ChatSession {
  id: string;
  messages: ChatMessage[];
  createdAt: string;
}

// Simple in-memory chat sessions (use database in production)
const chatSessions = new Map<string, ChatSession>();

export async function processBasicChat(message: string, sessionId?: string): Promise<{ response: string; sessionId: string }> {
  try {
    // Create or get chat session
    const actualSessionId = sessionId || generateSessionId();
    let session = chatSessions.get(actualSessionId);
    
    if (!session) {
      session = {
        id: actualSessionId,
        messages: [],
        createdAt: new Date().toISOString()
      };
      chatSessions.set(actualSessionId, session);
    }

    // Add user message to session
    session.messages.push({
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    });

    // Create travel-focused prompt
    const travelPrompt = `You are Only Explore, a helpful AI travel assistant. Help users with travel planning, destination recommendations, itineraries, and travel tips. Be friendly, informative, and focus on travel-related advice.

User question: ${message}

Provide a helpful travel-focused response:`;

    // Get AI response
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(travelPrompt);
    const response = result.response.text();

    // Add AI response to session
    session.messages.push({
      role: 'assistant',
      content: response,
      timestamp: new Date().toISOString()
    });

    return {
      response,
      sessionId: actualSessionId
    };

  } catch (error) {
    console.error('Error in basic chat:', error);
    return {
      response: 'Sorry, I encountered an error. Please try again.',
      sessionId: sessionId || generateSessionId()
    };
  }
}

export function getChatHistory(sessionId: string): ChatMessage[] {
  const session = chatSessions.get(sessionId);
  return session ? session.messages : [];
}

function generateSessionId(): string {
  return 'chat_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
}
