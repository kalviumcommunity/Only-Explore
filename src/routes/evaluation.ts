// src/routes/evaluation.ts
import express from 'express';
import { 
  runEvaluationSuite,
  runSingleTest,
  runABTest,
  integrateHumanFeedback,
  travelEvaluationDataset,
  HumanFeedback
} from '../lib/evaluation-framework.js';

const router = express.Router();

// Store human feedback (in production, use database)
let humanFeedbackStore: HumanFeedback[] = [];

/**
 * Run full evaluation suite
 * POST /api/evaluation/run
 */
router.post('/run', async (req, res) => {
  try {
    const { categories, customDataset } = req.body;

    console.log('🧪 Running evaluation suite...');

    const dataset = customDataset || travelEvaluationDataset;
    const report = await runEvaluationSuite(dataset, categories);

    res.json({
      evaluationReport: {
        summary: {
          totalTests: report.totalTests,
          passedTests: report.passedTests,
          failedTests: report.failedTests,
          overallAccuracy: `${(report.overallAccuracy * 100).toFixed(1)}%`,
          averageResponseTime: `${report.averageResponseTime}ms`
        },
        categoryPerformance: Object.entries(report.categoryScores).map(([category, score]) => ({
          category,
          accuracy: `${(score * 100).toFixed(1)}%`,
          passed: score >= 0.5
        })),
        recommendations: report.recommendations,
        detailedResults: report.detailedResults.map(r => ({
          id: r.id,
          query: r.query.substring(0, 60) + '...',
          category: r.category,
          passed: r.passed,
          score: r.score.toFixed(3),
          responseTime: `${r.responseTime}ms`,
          metrics: r.metrics
        }))
      },
      method: 'evaluation-suite',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Evaluation suite error:', error);
    res.status(500).json({ error: 'Evaluation suite failed' });
  }
});

/**
 * Run single test
 * POST /api/evaluation/test
 */
router.post('/test', async (req, res) => {
  try {
    const { testId, query, category, expectedResults } = req.body;

    if (!query || !expectedResults) {
      return res.status(400).json({ 
        error: 'Query and expectedResults are required' 
      });
    }

    console.log(`🔍 Running single test: ${query}`);

    const dataPoint = {
      id: testId || 'custom_test',
      query,
      category: category || 'destination_search',
      expectedResults,
      difficulty: 'medium' as const
    };

    const result = await runSingleTest(dataPoint);

    res.json({
      testResult: {
        id: result.id,
        query: result.query,
        category: result.category,
        passed: result.passed,
        score: result.score.toFixed(3),
        metrics: result.metrics,
        responseTime: `${result.responseTime}ms`,
        actualResults: result.actualResults,
        expectedResults: result.expectedResults
      },
      method: 'single-test',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Single test error:', error);
    res.status(500).json({ error: 'Single test failed' });
  }
});

/**
 * Run A/B test comparison
 * POST /api/evaluation/ab-test
 */
router.post('/ab-test', async (req, res) => {
  try {
    const { modelA, modelB, testSize } = req.body;

    const modelAName = modelA || 'Current Model';
    const modelBName = modelB || 'Experimental Model';
    const sampleSize = Math.min(testSize || 10, travelEvaluationDataset.length);

    console.log(`🔬 Running A/B test: ${modelAName} vs ${modelBName}`);

    // Use subset of evaluation dataset for A/B test
    const testDataset = travelEvaluationDataset.slice(0, sampleSize);
    
    const abTestResult = await runABTest(testDataset, modelAName, modelBName);

    res.json({
      abTestResults: {
        models: {
          [modelAName]: {
            accuracy: `${(abTestResult.modelA.overallAccuracy * 100).toFixed(1)}%`,
            avgResponseTime: `${abTestResult.modelA.averageResponseTime}ms`,
            passedTests: abTestResult.modelA.passedTests,
            totalTests: abTestResult.modelA.totalTests
          },
          [modelBName]: {
            accuracy: `${(abTestResult.modelB.overallAccuracy * 100).toFixed(1)}%`, 
            avgResponseTime: `${abTestResult.modelB.averageResponseTime}ms`,
            passedTests: abTestResult.modelB.passedTests,
            totalTests: abTestResult.modelB.totalTests
          }
        },
        comparison: {
          accuracyDifference: `${(abTestResult.comparison.accuracyDifference * 100).toFixed(1)}%`,
          performanceDifference: `${abTestResult.comparison.performanceDifference}ms`,
          winner: abTestResult.comparison.winner,
          significance: abTestResult.comparison.significance
        },
        recommendation: abTestResult.comparison.winner === 'tie' 
          ? 'No significant difference between models'
          : `${abTestResult.comparison.winner} shows ${abTestResult.comparison.significance} improvement`
      },
      method: 'ab-test',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('A/B test error:', error);
    res.status(500).json({ error: 'A/B test failed' });
  }
});

/**
 * Submit human feedback
 * POST /api/evaluation/feedback
 */
router.post('/feedback', (req, res) => {
  try {
    const { testId, query, response, rating, feedback } = req.body;

    if (!testId || !rating) {
      return res.status(400).json({ 
        error: 'testId and rating are required' 
      });
    }

    const humanFeedback: HumanFeedback = {
      testId,
      query: query || '',
      response: response || '',
      rating: rating as 1 | 2 | 3 | 4 | 5,
      feedback: feedback || '',
      timestamp: new Date().toISOString()
    };

    humanFeedbackStore.push(humanFeedback);

    res.json({
      message: 'Human feedback recorded successfully',
      feedbackId: humanFeedback.testId,
      rating: humanFeedback.rating,
      totalFeedback: humanFeedbackStore.length,
      method: 'human-feedback',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Human feedback error:', error);
    res.status(500).json({ error: 'Failed to record human feedback' });
  }
});

/**
 * Get evaluation dataset
 * GET /api/evaluation/dataset
 */
router.get('/dataset', (req, res) => {
  try {
    const { category, difficulty } = req.query;

    let filteredDataset = travelEvaluationDataset;

    if (category) {
      filteredDataset = filteredDataset.filter(dp => dp.category === category);
    }

    if (difficulty) {
      filteredDataset = filteredDataset.filter(dp => dp.difficulty === difficulty);
    }

    const categoryStats = travelEvaluationDataset.reduce((stats, dp) => {
      stats[dp.category] = (stats[dp.category] || 0) + 1;
      return stats;
    }, {} as Record<string, number>);

    const difficultyStats = travelEvaluationDataset.reduce((stats, dp) => {
      stats[dp.difficulty] = (stats[dp.difficulty] || 0) + 1;
      return stats;
    }, {} as Record<string, number>);

    res.json({
      dataset: filteredDataset.map(dp => ({
        id: dp.id,
        query: dp.query,
        category: dp.category,
        difficulty: dp.difficulty,
        expectedResults: dp.expectedResults,
        metadata: dp.metadata
      })),
      statistics: {
        totalTests: travelEvaluationDataset.length,
        filteredTests: filteredDataset.length,
        categories: categoryStats,
        difficulties: difficultyStats
      },
      method: 'dataset-info',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Dataset info error:', error);
    res.status(500).json({ error: 'Failed to get dataset information' });
  }
});

/**
 * Get human feedback analytics
 * GET /api/evaluation/analytics
 */
router.get('/analytics', (req, res) => {
  try {
    if (humanFeedbackStore.length === 0) {
      return res.json({
        message: 'No human feedback available yet',
        analytics: null,
        method: 'feedback-analytics',
        timestamp: new Date().toISOString()
      });
    }

    const ratingDistribution = humanFeedbackStore.reduce((dist, feedback) => {
      dist[feedback.rating] = (dist[feedback.rating] || 0) + 1;
      return dist;
    }, {} as Record<number, number>);

    const averageRating = humanFeedbackStore.reduce((sum, f) => sum + f.rating, 0) / humanFeedbackStore.length;

    const categoryFeedback = humanFeedbackStore.reduce((cats, feedback) => {
      // Extract category from testId (assuming format like "dest_001")
      const category = feedback.testId.split('_')[0];
      if (!cats[category]) cats[category] = [];
      cats[category].push(feedback.rating);
      return cats;
    }, {} as Record<string, number[]>);

    const categoryAverages = Object.entries(categoryFeedback).reduce((avgs, [cat, ratings]) => {
      avgs[cat] = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
      return avgs;
    }, {} as Record<string, number>);

    res.json({
      analytics: {
        totalFeedback: humanFeedbackStore.length,
        averageRating: parseFloat(averageRating.toFixed(2)),
        ratingDistribution,
        categoryAverages,
        recentFeedback: humanFeedbackStore.slice(-5).map(f => ({
          testId: f.testId,
          rating: f.rating,
          feedback: f.feedback.substring(0, 100),
          timestamp: f.timestamp
        }))
      },
      insights: [
        `${humanFeedbackStore.length} pieces of human feedback collected`,
        `Average rating: ${averageRating.toFixed(1)}/5`,
        averageRating >= 4 ? 'High user satisfaction' : averageRating >= 3 ? 'Moderate satisfaction' : 'Needs improvement'
      ],
      method: 'feedback-analytics',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to generate analytics' });
  }
});

/**
 * Get evaluation framework information
 * GET /api/evaluation/info
 */
router.get('/info', (req, res) => {
  res.json({
    concept: 'Evaluation dataset and testing framework ensure AI travel recommendations are accurate, relevant, and reliable',
    components: {
      evaluationDataset: 'Curated set of travel queries with expected results for testing',
      testingFramework: 'Automated system to run tests and measure performance',
      metrics: 'Precision, recall, F1-score, and relevance scoring',
      humanFeedback: 'Integration of human evaluation for quality validation'
    },
    travelApplications: {
      destinationSearch: 'Test if AI finds relevant destinations for user queries',
      itineraryPlanning: 'Validate trip planning accuracy and completeness',
      budgetEstimation: 'Ensure cost estimates are realistic and helpful',
      culturalInfo: 'Verify cultural advice is accurate and appropriate',
      functionCalling: 'Test if AI correctly identifies and calls functions'
    },
    evaluationMetrics: {
      precision: 'Fraction of recommended items that are relevant',
      recall: 'Fraction of relevant items that are recommended',
      f1Score: 'Harmonic mean of precision and recall',
      relevanceScore: 'Semantic similarity between expected and actual results',
      responseTime: 'Speed of AI response generation'
    },
    testingCategories: [
      'destination_search',
      'itinerary_planning', 
      'budget_estimation',
      'cultural_info',
      'function_calling'
    ],
    difficultyLevels: ['easy', 'medium', 'hard'],
    bestPractices: [
      'Maintain diverse, balanced evaluation dataset',
      'Include edge cases and difficult scenarios',
      'Regularly update dataset with new travel trends',
      'Combine automated metrics with human feedback',
      'Run continuous evaluation during development',
      'Use A/B testing for model improvements'
    ],
    availableTests: travelEvaluationDataset.length,
    humanFeedbackCount: humanFeedbackStore.length
  });
});

export default router;
