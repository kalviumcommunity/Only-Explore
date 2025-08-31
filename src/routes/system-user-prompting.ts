// src/routes/system-user-prompting.ts
import express from 'express';
import { 
  performRTFCPrompting, 
  compareSystemPrompts,
  performAdvancedRTFC,
  systemPrompts 
} from '../lib/system-user-prompting.js';

const router = express.Router();

/**
 * RTFC Framework prompting endpoint
 * POST /api/rtfc
 */
router.post('/', async (req, res) => {
  try {
    const { 
      query, 
      systemPromptType = 'professional', 
      customSystemPrompt,
      context,
      responseFormat = 'detailed' 
    } = req.body;

    if (!query) {
      return res.status(400).json({ 
        error: 'Query is required' 
      });
    }

    console.log(`📋 RTFC Framework: ${systemPromptType} system prompt for "${query.substring(0, 50)}..."`);

    const result = await performRTFCPrompting({
      systemPromptType,
      userQuery: query,
      customSystemPrompt,
      context,
      responseFormat
    });

    res.json({
      query,
      systemPromptType,
      responseFormat,
      result: {
        response: result.response,
        promptQuality: result.promptQuality,
        framework: result.framework
      },
      promptDetails: {
        systemPromptLength: result.systemPrompt.length,
        userPromptLength: result.userPrompt.length,
        responseLength: result.response.length
      },
      method: 'rtfc-framework',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('RTFC Framework error:', error);
    res.status(500).json({ 
      error: 'Internal server error during RTFC prompting' 
    });
  }
});

/**
 * Compare different system prompt personas
 * POST /api/rtfc/compare
 */
router.post('/compare', async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query required for comparison' });
    }

    console.log(`🔬 Comparing system prompts for: "${query.substring(0, 50)}..."`);

    const comparison = await compareSystemPrompts(query);

    res.json({
      query,
      systemPromptComparison: {
        professional: {
          response: comparison.professional.response.substring(0, 300) + '...',
          quality: comparison.professional.promptQuality,
          tone: 'Professional, detailed, structured'
        },
        friendly: {
          response: comparison.friendly.response.substring(0, 300) + '...',
          quality: comparison.friendly.promptQuality,
          tone: 'Casual, enthusiastic, personal'
        },
        expert: {
          response: comparison.expert.response.substring(0, 300) + '...',
          quality: comparison.expert.promptQuality,
          tone: 'Authoritative, research-based, comprehensive'
        }
      },
      insights: {
        professional: 'Best for formal travel planning and business trips',
        friendly: 'Best for casual travelers and first-time planners',
        expert: 'Best for complex cultural travel and educational trips'
      },
      comparison: comparison.comparison,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('System prompt comparison error:', error);
    res.status(500).json({ error: 'System prompt comparison failed' });
  }
});

/**
 * Advanced RTFC with traveler profiling
 * POST /api/rtfc/advanced
 */
router.post('/advanced', async (req, res) => {
  try {
    const { query, travelProfile } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    console.log(`🎯 Advanced RTFC with traveler profile for: "${query}"`);

    const result = await performAdvancedRTFC(query, travelProfile || {});

    res.json({
      query,
      travelProfile: travelProfile || {},
      result: {
        response: result.response,
        personalization: result.personalization,
        contextualPromptLength: result.contextualSystemPrompt.length,
        enhancedPromptLength: result.enhancedUserPrompt.length
      },
      benefits: 'Advanced RTFC creates highly personalized responses based on traveler profile and preferences',
      method: 'advanced-rtfc',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Advanced RTFC error:', error);
    res.status(500).json({ error: 'Advanced RTFC processing failed' });
  }
});

/**
 * Test RTFC framework with travel scenarios
 * GET /api/rtfc/test
 */
router.get('/test', async (req, res) => {
  const testScenarios = [
    {
      query: 'Plan a romantic honeymoon trip to Italy for 10 days',
      expectedTone: 'romantic, detailed, luxurious',
      systemPrompt: 'luxury',
      description: 'Honeymoon planning requiring romantic and upscale recommendations'
    },
    {
      query: 'Backpacking through Southeast Asia on $30 per day',
      expectedTone: 'budget-focused, practical, money-saving',
      systemPrompt: 'budget-focused',
      description: 'Budget travel requiring cost-conscious recommendations'
    },
    {
      query: 'Cultural immersion trip to learn about Rajasthani traditions',
      expectedTone: 'educational, cultural, expert-level',
      systemPrompt: 'expert',
      description: 'Cultural travel requiring deep knowledge and context'
    },
    {
      query: 'First-time solo female traveler planning Europe trip',
      expectedTone: 'friendly, encouraging, safety-focused',
      systemPrompt: 'friendly',
      description: 'First-time travel requiring encouraging and supportive guidance'
    }
  ];

  try {
    const results = [];

    for (const scenario of testScenarios) {
      console.log(`🧪 Testing RTFC: ${scenario.description}`);
      
      const result = await performRTFCPrompting({
        systemPromptType: scenario.systemPrompt as any,
        userQuery: scenario.query,
        responseFormat: 'structured'
      });

      results.push({
        query: scenario.query,
        systemPromptUsed: scenario.systemPrompt,
        expectedTone: scenario.expectedTone,
        promptQuality: result.promptQuality,
        responseLength: result.response.length,
        response: result.response.substring(0, 200) + '...',
        description: scenario.description
      });
    }

    const averageQuality = results.reduce((sum, r) => {
      const quality = r.promptQuality.includes('High') ? 3 : r.promptQuality.includes('Good') ? 2 : 1;
      return sum + quality;
    }, 0) / results.length;

    res.json({
      method: 'rtfc-framework',
      testResults: results,
      averageQuality: averageQuality > 2.5 ? 'High' : averageQuality > 1.5 ? 'Good' : 'Basic',
      availableSystemPrompts: Object.keys(systemPrompts),
      summary: `Tested ${testScenarios.length} RTFC scenarios with ${averageQuality.toFixed(1)}/3.0 average quality`
    });

  } catch (error) {
    console.error('RTFC test error:', error);
    res.status(500).json({ error: 'RTFC framework test failed' });
  }
});

/**
 * Get RTFC framework information
 * GET /api/rtfc/info
 */
router.get('/info', (req, res) => {
  res.json({
    concept: 'RTFC (Read The Full Context) Framework uses structured system and user prompts for consistent, high-quality AI responses',
    components: {
      systemPrompt: 'Defines AI role, personality, expertise, and behavioral guidelines',
      userPrompt: 'Contains specific user request with context and format instructions',
      framework: 'Combines both prompts to provide complete context for AI reasoning'
    },
    benefits: [
      'Consistent AI personality and response quality',
      'Clear role definition prevents confusion',
      'Structured context improves relevance',
      'Reproducible results across similar queries'
    ],
    travelApplications: {
      professional: 'Formal travel planning for business and structured trips',
      friendly: 'Casual travel assistance with personal touch',
      expert: 'Deep cultural and educational travel guidance',
      budgetFocused: 'Cost-conscious travel planning and money-saving tips',
      luxury: 'Premium travel experiences and exclusive recommendations'
    },
    implementation: {
      process: [
        '1. Define appropriate system prompt persona for user needs',
        '2. Structure user prompt with context and format requirements',
        '3. Combine prompts using RTFC framework',
        '4. Generate response with consistent quality and tone'
      ]
    },
    availablePersonas: Object.keys(systemPrompts),
    bestPractices: [
      'Choose system prompt that matches user needs and expectations',
      'Include relevant context and constraints in user prompt',
      'Specify desired response format and structure',
      'Test different personas to find optimal match'
    ]
  });
});

export default router;
