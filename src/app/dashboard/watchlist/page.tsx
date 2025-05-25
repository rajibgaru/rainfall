'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Heart, Clock, AlertCircle, Gavel, Eye, Trash2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'react-hot-toast';

export default function WatchlistPage() {
  const { data: session } = useSession();
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'live', 'upcoming', 'ended'

  useEffect(() => {
    fetchWatchlist();
  }, []);

  const fetchWatchlist = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/dashboard/watchlist');
      
      if (!response.ok) {
        throw new Error('Failed to fetch watchlist');
      }
      
      const data = await response.json();
      setWatchlist(data.watchlist || []);
    } catch (error) {
      console.error('Error fetching watchlist:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const removeFromWatchlist = async (auctionId) => {
    try {
      const response = await fetch(`/api/auctions/${auctionId}/watchlist`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to remove from watchlist');
      }
      
      // Remove the item from the local state
      setWatchlist(watchlist.filter(item => item.auction.id !== auctionId));
      toast.success('Removed from watchlist');
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      toast.error('Failed to remove from watchlist');
    }
  };

  // Filter watchlist based on selected filter
  const filteredWatchlist = watchlist.filter(item => {
    if (filter === 'all') return true;
    return item.auction.status.toLowerCase() === filter.toLowerCase();
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
          onClick={fetchWatchlist}
          className="mt-2 px-3 py-1 bg-red-100 text-red-800 rounded text-sm"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">My Watchlist</h1>
      
      {/* Filter buttons */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            filter === 'all' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All Auctions
        </button>
        <button
          onClick={() => setFilter('live')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            filter === 'live' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Live Auctions
        </button>
        <button
          onClick={() => setFilter('upcoming')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            filter === 'upcoming' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Upcoming
        </button>
        <button
          onClick={() => setFilter('ended')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            filter === 'ended' ? 'bg-gray-300 text-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Ended
        </button>
      </div>
      
      {filteredWatchlist.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Heart size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">Your watchlist is empty</h3>
          <p className="text-gray-500 mb-4">Add properties to your watchlist to keep track of auctions you're interested in.</p>
          <Link 
            href="/auctions" 
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Browse Auctions
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredWatchlist.map((item) => (
            <div 
              key={item.id} 
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="relative">
                {/* Auction Image */}
                <div className="h-48 relative">
                  <Image
                    src={item.auction.images?.[0] || '/images/placeholder.jpg'}
                    alt={item.auction.title || 'Property'}
                    fill
                    className="object-cover"
                  />
                  <div className={`absolute top-2 right-2 text-xs font-bold px-2 py-1 rounded-full ${
                    item.auction.status === 'LIVE' 
                      ? 'bg-green-500 text-white' 
                      : item.auction.status === 'UPCOMING'
                        ? 'bg-yellow-500 text-white'
                        : 'bg-gray-500 text-white'
                  }`}>
                    {item.auction.status}
                  </div>
                </div>
                
                {/* Remove from watchlist button */}
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    removeFromWatchlist(item.auction.id);
                  }}
                  className="absolute top-2 left-2 p-1.5 bg-white/80 hover:bg-white rounded-full text-red-500 hover:text-red-600"
                  aria-label="Remove from watchlist"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              
              {/* Auction Info */}
              <div className="p-4">
                <h3 className="font-bold text-lg mb-1 line-clamp-1">
                  {item.auction.title}
                </h3>
                <p className="text-gray-600 text-sm mb-3 line-clamp-1">
                  {item.auction.location}
                </p>
                
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-xs text-gray-500">Current Bid</div>
                    <div className="text-lg font-bold text-blue-600">
                      ${item.auction.currentBid?.toLocaleString() || item.auction.startingBid?.toLocaleString() || '0'}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-xs text-gray-500">Time Remaining</div>
                    <div className="text-sm font-medium flex items-center gap-1">
                      <Clock size={14} />
                      {item.auction.status === 'LIVE' && (
                        <span className="text-green-600">
                          {new Date(item.auction.endDate) > new Date() 
                            ? getTimeRemaining(item.auction.endDate)
                            : 'Ending soon'}
                        </span>
                      )}
                      {item.auction.status === 'UPCOMING' && (
                        <span className="text-yellow-600">
                          Starts in {getTimeRemaining(item.auction.startDate)}
                        </span>
                      )}
                      {item.auction.status === 'ENDED' && (
                        <span className="text-gray-600">Auction ended</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {item.auction.status === 'LIVE' && (
                    <Link 
                      href={`/auctions/${item.auction.id}`}
                      className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-medium"
                    >
                      <Gavel size={16} className="mr-1.5" />
                      Bid Now
                    </Link>
                  )}
                  
                  {item.auction.status === 'UPCOMING' && (
                    <Link 
                      href={`/auctions/${item.auction.id}`}
                      className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
                    >
                      <Eye size={16} className="mr-1.5" />
                      Preview
                    </Link>
                  )}
                  
                  {item.auction.status === 'ENDED' && (
                    <Link 
                      href={`/auctions/${item.auction.id}`}
                      className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm font-medium"
                    >
                      <Eye size={16} className="mr-1.5" />
                      View Results
                    </Link>
                  )}
                  
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      removeFromWatchlist(item.auction.id);
                    }}
                    className="inline-flex items-center justify-center px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm"
                  >
                    <Trash2 size={16} className="mr-1.5" />
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Helper function to format time remaining
function getTimeRemaining(dateString) {
  const targetDate = new Date(dateString);
  const now = new Date();
  
  // Calculate the time difference in milliseconds
  const diff = targetDate - now;
  
  if (diff <= 0) {
    return 'Ended';
  }
  
  // Convert to days, hours, minutes
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) {
    return `${days}d ${hours}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}