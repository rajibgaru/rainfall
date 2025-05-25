'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Gavel, Clock, ChevronRight, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function MyBidsPage() {
  const { data: session } = useSession();
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'active', 'outbid', 'won'

  useEffect(() => {
    fetchBids();
  }, []);

  const fetchBids = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/dashboard/bids');
      
      if (!response.ok) {
        throw new Error('Failed to fetch bids');
      }
      
      const data = await response.json();
      setBids(data.bids || []);
    } catch (error) {
      console.error('Error fetching bids:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter bids based on selected filter
  const filteredBids = bids.filter(bid => {
    if (filter === 'all') return true;
    if (filter === 'active') return bid.isHighestBidder && bid.auction.status === 'LIVE';
    if (filter === 'outbid') return !bid.isHighestBidder && bid.auction.status === 'LIVE';
    if (filter === 'won') return bid.isHighestBidder && bid.auction.status === 'ENDED';
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
        <div className="flex items-center">
          <AlertCircle size={20} className="mr-2" />
          <span>{error}</span>
        </div>
        <button 
          onClick={fetchBids}
          className="mt-2 px-3 py-1 bg-red-100 text-red-800 rounded text-sm"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">My Bids</h1>
      
      {/* Filter buttons */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            filter === 'all' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All Bids
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            filter === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Winning Bids
        </button>
        <button
          onClick={() => setFilter('outbid')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            filter === 'outbid' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Outbid
        </button>
        <button
          onClick={() => setFilter('won')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            filter === 'won' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Won Auctions
        </button>
      </div>
      
      {filteredBids.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Gavel size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">No bids found</h3>
          <p className="text-gray-500 mb-4">You haven't placed any bids yet.</p>
          <Link 
            href="/auctions" 
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Browse Auctions
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBids.map((bid) => (
            <div 
              key={bid.id} 
              className={`bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow ${
                bid.isHighestBidder && bid.auction.status === 'LIVE' 
                  ? 'border-green-200' 
                  : bid.isHighestBidder && bid.auction.status === 'ENDED'
                    ? 'border-purple-200'
                    : 'border-gray-200'
              }`}
            >
              <div className="flex flex-col md:flex-row">
                {/* Auction Image */}
                <div className="md:w-48 h-32 md:h-auto relative">
                  <Image
                    src={bid.auction.images?.[0] || '/images/placeholder.jpg'}
                    alt={bid.auction.title || 'Property'}
                    fill
                    className="object-cover"
                  />
                  <div className={`absolute top-2 right-2 text-xs font-bold px-2 py-1 rounded-full ${
                    bid.auction.status === 'LIVE' 
                      ? 'bg-green-500 text-white' 
                      : bid.auction.status === 'ENDED'
                        ? 'bg-gray-500 text-white'
                        : 'bg-blue-500 text-white'
                  }`}>
                    {bid.auction.status}
                  </div>
                </div>
                
                {/* Bid Info */}
                <div className="flex-grow p-4">
                  <h3 className="font-bold text-lg mb-1 line-clamp-1">
                    {bid.auction.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-2 line-clamp-1">
                    {bid.auction.location}
                  </p>
                  
                  <div className="flex items-center justify-between mt-4">
                    <div>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Clock size={14} />
                        <span>Bid placed: {new Date(bid.createdAt).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <span className="font-medium">Your bid:</span>
                        <span className={`font-bold ${
                          bid.isHighestBidder ? 'text-green-600' : 'text-gray-700'
                        }`}>
                          ${bid.amount.toLocaleString()}
                        </span>
                        {bid.isHighestBidder && (
                          <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                            Highest Bid
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <Link 
                        href={`/auctions/${bid.auction.id}`}
                        className="inline-flex items-center px-3 py-1.5 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 text-sm"
                      >
                        View Auction
                        <ChevronRight size={16} />
                      </Link>
                    </div>
                  </div>
                </div>
                
                {/* Current Auction Bid Info */}
                <div className="p-4 bg-gray-50 md:w-48 flex flex-col justify-center items-center border-t md:border-t-0 md:border-l border-gray-200">
                  <div className="text-sm text-gray-500 mb-1">Current Bid</div>
                  <div className="text-xl font-bold text-blue-700">
                    ${bid.auction.currentBid?.toLocaleString() || '0'}
                  </div>
                  
                  {bid.auction.status === 'LIVE' && !bid.isHighestBidder && (
                    <div className="mt-3">
                      <Link 
                        href={`/auctions/${bid.auction.id}`}
                        className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                      >
                        <Gavel size={14} className="mr-1" />
                        Bid Again
                      </Link>
                    </div>
                  )}
                  
                  {bid.auction.status === 'ENDED' && bid.isHighestBidder && (
                    <div className="mt-2 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                      Auction Won!
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}