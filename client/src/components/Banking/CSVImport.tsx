'use client';

import { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';

interface CSVImportProps {
  onImportComplete: (transactions: any[]) => void;
}

export default function CSVImport({ onImportComplete }: CSVImportProps) {
  const [dragActive, setDragActive] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    count: number;
    errors: string[];
  } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      alert('Please select a CSV file');
      return;
    }

    setImporting(true);
    setImportResult(null);

    try {
      const text = await file.text();
      const transactions = parseCSV(text);
      
      if (transactions.length > 0) {
        // Send to backend
        const response = await fetch('/api/transactions/import-csv', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ transactions })
        });

        if (response.ok) {
          const result = await response.json();
          setImportResult({
            success: true,
            count: result.imported,
            errors: result.errors || []
          });
          onImportComplete(result.transactions);
        } else {
          throw new Error('Import failed');
        }
      }
    } catch (error) {
      setImportResult({
        success: false,
        count: 0,
        errors: ['Failed to process CSV file']
      });
    } finally {
      setImporting(false);
    }
  };

  const parseCSV = (text: string) => {
    const lines = text.split('\n');
    const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
    
    // Expected headers: date, description, amount, category (optional)
    const dateIndex = headers.findIndex(h => h.includes('date'));
    const descIndex = headers.findIndex(h => h.includes('description') || h.includes('desc'));
    const amountIndex = headers.findIndex(h => h.includes('amount') || h.includes('value'));
    const categoryIndex = headers.findIndex(h => h.includes('category'));

    if (dateIndex === -1 || descIndex === -1 || amountIndex === -1) {
      throw new Error('CSV must contain Date, Description, and Amount columns');
    }

    const transactions = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      
      if (values.length < 3) continue;
      
      const amount = parseFloat(values[amountIndex]);
      if (isNaN(amount)) continue;

      transactions.push({
        date: values[dateIndex],
        description: values[descIndex],
        amount: Math.abs(amount),
        type: amount < 0 ? 'expense' : 'income',
        category: categoryIndex !== -1 ? values[categoryIndex] : (amount < 0 ? 'other-expense' : 'other-income')
      });
    }

    return transactions;
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Import from CSV</h3>
      
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileInput}
          className="hidden"
        />
        
        {importing ? (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Processing CSV file...</p>
          </div>
        ) : (
          <div>
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">
              Drop your CSV file here
            </p>
            <p className="text-gray-600 mb-4">
              or click to browse files
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <FileText className="h-4 w-4 mr-2" />
              Choose File
            </button>
          </div>
        )}
      </div>

      {/* CSV Format Guide */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">CSV Format Requirements:</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• <strong>Date</strong>: YYYY-MM-DD or MM/DD/YYYY format</li>
          <li>• <strong>Description</strong>: Transaction description</li>
          <li>• <strong>Amount</strong>: Positive for income, negative for expenses</li>
          <li>• <strong>Category</strong>: Optional transaction category</li>
        </ul>
        <div className="mt-3 text-xs text-gray-500">
          <p><strong>Example:</strong></p>
          <code className="bg-white p-2 rounded text-xs block mt-1">
            Date,Description,Amount,Category<br/>
            2024-01-15,Grocery Store,-85.50,groceries<br/>
            2024-01-16,Salary,2500.00,salary
          </code>
        </div>
      </div>

      {/* Import Results */}
      {importResult && (
        <div className={`mt-4 p-4 rounded-lg ${
          importResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-center space-x-2">
            {importResult.success ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-500" />
            )}
            <p className={`font-medium ${
              importResult.success ? 'text-green-800' : 'text-red-800'
            }`}>
              {importResult.success 
                ? `Successfully imported ${importResult.count} transactions`
                : 'Import failed'
              }
            </p>
          </div>
          {importResult.errors.length > 0 && (
            <ul className="mt-2 text-sm text-red-600">
              {importResult.errors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Popular Bank Export Instructions */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">🏦 Export from Your Bank:</h4>
        <div className="text-sm text-blue-800 space-y-1">
          <p><strong>Chase:</strong> Account Activity → Download → CSV</p>
          <p><strong>Bank of America:</strong> Download Transactions → CSV</p>
          <p><strong>Wells Fargo:</strong> Account Activity → Download → CSV</p>
          <p><strong>Capital One:</strong> Transaction History → Download</p>
        </div>
      </div>
    </div>
  );
}