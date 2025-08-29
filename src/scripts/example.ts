// src/scripts/example.ts
import { searchTravelDocs, seedTravelDocs } from '../lib/embeddings.js';

async function runExample() {
  console.log('🌍 Only Explore - Semantic Search Example\n');

  // First, seed the database
  console.log('1. Seeding database...');
  await seedTravelDocs();
  
  console.log('\n2. Testing semantic search...\n');

  const queries = [
    'tropical beach vacation',
    'European city cultural trip', 
    'Asian food experience',
    'wildlife safari adventure'
  ];

  for (const query of queries) {
    console.log(`🔍 Query: "${query}"`);
    const results = await searchTravelDocs(query, 3);
    
    results.forEach((doc, index) => {
      console.log(`  ${index + 1}. ${doc.title} (similarity: ${doc.similarity?.toFixed(3)})`);
      console.log(`     ${doc.content.substring(0, 100)}...\n`);
    });
    console.log('---\n');
  }
}

runExample().catch(console.error);
