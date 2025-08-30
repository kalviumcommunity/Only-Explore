// src/routes/multi-shot.ts
import express from 'express';
import { 
  performMultiShotPrompting, 
  detectTaskTypeWithConfidence, 
  multiShotExamples 
} from '../lib/multi-shot-prompting.js';
import { performOneShotPrompting } from '../lib/one-shot-prompting.js';

const router = express.Router();

/**
 * Multi-shot prompting endpoint
 * POST /api/multi-shot
 */
router.post('/', async (req, res) => {
  try {
    const { query, taskType } = req.body;

    if (!query) {
      return res.status(400).json({ 
        error: 'Query is required' 
      });
    }

    // Auto-detect task type with confidence if not provided
    const detection = taskType ? 
      { type: taskType, confidence: 1.0 } : 
      detectTaskTypeWithConfidence(query);
    
    console.log(`🎯 Multi-shot task: ${detection.type} (confidence: ${detection.confidence.toFixed(2)})`);
    console.log(`📝 Query: "${query}"`);

    const result = await performMultiShotPrompting({
      type: detection.type,
      userQuery: query,
      temperature: 0.7
    });

    res.json({
      query,
      taskType: detection.type,
      confidence: detection.confidence,
      examplesUsed: multiShotExamples[detection.type].length,
      examples: multiShotExamples[detection.type].map(ex => ex.input),
      response: result,
      method: 'multi-shot',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Multi-shot prompting error:', error);
    res.status(500).json({ 
      error: 'Internal server error during multi-shot prompting' 
    });
  }
});

/**
 * Compare zero-shot vs one-shot vs multi-shot responses
 * POST /api/multi-shot/compare-all
 */
router.post('/compare-all', async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query required for comparison' });
    }

    const detection = detectTaskTypeWithConfidence(query);
    
    // Zero-shot response (no examples)
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI('AIzaSyBly_i9JKks9T-G2KE_-Y9thsIYLm0mWiw');
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const zeroShotPrompt = `You are Only Explore, an AI travel assistant. Answer this question: ${query}`;
    const zeroShotResult = await model.generateContent(zeroShotPrompt);
    
    // One-shot response
    const oneShotResult = await performOneShotPrompting({
      type: detection.type,
      userQuery: query
    });
    
    // Multi-shot response
    const multiShotResult = await performMultiShotPrompting({
      type: detection.type,
      userQuery: query
    });

    res.json({
      query,
      taskType: detection.type,
      confidence: detection.confidence,
      comparison: {
        zeroShot: {
          response: zeroShotResult.response.text(),
          method: 'zero-shot',
          examples: 0
        },
        oneShot: {
          response: oneShotResult,
          method: 'one-shot', 
          examples: 1
        },
        multiShot: {
          response: multiShotResult,
          method: 'multi-shot',
          examples: multiShotExamples[detection.type].length
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Full comparison error:', error);
    res.status(500).json({ error: 'Comparison failed' });
  }
});

/**
 * Test multi-shot prompting with travel examples
 * GET /api/multi-shot/test
 */
router.get('/test', async (req, res) => {
  const testQueries = [
    'Plan a 6-day adventure trip to New Zealand',
    'What are the most authentic dishes to try in Mexico?',
    'How much should I budget for 10 days in Europe?',
    'What cultural customs should I know before visiting Morocco?'
  ];

  try {
    const results = [];
    
    for (const query of testQueries) {
      const detection = detectTaskTypeWithConfidence(query);
      console.log(`🧪 Testing multi-shot: "${query}" (${detection.type})`);
      
      const response = await performMultiShotPrompting({
        type: detection.type,
        userQuery: query
      });
      
      results.push({
        query,
        taskType: detection.type,
        confidence: detection.confidence,
        examplesUsed: multiShotExamples[detection.type].length,
        response: response.substring(0, 250) + '...',
        fullResponseLength: response.length
      });
    }

    res.json({
      method: 'multi-shot',
      testResults: results,
      availableTypes: Object.keys(multiShotExamples),
      totalExamples: Object.values(multiShotExamples).reduce((sum, examples) => sum + examples.length, 0),
      summary: `Tested ${testQueries.length} multi-shot prompting scenarios`
    });

  } catch (error) {
    console.error('Multi-shot test error:', error);
    res.status(500).json({ error: 'Multi-shot test failed' });
  }
});

export default router;

