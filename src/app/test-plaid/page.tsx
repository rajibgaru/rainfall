'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import BankLinkButton from '@/components/BankLinkButton';
import { RefreshCw, CheckCircle, XCircle, Clock, AlertTriangle, Database } from 'lucide-react';

// Types
interface BankAccount {
  id: string;
  accountId: string;
  accountName: string;
  accountType: string;
  accountSubtype?: string;
  mask: string;
  createdAt: string;
}

interface TestResult {
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  timestamp: string;
  details?: any;
}

interface LinkSuccess {
  accounts: number;
  message: string;
}

export default function TestPlaidPage() {
  const { data: session, status } = useSession();
  const [linkedAccounts, setLinkedAccounts] = useState<BankAccount[]>([]);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingAccounts, setFetchingAccounts] = useState(false);

  // Fetch linked accounts on component mount
  useEffect(() => {
    if (session) {
      fetchLinkedAccounts();
    }
  }, [session]);

  const handleBankLinked = (data: LinkSuccess) => {
    addTestResult('success', `✅ Successfully linked ${data.accounts} account(s)`, data);
    
    // Refresh linked accounts after successful linking
    setTimeout(() => {
      fetchLinkedAccounts();
    }, 1000);
  };

  const fetchLinkedAccounts = async () => {
    if (!session) return;
    
    setFetchingAccounts(true);
    try {
      addTestResult('info', '🔍 Fetching linked bank accounts...');
      
      const response = await fetch('/api/user/bank-accounts');
      const data = await response.json();
      
      if (response.ok) {
        setLinkedAccounts(data.accounts || []);
        addTestResult('success', `📊 Found ${data.accounts?.length || 0} linked account(s)`);
      } else {
        throw new Error(data.error || 'Failed to fetch accounts');
      }
    } catch (error: any) {
      addTestResult('error', `❌ Error fetching accounts: ${error.message}`, error);
      console.error('Error fetching accounts:', error);
    } finally {
      setFetchingAccounts(false);
    }
  };

  const addTestResult = (type: TestResult['type'], message: string, details?: any) => {
    const newResult: TestResult = {
      type,
      message,
      timestamp: new Date().toLocaleTimeString(),
      details
    };
    
    setTestResults(prev => [newResult, ...prev].slice(0, 50)); // Keep last 50 results
    console.log(`[${type.toUpperCase()}]`, message, details);
  };

  const clearResults = () => {
    setTestResults([]);
    addTestResult('info', '🧹 Test results cleared');
  };

  const testDatabaseConnection = async () => {
    setLoading(true);
    addTestResult('info', '🔌 Testing database connection...');
    
    try {
      const response = await fetch('/api/test/database');
      const data = await response.json();
      
      if (response.ok) {
        addTestResult('success', '✅ Database connection successful', data);
      } else {
        addTestResult('error', '❌ Database connection failed', data);
      }
    } catch (error: any) {
      addTestResult('error', '❌ Database test error', error);
    } finally {
      setLoading(false);
    }
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
              <p className="text-yellow-700 mt-1">Please sign in to test Plaid integration</p>
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
        <h1 className="text-3xl font-bold mb-4">🧪 Plaid Integration Test Suite</h1>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">📋 Sandbox Test Instructions:</h3>
          <ol className="text-blue-800 text-sm space-y-1 list-decimal list-inside">
            <li>Click "Link Bank Account" below</li>
            <li>Choose any bank (try "Chase", "Wells Fargo", or "Bank of America")</li>
            <li>Use username: <code className="bg-blue-100 px-1 rounded">user_good</code>, password: <code className="bg-blue-100 px-1 rounded">pass_good</code></li>
            <li>Select checking or savings accounts (can select multiple)</li>
            <li>Complete the flow and watch the test results</li>
          </ol>
          <div className="mt-3 p-2 bg-blue-100 rounded text-xs text-blue-700">
            <strong>Environment:</strong> {process.env.NEXT_PUBLIC_PLAID_ENV || 'sandbox'} | 
            <strong> User:</strong> {session.user?.email}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Test Actions - Left Column */}
        <div className="xl:col-span-1 space-y-6">
          {/* Link Account Section */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Database size={20} className="mr-2 text-blue-600" />
              Link Bank Account
            </h2>
            <BankLinkButton 
              onSuccess={handleBankLinked} 
              className="w-full mb-4"
            />
            
            {/* Test Actions */}
            <div className="space-y-2 pt-4 border-t">
              <button
                onClick={fetchLinkedAccounts}
                disabled={fetchingAccounts || !session}
                className="w-full flex items-center justify-center px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
              >
                <RefreshCw size={14} className={`mr-2 ${fetchingAccounts ? 'animate-spin' : ''}`} />
                {fetchingAccounts ? 'Refreshing...' : 'Refresh Accounts'}
              </button>
              
              <button
                onClick={testDatabaseConnection}
                disabled={loading}
                className="w-full flex items-center justify-center px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
              >
                <Database size={14} className="mr-2" />
                {loading ? 'Testing...' : 'Test Database'}
              </button>
              
              <button
                onClick={clearResults}
                className="w-full flex items-center justify-center px-4 py-2 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
              >
                Clear Results
              </button>
            </div>
          </div>

          {/* Environment Info */}
          <div className="bg-gray-50 rounded-lg p-4 text-sm">
            <h3 className="font-semibold text-gray-800 mb-2">Environment Info</h3>
            <div className="space-y-1 text-gray-600">
              <div><strong>Plaid Environment:</strong> {process.env.NEXT_PUBLIC_PLAID_ENV || 'sandbox'}</div>
              <div><strong>User ID:</strong> {session.user?.id?.substring(0, 8)}...</div>
              <div><strong>Session:</strong> Active</div>
            </div>
          </div>
        </div>

        {/* Results - Right Columns */}
        <div className="xl:col-span-2 space-y-6">
          {/* Linked Accounts */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center">
                <CheckCircle size={20} className="mr-2 text-green-600" />
                Linked Accounts ({linkedAccounts.length})
              </h2>
              {fetchingAccounts && (
                <RefreshCw size={16} className="animate-spin text-gray-400" />
              )}
            </div>
            
            {linkedAccounts.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-2">
                  <Database size={48} className="mx-auto opacity-50" />
                </div>
                <p className="text-gray-500">No accounts linked yet</p>
                <p className="text-gray-400 text-sm mt-1">Link a bank account to see it here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {linkedAccounts.map((account) => (
                  <div key={account.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">{account.accountName}</div>
                        <div className="text-sm text-gray-600">
                          {account.accountType}
                          {account.accountSubtype && ` • ${account.accountSubtype}`}
                          <span className="ml-2 font-mono">****{account.mask}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Linked: {new Date(account.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <div className="text-green-600">
                        <CheckCircle size={20} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Test Results Log */}
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
                <p className="text-gray-400 text-sm mt-1">Test results will appear here as you interact with the system</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
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