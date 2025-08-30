// src/lib/dynamic-prompting.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
// Note: axios import removed as it's not actually used in the current implementation

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface UserProfile {
  interests: string[];
  budgetRange: 'budget' | 'mid-range' | 'luxury';
  travelStyle: 'solo' | 'couple' | 'family' | 'group';
  previousDestinations: string[];
  homeLocation: string;
  preferredActivities: string[];
}

export interface TravelContext {
  destination: string;
  startDate?: string;
  endDate?: string;
  duration: number;
  budget?: number;
  weather?: WeatherData;
  localTime?: string;
  currency?: string;
  season?: string;
}

export interface WeatherData {
  temperature: number;
  condition: string;
  precipitation: number;
  season: string;
}

export interface DynamicPromptConfig {
  userProfile?: UserProfile;
  travelContext: TravelContext;
  conversationHistory?: string[];
  taskType: 'itinerary' | 'cuisine' | 'budget' | 'activities';
  userQuery: string;
}

// Dynamic prompt templates with placeholders
const dynamicTemplates = {
  itinerary: `You are Only Explore, an expert AI travel assistant. Create a personalized travel plan based on these specifics:

USER PROFILE:
- Travel Style: {travelStyle}
- Interests: {interests}
- Budget Preference: {budgetRange}
- Home Location: {homeLocation}
{previousExperience}

TRIP CONTEXT:
- Destination: {destination}
- Duration: {duration} days
- Budget: {budget}
- Season/Weather: {weather}
- Local Conditions: {localConditions}

CONVERSATION CONTEXT:
{conversationHistory}

USER REQUEST: "{userQuery}"

Create a detailed {duration}-day itinerary that matches their {budgetRange} budget and {interests} interests. Consider the {weather} weather and provide day-by-day plans with:
- Morning, afternoon, evening activities
- {travelStyle}-friendly recommendations
- Budget-appropriate suggestions for {budgetRange} travelers
- Weather-suitable activities
- Local cultural insights`,

  cuisine: `You are Only Explore, a culinary travel expert. Provide food recommendations based on:

USER PROFILE:
- Food Interests: {interests}
- Budget: {budgetRange}
- Travel Style: {travelStyle}
{dietaryRestrictions}

DESTINATION CONTEXT:
- Location: {destination}
- Season: {season}
- Local Time: {localTime}

CONVERSATION HISTORY:
{conversationHistory}

REQUEST: "{userQuery}"

Recommend {budgetRange} dining options in {destination} that match their {interests} preferences. Include:
- Signature local dishes they must try
- {budgetRange}-appropriate restaurants and food venues
- Seasonal specialties available during {season}
- Cultural dining etiquette and tips`,

  budget: `You are Only Explore, a travel finance expert. Create a budget breakdown based on:

USER CONTEXT:
- Travel Style: {travelStyle}
- Budget Range: {budgetRange}
- Home Location: {homeLocation}
- Group Size: Based on {travelStyle}

TRIP DETAILS:
- Destination: {destination}
- Duration: {duration} days
- Total Budget: {budget}
- Season: {season}

PREVIOUS CONTEXT:
{conversationHistory}

REQUEST: "{userQuery}"

Provide a detailed cost breakdown for {duration} days in {destination} suitable for {budgetRange} {travelStyle} travelers. Include:
- Accommodation options for {budgetRange} budget
- Transportation costs from {homeLocation}
- Daily food budget for {travelStyle} travelers
- Activity costs matching their interests
- Seasonal price variations during {season}
- Currency and payment tips`,

  activities: `You are Only Explore, an activity planning specialist. Suggest activities based on:

USER PREFERENCES:
- Interests: {interests}
- Activity Level: {activityLevel}
- Travel Style: {travelStyle}
- Budget: {budgetRange}

LOCATION CONTEXT:
- Destination: {destination}
- Weather: {weather}
- Season: {season}
- Duration: {duration} days

CHAT CONTEXT:
{conversationHistory}

REQUEST: "{userQuery}"

Recommend {weather}-appropriate activities in {destination} for {travelStyle} {budgetRange} travelers interested in {interests}. Consider:
- Weather-suitable options given {weather} conditions
- {budgetRange} pricing level
- {travelStyle} group dynamics
- Seasonal availability during {season}
- Mix of popular and hidden gem experiences`
};

export async function performDynamicPrompting(config: DynamicPromptConfig): Promise<string> {
  try {
    // Get weather data if destination provided
    let weatherData = config.travelContext.weather;
    if (!weatherData && config.travelContext.destination) {
      weatherData = await fetchWeatherData(config.travelContext.destination);
    }

    // Build conversation context
    const conversationHistory = config.conversationHistory?.length 
      ? `Previous conversation:\n${config.conversationHistory.slice(-3).join('\n')}`
      : 'This is the start of our conversation.';

    // Build dynamic prompt by filling template placeholders
    const template = dynamicTemplates[config.taskType] || dynamicTemplates.itinerary;
    
    const dynamicPrompt = template
      .replace('{travelStyle}', config.userProfile?.travelStyle || 'solo')
      .replace('{interests}', config.userProfile?.interests?.join(', ') || 'general sightseeing')
      .replace('{budgetRange}', config.userProfile?.budgetRange || 'mid-range')
      .replace('{homeLocation}', config.userProfile?.homeLocation || 'international')
      .replace('{destination}', config.travelContext.destination)
      .replace('{duration}', config.travelContext.duration.toString())
      .replace('{budget}', config.travelContext.budget ? `$${config.travelContext.budget}` : 'flexible')
      .replace('{weather}', weatherData ? `${weatherData.condition}, ${weatherData.temperature}°F` : 'pleasant')
      .replace('{season}', config.travelContext.season || 'current season')
      .replace('{localTime}', config.travelContext.localTime || 'local time')
      .replace('{conversationHistory}', conversationHistory)
      .replace('{userQuery}', config.userQuery)
      .replace('{previousExperience}', buildPreviousExperienceContext(config.userProfile))
      .replace('{localConditions}', buildLocalConditionsContext(config.travelContext, weatherData))
      .replace('{activityLevel}', inferActivityLevel(config.userProfile?.interests))
      .replace('{dietaryRestrictions}', buildDietaryContext(config.userProfile));

    console.log(`🎯 Dynamic prompt generated for ${config.taskType} in ${config.travelContext.destination}`);

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(dynamicPrompt);
    
    return result.response.text();

  } catch (error) {
    console.error('Error in dynamic prompting:', error);
    throw error;
  }
}

