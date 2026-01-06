'use client';

import { useState, useCallback, useEffect } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import { Banknote, Link as LinkIcon, Loader2, CheckCircle, RefreshCw } from 'lucide-react';

interface PlaidLinkProps {
  onSuccess: (publicToken: string, metadata: any) => void;
  onExit?: (err: any, metadata: any) => void;
}

export default function PlaidLink({ onSuccess, onExit }: PlaidLinkProps) {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [connectedBank, setConnectedBank] = useState<string>('');
  const [lastSync, setLastSync] = useState<Date | null>(null);

  // Create link token when component mounts
  useEffect(() => {
    createLinkToken();
  }, []);

  const createLinkToken = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/banking/create-link-token', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setLinkToken(data.link_token);
      } else {
        console.error('Failed to create link token');
      }
    } catch (error) {
      console.error('Error creating link token:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOnSuccess = useCallback(async (public_token: string, metadata: any) => {
    try {
      setLoading(true);
      
      // Exchange public token for access token
      const exchangeResponse = await fetch('/api/banking/exchange-public-token', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ public_token })
      });

      if (exchangeResponse.ok) {
        const { access_token } = await exchangeResponse.json();
        
        // Sync accounts
        await syncAccounts(access_token);
        
        // Sync transactions
        await syncTransactions(access_token);
        
        setConnected(true);
        setConnectedBank(metadata.institution.name);
        setLastSync(new Date());
        
        onSuccess(public_token, metadata);
      }
    } catch (error) {
      console.error('Error handling Plaid success:', error);
    } finally {
      setLoading(false);
    }
  }, [onSuccess]);

  const syncAccounts = async (accessToken: string) => {
    const response = await fetch('/api/banking/sync-accounts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ access_token: accessToken })
    });
    
    if (!response.ok) {
      throw new Error('Failed to sync accounts');
    }
    
    return response.json();
  };

  const syncTransactions = async (accessToken: string) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30); // Last 30 days
    
    const response = await fetch('/api/banking/sync-transactions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        access_token: accessToken,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0]
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to sync transactions');
    }
    
    return response.json();
  };

  const handleManualSync = async () => {
    try {
      setLoading(true);
      
      // Get stored access token (in production, this should be stored securely on backend)
      const accessToken = localStorage.getItem('plaid_access_token');
      
      if (accessToken) {
        await syncTransactions(accessToken);
        setLastSync(new Date());
      }
    } catch (error) {
      console.error('Manual sync failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const config = {
    token: linkToken,
    onSuccess: handleOnSuccess,
    onExit: onExit || (() => {}),
  };

  const { open, ready } = usePlaidLink(config);

  if (connected) {
    return (
      <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-400">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-green-100 p-2 rounded-full">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">Bank Connected</h3>
              <p className="text-sm text-gray-600">{connectedBank}</p>
              {lastSync && (
                <p className="text-xs text-gray-500">
                  Last synced: {lastSync.toLocaleString()}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={handleManualSync}
            disabled={loading}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span className="ml-2">Sync Now</span>
          </button>
        </div>
        
        <div className="mt-4 p-3 bg-green-50 rounded-md">
          <p className="text-sm text-green-800">
            🎉 Your bank account is connected! Transactions will be automatically imported and categorized.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="text-center">
        <div className="bg-blue-100 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          <Banknote className="h-8 w-8 text-blue-600" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Connect Your Bank Account</h3>
        <p className="text-gray-600 mb-6">
          Securely connect your bank account to automatically import transactions and account balances in real-time.
        </p>
        
        <button
          onClick={() => open()}
          disabled={!ready || loading}
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <LinkIcon className="h-5 w-5 mr-2" />
              Connect Bank Account
            </>
          )}
        </button>

        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="bg-gray-100 p-2 rounded-lg mb-2">
              <img src="/api/placeholder/40/20" alt="Chase" className="h-5 mx-auto" />
            </div>
            <p className="text-xs text-gray-600">Chase</p>
          </div>
          <div className="text-center">
            <div className="bg-gray-100 p-2 rounded-lg mb-2">
              <img src="/api/placeholder/40/20" alt="Bank of America" className="h-5 mx-auto" />
            </div>
            <p className="text-xs text-gray-600">Bank of America</p>
          </div>
          <div className="text-center">
            <div className="bg-gray-100 p-2 rounded-lg mb-2">
              <img src="/api/placeholder/40/20" alt="Wells Fargo" className="h-5 mx-auto" />
            </div>
            <p className="text-xs text-gray-600">Wells Fargo</p>
          </div>
          <div className="text-center">
            <div className="bg-gray-100 p-2 rounded-lg mb-2">
              <img src="/api/placeholder/40/20" alt="Citi" className="h-5 mx-auto" />
            </div>
            <p className="text-xs text-gray-600">Citi</p>
          </div>
        </div>

        <div className="mt-6 text-xs text-gray-500 space-y-1">
          <p>🔒 Bank-level security with 256-bit encryption</p>
          <p>✅ Supports 12,000+ banks and credit unions</p>
          <p>🚀 Automatic transaction categorization</p>
          <p>⚡ Real-time balance updates</p>
        </div>
      </div>
    </div>
  );
}