// src/scripts/test-vector-database.ts
import { 
  createVectorDatabase, 
  sampleTravelDestinations,
  compareVectorDatabases 
} from '../lib/vector-database.js';

async function testVectorDatabase() {
  console.log('🧪 Testing Vector Database Integration (Step 17)');
  console.log('=' .repeat(60));

  try {
    // Test 1: Initialize local vector database
    console.log('\n1️⃣ Initializing local vector database...');
    const vectorDB = createVectorDatabase({ provider: 'local' });
    await vectorDB.initialize();
    console.log('✅ Local vector database initialized successfully');

    // Test 2: Upsert sample documents
    console.log('\n2️⃣ Upserting sample travel destinations...');
    await vectorDB.upsertDocuments(sampleTravelDestinations);
    console.log(`✅ Upserted ${sampleTravelDestinations.length} travel destinations`);

    // Test 3: Get database statistics
    console.log('\n3️⃣ Getting database statistics...');
    const stats = await vectorDB.getStats();
    console.log('📊 Database Stats:', JSON.stringify(stats, null, 2));

    // Test 4: Search similar destinations
    console.log('\n4️⃣ Testing vector search...');
    const searchQueries = [
      'romantic beach destination with nightlife',
      'mountain adventure with trekking and snow',
      'traditional cultural temples and spirituality',
      'luxury alpine skiing resort experience'
    ];

    for (const query of searchQueries) {
      console.log(`\n🔍 Searching for: "${query}"`);
      const results = await vectorDB.searchSimilar(query, 3);
      
      console.log('Results:');
      results.forEach((result, index) => {
        console.log(`  ${index + 1}. ${result.title} (Score: ${result.score.toFixed(4)})`);
        console.log(`     Category: ${result.metadata?.category}, Location: ${result.metadata?.location}`);
      });
    }

    // Test 5: Compare vector databases
    console.log('\n5️⃣ Testing vector database comparison...');
    const comparison = await compareVectorDatabases('luxury mountain resort with skiing');
    console.log('Comparison Results:');
    console.log('Local Results:', comparison.local.map(r => `${r.title} (${r.score.toFixed(4)})`));
    if (comparison.pinecone) {
      console.log('Pinecone Results:', comparison.pinecone.map(r => `${r.title} (${r.score.toFixed(4)})`));
    }
    console.log('Comparison Summary:', comparison.comparison);

    // Test 6: Sample destinations overview
    console.log('\n6️⃣ Sample Travel Destinations:');
    sampleTravelDestinations.forEach((dest, index) => {
      console.log(`  ${index + 1}. ${dest.title}`);
      console.log(`     Location: ${dest.location}`);
      console.log(`     Category: ${dest.category}`);
      console.log(`     Tags: ${dest.tags.join(', ')}`);
      console.log(`     Budget: ${dest.metadata?.budget || 'Not specified'}`);
    });

    console.log('\n🎉 Vector Database Integration Test Completed Successfully!');
    console.log('\n📋 Test Summary:');
    console.log('✅ Local vector database initialization');
    console.log('✅ Document upserting with embeddings');
    console.log('✅ Vector similarity search');
    console.log('✅ Database statistics retrieval');
    console.log('✅ Provider comparison functionality');
    console.log('✅ Sample travel destinations integration');

    console.log('\n🚀 Ready for production use with:');
    console.log('   - Pinecone for enterprise-scale deployments');
    console.log('   - Weaviate for open-source flexibility');
    console.log('   - Local storage for development and testing');

  } catch (error) {
    console.error('❌ Vector Database Test Failed:', error);
    process.exit(1);
  }
}

// Run the test
testVectorDatabase().catch(console.error);
