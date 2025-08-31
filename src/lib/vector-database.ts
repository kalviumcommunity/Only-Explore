// src/lib/vector-database.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface VectorDocument {
  id: string;
  vector: number[];
  metadata: {
    title: string;
    content: string;
    category: string;
    location: string;
    tags: string[];
    type: 'destination' | 'review' | 'itinerary' | 'activity';
    rating?: number;
    price?: string;
    season?: string[];
    [key: string]: any;
  };
  timestamp: Date;
}

export interface VectorSearchConfig {
  query: string;
  topK?: number;
  threshold?: number;
  filters?: {
    category?: string[];
    location?: string[];
    type?: string[];
    price?: string[];
    season?: string[];
  };
  searchType?: 'similarity' | 'hybrid' | 'filtered';
}

export interface VectorSearchResult {
  id: string;
  score: number;
  metadata: VectorDocument['metadata'];
  vector?: number[];
  searchType: string;
}

export interface VectorDatabaseStats {
  totalDocuments: number;
  categories: Record<string, number>;
  locations: Record<string, number>;
  types: Record<string, number>;
  averageVectorDimension: number;
  indexSize: number;
}

// In-memory vector database simulation
class VectorDatabase {
  private documents: Map<string, VectorDocument> = new Map();
  private index: Map<string, number[]> = new Map(); // id -> vector
  private metadataIndex: Map<string, Set<string>> = new Map(); // field -> values

  constructor() {
    console.log('🗄️ Vector Database initialized');
  }

  // Add document to vector database
  async addDocument(document: Omit<VectorDocument, 'timestamp'>): Promise<void> {
    try {
      const docWithTimestamp: VectorDocument = {
        ...document,
        timestamp: new Date()
      };

      this.documents.set(document.id, docWithTimestamp);
      this.index.set(document.id, document.vector);
      
      // Update metadata index
      this.updateMetadataIndex(document.metadata);
      
      console.log(`📄 Added document ${document.id} to vector database`);
    } catch (error) {
      console.error('Error adding document to vector database:', error);
      throw error;
    }
  }

  // Update metadata index for filtering
  private updateMetadataIndex(metadata: VectorDocument['metadata']): void {
    const fields = ['category', 'location', 'type', 'price', 'season'];
    
    fields.forEach(field => {
      const value = metadata[field];
      if (value) {
        const fieldKey = `${field}_index`;
        if (!this.metadataIndex.has(fieldKey)) {
          this.metadataIndex.set(fieldKey, new Set());
        }
        
        if (Array.isArray(value)) {
          value.forEach(v => this.metadataIndex.get(fieldKey)!.add(v));
        } else {
          this.metadataIndex.get(fieldKey)!.add(value);
        }
      }
    });
  }

  // Search documents by vector similarity
  async search(config: VectorSearchConfig): Promise<VectorSearchResult[]> {
    try {
      console.log(`🔍 Vector database search: "${config.query}"`);
      
      // Generate query embedding
      const queryVector = await this.generateEmbedding(config.query);
      
      let results: VectorSearchResult[] = [];
      
      // Apply filters if specified
      let filteredDocs = this.documents;
      if (config.filters) {
        filteredDocs = this.applyFilters(filteredDocs, config.filters);
      }
      
      // Calculate similarities
      for (const [id, doc] of filteredDocs) {
        const similarity = this.calculateCosineSimilarity(queryVector, doc.vector);
        
        if (similarity >= (config.threshold || 0.1)) {
          results.push({
            id,
            score: similarity,
            metadata: doc.metadata,
            searchType: config.searchType || 'similarity'
          });
        }
      }
      
      // Sort by score and limit results
      results.sort((a, b) => b.score - a.score);
      results = results.slice(0, config.topK || 10);
      
      console.log(`✅ Found ${results.length} similar documents`);
      return results;
    } catch (error) {
      console.error('Error in vector database search:', error);
      throw error;
    }
  }

  // Apply metadata filters
  private applyFilters(
    documents: Map<string, VectorDocument>, 
    filters: VectorSearchConfig['filters']
  ): Map<string, VectorDocument> {
    if (!filters) return documents;
    
    const filtered = new Map<string, VectorDocument>();
    
    for (const [id, doc] of documents) {
      let include = true;
      
      // Category filter
      if (filters.category && filters.category.length > 0) {
        if (!filters.category.includes(doc.metadata.category)) {
          include = false;
        }
      }
      
      // Location filter
      if (filters.location && filters.location.length > 0) {
        if (!filters.location.includes(doc.metadata.location)) {
          include = false;
        }
      }
      
      // Type filter
      if (filters.type && filters.type.length > 0) {
        if (!filters.type.includes(doc.metadata.type)) {
          include = false;
        }
      }
      
      // Price filter
      if (filters.price && filters.price.length > 0) {
        if (!filters.price.includes(doc.metadata.price || '')) {
          include = false;
        }
      }
      
      // Season filter
      if (filters.season && filters.season.length > 0) {
        const docSeasons = doc.metadata.season || [];
        if (!filters.season.some(s => docSeasons.includes(s))) {
          include = false;
        }
      }
      
      if (include) {
        filtered.set(id, doc);
      }
    }
    
    return filtered;
  }

