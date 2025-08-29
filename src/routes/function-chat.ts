// src/routes/function-chat.ts
import express from 'express';
import { processFunctionCallingChat } from '../lib/function-calling-updated.js';

const router = express.Router();

/**
 * Function calling chat endpoint
 * POST /api/chat/functions
 */
router.post('/functions', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ 
        error: 'Message is required and must be a string' 
      });
    }

    const result = await processFunctionCallingChat(message.trim());
    
    res.json({
      response: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Function calling chat error:', error);
    res.status(500).json({ 
      error: 'Internal server error during function calling' 
    });
  }
});

/**
 * Test function calling with example queries
 * GET /api/chat/test-functions
 */
router.get('/test-functions', async (req, res) => {
  const testMessages = [
    'Find me hotels in Bali',
    'What are popular foods in Tokyo?', 
    'Show me flights from New York to Paris on 2025-12-25',
    'What should I visit in Rome?'  // This should trigger regular text response
  ];

  try {
    const results = [];
    
    for (const message of testMessages) {
      console.log(`\n🧪 Testing: "${message}"`);
      const result = await processFunctionCallingChat(message);
      
      results.push({
        input: message,
        output: {
          type: result.type,
          functionCalled: result.type === 'function_call' ? result.functionName : null,
          response: result.finalResponse || result.content,
          hasFunction: result.type === 'function_call'
        }
      });
    }

    res.json({
      testResults: results,
      summary: `Tested ${testMessages.length} function calling scenarios`,
      functionsAvailable: ['searchHotels', 'getLocalCuisine', 'findFlights']
    });

  } catch (error) {
    console.error('Function calling test error:', error);
    res.status(500).json({ error: 'Test execution failed' });
  }
});

export default router;
