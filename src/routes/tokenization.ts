// src/routes/tokenization.ts
import express from 'express';
import { 
  analyzeTravelTokenization,
  optimizeTextForTokens,
  analyzeDestinationTokens,
  chunkTextByTokens,
  calculateTokenBudget,
  demonstrateTokenizationDifferences,
  travelTokenizationExamples,
  modelPricing
} from '../lib/tokenization.js';

const router = express.Router();

/**
 * Analyze tokenization for travel text
 * POST /api/tokenization/analyze
 */
router.post('/analyze', (req, res) => {
  try {
    const { text, model } = req.body;

    if (!text) {
      return res.status(400).json({ 
        error: 'Text is required for tokenization analysis' 
      });
    }

    console.log(`🔤 Analyzing tokenization for: "${text.substring(0, 50)}..."`);

    const analysis = analyzeTravelTokenization(text);

    res.json({
      text,
      analysis: {
        tokens: analysis.tokens,
        tokenCount: analysis.tokenCount,
        estimatedCost: analysis.estimatedCost,
        model: analysis.model
      },
      tokenBreakdown: {
        averageTokenLength: (text.length / analysis.tokenCount).toFixed(2),
        charactersPerToken: (text.length / analysis.tokenCount).toFixed(1),
        efficiency: analysis.tokenCount > text.split(' ').length ? 'SubWord' : 'Word-based'
      },
      method: 'travel-tokenization-analysis',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Tokenization analysis error:', error);
    res.status(500).json({ 
      error: 'Tokenization analysis failed' 
    });
  }
});

/**
 * Optimize text for token efficiency
 * POST /api/tokenization/optimize
 */
router.post('/optimize', (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required for optimization' });
    }

    console.log(`⚡ Optimizing text for tokens: "${text.substring(0, 50)}..."`);

    const optimization = optimizeTextForTokens(text);

    res.json({
      optimization: {
        original: {
          text: optimization.original.text,
          tokenCount: optimization.original.tokenCount,
          estimatedCost: optimization.original.estimatedCost
        },
        optimized: {
          text: optimization.optimized.text,
          tokenCount: optimization.optimized.tokenCount,
          estimatedCost: optimization.optimized.estimatedCost
        },
        savings: optimization.savings
      },
      strategies: [
        'Removed redundant adjectives (very, really, quite)',
        'Simplified common phrases (in order to → to)',
        'Replaced longer words with shorter equivalents',
        'Removed filler words and extra whitespace'
      ],
      method: 'token-optimization',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Token optimization error:', error);
    res.status(500).json({ error: 'Token optimization failed' });
  }
});

/**
 * Analyze tokens for multiple destinations
 * POST /api/tokenization/destinations
 */
router.post('/destinations', (req, res) => {
  try {
    const { destinations } = req.body;

    if (!destinations || !Array.isArray(destinations)) {
      return res.status(400).json({ 
        error: 'Array of destination names is required' 
      });
    }

    console.log(`🌍 Analyzing tokens for ${destinations.length} destinations`);

    const analysis = analyzeDestinationTokens(destinations);

    res.json({
      destinations,
      analysis: {
        destinations: analysis.destinations.map(d => ({
          name: d.name,
          tokenCount: d.tokenCount,
          estimatedCost: parseFloat(d.estimatedCost.toFixed(6)),
          tokens: d.tokens
        })),
        summary: {
          totalDestinations: destinations.length,
          totalTokens: analysis.totalTokens,
          averageTokens: analysis.averageTokens,
          totalCost: parseFloat(analysis.totalCost.toFixed(6))
        }
      },
      insights: [
        `Most efficient: ${analysis.destinations.sort((a, b) => a.tokenCount - b.tokenCount)[0]?.name}`,
        `Most tokens: ${analysis.destinations.sort((a, b) => b.tokenCount - a.tokenCount)[0]?.name}`,
        `Average ${analysis.averageTokens} tokens per destination`
      ],
      method: 'destination-token-analysis',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Destination token analysis error:', error);
    res.status(500).json({ error: 'Destination token analysis failed' });
  }
});

/**
 * Chunk text by token limits
 * POST /api/tokenization/chunk
 */
router.post('/chunk', (req, res) => {
  try {
    const { text, maxTokensPerChunk } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required for chunking' });
    }

    const maxTokens = maxTokensPerChunk || 500;
    
    console.log(`✂️ Chunking text into ${maxTokens} token segments`);

    const chunks = chunkTextByTokens(text, maxTokens);
    
    const chunkAnalysis = chunks.map((chunk, index) => {
      const analysis = analyzeTravelTokenization(chunk);
      return {
        chunkIndex: index + 1,
        text: chunk,
        tokenCount: analysis.tokenCount,
        estimatedCost: analysis.estimatedCost
      };
    });

    const totalTokens = chunkAnalysis.reduce((sum, chunk) => sum + chunk.tokenCount, 0);
    const totalCost = chunkAnalysis.reduce((sum, chunk) => sum + (chunk.estimatedCost || 0), 0);

    res.json({
      text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
      chunking: {
        maxTokensPerChunk: maxTokens,
        totalChunks: chunks.length,
        chunks: chunkAnalysis.map(c => ({
          chunkIndex: c.chunkIndex,
          tokenCount: c.tokenCount,
          estimatedCost: parseFloat((c.estimatedCost || 0).toFixed(6)),
          preview: c.text.substring(0, 100) + '...'
        })),
        summary: {
          totalTokens,
          totalCost: parseFloat(totalCost.toFixed(6)),
          averageTokensPerChunk: Math.round(totalTokens / chunks.length)
        }
      },
      method: 'token-aware-chunking',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Text chunking error:', error);
    res.status(500).json({ error: 'Text chunking failed' });
  }
});

/**
 * Calculate token budget for queries
 * POST /api/tokenization/budget
 */
router.post('/budget', (req, res) => {
  try {
    const { queries, model, maxBudget } = req.body;

    if (!queries || !Array.isArray(queries)) {
      return res.status(400).json({ 
        error: 'Array of queries is required for budget calculation' 
      });
    }

    const budgetLimit = maxBudget || 1.0; // $1.00 default
    const selectedModel = model || 'gemini-1.5-flash';

    console.log(`💰 Calculating token budget for ${queries.length} queries`);

    const budget = calculateTokenBudget(queries, selectedModel, budgetLimit);

    res.json({
      queries: budget.queries.map(q => ({
        query: q.query,
        tokens: q.tokens,
        cost: parseFloat(q.cost.toFixed(6)),
        withinBudget: q.withinBudget
      })),
      budget: {
        maxBudget: budgetLimit,
        totalCost: parseFloat(budget.totalCost.toFixed(6)),
        budgetRemaining: parseFloat(budget.budgetRemaining.toFixed(6)),
        budgetUtilization: `${((budget.totalCost / budgetLimit) * 100).toFixed(1)}%`
      },
      model: {
        name: selectedModel,
        pricing: modelPricing[selectedModel as keyof typeof modelPricing]
      },
      recommendations: budget.recommendations,
      method: 'token-budget-analysis',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Token budget calculation error:', error);
    res.status(500).json({ error: 'Token budget calculation failed' });
  }
});

/**
 * Test tokenization with travel examples
 * GET /api/tokenization/test
 */
router.get('/test', (req, res) => {
  try {
    console.log('🧪 Testing tokenization with travel examples');

    const results = travelTokenizationExamples.map((example, index) => {
      const analysis = analyzeTravelTokenization(example.query);
      const optimization = optimizeTextForTokens(example.query);
      
      return {
        exampleIndex: index + 1,
        query: example.query,
        description: example.description,
        analysis: {
          originalTokens: analysis.tokenCount,
          optimizedTokens: optimization.optimized.tokenCount,
          tokenSavings: optimization.savings.tokens,
          costSavings: parseFloat(optimization.savings.cost.toFixed(6)),
          percentageSavings: optimization.savings.percentage
        },
        tokens: analysis.tokens
      };
    });

    const averageTokens = results.reduce((sum, r) => sum + r.analysis.originalTokens, 0) / results.length;
    const averageSavings = results.reduce((sum, r) => sum + r.analysis.percentageSavings, 0) / results.length;

    res.json({
      method: 'tokenization-testing',
      testResults: results,
      summary: {
        totalExamples: travelTokenizationExamples.length,
        averageTokens: Math.round(averageTokens),
        averageSavings: `${averageSavings.toFixed(1)}%`,
        totalOriginalTokens: results.reduce((sum, r) => sum + r.analysis.originalTokens, 0),
        totalOptimizedTokens: results.reduce((sum, r) => sum + r.analysis.optimizedTokens, 0)
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Tokenization test error:', error);
    res.status(500).json({ error: 'Tokenization test failed' });
  }
});

/**
 * Demonstrate tokenization methods
 * POST /api/tokenization/demo
 */
router.post('/demo', (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required for demonstration' });
    }

    console.log(`📚 Demonstrating tokenization methods for: "${text.substring(0, 50)}..."`);

    const demo = demonstrateTokenizationDifferences(text);

    res.json({
      text,
      demonstration: demo.tokenizations,
      insights: demo.insights,
      comparison: {
        methodCount: demo.tokenizations.length,
        tokenCountRange: {
          min: Math.min(...demo.tokenizations.map(t => t.tokenCount)),
          max: Math.max(...demo.tokenizations.map(t => t.tokenCount))
        }
      },
      explanation: {
        concept: 'Tokenization breaks text into smaller units for AI processing',
        importance: 'Affects model understanding, processing speed, and API costs',
        optimization: 'Reducing tokens improves efficiency and reduces costs'
      },
      method: 'tokenization-demonstration',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Tokenization demo error:', error);
    res.status(500).json({ error: 'Tokenization demonstration failed' });
  }
});

/**
 * Get tokenization information
 * GET /api/tokenization/info
 */
router.get('/info', (req, res) => {
  res.json({
    concept: 'Tokenization breaks text into smallest units (tokens) that AI models can process',
    importance: [
      'Foundation of all AI text processing',
      'Directly impacts API costs and processing speed',
      'Affects model understanding and output quality',
      'Critical for embedding generation and similarity search'
    ],
    travelApplications: {
      userQueries: 'Process search queries like "romantic beaches in Asia"',
      destinationData: 'Tokenize destination descriptions for embeddings',
      costOptimization: 'Reduce API costs by optimizing token usage',
      contentChunking: 'Split long travel content for processing limits'
    },
    tokenizationMethods: {
      wordBased: 'Split by words and spaces - simple but loses punctuation',
      subwordBased: 'Split into meaningful subunits - handles unknown words better',
      characterBased: 'Individual characters - very granular but less meaningful'
    },
    optimization: {
      strategies: [
        'Remove redundant adjectives and filler words',
        'Use shorter synonyms where appropriate',
        'Combine related sentences to reduce overhead',
        'Remove unnecessary punctuation and formatting'
      ],
      benefits: [
        'Reduced API costs through lower token usage',
        'Faster processing with smaller input sizes',
        'Better focus on important content',
        'Improved model attention on key information'
      ]
    },
    modelPricing,
    estimationFormula: 'Approximately 4 characters per token for English text',
    examples: travelTokenizationExamples,
    bestPractices: [
      'Always estimate token counts before API calls',
      'Implement token budgeting for cost control',
      'Use optimization for frequently used queries',
      'Monitor token usage patterns for efficiency improvements'
    ]
  });
});

export default router;
