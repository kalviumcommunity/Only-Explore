// src/lib/system-user-prompting.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface RTFCConfig {
  systemPromptType: 'professional' | 'friendly' | 'expert' | 'budget-focused' | 'luxury' | 'custom';
  userQuery: string;
  customSystemPrompt?: string;
  context?: string;
  travelStyle?: 'budget' | 'mid-range' | 'luxury';
  responseFormat?: 'detailed' | 'concise' | 'structured';
}

export interface RTFCResult {
  systemPrompt: string;
  userPrompt: string;
  response: string;
  framework: string;
  promptQuality: string;
}

// Predefined system prompts for different travel assistant personas
export const systemPrompts = {
  professional: `You are a certified professional travel planner working for "Only Explore," a premium travel advisory service.

ROLE & EXPERTISE:
- 10+ years experience in travel planning across global destinations
- Specialized in creating practical, well-researched itineraries
- Expert in budget optimization and cultural experiences

COMMUNICATION STYLE:
- Professional yet approachable tone
- Provide clear, actionable recommendations
- Include practical details (timing, costs, booking tips)
- Always end responses with a concise summary

GUIDELINES:
- Prioritize traveler safety and authentic experiences
- Consider seasonal factors and local events
- Suggest budget-appropriate options
- Include contingency planning when relevant`,

  friendly: `Hi there! I'm your friendly travel buddy from Only Explore! 🌍✈️

WHO I AM:
- Your enthusiastic travel companion who's been everywhere!
- I love sharing hidden gems and personal travel stories
- I'm here to make your trip planning fun and stress-free

MY STYLE:
- Casual, warm, and encouraging
- Share exciting discoveries and local secrets
- Use emojis and friendly language
- Make travel planning feel like chatting with a friend

WHAT I DO:
- Create amazing adventures tailored just for you
- Find the perfect balance of must-sees and off-the-beaten-path gems
- Help you travel smart without breaking the bank
- Always include a "travel buddy tip" at the end!`,

  expert: `You are Dr. Alexandra Chen, Senior Travel Research Specialist at Only Explore Institute.

CREDENTIALS:
- PhD in Cultural Geography, 15 years field research
- Published author on sustainable tourism practices  
- Consultant to UNESCO World Heritage tourism programs
- Fluent in 6 languages, traveled to 89 countries

EXPERTISE AREAS:
- Cultural immersion and authentic local experiences
- Sustainable and responsible travel practices
- Historical context and cultural significance
- Advanced logistics for complex multi-country trips

METHODOLOGY:
- Evidence-based recommendations with cultural context
- Detailed analysis of seasonal patterns and local dynamics
- Integration of historical, cultural, and practical considerations
- Comprehensive risk assessment and mitigation strategies`,

  'budget-focused': `You are Sam Rodriguez, Budget Travel Specialist at Only Explore.

MISSION:
- Prove that amazing travel doesn't require big budgets
- Help travelers maximize experiences while minimizing costs
- Find creative solutions for budget constraints

EXPERTISE:
- Budget accommodation hunting (hostels, guesthouses, local stays)
- Free and low-cost activities in every destination
- Money-saving transport hacks and booking strategies
- Street food and local dining recommendations

APPROACH:
- Always provide multiple budget options (ultra-budget, moderate budget)
- Include specific cost estimates and money-saving tips
- Suggest shoulder season alternatives for better prices
- Focus on authentic local experiences over tourist traps
- End with total estimated costs and saving strategies`,

  luxury: `You are Victoria Sterling, Luxury Travel Curator at Only Explore Prestige.

SPECIALIZATION:
- Exclusive, ultra-premium travel experiences
- Private access to world-class destinations and events
- Bespoke itineraries for discerning travelers
- Connections with luxury hotels, private guides, and unique venues

SERVICE STANDARDS:
- White-glove service and attention to every detail
- Access to exclusive experiences unavailable to general public
- Partnership with world's finest hotels, resorts, and service providers
- 24/7 concierge support during travel

APPROACH:
- Focus on exceptional, once-in-a-lifetime experiences
- Emphasize privacy, exclusivity, and personalized service
- Include luxury accommodation and fine dining recommendations
- Suggest private transportation and VIP access options
- Conclude with exclusive booking and concierge contact information`
};

// User prompt enhancement templates
export const userPromptEnhancers = {
  structured: (query: string, context?: string) => `
TRAVEL REQUEST: ${query}

${context ? `ADDITIONAL CONTEXT: ${context}` : ''}

Please provide a comprehensive response including:
1. Overview and recommendations
2. Detailed day-by-day planning (if applicable)
3. Practical information (costs, timing, logistics)
4. Cultural insights and local tips
5. Summary with key takeaways
`,

  detailed: (query: string, context?: string) => `
USER QUERY: ${query}

${context ? `CONTEXT: ${context}` : ''}

Please provide detailed recommendations covering all relevant aspects including activities, accommodation, food, transportation, cultural experiences, and practical tips. Include specific examples and actionable advice.
`,

  concise: (query: string, context?: string) => `
QUERY: ${query}
${context ? `CONTEXT: ${context}` : ''}

Provide clear, actionable recommendations in a concise format. Focus on the most important information and practical details.
`
};

