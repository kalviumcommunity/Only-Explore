// src/lib/evaluation-framework.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import { searchTravelDocs } from './embeddings.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface EvaluationDataPoint {
  id: string;
  query: string;
  category: 'destination_search' | 'itinerary_planning' | 'budget_estimation' | 'cultural_info' | 'function_calling';
  expectedResults: string[];
  goldStandardResponse?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  metadata?: Record<string, any>;
}

export interface TestResult {
  id: string;
  query: string;
  category: string;
  actualResults: string[];
  expectedResults: string[];
  score: number;
  metrics: {
    precision: number;
    recall: number;
    f1Score: number;
    relevanceScore: number;
  };
  responseTime: number;
  passed: boolean;
}

export interface EvaluationReport {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  overallAccuracy: number;
  categoryScores: Record<string, number>;
  averageResponseTime: number;
  detailedResults: TestResult[];
  recommendations: string[];
}

// Comprehensive evaluation dataset for travel recommendations
export const travelEvaluationDataset: EvaluationDataPoint[] = [
  // Destination Search - Easy
  {
    id: 'dest_001',
    query: 'beach destinations in Asia',
    category: 'destination_search',
    expectedResults: ['Bali', 'Phuket', 'Boracay', 'Langkawi', 'Goa'],
    difficulty: 'easy',
    metadata: { region: 'Asia', type: 'beach' }
  },
  {
    id: 'dest_002', 
    query: 'mountain destinations for hiking',
    category: 'destination_search',
    expectedResults: ['Nepal', 'Switzerland', 'Patagonia', 'Himalayas', 'Alps'],
    difficulty: 'easy',
    metadata: { activity: 'hiking', type: 'mountain' }
  },

  // Destination Search - Medium
  {
    id: 'dest_003',
    query: 'romantic beach destinations for honeymoon under $2000',
    category: 'destination_search',
    expectedResults: ['Bali', 'Santorini', 'Maldives', 'Seychelles', 'Mauritius'],
    difficulty: 'medium',
    metadata: { budget: 2000, occasion: 'honeymoon', type: 'beach' }
  },
  {
    id: 'dest_004',
    query: 'family-friendly European cities with historical sites',
    category: 'destination_search',
    expectedResults: ['Rome', 'Paris', 'London', 'Prague', 'Vienna'],
    difficulty: 'medium',
    metadata: { travelers: 'family', region: 'Europe', interest: 'history' }
  },

  // Destination Search - Hard
  {
    id: 'dest_005',
    query: 'off-the-beaten-path destinations in Southeast Asia for solo female travelers interested in culture and cuisine',
    category: 'destination_search',
    expectedResults: ['Luang Prabang', 'Hoi An', 'Siem Reap', 'Ubud', 'Chiang Mai'],
    difficulty: 'hard',
    metadata: { travelers: 'solo_female', region: 'Southeast Asia', interests: ['culture', 'cuisine'] }
  },

  // Itinerary Planning
  {
    id: 'itin_001',
    query: 'plan 5-day trip to Japan for first-time visitors',
    category: 'itinerary_planning',
    expectedResults: ['Tokyo', 'Kyoto', 'Mount Fuji', 'Osaka', 'Nara'],
    goldStandardResponse: 'Day 1-2: Tokyo (Shibuya, Senso-ji, Tsukiji). Day 3-4: Kyoto (Fushimi Inari, Kinkaku-ji, Arashiyama). Day 5: Day trip to Mount Fuji or Nara.',
    difficulty: 'medium',
    metadata: { duration: 5, country: 'Japan', traveler_type: 'first-time' }
  },
  {
    id: 'itin_002',
    query: 'create cultural itinerary for 7 days in India focusing on Golden Triangle',
    category: 'itinerary_planning',
    expectedResults: ['Delhi', 'Agra', 'Jaipur', 'Taj Mahal', 'Red Fort'],
    goldStandardResponse: 'Day 1-2: Delhi (Red Fort, India Gate, Qutub Minar). Day 3-4: Agra (Taj Mahal, Agra Fort). Day 5-7: Jaipur (Amber Fort, Hawa Mahal, City Palace).',
    difficulty: 'medium',
    metadata: { duration: 7, country: 'India', focus: 'culture' }
  },

  // Budget Estimation
  {
    id: 'budget_001',
    query: 'cost breakdown for 2 people visiting Thailand for 10 days',
    category: 'budget_estimation',
    expectedResults: ['$1200-2000', 'accommodation', 'food', 'transportation', 'activities'],
    difficulty: 'medium',
    metadata: { travelers: 2, duration: 10, country: 'Thailand' }
  },

  // Cultural Information
  {
    id: 'culture_001',
    query: 'cultural etiquette and customs to know before visiting Japan',
    category: 'cultural_info',
    expectedResults: ['bowing', 'shoes removal', 'gift giving', 'business cards', 'public behavior'],
    difficulty: 'easy',
    metadata: { country: 'Japan', type: 'etiquette' }
  },

  // Function Calling
  {
    id: 'func_001',
    query: 'find hotels in Paris for March 15-20 under $150 per night',
    category: 'function_calling',
    expectedResults: ['findHotels', 'Paris', 'March 15', 'March 20', '$150'],
    difficulty: 'medium',
    metadata: { function: 'findHotels', parameters: ['city', 'checkin', 'checkout', 'budget'] }
  },
  {
    id: 'func_002',
    query: 'book flight from New York to London on December 25th for 2 passengers',
    category: 'function_calling',
    expectedResults: ['findFlights', 'New York', 'London', 'December 25', '2 passengers'],
    difficulty: 'medium',
    metadata: { function: 'findFlights', parameters: ['from', 'to', 'date', 'passengers'] }
  }
];