  // Hybrid search combining vector similarity with metadata matching
  async hybridSearch(
    query: string,
    metadataBoost: Record<string, number> = {},
    topK: number = 10
  ): Promise<VectorSearchResult[]> {
    try {
      console.log(`🔍 Hybrid search: "${query}"`);
      
      const queryVector = await this.generateEmbedding(query);
      const results: VectorSearchResult[] = [];
      
      for (const [id, doc] of this.documents) {
        // Base similarity score
        let score = this.calculateCosineSimilarity(queryVector, doc.vector);
        
        // Apply metadata boosts
        for (const [field, boost] of Object.entries(metadataBoost)) {
          const fieldValue = doc.metadata[field];
          if (fieldValue && this.matchesQuery(query, fieldValue)) {
            score += boost;
          }
        }
        
        results.push({
          id,
          score,
          metadata: doc.metadata,
          searchType: 'hybrid'
        });
      }
      
      results.sort((a, b) => b.score - a.score);
      return results.slice(0, topK);
    } catch (error) {
      console.error('Error in hybrid search:', error);
      throw error;
    }
  }

  // Check if metadata field matches query
  private matchesQuery(query: string, fieldValue: any): boolean {
    const queryLower = query.toLowerCase();
    
    if (typeof fieldValue === 'string') {
      return fieldValue.toLowerCase().includes(queryLower);
    } else if (Array.isArray(fieldValue)) {
      return fieldValue.some(v => v.toLowerCase().includes(queryLower));
    }
    
    return false;
  }

  // Batch insert multiple documents
  async batchInsert(documents: Omit<VectorDocument, 'timestamp'>[]): Promise<void> {
    console.log(`📦 Batch inserting ${documents.length} documents`);
    
    for (const doc of documents) {
      await this.addDocument(doc);
    }
    
    console.log(`✅ Batch insert completed`);
  }

  // Get database statistics
  getStats(): VectorDatabaseStats {
    const categories: Record<string, number> = {};
    const locations: Record<string, number> = {};
    const types: Record<string, number> = {};
    let totalDimensions = 0;
    
    for (const doc of this.documents.values()) {
      // Count categories
      categories[doc.metadata.category] = (categories[doc.metadata.category] || 0) + 1;
      
      // Count locations
      locations[doc.metadata.location] = (locations[doc.metadata.location] || 0) + 1;
      
      // Count types
      types[doc.metadata.type] = (types[doc.metadata.type] || 0) + 1;
      
      // Sum dimensions
      totalDimensions += doc.vector.length;
    }
    
    return {
      totalDocuments: this.documents.size,
      categories,
      locations,
      types,
      averageVectorDimension: this.documents.size > 0 ? totalDimensions / this.documents.size : 0,
      indexSize: this.index.size
    };
  }

  // Clear database
  clear(): void {
    this.documents.clear();
    this.index.clear();
    this.metadataIndex.clear();
    console.log('🗑️ Vector database cleared');
  }

