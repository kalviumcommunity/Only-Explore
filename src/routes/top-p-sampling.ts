// src/routes/top-p-sampling.ts
import express from 'express';
import { 
  performTopPSampling, 
  detectOptimalTopPMode, 
  compareTopPModes,
  performDynamicTopP,
  topPSettings 
} from '../lib/top-p-sampling.js';

const router = express.Router();

/**
 * Top-P sampling endpoint
 * POST /api/top-p
 */
router.post('/', async (req, res) => {
  try {
    const { query, mode, topP, temperature, context } = req.body;

    if (!query) {
      return res.status(400).json({ 
        error: 'Query is required' 
      });
    }

    // Auto-detect mode if not provided
    const detectedMode = mode || detectOptimalTopPMode(query);
    
    console.log(`🎯 Top-P sampling: ${detectedMode} mode for "${query.substring(0, 50)}..."`);

    const result = await performTopPSampling({
      mode: detectedMode,
      customTopP: topP,
      customTemperature: temperature,
      userQuery: query,
      context
    });

    res.json({
      query,
      detectedMode,
      result,
      modeInfo: topPSettings[detectedMode],
      method: 'top-p-sampling',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Top-P sampling error:', error);
    res.status(500).json({ 
      error: 'Internal server error during Top-P sampling' 
    });
  }
});

/**
 * Compare responses across different Top-P values
 * POST /api/top-p/compare
 */
router.post('/compare', async (req, res) => {
  try {
    const { query, context } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query required for Top-P comparison' });
    }

    console.log(`🔬 Comparing Top-P modes for: "${query.substring(0, 50)}..."`);

    const comparison = await compareTopPModes(query, context);

    res.json({
      query,
      context: context || null,
      topPComparison: comparison,
      insights: {
        focused: `Top-P ${topPSettings.focused.topP}: ${topPSettings.focused.description}`,
        balanced: `Top-P ${topPSettings.balanced.topP}: ${topPSettings.balanced.description}`, 
        creative: `Top-P ${topPSettings.creative.topP}: ${topPSettings.creative.description}`
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Top-P comparison error:', error);
    res.status(500).json({ error: 'Top-P comparison failed' });
  }
});

/**
 * Dynamic Top-P based on user preferences
 * POST /api/top-p/dynamic
 */
router.post('/dynamic', async (req, res) => {
  try {
    const { query, preferences } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const result = await performDynamicTopP(query, preferences);

    res.json({
      query,
      userPreferences: preferences || {},
      dynamicResult: result,
      explanation: 'Top-P value dynamically adjusted based on user preferences and risk tolerance',
      method: 'dynamic-top-p',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Dynamic Top-P error:', error);
    res.status(500).json({ error: 'Dynamic Top-P adjustment failed' });
  }
});

/**
 * Test Top-P sampling with travel examples
 * GET /api/top-p/test
 */
router.get('/test', async (req, res) => {
  const testQueries = [
    {
      query: 'What are the essential must-visit places in Paris?',
      expectedMode: 'focused',
      description: 'Essential attractions requiring popular, reliable recommendations'
    },
    {
      query: 'Suggest some good restaurants and activities in Tokyo',
      expectedMode: 'balanced',
      description: 'General recommendations needing mix of popular and unique options'
    },
    {
      query: 'Show me hidden gems and unique experiences in Barcelona',
      expectedMode: 'creative',
      description: 'Unique experiences requiring diverse, creative suggestions'
    },
    {
      query: 'Plan a safe, standard itinerary for Rome',
      expectedMode: 'focused',
      description: 'Safe planning requiring conservative, proven recommendations'
    }
  ];

  try {
    const results = [];

    for (const testCase of testQueries) {
      console.log(`🧪 Testing Top-P: ${testCase.description}`);
      
      const detectedMode = detectOptimalTopPMode(testCase.query);
      const result = await performTopPSampling({
        mode: detectedMode,
        userQuery: testCase.query
      });

      results.push({
        query: testCase.query,
        expectedMode: testCase.expectedMode,
        detectedMode,
        correct: detectedMode === testCase.expectedMode,
        topP: result.topP,
        temperature: result.temperature,
        response: result.response.substring(0, 200) + '...',
        description: testCase.description
      });
    }

    const accuracy = results.filter(r => r.correct).length / results.length;

    res.json({
      method: 'top-p-sampling',
      testResults: results,
      accuracy: `${(accuracy * 100).toFixed(1)}%`,
      topPSettings,
      summary: `Tested ${testQueries.length} Top-P sampling scenarios with ${(accuracy * 100).toFixed(1)}% detection accuracy`
    });

  } catch (error) {
    console.error('Top-P test error:', error);
    res.status(500).json({ error: 'Top-P sampling test failed' });
  }
});

/**
 * Get Top-P settings and explanation
 * GET /api/top-p/info
 */
router.get('/info', (req, res) => {
  res.json({
    topPSettings,
    explanation: {
      concept: 'Top-P (Nucleus Sampling) controls the diversity of word choices during text generation',
      lowTopP: 'Considers only high-probability words, leading to focused, conservative responses',
      highTopP: 'Considers broader vocabulary, enabling creative and diverse responses',
      dynamic: 'The number of words considered varies based on their probability distribution'
    },
    travelApplications: {
      focused: 'Essential attractions, safety info, proven itineraries',
      balanced: 'Restaurant recommendations, general travel advice',
      creative: 'Hidden gems, unique experiences, storytelling'
    },
    comparisonWithTemperature: {
      temperature: 'Controls randomness in selection among chosen words',
      topP: 'Controls which words are available for selection',
      combined: 'Together they provide fine-grained control over response style'
    }
  });
});

export default router;
