// src/routes/stop-sequences.ts
import express from 'express';
import { 
  performStopSequenceGeneration, 
  detectResponseType, 
  compareWithWithoutStops,
  stopSequencePresets 
} from '../lib/stop-sequences.js';

const router = express.Router();

/**
 * Stop sequence generation endpoint
 * POST /api/stop-sequences
 */
router.post('/', async (req, res) => {
  try {
    const { query, responseType, customStops, context, maxLength } = req.body;

    if (!query) {
      return res.status(400).json({ 
        error: 'Query is required' 
      });
    }

    // Auto-detect response type if not provided
    const detectedType = responseType || detectResponseType(query);
    
    console.log(`⏹️ Stop sequences: ${detectedType} type for "${query.substring(0, 50)}..."`);

    const result = await performStopSequenceGeneration({
      responseType: detectedType,
      customStops,
      userQuery: query,
      context,
      maxLength
    });

    res.json({
      query,
      detectedType,
      result,
      presetInfo: stopSequencePresets[detectedType],
      method: 'stop-sequences',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Stop sequence error:', error);
    res.status(500).json({ 
      error: 'Internal server error during stop sequence generation' 
    });
  }
});

/**
 * Compare responses with and without stop sequences
 * POST /api/stop-sequences/compare
 */
router.post('/compare', async (req, res) => {
  try {
    const { query, responseType } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query required for comparison' });
    }

    const detectedType = responseType || detectResponseType(query);
    
    console.log(`🔬 Comparing stop sequences for: "${query.substring(0, 50)}..."`);

    const comparison = await compareWithWithoutStops(query, detectedType);

    res.json({
      query,
      responseType: detectedType,
      comparison,
      insights: {
        withStops: 'Structured, concise response ending at defined stop points',
        withoutStops: 'May continue longer, potentially less structured',
        benefit: 'Stop sequences provide cleaner, more predictable output formatting'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Stop sequence comparison error:', error);
    res.status(500).json({ error: 'Stop sequence comparison failed' });
  }
});

/**
 * Test stop sequences with different travel scenarios
 * GET /api/stop-sequences/test
 */
router.get('/test', async (req, res) => {
  const testScenarios = [
    {
      query: 'Plan a 3-day itinerary for Rome with historical sites',
      expectedType: 'itinerary',
      description: 'Daily trip planning requiring structured day-by-day format'
    },
    {
      query: 'List the top 5 restaurants in Tokyo for sushi lovers',
      expectedType: 'list',
      description: 'Restaurant recommendations requiring clean numbered list'
    },
    {
      query: 'What is the cost breakdown for a week in Thailand?',
      expectedType: 'budget',
      description: 'Financial planning requiring structured cost categories'
    },
    {
      query: 'What should I know about traveling to Japan?',
      expectedType: 'conversation',
      description: 'General advice requiring conversational response format'
    }
  ];

  try {
    const results = [];

    for (const scenario of testScenarios) {
      console.log(`🧪 Testing stop sequences: ${scenario.description}`);
      
      const detectedType = detectResponseType(scenario.query);
      const result = await performStopSequenceGeneration({
        responseType: detectedType,
        userQuery: scenario.query
      });

      results.push({
        query: scenario.query,
        expectedType: scenario.expectedType,
        detectedType,
        correct: detectedType === scenario.expectedType,
        stopSequences: result.stopSequences,
        responseLength: result.response.length,
        truncated: result.truncated,
        response: result.response.substring(0, 150) + '...',
        description: scenario.description
      });
    }

    const accuracy = results.filter(r => r.correct).length / results.length;

    res.json({
      method: 'stop-sequences',
      testResults: results,
      accuracy: `${(accuracy * 100).toFixed(1)}%`,
      stopSequencePresets,
      summary: `Tested ${testScenarios.length} stop sequence scenarios with ${(accuracy * 100).toFixed(1)}% type detection accuracy`
    });

  } catch (error) {
    console.error('Stop sequence test error:', error);
    res.status(500).json({ error: 'Stop sequence test failed' });
  }
});

/**
 * Custom stop sequences endpoint
 * POST /api/stop-sequences/custom
 */
router.post('/custom', async (req, res) => {
  try {
    const { query, stops, context } = req.body;

    if (!query || !stops || !Array.isArray(stops)) {
      return res.status(400).json({ 
        error: 'Query and stops array are required' 
      });
    }

    const result = await performStopSequenceGeneration({
      responseType: 'custom',
      customStops: stops,
      userQuery: query,
      context
    });

    res.json({
      query,
      customStops: stops,
      result,
      explanation: 'Used custom stop sequences provided by user',
      method: 'custom-stop-sequences',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Custom stop sequence error:', error);
    res.status(500).json({ error: 'Custom stop sequence generation failed' });
  }
});

/**
 * Get stop sequence presets and information
 * GET /api/stop-sequences/info
 */
router.get('/info', (req, res) => {
  res.json({
    stopSequencePresets,
    explanation: {
      concept: 'Stop sequences tell the AI when to stop generating text, creating cleaner, more structured responses',
      benefits: [
        'Prevents rambling or overly long responses',
        'Creates consistent formatting across similar queries',
        'Enables structured output like lists, itineraries, budgets',
        'Improves user experience with predictable response formats'
      ]
    },
    travelApplications: {
      itinerary: 'Day-by-day trip plans with clear daily boundaries',
      list: 'Restaurant/attraction recommendations in numbered format',
      budget: 'Cost breakdowns with category separation',
      conversation: 'Natural chat responses without role confusion'
    },
    implementationTips: [
      'Choose stop sequences that match your desired output format',
      'Test different sequences to find optimal truncation points',
      'Combine with temperature/Top-P for complete response control'
    ]
  });
});

export default router;
