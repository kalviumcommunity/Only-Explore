// src/server.ts
import express from 'express';
import cors from 'cors';
import { searchTravelDocs, seedTravelDocs } from './lib/embeddings.js';
import chatRoutes from './routes/chat.js';
import basicChatRoutes from './routes/basic-chat.js';
import functionChatRoutes from './routes/function-chat.js';
import zeroShotRoutes from './routes/zero-shot.js';
import oneShotRoutes from './routes/one-shot.js';
import enhancedChatRoutes from './routes/enhanced-chat.js';
import multiShotRoutes from './routes/multi-shot.js';
import dynamicPromptingRoutes from './routes/dynamic-prompting.js';
import temperatureControlRoutes from './routes/temperature-control.js';
import topKSamplingRoutes from './routes/top-k-sampling.js';
import topPSamplingRoutes from './routes/top-p-sampling.js';
import stopSequenceRoutes from './routes/stop-sequences.js';
import cosineSimilarityRoutes from './routes/cosine-similarity.js';
import chainOfThoughtRoutes from './routes/chain-of-thought.js';
import rtfcRoutes from './routes/system-user-prompting.js';

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Mount function calling chat routes
app.use('/api', chatRoutes);

// Mount basic chat routes
app.use('/api/chat', basicChatRoutes);

// Mount updated function calling routes
app.use('/api/chat', functionChatRoutes);

// Mount zero-shot prompting routes
app.use('/api/zero-shot', zeroShotRoutes);

// Mount one-shot prompting routes
app.use('/api/one-shot', oneShotRoutes);

// Mount enhanced chat routes
app.use('/api/chat', enhancedChatRoutes);

// Mount multi-shot prompting routes
app.use('/api/multi-shot', multiShotRoutes);

// Mount dynamic prompting routes
app.use('/api/dynamic', dynamicPromptingRoutes);

// Mount temperature control routes
app.use('/api/temperature', temperatureControlRoutes);

// Mount Top-K sampling routes
app.use('/api/top-k', topKSamplingRoutes);

// Mount Top-P sampling routes
app.use('/api/top-p', topPSamplingRoutes);

// Mount Stop Sequences routes
app.use('/api/stop-sequences', stopSequenceRoutes);

// Mount Cosine Similarity routes
app.use('/api/cosine-similarity', cosineSimilarityRoutes);

// Mount Chain-of-Thought routes
app.use('/api/chain-of-thought', chainOfThoughtRoutes);

// Mount RTFC Framework routes
app.use('/api/rtfc', rtfcRoutes);

/**
 * Search endpoint: /api/search?q=beach vacation&limit=3
 */
app.get('/api/search', async (req, res) => {
  try {
    const query = req.query.q as string;
    const limit = parseInt(req.query.limit as string) || 5;

    if (!query) {
      return res.status(400).json({ 
        error: 'Missing query parameter "q"' 
      });
    }

    if (limit > 20) {
      return res.status(400).json({ 
        error: 'Limit cannot exceed 20' 
      });
    }

    const results = await searchTravelDocs(query, limit);
    
    res.json({
      query,
      results: results.map(doc => ({
        id: doc.id,
        title: doc.title,
        content: doc.content,
        metadata: doc.metadata,
        similarity: parseFloat(doc.similarity?.toFixed(4) || '0')
      })),
      count: results.length
    });

  } catch (error) {
    console.error('Search API error:', error);
    res.status(500).json({ 
      error: 'Internal server error during search' 
    });
  }
});

/**
 * Seed database endpoint (for development)
 */
app.post('/api/seed', async (req, res) => {
  try {
    await seedTravelDocs();
    res.json({ message: 'Database seeded successfully' });
  } catch (error) {
    console.error('Seed error:', error);
    res.status(500).json({ 
      error: 'Failed to seed database' 
    });
  }
});

/**
 * Health check
 */
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    features: ['semantic_search', 'basic_chat', 'function_calling', 'zero_shot_prompting', 'one_shot_prompting', 'multi_shot_prompting', 'dynamic_prompting', 'temperature_control', 'top_k_sampling', 'top_p_sampling', 'stop_sequences', 'cosine_similarity', 'chain_of_thought', 'rtfc_framework'],
    step: 14
  });
});

