// src/routes/top-k-sampling.ts
import express from 'express';
import { 
  performTopKSampling, 
  detectOptimalTopK, 
  compareTopKValues,
  demonstrateTopKDiversity,
  topKSettings 
} from '../lib/top-k-sampling.js';

const router = express.Router();

/**
 * Top-K sampling endpoint
 * POST /api/top-k
 */
router.post('/', async (req, res) => {
  try {
    const { query, taskType, topK, context } = req.body;

    if (!query) {
      return res.status(400).json({ 
        error: 'Query is required' 
      });
    }

    // Auto-detect task type if not provided
    const detectedTaskType = taskType || detectOptimalTopK(query);
    
    console.log(`🎯 Top-K sampling: ${detectedTaskType} for "${query.substring(0, 50)}..."`);

    const result = await performTopKSampling({
      taskType: detectedTaskType,
      customTopK: topK,
      userQuery: query,
      context
    });

    res.json({
      query,
      detectedTaskType,
      result,
      topKInfo: topKSettings[detectedTaskType],
      method: 'top-k-sampling',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Top-K sampling error:', error);
    res.status(500).json({ 
      error: 'Internal server error during Top-K sampling' 
    });
  }
});

/**
 * Compare responses across different Top-K values
 * POST /api/top-k/compare
 */
router.post('/compare', async (req, res) => {
  try {
    const { query, context } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query required for Top-K comparison' });
    }

    console.log(`🔬 Comparing Top-K values for: "${query.substring(0, 50)}..."`);

    const comparison = await compareTopKValues(query, context);

    res.json({
      query,
      context: context || null,
      topKComparison: comparison,
      insights: {
        preciseBest: 'Use for focused, consistent information and calculations',
        balancedBest: 'Use for varied but relevant recommendations and advice', 
        creativeBest: 'Use for diverse, imaginative content and storytelling'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Top-K comparison error:', error);
    res.status(500).json({ error: 'Top-K comparison failed' });
  }
});

/**
 * Smart Top-K endpoint - automatically selects optimal Top-K
 * POST /api/top-k/smart
 */
router.post('/smart', async (req, res) => {
  try {
    const { query, context } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    // Detect optimal Top-K
    const optimalTaskType = detectOptimalTopK(query);
    
    const result = await performTopKSampling({
      taskType: optimalTaskType,
      userQuery: query,
      context
    });

    res.json({
      query,
      smartSelection: {
        chosenTaskType: optimalTaskType,
        reasoning: `Auto-selected ${optimalTaskType} Top-K based on query analysis`,
        topK: topKSettings[optimalTaskType].topK,
        description: topKSettings[optimalTaskType].description
      },
      result,
      method: 'smart-top-k',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Smart Top-K error:', error);
    res.status(500).json({ error: 'Smart Top-K selection failed' });
  }
});

/**
 * Demonstrate Top-K diversity with multiple runs
 * POST /api/top-k/diversity
 */
router.post('/diversity', async (req, res) => {
  try {
    const { query, topK = 20, runs = 3 } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    console.log(`🎲 Demonstrating Top-K diversity: K=${topK}, runs=${runs}`);

    const diversity = await demonstrateTopKDiversity(query, topK, runs);

    res.json({
      query,
      diversity,
      explanation: {
        concept: 'Top-K controls response diversity by limiting word choices',
        lowTopK: 'Fewer choices = more consistent, predictable responses',
        highTopK: 'More choices = more diverse, varied responses'
      },
      method: 'top-k-diversity',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Top-K diversity error:', error);
    res.status(500).json({ error: 'Top-K diversity demonstration failed' });
  }
});

/**
 * Test Top-K sampling with travel examples
 * GET /api/top-k/test
 */
router.get('/test', async (req, res) => {
  const testQueries = [
    {
      query: 'Calculate the exact cost breakdown for 7 days in Tokyo with a $3000 budget',
      expectedType: 'precise',
      description: 'Budget calculation requiring focused, consistent response'
    },
    {
      query: 'What are some good restaurants to try in Rome?',
      expectedType: 'balanced', 
      description: 'Restaurant recommendations needing variety and relevance'
    },
    {
      query: 'Describe the magical experience of watching sunset over Santorini',
      expectedType: 'creative',
      description: 'Experiential description requiring diverse, imaginative language'
    },
    {
      query: 'What visa documents do I need for traveling to Japan?',
      expectedType: 'precise',
      description: 'Legal requirements needing precise, accurate information'
    }
  ];

  try {
    const results = [];

    for (const testCase of testQueries) {
      console.log(`🧪 Testing Top-K: ${testCase.description}`);
      
      const detectedType = detectOptimalTopK(testCase.query);
      const result = await performTopKSampling({
        taskType: detectedType,
        userQuery: testCase.query
      });

      results.push({
        query: testCase.query,
        expectedType: testCase.expectedType,
        detectedType,
        correct: detectedType === testCase.expectedType,
        topK: result.topK,
        response: result.response.substring(0, 200) + '...',
        description: testCase.description
      });
    }

    const accuracy = results.filter(r => r.correct).length / results.length;

    res.json({
      method: 'top-k-sampling',
      testResults: results,
      accuracy: `${(accuracy * 100).toFixed(1)}%`,
      topKSettings,
      summary: `Tested ${testQueries.length} Top-K sampling scenarios with ${(accuracy * 100).toFixed(1)}% accuracy`
    });

  } catch (error) {
    console.error('Top-K test error:', error);
    res.status(500).json({ error: 'Top-K sampling test failed' });
  }
});

/**
 * Get Top-K settings info
 * GET /api/top-k/info
 */
router.get('/info', (req, res) => {
  res.json({
    topKSettings,
    explanation: {
      concept: 'Top-K sampling controls response diversity by limiting word choices',
      lowTopK: 'Fewer choices = more consistent, predictable responses',
      highTopK: 'More choices = more diverse, varied responses'
    },
    travelApplications: {
      precise: 'Itinerary planning, budget calculations, travel facts',
      balanced: 'Restaurant recommendations, activity suggestions, general advice',
      creative: 'Destination descriptions, travel stories, inspiration'
    }
  });
});

export default router;
