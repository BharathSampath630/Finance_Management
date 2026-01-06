const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  accountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required']
  },
  type: {
    type: String,
    enum: ['income', 'expense', 'transfer'],
    required: [true, 'Transaction type is required']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      // Income categories
      'salary', 'freelance', 'investment', 'gift', 'refund', 'other-income',
      // Expense categories
      'food', 'transportation', 'shopping', 'entertainment', 'bills', 'healthcare',
      'education', 'travel', 'groceries', 'rent', 'utilities', 'insurance',
      'subscriptions', 'other-expense',
      // Transfer
      'transfer'
    ]
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  date: {
    type: Date,
    required: [true, 'Transaction date is required'],
    default: Date.now
  },
  tags: [{
    type: String,
    trim: true
  }],
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringPattern: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly']
    },
    interval: {
      type: Number,
      min: 1
    },
    endDate: Date
  },
  location: {
    type: String,
    trim: true
  },
  attachments: [{
    filename: String,
    url: String,
    uploadDate: { type: Date, default: Date.now }
  }],
  isUrgent: {
    type: Boolean,
    default: false
  },
  balanceAfter: {
    type: Number,
    required: true
  },
  // Banking integration fields
  plaidTransactionId: {
    type: String,
    default: null
  },
  isPlaidSynced: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for better query performance
transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ accountId: 1, date: -1 });
transactionSchema.index({ category: 1, type: 1 });
transactionSchema.index({ date: -1 });

// Virtual for formatted amount
transactionSchema.virtual('formattedAmount').get(function() {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD' // Default to USD, will be dynamic based on account currency later
    }).format(Math.abs(this.amount));
  } catch (error) {
    // Fallback if currency formatting fails
    return `USD ${Math.abs(this.amount).toFixed(2)}`;
  }
});

// Method to determine if transaction is unusual (for AI alerts)
transactionSchema.methods.isUnusual = function(userAverages) {
  const categoryAvg = userAverages[this.category] || 0;
  return Math.abs(this.amount) > (categoryAvg * 2); // 2x average is unusual
};

// Ensure virtual fields are serialized
transactionSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Transaction', transactionSchema);