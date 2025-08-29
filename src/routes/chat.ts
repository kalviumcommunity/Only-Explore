// src/routes/chat.ts
import express from 'express';
import { processFunctionCall } from '../lib/function-calling.js';

const router = express.Router();

/**
 * Chat endpoint with function calling
 * POST /api/chat
 */
router.post('/chat', async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    if (!message) {
      return res.status(400).json({ 
        error: 'Message is required' 
      });
    }

    // Process the message with function calling
    const result = await processFunctionCall(message);
    
    res.json({
      sessionId: sessionId || 'default',
      response: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Chat API error:', error);
    res.status(500).json({ 
      error: 'Internal server error during chat processing' 
    });
  }
});

/**
 * Test function calling endpoint
 * GET /api/chat/test
 */
router.get('/test', async (req, res) => {
  const testMessages = [
    'Find me beach destinations in Southeast Asia',
    'Plan a 5-day trip to Tokyo with a budget of $2000',
    'Book a flight from New York to Paris on December 15th',
    'Find hotels in Rome for 2 guests from Jan 10 to Jan 15'
  ];

  try {
    const results = [];
    
    for (const message of testMessages) {
      console.log(`\n🧪 Testing: "${message}"`);
      const result = await processFunctionCall(message);
      results.push({
        input: message,
        output: result
      });
    }

    res.json({
      testResults: results,
      summary: `Tested ${testMessages.length} function calling scenarios`
    });

  } catch (error) {
    console.error('Test error:', error);
    res.status(500).json({ error: 'Test execution failed' });
  }
});

export default router;
