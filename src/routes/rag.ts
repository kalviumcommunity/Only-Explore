// src/routes/rag.ts
import express from 'express';
import { 
  performRAG, 
  compareRAGvsDirect,
  performAdvancedRAG,
  performFilteredRAG
} from '../lib/rag.js';

const router = express.Router();

/**
 * RAG (Retrieval-Augmented Generation) endpoint
 * POST /api/rag
 */
router.post('/', async (req, res) => {
  try {
    const { 
      query, 
      maxRetrievedDocs = 5,
      similarityThreshold = 0.7,
      includeCitations = true,
      responseFormat = 'detailed',
      contextWindow = 3000
    } = req.body;

    if (!query) {
      return res.status(400).json({ 
        error: 'Query is required' 
      });
    }

    console.log(`🔍 RAG: Processing "${query.substring(0, 50)}..."`);

    const result = await performRAG({
      query,
      maxRetrievedDocs,
      similarityThreshold,
      includeCitations,
      responseFormat,
      contextWindow
    });

    res.json({
      query,
      result: {
        augmentedResponse: result.augmentedResponse,
        citations: result.citations,
        method: result.method
      },
      retrieval: {
        documentsRetrieved: result.retrievalStats.documentsRetrieved,
        averageSimilarity: result.retrievalStats.averageSimilarity,
        contextLength: result.retrievalStats.contextLength,
        documents: result.retrievedDocuments.map(doc => ({
          title: doc.title,
          similarity: doc.similarity,
          contentPreview: doc.content.substring(0, 100) + '...'
        }))
      },
      configuration: {
        maxRetrievedDocs,
        similarityThreshold,
        includeCitations,
        responseFormat,
        contextWindow
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('RAG error:', error);
    res.status(500).json({ 
      error: 'Internal server error during RAG processing' 
    });
  }
});

/**
 * Compare RAG vs Direct Generation
 * POST /api/rag/compare
 */
router.post('/compare', async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query required for comparison' });
    }

    console.log(`🔬 Comparing RAG vs Direct for: "${query.substring(0, 50)}..."`);

    const comparison = await compareRAGvsDirect(query);

    res.json({
      query,
      ragApproach: {
        response: comparison.ragResult.augmentedResponse.substring(0, 400) + '...',
        documentsRetrieved: comparison.ragResult.retrievalStats.documentsRetrieved,
        citations: comparison.ragResult.citations,
        averageSimilarity: comparison.ragResult.retrievalStats.averageSimilarity,
        advantages: ['Factual accuracy', 'Up-to-date information', 'Source citations', 'Context-aware responses']
      },
      directApproach: {
        response: comparison.directResult.substring(0, 400) + '...',
        documentsRetrieved: 0,
        citations: [],
        advantages: ['Faster response', 'Lower computational cost', 'General knowledge access']
      },
      comparison: comparison.comparison,
      insights: {
        rag: 'Best for factual queries requiring current information and citations',
        direct: 'Best for general knowledge and creative responses'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('RAG comparison error:', error);
    res.status(500).json({ error: 'RAG comparison failed' });
  }
});

/**
 * Advanced RAG with multi-step retrieval
 * POST /api/rag/advanced
 */
router.post('/advanced', async (req, res) => {
  try {
    const { query, options = {} } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    console.log(`🚀 Advanced RAG for: "${query}"`);

    const result = await performAdvancedRAG(query, options);

    res.json({
      query,
      options: {
        multiStepRetrieval: options.multiStepRetrieval || false,
        queryExpansion: options.queryExpansion || false,
        reranking: options.reranking || false
      },
      result: {
        expandedQueries: result.expandedQueries,
        multiStepResults: result.multiStepResults?.map(r => ({
          query: r.query,
          documentsRetrieved: r.retrievalStats.documentsRetrieved,
          averageSimilarity: r.retrievalStats.averageSimilarity
        })),
        finalResponse: result.finalResult.augmentedResponse.substring(0, 300) + '...',
        citations: result.finalResult.citations,
        enhancement: result.enhancement
      },
      benefits: 'Advanced RAG provides more comprehensive context through query expansion and multi-step retrieval',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Advanced RAG error:', error);
    res.status(500).json({ error: 'Advanced RAG processing failed' });
  }
});

/**
 * Filtered RAG with specific constraints
 * POST /api/rag/filtered
 */
router.post('/filtered', async (req, res) => {
  try {
    const { query, filters = {} } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    console.log(`🎯 Filtered RAG for: "${query}" with filters`);

    const result = await performFilteredRAG(query, filters);

    res.json({
      query,
      filters: {
        categories: filters.categories || [],
        locations: filters.locations || [],
        dateRange: filters.dateRange || null
      },
      result: {
        response: result.augmentedResponse.substring(0, 300) + '...',
        documentsRetrieved: result.retrievalStats.documentsRetrieved,
        citations: result.citations,
        averageSimilarity: result.retrievalStats.averageSimilarity
      },
      benefits: 'Filtered RAG ensures responses are relevant to specific categories, locations, or time periods',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Filtered RAG error:', error);
    res.status(500).json({ error: 'Filtered RAG processing failed' });
  }
});

/**
 * Test RAG with travel scenarios
 * GET /api/rag/test
 */
router.get('/test', async (req, res) => {
  const testScenarios = [
    {
      query: 'What are the best hiking trails in the Swiss Alps?',
      expectedDocuments: 'hiking, trails, swiss alps, mountains',
      description: 'Specific location-based query requiring factual information'
    },
    {
      query: 'How much does a week in Tokyo cost for budget travelers?',
      expectedDocuments: 'tokyo, budget, cost, japan, travel expenses',
      description: 'Cost-related query requiring current pricing information'
    },
    {
      query: 'What are the cultural customs I should know before visiting Morocco?',
      expectedDocuments: 'morocco, culture, customs, etiquette, traditions',
      description: 'Cultural query requiring local knowledge and customs'
    },
    {
      query: 'Best time to visit Bali for surfing and avoiding crowds?',
      expectedDocuments: 'bali, surfing, weather, seasons, crowd levels',
      description: 'Activity and timing query requiring seasonal information'
    }
  ];

  try {
    const results = [];

    for (const scenario of testScenarios) {
      console.log(`🧪 Testing RAG: ${scenario.description}`);
      
      const result = await performRAG({
        query: scenario.query,
        maxRetrievedDocs: 3,
        includeCitations: true,
        responseFormat: 'structured'
      });

      results.push({
        query: scenario.query,
        expectedDocuments: scenario.expectedDocuments,
        documentsRetrieved: result.retrievalStats.documentsRetrieved,
        averageSimilarity: result.retrievalStats.averageSimilarity,
        citations: result.citations.length,
        responseLength: result.augmentedResponse.length,
        response: result.augmentedResponse.substring(0, 200) + '...',
        description: scenario.description
      });
    }

    const averageSimilarity = results.reduce((sum, r) => sum + r.averageSimilarity, 0) / results.length;
    const averageCitations = results.reduce((sum, r) => sum + r.citations, 0) / results.length;

    res.json({
      method: 'retrieval-augmented-generation',
      testResults: results,
      performance: {
        averageSimilarity: Math.round(averageSimilarity * 100) / 100,
        averageCitations: Math.round(averageCitations * 10) / 10,
        averageDocumentsRetrieved: results.reduce((sum, r) => sum + r.documentsRetrieved, 0) / results.length
      },
      summary: `Tested ${testScenarios.length} RAG scenarios with ${Math.round(averageSimilarity * 100) / 100} average similarity and ${Math.round(averageCitations * 10) / 10} average citations`
    });

  } catch (error) {
    console.error('RAG test error:', error);
    res.status(500).json({ error: 'RAG test failed' });
  }
});

/**
 * Get RAG information and capabilities
 * GET /api/rag/info
 */
router.get('/info', (req, res) => {
  res.json({
    concept: 'RAG (Retrieval-Augmented Generation) combines document retrieval with AI generation for context-aware, factual responses',
    process: [
      '1. Retrieve relevant documents from travel knowledge base using semantic search',
      '2. Prepare context from retrieved documents within token limits',
      '3. Generate AI response using retrieved context and user query',
      '4. Extract citations and provide source attribution',
      '5. Calculate retrieval statistics for quality assessment'
    ],
    benefits: [
      'Factual accuracy through retrieved information',
      'Up-to-date travel knowledge and recommendations',
      'Source citations for transparency and trust',
      'Context-aware responses based on specific queries',
      'Reduced hallucination through grounded generation'
    ],
    travelApplications: {
      factualQueries: 'Current pricing, opening hours, contact information',
      locationSpecific: 'Local customs, attractions, transportation options',
      timeSensitive: 'Weather conditions, seasonal events, booking availability',
      culturalContext: 'Etiquette, traditions, cultural practices',
      practicalInfo: 'Visa requirements, health information, safety tips'
    },
    capabilities: {
      basicRAG: 'Standard retrieval and generation with citations',
      advancedRAG: 'Query expansion and multi-step retrieval',
      filteredRAG: 'Category, location, and date-based filtering',
      comparison: 'RAG vs direct generation analysis',
      testing: 'Automated scenario testing and performance metrics'
    },
    configuration: {
      maxRetrievedDocs: 'Number of documents to retrieve (default: 5)',
      similarityThreshold: 'Minimum similarity score for retrieval (default: 0.7)',
      includeCitations: 'Whether to include source citations (default: true)',
      responseFormat: 'Response style: detailed, concise, or structured',
      contextWindow: 'Maximum context length in characters (default: 3000)'
    }
  });
});

export default router;
