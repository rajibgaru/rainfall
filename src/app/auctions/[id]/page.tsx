'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Heart, 
  Clock, 
  Gavel, 
  MapPin, 
  User, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  ImageIcon,
  Wallet,
  AlertCircle,
  DollarSign,
  ShieldCheck
} from 'lucide-react';
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
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Escrow-related state
  const [escrowEligibility, setEscrowEligibility] = useState(null);
  const [escrowLoading, setEscrowLoading] = useState(false);
  const [showEscrowDetails, setShowEscrowDetails] = useState(false);

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

  // Check escrow eligibility when user is authenticated and auction is loaded
  useEffect(() => {
    if (session && auction && auctionId) {
      checkEscrowEligibility();
    }
  }, [session, auction, auctionId]);

  const checkEscrowEligibility = async () => {
    if (!session || !auctionId) return;
    
    setEscrowLoading(true);
    try {
      const response = await fetch(`/api/user/wallet/can-bid?auctionId=${auctionId}`);
      if (response.ok) {
        const data = await response.json();
        setEscrowEligibility(data.data);
      } else {
        console.error('Failed to check escrow eligibility');
      }
    } catch (error) {
      console.error('Error checking escrow eligibility:', error);
    } finally {
      setEscrowLoading(false);
    }
  };

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
    
    // Check if user is an agent - prevent agents from bidding
    if (session.user.role === 'AGENT') {
      alert('As a real estate agent, you cannot place bids on auctions');
      return;
    }
    
    // Check escrow eligibility before attempting to bid
    if (!escrowEligibility?.canBid) {
      setShowEscrowDetails(true);
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
        // Handle escrow-specific errors
        if (data.escrowRequired || data.escrowError) {
          setShowEscrowDetails(true);
          setEscrowEligibility(prev => ({
            ...prev,
            ...data.details
          }));
        }
        throw new Error(data.error || 'Failed to place bid');
      }
      
      console.log('✅ Bid placed successfully:', data);
      
      // Create the new bid object
      const newBid = {
        id: data.bid?.id || Date.now().toString(),
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
        bids: [newBid, ...(prev.bids || [])].slice(0, 10)
      }));
      
      // Set next minimum bid
      const nextMinBid = parseFloat(bidAmount) + auction.incrementAmount;
      setBidAmount(nextMinBid.toString());
      
      // Refresh escrow eligibility
      await checkEscrowEligibility();
      
      alert(data.message || 'Bid placed successfully!');
      
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
  
  // Navigate to previous image
  const prevImage = () => {
    if (!auction?.images || !auction.images.length) return;
    
    setCurrentImageIndex((prevIndex) => 
      prevIndex === 0 ? auction.images.length - 1 : prevIndex - 1
    );
  };
  
  // Navigate to next image
  const nextImage = () => {
    if (!auction?.images || !auction.images.length) return;
    
    setCurrentImageIndex((prevIndex) => 
      prevIndex === auction.images.length - 1 ? 0 : prevIndex + 1
    );
  };
  
  // Jump to specific image
  const jumpToImage = (index) => {
    if (!auction?.images || !auction.images.length) return;
    
    setCurrentImageIndex(index);
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
  
  // Get auction images with fallback
  const images = auction.images?.length > 0 
    ? auction.images 
    : ['/images/placeholder.jpg'];

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
            {/* Enhanced Image Gallery */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              {/* Main Image */}
              <div className="relative h-96 bg-gray-200">
                <Image
                  src={images[currentImageIndex]}
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
                
                {/* Image counter */}
                {images.length > 1 && (
                  <div className="absolute bottom-4 right-4 bg-black/70 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                    <div className="flex items-center gap-1">
                      <ImageIcon size={12} />
                      <span>{currentImageIndex + 1}/{images.length}</span>
                    </div>
                  </div>
                )}
                
                {/* Image navigation buttons - only show if there are multiple images */}
                {images.length > 1 && (
                  <>
                    <button 
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full backdrop-blur-sm transition-all"
                    >
                      <ChevronLeft size={24} />
                    </button>
                    <button 
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full backdrop-blur-sm transition-all"
                    >
                      <ChevronRight size={24} />
                    </button>
                  </>
                )}
              </div>
              
              {/* Thumbnail Navigation - only show if there are multiple images */}
              {images.length > 1 && (
                <div className="flex p-2 bg-gray-100 overflow-x-auto">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => jumpToImage(index)}
                      className={`relative w-20 h-16 flex-shrink-0 mx-1 rounded overflow-hidden ${
                        index === currentImageIndex ? 'ring-2 ring-blue-500' : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      <Image
                        src={image}
                        alt={`Thumbnail ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
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

            {/* Property Details with Features - Fixed to show zero values */}
            {auction.propertyDetails && typeof auction.propertyDetails === 'object' && (
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold mb-4">Property Details</h3>
                
                {/* Main Property Stats - Fixed: Use !== undefined instead of truthy check */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {auction.propertyDetails.beds !== undefined && (
                    <div className="text-center p-3 bg-gray-50 rounded">
                      <div className="text-2xl font-bold text-blue-600">
                        {auction.propertyDetails.beds}
                      </div>
                      <div className="text-sm text-gray-600">Bedrooms</div>
                    </div>
                  )}
                  {auction.propertyDetails.baths !== undefined && (
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
                
                {/* Additional Property Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {auction.propertyDetails.propertyType && (
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-blue-100 rounded-full mr-2"></div>
                      <div>
                        <span className="text-gray-600 text-sm">Property Type:</span>
                        <span className="ml-2 font-medium">{auction.propertyDetails.propertyType}</span>
                      </div>
                    </div>
                  )}
                  {auction.propertyDetails.lotSize && (
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-green-100 rounded-full mr-2"></div>
                      <div>
                        <span className="text-gray-600 text-sm">Lot Size:</span>
                        <span className="ml-2 font-medium">{auction.propertyDetails.lotSize}</span>
                      </div>
                    </div>
                  )}
                  {auction.propertyDetails.parking && (
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-purple-100 rounded-full mr-2"></div>
                      <div>
                        <span className="text-gray-600 text-sm">Parking:</span>
                        <span className="ml-2 font-medium">{auction.propertyDetails.parking}</span>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Property Features */}
                {auction.propertyDetails.features && Array.isArray(auction.propertyDetails.features) && auction.propertyDetails.features.length > 0 && (
                  <div>
                    <h4 className="text-md font-semibold mb-3 border-b pb-2">Property Features</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {auction.propertyDetails.features.map((feature, index) => (
                        <div key={index} className="flex items-center">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                          <span className="text-gray-700">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Recent Bids */}
            {auction.bids && Array.isArray(auction.bids) && (
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold mb-4">Recent Bids</h3>
                {auction.bids.length > 0 ? (
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
                ) : (
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
            {/* Escrow Status Card - Show only for authenticated non-agent users */}
            {session && session.user.role !== 'AGENT' && currentStatus === 'LIVE' && (
              <div className="bg-white rounded-lg p-6 shadow-sm border-2 border-blue-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center">
                    <Wallet size={20} className="mr-2 text-blue-600" />
                    Escrow Status
                  </h3>
                  {escrowLoading && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  )}
                </div>
                
                {escrowEligibility ? (
                  <div className="space-y-3">
                    {/* Escrow eligibility status */}
                    <div className={`p-3 rounded-lg border ${
                      escrowEligibility.canBid 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-red-50 border-red-200'
                    }`}>
                      <div className="flex items-center">
                        {escrowEligibility.canBid ? (
                          <ShieldCheck size={16} className="text-green-600 mr-2" />
                        ) : (
                          <AlertCircle size={16} className="text-red-600 mr-2" />
                        )}
                        <span className={`font-medium text-sm ${
                          escrowEligibility.canBid ? 'text-green-800' : 'text-red-800'
                        }`}>
                          {escrowEligibility.canBid ? 'Eligible to Bid' : 'Deposit Required'}
                        </span>
                      </div>
                    </div>
                    
                    {/* Balance information */}
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Available Balance:</span>
                        <span className="font-medium">${escrowEligibility.availableBalance?.toLocaleString() || '0'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Required for Bidding:</span>
                        <span className="font-medium">${escrowEligibility.requiredAmount?.toLocaleString() || '5,000'}</span>
                      </div>
                      {!escrowEligibility.canBid && escrowEligibility.shortfall > 0 && (
                        <div className="flex justify-between border-t pt-2">
                          <span className="text-red-600 font-medium">Shortfall:</span>
                          <span className="text-red-600 font-bold">${escrowEligibility.shortfall?.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Action buttons */}
                    <div className="pt-2 border-t">
                      <Link 
                        href="/dashboard/wallet"
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center"
                      >
                        <Wallet size={14} className="mr-2" />
                        {escrowEligibility.canBid ? 'View Wallet' : 'Add Funds to Bid'}
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <div className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                )}
              </div>
            )}

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

              {/* Reserve Price Info - UPDATED: Hide actual amount */}
              {auction.reservePrice > 0 && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <div className="text-sm">
                    <span className="font-medium">Reserve Price</span>
                    <div className="text-xs text-gray-600 mt-1">
                      {(auction.currentBid || 0) >= auction.reservePrice ? '✅ Reserve met' : '⚠️ Reserve not yet met'}
                    </div>
                  </div>
                </div>
              )}

              {/* Bidding Form */}
              {currentStatus === 'LIVE' && session && session.user.role !== 'AGENT' ? (
                <div className="space-y-4">
                  {/* Show escrow warning if can't bid */}
                  {escrowEligibility && !escrowEligibility.canBid && (
                    <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                      <div className="flex items-start">
                        <AlertCircle size={16} className="text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                        <div className="text-sm">
                          <p className="text-red-800 font-medium mb-1">Escrow Deposit Required</p>
                          <p className="text-red-700 text-xs">
                            You need ${escrowEligibility.shortfall?.toLocaleString()} more in your escrow account to bid on this auction.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <form onSubmit={handleBid}>
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
                          disabled={escrowEligibility && !escrowEligibility.canBid}
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
                      disabled={
                        bidding || 
                        parseFloat(bidAmount) < minBid || 
                        (escrowEligibility && !escrowEligibility.canBid)
                      }
                      className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400 flex items-center justify-center transition-colors"
                    >
                      <Gavel size={20} className="mr-2" />
                      {bidding ? 'Placing Bid...' : 
                       escrowEligibility && !escrowEligibility.canBid ? 'Deposit Required' :
                       'Place Bid'}
                    </button>
                  </form>
                </div>
              ) : currentStatus === 'LIVE' && session && session.user.role === 'AGENT' ? (
                <div className="text-center py-4 bg-red-50 rounded-lg">
                  <AlertCircle size={24} className="mx-auto mb-2 text-red-600" />
                  <p className="text-red-800 font-medium">Agents Cannot Bid</p>
                  <p className="text-red-600 text-sm">As a real estate agent, you cannot place bids on auctions</p>
                </div>
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

        {/* Escrow Details Modal */}
        {showEscrowDetails && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold flex items-center">
                  <Wallet size={20} className="mr-2 text-blue-600" />
                  Escrow Deposit Required
                </h3>
              </div>
              
              <div className="p-6">
                <div className="mb-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <div className="flex items-start">
                      <AlertCircle size={16} className="text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">Why do I need an escrow deposit?</p>
                        <p>Escrow deposits ensure all bidders are serious and qualified. Your deposit is held securely and returned if you don't win.</p>
                      </div>
                    </div>
                  </div>
                  
                  {escrowEligibility && (
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Your Available Balance:</span>
                        <span className="font-medium">${escrowEligibility.availableBalance?.toLocaleString() || '0'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Required for This Auction:</span>
                        <span className="font-medium">${escrowEligibility.requiredAmount?.toLocaleString() || '5,000'}</span>
                      </div>
                      {escrowEligibility.shortfall > 0 && (
                        <div className="flex justify-between border-t pt-2">
                          <span className="text-red-600 font-medium">Additional Needed:</span>
                          <span className="text-red-600 font-bold">${escrowEligibility.shortfall?.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowEscrowDetails(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <Link
                    href="/dashboard/wallet"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center"
                  >
                    Add Funds
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}