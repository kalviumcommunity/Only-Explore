// src/routes/zero-shot.ts
import express from 'express';
import { performZeroShotPrompting, travelZeroShotTasks } from '../lib/zero-shot-prompting.js';

const router = express.Router();

/**
 * Zero-shot prompting endpoint
 * POST /api/zero-shot
 */
router.post('/', async (req, res) => {
  try {
    const { task, context, temperature } = req.body;

    if (!task) {
      return res.status(400).json({ 
        error: 'Task description is required' 
      });
    }

    console.log(`🎯 Zero-shot task: "${task.substring(0, 100)}..."`);
    
    const result = await performZeroShotPrompting({
      task,
      context,
      temperature: temperature || 0.7
    });

    res.json({
      task,
      context: context || null,
      response: result,
      method: 'zero-shot',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Zero-shot prompting error:', error);
    res.status(500).json({ 
      error: 'Internal server error during zero-shot prompting' 
    });
  }
});

/**
 * Test zero-shot prompting with travel examples
 * GET /api/zero-shot/test
 */
router.get('/test', async (req, res) => {
  try {
    const results = [];

    console.log('🧪 Testing Zero-Shot Prompting with travel tasks...\n');
    
    for (const taskConfig of travelZeroShotTasks) {
      console.log(`🎯 Task: ${taskConfig.task.substring(0, 80)}...`);
      
      const startTime = Date.now();
      const response = await performZeroShotPrompting(taskConfig);
      const duration = Date.now() - startTime;
      
      results.push({
        task: taskConfig.task,
        context: taskConfig.context,
        response: response.substring(0, 300) + '...', // Truncate for API response
        responseLength: response.length,
        processingTime: `${duration}ms`
      });
    }

    res.json({
      method: 'zero-shot',
      testResults: results,
      summary: `Completed ${travelZeroShotTasks.length} zero-shot travel tasks`,
      totalTasks: travelZeroShotTasks.length
    });

  } catch (error) {
    console.error('Zero-shot test error:', error);
    res.status(500).json({ error: 'Zero-shot test execution failed' });
  }
});

export default router;
