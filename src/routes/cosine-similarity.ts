// src/routes/cosine-similarity.ts
import express from 'express';
import { 
  findSimilarDestinations,
  performAdvancedSimilaritySearch,
  calculateCosineSimilarity,
  demonstrateSimilarityCalculation,
  travelDestinations
} from '../lib/cosine-similarity.js';

const router = express.Router();

/**
 * Basic cosine similarity search
 * POST /api/cosine-similarity
 */
router.post('/', async (req, res) => {
  try {
    const { query, threshold, topK, useSemanticSearch } = req.body;

    if (!query) {
      return res.status(400).json({ 
        error: 'Query is required' 
      });
    }

    console.log(`🔍 Cosine similarity search for: "${query}"`);

    const results = await findSimilarDestinations({
      query,
      threshold: threshold || 0.3,
      topK: topK || 5,
      useSemanticSearch: useSemanticSearch || false
    });

    res.json({
      query,
      results: results.map(r => ({
        id: r.id,
        title: r.title,
        content: r.content.substring(0, 150) + '...',
        metadata: r.metadata,
        similarity: parseFloat(r.similarity.toFixed(4))
      })),
      searchType: useSemanticSearch ? 'semantic-database' : 'cosine-similarity',
      parameters: {
        threshold: threshold || 0.3,
        topK: topK || 5
      },
      method: 'cosine-similarity',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Cosine similarity error:', error);
    res.status(500).json({ 
      error: 'Internal server error during similarity search' 
    });
  }
});

/**
 * Advanced similarity search with preferences
 * POST /api/cosine-similarity/advanced
 */
router.post('/advanced', async (req, res) => {
  try {
    const { query, preferences } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    console.log(`🎯 Advanced similarity search: "${query}" with preferences`);

    const result = await performAdvancedSimilaritySearch(query, preferences);

    res.json({
      query,
      preferences: preferences || {},
      results: result.results.map(r => ({
        id: r.id,
        title: r.title,
        content: r.content.substring(0, 120) + '...',
        metadata: r.metadata,
        similarity: parseFloat(r.similarity.toFixed(4)),
        boostFactors: (r as any).boostFactors || []
      })),
      explanation: result.explanation,
      queryAnalysis: result.queryAnalysis,
      method: 'advanced-cosine-similarity',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Advanced similarity error:', error);
    res.status(500).json({ error: 'Advanced similarity search failed' });
  }
});

/**
 * Compare similarity scores between multiple queries
 * POST /api/cosine-similarity/compare
 */
router.post('/compare', async (req, res) => {
  try {
    const { queries } = req.body;

    if (!queries || !Array.isArray(queries) || queries.length < 2) {
      return res.status(400).json({ error: 'At least 2 queries required for comparison' });
    }

    console.log(`🔬 Comparing similarity for ${queries.length} queries`);

    const comparisons = [];

    for (const query of queries) {
      const results = await findSimilarDestinations({
        query,
        threshold: 0.2,
        topK: 3
      });

      comparisons.push({
        query,
        topResults: results.map(r => ({
          title: r.title,
          similarity: parseFloat(r.similarity.toFixed(4)),
          category: r.metadata?.category
        }))
      });
    }

    res.json({
      queries,
      comparisons,
      insights: {
        note: 'Different queries may find similar destinations with varying similarity scores',
        interpretation: 'Higher similarity scores indicate better semantic matches'
      },
      method: 'similarity-comparison',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Similarity comparison error:', error);
    res.status(500).json({ error: 'Similarity comparison failed' });
  }
});

/**
 * Test cosine similarity with travel examples
 * GET /api/cosine-similarity/test
 */
router.get('/test', async (req, res) => {
  const testQueries = [
    {
      query: 'romantic places in Paris for couples',
      expectedCategories: ['romantic'],
      description: 'Romantic travel query should find romantic Paris destinations'
    },
    {
      query: 'beach vacation tropical paradise', 
      expectedCategories: ['beach'],
      description: 'Beach vacation query should find tropical beach destinations'
    },
    {
      query: 'cultural museums and art galleries',
      expectedCategories: ['culture'],
      description: 'Cultural query should find museum and art destinations'
    },
    {
      query: 'authentic Japanese food experience',
      expectedCategories: ['food'],
      description: 'Food query should find culinary experiences'
    }
  ];

  try {
    const results = [];

    for (const testCase of testQueries) {
      console.log(`🧪 Testing similarity: ${testCase.description}`);
      
      const similarityResults = await findSimilarDestinations({
        query: testCase.query,
        threshold: 0.3,
        topK: 3
      });

      const topResult = similarityResults[0];
      const categoryMatch = topResult && testCase.expectedCategories.includes(topResult.metadata?.category);

      results.push({
        query: testCase.query,
        expectedCategories: testCase.expectedCategories,
        topResult: topResult ? {
          title: topResult.title,
          category: topResult.metadata?.category,
          similarity: parseFloat(topResult.similarity.toFixed(4))
        } : null,
        categoryMatch,
        totalResults: similarityResults.length,
        description: testCase.description
      });
    }

    const accuracy = results.filter(r => r.categoryMatch).length / results.length;

    res.json({
      method: 'cosine-similarity',
      testResults: results,
      accuracy: `${(accuracy * 100).toFixed(1)}%`,
      availableDestinations: travelDestinations.length,
      summary: `Tested ${testQueries.length} similarity queries with ${(accuracy * 100).toFixed(1)}% category accuracy`
    });

  } catch (error) {
    console.error('Similarity test error:', error);
    res.status(500).json({ error: 'Cosine similarity test failed' });
  }
});

/**
 * Demonstrate similarity calculation with examples
 * GET /api/cosine-similarity/demo
 */
router.get('/demo', (req, res) => {
  try {
    const demo = demonstrateSimilarityCalculation();
    
    res.json({
      demonstration: demo,
      explanation: {
        cosineSimilarity: 'Measures the cosine of the angle between two vectors',
        range: 'Values from -1 (opposite) to 1 (identical), commonly 0 to 1 for positive embeddings',
        interpretation: {
          '0.9-1.0': 'Very high similarity',
          '0.7-0.9': 'High similarity', 
          '0.5-0.7': 'Moderate similarity',
          '0.3-0.5': 'Low similarity',
          '0.0-0.3': 'Very low similarity'
        }
      },
      formula: 'cosine_similarity = (A · B) / (||A|| × ||B||)',
      method: 'similarity-demonstration'
    });

  } catch (error) {
    console.error('Demo error:', error);
    res.status(500).json({ error: 'Similarity demonstration failed' });
  }
});

/**
 * Get cosine similarity information
 * GET /api/cosine-similarity/info
 */
router.get('/info', (req, res) => {
  res.json({
    concept: 'Cosine similarity measures semantic similarity between text by comparing their vector representations',
    travelApplications: {
      search: 'Find destinations matching user queries even with different wording',
      recommendations: 'Suggest similar destinations based on user interests',
      personalization: 'Match user preferences with relevant travel options',
      contentDiscovery: 'Surface related travel content and experiences'
    },
    benefits: [
      'Semantic understanding beyond keyword matching',
      'Robust to different phrasings of similar concepts',
      'Quantifiable similarity scores for ranking',
      'Works with multilingual embeddings'
    ],
    implementation: {
      steps: [
        '1. Convert text to embeddings (vector representations)',
        '2. Calculate cosine similarity between query and document vectors',
        '3. Rank results by similarity scores',
        '4. Apply thresholds and return top matches'
      ]
    },
    availableDestinations: travelDestinations.length
  });
});

export default router;
