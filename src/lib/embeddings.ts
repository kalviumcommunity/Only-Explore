// src/lib/embeddings.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

// Initialize clients
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const supabase = createClient(
  process.env.DATABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface TravelDoc {
  id?: number;
  title: string;
  content: string;
  metadata?: Record<string, any>;
  embedding?: number[];
  similarity?: number;
}

/**
 * Generate normalized embeddings using Gemini's text-embedding-004 model
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const model = genAI.getGenerativeModel({ 
      model: "text-embedding-004",
    });

    const result = await model.embedContent(text);
    const embedding = result.embedding.values;
    
    if (!embedding || embedding.length === 0) {
      throw new Error('Empty embedding received');
    }

    return normalizeVector(embedding);
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

/**
 * Normalize vector for cosine similarity
 */
function normalizeVector(vector: number[]): number[] {
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  if (magnitude === 0) return vector;
  return vector.map(val => val / magnitude);
}

/**
 * Seed the database with sample travel documents
 */
export async function seedTravelDocs(): Promise<void> {
  const sampleDocs: Omit<TravelDoc, 'id'>[] = [
    {
      title: 'Explore Bali: Temples, Beaches & Culture',
      content: 'Bali offers stunning beaches like Seminyak and Nusa Dua, ancient temples including Tanah Lot and Uluwatu, traditional markets in Ubud, volcano hikes at Mount Batur, and rich Balinese Hindu culture with traditional dance performances and ceremonies.',
      metadata: { 
        region: 'Indonesia', 
        type: 'destination', 
        keywords: ['beaches', 'temples', 'culture', 'volcano'] 
      }
    },
    {
      title: 'Paris Spring Itinerary: 5 Days of Romance',
      content: 'Day 1: Arrive and explore Montmartre, visit Sacré-Cœur. Day 2: Louvre Museum and Seine river cruise. Day 3: Eiffel Tower, Champs-Élysées shopping. Day 4: Versailles day trip. Day 5: Latin Quarter cafes, Notre-Dame area, departure. Budget: €800-1200 per person.',
      metadata: { 
        region: 'France', 
        type: 'itinerary', 
        days: 5, 
        season: 'spring',
        budget_range: '800-1200_EUR'
      }
    },
    {
      title: 'Tokyo Food Adventure: Sushi to Street Food',
      content: 'Start with Tsukiji Outer Market for fresh sushi breakfast, explore Shibuya for ramen shops, visit Harajuku for crepes and unique snacks, experience Shinjuku yakitori alleys, end at high-end tempura in Ginza. Must-try: conveyor belt sushi, takoyaki, taiyaki, and authentic wagyu.',
      metadata: { 
        region: 'Japan', 
        type: 'food',
        keywords: ['sushi', 'ramen', 'street food', 'wagyu']
      }
    },
    {
      title: 'New York City Must-See Attractions',
      content: 'Visit Times Square for Broadway shows, Central Park for leisure walks, Statue of Liberty and Ellis Island, Empire State Building observation deck, 9/11 Memorial, Brooklyn Bridge walk, Metropolitan Museum, and take subway to explore diverse neighborhoods like Greenwich Village.',
      metadata: { 
        region: 'USA', 
        type: 'destination',
        keywords: ['landmarks', 'museums', 'broadway', 'neighborhoods']
      }
    },
    {
      title: 'Kenya Safari: Wildlife & Great Migration',
      content: 'Experience Big Five animals in Maasai Mara, witness Great Migration (July-October), visit Amboseli for elephant herds with Mount Kilimanjaro backdrop, explore Samburu for unique species, stay in safari lodges, interact with Maasai communities, and capture stunning wildlife photography.',
      metadata: { 
        region: 'Kenya', 
        type: 'adventure',
        season: 'dry_season',
        keywords: ['safari', 'wildlife', 'migration', 'photography']
      }
    }
  ];

  console.log('Generating embeddings and seeding database...');
  
  for (const doc of sampleDocs) {
    try {
      const embedding = await generateEmbedding(doc.content);
      
      const { data, error } = await supabase
        .from('travel_docs')
        .insert({
          title: doc.title,
          content: doc.content,
          metadata: doc.metadata,
          embedding: `[${embedding.join(',')}]`
        })
        .select();

      if (error) {
        console.error(`Error inserting "${doc.title}":`, error);
      } else {
        console.log(`✅ Seeded: ${doc.title}`);
      }
    } catch (error) {
      console.error(`Failed to process "${doc.title}":`, error);
    }
  }
}

/**
 * Search travel documents using semantic similarity
 */
export async function searchTravelDocs(
  query: string, 
  topK: number = 5
): Promise<TravelDoc[]> {
  try {
    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query);
    
    // Execute semantic search using the RPC function
    const { data, error } = await supabase
      .rpc('search_travel_docs', {
        embedding_param: `[${queryEmbedding.join(',')}]`,
        limit_param: topK
      });

    if (error) {
      console.error('Search error:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in searchTravelDocs:', error);
    throw error;
  }
}
