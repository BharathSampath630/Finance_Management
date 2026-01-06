const { Configuration, PlaidApi, PlaidEnvironments } = require('plaid');

// Plaid configuration
const configuration = new Configuration({
  basePath: PlaidEnvironments.sandbox, // Use sandbox for development
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    },
  },
});

const plaidClient = new PlaidApi(configuration);

class PlaidService {
  // Create link token for Plaid Link
  async createLinkToken(userId) {
    try {
      const request = {
        user: {
          client_user_id: userId
        },
        client_name: 'AI Finance Platform',
        products: ['transactions', 'accounts'],
        country_codes: ['US'],
        language: 'en',
      };

      const response = await plaidClient.linkTokenCreate(request);
      return response.data.link_token;
    } catch (error) {
      console.error('Error creating link token:', error);
      throw error;
    }
  }

  // Exchange public token for access token
  async exchangePublicToken(publicToken) {
    try {
      const request = {
        public_token: publicToken,
      };

      const response = await plaidClient.itemPublicTokenExchange(request);
      return response.data.access_token;
    } catch (error) {
      console.error('Error exchanging public token:', error);
      throw error;
    }
  }

  // Get accounts from Plaid
  async getAccounts(accessToken) {
    try {
      const request = {
        access_token: accessToken,
      };

      const response = await plaidClient.accountsGet(request);
      return response.data.accounts;
    } catch (error) {
      console.error('Error fetching accounts:', error);
      throw error;
    }
  }

  // Get transactions from Plaid
  async getTransactions(accessToken, startDate, endDate) {
    try {
      const request = {
        access_token: accessToken,
        start_date: startDate,
        end_date: endDate,
      };

      const response = await plaidClient.transactionsGet(request);
      return response.data.transactions;
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }
  }

  // Sync transactions (for real-time updates)
  async syncTransactions(accessToken, cursor = null) {
    try {
      const request = {
        access_token: accessToken,
        cursor: cursor,
      };

      const response = await plaidClient.transactionsSync(request);
      return {
        added: response.data.added,
        modified: response.data.modified,
        removed: response.data.removed,
        next_cursor: response.data.next_cursor,
        has_more: response.data.has_more,
      };
    } catch (error) {
      console.error('Error syncing transactions:', error);
      throw error;
    }
  }
}

module.exports = new PlaidService();