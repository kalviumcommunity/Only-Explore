// src/scripts/test-one-shot.ts
import { performOneShotPrompting, detectTaskType, oneShotExamples } from '../lib/one-shot-prompting.js';

async function testOneShotPrompting() {
  console.log('🧪 Testing One-Shot Prompting Implementation (Step 6)\n');

  const testQueries = [
    {
      name: 'Itinerary Planning',
      query: 'Plan a 4-day romantic trip to Paris',
      expectedType: 'itinerary'
    },
    {
      name: 'Cuisine Recommendation',
      query: 'What foods should I try in Italy?',
      expectedType: 'cuisine'
    },
    {
      name: 'Budget Breakdown',
      query: 'How much does a week in Thailand cost?',
      expectedType: 'budget'
    },
    {
      name: 'Cultural Experience',
      query: 'What cultural experiences are unique to India?',
      expectedType: 'culture'
    },
    {
      name: 'General Travel Query',
      query: 'Plan 5 days in Tokyo with focus on technology and food',
      expectedType: 'itinerary'
    }
  ];

  // Test task type detection
  console.log('🔍 Testing Task Type Detection:\n');
  for (const testCase of testQueries) {
    const detectedType = detectTaskType(testCase.query);
    const isCorrect = detectedType === testCase.expectedType;
    console.log(`📝 Query: "${testCase.query}"`);
    console.log(`🎯 Detected: ${detectedType} | Expected: ${testCase.expectedType} | ✅ ${isCorrect ? 'Correct' : '❌ Incorrect'}\n`);
  }

  // Test one-shot prompting
  console.log('🎯 Testing One-Shot Prompting:\n');
  for (const testCase of testQueries) {
    console.log(`📋 Test: ${testCase.name}`);
    console.log(`💬 Query: "${testCase.query}"`);
    console.log(`🎯 Task Type: ${testCase.expectedType}`);
    console.log(`📚 Example Used: "${oneShotExamples[testCase.expectedType].input}"`);
    
    try {
      const startTime = Date.now();
      const response = await performOneShotPrompting({
        type: testCase.expectedType,
        userQuery: testCase.query
      });
      const duration = Date.now() - startTime;
      
      console.log(`⏱️  Processing Time: ${duration}ms`);
      console.log(`📄 Response Length: ${response.length} characters`);
      console.log(`💭 Response Preview: ${response.substring(0, 200)}...\n`);
      
    } catch (error) {
      console.error(`❌ Error: ${error}\n`);
    }
    
    console.log('='.repeat(80) + '\n');
  }

  // Test all task types
  console.log('🎨 Testing All Task Types:\n');
  const taskTypes = ['itinerary', 'cuisine', 'budget', 'culture'] as const;
  
  for (const taskType of taskTypes) {
    console.log(`🎯 Testing ${taskType.toUpperCase()} Task Type:`);
    console.log(`📚 Example: "${oneShotExamples[taskType].input}"`);
    console.log(`📝 Output Format:`);
    console.log(oneShotExamples[taskType].output);
    console.log('\n' + '-'.repeat(60) + '\n');
  }

  console.log('✅ One-shot prompting test completed!');
}

testOneShotPrompting().catch(console.error);
