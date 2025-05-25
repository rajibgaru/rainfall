'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import DepositFlow from '@/components/DepositFlow';
import { RefreshCw, DollarSign, Clock, CheckCircle, XCircle, AlertTriangle, TrendingUp } from 'lucide-react';

// Types
interface DepositResult {
  success: boolean;
  transferId?: string;
  status?: string;
  reference?: string;
  message?: string;
  sandbox?: boolean;
  estimatedCompletion?: string;
  error?: string;
}

interface WalletData {
  wallet: {
    totalBalance: number;
    availableBalance: number;
    frozenAmount: number;
  };
  recentTransactions: any[];
}

interface TestResult {
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  timestamp: string;
  details?: any;
}

export default function TestACHPage() {
  const { data: session, status } = useSession();
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch wallet data on component mount
  useEffect(() => {
    if (session) {
      fetchWalletData();
    }
  }, [session]);

  const fetchWalletData = async () => {
    if (!session) return;
    
    setRefreshing(true);
    try {
      addTestResult('info', '💼 Fetching wallet data...');
      
      const response = await fetch('/api/user/wallet');
      const data = await response.json();
      
      if (response.ok) {
        setWalletData(data.data);
        addTestResult('success', `✅ Wallet loaded - Balance: $${data.data.wallet.totalBalance.toLocaleString()}`);
      } else {
        throw new Error(data.error || 'Failed to fetch wallet');
      }
    } catch (error: any) {
      addTestResult('error', `❌ Error fetching wallet: ${error.message}`, error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleDepositSuccess = (result: DepositResult) => {
    addTestResult('success', `🎉 Deposit initiated successfully!`, result);
    
    if (result.sandbox) {
      addTestResult('info', '🧪 Sandbox mode: Simulating completion in 5 seconds...');
      
      // Refresh wallet data after simulated completion
      setTimeout(() => {
        fetchWalletData();
        addTestResult('success', '✅ Sandbox deposit completed automatically');
      }, 6000);
    } else {
      addTestResult('info', '⏳ Real ACH transfer initiated - will complete in 1-3 business days');
    }
  };

  const addTestResult = (type: TestResult['type'], message: string, details?: any) => {
    const newResult: TestResult = {
      type,
      message,
      timestamp: new Date().toLocaleTimeString(),
      details
    };
    
    setTestResults(prev => [newResult, ...prev].slice(0, 20));
  };

  const clearResults = () => {
    setTestResults([]);
    addTestResult('info', '🧹 Test results cleared');
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getResultIcon = (type: TestResult['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle size={16} className="text-green-600" />;
      case 'error':
        return <XCircle size={16} className="text-red-600" />;
      case 'warning':
        return <AlertTriangle size={16} className="text-yellow-600" />;
      case 'info':
        return <Clock size={16} className="text-blue-600" />;
      default:
        return <Clock size={16} className="text-gray-600" />;
    }
  };

  const getResultBgColor = (type: TestResult['type']) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-4 text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }

  // Show sign-in prompt if not authenticated
  if (!session) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center">
            <AlertTriangle size={24} className="text-yellow-600 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-yellow-800">Authentication Required</h3>
              <p className="text-yellow-700 mt-1">Please sign in to test ACH deposits</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">🏦 ACH Transfer Test Suite</h1>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-green-900 mb-2">🧪 Testing ACH Deposits:</h3>
          <ol className="text-green-800 text-sm space-y-1 list-decimal list-inside">
            <li>Make sure you have a bank account linked (from the Plaid test)</li>
            <li>Use the deposit flow below to initiate an ACH transfer</li>
            <li>In sandbox mode, the transfer will complete automatically in 5 seconds</li>
            <li>Watch your wallet balance update in real-time</li>
            <li>Check the transaction log for detailed activity</li>
          </ol>
          <div className="mt-3 p-2 bg-green-100 rounded text-xs text-green-700">
            <strong>Environment:</strong> {process.env.NEXT_PUBLIC_PLAID_ENV || 'sandbox'} | 
            <strong> User:</strong> {session.user?.email}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Left Column: Deposit Flow */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center">
              <TrendingUp size={20} className="mr-2 text-green-600" />
              ACH Deposit Flow
            </h2>
            
            <DepositFlow onSuccess={handleDepositSuccess} />
          </div>
        </div>

        {/* Right Column: Wallet Status & Results */}
        <div className="space-y-6">
          {/* Current Wallet Status */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center">
                <DollarSign size={20} className="mr-2 text-blue-600" />
                Wallet Status
              </h2>
              <button
                onClick={fetchWalletData}
                disabled={refreshing}
                className="flex items-center px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 transition-colors"
              >
                <RefreshCw size={14} className={`mr-1 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
            
            {walletData ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {formatCurrency(walletData.wallet.totalBalance)}
                    </div>
                    <div className="text-sm text-blue-600">Total</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(walletData.wallet.availableBalance)}
                    </div>
                    <div className="text-sm text-green-600">Available</div>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {formatCurrency(walletData.wallet.frozenAmount)}
                    </div>
                    <div className="text-sm text-orange-600">Frozen</div>
                  </div>
                </div>
                
                {/* Recent Transactions */}
                {walletData.recentTransactions.length > 0 && (
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Recent Transactions</h4>
                    <div className="space-y-2">
                      {walletData.recentTransactions.slice(0, 3).map((tx, index) => (
                        <div key={index} className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">{tx.description}</span>
                          <span className={`font-medium ${
                            tx.type === 'DEPOSIT' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {tx.type === 'DEPOSIT' ? '+' : '-'}{formatCurrency(tx.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <div className="animate-pulse">Loading wallet data...</div>
              </div>
            )}
          </div>

          {/* Test Results */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Test Results ({testResults.length})</h2>
              <button
                onClick={clearResults}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Clear All
              </button>
            </div>
            
            {testResults.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-2">
                  <Clock size={48} className="mx-auto opacity-50" />
                </div>
                <p className="text-gray-500">No test results yet</p>
                <p className="text-gray-400 text-sm mt-1">Start a deposit to see test results</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {testResults.map((result, index) => (
                  <div 
                    key={index} 
                    className={`p-3 rounded-lg border text-sm ${getResultBgColor(result.type)}`}
                  >
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mr-2 mt-0.5">
                        {getResultIcon(result.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{result.message}</span>
                          <span className="text-xs opacity-70">{result.timestamp}</span>
                        </div>
                        {result.details && (
                          <details className="mt-2">
                            <summary className="cursor-pointer text-xs opacity-80 hover:opacity-100">
                              View Details
                            </summary>
                            <pre className="mt-1 text-xs bg-black bg-opacity-10 p-2 rounded overflow-x-auto">
                              {JSON.stringify(result.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}