// src/scripts/seed.ts
import { seedTravelDocs } from '../lib/embeddings.js';

async function main() {
  console.log('Seeding Only Explore database with sample travel documents...\n');
  
  try {
    await seedTravelDocs();
    console.log('\n✅ Database seeding completed successfully!');
    console.log('🚀 You can now start the server with: npm run dev');
  } catch (error) {
    console.error('❌ Failed to seed database:', error);
    process.exit(1);
  }
}

main();
