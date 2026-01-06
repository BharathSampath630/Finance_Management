const plaidService = require('./plaidService');
const categorizationService = require('./categorizationService');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');

class SyncService {
  constructor() {
    this.syncInterval = null;
    this.isRunning = false;
  }

  // Start automatic sync for all connected accounts
  startAutoSync(intervalMinutes = 60) {
    if (this.isRunning) {
      console.log('Auto sync already running');
      return;
    }

    console.log(`🔄 Starting auto sync every ${intervalMinutes} minutes`);
    this.isRunning = true;

    // Run initial sync
    this.syncAllAccounts();

    // Set up recurring sync
    this.syncInterval = setInterval(() => {
      this.syncAllAccounts();
    }, intervalMinutes * 60 * 1000);
  }

  // Stop automatic sync
  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      this.isRunning = false;
      console.log('🛑 Auto sync stopped');
    }
  }

  // Sync all Plaid-connected accounts
  async syncAllAccounts() {
    try {
      console.log('🔄 Starting sync for all connected accounts...');
      
      const connectedAccounts = await Account.find({
        isPlaidLinked: true,
        plaidAccessToken: { $exists: true, $ne: null }
      });

      console.log(`Found ${connectedAccounts.length} connected accounts`);

      for (const account of connectedAccounts) {
        try {
          await this.syncAccountTransactions(account);
          await this.updateAccountBalance(account);
        } catch (error) {
          console.error(`Failed to sync account ${account.name}:`, error);
        }
      }

      console.log('✅ Sync completed for all accounts');
    } catch (error) {
      console.error('❌ Auto sync failed:', error);
    }
  }

  // Sync transactions for a specific account
  async syncAccountTransactions(account) {
    try {
      // Get transactions from last 7 days to catch any new ones
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);

      const plaidTransactions = await plaidService.getTransactions(
        account.plaidAccessToken,
        startDate,
        endDate
      );

      let newTransactionCount = 0;

      for (const plaidTx of plaidTransactions) {
        // Check if transaction already exists
        const existingTx = await Transaction.findOne({
          plaidTransactionId: plaidTx.transaction_id
        });

        if (!existingTx) {
          // Create new transaction
          const amount = plaidTx.amount;
          const type = amount > 0 ? 'expense' : 'income';
          
          // Use smart categorization
          const categorization = categorizationService.categorizeTransaction(
            plaidTx.name, 
            amount
          );

          // Calculate new balance
          const currentBalance = account.balance;
          const newBalance = type === 'expense' ? 
            currentBalance - Math.abs(amount) : 
            currentBalance + Math.abs(amount);

          const newTransaction = new Transaction({
            accountId: account._id,
            userId: account.userId,
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
          newTransactionCount++;
        }
      }

      // Update last sync date
      account.lastSyncDate = new Date();
      await account.save();

      if (newTransactionCount > 0) {
        console.log(`✅ Synced ${newTransactionCount} new transactions for ${account.name}`);
      }

      return newTransactionCount;
    } catch (error) {
      console.error(`Failed to sync transactions for account ${account.name}:`, error);
      throw error;
    }
  }

  // Update account balance from Plaid
  async updateAccountBalance(account) {
    try {
      const plaidAccounts = await plaidService.getAccounts(account.plaidAccessToken);
      const plaidAccount = plaidAccounts.find(acc => acc.account_id === account.plaidAccountId);

      if (plaidAccount && plaidAccount.balances.current !== null) {
        const newBalance = plaidAccount.balances.current;
        
        if (Math.abs(account.balance - newBalance) > 0.01) { // Only update if different
          console.log(`💰 Balance updated for ${account.name}: $${account.balance} → $${newBalance}`);
          account.balance = newBalance;
          await account.save();
        }
      }
    } catch (error) {
      console.error(`Failed to update balance for account ${account.name}:`, error);
    }
  }

  // Sync specific user's accounts (called from API)
  async syncUserAccounts(userId) {
    try {
      const userAccounts = await Account.find({
        userId: new mongoose.Types.ObjectId(userId),
        isPlaidLinked: true,
        plaidAccessToken: { $exists: true, $ne: null }
      });

      let totalNewTransactions = 0;

      for (const account of userAccounts) {
        const newTxCount = await this.syncAccountTransactions(account);
        await this.updateAccountBalance(account);
        totalNewTransactions += newTxCount;
      }

      return {
        accountsSynced: userAccounts.length,
        newTransactions: totalNewTransactions
      };
    } catch (error) {
      console.error('Failed to sync user accounts:', error);
      throw error;
    }
  }

  // Handle Plaid webhooks for real-time updates
  async handleWebhook(webhookData) {
    try {
      const { webhook_type, webhook_code, item_id } = webhookData;

      if (webhook_type === 'TRANSACTIONS') {
        if (webhook_code === 'DEFAULT_UPDATE' || webhook_code === 'INITIAL_UPDATE') {
          // Find accounts with this item_id
          const accounts = await Account.find({ plaidItemId: item_id });
          
          for (const account of accounts) {
            console.log(`🔔 Webhook triggered sync for ${account.name}`);
            await this.syncAccountTransactions(account);
            await this.updateAccountBalance(account);
          }
        }
      }

      return { status: 'processed' };
    } catch (error) {
      console.error('Webhook processing failed:', error);
      throw error;
    }
  }
}

module.exports = new SyncService();