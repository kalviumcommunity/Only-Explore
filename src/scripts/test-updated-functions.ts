// src/scripts/test-updated-functions.ts
import { processFunctionCallingChat } from '../lib/function-calling-updated.js';

async function testUpdatedFunctionCalling() {
  console.log('🧪 Testing Updated Function Calling Implementation (Step 4)\n');

  const testCases = [
    {
      name: 'Hotel Search',
      message: 'Find me hotels in Bali'
    },
    {
      name: 'Cuisine Recommendation',
      message: 'What are popular foods in Tokyo?'
    },
    {
      name: 'Flight Search',
      message: 'Show me flights from New York to Paris on 2025-12-25'
    },
    {
      name: 'General Travel Query',
      message: 'What should I visit in Rome?'
    },
    {
      name: 'Food in Paris',
      message: 'What local cuisine should I try in Paris?'
    }
  ];

  for (const testCase of testCases) {
    console.log(`🔍 Test: ${testCase.name}`);
    console.log(`💬 Message: "${testCase.message}"`);
    
    try {
      const result = await processFunctionCallingChat(testCase.message);
      
      console.log(`📊 Response Type: ${result.type}`);
      
      if (result.type === 'function_call') {
        console.log(`🔧 Function Called: ${result.functionName}`);
        console.log(`📝 Arguments:`, JSON.stringify(result.functionArgs, null, 2));
        console.log(`💭 Final Response: ${result.finalResponse?.substring(0, 200)}...`);
      } else if (result.type === 'text') {
        console.log(`💭 Text Response: ${result.content?.substring(0, 200)}...`);
      } else {
        console.log(`❌ Error Response: ${result.content}`);
      }
      
    } catch (error) {
      console.error(`❌ Error: ${error}`);
    }
    
    console.log('\n' + '='.repeat(80) + '\n');
  }
}

testUpdatedFunctionCalling().catch(console.error);
