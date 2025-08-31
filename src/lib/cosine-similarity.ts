// src/lib/cosine-similarity.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import { searchTravelDocs } from './embeddings.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface SimilarityResult {
  id: string;
  title: string;
  content: string;
  metadata?: any;
  similarity: number;
  embedding?: number[];
}

export interface SimilarityConfig {
  query: string;
  documents?: any[];
  threshold?: number;
  topK?: number;
  useSemanticSearch?: boolean;
}

// Sample travel destinations with embeddings for demonstration
export const travelDestinations = [
  {
    id: '1',
    title: 'Eiffel Tower Evening Views',
    content: 'Romantic sunset views from the Eiffel Tower with sparkling lights at night, perfect for couples',
    category: 'romantic',
    location: 'Paris',
    tags: ['romantic', 'evening', 'views', 'couples', 'iconic']
  },
  {
    id: '2', 
    title: 'Seine River Dinner Cruise',
    content: 'Intimate dinner cruise along the Seine with city lights and French cuisine',
    category: 'romantic',
    location: 'Paris',
    tags: ['romantic', 'dinner', 'cruise', 'intimate', 'cuisine']
  },
  {
    id: '3',
    title: 'Louvre Museum Art Collection',
    content: 'World-famous art museum featuring Mona Lisa and classical masterpieces',
    category: 'culture',
    location: 'Paris',
    tags: ['art', 'museum', 'culture', 'history', 'masterpieces']
  },
  {
    id: '4',
    title: 'Bali Beach Sunsets',
    content: 'Tropical beach paradise with golden sunsets and crystal clear waters',
    category: 'beach',
    location: 'Bali',
    tags: ['beach', 'sunset', 'tropical', 'paradise', 'relaxation']
  },
  {
    id: '5',
    title: 'Tokyo Sushi Experience',
    content: 'Authentic sushi tasting at traditional Tokyo markets and high-end restaurants',
    category: 'food',
    location: 'Tokyo',
    tags: ['sushi', 'food', 'authentic', 'traditional', 'experience']
  }
];

// Generate embeddings for text
async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const result = await model.embedContent(text);
    return result.embedding.values || [];
  } catch (error) {
    console.error('Error generating embedding:', error);
    return [];
  }
}

// Calculate cosine similarity between two vectors
export function calculateCosineSimilarity(vectorA: number[], vectorB: number[]): number {
  if (vectorA.length !== vectorB.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < vectorA.length; i++) {
    dotProduct += vectorA[i] * vectorB[i];
    magnitudeA += vectorA[i] * vectorA[i];
    magnitudeB += vectorB[i] * vectorB[i];
  }

  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return dotProduct / (magnitudeA * magnitudeB);
}

// Find similar travel destinations using cosine similarity
export async function findSimilarDestinations(config: SimilarityConfig): Promise<SimilarityResult[]> {
  try {
    console.log(`🔍 Finding similar destinations for: "${config.query}"`);

    // If useSemanticSearch is true, use existing vector database
    if (config.useSemanticSearch) {
      const semanticResults = await searchTravelDocs(config.query, config.topK || 5);
      return semanticResults.map(doc => ({
        id: doc.id?.toString() || 'unknown',
        title: doc.title,
        content: doc.content,
        metadata: doc.metadata,
        similarity: doc.similarity || 0
      }));
    }

    // Generate embedding for user query
    const queryEmbedding = await generateEmbedding(config.query);
    
    if (queryEmbedding.length === 0) {
      throw new Error('Failed to generate query embedding');
    }

    // Calculate similarities with all destinations
    const results: SimilarityResult[] = [];
    
    for (const destination of travelDestinations) {
      // Generate embedding for destination content
      const destinationEmbedding = await generateEmbedding(
        `${destination.title} ${destination.content} ${destination.tags.join(' ')}`
      );
      
      if (destinationEmbedding.length > 0) {
        const similarity = calculateCosineSimilarity(queryEmbedding, destinationEmbedding);
        
        // Apply threshold filtering
        if (similarity >= (config.threshold || 0.1)) {
          results.push({
            id: destination.id,
            title: destination.title,
            content: destination.content,
            metadata: {
              category: destination.category,
              location: destination.location,
              tags: destination.tags
            },
            similarity,
            embedding: destinationEmbedding
          });
        }
      }
    }

    // Sort by similarity (highest first) and limit results
    const sortedResults = results
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, config.topK || 5);

    return sortedResults;

  } catch (error) {
    console.error('Error in similarity search:', error);
    throw error;
  }
}

