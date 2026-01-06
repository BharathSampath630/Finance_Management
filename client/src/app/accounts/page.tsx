'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { accountsAPI } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { 
  Plus, 
  CreditCard, 
  Edit, 
  Trash2, 
  Wallet,
  PiggyBank,
  Building,
  Banknote
} from 'lucide-react';

interface Account {
  _id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
  color: string;
  description?: string;
  createdAt: string;
}

const accountTypeIcons = {
  checking: Wallet,
  savings: PiggyBank,
  credit: CreditCard,
  investment: Building,
  cash: Banknote
};

export default function AccountsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'checking',
    balance: '',
    currency: 'USD',
    description: '',
    color: '#3B82F6'
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      fetchAccounts();
    }
  }, [user, loading, router]);

  const fetchAccounts = async () => {
    try {
      setLoadingData(true);
      const response = await accountsAPI.getAll();
      setAccounts(response.data.accounts);
    } catch (error) {
      console.error('Failed to fetch accounts:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await accountsAPI.create({
        ...formData,
        balance: parseFloat(formData.balance) || 0
      });
      setShowCreateForm(false);
      setFormData({
        name: '',
        type: 'checking',
        balance: '',
        currency: 'USD',
        description: '',
        color: '#3B82F6'
      });
      fetchAccounts();
    } catch (error) {
      console.error('Failed to create account:', error);
    }
  };

  if (loading || loadingData) {
    return (
      <DashboardLayout>
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
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
            <h1 className="text-2xl font-bold text-gray-900">Accounts</h1>
            <p className="text-gray-600">Manage your financial accounts</p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Account
          </button>
        </div>

        {/* Create Account Form */}
        {showCreateForm && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Account</h3>
            <form onSubmit={handleCreateAccount} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Account Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Main Checking"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Account Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="checking">Checking</option>
                    <option value="savings">Savings</option>
                    <option value="credit">Credit Card</option>
                    <option value="investment">Investment</option>
                    <option value="cash">Cash</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Initial Balance</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.balance}
                    onChange={(e) => setFormData({...formData, balance: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Currency</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({...formData, currency: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="INR">INR</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description (Optional)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  rows={2}
                  placeholder="Account description..."
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
                  Create Account
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Accounts Grid */}
        {accounts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {accounts.map((account) => {
              const IconComponent = accountTypeIcons[account.type as keyof typeof accountTypeIcons] || Wallet;
              return (
                <div key={account._id} className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: account.color + '20' }}
                      >
                        <IconComponent 
                          className="h-6 w-6" 
                          style={{ color: account.color }}
                        />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{account.name}</h3>
                        <p className="text-sm text-gray-500 capitalize">{account.type}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(account.balance, account.currency)}
                    </p>
                  </div>

                  {account.description && (
                    <p className="text-sm text-gray-600 mb-4">{account.description}</p>
                  )}

                  <div className="flex justify-end space-x-2">
                    <button className="p-2 text-gray-400 hover:text-blue-600">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No accounts</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating your first account.</p>
            <div className="mt-6">
              <button
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Account
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}