app.listen(port, () => {
  console.log(`🚀 Only Explore Server (Steps 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13 & 14) running on port ${port}`);
  console.log(`📝 Search API: http://localhost:${port}/api/search?q=your_query`);
  console.log(`💬 Basic Chat: http://localhost:${port}/api/chat/basic`);
  console.log(`🤖 Function Chat: http://localhost:${port}/api/chat`);
  console.log(`🔧 Updated Function Chat: http://localhost:${port}/api/chat/functions`);
  console.log(`🎯 Zero-shot API: http://localhost:${port}/api/zero-shot`);
  console.log(`🎯 One-shot API: http://localhost:${port}/api/one-shot`);
  console.log(`🔄 Enhanced Chat: http://localhost:${port}/api/chat/enhanced`);
  console.log(`🧪 Test Basic Chat: http://localhost:${port}/api/chat/test-basic`);
  console.log(`🧪 Test Functions: http://localhost:${port}/api/chat/test`);
  console.log(`🧪 Test Updated Functions: http://localhost:${port}/api/chat/test-functions`);
  console.log(`🧪 Test Zero-shot: http://localhost:${port}/api/zero-shot/test`);
  console.log(`🧪 Test One-shot: http://localhost:${port}/api/one-shot/test`);
  console.log(`🎯 Multi-shot API: http://localhost:${port}/api/multi-shot`);
  console.log(`🔄 Compare All: http://localhost:${port}/api/multi-shot/compare-all`);
  console.log(`🧪 Test Multi-shot: http://localhost:${port}/api/multi-shot/test`);
  console.log(`🎯 Dynamic API: http://localhost:${port}/api/dynamic`);
  console.log(`👤 Personalized: http://localhost:${port}/api/dynamic/personalized`);
  console.log(`🔄 Continue Chat: http://localhost:${port}/api/dynamic/continue`);
  console.log(`🌡️ Temperature API: http://localhost:${port}/api/temperature`);
  console.log(`🔬 Compare Temps: http://localhost:${port}/api/temperature/compare`);
  console.log(`🧠 Smart Temp: http://localhost:${port}/api/temperature/smart`);
  console.log(`🎯 Top-K API: http://localhost:${port}/api/top-k`);
  console.log(`🔬 Compare Top-K: http://localhost:${port}/api/top-k/compare`);
  console.log(`🎲 Diversity Demo: http://localhost:${port}/api/top-k/diversity`);
  console.log(`🎯 Top-P API: http://localhost:${port}/api/top-p`);
  console.log(`🔬 Compare Top-P: http://localhost:${port}/api/top-p/compare`);
  console.log(`🎛️ Dynamic Top-P: http://localhost:${port}/api/top-p/dynamic`);
  console.log(`⏹️ Stop Sequences API: http://localhost:${port}/api/stop-sequences`);
  console.log(`🔬 Compare Stops: http://localhost:${port}/api/stop-sequences/compare`);
  console.log(`🎛️ Custom Stops: http://localhost:${port}/api/stop-sequences/custom`);
  console.log(`🔍 Cosine Similarity API: http://localhost:${port}/api/cosine-similarity`);
  console.log(`🎯 Advanced Similarity: http://localhost:${port}/api/cosine-similarity/advanced`);
  console.log(`🔬 Compare Similarity: http://localhost:${port}/api/cosine-similarity/compare`);
  console.log(`🧠 Chain-of-Thought API: http://localhost:${port}/api/chain-of-thought`);
  console.log(`🔬 Compare CoT: http://localhost:${port}/api/chain-of-thought/compare`);
  console.log(`🔀 Multi-path CoT: http://localhost:${port}/api/chain-of-thought/multi-path`);
  console.log(`📋 RTFC Framework API: http://localhost:${port}/api/rtfc`);
  console.log(`🔬 Compare Prompts: http://localhost:${port}/api/rtfc/compare`);
  console.log(`🎯 Advanced RTFC: http://localhost:${port}/api/rtfc/advanced`);
});