  // Generate embedding for text
  private async generateEmbedding(text: string): Promise<number[]> {
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
  private calculateCosineSimilarity(vectorA: number[], vectorB: number[]): number {
    if (vectorA.length !== vectorB.length) {
      throw new Error('Vectors must have the same length');
    }
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < vectorA.length; i++) {
      dotProduct += vectorA[i] * vectorB[i];
      normA += vectorA[i] * vectorA[i];
      normB += vectorB[i] * vectorB[i];
    }
    
    if (normA === 0 || normB === 0) return 0;
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}

// Singleton instance
export const vectorDB = new VectorDatabase();

// Sample travel documents for demonstration
export const sampleTravelDocuments: Omit<VectorDocument, 'vector' | 'timestamp'>[] = [
  {
    id: 'goa_beach_001',
    metadata: {
      title: 'Goa Beach Paradise',
      content: 'Beautiful beaches with vibrant nightlife, Portuguese heritage, and water sports',
      category: 'beach',
      location: 'Goa, India',
      tags: ['beach', 'nightlife', 'heritage', 'water sports'],
      type: 'destination',
      rating: 4.5,
      price: 'mid-range',
      season: ['winter', 'spring']
    }
  },
  {
    id: 'manali_mountain_002',
    metadata: {
      title: 'Manali Mountain Retreat',
      content: 'Scenic mountain views, adventure sports, and peaceful hill station atmosphere',
      category: 'mountain',
      location: 'Himachal Pradesh, India',
      tags: ['mountain', 'adventure', 'peaceful', 'hill station'],
      type: 'destination',
      rating: 4.7,
      price: 'budget',
      season: ['summer', 'autumn']
    }
  },
  {
    id: 'varanasi_culture_003',
    metadata: {
      title: 'Varanasi Cultural Experience',
      content: 'Ancient temples, spiritual ceremonies, and rich cultural heritage',
      category: 'culture',
      location: 'Uttar Pradesh, India',
      tags: ['culture', 'spiritual', 'temples', 'heritage'],
      type: 'destination',
      rating: 4.3,
      price: 'budget',
      season: ['winter', 'spring', 'autumn']
    }
  },
  {
    id: 'mumbai_food_004',
    metadata: {
      title: 'Mumbai Street Food Tour',
      content: 'Diverse street food, local markets, and authentic flavors',
      category: 'food',
      location: 'Maharashtra, India',
      tags: ['food', 'street food', 'markets', 'authentic'],
      type: 'activity',
      rating: 4.6,
      price: 'budget',
      season: ['all']
    }
  },
  {
    id: 'kerala_backwaters_005',
    metadata: {
      title: 'Kerala Backwater Houseboat',
      content: 'Peaceful backwater cruises, traditional houseboats, and nature immersion',
      category: 'nature',
      location: 'Kerala, India',
      tags: ['nature', 'backwaters', 'houseboat', 'peaceful'],
      type: 'activity',
      rating: 4.8,
      price: 'luxury',
      season: ['winter', 'spring']
    }
  }
];

// Initialize vector database with sample data
export async function initializeVectorDatabase(): Promise<void> {
  console.log('🚀 Initializing vector database with sample data...');
  
  try {
    // Generate embeddings for sample documents
    const documentsWithVectors: Omit<VectorDocument, 'timestamp'>[] = [];
    
    for (const doc of sampleTravelDocuments) {
      const text = `${doc.metadata.title} ${doc.metadata.content} ${doc.metadata.tags.join(' ')}`;
      const vector = await vectorDB['generateEmbedding'](text);
      
      documentsWithVectors.push({
        ...doc,
        vector
      });
    }
    
    // Batch insert documents
    await vectorDB.batchInsert(documentsWithVectors);
    
    console.log('✅ Vector database initialized successfully');
  } catch (error) {
    console.error('Error initializing vector database:', error);
    throw error;
  }
}

// Advanced vector database operations
export async function performAdvancedVectorSearch(
  query: string,
  options: {
    searchType: 'similarity' | 'hybrid' | 'filtered';
    filters?: VectorSearchConfig['filters'];
    metadataBoost?: Record<string, number>;
    topK?: number;
  }
): Promise<{
  results: VectorSearchResult[];
  searchType: string;
  queryVector: number[];
  stats: VectorDatabaseStats;
}> {
  const queryVector = await vectorDB['generateEmbedding'](query);
  const stats = vectorDB.getStats();
  
  let results: VectorSearchResult[];
  
  switch (options.searchType) {
    case 'hybrid':
      results = await vectorDB.hybridSearch(query, options.metadataBoost, options.topK);
      break;
    case 'filtered':
      results = await vectorDB.search({
        query,
        topK: options.topK,
        filters: options.filters,
        searchType: 'filtered'
      });
      break;
    default:
      results = await vectorDB.search({
        query,
        topK: options.topK,
        searchType: 'similarity'
      });
  }
  
  return {
    results,
    searchType: options.searchType,
    queryVector,
    stats
  };
}

// Compare different search strategies
export async function compareSearchStrategies(query: string): Promise<{
  similarity: VectorSearchResult[];
  hybrid: VectorSearchResult[];
  filtered: VectorSearchResult[];
  analysis: {
    similarityAvg: number;
    hybridAvg: number;
    filteredAvg: number;
    overlap: number;
  };
}> {
  const [similarity, hybrid, filtered] = await Promise.all([
    vectorDB.search({ query, searchType: 'similarity', topK: 5 }),
    vectorDB.hybridSearch(query, { title: 0.2, category: 0.1 }, 5),
    vectorDB.search({ 
      query, 
      searchType: 'filtered', 
      topK: 5,
      filters: { category: ['beach', 'mountain', 'culture'] }
    })
  ]);
  
  const analysis = {
    similarityAvg: similarity.reduce((sum, r) => sum + r.score, 0) / similarity.length,
    hybridAvg: hybrid.reduce((sum, r) => sum + r.score, 0) / hybrid.length,
    filteredAvg: filtered.reduce((sum, r) => sum + r.score, 0) / filtered.length,
    overlap: 0
  };
  
  // Calculate overlap between similarity and hybrid results
  const similarityIds = new Set(similarity.map(r => r.id));
  const hybridIds = new Set(hybrid.map(r => r.id));
  const overlap = [...similarityIds].filter(id => hybridIds.has(id)).length;
  analysis.overlap = overlap;
  
  return { similarity, hybrid, filtered, analysis };
}
