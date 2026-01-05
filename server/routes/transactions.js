const express = require('express');
const Transaction = require('../models/Transaction');
const Account = require('../models/Account');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/transactions
// @desc    Get user transactions with filtering and pagination
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      accountId, 
      type, 
      category, 
      startDate, 
      endDate,
      search 
    } = req.query;

    // Build filter object
    const filter = { userId: req.userId };
    
    if (accountId) filter.accountId = accountId;
    if (type) filter.type = type;
    if (category) filter.category = category;
    
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }
    
    if (search) {
      filter.description = { $regex: search, $options: 'i' };
    }

    // Execute query with pagination
    const transactions = await Transaction.find(filter)
      .populate('accountId', 'name type color')
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Transaction.countDocuments(filter);

    res.json({
      transactions,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch transactions', 
      error: error.message 
    });
  }
});

// @route   POST /api/transactions
// @desc    Create new transaction
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { 
      accountId, 
      amount, 
      type, 
      category, 
      description, 
      date,
      tags,
      location 
    } = req.body;

    // Verify account belongs to user
    const account = await Account.findOne({
      _id: accountId,
      userId: req.userId,
      isActive: true
    });

    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    // Calculate new balance
    let newBalance = account.balance;
    if (type === 'income') {
      newBalance += Math.abs(amount);
    } else if (type === 'expense') {
      newBalance -= Math.abs(amount);
    }

    // Create transaction
    const transaction = new Transaction({
      accountId,
      userId: req.userId,
      amount: type === 'expense' ? -Math.abs(amount) : Math.abs(amount),
      type,
      category,
      description,
      date: date || new Date(),
      tags: tags || [],
      location,
      balanceAfter: newBalance,
      isUrgent: Math.abs(amount) > 1000 // Mark as urgent if > $1000
    });

    await transaction.save();

    // Update account balance
    account.balance = newBalance;
    await account.save();

    // Populate account info for response
    await transaction.populate('accountId', 'name type color');

    res.status(201).json({
      message: 'Transaction created successfully',
      transaction
    });
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({ 
      message: 'Failed to create transaction', 
      error: error.message 
    });
  }
});

// @route   GET /api/transactions/:id
// @desc    Get single transaction
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.userId
    }).populate('accountId', 'name type color currency');

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    res.json({ transaction });
  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch transaction', 
      error: error.message 
    });
  }
});

// @route   PUT /api/transactions/:id
// @desc    Update transaction
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const { amount, type, category, description, date, tags, location } = req.body;

    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    const account = await Account.findById(transaction.accountId);
    
    // Revert old transaction from balance
    account.balance = transaction.balanceAfter - transaction.amount;

    // Apply new transaction amount
    const newAmount = type === 'expense' ? -Math.abs(amount) : Math.abs(amount);
    const newBalance = account.balance + newAmount;

    // Update transaction
    transaction.amount = newAmount;
    transaction.type = type;
    transaction.category = category;
    transaction.description = description;
    transaction.date = date || transaction.date;
    transaction.tags = tags || transaction.tags;
    transaction.location = location || transaction.location;
    transaction.balanceAfter = newBalance;
    transaction.isUrgent = Math.abs(amount) > 1000;

    await transaction.save();

    // Update account balance
    account.balance = newBalance;
    await account.save();

    await transaction.populate('accountId', 'name type color');

    res.json({
      message: 'Transaction updated successfully',
      transaction
    });
  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(500).json({ 
      message: 'Failed to update transaction', 
      error: error.message 
    });
  }
});

// @route   DELETE /api/transactions/:id
// @desc    Delete transaction
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    const account = await Account.findById(transaction.accountId);
    
    // Revert transaction from account balance
    account.balance = transaction.balanceAfter - transaction.amount;
    await account.save();

    // Delete transaction
    await Transaction.findByIdAndDelete(req.params.id);

    res.json({
      message: 'Transaction deleted successfully'
    });
  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({ 
      message: 'Failed to delete transaction', 
      error: error.message 
    });
  }
});

module.exports = router;