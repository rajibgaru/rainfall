// Fixed src/app/auctions/[id]/page.tsx - with proper object rendering
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Heart, Clock, Gavel, MapPin, User, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function AuctionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const auctionId = params.id;
  
  const [auction, setAuction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bidAmount, setBidAmount] = useState('');
  const [bidding, setBidding] = useState(false);
  const [error, setError] = useState(null);
  const [isWatchlisted, setIsWatchlisted] = useState(false);

  useEffect(() => {
    if (!auctionId) return;

    const fetchAuction = async () => {
      try {
        setLoading(true);
        console.log('🔍 Fetching auction detail:', auctionId);

        const response = await fetch(`/api/auctions/${auctionId}`);
        
        if (response.status === 404) {
          setError('Auction not found');
          return;
        }
        
        if (!response.ok) {
          throw new Error(`Failed to fetch auction: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📊 Fetched auction detail:', data.auction);
        
        // Ensure we have valid data
        if (!data.auction) {
          throw new Error('No auction data received');
        }
        
        setAuction(data.auction);
        
        // Set minimum bid amount safely
        if (data.auction.currentBid && data.auction.incrementAmount) {
          const minBid = data.auction.currentBid + data.auction.incrementAmount;
          setBidAmount(minBid.toString());
        } else {
          setBidAmount((data.auction.startingBid || 0).toString());
        }
        
      } catch (error) {
        console.error('❌ Error fetching auction:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAuction();
  }, [auctionId]);

  const getCurrentStatus = () => {
    if (!auction?.startDate || !auction?.endDate) {
      return auction?.status || 'UNKNOWN';
    }
    
    const now = new Date();
    const startDate = new Date(auction.startDate);
    const endDate = new Date(auction.endDate);
    
    if (auction.status === 'CANCELLED') return 'CANCELLED';
    if (now < startDate) return 'UPCOMING';
    if (now >= startDate && now < endDate) return 'LIVE';
    return 'ENDED';
  };

  const currentStatus = auction ? getCurrentStatus() : 'UNKNOWN';

  const getStatusColor = (status) => {
    switch (status) {
      case 'UPCOMING':
        return 'bg-blue-500 text-white';
      case 'LIVE':
        return 'bg-green-500 text-white animate-pulse';
      case 'ENDED':
        return 'bg-yellow-500 text-white';
      case 'CANCELLED':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const handleBid = async (e) => {
    e.preventDefault();
    
    if (!session) {
      alert('Please sign in to place a bid');
      router.push('/auth/signin');
      return;
    }
    
    setBidding(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/auctions/${auctionId}/bid`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: parseFloat(bidAmount)
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to place bid');
      }
      
      console.log('✅ Bid placed successfully:', data);
      
      // Create the new bid object
      const newBid = {
        id: data.bid?.id || Date.now().toString(), // Use bid ID from response or timestamp
        amount: parseFloat(bidAmount),
        createdAt: new Date().toISOString(),
        auctionId: auctionId,
        bidderId: session.user.id,
        bidder: {
          name: session.user.name || 'You'
        }
      };
      
      // Update auction with new bid and add to bids array
      setAuction(prev => ({
        ...prev,
        currentBid: parseFloat(bidAmount),
        // Add new bid to the beginning of the bids array
        bids: [newBid, ...(prev.bids || [])].slice(0, 10) // Keep only the 10 most recent bids
      }));
      
      // Set next minimum bid
      const nextMinBid = parseFloat(bidAmount) + auction.incrementAmount;
      setBidAmount(nextMinBid.toString());
      
      alert('Bid placed successfully!');
      
    } catch (error) {
      console.error('❌ Error placing bid:', error);
      setError(error.message);
    } finally {
      setBidding(false);
    }
  };

  const handleWatchlist = async () => {
    if (!session) {
      alert('Please sign in to add to watchlist');
      return;
    }
    
    try {
      const response = await fetch(`/api/auctions/${auctionId}/watchlist`, {
        method: isWatchlisted ? 'DELETE' : 'POST'
      });
      
      if (response.ok) {
        setIsWatchlisted(!isWatchlisted);
      }
    } catch (error) {
      console.error('Error updating watchlist:', error);
    }
  };

  const formattedTimeLeft = () => {
    if (!auction?.startDate || !auction?.endDate) {
      return 'Time unknown';
    }
    
    const startDate = new Date(auction.startDate);
    const endDate = new Date(auction.endDate);
    
    if (currentStatus === 'ENDED') {
      return 'Auction ended';
    } else if (currentStatus === 'UPCOMING') {
      return `Starts ${formatDistanceToNow(startDate, { addSuffix: true })}`;
    } else if (currentStatus === 'LIVE') {
      return `Ends ${formatDistanceToNow(endDate, { addSuffix: true })}`;
    } else if (currentStatus === 'CANCELLED') {
      return 'Auction cancelled';
    }
    
    return 'Unknown';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !auction) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <Link href="/auctions" className="inline-flex items-center text-blue-600 hover:underline mb-4">
            <ArrowLeft size={16} className="mr-2" />
            Back to Auctions
          </Link>
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error || 'Auction not found'}
          </div>
        </div>
      </div>
    );
  }

  const minBid = (auction.currentBid || auction.startingBid || 0) + (auction.incrementAmount || 100);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/auctions" className="inline-flex items-center text-blue-600 hover:underline">
            <ArrowLeft size={16} className="mr-2" />
            Back to Auctions
          </Link>
          
          <button
            onClick={handleWatchlist}
            className={`flex items-center px-4 py-2 rounded-lg border ${
              isWatchlisted 
                ? 'bg-red-50 border-red-200 text-red-700' 
                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Heart size={16} className={`mr-2 ${isWatchlisted ? 'fill-red-500 text-red-500' : ''}`} />
            {isWatchlisted ? 'Remove from Watchlist' : 'Add to Watchlist'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Images and Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Main Image */}
            <div className="relative h-96 rounded-lg overflow-hidden bg-gray-200">
              <Image
                src={auction.images?.[0] || '/images/placeholder.jpg'}
                alt={auction.title || 'Property'}
                fill
                className="object-cover"
              />
              
              {/* Status Badge */}
              <div className="absolute top-4 right-4">
                <span className={`px-3 py-1 rounded text-sm font-bold ${getStatusColor(currentStatus)}`}>
                  {currentStatus}
                </span>
              </div>
              
              {/* Debug overlay */}
              <div className="absolute bottom-4 left-4 bg-black bg-opacity-75 text-white text-xs p-2 rounded">
                <div>DB Status: {auction.status || 'Unknown'}</div>
                <div>Calculated: {currentStatus}</div>
              </div>
            </div>

            {/* Property Information */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h1 className="text-3xl font-bold mb-4">{auction.title || 'Property Auction'}</h1>
              
              <div className="flex items-center text-gray-600 mb-4">
                <MapPin size={16} className="mr-2" />
                <span>{auction.location || 'Location not specified'}</span>
              </div>
              
              <div className="flex items-center text-gray-600 mb-6">
                <Clock size={16} className="mr-2" />
                <span>{formattedTimeLeft()}</span>
              </div>
              
              <div className="prose max-w-none">
                <h3 className="text-lg font-semibold mb-2">Description</h3>
                <p className="text-gray-700 leading-relaxed">
                  {auction.description || 'No description available'}
                </p>
              </div>
            </div>

            {/* Property Details */}
            {auction.propertyDetails && typeof auction.propertyDetails === 'object' && (
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold mb-4">Property Details</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {auction.propertyDetails.beds && (
                    <div className="text-center p-3 bg-gray-50 rounded">
                      <div className="text-2xl font-bold text-blue-600">
                        {auction.propertyDetails.beds}
                      </div>
                      <div className="text-sm text-gray-600">Bedrooms</div>
                    </div>
                  )}
                  {auction.propertyDetails.baths && (
                    <div className="text-center p-3 bg-gray-50 rounded">
                      <div className="text-2xl font-bold text-blue-600">
                        {auction.propertyDetails.baths}
                      </div>
                      <div className="text-sm text-gray-600">Bathrooms</div>
                    </div>
                  )}
                  {auction.propertyDetails.sqft && (
                    <div className="text-center p-3 bg-gray-50 rounded">
                      <div className="text-2xl font-bold text-blue-600">
                        {Number(auction.propertyDetails.sqft).toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">Sq Ft</div>
                    </div>
                  )}
                  {auction.propertyDetails.yearBuilt && (
                    <div className="text-center p-3 bg-gray-50 rounded">
                      <div className="text-2xl font-bold text-blue-600">
                        {auction.propertyDetails.yearBuilt}
                      </div>
                      <div className="text-sm text-gray-600">Year Built</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Recent Bids */}
            {auction.bids && Array.isArray(auction.bids) && auction.bids.length > 0 && (
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold mb-4">Recent Bids</h3>
                <div className="space-y-3">
                  {auction.bids.slice(0, 5).map((bid, index) => (
                    <div key={bid.id || index} className={`flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0 ${
                      bid.bidderId === session?.user?.id ? 'bg-green-50 px-2 rounded' : ''
                    }`}>
                      <div className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                          bid.bidderId === session?.user?.id ? 'bg-green-200' : 'bg-gray-200'
                        }`}>
                          <User size={16} className={`${
                            bid.bidderId === session?.user?.id ? 'text-green-600' : 'text-gray-500'
                          }`} />
                        </div>
                        <div>
                          <div className="font-medium">
                            {bid.bidderId === session?.user?.id ? 'You' : (bid.bidder?.name || 'Anonymous Bidder')}
                            {index === 0 && (
                              <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                                Highest Bid
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            {bid.createdAt ? new Date(bid.createdAt).toLocaleString() : 'Just now'}
                          </div>
                        </div>
                      </div>
                      <div className={`text-lg font-bold ${
                        bid.bidderId === session?.user?.id ? 'text-green-600' : 'text-blue-600'
                      }`}>
                        ${Number(bid.amount).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Show message when no bids yet */}
                {auction.bids.length === 0 && (
                  <div className="text-center py-6 text-gray-500">
                    <Gavel size={24} className="mx-auto mb-2 opacity-50" />
                    <p>No bids placed yet. Be the first to bid!</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column - Bidding */}
          <div className="space-y-6">
            {/* Current Bid */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-4">Current Bid</h2>
              
                <div className="text-center mb-6">
                <div className="text-4xl font-bold text-blue-600 mb-2">
                  ${Number(auction.currentBid || auction.startingBid || 0).toLocaleString()}
                </div>
                <div className="text-sm text-gray-500">
                  {Array.isArray(auction.bids) ? auction.bids.length : 0} bids placed
                </div>
                {/* Show if this is your bid */}
                {Array.isArray(auction.bids) && auction.bids.length > 0 && 
                 auction.bids[0].bidderId === session?.user?.id && (
                  <div className="text-xs text-green-600 mt-1">
                    You are the highest bidder!
                  </div>
                )}
              </div>

              {/* Reserve Price Info */}
              {auction.reservePrice > 0 && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <div className="text-sm">
                    <span className="font-medium">Reserve Price:</span> ${Number(auction.reservePrice).toLocaleString()}
                    <div className="text-xs text-gray-600 mt-1">
                      {(auction.currentBid || 0) >= auction.reservePrice ? '✅ Reserve met' : '⚠️ Reserve not yet met'}
                    </div>
                  </div>
                </div>
              )}

              {/* Bidding Form */}
              {currentStatus === 'LIVE' && session ? (
                <form onSubmit={handleBid} className="space-y-4">
                  <div>
                    <label htmlFor="bidAmount" className="block text-sm font-medium text-gray-700 mb-2">
                      Your Bid (minimum: ${Number(minBid).toLocaleString()})
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-3 text-gray-500">$</span>
                      <input
                        type="number"
                        id="bidAmount"
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        min={minBid}
                        step="100"
                        className="w-full pl-8 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>
                  
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
                      {error}
                    </div>
                  )}
                  
                  <button
                    type="submit"
                    disabled={bidding || parseFloat(bidAmount) < minBid}
                    className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400 flex items-center justify-center"
                  >
                    <Gavel size={20} className="mr-2" />
                    {bidding ? 'Placing Bid...' : 'Place Bid'}
                  </button>
                </form>
              ) : currentStatus === 'LIVE' && !session ? (
                <div className="text-center py-4">
                  <p className="text-gray-600 mb-4">Sign in to place a bid</p>
                  <Link 
                    href="/auth/signin"
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 inline-block"
                  >
                    Sign In to Bid
                  </Link>
                </div>
              ) : currentStatus === 'UPCOMING' ? (
                <div className="text-center py-4 bg-blue-50 rounded-lg">
                  <Clock size={24} className="mx-auto mb-2 text-blue-600" />
                  <p className="text-blue-800 font-medium">Auction Starting Soon</p>
                  <p className="text-blue-600 text-sm">{formattedTimeLeft()}</p>
                </div>
              ) : (
                <div className="text-center py-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-600 font-medium">Auction Has Ended</p>
                  {currentStatus === 'ENDED' && (
                    <p className="text-sm text-gray-500 mt-1">
                      Final bid: ${Number(auction.currentBid || 0).toLocaleString()}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Seller Information */}
            {auction.seller && typeof auction.seller === 'object' && (
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold mb-4">Listed By</h3>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mr-4">
                    <User size={20} className="text-gray-500" />
                  </div>
                  <div>
                    <div className="font-medium">{auction.seller.name || 'Unknown Seller'}</div>
                    {auction.seller.companyName && (
                      <div className="text-sm text-gray-600">{auction.seller.companyName}</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}