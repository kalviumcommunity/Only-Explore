// src/routes/vector-database.ts
import express from 'express';
import { 
  vectorDB, 
  initializeVectorDatabase, 
  performAdvancedVectorSearch, 
  compareSearchStrategies,
  sampleTravelDocuments 
} from '../lib/vector-database.js';

const router = express.Router();

/**
 * Vector database similarity search
 * POST /api/vector-database
 */
router.post('/', async (req, res) => {
  try {
    const { query, topK = 10, threshold = 0.1, searchType = 'similarity' } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    console.log(`🔍 Vector database search: "${query}" with ${searchType} strategy`);

    const results = await vectorDB.search({
      query,
      topK,
      threshold,
      searchType: searchType as any
    });

    res.json({
      query,
      results: results.map(r => ({
        id: r.id,
        title: r.metadata.title,
        category: r.metadata.category,
        location: r.metadata.location,
        type: r.metadata.type,
        score: parseFloat(r.score.toFixed(4)),
        tags: r.metadata.tags,
        rating: r.metadata.rating,
        price: r.metadata.price
      })),
      searchType,
      parameters: { topK, threshold },
      method: 'vector-database-search',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Vector database search error:', error);
    res.status(500).json({ error: 'Internal server error during vector search' });
  }
});

/**
 * Hybrid search combining vector similarity with metadata matching
 * POST /api/vector-database/hybrid
 */
router.post('/hybrid', async (req, res) => {
  try {
    const { query, metadataBoost = {}, topK = 10 } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    console.log(`🔍 Hybrid search: "${query}" with metadata boost`);

    const results = await vectorDB.hybridSearch(query, metadataBoost, topK);

    res.json({
      query,
      results: results.map(r => ({
        id: r.id,
        title: r.metadata.title,
        category: r.metadata.category,
        location: r.metadata.location,
        type: r.metadata.type,
        score: parseFloat(r.score.toFixed(4)),
        tags: r.metadata.tags,
        rating: r.metadata.rating,
        price: r.metadata.price
      })),
      metadataBoost,
      searchType: 'hybrid',
      method: 'vector-database-hybrid',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Hybrid search error:', error);
    res.status(500).json({ error: 'Internal server error during hybrid search' });
  }
});

/**
 * Filtered search with metadata constraints
 * POST /api/vector-database/filtered
 */
router.post('/filtered', async (req, res) => {
  try {
    const { query, filters, topK = 10, threshold = 0.1 } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    console.log(`🔍 Filtered search: "${query}" with filters`);

    const results = await vectorDB.search({
      query,
      topK,
      threshold,
      filters,
      searchType: 'filtered'
    });

    res.json({
      query,
      filters,
      results: results.map(r => ({
        id: r.id,
        title: r.metadata.title,
        category: r.metadata.category,
        location: r.metadata.location,
        type: r.metadata.type,
        score: parseFloat(r.score.toFixed(4)),
        tags: r.metadata.tags,
        rating: r.metadata.rating,
        price: r.metadata.price
      })),
      searchType: 'filtered',
      method: 'vector-database-filtered',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Filtered search error:', error);
    res.status(500).json({ error: 'Internal server error during filtered search' });
  }
});

/**
 * Compare different search strategies
 * POST /api/vector-database/compare
 */
router.post('/compare', async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required for comparison' });
    }

    console.log(`🔬 Comparing search strategies for: "${query}"`);

    const comparison = await compareSearchStrategies(query);

    res.json({
      query,
      similarity: {
        results: comparison.similarity.map(r => ({
          title: r.metadata.title,
          score: parseFloat(r.score.toFixed(4)),
          category: r.metadata.category
        })),
        averageScore: parseFloat(comparison.analysis.similarityAvg.toFixed(4))
      },
      hybrid: {
        results: comparison.hybrid.map(r => ({
          title: r.metadata.title,
          score: parseFloat(r.score.toFixed(4)),
          category: r.metadata.category
        })),
        averageScore: parseFloat(comparison.analysis.hybridAvg.toFixed(4))
      },
      filtered: {
        results: comparison.filtered.map(r => ({
          title: r.metadata.title,
          score: parseFloat(r.score.toFixed(4)),
          category: r.metadata.category
        })),
        averageScore: parseFloat(comparison.analysis.filteredAvg.toFixed(4))
      },
      analysis: {
        overlap: comparison.analysis.overlap,
        insights: {
          similarity: 'Pure vector similarity search',
          hybrid: 'Combines vector similarity with metadata matching',
          filtered: 'Vector similarity with metadata constraints'
        }
      },
      method: 'vector-database-comparison',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Search strategy comparison error:', error);
    res.status(500).json({ error: 'Search strategy comparison failed' });
  }
});

/**
 * Advanced vector search with multiple options
 * POST /api/vector-database/advanced
 */
router.post('/advanced', async (req, res) => {
  try {
    const { query, options } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    console.log(`🎯 Advanced vector search: "${query}"`);

    const result = await performAdvancedVectorSearch(query, options);

    res.json({
      query,
      results: result.results.map(r => ({
        id: r.id,
        title: r.metadata.title,
        category: r.metadata.category,
        location: r.metadata.location,
        type: r.metadata.type,
        score: parseFloat(r.score.toFixed(4)),
        tags: r.metadata.tags,
        rating: r.metadata.rating,
        price: r.metadata.price
      })),
      searchType: result.searchType,
      queryVectorLength: result.queryVector.length,
      databaseStats: result.stats,
      method: 'vector-database-advanced',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Advanced vector search error:', error);
    res.status(500).json({ error: 'Advanced vector search failed' });
  }
});

/**
 * Initialize vector database with sample data
 * POST /api/vector-database/initialize
 */
router.post('/initialize', async (req, res) => {
  try {
    console.log('🚀 Initializing vector database...');
    
    await initializeVectorDatabase();
    const stats = vectorDB.getStats();

    res.json({
      message: 'Vector database initialized successfully',
      stats,
      sampleDocuments: sampleTravelDocuments.length,
      method: 'vector-database-initialization',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Vector database initialization error:', error);
    res.status(500).json({ error: 'Vector database initialization failed' });
  }
});

/**
 * Get vector database statistics
 * GET /api/vector-database/stats
 */
router.get('/stats', (req, res) => {
  try {
    const stats = vectorDB.getStats();
    
    res.json({
      stats,
      method: 'vector-database-stats',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting vector database stats:', error);
    res.status(500).json({ error: 'Failed to get database statistics' });
  }
});

/**
 * Test vector database with travel scenarios
 * GET /api/vector-database/test
 */
router.get('/test', async (req, res) => {
  const testScenarios = [
    {
      query: 'romantic beach destinations',
      expectedCategories: ['beach'],
      description: 'Beach destinations for romantic getaways'
    },
    {
      query: 'adventure mountain activities',
      expectedCategories: ['mountain'],
      description: 'Mountain destinations for adventure activities'
    },
    {
      query: 'cultural heritage experiences',
      expectedCategories: ['culture'],
      description: 'Cultural destinations for heritage experiences'
    },
    {
      query: 'budget food experiences',
      expectedCategories: ['food'],
      description: 'Budget-friendly food experiences'
    },
    {
      query: 'peaceful nature retreats',
      expectedCategories: ['nature'],
      description: 'Peaceful nature-based retreats'
    }
  ];

  try {
    const results = [];
    
    for (const scenario of testScenarios) {
      console.log(`🧪 Testing vector database: ${scenario.description}`);
      
      const searchResults = await vectorDB.search({
        query: scenario.query,
        topK: 3,
        threshold: 0.1
      });

      const topResult = searchResults[0];
      const expectedMatch = topResult && scenario.expectedCategories.includes(topResult.metadata.category);

      results.push({
        query: scenario.query,
        expectedCategories: scenario.expectedCategories,
        topResult: topResult ? {
          title: topResult.metadata.title,
          category: topResult.metadata.category,
          score: parseFloat(topResult.score.toFixed(4))
        } : null,
        expectedMatch,
        totalResults: searchResults.length,
        description: scenario.description
      });
    }

    const accuracy = results.filter(r => r.expectedMatch).length / results.length;

    res.json({
      method: 'vector-database-test',
      testResults: results,
      accuracy: `${(accuracy * 100).toFixed(1)}%`,
      summary: `Tested ${testScenarios.length} scenarios with ${(accuracy * 100).toFixed(1)}% accuracy`
    });
  } catch (error) {
    console.error('Vector database test error:', error);
    res.status(500).json({ error: 'Vector database test failed' });
  }
});

/**
 * Get vector database information
 * GET /api/vector-database/info
 */
router.get('/info', (req, res) => {
  res.json({
    concept: 'Vector Database Integration enables scalable, efficient semantic search and personalization for travel recommendations',
    capabilities: {
      similaritySearch: 'Find documents by vector similarity using embeddings',
      hybridSearch: 'Combine vector similarity with metadata matching',
      filteredSearch: 'Apply metadata constraints to vector search',
      batchOperations: 'Efficient bulk document insertion and processing',
      metadataIndexing: 'Fast filtering by categories, locations, types, etc.'
    },
    searchTypes: {
      similarity: 'Pure vector similarity search using cosine similarity',
      hybrid: 'Combines vector similarity with metadata boosts',
      filtered: 'Vector similarity with metadata constraints'
    },
    travelApplications: {
      destinationSearch: 'Find destinations by semantic meaning, not just keywords',
      personalizedRecommendations: 'Match user preferences with relevant destinations',
      contentDiscovery: 'Discover similar activities, reviews, and itineraries',
      categoryFiltering: 'Filter results by travel categories and preferences'
    },
    advantages: [
      'Scalable to millions of travel documents',
      'Real-time semantic search capabilities',
      'Flexible metadata filtering and boosting',
      'Efficient similarity computation',
      'Support for multiple search strategies'
    ],
    implementation: {
      storage: 'In-memory vector database with metadata indexing',
      embedding: 'Google Generative AI text-embedding-004 model',
      similarity: 'Cosine similarity for vector comparison',
      indexing: 'Automatic metadata indexing for fast filtering'
    },
    sampleData: {
      destinations: 'Goa Beach Paradise, Manali Mountain Retreat',
      activities: 'Mumbai Street Food Tour, Kerala Backwater Houseboat',
      categories: 'beach, mountain, culture, food, nature',
      types: 'destination, activity, review, itinerary'
    }
  });
});

export default router;