// Helper functions
async function fetchWeatherData(destination: string): Promise<WeatherData> {
  try {
    // Mock weather data - in production, use real weather API
    const weatherConditions = ['sunny', 'cloudy', 'rainy', 'partly cloudy'];
    const randomCondition = weatherConditions[Math.floor(Math.random() * weatherConditions.length)];
    
    return {
      temperature: Math.floor(Math.random() * 40) + 50, // 50-90°F
      condition: randomCondition,
      precipitation: Math.random() * 0.5,
      season: getCurrentSeason()
    };
  } catch (error) {
    console.error('Weather fetch error:', error);
    return {
      temperature: 75,
      condition: 'pleasant',
      precipitation: 0,
      season: 'current'
    };
  }
}

function buildPreviousExperienceContext(profile?: UserProfile): string {
  if (!profile?.previousDestinations?.length) {
    return '- Previous Travel: First-time or limited travel experience';
  }
  
  return `- Previous Destinations: ${profile.previousDestinations.join(', ')}
- Experience Level: Experienced traveler`;
}

function buildLocalConditionsContext(context: TravelContext, weather?: WeatherData): string {
  const conditions = [];
  
  if (weather) {
    conditions.push(`Weather: ${weather.condition}, ${weather.temperature}°F`);
  }
  
  if (context.season) {
    conditions.push(`Season: ${context.season}`);
  }
  
  return conditions.length ? conditions.join(', ') : 'Standard conditions';
}

function inferActivityLevel(interests?: string[]): string {
  if (!interests) return 'moderate';
  
  const highEnergyKeywords = ['adventure', 'hiking', 'sports', 'active', 'extreme'];
  const lowEnergyKeywords = ['museums', 'art', 'culture', 'relaxation', 'spa'];
  
  const highEnergyCount = interests.filter(interest => 
    highEnergyKeywords.some(keyword => interest.toLowerCase().includes(keyword))
  ).length;
  
  const lowEnergyCount = interests.filter(interest =>
    lowEnergyKeywords.some(keyword => interest.toLowerCase().includes(keyword))
  ).length;
  
  if (highEnergyCount > lowEnergyCount) return 'high';
  if (lowEnergyCount > highEnergyCount) return 'low';
  return 'moderate';
}

function buildDietaryContext(profile?: UserProfile): string {
  // This would be expanded based on actual user profile data
  return profile ? 'Consider any dietary preferences mentioned' : '';
}

function getCurrentSeason(): string {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'fall';
  return 'winter';
}

// Context management for conversation continuity
export class ConversationContext {
  private contexts = new Map<string, {
    profile?: UserProfile;
    history: string[];
    lastDestination?: string;
    preferences: Record<string, any>;
  }>();

  updateContext(sessionId: string, userQuery: string, aiResponse: string, profile?: UserProfile) {
    const context = this.contexts.get(sessionId) || {
      history: [],
      preferences: {}
    };

    // Add to conversation history
    context.history.push(`User: ${userQuery}`);
    context.history.push(`AI: ${aiResponse.substring(0, 100)}...`);

    // Keep only last 6 exchanges (3 back-and-forth)
    if (context.history.length > 6) {
      context.history = context.history.slice(-6);
    }

    // Update profile if provided
    if (profile) {
      context.profile = profile;
    }

    // Extract preferences from queries
    this.extractPreferences(userQuery, context.preferences);

    this.contexts.set(sessionId, context);
  }

  getContext(sessionId: string) {
    return this.contexts.get(sessionId);
  }

  private extractPreferences(query: string, preferences: Record<string, any>) {
    const queryLower = query.toLowerCase();
    
    // Extract budget mentions
    const budgetMatch = queryLower.match(/\$(\d+)/);
    if (budgetMatch) {
      preferences.mentionedBudget = parseInt(budgetMatch[1]);
    }

    // Extract duration mentions
    const durationMatch = queryLower.match(/(\d+)\s*days?/);
    if (durationMatch) {
      preferences.preferredDuration = parseInt(durationMatch[1]);
    }

    // Extract interest keywords
    const interests = ['food', 'culture', 'adventure', 'history', 'art', 'nature', 'nightlife'];
    interests.forEach(interest => {
      if (queryLower.includes(interest)) {
        preferences.interests = preferences.interests || [];
        if (!preferences.interests.includes(interest)) {
          preferences.interests.push(interest);
        }
      }
    });
  }
}

export const conversationContext = new ConversationContext();
