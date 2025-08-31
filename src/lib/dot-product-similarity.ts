// src/lib/dot-product-similarity.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import { searchTravelDocs } from './embeddings.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface DotProductConfig {
  query: string;
  documents?: TravelDocument[];
  threshold?: number;
  topK?: number;
  normalizeVectors?: boolean;
}

export interface TravelDocument {
  id: string;
  title: string;
  content: string;
  category: string;
  location: string;
  tags: string[];
  embedding?: number[];
}

export interface SimilarityResult {
  id: string;
  title: string;
  content: string;
  category: string;
  location: string;
  similarity: number;
  metadata?: any;
}

// Enhanced travel document database for demonstration
export const travelDocuments: TravelDocument[] = [
  {
    id: '1',
    title: 'Goa Beach Nightlife Paradise',
    content: 'Beautiful beaches with vibrant nightlife, beach clubs, sunset parties, water sports, Portuguese heritage, and bustling night markets',
    category: 'beach',
    location: 'Goa, India',
    tags: ['beach', 'nightlife', 'parties', 'water sports', 'heritage']
  },
  {
    id: '2',
    title: 'Pondicherry French Colonial Beaches',
    content: 'Serene beaches with French colonial architecture, quiet promenades, spiritual retreats, yoga centers, and peaceful coastal dining',
    category: 'beach',
    location: 'Pondicherry, India',
    tags: ['beach', 'colonial', 'peaceful', 'spiritual', 'french']
  },
  {
    id: '3',
    title: 'Rome Ancient History Walking Tour',
    content: 'Explore Colosseum, Roman Forum, ancient ruins, historical monuments, Vatican City, classical architecture, and cultural heritage sites',
    category: 'history',
    location: 'Rome, Italy',
    tags: ['history', 'ancient', 'monuments', 'culture', 'walking']
  },
  {
    id: '4',
    title: 'Florence Renaissance Art and Culture',
    content: 'Renaissance masterpieces, Uffizi Gallery, Michelangelo sculptures, cultural museums, artistic heritage, and traditional Tuscan cuisine',
    category: 'culture',
    location: 'Florence, Italy',
    tags: ['art', 'renaissance', 'culture', 'museums', 'cuisine']
  },
  {
    id: '5',
    title: 'Kerala Backwater Houseboat Experience',
    content: 'Peaceful backwater cruises, traditional houseboats, coconut lagoons, local fishing villages, authentic Kerala cuisine, and nature immersion',
    category: 'nature',
    location: 'Kerala, India',
    tags: ['backwaters', 'houseboat', 'nature', 'authentic', 'peaceful']
  },
  {
    id: '6',
    title: 'Mumbai Street Food Night Markets',
    content: 'Vibrant night markets, diverse street food, local snacks, bustling crowds, cultural experiences, and authentic flavors',
    category: 'food',
    location: 'Mumbai, India',
    tags: ['street food', 'night markets', 'authentic', 'vibrant', 'local']
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

// Calculate dot product between two vectors
export function calculateDotProduct(vectorA: number[], vectorB: number[]): number {
  if (vectorA.length !== vectorB.length) {
    throw new Error('Vectors must have the same length for dot product calculation');
  }

  let dotProduct = 0;
  for (let i = 0; i < vectorA.length; i++) {
    dotProduct += vectorA[i] * vectorB[i];
  }

  return dotProduct;
}

// Normalize vector to unit length
export function normalizeVector(vector: number[]): number[] {
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  if (magnitude === 0) return vector;
  return vector.map(val => val / magnitude);
}

// Find similar documents using dot product similarity
export async function findSimilarDocumentsDotProduct(config: DotProductConfig): Promise<SimilarityResult[]> {
  try {
    console.log(`🔍 Dot product similarity search for: "${config.query}"`);

    // Generate embedding for user query
    const queryEmbedding = await generateEmbedding(config.query);
    
    if (queryEmbedding.length === 0) {
      throw new Error('Failed to generate query embedding');
    }

    // Normalize query vector if requested
    const normalizedQueryEmbedding = config.normalizeVectors 
      ? normalizeVector(queryEmbedding) 
      : queryEmbedding;

    // Calculate similarities with all documents
    const results: SimilarityResult[] = [];
    const documents = config.documents || travelDocuments;
    
    for (const doc of documents) {
      // Generate embedding for document if not cached
      if (!doc.embedding) {
        const docText = `${doc.title} ${doc.content} ${doc.tags.join(' ')}`;
        doc.embedding = await generateEmbedding(docText);
      }
      
      if (doc.embedding && doc.embedding.length > 0) {
        // Normalize document vector if requested
        const normalizedDocEmbedding = config.normalizeVectors 
          ? normalizeVector(doc.embedding) 
          : doc.embedding;

        const similarity = calculateDotProduct(normalizedQueryEmbedding, normalizedDocEmbedding);
        
        // Apply threshold filtering
        if (similarity >= (config.threshold || 0.1)) {
          results.push({
            id: doc.id,
            title: doc.title,
            content: doc.content,
            category: doc.category,
            location: doc.location,
            similarity,
            metadata: {
              tags: doc.tags,
              normalized: config.normalizeVectors || false
            }
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
    console.error('Error in dot product similarity search:', error);
    throw error;
  }
}

// Compare dot product vs cosine similarity
export async function compareDotProductVsCosine(query: string): Promise<{
  dotProduct: SimilarityResult[];
  cosine: SimilarityResult[];
  comparison: string;
  analysis: any;
}> {
  // Dot product similarity (normalized vectors for fair comparison)
  const dotProductResults = await findSimilarDocumentsDotProduct({
    query,
    normalizeVectors: true,
    topK: 5
  });

  // Cosine similarity (using existing cosine similarity function)
  const { findSimilarDestinations } = await import('./cosine-similarity.js');
  const cosineResults = await findSimilarDestinations({
    query,
    threshold: 0.1,
    topK: 5
  });

  // Analysis of differences
  const analysis = {
    dotProductAverage: dotProductResults.reduce((sum, r) => sum + r.similarity, 0) / dotProductResults.length,
    cosineAverage: cosineResults.reduce((sum, r) => sum + (r.similarity || 0), 0) / cosineResults.length,
    topResultMatch: dotProductResults[0]?.id === cosineResults[0]?.id,
    rankingDifferences: dotProductResults.map((dpResult, index) => {
      const cosineIndex = cosineResults.findIndex(cr => cr.id === dpResult.id);
      return {
        document: dpResult.title,
        dotProductRank: index + 1,
        cosineRank: cosineIndex + 1,
        rankDifference: Math.abs(index - cosineIndex)
      };
    })
  };

  return {
    dotProduct: dotProductResults,
    cosine: cosineResults.map(r => ({
      id: r.id,
      title: r.title,
      content: r.content,
      category: r.metadata?.category || 'unknown',
      location: r.metadata?.location || 'unknown',
      similarity: r.similarity || 0,
      metadata: r.metadata
    })),
    comparison: 'Dot product on normalized vectors should approximate cosine similarity',
    analysis
  };
}

// Demonstrate different dot product scenarios
export function demonstrateDotProductScenarios(): {
  scenarios: Array<{
    name: string;
    vectorA: number[];
    vectorB: number[];
    dotProduct: number;
    interpretation: string;
  }>;
  explanation: string;
} {
  const scenarios = [
    {
      name: 'Perfect Match',
      vectorA: [1, 0, 0],
      vectorB: [1, 0, 0],
      dotProduct: 1,
      interpretation: 'Identical vectors - perfect similarity'
    },
    {
      name: 'Opposite Directions',
      vectorA: [1, 0, 0],
      vectorB: [-1, 0, 0],
      dotProduct: -1,
      interpretation: 'Opposite vectors - completely dissimilar'
    },
    {
      name: 'Orthogonal (Unrelated)',
      vectorA: [1, 0, 0],
      vectorB: [0, 1, 0],
      dotProduct: 0,
      interpretation: 'Perpendicular vectors - no similarity'
    },
    {
      name: 'Partial Similarity',
      vectorA: [0.8, 0.6, 0],
      vectorB: [0.6, 0.8, 0],
      dotProduct: 0.96,
      interpretation: 'Similar but not identical - moderate similarity'
    }
  ];

  // Calculate actual dot products
  scenarios.forEach(scenario => {
    scenario.dotProduct = calculateDotProduct(scenario.vectorA, scenario.vectorB);
  });

  return {
    scenarios,
    explanation: 'Dot product measures vector alignment: positive values indicate similarity, negative indicate opposition, zero indicates orthogonality'
  };
}

// Advanced dot product with weighted features
export async function performWeightedDotProduct(
  query: string,
  featureWeights: {
    title: number;
    content: number;
    tags: number;
    category: number;
  } = { title: 0.3, content: 0.4, tags: 0.2, category: 0.1 }
): Promise<{
  results: SimilarityResult[];
  methodology: string;
}> {
  console.log('🎯 Weighted dot product similarity with feature importance');

  // Generate query embedding
  const queryEmbedding = await generateEmbedding(query);
  const normalizedQuery = normalizeVector(queryEmbedding);

  const results: SimilarityResult[] = [];

  for (const doc of travelDocuments) {
    // Generate separate embeddings for different document features
    const titleEmbedding = normalizeVector(await generateEmbedding(doc.title));
    const contentEmbedding = normalizeVector(await generateEmbedding(doc.content));
    const tagsEmbedding = normalizeVector(await generateEmbedding(doc.tags.join(' ')));
    const categoryEmbedding = normalizeVector(await generateEmbedding(doc.category));

    // Calculate weighted dot product similarities
    const titleSim = calculateDotProduct(normalizedQuery, titleEmbedding) * featureWeights.title;
    const contentSim = calculateDotProduct(normalizedQuery, contentEmbedding) * featureWeights.content;
    const tagsSim = calculateDotProduct(normalizedQuery, tagsEmbedding) * featureWeights.tags;
    const categorySim = calculateDotProduct(normalizedQuery, categoryEmbedding) * featureWeights.category;

    const weightedSimilarity = titleSim + contentSim + tagsSim + categorySim;

    results.push({
      id: doc.id,
      title: doc.title,
      content: doc.content,
      category: doc.category,
      location: doc.location,
      similarity: weightedSimilarity,
      metadata: {
        titleSim,
        contentSim,
        tagsSim,
        categorySim,
        weights: featureWeights
      }
    });
  }

  // Sort by weighted similarity
  const sortedResults = results
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 5);

  return {
    results: sortedResults,
    methodology: 'Weighted dot product considers different importance of title, content, tags, and category features'
  };
}
