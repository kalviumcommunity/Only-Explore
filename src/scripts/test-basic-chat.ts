// src/scripts/test-basic-chat.ts
import { processBasicChat, getChatHistory } from '../lib/basic-chat.js';

async function testBasicChatFunctionality() {
  console.log('🧪 Testing Basic Chat Integration (Step 3)\n');

  const testQueries = [
    'What are the most beautiful beaches in Bali?',
    'I want to visit Paris in spring. What should I expect?',
    'Plan a budget-friendly trip to Tokyo for 5 days',
    'What are some must-try foods in Thailand?',
    'Tell me about cultural sites in Rome'
  ];

  let sessionId: string | undefined;

  for (const query of testQueries) {
    console.log(`💬 User: "${query}"`);
    
    try {
      const result = await processBasicChat(query, sessionId);
      sessionId = result.sessionId; // Continue same session
      
      console.log(`🤖 AI: ${result.response.substring(0, 150)}...\n`);
      console.log(`📝 Session: ${result.sessionId}\n`);
      
    } catch (error) {
      console.error(`❌ Error: ${error}\n`);
    }
    
    console.log('='.repeat(80) + '\n');
  }

  // Test chat history
  if (sessionId) {
    console.log('📊 Testing Chat History Retrieval...');
    const history = getChatHistory(sessionId);
    console.log(`💾 Retrieved ${history.length} messages from session ${sessionId}`);
    
    history.forEach((msg, index) => {
      console.log(`${index + 1}. [${msg.role}] ${msg.content.substring(0, 80)}...`);
    });
  }
}

testBasicChatFunctionality().catch(console.error);
