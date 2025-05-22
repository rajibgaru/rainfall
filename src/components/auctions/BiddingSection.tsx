// src/components/auctions/BiddingSection.tsx
'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';

export default function BiddingSection({ auction }) {
  const { data: session } = useSession();
  const [bidAmount, setBidAmount] = useState(
    auction.currentBid + (auction.incrementAmount || 100)
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [auctionStatus, setAuctionStatus] = useState(auction.realTimeStatus || auction.status);
  
  // Recalculate status on client side to ensure it's correct
  useEffect(() => {
    const updateStatus = () => {
      const now = new Date();
      const startDate = new Date(auction.startDate);
      const endDate = new Date(auction.endDate);
      
      let realTimeStatus;
      if (now < startDate) {
        realTimeStatus = 'UPCOMING';
      } else if (now >= startDate && now <= endDate) {
        realTimeStatus = 'LIVE';
      } else {
        realTimeStatus = 'ENDED';
      }
      
      setAuctionStatus(realTimeStatus);
    };
    
    // Update status immediately
    updateStatus();
    
    // Then update status every minute
    const interval = setInterval(updateStatus, 60000);
    
    return () => clearInterval(interval);
  }, [auction]);
  
  // Check if user is an agent
  const isAgent = session?.user?.role === 'AGENT';
  
  // Check if user is the seller
  const isSeller = session?.user?.id === auction.sellerId;
  
  const handleBid = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // Re-check auction status before placing bid
      if (auctionStatus !== 'LIVE') {
        throw new Error('This auction is not currently active');
      }
      
      const response = await fetch(`/api/auctions/${auction.id}/bid`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: bidAmount
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error);
      }
      
      setSuccess('Your bid was placed successfully!');
      
      // Refresh page after successful bid
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  // If the auction has not started yet
  if (auctionStatus === 'UPCOMING') {
    return (
      <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-md mb-6">
        <h3 className="font-medium">Auction Not Started Yet</h3>
        <p>This auction will begin on {new Date(auction.startDate).toLocaleString()}.</p>
      </div>
    );
  }
  
  // If the auction has ended
  if (auctionStatus === 'ENDED') {
    return (
      <div className="bg-gray-50 border border-gray-200 text-gray-700 p-4 rounded-md mb-6">
        <h3 className="font-medium">Auction Ended</h3>
        <p>This auction ended on {new Date(auction.endDate).toLocaleString()}.</p>
        {auction.bids && auction.bids.length > 0 ? (
          <p className="mt-2">
            Winning bid: ${auction.currentBid.toLocaleString()} 
            {auction.bids[0]?.bidder && ` by ${auction.bids[0].bidder.name}`}
          </p>
        ) : (
          <p className="mt-2">No bids were placed on this auction.</p>
        )}
      </div>
    );
  }
  
  // If user is an agent, show message instead of bidding form
  if (isAgent) {
    return (
      <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-md mb-6">
        <h3 className="font-medium">Agent Account</h3>
        <p>As a real estate agent, you cannot place bids on auctions. You can only create and manage your own auctions.</p>
      </div>
    );
  }
  
  // If user is the seller, show message instead of bidding form
  if (isSeller) {
    return (
      <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-md mb-6">
        <h3 className="font-medium">Your Listing</h3>
        <p>This is your own auction listing. You cannot place bids on your own auctions.</p>
      </div>
    );
  }
  
  // If user is not logged in
  if (!session) {
    return (
      <div className="bg-gray-50 border border-gray-200 text-gray-700 p-4 rounded-md mb-6">
        <h3 className="font-medium">Login Required</h3>
        <p>Please login to place a bid on this auction.</p>
        <a 
          href={`/login?callbackUrl=/auctions/${auction.id}`}
          className="inline-block mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Log In
        </a>
      </div>
    );
  }
  
  // For normal users on active auctions - show bidding form
  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h2 className="text-xl font-bold mb-4">Place a Bid</h2>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded mb-4">
          {success}
        </div>
      )}
      
      <div className="mb-4">
        <p className="mb-2">
          <span className="font-medium">Current Bid:</span> ${auction.currentBid.toLocaleString()}
        </p>
        <p className="mb-4">
          <span className="font-medium">Minimum Bid:</span> ${(auction.currentBid + auction.incrementAmount).toLocaleString()}
        </p>
        
        <label htmlFor="bidAmount" className="block text-gray-700 font-medium mb-1">
          Your Bid Amount ($)
        </label>
        <input
          id="bidAmount"
          type="number"
          value={bidAmount}
          onChange={(e) => setBidAmount(parseFloat(e.target.value))}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          min={auction.currentBid + auction.incrementAmount}
          step={auction.incrementAmount}
        />
      </div>
      
      <button
        onClick={handleBid}
        disabled={isLoading || bidAmount < (auction.currentBid + auction.incrementAmount)}
        className="w-full bg-blue-600 text-white font-medium py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400"
      >
        {isLoading ? 'Processing...' : `Place Bid: $${bidAmount.toLocaleString()}`}
      </button>
      
      <p className="mt-4 text-sm text-gray-500">
        By placing a bid, you agree to the auction terms and conditions.
      </p>
    </div>
  );
}