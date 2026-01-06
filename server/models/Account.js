const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Account name is required'],
    trim: true,
    maxlength: [50, 'Account name cannot exceed 50 characters']
  },
  type: {
    type: String,
    enum: ['checking', 'savings', 'credit', 'investment', 'cash'],
    required: [true, 'Account type is required']
  },
  balance: {
    type: Number,
    required: [true, 'Initial balance is required'],
    default: 0
  },
  currency: {
    type: String,
    required: [true, 'Currency is required'],
    default: 'USD',
    uppercase: true
  },
  description: {
    type: String,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  color: {
    type: String,
    default: '#3B82F6' // Default blue color
  },
  icon: {
    type: String,
    default: 'wallet'
  },
  // Banking integration fields
  plaidAccountId: {
    type: String,
    default: null
  },
  plaidAccessToken: {
    type: String,
    default: null
  },
  plaidItemId: {
    type: String,
    default: null
  },
  isPlaidLinked: {
    type: Boolean,
    default: false
  },
  lastSyncDate: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index for faster queries
accountSchema.index({ userId: 1, isActive: 1 });

// Virtual for formatted balance
accountSchema.virtual('formattedBalance').get(function() {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: this.currency || 'USD'
    }).format(this.balance);
  } catch (error) {
    // Fallback if currency formatting fails
    return `${this.currency || 'USD'} ${this.balance.toFixed(2)}`;
  }
});

// Ensure virtual fields are serialized
accountSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Account', accountSchema);