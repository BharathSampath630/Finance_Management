class CategorizationService {
  constructor() {
    // Smart categorization rules based on description keywords
    this.categoryRules = {
      'groceries': [
        'walmart', 'target', 'kroger', 'safeway', 'whole foods', 'trader joe',
        'costco', 'sam\'s club', 'grocery', 'supermarket', 'food mart'
      ],
      'food': [
        'restaurant', 'mcdonald', 'burger king', 'subway', 'pizza', 'starbucks',
        'dunkin', 'cafe', 'diner', 'bistro', 'grill', 'kitchen', 'taco bell',
        'kfc', 'domino', 'papa john', 'chipotle'
      ],
      'transportation': [
        'uber', 'lyft', 'taxi', 'gas station', 'shell', 'exxon', 'chevron',
        'bp', 'mobil', 'parking', 'metro', 'bus', 'train', 'airline'
      ],
      'shopping': [
        'amazon', 'ebay', 'best buy', 'apple store', 'nike', 'adidas',
        'clothing', 'mall', 'department store', 'retail'
      ],
      'entertainment': [
        'netflix', 'spotify', 'hulu', 'disney', 'movie', 'theater', 'cinema',
        'concert', 'game', 'steam', 'playstation', 'xbox'
      ],
      'bills': [
        'electric', 'electricity', 'water', 'sewer', 'internet', 'phone',
        'cable', 'insurance', 'mortgage', 'rent'
      ],
      'healthcare': [
        'hospital', 'clinic', 'doctor', 'pharmacy', 'cvs', 'walgreens',
        'medical', 'dental', 'vision'
      ],
      'utilities': [
        'pge', 'edison', 'water dept', 'waste management', 'comcast',
        'verizon', 'at&t', 'spectrum'
      ],
      'subscriptions': [
        'subscription', 'monthly', 'annual', 'premium', 'pro', 'plus'
      ],
      'salary': [
        'payroll', 'salary', 'wages', 'direct deposit', 'employer'
      ],
      'investment': [
        'dividend', 'interest', 'capital gains', 'stock', 'bond', 'mutual fund'
      ]
    };
  }

  // Automatically categorize transaction based on description
  categorizeTransaction(description, amount) {
    const desc = description.toLowerCase();
    const type = amount < 0 ? 'expense' : 'income';
    
    // Check each category for keyword matches
    for (const [category, keywords] of Object.entries(this.categoryRules)) {
      for (const keyword of keywords) {
        if (desc.includes(keyword)) {
          return {
            category: category,
            confidence: this.calculateConfidence(desc, keyword),
            type: type
          };
        }
      }
    }
    
    // Default categories
    return {
      category: type === 'expense' ? 'other-expense' : 'other-income',
      confidence: 0.1,
      type: type
    };
  }

  // Calculate confidence score for categorization
  calculateConfidence(description, matchedKeyword) {
    const descWords = description.split(' ');
    const keywordWords = matchedKeyword.split(' ');
    
    // Exact match gets higher confidence
    if (description.includes(matchedKeyword)) {
      return 0.9;
    }
    
    // Partial match gets medium confidence
    const matchCount = keywordWords.filter(word => 
      descWords.some(descWord => descWord.includes(word))
    ).length;
    
    return Math.min(0.8, (matchCount / keywordWords.length) * 0.8);
  }

  // Get category suggestions for a description
  getSuggestions(description, limit = 3) {
    const suggestions = [];
    const desc = description.toLowerCase();
    
    for (const [category, keywords] of Object.entries(this.categoryRules)) {
      for (const keyword of keywords) {
        if (desc.includes(keyword)) {
          suggestions.push({
            category: category,
            confidence: this.calculateConfidence(desc, keyword),
            reason: `Matched keyword: "${keyword}"`
          });
        }
      }
    }
    
    // Sort by confidence and return top suggestions
    return suggestions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, limit);
  }

  // Learn from user corrections to improve categorization
  learnFromCorrection(description, originalCategory, correctedCategory) {
    // In a real implementation, this would update ML models
    // For now, we'll just log the correction
    console.log(`Learning: "${description}" should be "${correctedCategory}" not "${originalCategory}"`);
    
    // You could store these corrections in a database and use them
    // to improve future categorizations
  }

  // Get spending insights
  getSpendingInsights(transactions) {
    const insights = [];
    const categoryTotals = {};
    const monthlyTotals = {};
    
    // Calculate category totals
    transactions.forEach(tx => {
      if (tx.type === 'expense') {
        categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + Math.abs(tx.amount);
        
        const month = new Date(tx.date).toISOString().slice(0, 7);
        monthlyTotals[month] = (monthlyTotals[month] || 0) + Math.abs(tx.amount);
      }
    });
    
    // Find top spending category
    const topCategory = Object.entries(categoryTotals)
      .sort(([,a], [,b]) => b - a)[0];
    
    if (topCategory) {
      insights.push({
        type: 'info',
        message: `Your highest spending category is ${topCategory[0].replace('-', ' ')} at $${topCategory[1].toFixed(2)}`
      });
    }
    
    // Check for unusual spending patterns
    const months = Object.keys(monthlyTotals).sort();
    if (months.length >= 2) {
      const currentMonth = monthlyTotals[months[months.length - 1]];
      const previousMonth = monthlyTotals[months[months.length - 2]];
      
      if (currentMonth > previousMonth * 1.2) {
        insights.push({
          type: 'warning',
          message: `Your spending increased by ${Math.round(((currentMonth - previousMonth) / previousMonth) * 100)}% this month`
        });
      }
    }
    
    return insights;
  }
}

module.exports = new CategorizationService();