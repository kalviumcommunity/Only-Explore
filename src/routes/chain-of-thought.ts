// src/routes/chain-of-thought.ts
import express from 'express';
import { 
  performChainOfThought, 
  detectCoTTaskType, 
  compareCoTvsDirect,
  performMultiPathCoT 
} from '../lib/chain-of-thought.js';

const router = express.Router();

/**
 * Chain-of-Thought prompting endpoint
 * POST /api/chain-of-thought
 */
router.post('/', async (req, res) => {
  try {
    const { query, taskType, showReasoning = true, context } = req.body;

    if (!query) {
      return res.status(400).json({ 
        error: 'Query is required' 
      });
    }

    // Auto-detect task type if not provided
    const detectedTaskType = taskType || detectCoTTaskType(query);
    
    console.log(`🧠 Chain-of-Thought: ${detectedTaskType} reasoning for "${query.substring(0, 50)}..."`);

    const result = await performChainOfThought({
      userQuery: query,
      taskType: detectedTaskType,
      showReasoning,
      context
    });

    res.json({
      query,
      taskType: detectedTaskType,
      reasoning: showReasoning ? result.reasoning : ['Reasoning hidden'],
      finalAnswer: result.finalAnswer,
      reasoningSteps: result.reasoning.length,
      method: 'chain-of-thought',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Chain-of-Thought error:', error);
    res.status(500).json({ 
      error: 'Internal server error during Chain-of-Thought processing' 
    });
  }
});

/**
 * Compare Chain-of-Thought vs Direct prompting
 * POST /api/chain-of-thought/compare
 */
router.post('/compare', async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query required for comparison' });
    }

    console.log(`🔬 Comparing CoT vs Direct for: "${query.substring(0, 50)}..."`);

    const comparison = await compareCoTvsDirect(query);

    res.json({
      query,
      chainOfThought: {
        reasoning: comparison.chainOfThought.reasoning,
        answer: comparison.chainOfThought.finalAnswer,
        steps: comparison.chainOfThought.reasoning.length
      },
      directPrompt: {
        answer: comparison.directPrompt,
        steps: 0
      },
      comparison: comparison.comparison,
      benefits: {
        chainOfThought: ['Transparent reasoning', 'Better quality answers', 'Explainable decisions'],
        directPrompt: ['Faster response', 'Simpler implementation', 'Lower token usage']
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('CoT comparison error:', error);
    res.status(500).json({ error: 'Chain-of-Thought comparison failed' });
  }
});

/**
 * Multi-path Chain-of-Thought analysis
 * POST /api/chain-of-thought/multi-path
 */
router.post('/multi-path', async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    console.log(`🔀 Multi-path CoT analysis for: "${query}"`);

    const result = await performMultiPathCoT(query);

    res.json({
      query,
      paths: result.paths.map((path, index) => ({
        perspective: path.taskType,
        reasoningSteps: path.reasoning.length,
        answer: path.finalAnswer.substring(0, 200) + '...'
      })),
      synthesis: result.synthesis,
      insights: 'Multiple reasoning perspectives provide more comprehensive travel solutions',
      method: 'multi-path-chain-of-thought',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Multi-path CoT error:', error);
    res.status(500).json({ error: 'Multi-path Chain-of-Thought failed' });
  }
});

/**
 * Test Chain-of-Thought with travel scenarios
 * GET /api/chain-of-thought/test
 */
router.get('/test', async (req, res) => {
  const testScenarios = [
    {
      query: 'Plan a 5-day adventure trip to Himachal Pradesh on a budget',
      expectedType: 'itinerary',
      description: 'Complex itinerary planning requiring step-by-step reasoning'
    },
    {
      query: 'What will a week in Thailand cost for two people?',
      expectedType: 'budget',
      description: 'Budget calculation requiring systematic cost analysis'
    },
    {
      query: 'Should I visit Goa or Kerala for beaches?',
      expectedType: 'comparison',
      description: 'Comparison task requiring structured evaluation'
    },
    {
      query: 'Recommend unique experiences in Tokyo for culture lovers',
      expectedType: 'recommendations',
      description: 'Recommendation task requiring thoughtful curation'
    }
  ];

  try {
    const results = [];

    for (const scenario of testScenarios) {
      console.log(`🧪 Testing CoT: ${scenario.description}`);
      
      const detectedType = detectCoTTaskType(scenario.query);
      const result = await performChainOfThought({
        userQuery: scenario.query,
        taskType: detectedType
      });

      results.push({
        query: scenario.query,
        expectedType: scenario.expectedType,
        detectedType,
        correct: detectedType === scenario.expectedType,
        reasoningSteps: result.reasoning.length,
        answer: result.finalAnswer.substring(0, 150) + '...',
        description: scenario.description
      });
    }

    const accuracy = results.filter(r => r.correct).length / results.length;

    res.json({
      method: 'chain-of-thought',
      testResults: results,
      accuracy: `${(accuracy * 100).toFixed(1)}%`,
      averageReasoningSteps: results.reduce((sum, r) => sum + r.reasoningSteps, 0) / results.length,
      summary: `Tested ${testScenarios.length} CoT scenarios with ${(accuracy * 100).toFixed(1)}% task detection accuracy`
    });

  } catch (error) {
    console.error('CoT test error:', error);
    res.status(500).json({ error: 'Chain-of-Thought test failed' });
  }
});

/**
 * Get Chain-of-Thought information
 * GET /api/chain-of-thought/info
 */
router.get('/info', (req, res) => {
  res.json({
    concept: 'Chain-of-Thought prompting guides AI through step-by-step reasoning before providing final answers',
    benefits: [
      'Improved answer quality through structured reasoning',
      'Transparent decision-making process',
      'Better handling of complex multi-step problems',
      'More reliable and consistent outputs'
    ],
    travelApplications: {
      itinerary: 'Step-by-step trip planning considering constraints and preferences',
      budget: 'Systematic cost analysis across all expense categories',
      recommendations: 'Thoughtful evaluation of options against user criteria',
      comparison: 'Structured analysis comparing destinations or options',
      problemSolving: 'Logical problem-solving for travel challenges'
    },
    implementation: {
      process: [
        '1. Define reasoning framework for the task type',
        '2. Guide AI through systematic step-by-step thinking',
        '3. Extract reasoning steps and final conclusion',
        '4. Present both reasoning and answer to user'
      ]
    },
    comparisonWithDirect: {
      chainOfThought: 'Slower but higher quality, transparent, explainable',
      directPrompt: 'Faster but potentially lower quality, opaque reasoning'
    }
  });
});

export default router;
