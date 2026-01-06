'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { transactionsAPI, accountsAPI } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { 
  Plus, 
  ArrowUpRight, 
  ArrowDownRight, 
  Filter,
  Search,
  Calendar
} from 'lucide-react';

interface Transaction {
  _id: string;
  amount: number;
  type: string;
  category: string;
  description: string;
  date: string;
  accountId: {
    _id: string;
    name: string;
    color: string;
  };
  isUrgent: boolean;
}

interface Account {
  _id: string;
  name: string;
  type: string;
  balance: number;
}

export default function TransactionsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    accountId: '',
    amount: '',
    type: 'expense',
    category: 'other-expense',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  const expenseCategories = [
    'food', 'transportation', 'shopping', 'entertainment', 'bills', 'healthcare',
    'education', 'travel', 'groceries', 'rent', 'utilities', 'insurance',
    'subscriptions', 'other-expense'
  ];

  const incomeCategories = [
    'salary', 'freelance', 'investment', 'gift', 'refund', 'other-income'
  ];

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      fetchData();
    }
  }, [user, loading, router]);

  const fetchData = async () => {
    try {
      setLoadingData(true);
      const [transactionsRes, accountsRes] = await Promise.all([
        transactionsAPI.getAll({ limit: 50 }),
        accountsAPI.getAll()
      ]);
      setTransactions(transactionsRes.data.transactions);
      setAccounts(accountsRes.data.accounts);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await transactionsAPI.create({
        ...formData,
        amount: parseFloat(formData.amount)
      });
      setShowCreateForm(false);
      setFormData({
        accountId: '',
        amount: '',
        type: 'expense',
        category: 'other-expense',
        description: '',
        date: new Date().toISOString().split('T')[0]
      });
      fetchData();
    } catch (error: any) {
      console.error('Failed to create transaction:', error);
      alert(`Failed to create transaction: ${error.response?.data?.message || error.message}`);
    }
  };

  const getCategoryOptions = () => {
    return formData.type === 'income' ? incomeCategories : expenseCategories;
  };

  if (loading || loadingData) {
    return (
      <DashboardLayout>
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white p-4 rounded-lg shadow">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
            <p className="text-gray-600">Track your income and expenses</p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Transaction
          </button>
        </div>

        {/* Create Transaction Form */}
        {showCreateForm && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Transaction</h3>
            <form onSubmit={handleCreateTransaction} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Account</label>
                  <select
                    required
                    value={formData.accountId}
                    onChange={(e) => setFormData({...formData, accountId: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select an account</option>
                    {accounts.map((account) => (
                      <option key={account._id} value={account._id}>
                        {account.name} ({formatCurrency(account.balance)})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({
                      ...formData, 
                      type: e.target.value,
                      category: e.target.value === 'income' ? 'salary' : 'other-expense'
                    })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    {getCategoryOptions().map((category) => (
                      <option key={category} value={category}>
                        {category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <input
                  type="text"
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Transaction description..."
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Add Transaction
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Transactions List */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="space-y-4">
              {transactions.map((transaction) => (
                <div key={transaction._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-full ${
                      transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {transaction.type === 'income' ? (
                        <ArrowUpRight className="h-5 w-5 text-green-600" />
                      ) : (
                        <ArrowDownRight className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{transaction.description}</p>
                      <p className="text-xs text-gray-500">
                        {transaction.accountId.name} • {transaction.category.replace('-', ' ')} • {formatDate(transaction.date)}
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
              {transactions.length === 0 && (
                <div className="text-center py-12">
                  <ArrowUpRight className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No transactions</h3>
                  <p className="mt-1 text-sm text-gray-500">Get started by adding your first transaction.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}