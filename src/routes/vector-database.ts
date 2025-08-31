// src/routes/vector-database.ts
import express from 'express';
import { 
  VectorDatabase, 
  createVectorDatabase, 
  sampleTravelDestinations,
  compareVectorDatabases 
} from '../lib/vector-database.js';

const router = express.Router();

// Global vector database instance
let vectorDB: VectorDatabase | null = null;

/**
 * Initialize vector database
 * POST /api/vector-db/initialize
 */
router.post('/initialize', async (req, res) => {
  try {
    const { provider, indexName, namespace } = req.body;

    if (!provider || !['pinecone', 'weaviate', 'local'].includes(provider)) {
      return res.status(400).json({ 
        error: 'Valid provider required (pinecone, weaviate, local)' 
      });
    }

    console.log(`🚀 Initializing ${provider} vector database`);

    vectorDB = createVectorDatabase({
      provider,
      indexName,
      namespace
    });

    await vectorDB.initialize();

    res.json({
      message: `Vector database ${provider} initialized successfully`,
      provider,
      indexName: indexName || 'default',
      namespace: namespace || 'default',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Vector DB initialization error:', error);
    res.status(500).json({ 
      error: 'Failed to initialize vector database' 
    });
  }
});

/**
 * Upsert sample travel data
 * POST /api/vector-db/seed
 */
router.post('/seed', async (req, res) => {
  try {
    if (!vectorDB) {
      return res.status(400).json({ 
        error: 'Vector database not initialized. Call /initialize first.' 
      });
    }

    console.log('🌱 Seeding vector database with sample travel destinations');

    await vectorDB.upsertDocuments(sampleTravelDestinations);

    const stats = await vectorDB.getStats();

    res.json({
      message: 'Sample travel destinations upserted successfully',
      documentsUpserted: sampleTravelDestinations.length,
      stats,
      destinations: sampleTravelDestinations.map(d => ({
        id: d.id,
        title: d.title,
        category: d.category,
        location: d.location
      })),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Vector DB seed error:', error);
    res.status(500).json({ 
      error: 'Failed to seed vector database' 
    });
  }
});

/**
 * Search similar destinations
 * POST /api/vector-db/search
 */
router.post('/search', async (req, res) => {
  try {
    const { query, topK, filter } = req.body;

    if (!query) {
      return res.status(400).json({ 
        error: 'Search query is required' 
      });
    }

    if (!vectorDB) {
      return res.status(400).json({ 
        error: 'Vector database not initialized. Call /initialize first.' 
      });
    }

    console.log(`🔍 Vector search: "${query}"`);

    const results = await vectorDB.searchSimilar(query, topK || 5, filter);

    res.json({
      query,
      results: results.map(r => ({
        id: r.id,
        title: r.title,
        content: r.content.substring(0, 150) + '...',
        score: parseFloat(r.score.toFixed(4)),
        category: r.metadata?.category,
        location: r.metadata?.location,
        tags: r.metadata?.tags
      })),
      totalResults: results.length,
      method: 'vector-database-search',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Vector search error:', error);
    res.status(500).json({ 
      error: 'Vector search failed' 
    });
  }
});

/**
 * Compare different vector database providers
 * POST /api/vector-db/compare
 */
router.post('/compare', async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query required for comparison' });
    }

    console.log(`🔬 Comparing vector databases for: "${query}"`);

    const comparison = await compareVectorDatabases(query);

    res.json({
      query,
      comparison: {
        local: comparison.local.map(r => ({
          title: r.title,
          score: parseFloat(r.score.toFixed(4)),
          provider: 'local'
        })),
        ...(comparison.pinecone && {
          pinecone: comparison.pinecone.map(r => ({
            title: r.title,
            score: parseFloat(r.score.toFixed(4)),
            provider: 'pinecone'
          }))
        })
      },
      insights: {
        local: 'Fast development, limited scale, good for prototyping',
        pinecone: 'Production-ready, highly scalable, managed service',
        recommendation: 'Use local for development, Pinecone for production'
      },
      comparisonSummary: comparison.comparison,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Vector DB comparison error:', error);
    res.status(500).json({ error: 'Vector database comparison failed' });
  }
});

/**
 * Get vector database statistics
 * GET /api/vector-db/stats
 */
router.get('/stats', async (req, res) => {
  try {
    if (!vectorDB) {
      return res.status(400).json({ 
        error: 'Vector database not initialized' 
      });
    }

    const stats = await vectorDB.getStats();

    res.json({
      stats,
      method: 'vector-database-stats',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Vector DB stats error:', error);
    res.status(500).json({ error: 'Failed to get vector database stats' });
  }
});

/**
 * Test vector database with travel scenarios
 * GET /api/vector-db/test
 */
router.get('/test', async (req, res) => {
  const testScenarios = [
    {
      query: 'romantic beach destination with nightlife',
      expected: 'Should find Goa and Bali',
      description: 'Beach + romantic + nightlife query'
    },
    {
      query: 'mountain adventure with trekking and snow',
      expected: 'Should find Manali and Swiss Alps',
      description: 'Mountain + adventure + snow query'
    },
    {
      query: 'traditional cultural temples and spirituality',
      expected: 'Should find Kyoto',
      description: 'Culture + traditional + spiritual query'
    },
    {
      query: 'luxury alpine skiing resort experience',
      expected: 'Should find Swiss Alps',
      description: 'Luxury + alpine + skiing query'
    }
  ];

  try {
    // Initialize local vector DB for testing
    const testVectorDB = createVectorDatabase({ provider: 'local' });
    await testVectorDB.initialize();
    await testVectorDB.upsertDocuments(sampleTravelDestinations);

    const results = [];

    for (const scenario of testScenarios) {
      console.log(`🧪 Testing vector search: ${scenario.description}`);
      
      const searchResults = await testVectorDB.searchSimilar(scenario.query, 3);

      results.push({
        query: scenario.query,
        expected: scenario.expected,
        results: searchResults.map(r => ({
          title: r.title,
          score: parseFloat(r.score.toFixed(4)),
          category: r.metadata?.category
        })),
        topResult: searchResults[0]?.title,
        description: scenario.description
      });
    }

    res.json({
      method: 'vector-database-test',
      testResults: results,
      testDatabase: 'local',
      totalScenarios: testScenarios.length,
      summary: `Tested ${testScenarios.length} vector search scenarios`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Vector DB test error:', error);
    res.status(500).json({ error: 'Vector database test failed' });
  }
});

/**
 * Get vector database information
 * GET /api/vector-db/info
 */
router.get('/info', (req, res) => {
  res.json({
    concept: 'Vector databases store and search high-dimensional embeddings for semantic similarity',
    supportedProviders: {
      pinecone: {
        description: 'Fully managed, cloud-native vector database',
        features: ['High performance', 'Auto-scaling', 'Multi-cloud', 'Real-time updates'],
        useCases: ['Production applications', 'Large-scale similarity search', 'Real-time recommendations']
      },
      weaviate: {
        description: 'Open-source vector database with GraphQL API',
        features: ['Hybrid search', 'Multi-modal', 'GraphQL', 'Self-hosted'],
        useCases: ['Knowledge graphs', 'Hybrid search', 'Multi-modal applications']
      },
      local: {
        description: 'In-memory vector storage for development',
        features: ['Fast setup', 'No external dependencies', 'Good for prototyping'],
        useCases: ['Development', 'Testing', 'Small datasets', 'Proof of concepts']
      }
    },
    travelApplications: {
      destinationSearch: 'Find destinations matching user preferences and interests',
      itineraryMatching: 'Suggest similar travel plans and experiences',
      personalization: 'Match user profiles with relevant travel content',
      contentDeduplication: 'Identify similar travel content and reviews',
      realTimeRecommendations: 'Provide instant, contextual travel suggestions'
    },
    advantages: [
      'Semantic search beyond keyword matching',
      'Scalable similarity search for millions of vectors',
      'Real-time updates and queries',
      'Integration with ML pipelines',
      'Support for metadata filtering'
    ],
    implementation: {
      steps: [
        '1. Choose appropriate vector database provider',
        '2. Initialize database connection and index',
        '3. Generate embeddings for travel content',
        '4. Upsert vectors with metadata to database',
        '5. Query database for similar vectors',
        '6. Return ranked results to users'
      ]
    },
    availableDestinations: sampleTravelDestinations.length
  });
});

export default router;
