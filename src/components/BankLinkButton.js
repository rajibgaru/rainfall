'use client';

import { usePlaidLink } from 'react-plaid-link';
import { useState, useEffect } from 'react';
import { Building2, Loader2 } from 'lucide-react';

export default function BankLinkButton({ onSuccess, className = '' }) {
  const [linkToken, setLinkToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Create Link Token when component mounts
  useEffect(() => {
    createLinkToken();
  }, []);

  const createLinkToken = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔗 Requesting Plaid Link token...');
      
      const response = await fetch('/api/plaid/create-link-token', {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create link token');
      }
      
      setLinkToken(data.link_token);
      console.log('✅ Link token received');
      
    } catch (err) {
      console.error('❌ Link token error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: async (public_token, metadata) => {
      try {
        console.log('🎉 Plaid Link successful!');
        console.log('🏦 Institution:', metadata.institution.name);
        console.log('📊 Accounts selected:', metadata.accounts.length);
        
        setLoading(true);
        
        const response = await fetch('/api/plaid/exchange-public-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            public_token,
            metadata
          }),
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to link account');
        }
        
        console.log('✅ Bank account linked successfully');
        
        if (onSuccess) {
          onSuccess(data);
        }
        
      } catch (err) {
        console.error('❌ Account linking error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    onExit: (err, metadata) => {
      if (err) {
        console.log('🚪 Plaid Link exited with error:', err);
        setError('Bank linking was cancelled or failed');
      } else {
        console.log('🚪 Plaid Link exited normally');
      }
    },
  });

  const handleClick = () => {
    if (ready && linkToken) {
      console.log('🚀 Opening Plaid Link...');
      open();
    }
  };

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-700 text-sm mb-2">⚠️ {error}</p>
        <button
          onClick={createLinkToken}
          className="text-red-600 hover:text-red-800 text-sm underline"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={!ready || loading}
      className={`flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors ${className}`}
    >
      {loading ? (
        <>
          <Loader2 size={20} className="mr-2 animate-spin" />
          {linkToken ? 'Linking Account...' : 'Loading...'}
        </>
      ) : (
        <>
          <Building2 size={20} className="mr-2" />
          Link Bank Account
        </>
      )}
    </button>
  );
}