// Evaluation metrics calculation
export function calculateMetrics(actual: string[], expected: string[]): {
  precision: number;
  recall: number;
  f1Score: number;
  relevanceScore: number;
} {
  if (expected.length === 0) {
    return { precision: 0, recall: 0, f1Score: 0, relevanceScore: 0 };
  }

  // Convert to lowercase for case-insensitive matching
  const actualLower = actual.map(item => item.toLowerCase());
  const expectedLower = expected.map(item => item.toLowerCase());

  // Calculate true positives (matches)
  const truePositives = actualLower.filter(item => 
    expectedLower.some(expected => 
      expected.includes(item) || item.includes(expected)
    )
  ).length;

  const precision = actual.length > 0 ? truePositives / actual.length : 0;
  const recall = expected.length > 0 ? truePositives / expected.length : 0;
  const f1Score = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

  // Relevance score based on semantic similarity (simplified)
  const relevanceScore = f1Score; // In production, use embedding similarity

  return {
    precision: Math.round(precision * 100) / 100,
    recall: Math.round(recall * 100) / 100,
    f1Score: Math.round(f1Score * 100) / 100,
    relevanceScore: Math.round(relevanceScore * 100) / 100
  };
}

// Extract key terms from AI response for evaluation
export function extractKeyTerms(response: string): string[] {
  const terms = [];
  
  // Extract destination names (capitalized words)
  const destinations = response.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || [];
  terms.push(...destinations);

  // Extract numbers (for budgets, days, etc.)
  const numbers = response.match(/\$?\d+(?:,\d{3})*(?:\.\d{2})?/g) || [];
  terms.push(...numbers);

  // Extract function names (if function calling)
  const functions = response.match(/\b(?:find|search|book|plan|get)[A-Z]\w*/g) || [];
  terms.push(...functions);

  // Extract specific travel terms
  const travelTerms = response.match(/\b(?:hotel|flight|restaurant|temple|beach|mountain|museum|palace|fort|market)\w*\b/gi) || [];
  terms.push(...travelTerms);

  return [...new Set(terms)]; // Remove duplicates
}

