// src/routes/basic-chat.ts
import express from 'express';
import { processBasicChat, getChatHistory } from '../lib/basic-chat.js';

const router = express.Router();

/**
 * Basic chat endpoint - plain text responses only
 * POST /api/chat/basic
 */
router.post('/basic', async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ 
        error: 'Message is required and must be a string' 
      });
    }

    const result = await processBasicChat(message.trim(), sessionId);
    
    res.json({
      message: result.response,
      sessionId: result.sessionId,
      timestamp: new Date().toISOString(),
      type: 'text'
    });

  } catch (error) {
    console.error('Basic chat API error:', error);
    res.status(500).json({ 
      error: 'Internal server error during chat processing' 
    });
  }
});

/**
 * Get chat history
 * GET /api/chat/history/:sessionId
 */
router.get('/history/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    const history = getChatHistory(sessionId);
    
    res.json({
      sessionId,
      messages: history,
      count: history.length
    });

  } catch (error) {
    console.error('Chat history error:', error);
    res.status(500).json({ error: 'Failed to retrieve chat history' });
  }
});

/**
 * Test basic chat with sample queries
 * GET /api/chat/test-basic
 */
router.get('/test-basic', async (req, res) => {
  const testQueries = [
    'What are the best places to visit in Bali?',
    'Plan a 3-day itinerary for Paris',
    'What should I pack for a trip to Japan in winter?',
    'Tell me about street food in Thailand'
  ];

  try {
    const results = [];
    
    for (const query of testQueries) {
      console.log(`🧪 Testing basic chat: "${query}"`);
      const result = await processBasicChat(query);
      results.push({
        query,
        response: result.response.substring(0, 200) + '...',
        sessionId: result.sessionId
      });
    }

    res.json({
      testResults: results,
      summary: `Tested ${testQueries.length} basic chat interactions`
    });

  } catch (error) {
    console.error('Basic chat test error:', error);
    res.status(500).json({ error: 'Test execution failed' });
  }
});

export default router;
