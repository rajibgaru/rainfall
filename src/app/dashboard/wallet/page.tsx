'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  Wallet, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Plus,
  Eye,
  EyeOff
} from 'lucide-react';
import DepositFlow from '@/components/DepositFlow';

export default function WalletDashboard() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [walletData, setWalletData] = useState<any>(null);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawDescription, setWithdrawDescription] = useState('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [showBalance, setShowBalance] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Add bank account state
  const [linkedBankAccounts, setLinkedBankAccounts] = useState([]);
  const [selectedBankAccount, setSelectedBankAccount] = useState(null);

  // Fetch wallet data
  const fetchWalletData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/user/wallet');
      if (!response.ok) {
        throw new Error('Failed to fetch wallet data');
      }
      
      const data = await response.json();
      setWalletData(data.data);
    } catch (err: any) {
      console.error('Error fetching wallet:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Add function to fetch bank accounts
  const fetchLinkedAccounts = async () => {
    try {
      const response = await fetch('/api/user/bank-accounts');
      const data = await response.json();
      
      if (response.ok) {
        setLinkedBankAccounts(data.accounts || []);
        if (data.accounts?.length > 0) {
          setSelectedBankAccount(data.accounts[0]); // Default to first account
        }
      }
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
    }
  };

  // Update useEffect to fetch bank accounts
  useEffect(() => {
    fetchWalletData();
    fetchLinkedAccounts();
  }, []);

  // Updated withdrawal handler
  const handleWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedBankAccount) {
      setError('Please select a bank account for withdrawal');
      return;
    }
    
    setWithdrawLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/user/wallet/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(withdrawAmount),
          description: withdrawDescription || 'Withdrawal request',
          bankAccountId: selectedBankAccount.id
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to process withdrawal');
      }

      if (data.sandbox) {
        setSuccess(`Withdrawal initiated successfully! Your funds will be processed automatically in sandbox mode. Reference: ${data.reference}`);
      } else {
        setSuccess(`Withdrawal initiated successfully! Your funds will arrive in your bank account within 1-3 business days. Reference: ${data.reference}`);
      }
      
      setShowWithdrawModal(false);
      setWithdrawAmount('');
      setWithdrawDescription('');
      setSelectedBankAccount(linkedBankAccounts[0] || null);
      
      // Refresh wallet data
      await fetchWalletData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setWithdrawLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  // Format date
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  // Get transaction status badge
  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    
    switch (status) {
      case 'COMPLETED':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'PENDING':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'FAILED':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'CANCELLED':
        return `${baseClasses} bg-gray-100 text-gray-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  // Get transaction icon
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'DEPOSIT':
        return <ArrowDownLeft size={16} className="text-green-600" />;
      case 'WITHDRAWAL':
        return <ArrowUpRight size={16} className="text-red-600" />;
      case 'PURCHASE':
        return <DollarSign size={16} className="text-blue-600" />;
      case 'REFUND':
        return <ArrowDownLeft size={16} className="text-blue-600" />;
      default:
        return <Clock size={16} className="text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Escrow Wallet</h1>
        </div>
        
        {/* Loading skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Escrow Wallet</h1>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowDepositModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus size={16} />
            <span>Add Funds</span>
          </button>
          <button
            onClick={() => setShowWithdrawModal(true)}
            disabled={!walletData?.wallet?.availableBalance || walletData.wallet.availableBalance < 100}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowUpRight size={16} />
            <span>Withdraw</span>
          </button>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <div className="flex items-center">
            <AlertCircle size={20} className="mr-2" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          <div className="flex items-center">
            <CheckCircle size={20} className="mr-2" />
            <span>{success}</span>
          </div>
        </div>
      )}

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Balance</p>
              <p className="text-2xl font-bold">
                {showBalance ? formatCurrency(walletData?.wallet?.totalBalance) : '••••••'}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full text-blue-600 relative">
              <Wallet size={24} />
              <button
                onClick={() => setShowBalance(!showBalance)}
                className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full shadow-sm flex items-center justify-center text-gray-400 hover:text-gray-600"
              >
                {showBalance ? <Eye size={10} /> : <EyeOff size={10} />}
              </button>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Available</p>
              <p className="text-2xl font-bold text-green-600">
                {showBalance ? formatCurrency(walletData?.wallet?.availableBalance) : '••••••'}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full text-green-600">
              <DollarSign size={24} />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Frozen</p>
              <p className="text-2xl font-bold text-orange-600">
                {showBalance ? formatCurrency(walletData?.wallet?.frozenAmount) : '••••••'}
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full text-orange-600">
              <Clock size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Deposit Instructions */}
      <div className="bg-gradient-to-br from-blue-50 to-green-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-blue-100 rounded-full text-blue-600">
            <Plus size={24} />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 mb-2">Quick & Easy Deposits</h3>
            <p className="text-blue-800 mb-4">
              Add funds to your escrow account in just a few clicks with our automated ACH deposit system.
            </p>
            
            <div className="bg-white bg-opacity-70 rounded-lg p-4 mb-4">
              <div className="flex items-center mb-2">
                <ArrowDownLeft size={20} className="text-green-600 mr-3" />
                <span className="font-medium text-green-800 text-lg">ACH Transfer</span>
              </div>
              <div className="text-green-700 ml-8">
                • <strong>Free of charge</strong> - No transfer fees<br />
                • <strong>Fast processing</strong> - 1-3 business days<br />
                • <strong>Secure</strong> - Directly from your linked bank account<br />
                • <strong>Easy</strong> - Complete the process in under 2 minutes
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button 
                onClick={() => setShowDepositModal(true)}
                className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                <Plus size={18} className="mr-2" />
                Start ACH Deposit
              </button>
              <a 
                href="mailto:support@bargainauctions.com" 
                className="inline-flex items-center px-4 py-3 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors"
              >
                Need Help?
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">Recent Transactions</h2>
        </div>
        
        <div className="p-6">
          {!walletData?.recentTransactions?.length ? (
            <div className="text-center py-8">
              <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Wallet size={24} className="text-gray-400" />
              </div>
              <p className="text-gray-500 mb-2">No transactions yet</p>
              <p className="text-sm text-gray-400">Your transaction history will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {walletData.recentTransactions.map((tx: any) => (
                <div key={tx.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-gray-100 rounded-full">
                      {getTransactionIcon(tx.type)}
                    </div>
                    <div>
                      <p className="font-medium">{tx.description}</p>
                      <p className="text-sm text-gray-500">
                        {formatDate(tx.createdAt)}
                        {tx.reference && ` • Ref: ${tx.reference}`}
                      </p>
                      {tx.auction && (
                        <p className="text-xs text-blue-600 mt-1">
                          Auction: {tx.auction.title}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${
                      tx.type === 'DEPOSIT' || tx.type === 'REFUND' 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {tx.type === 'DEPOSIT' || tx.type === 'REFUND' ? '+' : '-'}
                      {formatCurrency(tx.amount)}
                    </p>
                    <span className={getStatusBadge(tx.status)}>
                      {tx.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Withdrawal Modal with Bank Account Selection */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold">Withdraw Funds</h3>
            </div>
            
            <form onSubmit={handleWithdrawal} className="p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-4">
                  Available Balance: <strong>{formatCurrency(walletData?.wallet?.availableBalance)}</strong>
                </p>
                
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Withdrawal Amount
                </label>
                <input
                  type="number"
                  min="100"
                  max={walletData?.wallet?.availableBalance}
                  step="1"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Minimum $100"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Minimum: $100 • Maximum: $50,000 per transaction
                </p>
              </div>

              {/* Bank Account Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Withdraw to Bank Account
                </label>
                {linkedBankAccounts.length === 0 ? (
                  <div className="p-3 border border-red-200 bg-red-50 rounded-lg">
                    <p className="text-red-700 text-sm">
                      No bank accounts linked. Please link a bank account first.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {linkedBankAccounts.map((account: any) => (
                      <label
                        key={account.id}
                        className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedBankAccount?.id === account.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="bankAccount"
                          value={account.id}
                          checked={selectedBankAccount?.id === account.id}
                          onChange={() => setSelectedBankAccount(account)}
                          className="mr-3"
                        />
                        <div className="flex-1">
                          <div className="font-medium">{account.accountName}</div>
                          <div className="text-sm text-gray-600">
                            {account.accountType} • ****{account.mask}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason (Optional)
                </label>
                <textarea
                  value={withdrawDescription}
                  onChange={(e) => setWithdrawDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="e.g., Transfer to personal account"
                />
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
                <p className="text-sm text-blue-800">
                  <strong>Processing:</strong> Withdrawals are processed automatically via ACH transfer. 
                  Funds typically arrive within 1-3 business days.
                </p>
              </div>
              
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowWithdrawModal(false);
                    setError(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    withdrawLoading || 
                    !withdrawAmount || 
                    parseFloat(withdrawAmount) < 100 || 
                    !selectedBankAccount ||
                    linkedBankAccounts.length === 0
                  }
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {withdrawLoading ? 'Processing...' : 'Withdraw Funds'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Add Funds to Escrow</h3>
                <button
                  onClick={() => setShowDepositModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle size={24} />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <DepositFlow
                onSuccess={(result) => {
                  setSuccess(`Deposit initiated successfully! Reference: ${result.reference}`);
                  setShowDepositModal(false); // Close the modal immediately
                  // Refresh wallet data after a short delay
                  setTimeout(() => {
                    fetchWalletData();
                  }, 2000);
                }}
                onCancel={() => setShowDepositModal(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}