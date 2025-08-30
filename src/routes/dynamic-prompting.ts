// src/routes/dynamic-prompting.ts
import express from 'express';
import { 
  performDynamicPrompting, 
  conversationContext, 
  UserProfile, 
  TravelContext, 
  DynamicPromptConfig 
} from '../lib/dynamic-prompting.js';

const router = express.Router();

/**
 * Dynamic prompting endpoint with full context
 * POST /api/dynamic
 */
router.post('/', async (req, res) => {
  try {
    const { 
      userQuery, 
      userProfile, 
      travelContext, 
      taskType, 
      sessionId = 'default' 
    } = req.body;

    if (!userQuery || !travelContext?.destination) {
      return res.status(400).json({ 
        error: 'userQuery and travelContext.destination are required' 
      });
    }

    // Get conversation history
    const context = conversationContext.getContext(sessionId);
    
    const config: DynamicPromptConfig = {
      userProfile: userProfile || context?.profile,
      travelContext: {
        destination: travelContext.destination,
        duration: travelContext.duration || 3,
        budget: travelContext.budget,
        season: travelContext.season,
        ...travelContext
      },
      conversationHistory: context?.history,
      taskType: taskType || detectTaskFromQuery(userQuery),
      userQuery
    };

    console.log(`🎯 Dynamic prompting for: ${config.travelContext.destination}`);

    const result = await performDynamicPrompting(config);

    // Update conversation context
    conversationContext.updateContext(sessionId, userQuery, result, userProfile);

    res.json({
      query: userQuery,
      destination: config.travelContext.destination,
      taskType: config.taskType,
      userProfile: config.userProfile,
      travelContext: config.travelContext,
      response: result,
      method: 'dynamic',
      sessionId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Dynamic prompting error:', error);
    res.status(500).json({ 
      error: 'Internal server error during dynamic prompting' 
    });
  }
});

/**
 * Personalized recommendations with user profiling
 * POST /api/dynamic/personalized
 */
router.post('/personalized', async (req, res) => {
  try {
    const { destination, userPreferences, sessionId = 'default' } = req.body;

    // Build user profile from preferences
    const userProfile: UserProfile = {
      interests: userPreferences.interests || ['sightseeing'],
      budgetRange: userPreferences.budget || 'mid-range',
      travelStyle: userPreferences.travelStyle || 'solo',
      previousDestinations: userPreferences.previousDestinations || [],
      homeLocation: userPreferences.homeLocation || 'United States',
      preferredActivities: userPreferences.activities || []
    };

    const travelContext: TravelContext = {
      destination,
      duration: userPreferences.duration || 5,
      budget: userPreferences.totalBudget,
      season: getCurrentSeason()
    };

    const config: DynamicPromptConfig = {
      userProfile,
      travelContext,
      taskType: 'itinerary',
      userQuery: `Create a personalized ${travelContext.duration}-day itinerary for ${destination} based on my interests and preferences`
    };

    const result = await performDynamicPrompting(config);

    res.json({
      destination,
      userProfile,
      personalizedItinerary: result,
      method: 'dynamic-personalized',
      sessionId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Personalized dynamic prompting error:', error);
    res.status(500).json({ error: 'Personalized recommendation failed' });
  }
});

/**
 * Context-aware chat continuation
 * POST /api/dynamic/continue
 */
router.post('/continue', async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId required for continuation' });
    }

    const context = conversationContext.getContext(sessionId);
    
    if (!context) {
      return res.status(400).json({ error: 'No conversation context found' });
    }

    // Use context to create dynamic prompt
    const config: DynamicPromptConfig = {
      userProfile: context.profile,
      travelContext: {
        destination: context.lastDestination || 'general',
        duration: context.preferences.preferredDuration || 3
      },
      conversationHistory: context.history,
      taskType: detectTaskFromQuery(message),
      userQuery: message
    };

    const result = await performDynamicPrompting(config);
    
    // Update context
    conversationContext.updateContext(sessionId, message, result);

    res.json({
      message,
      response: result,
      contextUsed: {
        conversationLength: context.history.length,
        userProfile: !!context.profile,
        preferences: context.preferences
      },
      method: 'dynamic-contextual',
      sessionId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Context continuation error:', error);
    res.status(500).json({ error: 'Context continuation failed' });
  }
});

/**
 * Test dynamic prompting with different scenarios
 * GET /api/dynamic/test
 */
router.get('/test', async (req, res) => {
  const testScenarios = [
    {
      name: 'Budget Backpacker',
      userProfile: {
        interests: ['adventure', 'nature', 'budget travel'],
        budgetRange: 'budget' as const,
        travelStyle: 'solo' as const,
        homeLocation: 'United States',
        previousDestinations: ['Thailand', 'Vietnam'],
        preferredActivities: ['hiking', 'street food']
      },
      travelContext: {
        destination: 'Nepal',
        duration: 10,
        budget: 800
      },
      query: 'Plan an adventure-focused trip with hiking and local experiences'
    },
    {
      name: 'Luxury Couple',
      userProfile: {
        interests: ['fine dining', 'spas', 'culture'],
        budgetRange: 'luxury' as const,
        travelStyle: 'couple' as const,
        homeLocation: 'New York',
        previousDestinations: ['Paris', 'Tokyo', 'Dubai'],
        preferredActivities: ['wine tasting', 'museums', 'romantic dinners']
      },
      travelContext: {
        destination: 'Tuscany',
        duration: 7,
        budget: 5000
      },
      query: 'Create a romantic luxury itinerary with wine and culture'
    }
  ];

  try {
    const results = [];

    for (const scenario of testScenarios) {
      console.log(`🧪 Testing dynamic prompting: ${scenario.name}`);
      
      const config: DynamicPromptConfig = {
        userProfile: scenario.userProfile,
        travelContext: scenario.travelContext,
        taskType: 'itinerary',
        userQuery: scenario.query
      };

      const result = await performDynamicPrompting(config);
      
      results.push({
        scenario: scenario.name,
        userProfile: scenario.userProfile,
        travelContext: scenario.travelContext,
        query: scenario.query,
        response: result.substring(0, 300) + '...',
        fullResponseLength: result.length
      });
    }

    res.json({
      method: 'dynamic',
      testResults: results,
      summary: `Tested ${testScenarios.length} dynamic prompting scenarios with different user profiles`
    });

  } catch (error) {
    console.error('Dynamic test error:', error);
    res.status(500).json({ error: 'Dynamic test failed' });
  }
});

// Helper functions
function detectTaskFromQuery(query: string): 'itinerary' | 'cuisine' | 'budget' | 'activities' {
  const queryLower = query.toLowerCase();
  
  if (queryLower.includes('plan') || queryLower.includes('itinerary')) return 'itinerary';
  if (queryLower.includes('food') || queryLower.includes('eat')) return 'cuisine';
  if (queryLower.includes('cost') || queryLower.includes('budget')) return 'budget';
  if (queryLower.includes('activities') || queryLower.includes('things to do')) return 'activities';
  
  return 'itinerary';
}

function getCurrentSeason(): string {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'fall';
  return 'winter';
}

export default router;
