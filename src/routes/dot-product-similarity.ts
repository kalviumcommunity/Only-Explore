// src/routes/dot-product-similarity.ts
import express from 'express';
import { 
  findSimilarDocumentsDotProduct,
  compareDotProductVsCosine,
  demonstrateDotProductScenarios,
  performWeightedDotProduct,
  calculateDotProduct,
  normalizeVector,
  travelDocuments
} from '../lib/dot-product-similarity.js';

const router = express.Router();

/**
 * Dot product similarity search
 * POST /api/dot-product
 */
router.post('/', async (req, res) => {
  try {
    const { query, threshold, topK, normalizeVectors = true } = req.body;

    if (!query) {
      return res.status(400).json({ 
        error: 'Query is required' 
      });
    }

    console.log(`🔍 Dot product similarity search for: "${query}"`);

    const results = await findSimilarDocumentsDotProduct({
      query,
      threshold: threshold || 0.1,
      topK: topK || 5,
      normalizeVectors
    });

    res.json({
      query,
      results: results.map(r => ({
        id: r.id,
        title: r.title,
        content: r.content.substring(0, 150) + '...',
        category: r.category,
        location: r.location,
        similarity: parseFloat(r.similarity.toFixed(4)),
        normalized: r.metadata?.normalized
      })),
      parameters: {
        threshold: threshold || 0.1,
        topK: topK || 5,
        normalizeVectors
      },
      method: 'dot-product-similarity',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Dot product similarity error:', error);
    res.status(500).json({ 
      error: 'Internal server error during dot product similarity search' 
    });
  }
});

/**
 * Compare dot product vs cosine similarity
 * POST /api/dot-product/compare
 */
router.post('/compare', async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query required for comparison' });
    }

    console.log(`🔬 Comparing dot product vs cosine similarity for: "${query}"`);

    const comparison = await compareDotProductVsCosine(query);

    res.json({
      query,
      dotProductResults: comparison.dotProduct.map(r => ({
        title: r.title,
        similarity: parseFloat(r.similarity.toFixed(4)),
        rank: comparison.dotProduct.indexOf(r) + 1
      })),
      cosineResults: comparison.cosine.map(r => ({
        title: r.title,
        similarity: parseFloat(r.similarity.toFixed(4)),
        rank: comparison.cosine.indexOf(r) + 1
      })),
      analysis: comparison.analysis,
      insights: {
        dotProduct: 'Measures vector alignment - efficient for normalized vectors',
        cosine: 'Measures angle between vectors - robust to vector magnitude',
        relationship: 'On normalized vectors, dot product approximates cosine similarity'
      },
      comparison: comparison.comparison,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Dot product comparison error:', error);
    res.status(500).json({ error: 'Dot product comparison failed' });
  }
});

/**
 * Weighted dot product similarity
 * POST /api/dot-product/weighted
 */
router.post('/weighted', async (req, res) => {
  try {
    const { query, weights } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    console.log(`🎯 Weighted dot product similarity for: "${query}"`);

    const result = await performWeightedDotProduct(query, weights);

    res.json({
      query,
      results: result.results.map(r => ({
        id: r.id,
        title: r.title,
        category: r.category,
        location: r.location,
        weightedSimilarity: parseFloat(r.similarity.toFixed(4)),
        featureBreakdown: {
          title: parseFloat((r.metadata?.titleSim || 0).toFixed(4)),
          content: parseFloat((r.metadata?.contentSim || 0).toFixed(4)),
          tags: parseFloat((r.metadata?.tagsSim || 0).toFixed(4)),
          category: parseFloat((r.metadata?.categorySim || 0).toFixed(4))
        }
      })),
      methodology: result.methodology,
      weights: weights || { title: 0.3, content: 0.4, tags: 0.2, category: 0.1 },
      method: 'weighted-dot-product',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Weighted dot product error:', error);
    res.status(500).json({ error: 'Weighted dot product similarity failed' });
  }
});

/**
 * Test dot product similarity with travel scenarios
 * GET /api/dot-product/test
 */
router.get('/test', async (req, res) => {
  const testQueries = [
    {
      query: 'beach destinations with nightlife in India',
      expectedResults: ['Goa Beach Nightlife Paradise'],
      description: 'Beach + nightlife query should find Goa'
    },
    {
      query: 'peaceful spiritual retreat by the water',
      expectedResults: ['Pondicherry French Colonial Beaches', 'Kerala Backwater Houseboat Experience'],
      description: 'Spiritual + peaceful query should find Pondicherry and Kerala'
    },
    {
      query: 'ancient Roman history and cultural sites',
      expectedResults: ['Rome Ancient History Walking Tour'],
      description: 'History query should find Rome'
    },
    {
      query: 'authentic local street food and night markets',
      expectedResults: ['Mumbai Street Food Night Markets'],
      description: 'Food + market query should find Mumbai'
    }
  ];

  try {
    const results = [];

    for (const testCase of testQueries) {
      console.log(`🧪 Testing dot product: ${testCase.description}`);
      
      const similarityResults = await findSimilarDocumentsDotProduct({
        query: testCase.query,
        threshold: 0.1,
        topK: 3,
        normalizeVectors: true
      });

      const topResult = similarityResults[0];
      const expectedMatch = testCase.expectedResults.some(expected => 
        topResult?.title.includes(expected.split(' ')[0]) // Check if title contains expected keyword
      );

      results.push({
        query: testCase.query,
        expectedResults: testCase.expectedResults,
        topResult: topResult ? {
          title: topResult.title,
          similarity: parseFloat(topResult.similarity.toFixed(4)),
          category: topResult.category
        } : null,
        expectedMatch,
        totalResults: similarityResults.length,
        description: testCase.description
      });
    }

    const accuracy = results.filter(r => r.expectedMatch).length / results.length;

    res.json({
      method: 'dot-product-similarity',
      testResults: results,
      accuracy: `${(accuracy * 100).toFixed(1)}%`,
      availableDocuments: travelDocuments.length,
      summary: `Tested ${testQueries.length} dot product queries with ${(accuracy * 100).toFixed(1)}% accuracy`
    });

  } catch (error) {
    console.error('Dot product test error:', error);
    res.status(500).json({ error: 'Dot product similarity test failed' });
  }
});

/**
 * Demonstrate dot product calculations
 * GET /api/dot-product/demo
 */
router.get('/demo', (req, res) => {
  try {
    const demo = demonstrateDotProductScenarios();
    
    res.json({
      demonstration: demo,
      formula: 'dot_product = Σ(A[i] × B[i]) for all dimensions i',
      properties: {
        commutative: 'A · B = B · A',
        distributive: 'A · (B + C) = A · B + A · C',
        normalizedRange: 'For normalized vectors: -1 ≤ dot_product ≤ 1'
      },
      travelApplications: {
        search: 'Find documents with similar semantic meaning to user queries',
        recommendation: 'Suggest destinations based on user preferences',
        deduplication: 'Detect similar itineraries or content',
        personalization: 'Match user profiles with relevant travel options'
      },
      comparisonWithCosine: {
        dotProduct: 'Direct vector multiplication - fast computation',
        cosine: 'Normalized dot product - handles different vector magnitudes',
        relationship: 'cosine_similarity = dot_product / (||A|| × ||B||)'
      },
      method: 'dot-product-demonstration'
    });

  } catch (error) {
    console.error('Demo error:', error);
    res.status(500).json({ error: 'Dot product demonstration failed' });
  }
});

/**
 * Get dot product similarity information
 * GET /api/dot-product/info
 */
router.get('/info', (req, res) => {
  res.json({
    concept: 'Dot product similarity measures vector alignment by multiplying corresponding components and summing them',
    mathematicalDefinition: 'For vectors A and B: dot_product = Σ(A[i] × B[i])',
    travelApplications: {
      semanticSearch: 'Find travel documents matching user query intent',
      destinationMatching: 'Compare user preferences with destination features',
      itineraryRecall: 'Match current queries with previously saved travel plans',
      contentRecommendation: 'Suggest similar travel experiences and activities',
      featureWeighting: 'Apply different importance to title, content, tags, categories'
    },
    advantages: [
      'Computationally efficient - simple multiplication and addition',
      'Works well with normalized vectors for similarity measurement',
      'Can be easily extended with feature weighting',
      'Interpretable results showing feature contributions'
    ],
    considerations: [
      'Sensitive to vector magnitude unless vectors are normalized',
      'May not handle all semantic relationships as robustly as cosine similarity',
      'Best results when combined with proper text preprocessing and embedding'
    ],
    implementation: {
      steps: [
        '1. Convert text to embeddings using appropriate model',
        '2. Optionally normalize vectors to unit length',
        '3. Calculate dot product between query and document vectors',
        '4. Rank results by dot product score',
        '5. Apply threshold filtering and return top matches'
      ]
    },
    availableDocuments: travelDocuments.length,
    optimization: 'For large document collections, consider indexing and approximate methods for real-time performance'
  });
});

export default router;
