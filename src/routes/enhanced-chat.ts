// src/routes/enhanced-chat.ts
import express from 'express';
import { performOneShotPrompting, detectTaskType } from '../lib/one-shot-prompting.js';
import { processFunctionCallingChat } from '../lib/function-calling-updated.js';
import { processBasicChat } from '../lib/basic-chat.js';

const router = express.Router();

/**
 * Enhanced chat with multiple prompting strategies
 * POST /api/chat/enhanced
 */
router.post('/enhanced', async (req, res) => {
  try {
    const { message, strategy, sessionId } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    let result;
    const startTime = Date.now();

    switch (strategy) {
      case 'one-shot':
        const taskType = detectTaskType(message);
        const oneShotResponse = await performOneShotPrompting({
          type: taskType,
          userQuery: message
        });
        result = {
          type: 'one-shot',
          taskType,
          content: oneShotResponse,
          strategy: 'one-shot'
        };
        break;

      case 'function-calling':
        result = await processFunctionCallingChat(message);
        result.strategy = 'function-calling';
        break;

      case 'basic':
      default:
        const basicResult = await processBasicChat(message, sessionId);
        result = {
          type: 'basic',
          content: basicResult.response,
          sessionId: basicResult.sessionId,
          strategy: 'basic'
        };
        break;
    }

    const processingTime = Date.now() - startTime;

    res.json({
      message,
      response: result,
      processingTime: `${processingTime}ms`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Enhanced chat error:', error);
    res.status(500).json({ error: 'Enhanced chat processing failed' });
  }
});

export default router;
