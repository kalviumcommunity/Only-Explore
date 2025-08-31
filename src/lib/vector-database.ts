// src/lib/vector-database.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Pinecone client initialization (will be imported when needed)
let pineconeClient: any = null;

export interface VectorDBConfig {
  provider: 'pinecone' | 'weaviate' | 'local';
  indexName?: string;
  namespace?: string;
}

export interface TravelDocument {
  id: string;
  title: string;
  content: string;
  category: string;
  location: string;
  tags: string[];
  metadata?: Record<string, any>;
}

export interface VectorSearchResult {
  id: string;
  score: number;
  title: string;
  content: string;
  metadata?: Record<string, any>;
}

// Initialize Pinecone client
async function initializePinecone(): Promise<any> {
  if (!pineconeClient) {
    try {
      const { PineconeClient } = await import('@pinecone-database/pinecone');
      pineconeClient = new PineconeClient();
      await pineconeClient.init({
        apiKey: process.env.PINECONE_API_KEY!,
        environment: process.env.PINECONE_ENVIRONMENT || 'us-west1-gcp'
      });
    } catch (error) {
      console.error('Pinecone initialization failed:', error);
      throw new Error('Pinecone client not available. Install @pinecone-database/pinecone package.');
    }
  }
  return pineconeClient;
}

// Generate embeddings using Gemini
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

// Sample travel destinations for demonstration
export const sampleTravelDestinations: TravelDocument[] = [
  {
    id: 'dest_001',
    title: 'Goa Beach Paradise',
    content: 'Beautiful beaches, vibrant nightlife, Portuguese heritage, water sports, beach shacks, and tropical paradise atmosphere',
    category: 'beach',
    location: 'Goa, India',
    tags: ['beach', 'nightlife', 'heritage', 'water sports', 'tropical'],
    metadata: { country: 'India', region: 'Western', budget: 'mid-range' }
  },
  {
    id: 'dest_002',
    title: 'Manali Mountain Adventure',
    content: 'Snow-capped peaks, adventure trekking, river rafting, paragliding, romantic hill station, and scenic mountain views',
    category: 'mountain',
    location: 'Manali, India',
    tags: ['mountains', 'adventure', 'trekking', 'romantic', 'scenic'],
    metadata: { country: 'India', region: 'Northern', budget: 'budget' }
  },
  {
    id: 'dest_003',
    title: 'Kyoto Traditional Culture',
    content: 'Ancient temples, traditional ceremonies, zen gardens, cultural heritage, spiritual experiences, and Japanese authenticity',
    category: 'culture',
    location: 'Kyoto, Japan',
    tags: ['temples', 'culture', 'traditional', 'spiritual', 'heritage'],
    metadata: { country: 'Japan', region: 'Kansai', budget: 'luxury' }
  },
  {
    id: 'dest_004',
    title: 'Swiss Alps Luxury',
    content: 'Pristine Alpine scenery, luxury mountain resorts, skiing, scenic train rides, romantic chalets, and breathtaking views',
    category: 'mountain',
    location: 'Swiss Alps, Switzerland',
    tags: ['alpine', 'luxury', 'skiing', 'scenic', 'romantic'],
    metadata: { country: 'Switzerland', region: 'Central Europe', budget: 'luxury' }
  },
  {
    id: 'dest_005',
    title: 'Bali Tropical Island',
    content: 'Tropical beaches, Hindu temples, rice terraces, yoga retreats, vibrant culture, and island paradise atmosphere',
    category: 'beach',
    location: 'Bali, Indonesia',
    tags: ['tropical', 'temples', 'yoga', 'culture', 'island'],
    metadata: { country: 'Indonesia', region: 'Southeast Asia', budget: 'mid-range' }
  }
];

// Vector Database abstraction class
export class VectorDatabase {
  private config: VectorDBConfig;
  private client: any;

  constructor(config: VectorDBConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    switch (this.config.provider) {
      case 'pinecone':
        this.client = await initializePinecone();
        break;
      case 'weaviate':
        // Weaviate initialization would go here
        throw new Error('Weaviate integration not implemented yet');
      case 'local':
        // Local vector storage (using in-memory for demo)
        this.client = new Map();
        break;
      default:
        throw new Error(`Unsupported vector database provider: ${this.config.provider}`);
    }
  }

