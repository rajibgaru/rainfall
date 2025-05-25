'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  Building2, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  ArrowRight,
  Loader2,
  CreditCard,
  Banknote
} from 'lucide-react';
import BankLinkButton from './BankLinkButton';

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

type DepositStep = 'amount' | 'account' | 'confirm' | 'processing' | 'success' | 'error';

interface DepositFlowProps {
  onSuccess?: (result: DepositResult) => void;
  onCancel?: () => void;
  initialAmount?: number;
}

export default function DepositFlow({ onSuccess, onCancel, initialAmount = 0 }: DepositFlowProps) {
  const { data: session } = useSession();
  const [step, setStep] = useState<DepositStep>('amount');
  const [amount, setAmount] = useState<string>(initialAmount > 0 ? initialAmount.toString() : '');
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);
  const [linkedAccounts, setLinkedAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [result, setResult] = useState<DepositResult | null>(null);

  // Fetch linked accounts on component mount
  useEffect(() => {
    if (session) {
      fetchLinkedAccounts();
    }
  }, [session]);

  const fetchLinkedAccounts = async () => {
    try {
      const response = await fetch('/api/user/bank-accounts');
      const data = await response.json();
      
      if (response.ok) {
        setLinkedAccounts(data.accounts || []);
        // If user has accounts, skip to account selection
        if (data.accounts?.length > 0 && step === 'amount') {
          // Keep on amount step, but accounts are ready
        }
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  };

  const handleBankLinked = () => {
    fetchLinkedAccounts();
  };

  const validateAmount = (): boolean => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount');
      return false;
    }
    if (numAmount < 100) {
      setError('Minimum deposit amount is $100');
      return false;
    }
    if (numAmount > 50000) {
      setError('Maximum deposit amount is $50,000');
      return false;
    }
    setError('');
    return true;
  };

  const handleAmountNext = () => {
    if (validateAmount()) {
      setStep('account');
    }
  };

  const handleAccountSelect = (account: BankAccount) => {
    setSelectedAccount(account);
    setStep('confirm');
  };

  const initiateDeposit = async () => {
    if (!selectedAccount) return;

    setLoading(true);
    setError('');
    setStep('processing');

    try {
      const response = await fetch('/api/user/wallet/deposit-ach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(amount),
          accountId: selectedAccount.id,
        }),
      });

      const data: DepositResult = await response.json();

      if (response.ok) {
        setResult(data);
        setStep('success');
        
        // Call success callback immediately (this will close the modal)
        if (onSuccess) {
          onSuccess(data);
        }
      } else {
        setError(data.error || 'Failed to initiate deposit');
        setStep('error');
      }
    } catch (err: any) {
      setError(err.message || 'Network error occurred');
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  const resetFlow = () => {
    setStep('amount');
    setAmount('');
    setSelectedAccount(null);
    setError('');
    setResult(null);
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Step 1: Amount Selection
  const renderAmountStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <DollarSign size={20} className="mr-2 text-green-600" />
          Enter Deposit Amount
        </h3>
        
        <div className="relative">
          <span className="absolute left-4 top-4 text-gray-500 text-lg">$</span>
          <input
            type="number"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setError('');
            }}
            placeholder="0"
            min="100"
            max="50000"
            step="100"
            className="w-full pl-10 pr-4 py-4 text-xl border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div className="mt-2 text-sm text-gray-600">
          Minimum: $100 • Maximum: $50,000
        </div>
        
        {error && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}
      </div>
      
      <div className="flex space-x-3">
        {onCancel && (
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          onClick={handleAmountNext}
          disabled={!amount || parseFloat(amount) < 100}
          className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
        >
          <span>Continue</span>
          <ArrowRight size={16} className="ml-2" />
        </button>
      </div>
    </div>
  );

  // Step 2: Account Selection
  const renderAccountStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Building2 size={20} className="mr-2 text-blue-600" />
          Select Bank Account
        </h3>
        
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-sm text-blue-800">
            <strong>Deposit Amount:</strong> {formatCurrency(parseFloat(amount))}
          </div>
        </div>
        
        {linkedAccounts.length === 0 ? (
          <div className="text-center py-8">
            <div className="mb-4">
              <Building2 size={48} className="mx-auto text-gray-400" />
            </div>
            <p className="text-gray-600 mb-4">No bank accounts linked yet</p>
            <BankLinkButton onSuccess={handleBankLinked} />
          </div>
        ) : (
          <div className="space-y-3">
            {linkedAccounts.map((account) => (
              <button
                key={account.id}
                onClick={() => handleAccountSelect(account)}
                className="w-full p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{account.accountName}</div>
                    <div className="text-sm text-gray-600">
                      {account.accountType}
                      {account.accountSubtype && ` • ${account.accountSubtype}`}
                      <span className="ml-2 font-mono">****{account.mask}</span>
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-gray-400" />
                </div>
              </button>
            ))}
            
            <div className="pt-4 border-t">
              <BankLinkButton 
                onSuccess={handleBankLinked}
                className="w-full"
              />
            </div>
          </div>
        )}
      </div>
      
      <div className="flex space-x-3">
        <button
          onClick={() => setStep('amount')}
          className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Back
        </button>
      </div>
    </div>
  );

  // Step 3: Confirmation
  const renderConfirmStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <CheckCircle size={20} className="mr-2 text-green-600" />
          Confirm Deposit
        </h3>
        
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Amount:</span>
            <span className="font-semibold text-lg">{formatCurrency(parseFloat(amount))}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">From Account:</span>
            <div className="text-right">
              <div className="font-medium">{selectedAccount?.accountName}</div>
              <div className="text-sm text-gray-500">****{selectedAccount?.mask}</div>
            </div>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Processing Time:</span>
            <span className="text-sm">1-3 business days</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Fee:</span>
            <span className="text-green-600 font-medium">Free</span>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="text-sm text-yellow-800">
            <strong>Note:</strong> This will initiate an ACH transfer from your bank account. 
            Funds will be available in your escrow wallet once the transfer completes.
          </div>
        </div>
      </div>
      
      <div className="flex space-x-3">
        <button
          onClick={() => setStep('account')}
          className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Back
        </button>
        <button
          onClick={initiateDeposit}
          disabled={loading}
          className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors flex items-center justify-center"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard size={16} className="mr-2" />
              Confirm Deposit
            </>
          )}
        </button>
      </div>
    </div>
  );

  // Step 4: Processing
  const renderProcessingStep = () => (
    <div className="text-center py-8">
      <div className="mb-4">
        <Loader2 size={48} className="mx-auto animate-spin text-blue-600" />
      </div>
      <h3 className="text-lg font-semibold mb-2">Processing Your Deposit</h3>
      <p className="text-gray-600">Please wait while we initiate your ACH transfer...</p>
    </div>
  );

  // Step 5: Success (this will be brief since modal closes immediately)
  const renderSuccessStep = () => (
    <div className="text-center py-8">
      <div className="mb-4">
        <CheckCircle size={48} className="mx-auto text-green-600" />
      </div>
      <h3 className="text-lg font-semibold mb-2 text-green-800">Deposit Initiated Successfully!</h3>
      <p className="text-gray-600">
        Processing your deposit...
      </p>
    </div>
  );

  // Step 6: Error
  const renderErrorStep = () => (
    <div className="text-center py-8">
      <div className="mb-4">
        <AlertCircle size={48} className="mx-auto text-red-600" />
      </div>
      <h3 className="text-lg font-semibold mb-2 text-red-800">Deposit Failed</h3>
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}
      
      <div className="flex space-x-3 justify-center">
        <button
          onClick={() => setStep('confirm')}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Try Again
        </button>
        <button
          onClick={resetFlow}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Start Over
        </button>
      </div>
    </div>
  );

  // Render current step
  const renderCurrentStep = () => {
    switch (step) {
      case 'amount':
        return renderAmountStep();
      case 'account':
        return renderAccountStep();
      case 'confirm':
        return renderConfirmStep();
      case 'processing':
        return renderProcessingStep();
      case 'success':
        return renderSuccessStep();
      case 'error':
        return renderErrorStep();
      default:
        return renderAmountStep();
    }
  };

  return (
    <div className="max-w-md mx-auto">
      {/* Progress Indicator */}
      {!['processing', 'success', 'error'].includes(step) && (
        <div className="mb-6">
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              ['amount', 'account', 'confirm'].includes(step) ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              1
            </div>
            <div className={`flex-1 h-1 mx-2 ${
              ['account', 'confirm'].includes(step) ? 'bg-blue-600' : 'bg-gray-200'
            }`} />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              ['account', 'confirm'].includes(step) ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              2
            </div>
            <div className={`flex-1 h-1 mx-2 ${
              step === 'confirm' ? 'bg-blue-600' : 'bg-gray-200'
            }`} />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step === 'confirm' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              3
            </div>
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>Amount</span>
            <span>Account</span>
            <span>Confirm</span>
          </div>
        </div>
      )}

      {/* Current Step Content */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        {renderCurrentStep()}
      </div>
    </div>
  );
}