'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { User, Bell, Palette, Shield, Download } from 'lucide-react';

export default function SettingsPage() {
  const { user, loading, updateUser } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('profile');
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    currency: 'USD',
    theme: 'light'
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      setProfileData({
        name: user.name,
        email: user.email,
        currency: user.preferences?.currency || 'USD',
        theme: user.preferences?.theme || 'light'
      });
    }
  }, [user, loading, router]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Here you would call the API to update user profile
      updateUser({
        name: profileData.name,
        preferences: {
          ...user?.preferences,
          currency: profileData.currency,
          theme: profileData.theme
        }
      });
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'appearance', name: 'Appearance', icon: Palette },
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'export', name: 'Export Data', icon: Download },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Manage your account preferences and settings</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="lg:w-64">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="bg-white shadow rounded-lg">
              {activeTab === 'profile' && (
                <div className="p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Information</h3>
                  <form onSubmit={handleSaveProfile} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Full Name</label>
                      <input
                        type="text"
                        value={profileData.name}
                        onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <input
                        type="email"
                        value={profileData.email}
                        disabled
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-gray-500"
                      />
                      <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Default Currency</label>
                      <select
                        value={profileData.currency}
                        onChange={(e) => setProfileData({...profileData, currency: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="USD">USD - US Dollar</option>
                        <option value="EUR">EUR - Euro</option>
                        <option value="GBP">GBP - British Pound</option>
                        <option value="INR">INR - Indian Rupee</option>
                      </select>
                    </div>
                    <div className="pt-4">
                      <button
                        type="submit"
                        className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                      >
                        Save Changes
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Preferences</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Email Notifications</p>
                        <p className="text-sm text-gray-500">Receive email updates about your account</p>
                      </div>
                      <input type="checkbox" defaultChecked className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Budget Alerts</p>
                        <p className="text-sm text-gray-500">Get notified when you exceed budget limits</p>
                      </div>
                      <input type="checkbox" defaultChecked className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Large Transaction Alerts</p>
                        <p className="text-sm text-gray-500">Alert for transactions over $1000</p>
                      </div>
                      <input type="checkbox" defaultChecked className="h-4 w-4 text-blue-600" />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'appearance' && (
                <div className="p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Appearance</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
                      <div className="space-y-2">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="theme"
                            value="light"
                            checked={profileData.theme === 'light'}
                            onChange={(e) => setProfileData({...profileData, theme: e.target.value})}
                            className="h-4 w-4 text-blue-600"
                          />
                          <span className="ml-2 text-sm text-gray-700">Light</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="theme"
                            value="dark"
                            checked={profileData.theme === 'dark'}
                            onChange={(e) => setProfileData({...profileData, theme: e.target.value})}
                            className="h-4 w-4 text-blue-600"
                          />
                          <span className="ml-2 text-sm text-gray-700">Dark (Coming Soon)</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Security</h3>
                  <div className="space-y-4">
                    <div>
                      <button className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                        Change Password
                      </button>
                      <p className="mt-1 text-xs text-gray-500">Update your account password</p>
                    </div>
                    <div>
                      <button className="px-4 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 hover:bg-red-50">
                        Delete Account
                      </button>
                      <p className="mt-1 text-xs text-gray-500">Permanently delete your account and all data</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'export' && (
                <div className="p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Export Data</h3>
                  <div className="space-y-4">
                    <div>
                      <button className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                        Export as CSV
                      </button>
                      <p className="mt-1 text-xs text-gray-500">Download your transaction data as CSV</p>
                    </div>
                    <div>
                      <button className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                        Export as PDF Report
                      </button>
                      <p className="mt-1 text-xs text-gray-500">Generate a comprehensive PDF report</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}