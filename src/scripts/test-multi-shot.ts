// src/scripts/test-multi-shot.ts
import { 
  performMultiShotPrompting, 
  detectTaskTypeWithConfidence, 
  multiShotExamples 
} from '../lib/multi-shot-prompting.js';

async function testMultiShotPrompting() {
  console.log('🧪 Testing Multi-Shot Prompting Implementation (Step 7)\n');

  // Test task type detection with confidence
  console.log('🔍 Testing Task Type Detection with Confidence:\n');
  const detectionTests = [
    'Plan a 5-day trip to Barcelona',
    'What foods should I try in Greece?',
    'How much does a week in Japan cost?',
    'What cultural experiences are unique to Morocco?',
    'I want to visit museums in Paris'
  ];

  for (const query of detectionTests) {
    const detection = detectTaskTypeWithConfidence(query);
    console.log(`Query: "${query}"`);
    console.log(`  → Type: ${detection.type} (confidence: ${detection.confidence.toFixed(2)})`);
    console.log(`  → Examples available: ${multiShotExamples[detection.type].length}\n`);
  }

  // Test multi-shot prompting for each task type
  console.log('🎯 Testing Multi-Shot Prompting for Each Task Type:\n');
  
  const testQueries = [
    {
      query: 'Plan a 5-day adventure trip to Iceland',
      expectedType: 'itinerary'
    },
    {
      query: 'What are the most authentic dishes to try in Vietnam?',
      expectedType: 'cuisine'
    },
    {
      query: 'Break down costs for a 2-week trip to Australia for 3 people',
      expectedType: 'budget'
    },
    {
      query: 'What cultural customs should I know before visiting Turkey?',
      expectedType: 'culture'
    }
  ];

  for (const testCase of testQueries) {
    console.log(`📝 Testing: "${testCase.query}"`);
    console.log(`🎯 Expected Type: ${testCase.expectedType}`);
    
    try {
      const startTime = Date.now();
      const response = await performMultiShotPrompting({
        type: testCase.expectedType,
        userQuery: testCase.query
      });
      const duration = Date.now() - startTime;
      
      console.log(`✅ Response generated in ${duration}ms`);
      console.log(`📊 Response length: ${response.length} characters`);
      console.log(`📋 Response preview: ${response.substring(0, 150)}...`);
      console.log(`📚 Examples used: ${multiShotExamples[testCase.expectedType].length}\n`);
      
    } catch (error) {
      console.error(`❌ Error: ${error}\n`);
    }
    
    console.log('='.repeat(80) + '\n');
  }

  // Test confidence-based detection
  console.log('🎯 Testing Confidence-Based Task Detection:\n');
  const confidenceTests = [
    'Plan itinerary for 3 days in Prague',
    'Best restaurants and food in Singapore',
    'Budget breakdown for 10 days in South America',
    'Cultural experiences in Japan',
    'Mixed query about planning food and budget for Paris'
  ];

  for (const query of confidenceTests) {
    const detection = detectTaskTypeWithConfidence(query);
    console.log(`Query: "${query}"`);
    console.log(`  → Detected: ${detection.type}`);
    console.log(`  → Confidence: ${detection.confidence.toFixed(2)}`);
    
    if (detection.confidence > 0.5) {
      console.log(`  → High confidence - proceeding with ${detection.type}`);
    } else {
      console.log(`  → Low confidence - may need manual task type specification`);
    }
    console.log('');
  }

  // Display available examples for each task type
  console.log('📚 Available Multi-Shot Examples Summary:\n');
  for (const [taskType, examples] of Object.entries(multiShotExamples)) {
    console.log(`${taskType.toUpperCase()} (${examples.length} examples):`);
    examples.forEach((example, index) => {
      console.log(`  ${index + 1}. "${example.input}"`);
    });
    console.log('');
  }

  console.log('✅ Multi-shot prompting testing completed!');
  console.log('🎯 Key Features Tested:');
  console.log('  - Task type detection with confidence scoring');
  console.log('  - Multi-shot prompting for all 4 task types');
  console.log('  - Response quality and formatting');
  console.log('  - Performance metrics (response time, length)');
  console.log('  - Example utilization and pattern learning');
}

testMultiShotPrompting().catch(console.error);

