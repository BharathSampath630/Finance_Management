'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { accountsAPI, transactionsAPI } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  AlertTriangle
} from 'lucide-react';

interface Account {
  _id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
  color: string;
}

interface Transaction {
  _id: string;
  amount: number;
  type: string;
  category: string;
  description: string;
  date: string;
  accountId: {
    name: string;
    color: string;
  };
  isUrgent: boolean;
}

interface AccountStats {
  totalBalance: number;
  totalAccounts: number;
  accountsByType: Record<string, number>;
  balanceByType: Record<string, number>;
}

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<AccountStats | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      fetchDashboardData();
    }
  }, [user, loading, router]);

  const fetchDashboardData = async () => {
    try {
      setLoadingData(true);
      
      // Fetch accounts and stats
      const [accountsRes, statsRes, transactionsRes] = await Promise.all([
        accountsAPI.getAll(),
        accountsAPI.getStats(),
        transactionsAPI.getAll({ limit: 5 })
      ]);

      setAccounts(accountsRes.data.accounts);
      setStats(statsRes.data);
      setRecentTransactions(transactionsRes.data.transactions);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  if (loading || loadingData) {
    return (
      <DashboardLayout>
        <div className="animate-pulse">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const totalIncome = recentTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const totalExpenses = recentTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const urgentTransactions = recentTransactions.filter(t => t.isUrgent);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
          <h1 className="text-2xl font-bold">Welcome back, {user?.name}!</h1>
          <p className="text-blue-100 mt-1">Here's your financial overview for today</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Balance */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <DollarSign className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Balance
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {formatCurrency(stats?.totalBalance || 0)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Total Accounts */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CreditCard className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Active Accounts
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats?.totalAccounts || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Income */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-6 w-6 text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Recent Income
                    </dt>
                    <dd className="text-lg font-medium text-green-600">
                      {formatCurrency(totalIncome)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Expenses */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingDown className="h-6 w-6 text-red-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Recent Expenses
                    </dt>
                    <dd className="text-lg font-medium text-red-600">
                      {formatCurrency(totalExpenses)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Urgent Alerts */}
        {urgentTransactions.length > 0 && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <strong>Urgent Transactions Detected:</strong> You have {urgentTransactions.length} large transaction(s) that require attention.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Accounts */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Your Accounts
                </h3>
                <button
                  onClick={() => router.push('/accounts')}
                  className="text-sm text-blue-600 hover:text-blue-500 font-medium"
                >
                  View all
                </button>
              </div>
              <div className="space-y-3">
                {accounts.slice(0, 4).map((account) => (
                  <div key={account._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: account.color }}
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{account.name}</p>
                        <p className="text-xs text-gray-500 capitalize">{account.type}</p>
                      </div>
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      {formatCurrency(account.balance, account.currency)}
                    </p>
                  </div>
                ))}
                {accounts.length === 0 && (
                  <div className="text-center py-6">
                    <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No accounts</h3>
                    <p className="mt-1 text-sm text-gray-500">Get started by creating your first account.</p>
                    <div className="mt-6">
                      <button
                        onClick={() => router.push('/accounts')}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Account
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Recent Transactions
                </h3>
                <button
                  onClick={() => router.push('/transactions')}
                  className="text-sm text-blue-600 hover:text-blue-500 font-medium"
                >
                  View all
                </button>
              </div>
              <div className="space-y-3">
                {recentTransactions.map((transaction) => (
                  <div key={transaction._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-full ${
                        transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {transaction.type === 'income' ? (
                          <ArrowUpRight className="h-4 w-4 text-green-600" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{transaction.description}</p>
                        <p className="text-xs text-gray-500">
                          {transaction.accountId.name} • {formatDate(transaction.date)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount))}
                      </p>
                      {transaction.isUrgent && (
                        <p className="text-xs text-yellow-600 font-medium">Urgent</p>
                      )}
                    </div>
                  </div>
                ))}
                {recentTransactions.length === 0 && (
                  <div className="text-center py-6">
                    <ArrowUpRight className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No transactions</h3>
                    <p className="mt-1 text-sm text-gray-500">Start by adding your first transaction.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}