export async function performRTFCPrompting(config: RTFCConfig): Promise<RTFCResult> {
  try {
    // Select system prompt
    const systemPrompt = config.customSystemPrompt || systemPrompts[config.systemPromptType as keyof typeof systemPrompts];
    
    // Enhance user prompt based on format preference  
    const userPrompt = userPromptEnhancers[config.responseFormat || 'detailed'](
      config.userQuery, 
      config.context
    );

    console.log(`📋 RTFC Framework: ${config.systemPromptType} system prompt with ${config.responseFormat || 'detailed'} format`);

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.7,
        topP: 0.9,
        maxOutputTokens: 2000
      }
    });

    const messages = [
      { role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }
    ];

    const result = await model.generateContent(messages[0].parts[0].text);
    const response = result.response.text();

    // Evaluate prompt quality
    const promptQuality = evaluatePromptQuality(systemPrompt, userPrompt, response);

    return {
      systemPrompt,
      userPrompt,
      response,
      framework: 'RTFC (Read The Full Context)',
      promptQuality
    };

  } catch (error) {
    console.error('Error in RTFC prompting:', error);
    throw error;
  }
}

// Evaluate the quality of prompt engineering
function evaluatePromptQuality(systemPrompt: string, userPrompt: string, response: string): string {
  const factors = [];
  
  // System prompt evaluation
  if (systemPrompt.includes('role') || systemPrompt.includes('You are')) {
    factors.push('Clear role definition');
  }
  if (systemPrompt.length > 200) {
    factors.push('Comprehensive context');
  }
  if (systemPrompt.includes('style') || systemPrompt.includes('tone')) {
    factors.push('Communication guidelines');
  }

  // User prompt evaluation  
  if (userPrompt.includes('provide') || userPrompt.includes('include')) {
    factors.push('Specific instructions');
  }
  if (userPrompt.includes('format') || userPrompt.includes('structure')) {
    factors.push('Format specification');
  }

  // Response evaluation
  if (response.length > 500) {
    factors.push('Comprehensive response');
  }
  if (response.includes('Summary') || response.includes('Conclusion')) {
    factors.push('Structured conclusion');
  }

  const qualityScore = factors.length >= 5 ? 'High' : factors.length >= 3 ? 'Good' : 'Basic';
  return `${qualityScore} quality (${factors.length}/7 factors: ${factors.join(', ')})`;
}

// Compare different system prompt approaches
export async function compareSystemPrompts(userQuery: string): Promise<{
  professional: RTFCResult;
  friendly: RTFCResult;
  expert: RTFCResult;
  comparison: string;
}> {
  const prompts: Array<'professional' | 'friendly' | 'expert'> = ['professional', 'friendly', 'expert'];
  const results: any = {};

  for (const promptType of prompts) {
    results[promptType] = await performRTFCPrompting({
      systemPromptType: promptType,
      userQuery,
      responseFormat: 'detailed'
    });
  }

  return {
    ...results,
    comparison: 'Different system prompts create distinct AI personalities: Professional (formal, detailed), Friendly (casual, enthusiastic), Expert (authoritative, research-based)'
  };
}

// Advanced RTFC with context building
export async function performAdvancedRTFC(
  userQuery: string,
  travelProfile: {
    previousDestinations?: string[];
    interests?: string[];
    budgetRange?: string;
    travelStyle?: string;
    constraints?: string[];
  }
): Promise<{
  contextualSystemPrompt: string;
  enhancedUserPrompt: string;
  response: string;
  personalization: string;
}> {
  // Build contextual system prompt
  let contextualSystemPrompt = systemPrompts.professional;
  
  // Add personalization based on travel profile
  if (travelProfile.budgetRange === 'budget') {
    contextualSystemPrompt += `\n\nSPECIAL FOCUS: This traveler prefers budget-conscious options. Prioritize affordable accommodations, free activities, and money-saving tips.`;
  } else if (travelProfile.budgetRange === 'luxury') {
    contextualSystemPrompt += `\n\nSPECIAL FOCUS: This traveler prefers premium experiences. Emphasize luxury accommodations, exclusive activities, and high-end dining.`;
  }

  if (travelProfile.interests?.length) {
    contextualSystemPrompt += `\n\nINTERESTS: Tailor recommendations for someone interested in: ${travelProfile.interests.join(', ')}.`;
  }

  // Build enhanced user prompt with context
  const enhancedUserPrompt = `
TRAVELER PROFILE:
- Previous destinations: ${travelProfile.previousDestinations?.join(', ') || 'Not specified'}
- Interests: ${travelProfile.interests?.join(', ') || 'General travel'}
- Budget range: ${travelProfile.budgetRange || 'Moderate'}
- Travel style: ${travelProfile.travelStyle || 'Flexible'}
${travelProfile.constraints?.length ? `- Constraints: ${travelProfile.constraints.join(', ')}` : ''}

CURRENT REQUEST: ${userQuery}

Please provide personalized recommendations based on this traveler's profile and preferences.
`;

  const result = await performRTFCPrompting({
    systemPromptType: 'custom',
    customSystemPrompt: contextualSystemPrompt,
    userQuery: enhancedUserPrompt,
    responseFormat: 'structured'
  });

  return {
    contextualSystemPrompt,
    enhancedUserPrompt,
    response: result.response,
    personalization: 'Advanced RTFC with traveler profile integration for maximum personalization'
  };
}
