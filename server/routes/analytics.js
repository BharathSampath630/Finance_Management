const express = require('express');
const analyticsService = require('../services/analyticsService');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/analytics/spending-by-category
// @desc    Get spending breakdown by category
// @access  Private
router.get('/spending-by-category', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const data = await analyticsService.getSpendingByCategory(req.userId, start, end);
    
    res.json({
      data,
      period: { startDate: start, endDate: end }
    });
  } catch (error) {
    console.error('Get spending by category error:', error);
    res.status(500).json({ 
      message: 'Failed to get spending data', 
      error: error.message 
    });
  }
});

// @route   GET /api/analytics/income-vs-expenses
// @desc    Get income vs expenses over time
// @access  Private
router.get('/income-vs-expenses', auth, async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    const data = await analyticsService.getIncomeVsExpenses(req.userId, period);
    
    res.json({ data, period });
  } catch (error) {
    console.error('Get income vs expenses error:', error);
    res.status(500).json({ 
      message: 'Failed to get income vs expenses data', 
      error: error.message 
    });
  }
});

// @route   GET /api/analytics/balance-trends
// @desc    Get account balance trends
// @access  Private
router.get('/balance-trends', auth, async (req, res) => {
  try {
    const data = await analyticsService.getAccountBalanceTrends(req.userId);
    res.json({ data });
  } catch (error) {
    console.error('Get balance trends error:', error);
    res.status(500).json({ 
      message: 'Failed to get balance trends', 
      error: error.message 
    });
  }
});

// @route   GET /api/analytics/insights
// @desc    Get AI-generated insights
// @access  Private
router.get('/insights', auth, async (req, res) => {
  try {
    const insights = await analyticsService.generateInsights(req.userId);
    res.json({ insights });
  } catch (error) {
    console.error('Get insights error:', error);
    res.status(500).json({ 
      message: 'Failed to generate insights', 
      error: error.message 
    });
  }
});

// @route   GET /api/analytics/predictions
// @desc    Get spending predictions
// @access  Private
router.get('/predictions', auth, async (req, res) => {
  try {
    const predictions = await analyticsService.predictSpending(req.userId);
    res.json({ predictions });
  } catch (error) {
    console.error('Get predictions error:', error);
    res.status(500).json({ 
      message: 'Failed to get predictions', 
      error: error.message 
    });
  }
});

// @route   GET /api/analytics/dashboard-stats
// @desc    Get comprehensive dashboard statistics
// @access  Private
router.get('/dashboard-stats', auth, async (req, res) => {
  try {
    const [
      spendingByCategory,
      incomeVsExpenses,
      insights,
      predictions
    ] = await Promise.all([
      analyticsService.getSpendingByCategory(req.userId, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), new Date()),
      analyticsService.getIncomeVsExpenses(req.userId, 'month'),
      analyticsService.generateInsights(req.userId),
      analyticsService.predictSpending(req.userId)
    ]);

    res.json({
      spendingByCategory,
      incomeVsExpenses,
      insights,
      predictions
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ 
      message: 'Failed to get dashboard statistics', 
      error: error.message 
    });
  }
});

module.exports = router;