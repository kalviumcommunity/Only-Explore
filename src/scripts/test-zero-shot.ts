// src/scripts/test-zero-shot.ts
import { performZeroShotPrompting, travelZeroShotTasks } from '../lib/zero-shot-prompting.js';

async function testZeroShotPrompting() {
  console.log('🧪 Testing Zero-Shot Prompting Implementation (Step 5)\n');

  const customTasks = [
    {
      name: 'Romantic Paris Itinerary',
      task: 'Create a 5-day romantic itinerary for Paris including restaurants, activities, and hidden gems',
      context: 'Budget: $3000, anniversary trip, interested in art and wine'
    },
    {
      name: 'Budget Southeast Asia',
      task: 'Plan a 3-week backpacking trip through Thailand, Vietnam, and Cambodia on a tight budget',
      context: 'Budget: $1500 total, solo traveler, interested in culture and food'
    },
    {
      name: 'Family Japan Trip',
      task: 'Design a family-friendly 10-day Japan itinerary suitable for children aged 8 and 12',
      context: 'Budget: $5000, interested in technology, nature, and kid-friendly activities'
    }
  ];

  // Test predefined travel tasks
  console.log('📋 Testing Predefined Travel Tasks:\n');
  for (const taskConfig of travelZeroShotTasks) {
    console.log(`🎯 Task: ${taskConfig.task.substring(0, 80)}...`);
    console.log(`📝 Context: ${taskConfig.context || 'None'}`);
    
    try {
      const startTime = Date.now();
      const response = await performZeroShotPrompting(taskConfig);
      const duration = Date.now() - startTime;
      
      console.log(`⏱️  Processing Time: ${duration}ms`);
      console.log(`📄 Response Length: ${response.length} characters`);
      console.log(`💭 Response Preview: ${response.substring(0, 200)}...\n`);
      
    } catch (error) {
      console.error(`❌ Error: ${error}\n`);
    }
    
    console.log('='.repeat(80) + '\n');
  }

  // Test custom tasks
  console.log('🎨 Testing Custom Travel Tasks:\n');
  for (const customTask of customTasks) {
    console.log(`🎯 ${customTask.name}:`);
    console.log(`📝 Task: ${customTask.task}`);
    console.log(`🔍 Context: ${customTask.context}`);
    
    try {
      const startTime = Date.now();
      const response = await performZeroShotPrompting({
        task: customTask.task,
        context: customTask.context
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

  console.log('✅ Zero-shot prompting test completed!');
}

testZeroShotPrompting().catch(console.error);
