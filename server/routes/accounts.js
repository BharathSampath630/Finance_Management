const express = require('express');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/accounts
// @desc    Get all user accounts
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const accounts = await Account.find({ 
      userId: req.userId, 
      isActive: true 
    }).sort({ createdAt: -1 });

    // Calculate total balance across all accounts
    const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);

    res.json({
      accounts,
      totalBalance,
      count: accounts.length
    });
  } catch (error) {
    console.error('Get accounts error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch accounts', 
      error: error.message 
    });
  }
});

// @route   POST /api/accounts
// @desc    Create new account
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { name, type, balance, currency, description, color, icon } = req.body;

    const account = new Account({
      userId: req.userId,
      name,
      type,
      balance: balance || 0,
      currency: currency || 'USD',
      description,
      color,
      icon
    });

    await account.save();

    res.status(201).json({
      message: 'Account created successfully',
      account
    });
  } catch (error) {
    console.error('Create account error:', error);
    res.status(500).json({ 
      message: 'Failed to create account', 
      error: error.message 
    });
  }
});

// @route   GET /api/accounts/:id
// @desc    Get single account with recent transactions
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const account = await Account.findOne({
      _id: req.params.id,
      userId: req.userId,
      isActive: true
    });

    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    // Get recent transactions for this account
    const recentTransactions = await Transaction.find({
      accountId: req.params.id,
      userId: req.userId
    })
    .sort({ date: -1 })
    .limit(10);

    res.json({
      account,
      recentTransactions
    });
  } catch (error) {
    console.error('Get account error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch account', 
      error: error.message 
    });
  }
});

// @route   PUT /api/accounts/:id
// @desc    Update account
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, type, description, color, icon } = req.body;

    const account = await Account.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    // Update fields
    if (name) account.name = name;
    if (type) account.type = type;
    if (description !== undefined) account.description = description;
    if (color) account.color = color;
    if (icon) account.icon = icon;

    await account.save();

    res.json({
      message: 'Account updated successfully',
      account
    });
  } catch (error) {
    console.error('Update account error:', error);
    res.status(500).json({ 
      message: 'Failed to update account', 
      error: error.message 
    });
  }
});

// @route   DELETE /api/accounts/:id
// @desc    Soft delete account
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const account = await Account.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    // Check if account has transactions
    const transactionCount = await Transaction.countDocuments({
      accountId: req.params.id
    });

    if (transactionCount > 0) {
      // Soft delete - mark as inactive
      account.isActive = false;
      await account.save();
    } else {
      // Hard delete if no transactions
      await Account.findByIdAndDelete(req.params.id);
    }

    res.json({
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ 
      message: 'Failed to delete account', 
      error: error.message 
    });
  }
});

// @route   GET /api/accounts/stats/overview
// @desc    Get account statistics overview
// @access  Private
router.get('/stats/overview', auth, async (req, res) => {
  try {
    const accounts = await Account.find({ 
      userId: req.userId, 
      isActive: true 
    });

    const stats = {
      totalAccounts: accounts.length,
      totalBalance: accounts.reduce((sum, acc) => sum + acc.balance, 0),
      accountsByType: {},
      balanceByType: {}
    };

    // Group by account type
    accounts.forEach(account => {
      if (!stats.accountsByType[account.type]) {
        stats.accountsByType[account.type] = 0;
        stats.balanceByType[account.type] = 0;
      }
      stats.accountsByType[account.type]++;
      stats.balanceByType[account.type] += account.balance;
    });

    res.json(stats);
  } catch (error) {
    console.error('Get account stats error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch account statistics', 
      error: error.message 
    });
  }
});

module.exports = router;