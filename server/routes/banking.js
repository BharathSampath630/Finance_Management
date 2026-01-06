const express = require('express');
const plaidService = require('../services/plaidService');
const categorizationService = require('../services/categorizationService');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');

const router = express.Router();

// @route   POST /api/banking/create-link-token
// @desc    Create Plaid Link token
// @access  Private
router.post('/create-link-token', auth, async (req, res) => {
  try {
    const linkToken = await plaidService.createLinkToken(req.userId);
    res.json({ link_token: linkToken });
  } catch (error) {
    console.error('Create link token error:', error);
    res.status(500).json({ 
      message: 'Failed to create link token', 
      error: error.message 
    });
  }
});

// @route   POST /api/banking/exchange-public-token
// @desc    Exchange public token for access token
// @access  Private
router.post('/exchange-public-token', auth, async (req, res) => {
  try {
    const { public_token } = req.body;
    const accessToken = await plaidService.exchangePublicToken(public_token);
    
    // Store access token securely (in production, encrypt this)
    res.json({ access_token: accessToken });
  } catch (error) {
    console.error('Exchange public token error:', error);
    res.status(500).json({ 
      message: 'Failed to exchange public token', 
      error: error.message 
    });
  }
});

// @route   POST /api/banking/sync-accounts
// @desc    Sync accounts from bank
// @access  Private
router.post('/sync-accounts', auth, async (req, res) => {
  try {
    const { access_token } = req.body;
    const plaidAccounts = await plaidService.getAccounts(access_token);
    
    const syncedAccounts = [];
    
    for (const plaidAccount of plaidAccounts) {
      // Check if account already exists
      let existingAccount = await Account.findOne({
        userId: new mongoose.Types.ObjectId(req.userId),
        plaidAccountId: plaidAccount.account_id
      });
      
      if (!existingAccount) {
        // Create new account
        const newAccount = new Account({
          userId: req.userId,
          name: plaidAccount.name,
          type: mapAccountType(plaidAccount.subtype || plaidAccount.type),
          balance: plaidAccount.balances.current || 0,
          currency: plaidAccount.balances.iso_currency_code || 'USD',
          plaidAccountId: plaidAccount.account_id,
          plaidAccessToken: access_token,
          isPlaidLinked: true,
          description: `${plaidAccount.official_name || plaidAccount.name} - Auto-synced`,
          lastSyncDate: new Date()
        });
        
        await newAccount.save();
        syncedAccounts.push(newAccount);
      } else {
        // Update existing account balance
        existingAccount.balance = plaidAccount.balances.current || existingAccount.balance;
        existingAccount.lastSyncDate = new Date();
        await existingAccount.save();
        syncedAccounts.push(existingAccount);
      }
    }
    
    res.json({
      message: `Synced ${syncedAccounts.length} accounts`,
      accounts: syncedAccounts
    });
  } catch (error) {
    console.error('Sync accounts error:', error);
    res.status(500).json({ 
      message: 'Failed to sync accounts', 
      error: error.message 
    });
  }
});

// @route   POST /api/banking/sync-transactions
// @desc    Sync transactions from bank
// @access  Private
router.post('/sync-transactions', auth, async (req, res) => {
  try {
    const { access_token, start_date, end_date } = req.body;
    
    const startDate = start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = end_date || new Date();
    
    const plaidTransactions = await plaidService.getTransactions(access_token, startDate, endDate);
    
    const syncedTransactions = [];
    
    for (const plaidTx of plaidTransactions) {
      // Find corresponding account
      const account = await Account.findOne({
        userId: new mongoose.Types.ObjectId(req.userId),
        plaidAccountId: plaidTx.account_id
      });
      
      if (!account) continue;
      
      // Check if transaction already exists
      const existingTx = await Transaction.findOne({
        plaidTransactionId: plaidTx.transaction_id
      });
      
      if (!existingTx) {
        // Determine transaction type and category
        const amount = plaidTx.amount;
        const type = amount > 0 ? 'expense' : 'income';
        
        // Use smart categorization
        const categorization = categorizationService.categorizeTransaction(
          plaidTx.name, 
          amount
        );
        
        // Calculate new balance (this is simplified - in production you'd need proper balance tracking)
        const currentBalance = account.balance;
        const newBalance = type === 'expense' ? 
          currentBalance - Math.abs(amount) : 
          currentBalance + Math.abs(amount);
        
        const newTransaction = new Transaction({
          accountId: account._id,
          userId: req.userId,
          amount: type === 'expense' ? -Math.abs(amount) : Math.abs(amount),
          type: type,
          category: categorization.category,
          description: plaidTx.name,
          date: new Date(plaidTx.date),
          plaidTransactionId: plaidTx.transaction_id,
          isPlaidSynced: true,
          balanceAfter: newBalance,
          location: plaidTx.location?.address || null,
          isUrgent: Math.abs(amount) > 1000
        });
        
        await newTransaction.save();
        
        // Update account balance
        account.balance = newBalance;
        await account.save();
        
        syncedTransactions.push(newTransaction);
      }
    }
    
    res.json({
      message: `Synced ${syncedTransactions.length} new transactions`,
      transactions: syncedTransactions
    });
  } catch (error) {
    console.error('Sync transactions error:', error);
    res.status(500).json({ 
      message: 'Failed to sync transactions', 
      error: error.message 
    });
  }
});

// @route   POST /api/banking/sync-user
// @desc    Manually sync all user accounts
// @access  Private
router.post('/sync-user', auth, async (req, res) => {
  try {
    const syncService = require('../services/syncService');
    const result = await syncService.syncUserAccounts(req.userId);
    
    res.json({
      message: 'Sync completed successfully',
      ...result
    });
  } catch (error) {
    console.error('Manual sync error:', error);
    res.status(500).json({ 
      message: 'Failed to sync accounts', 
      error: error.message 
    });
  }
});

// @route   POST /api/banking/webhook
// @desc    Handle Plaid webhooks for real-time updates
// @access  Public (but should be secured with webhook verification)
router.post('/webhook', async (req, res) => {
  try {
    const { webhook_type, webhook_code, item_id } = req.body;
    
    console.log('Plaid webhook received:', { webhook_type, webhook_code, item_id });
    
    if (webhook_type === 'TRANSACTIONS') {
      if (webhook_code === 'DEFAULT_UPDATE' || webhook_code === 'INITIAL_UPDATE') {
        // Find accounts with this item_id and sync transactions
        const accounts = await Account.find({ plaidItemId: item_id });
        
        for (const account of accounts) {
          if (account.plaidAccessToken) {
            // Trigger transaction sync for this account
            // This would typically be done in a background job
            console.log(`Triggering sync for account: ${account.name}`);
          }
        }
      }
    }
    
    res.json({ status: 'received' });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper function to map Plaid account types to our types
function mapAccountType(plaidType) {
  const typeMap = {
    'checking': 'checking',
    'savings': 'savings',
    'credit card': 'credit',
    'credit': 'credit',
    'investment': 'investment',
    'loan': 'credit',
    'mortgage': 'credit'
  };
  
  return typeMap[plaidType.toLowerCase()] || 'checking';
}

module.exports = router;