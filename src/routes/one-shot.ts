// src/routes/one-shot.ts
import express from 'express';
import { performOneShotPrompting, detectTaskType, oneShotExamples } from '../lib/one-shot-prompting.js';

const router = express.Router();

/**
 * One-shot prompting endpoint
 * POST /api/one-shot
 */
router.post('/', async (req, res) => {
  try {
    const { query, taskType } = req.body;

    if (!query) {
      return res.status(400).json({ 
        error: 'Query is required' 
      });
    }

    // Auto-detect task type if not provided
    const detectedType = taskType || detectTaskType(query);
    
    console.log(`🎯 One-shot task detected: ${detectedType}`);
    console.log(`📝 Query: "${query}"`);

    const result = await performOneShotPrompting({
      type: detectedType,
      userQuery: query,
      temperature: 0.7
    });

    res.json({
      query,
      taskType: detectedType,
      exampleUsed: oneShotExamples[detectedType].input,
      response: result,
      method: 'one-shot',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('One-shot prompting error:', error);
    res.status(500).json({ 
      error: 'Internal server error during one-shot prompting' 
    });
  }
});

/**
 * Compare zero-shot vs one-shot responses
 * POST /api/one-shot/compare
 */
router.post('/compare', async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query required for comparison' });
    }

    const taskType = detectTaskType(query);
    
    // Zero-shot response (no example)
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI('AIzaSyBly_i9JKks9T-G2KE_-Y9thsIYLm0mWiw');
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const zeroShotPrompt = `You are Only Explore, an AI travel assistant. Answer this question: ${query}`;
    const zeroShotResult = await model.generateContent(zeroShotPrompt);
    
    // One-shot response (with example)
    const oneShotResult = await performOneShotPrompting({
      type: taskType,
      userQuery: query
    });

    res.json({
      query,
      taskType,
      comparison: {
        zeroShot: {
          response: zeroShotResult.response.text(),
          method: 'zero-shot'
        },
        oneShot: {
          response: oneShotResult,
          method: 'one-shot',
          exampleUsed: oneShotExamples[taskType].input
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Comparison error:', error);
    res.status(500).json({ error: 'Comparison failed' });
  }
});

/**
 * Test one-shot prompting with travel examples
 * GET /api/one-shot/test
 */
router.get('/test', async (req, res) => {
  const testQueries = [
    'Plan a 4-day romantic trip to Paris',
    'What foods should I try in Italy?', 
    'How much does a week in Thailand cost?',
    'What cultural experiences are unique to India?'
  ];

  try {
    const results = [];
    
    for (const query of testQueries) {
      const taskType = detectTaskType(query);
      console.log(`🧪 Testing one-shot: "${query}" (${taskType})`);
      
      const response = await performOneShotPrompting({
        type: taskType,
        userQuery: query
      });
      
      results.push({
        query,
        taskType,
        exampleUsed: oneShotExamples[taskType].input,
        response: response.substring(0, 200) + '...',
        fullResponseLength: response.length
      });
    }

    res.json({
      method: 'one-shot',
      testResults: results,
      availableTypes: Object.keys(oneShotExamples),
      summary: `Tested ${testQueries.length} one-shot prompting scenarios`
    });

  } catch (error) {
    console.error('One-shot test error:', error);
    res.status(500).json({ error: 'One-shot test failed' });
  }
});

export default router;
