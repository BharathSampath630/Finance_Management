'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { PieChart, TrendingUp, BarChart3, Target } from 'lucide-react';

export default function AnalyticsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600">AI-powered insights and financial analytics</p>
        </div>

        {/* Coming Soon Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-blue-100 p-2 rounded-lg">
                <PieChart className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">Spending Analysis</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Visualize your spending patterns across different categories with interactive charts.
            </p>
            <div className="bg-gray-100 rounded-lg p-8 text-center">
              <p className="text-gray-500">Coming Soon</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-green-100 p-2 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">Income vs Expenses</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Track your financial trends over time with detailed income and expense analysis.
            </p>
            <div className="bg-gray-100 rounded-lg p-8 text-center">
              <p className="text-gray-500">Coming Soon</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-purple-100 p-2 rounded-lg">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">AI Predictions</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Get AI-powered predictions for your future spending and saving patterns.
            </p>
            <div className="bg-gray-100 rounded-lg p-8 text-center">
              <p className="text-gray-500">Coming Soon</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-orange-100 p-2 rounded-lg">
                <Target className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">Goal Tracking</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Set and track your financial goals with progress visualization and recommendations.
            </p>
            <div className="bg-gray-100 rounded-lg p-8 text-center">
              <p className="text-gray-500">Coming Soon</p>
            </div>
          </div>
        </div>

        {/* AI Insights Preview */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
          <h3 className="text-lg font-medium text-gray-900 mb-2">🤖 AI Insights Preview</h3>
          <p className="text-gray-700 mb-4">
            Our AI will analyze your spending patterns and provide personalized insights like:
          </p>
          <ul className="space-y-2 text-gray-600">
            <li>• "You spent 20% more on groceries this month compared to last month"</li>
            <li>• "Your dining expenses are trending upward - consider setting a budget"</li>
            <li>• "Based on your patterns, you're likely to save $500 this month"</li>
            <li>• "Most of your spending occurs on weekends - plan accordingly"</li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  );
}