  async upsertDocuments(documents: TravelDocument[]): Promise<void> {
    console.log(`📤 Upserting ${documents.length} documents to ${this.config.provider}`);

    if (this.config.provider === 'pinecone') {
      const index = this.client.Index(this.config.indexName || 'only-explore-travel');
      
      // Generate embeddings and prepare vectors for upsert
      const vectors = [];
      for (const doc of documents) {
        const text = `${doc.title} ${doc.content} ${doc.tags.join(' ')}`;
        const embedding = await generateEmbedding(text);
        
        if (embedding.length > 0) {
          vectors.push({
            id: doc.id,
            values: embedding,
            metadata: {
              title: doc.title,
              content: doc.content,
              category: doc.category,
              location: doc.location,
              tags: doc.tags,
              ...doc.metadata
            }
          });
        }
      }

      // Upsert in batches of 100 (Pinecone limit)
      const batchSize = 100;
      for (let i = 0; i < vectors.length; i += batchSize) {
        const batch = vectors.slice(i, i + batchSize);
        await index.upsert({
          upsertRequest: {
            vectors: batch,
            namespace: this.config.namespace || 'travel-destinations'
          }
        });
        console.log(`✅ Upserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(vectors.length / batchSize)}`);
      }
    } else if (this.config.provider === 'local') {
      // Local storage implementation
      for (const doc of documents) {
        const text = `${doc.title} ${doc.content} ${doc.tags.join(' ')}`;
        const embedding = await generateEmbedding(text);
        this.client.set(doc.id, { ...doc, embedding });
      }
    }
  }

  async searchSimilar(query: string, topK: number = 5, filter?: Record<string, any>): Promise<VectorSearchResult[]> {
    console.log(`🔍 Searching for: "${query}" (top ${topK})`);

    if (this.config.provider === 'pinecone') {
      const queryEmbedding = await generateEmbedding(query);
      if (queryEmbedding.length === 0) {
        return [];
      }

      const index = this.client.Index(this.config.indexName || 'only-explore-travel');
      const queryResponse = await index.query({
        queryRequest: {
          vector: queryEmbedding,
          topK,
          includeMetadata: true,
          namespace: this.config.namespace || 'travel-destinations',
          ...(filter && { filter })
        }
      });

      return queryResponse.matches?.map((match: any) => ({
        id: match.id,
        score: match.score,
        title: match.metadata?.title || '',
        content: match.metadata?.content || '',
        metadata: match.metadata
      })) || [];

    } else if (this.config.provider === 'local') {
      const queryEmbedding = await generateEmbedding(query);
      const results: VectorSearchResult[] = [];

      // Simple cosine similarity for local implementation
      for (const [id, doc] of this.client.entries()) {
        if (doc.embedding) {
          const similarity = this.calculateCosineSimilarity(queryEmbedding, doc.embedding);
          results.push({
            id,
            score: similarity,
            title: doc.title,
            content: doc.content,
            metadata: doc.metadata
          });
        }
      }

      return results
        .sort((a, b) => b.score - a.score)
        .slice(0, topK);
    }

    return [];
  }

  async deleteDocuments(ids: string[]): Promise<void> {
    console.log(`🗑️ Deleting ${ids.length} documents from ${this.config.provider}`);

    if (this.config.provider === 'pinecone') {
      const index = this.client.Index(this.config.indexName || 'only-explore-travel');
      await index.delete1({
        ids,
        namespace: this.config.namespace || 'travel-destinations'
      });
    } else if (this.config.provider === 'local') {
      ids.forEach(id => this.client.delete(id));
    }
  }

  async getStats(): Promise<any> {
    if (this.config.provider === 'pinecone') {
      const index = this.client.Index(this.config.indexName || 'only-explore-travel');
      return await index.describeIndexStats();
    } else if (this.config.provider === 'local') {
      return {
        totalVectorCount: this.client.size,
        namespaces: { 'local': { vectorCount: this.client.size } }
      };
    }
    return {};
  }

  private calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) return 0;

    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      magnitudeA += vecA[i] * vecA[i];
      magnitudeB += vecB[i] * vecB[i];
    }

    magnitudeA = Math.sqrt(magnitudeA);
    magnitudeB = Math.sqrt(magnitudeB);

    if (magnitudeA === 0 || magnitudeB === 0) return 0;
    return dotProduct / (magnitudeA * magnitudeB);
  }
}

// Factory function to create vector database instances
export function createVectorDatabase(config: VectorDBConfig): VectorDatabase {
  return new VectorDatabase(config);
}

// Comparison function for different vector databases
export async function compareVectorDatabases(query: string): Promise<{
  pinecone?: VectorSearchResult[];
  local: VectorSearchResult[];
  comparison: string;
}> {
  const results: any = {};

  // Local vector database
  const localDB = createVectorDatabase({ provider: 'local' });
  await localDB.initialize();
  await localDB.upsertDocuments(sampleTravelDestinations);
  results.local = await localDB.searchSimilar(query, 3);

  // Pinecone (if configured)
  if (process.env.PINECONE_API_KEY) {
    try {
      const pineconeDB = createVectorDatabase({ 
        provider: 'pinecone',
        indexName: 'only-explore-travel',
        namespace: 'travel-destinations'
      });
      await pineconeDB.initialize();
      results.pinecone = await pineconeDB.searchSimilar(query, 3);
    } catch (error) {
      console.error('Pinecone comparison failed:', error);
      results.pinecone = [];
    }
  }

  return {
    ...results,
    comparison: 'Local provides quick prototyping while Pinecone offers production-scale performance'
  };
}
