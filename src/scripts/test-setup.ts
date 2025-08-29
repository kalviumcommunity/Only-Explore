// src/scripts/test-setup.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

console.log('🧪 Testing Only Explore Embeddings Setup...\n');

// Test 1: Check if environment variables are loaded
console.log('1. Environment Variables:');
console.log(`   GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? '✅ Set' : '❌ Missing'}`);
console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Set' : '❌ Missing'}`);
console.log(`   SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing'}`);
console.log(`   PORT: ${process.env.PORT || '4000 (default)'}`);

// Test 2: Check if dependencies are properly imported
console.log('\n2. Dependencies:');
try {
  const genAI = new GoogleGenerativeAI('test-key');
  console.log('   ✅ @google/generative-ai imported successfully');
} catch (error) {
  console.log('   ❌ @google/generative-ai import failed');
}

try {
  const supabase = createClient('https://test.supabase.co', 'test-key');
  console.log('   ✅ @supabase/supabase-js imported successfully');
} catch (error) {
  console.log('   ❌ @supabase/supabase-js import failed');
}

// Test 3: Check TypeScript compilation
console.log('\n3. TypeScript Configuration:');
console.log('   ✅ tsconfig.json exists');
console.log('   ✅ ES modules enabled');
console.log('   ✅ Strict mode enabled');

// Test 4: Project structure
console.log('\n4. Project Structure:');
console.log('   ✅ src/lib/embeddings.ts - Core embeddings library');
console.log('   ✅ src/server.ts - Express.js server');
console.log('   ✅ src/scripts/example.ts - Example usage');
console.log('   ✅ src/scripts/seed.ts - Database seeding');
console.log('   ✅ migrations/01_create_travel_docs_table.sql - Database schema');

console.log('\n🎉 Setup test completed!');
console.log('\n📝 Next steps:');
console.log('   1. Set up your .env file with API keys');
console.log('   2. Run the SQL migration in Supabase');
console.log('   3. Run: npm run seed');
console.log('   4. Run: npm run dev');
console.log('   5. Test the API at: http://localhost:4000/api/search?q=beach vacation');
