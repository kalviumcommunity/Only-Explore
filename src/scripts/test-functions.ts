// src/scripts/test-functions.ts
import { processFunctionCall } from '../lib/function-calling.js';

async function testFunctionCalling() {
  console.log('🧪 Testing Function Calling Implementation\n');

  const testCases = [
    {
      name: 'Destination Search',
      message: 'I want to find tropical beach destinations in Asia under $1000 budget'
    },
    {
      name: 'Itinerary Planning', 
      message: 'Plan a 7-day trip to Italy focusing on art, food, and history with $3000 budget'
    },
    {
      name: 'Flight Search',
      message: 'Find flights from London to Tokyo on 2025-12-25 for 2 passengers'
    },
    {
      name: 'Hotel Search',
      message: 'Find hotels in Bangkok for check-in 2025-11-10 and check-out 2025-11-15 under $100 per night'
    },
    {
      name: 'General Travel Query',
      message: 'What are some must-visit places in Europe for first-time travelers?'
    }
  ];

  for (const testCase of testCases) {
    console.log(`🔍 Test: ${testCase.name}`);
    console.log(`💬 Message: "${testCase.message}"`);
    
    try {
      const result = await processFunctionCall(testCase.message);
      
      console.log(`📊 Response Type: ${result.type}`);
      
      if (result.type === 'function_call') {
        console.log(`🔧 Functions Called: ${result.functionCalls?.length || 0}`);
        result.functionCalls?.forEach(call => {
          console.log(`   - ${call.name} with args:`, JSON.stringify(call.args, null, 2));
        });
        console.log(`💭 Final Response: ${result.finalResponse?.substring(0, 200)}...`);
      } else {
        console.log(`💭 Text Response: ${result.content?.substring(0, 200)}...`);
      }
      
    } catch (error) {
      console.error(`❌ Error: ${error}`);
    }
    
    console.log('\n' + '='.repeat(80) + '\n');
  }
}

testFunctionCalling().catch(console.error);