// Advanced similarity matching with weighted factors
export async function performAdvancedSimilaritySearch(
  query: string,
  preferences?: {
    location?: string;
    category?: string;
    priceRange?: 'budget' | 'mid-range' | 'luxury';
    interests?: string[];
  }
): Promise<{
  results: SimilarityResult[];
  explanation: string;
  queryAnalysis: any;
}> {
  try {
    // Base similarity search
    const baseResults = await findSimilarDestinations({
      query,
      threshold: 0.3,
      topK: 10
    });

    // Apply preference-based boosting
    let enhancedResults = baseResults.map(result => {
      let boostedSimilarity = result.similarity;
      let boostFactors = [];

      // Location preference boost
      if (preferences?.location && result.metadata?.location?.toLowerCase().includes(preferences.location.toLowerCase())) {
        boostedSimilarity += 0.15;
        boostFactors.push('location match');
      }

      // Category preference boost
      if (preferences?.category && result.metadata?.category === preferences.category) {
        boostedSimilarity += 0.1;
        boostFactors.push('category match');
      }

      // Interest-based boost
      if (preferences?.interests) {
        const matchingInterests = preferences.interests.filter(interest =>
          result.metadata?.tags?.some((tag: string) => tag.toLowerCase().includes(interest.toLowerCase()))
        );
        if (matchingInterests.length > 0) {
          boostedSimilarity += matchingInterests.length * 0.05;
          boostFactors.push(`${matchingInterests.length} interest matches`);
        }
      }

      return {
        ...result,
        similarity: Math.min(boostedSimilarity, 1.0), // Cap at 1.0
        boostFactors
      };
    });

    // Re-sort with boosted similarities
    enhancedResults = enhancedResults
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5);

    const queryAnalysis = {
      originalQuery: query,
      preferences: preferences || {},
      totalResults: enhancedResults.length,
      averageSimilarity: enhancedResults.reduce((sum, r) => sum + r.similarity, 0) / enhancedResults.length
    };

    return {
      results: enhancedResults,
      explanation: `Found ${enhancedResults.length} similar destinations using cosine similarity with preference boosting`,
      queryAnalysis
    };

  } catch (error) {
    console.error('Error in advanced similarity search:', error);
    throw error;
  }
}

// Demonstrate similarity calculation with examples
export function demonstrateSimilarityCalculation(): {
  example: string;
  vectors: { query: number[]; destination: number[] };
  similarity: number;
  interpretation: string;
} {
  // Simple example with mock vectors for demonstration
  const queryVector = [0.8, 0.6, 0.1, 0.3, 0.7];
  const destinationVector = [0.7, 0.5, 0.2, 0.4, 0.8];
  
  const similarity = calculateCosineSimilarity(queryVector, destinationVector);
  
  let interpretation: string;
  if (similarity > 0.8) {
    interpretation = 'Very similar - highly relevant match';
  } else if (similarity > 0.6) {
    interpretation = 'Moderately similar - good match';
  } else if (similarity > 0.4) {
    interpretation = 'Somewhat similar - possible match';
  } else {
    interpretation = 'Low similarity - not very relevant';
  }

  return {
    example: 'Romantic Paris spots vs Eiffel Tower evening views',
    vectors: {
      query: queryVector,
      destination: destinationVector
    },
    similarity,
    interpretation
  };
}