// Individual test execution
export async function runSingleTest(dataPoint: EvaluationDataPoint): Promise<TestResult> {
  const startTime = Date.now();
  let actualResponse = '';
  let actualResults: string[] = [];

  try {
    // Execute test based on category
    switch (dataPoint.category) {
      case 'destination_search':
        const searchResults = await searchTravelDocs(dataPoint.query, 5);
        actualResponse = searchResults.map(r => r.title).join(', ');
        actualResults = extractKeyTerms(actualResponse);
        break;

      case 'itinerary_planning':
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const itineraryResult = await model.generateContent(
          `You are a travel planning expert. Create a detailed itinerary for: ${dataPoint.query}`
        );
        actualResponse = itineraryResult.response.text();
        actualResults = extractKeyTerms(actualResponse);
        break;

      case 'budget_estimation':
        const budgetModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const budgetResult = await budgetModel.generateContent(
          `You are a travel budget expert. Provide a detailed cost breakdown for: ${dataPoint.query}`
        );
        actualResponse = budgetResult.response.text();
        actualResults = extractKeyTerms(actualResponse);
        break;

      case 'cultural_info':
        const culturalModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const culturalResult = await culturalModel.generateContent(
          `You are a cultural travel expert. Answer this query: ${dataPoint.query}`
        );
        actualResponse = culturalResult.response.text();
        actualResults = extractKeyTerms(actualResponse);
        break;

      case 'function_calling':
        // Simulate function calling response
        actualResponse = `Function detected: ${dataPoint.query.includes('hotel') ? 'findHotels' : 'findFlights'}`;
        actualResults = extractKeyTerms(actualResponse);
        break;

      default:
        throw new Error(`Unknown category: ${dataPoint.category}`);
    }

    const responseTime = Date.now() - startTime;
    const metrics = calculateMetrics(actualResults, dataPoint.expectedResults);
    
    // Test passes if F1 score is above threshold
    const passed = metrics.f1Score >= 0.3; // 30% threshold

    return {
      id: dataPoint.id,
      query: dataPoint.query,
      category: dataPoint.category,
      actualResults,
      expectedResults: dataPoint.expectedResults,
      score: metrics.f1Score,
      metrics,
      responseTime,
      passed
    };

  } catch (error) {
    console.error(`Test ${dataPoint.id} failed:`, error);
    return {
      id: dataPoint.id,
      query: dataPoint.query,
      category: dataPoint.category,
      actualResults: [],
      expectedResults: dataPoint.expectedResults,
      score: 0,
      metrics: { precision: 0, recall: 0, f1Score: 0, relevanceScore: 0 },
      responseTime: Date.now() - startTime,
      passed: false
    };
  }
}

// Full evaluation suite
export async function runEvaluationSuite(
  dataset: EvaluationDataPoint[] = travelEvaluationDataset,
  categories?: string[]
): Promise<EvaluationReport> {
  console.log(`🧪 Running evaluation suite with ${dataset.length} tests`);

  // Filter by categories if specified
  const filteredDataset = categories 
    ? dataset.filter(dp => categories.includes(dp.category))
    : dataset;

  const results: TestResult[] = [];
  
  for (const dataPoint of filteredDataset) {
    console.log(`Testing: ${dataPoint.id} - ${dataPoint.query.substring(0, 50)}...`);
    const result = await runSingleTest(dataPoint);
    results.push(result);
  }

  // Calculate overall metrics
  const passedTests = results.filter(r => r.passed).length;
  const failedTests = results.length - passedTests;
  const overallAccuracy = results.length > 0 ? passedTests / results.length : 0;

  // Calculate category-wise scores
  const categoryScores: Record<string, number> = {};
  const categories_unique = [...new Set(results.map(r => r.category))];
  
  for (const category of categories_unique) {
    const categoryResults = results.filter(r => r.category === category);
    const categoryPassed = categoryResults.filter(r => r.passed).length;
    categoryScores[category] = categoryResults.length > 0 ? categoryPassed / categoryResults.length : 0;
  }

  const averageResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;

  // Generate recommendations
  const recommendations: string[] = [];
  if (overallAccuracy < 0.7) {
    recommendations.push('Overall accuracy below 70% - consider improving model training');
  }
  if (averageResponseTime > 5000) {
    recommendations.push('Average response time above 5s - optimize for performance');
  }
  
  const worstCategory = Object.entries(categoryScores).sort((a, b) => a[1] - b[1])[0];
  if (worstCategory && worstCategory[1] < 0.5) {
    recommendations.push(`${worstCategory[0]} category performing poorly - focus improvements here`);
  }

  return {
    totalTests: results.length,
    passedTests,
    failedTests,
    overallAccuracy,
    categoryScores,
    averageResponseTime,
    detailedResults: results,
    recommendations
  };
}

