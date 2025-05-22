'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import AuctionCard from '@/components/auctions/AuctionCard';

export default function AuctionsPage() {
  const searchParams = useSearchParams();
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchAuctions = async (showLoader = false) => {
    try {
      if (showLoader) setLoading(true);
      
      // Build query params
      const params = new URLSearchParams();
      
      const category = searchParams.get('category');
      const featured = searchParams.get('featured');
      const status = searchParams.get('status');
      
      if (category) params.append('category', category);
      if (featured) params.append('featured', featured);
      if (status) params.append('status', status);

      console.log('🔍 Fetching auctions with params:', params.toString());

      const response = await fetch(`/api/auctions?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch auctions: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📊 Fetched auctions:', data.auctions);
      
      setAuctions(data.auctions || []);
      setLastUpdated(new Date());
      setError(null);
    } catch (error) {
      console.error('❌ Error fetching auctions:', error);
      setError(error.message);
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  const updateAuctionStatuses = async () => {
    try {
      console.log('🔄 Updating auction statuses...');
      
      // Call the status update API
      const response = await fetch('/api/auctions/update-all-statuses', {
        method: 'POST'
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Status update result:', result);
        
        // Refresh auction data after status update
        await fetchAuctions();
      } else {
        console.log('⚠️ Status update API not available, using client-side refresh');
        // If status update API doesn't exist, just refresh the data
        await fetchAuctions();
      }
    } catch (error) {
      console.error('❌ Error updating statuses:', error);
      // Fallback to just refreshing data
      await fetchAuctions();
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchAuctions(true);
  }, [searchParams]);

  useEffect(() => {
    if (!autoRefresh) return;

    // Set up auto-refresh every 2 minutes
    const interval = setInterval(() => {
      console.log('⏰ Auto-refreshing auction data and statuses...');
      updateAuctionStatuses();
    }, 120000); // 2 minutes

    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Also add a shorter interval just for UI updates (every 30 seconds)
  useEffect(() => {
    const shortInterval = setInterval(() => {
      console.log('🔄 Quick status recalculation...');
      // Force re-render of auction cards to recalculate status
      setLastUpdated(new Date());
    }, 30000); // 30 seconds

    return () => clearInterval(shortInterval);
  }, []);

  const handleManualRefresh = async () => {
    await updateAuctionStatuses();
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Error loading auctions: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header with controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h1 className="text-3xl font-bold">Property Auctions</h1>
        
        <div className="flex items-center gap-4">
          {/* Auto-refresh toggle */}
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span>Auto-refresh</span>
          </label>
          
          {/* Manual refresh button */}
          <button
            onClick={handleManualRefresh}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw size={16} />
            <span>Refresh</span>
          </button>
          
          {lastUpdated && (
            <span className="text-sm text-gray-500">
              Updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>
      
      {auctions.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No auctions found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {auctions.map((auction) => (
            <AuctionCard 
              key={auction.id} 
              auction={auction}
              // Pass lastUpdated to force re-render when needed
              refreshKey={lastUpdated?.getTime()}
            />
          ))}
        </div>
      )}
    </div>
  );
}