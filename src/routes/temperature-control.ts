// src/routes/temperature-control.ts
import express from 'express';
import { 
  performTemperatureControlledPrompting, 
  detectOptimalTemperature, 
  compareTemperatures,
  temperatureSettings 
} from '../lib/temperature-control.js';

const router = express.Router();

/**
 * Temperature-controlled prompting endpoint
 * POST /api/temperature
 */
router.post('/', async (req, res) => {
  try {
    const { query, taskType, temperature, context } = req.body;

    if (!query) {
      return res.status(400).json({ 
        error: 'Query is required' 
      });
    }

    // Auto-detect task type if not provided
    const detectedTaskType = taskType || detectOptimalTemperature(query);
    
    console.log(`🌡️ Temperature control: ${detectedTaskType} for "${query.substring(0, 50)}..."`);

    const result = await performTemperatureControlledPrompting({
      taskType: detectedTaskType,
      customTemperature: temperature,
      userQuery: query,
      context
    });

    res.json({
      query,
      detectedTaskType,
      result,
      temperatureInfo: temperatureSettings[detectedTaskType],
      method: 'temperature-controlled',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Temperature control error:', error);
    res.status(500).json({ 
      error: 'Internal server error during temperature controlled prompting' 
    });
  }
});

/**
 * Compare responses across different temperatures
 * POST /api/temperature/compare
 */
router.post('/compare', async (req, res) => {
  try {
    const { query, context } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query required for temperature comparison' });
    }

    console.log(`🔬 Comparing temperatures for: "${query.substring(0, 50)}..."`);

    const comparison = await compareTemperatures(query, context);

    res.json({
      query,
      context: context || null,
      temperatureComparison: comparison,
      insights: {
        factualBest: 'Use for precise information, calculations, and factual queries',
        balancedBest: 'Use for general travel advice, recommendations, and explanations', 
        creativeBest: 'Use for inspirational content, storytelling, and experiential descriptions'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Temperature comparison error:', error);
    res.status(500).json({ error: 'Temperature comparison failed' });
  }
});

/**
 * Smart temperature endpoint - automatically selects optimal temperature
 * POST /api/temperature/smart
 */
router.post('/smart', async (req, res) => {
  try {
    const { query, context } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    // Detect optimal temperature
    const optimalTaskType = detectOptimalTemperature(query);
    
    const result = await performTemperatureControlledPrompting({
      taskType: optimalTaskType,
      userQuery: query,
      context
    });

    res.json({
      query,
      smartSelection: {
        chosenTaskType: optimalTaskType,
        reasoning: `Auto-selected ${optimalTaskType} temperature based on query analysis`,
        temperature: temperatureSettings[optimalTaskType].temperature,
        description: temperatureSettings[optimalTaskType].description
      },
      result,
      method: 'smart-temperature',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Smart temperature error:', error);
    res.status(500).json({ error: 'Smart temperature selection failed' });
  }
});

/**
 * Test temperature control with travel examples
 * GET /api/temperature/test
 */
router.get('/test', async (req, res) => {
  const testQueries = [
    {
      query: 'Calculate the exact cost breakdown for 7 days in Tokyo with a $3000 budget',
      expectedType: 'factual',
      description: 'Budget calculation requiring precise, factual response'
    },
    {
      query: 'What are some good restaurants to try in Rome?',
      expectedType: 'balanced', 
      description: 'Restaurant recommendations needing balance of facts and creativity'
    },
    {
      query: 'Describe the magical experience of watching sunset over Santorini',
      expectedType: 'creative',
      description: 'Experiential description requiring creative, vivid language'
    },
    {
      query: 'What visa documents do I need for traveling to Japan?',
      expectedType: 'factual',
      description: 'Legal requirements needing precise, accurate information'
    }
  ];

  try {
    const results = [];

    for (const testCase of testQueries) {
      console.log(`🧪 Testing temperature: ${testCase.description}`);
      
      const detectedType = detectOptimalTemperature(testCase.query);
      const result = await performTemperatureControlledPrompting({
        taskType: detectedType,
        userQuery: testCase.query
      });

      results.push({
        query: testCase.query,
        expectedType: testCase.expectedType,
        detectedType,
        correct: detectedType === testCase.expectedType,
        temperature: result.temperature,
        response: result.response.substring(0, 200) + '...',
        description: testCase.description
      });
    }

    const accuracy = results.filter(r => r.correct).length / results.length;

    res.json({
      method: 'temperature-control',
      testResults: results,
      accuracy: `${(accuracy * 100).toFixed(1)}%`,
      temperatureSettings,
      summary: `Tested ${testQueries.length} temperature control scenarios with ${(accuracy * 100).toFixed(1)}% accuracy`
    });

  } catch (error) {
    console.error('Temperature test error:', error);
    res.status(500).json({ error: 'Temperature control test failed' });
  }
});

/**
 * Get temperature settings info
 * GET /api/temperature/info
 */
router.get('/info', (req, res) => {
  res.json({
    temperatureSettings,
    explanation: {
      concept: 'Temperature controls the creativity vs. determinism trade-off in AI responses',
      lowTemperature: 'More predictable, factual, consistent responses',
      highTemperature: 'More creative, varied, imaginative responses'
    },
    travelApplications: {
      factual: 'Budget calculations, visa info, travel facts',
      balanced: 'Restaurant recommendations, general advice',
      creative: 'Destination descriptions, travel stories'
    }
  });
});

export default router;