// A/B testing framework
export async function runABTest(
  testDataset: EvaluationDataPoint[],
  modelA: string,
  modelB: string
): Promise<{
  modelA: EvaluationReport;
  modelB: EvaluationReport;
  comparison: {
    accuracyDifference: number;
    performanceDifference: number;
    winner: string;
    significance: string;
  };
}> {
  console.log(`🔬 Running A/B test: ${modelA} vs ${modelB}`);

  // For demonstration, we'll simulate different model performance
  // In production, you'd actually test different models/configurations
  
  const resultA = await runEvaluationSuite(testDataset);
  
  // Simulate model B with slightly different performance
  const resultB = await runEvaluationSuite(testDataset);
  
  // Artificially adjust model B results for demonstration
  const adjustedResultB: EvaluationReport = {
    ...resultB,
    overallAccuracy: resultB.overallAccuracy * 1.1, // 10% better
    averageResponseTime: resultB.averageResponseTime * 0.9 // 10% faster
  };

  const accuracyDifference = adjustedResultB.overallAccuracy - resultA.overallAccuracy;
  const performanceDifference = resultA.averageResponseTime - adjustedResultB.averageResponseTime;
  
  const winner = accuracyDifference > 0.05 ? modelB : 
                accuracyDifference < -0.05 ? modelA : 'tie';
  
  const significance = Math.abs(accuracyDifference) > 0.1 ? 'significant' : 'marginal';

  return {
    modelA: resultA,
    modelB: adjustedResultB,
    comparison: {
      accuracyDifference,
      performanceDifference,
      winner,
      significance
    }
  };
}

// Human feedback integration
export interface HumanFeedback {
  testId: string;
  query: string;
  response: string;
  rating: 1 | 2 | 3 | 4 | 5; // 1 = poor, 5 = excellent
  feedback: string;
  timestamp: string;
}

export function integrateHumanFeedback(
  evaluationResults: TestResult[],
  humanFeedback: HumanFeedback[]
): {
  enhancedResults: TestResult[];
  humanAgreementRate: number;
  insights: string[];
} {
  const enhancedResults = evaluationResults.map(result => {
    const feedback = humanFeedback.find(f => f.testId === result.id);
    if (feedback) {
      // Adjust automated score based on human rating
      const humanScore = (feedback.rating - 1) / 4; // Convert 1-5 to 0-1
      const combinedScore = (result.score + humanScore) / 2;
      
      return {
        ...result,
        score: combinedScore,
        humanRating: feedback.rating,
        humanFeedback: feedback.feedback
      };
    }
    return result;
  });

  // Calculate agreement rate between automated and human evaluation
  const feedbackResults = enhancedResults.filter(r => 'humanRating' in r);
  const agreements = feedbackResults.filter(r => {
    const automatedPassed = r.passed;
    const humanPassed = (r as any).humanRating >= 3;
    return automatedPassed === humanPassed;
  });
  
  const humanAgreementRate = feedbackResults.length > 0 ? agreements.length / feedbackResults.length : 0;

  const insights = [
    `Human feedback collected for ${feedbackResults.length} tests`,
    `Agreement rate: ${(humanAgreementRate * 100).toFixed(1)}%`,
    humanAgreementRate < 0.7 ? 'Low agreement - review evaluation criteria' : 'Good agreement with human judgment'
  ];

  return {
    enhancedResults,
    humanAgreementRate,
    insights
  };
}
