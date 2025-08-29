// src/server.ts
import express from 'express';
import cors from 'cors';
import { searchTravelDocs, seedTravelDocs } from './lib/embeddings.js';
import chatRoutes from './routes/chat.js';
import basicChatRoutes from './routes/basic-chat.js';

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Mount function calling chat routes
app.use('/api', chatRoutes);

// Mount basic chat routes
app.use('/api/chat', basicChatRoutes);

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
    features: ['semantic_search', 'basic_chat', 'function_calling']
  });
});

app.listen(port, () => {
  console.log(`🚀 Only Explore Server (Steps 3 & 4) running on port ${port}`);
  console.log(`📝 Search API: http://localhost:${port}/api/search?q=your_query`);
  console.log(`💬 Basic Chat: http://localhost:${port}/api/chat/basic`);
  console.log(`🤖 Function Chat: http://localhost:${port}/api/chat`);
  console.log(`🧪 Test Basic Chat: http://localhost:${port}/api/chat/test-basic`);
  console.log(`🧪 Test Functions: http://localhost:${port}/api/chat/test`);
});
