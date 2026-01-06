const Transaction = require('../models/Transaction');
const Account = require('../models/Account');

class AnalyticsService {
  // Get spending by category
  async getSpendingByCategory(userId, startDate, endDate) {
    try {
      const pipeline = [
        {
          $match: {
            userId: userId,
            type: 'expense',
            date: {
              $gte: new Date(startDate),
              $lte: new Date(endDate)
            }
          }
        },
        {
          $group: {
            _id: '$category',
            total: { $sum: { $abs: '$amount' } },
            count: { $sum: 1 },
            avgAmount: { $avg: { $abs: '$amount' } }
          }
        },
        {
          $sort: { total: -1 }
        }
      ];

      const result = await Transaction.aggregate(pipeline);
      return result;
    } catch (error) {
      console.error('Error getting spending by category:', error);
      throw error;
    }
  }

  // Get income vs expenses over time
  async getIncomeVsExpenses(userId, period = 'month') {
    try {
      let groupBy;
      switch (period) {
        case 'day':
          groupBy = { $dateToString: { format: "%Y-%m-%d", date: "$date" } };
          break;
        case 'week':
          groupBy = { $dateToString: { format: "%Y-W%U", date: "$date" } };
          break;
        case 'month':
        default:
          groupBy = { $dateToString: { format: "%Y-%m", date: "$date" } };
          break;
      }

      const pipeline = [
        {
          $match: { userId: userId }
        },
        {
          $group: {
            _id: {
              period: groupBy,
              type: '$type'
            },
            total: { $sum: { $abs: '$amount' } }
          }
        },
        {
          $group: {
            _id: '$_id.period',
            income: {
              $sum: {
                $cond: [{ $eq: ['$_id.type', 'income'] }, '$total', 0]
              }
            },
            expenses: {
              $sum: {
                $cond: [{ $eq: ['$_id.type', 'expense'] }, '$total', 0]
              }
            }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ];

      const result = await Transaction.aggregate(pipeline);
      return result;
    } catch (error) {
      console.error('Error getting income vs expenses:', error);
      throw error;
    }
  }

  // Get account balance trends
  async getAccountBalanceTrends(userId) {
    try {
      const pipeline = [
        {
          $match: { userId: userId }
        },
        {
          $sort: { date: 1 }
        },
        {
          $group: {
            _id: '$accountId',
            transactions: {
              $push: {
                date: '$date',
                balance: '$balanceAfter',
                amount: '$amount'
              }
            }
          }
        },
        {
          $lookup: {
            from: 'accounts',
            localField: '_id',
            foreignField: '_id',
            as: 'account'
          }
        },
        {
          $unwind: '$account'
        }
      ];

      const result = await Transaction.aggregate(pipeline);
      return result;
    } catch (error) {
      console.error('Error getting balance trends:', error);
      throw error;
    }
  }

  // Generate AI insights
  async generateInsights(userId) {
    try {
      const insights = [];
      const currentMonth = new Date();
      const lastMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
      const currentMonthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);

      // Get current and last month spending
      const currentMonthSpending = await this.getSpendingByCategory(
        userId, 
        currentMonthStart, 
        currentMonth
      );
      
      const lastMonthSpending = await this.getSpendingByCategory(
        userId, 
        lastMonth, 
        currentMonthStart
      );

      // Compare spending patterns
      const currentTotal = currentMonthSpending.reduce((sum, cat) => sum + cat.total, 0);
      const lastTotal = lastMonthSpending.reduce((sum, cat) => sum + cat.total, 0);

      if (currentTotal > lastTotal * 1.2) {
        insights.push({
          type: 'warning',
          title: 'Increased Spending Alert',
          message: `Your spending is ${Math.round(((currentTotal - lastTotal) / lastTotal) * 100)}% higher than last month`,
          category: 'spending'
        });
      }

      // Find top spending category
      if (currentMonthSpending.length > 0) {
        const topCategory = currentMonthSpending[0];
        insights.push({
          type: 'info',
          title: 'Top Spending Category',
          message: `You spent most on ${topCategory._id.replace('-', ' ')} this month: $${topCategory.total.toFixed(2)}`,
          category: 'analysis'
        });
      }

      // Weekend spending analysis
      const weekendSpending = await Transaction.aggregate([
        {
          $match: {
            userId: userId,
            type: 'expense',
            date: {
              $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
            }
          }
        },
        {
          $addFields: {
            dayOfWeek: { $dayOfWeek: '$date' }
          }
        },
        {
          $group: {
            _id: {
              $cond: [
                { $or: [{ $eq: ['$dayOfWeek', 1] }, { $eq: ['$dayOfWeek', 7] }] },
                'weekend',
                'weekday'
              ]
            },
            total: { $sum: { $abs: '$amount' } }
          }
        }
      ]);

      const weekendTotal = weekendSpending.find(w => w._id === 'weekend')?.total || 0;
      const weekdayTotal = weekendSpending.find(w => w._id === 'weekday')?.total || 0;

      if (weekendTotal > weekdayTotal * 0.4) { // Weekend spending > 40% of weekday
        insights.push({
          type: 'tip',
          title: 'Weekend Spending Pattern',
          message: 'Most of your spending occurs on weekends. Consider planning weekend budgets.',
          category: 'behavior'
        });
      }

      return insights;
    } catch (error) {
      console.error('Error generating insights:', error);
      throw error;
    }
  }

  // Predict next month spending
  async predictSpending(userId) {
    try {
      // Get last 3 months of data
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      const monthlySpending = await Transaction.aggregate([
        {
          $match: {
            userId: userId,
            type: 'expense',
            date: { $gte: threeMonthsAgo }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$date' },
              month: { $month: '$date' },
              category: '$category'
            },
            total: { $sum: { $abs: '$amount' } }
          }
        },
        {
          $group: {
            _id: '$_id.category',
            monthlyAmounts: { $push: '$total' },
            avgMonthly: { $avg: '$total' }
          }
        }
      ]);

      const predictions = monthlySpending.map(category => ({
        category: category._id,
        predictedAmount: Math.round(category.avgMonthly * 1.05), // 5% inflation factor
        confidence: category.monthlyAmounts.length >= 2 ? 'high' : 'low'
      }));

      return predictions;
    } catch (error) {
      console.error('Error predicting spending:', error);
      throw error;
    }
  }
}

module.exports = new AnalyticsService();