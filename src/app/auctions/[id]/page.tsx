'use client'

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Clock, MapPin, User, Calendar, Heart, Share } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import Image from 'next/image';
import Link from 'next/link';

export default function AuctionDetail() {
  const { id } = useParams();
  const [auction, setAuction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isWatchlisted, setIsWatchlisted] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [selectedImage, setSelectedImage] = useState(0);
  const [bidAmount, setBidAmount] = useState(0);
  
  useEffect(() => {
    // Simulate API call with timeout
    const timeout = setTimeout(() => {
      // Mock data - in a real app, this would be an API call
      const mockAuction = {
        id,
        title: 'Modern Beachfront Property',
        description: 'A stunning modern beachfront property with panoramic ocean views. This luxurious home features 4 bedrooms, 3.5 bathrooms, an open-concept living area, gourmet kitchen, and direct beach access. Perfect for those seeking a waterfront lifestyle or a premium vacation property.',
        location: 'Malibu, California',
        startingBid: 350000,
        currentBid: 450000,
        incrementAmount: 5000,
        endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3), // 3 days from now
        startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4), // 4 days ago
        bids: 12,
        featured: true,
        images: [
          '/images/placeholder.jpg',
          '/images/placeholder.jpg',
          '/images/placeholder.jpg',
          '/images/placeholder.jpg'
        ],
        seller: {
          id: 's1',
          name: 'John Doe',
          avatar: null
        },
        propertyDetails: {
          bedrooms: 4,
          bathrooms: 3.5,
          squareFeet: 3200,
          lotSize: '0.5 acres',
          yearBuilt: 2015,
          propertyType: 'Single Family Home',
          parking: '2-Car Garage'
        },
        status: 'LIVE'
      };
      
      setAuction(mockAuction);
      setBidAmount(mockAuction.currentBid + mockAuction.incrementAmount);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timeout);
  }, [id]);

  const toggleWatchlist = () => {
    setIsWatchlisted(!isWatchlisted);
    // In a real app, you'd call an API to update the watchlist
  };

  const handleBidSubmit = (e) => {
    e.preventDefault();
    // In a real app, you'd call an API to place a bid
    alert(`Bid placed: $${bidAmount.toLocaleString()}`);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-gray-200 aspect-video rounded-lg mb-6"></div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              </div>
            </div>
            <div>
              <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-6"></div>
                <div className="h-20 bg-gray-200 rounded mb-6"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Auction Not Found</h2>
          <p className="text-gray-600">
            The auction you're looking for doesn't exist or has been removed.
          </p>
          <Link href="/auctions" className="text-blue-600 hover:underline mt-4 inline-block">
            Browse all auctions
          </Link>
        </div>
      </div>
    );
  }
  
  const isAuctionLive = new Date(auction.startDate) <= new Date() && new Date(auction.endDate) > new Date();
  const isAuctionEnded = new Date(auction.endDate) < new Date();

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Images */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
            <div className="relative aspect-video">
              <Image
                src={auction.images[selectedImage] || '/images/placeholder.jpg'}
                alt={auction.title}
                fill
                className="object-cover"
              />
            </div>
            
            {auction.images.length > 1 && (
              <div className="p-4 flex space-x-2 overflow-x-auto">
                {auction.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`relative w-20 h-20 rounded overflow-hidden ${
                      selectedImage === index ? 'ring-2 ring-blue-600' : ''
                    }`}
                  >
                    <Image
                      src={image}
                      alt={`${auction.title} - Image ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Tabs Navigation */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="flex border-b">
              <button
                className={`px-4 py-3 font-medium ${
                  activeTab === 'details'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600'
                }`}
                onClick={() => setActiveTab('details')}
              >
                Details
              </button>
              <button
                className={`px-4 py-3 font-medium ${
                  activeTab === 'bidHistory'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600'
                }`}
                onClick={() => setActiveTab('bidHistory')}
              >
                Bid History
              </button>
            </div>
            
            <div className="p-6">
              {activeTab === 'details' ? (
                <div>
                  <h2 className="text-xl font-bold mb-4">Property Details</h2>
                  <p className="text-gray-700 mb-6">{auction.description}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="flex items-start space-x-2">
                      <MapPin className="text-gray-500 mt-1" size={18} />
                      <div>
                        <p className="font-medium">Location</p>
                        <p className="text-gray-600">{auction.location}</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2">
                      <User className="text-gray-500 mt-1" size={18} />
                      <div>
                        <p className="font-medium">Seller</p>
                        <p className="text-gray-600">{auction.seller.name}</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2">
                      <Calendar className="text-gray-500 mt-1" size={18} />
                      <div>
                        <p className="font-medium">Start Date</p>
                        <p className="text-gray-600">
                          {format(new Date(auction.startDate), 'PPP')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2">
                      <Calendar className="text-gray-500 mt-1" size={18} />
                      <div>
                        <p className="font-medium">End Date</p>
                        <p className="text-gray-600">
                          {format(new Date(auction.endDate), 'PPP')}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Property Specifications */}
                  {auction.propertyDetails && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Property Specifications</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {Object.entries(auction.propertyDetails).map(([key, value]) => (
                          <div key={key} className="bg-gray-50 p-3 rounded">
                            <p className="text-sm text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                            <p className="font-medium">{value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <h2 className="text-xl font-bold mb-4">Bid History</h2>
                  <div className="text-center py-4">
                    <p className="text-gray-500">No bid history available</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Right Column - Bidding Info */}
        <div>
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-bold">{auction.title}</h1>
              <div className="flex space-x-2">
                <button
                  onClick={toggleWatchlist}
                  className={`p-2 rounded-full ${
                    isWatchlisted ? 'bg-red-100 text-red-500' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  <Heart
                    size={20}
                    className={isWatchlisted ? 'fill-red-500' : ''}
                  />
                </button>
                <button className="p-2 rounded-full bg-gray-100 text-gray-600">
                  <Share size={20} />
                </button>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-sm text-gray-500 mb-1">Current Bid</p>
              <p className="text-3xl font-bold text-blue-600">
                ${auction.currentBid.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">
                {auction.bids || 0} bids
              </p>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <div className="flex items-center text-blue-800 mb-2">
                <Clock size={18} className="mr-2" />
                <p className="font-medium">
                  {isAuctionEnded
                    ? 'Auction has ended'
                    : !isAuctionLive
                    ? 'Auction starts ' +
                      formatDistanceToNow(new Date(auction.startDate), { addSuffix: true })
                    : 'Auction ends ' +
                      formatDistanceToNow(new Date(auction.endDate), { addSuffix: true })}
                </p>
              </div>
              <p className="text-sm text-blue-700">
                {isAuctionEnded
                  ? 'This auction has concluded'
                  : !isAuctionLive
                  ? `Bidding will open on ${format(
                      new Date(auction.startDate),
                      'PPp'
                    )}`
                  : `Bidding will close on ${format(
                      new Date(auction.endDate),
                      'PPp'
                    )}`}
              </p>
            </div>
            
            {isAuctionLive ? (
              <div>
                <form onSubmit={handleBidSubmit}>
                  <div className="mb-4">
                    <label htmlFor="bidAmount" className="block text-sm font-medium text-gray-700 mb-1">
                      Your Bid Amount
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                      <input
                        type="number"
                        id="bidAmount"
                        value={bidAmount}
                        onChange={(e) => setBidAmount(parseFloat(e.target.value))}
                        min={auction.currentBid + auction.incrementAmount}
                        step={auction.incrementAmount}
                        className="w-full pl-8 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Minimum bid: ${(auction.currentBid + auction.incrementAmount).toLocaleString()}
                    </p>
                  </div>
                  
                  <button
                    type="submit"
                    className="w-full bg-blue-600 text-white font-medium py-3 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Place Bid
                  </button>
                </form>
              </div>
            ) : isAuctionEnded ? (
              <div className="bg-gray-100 p-4 rounded-lg text-center">
                <p className="text-gray-700 font-medium">
                  This auction has ended
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Winning bid: ${auction.currentBid.toLocaleString()}
                </p>
              </div>
            ) : (
              <div className="bg-gray-100 p-4 rounded-lg text-center">
                <p className="text-gray-700 font-medium">
                  Bidding hasn't started yet
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Starting bid: ${auction.startingBid.toLocaleString()}
                </p>
              </div>
            )}
            
            <div className="mt-6">
              <h3 className="font-semibold mb-2">Quick Information</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• Minimum bid increment: ${auction.incrementAmount.toLocaleString()}</li>
                <li>• All bids are binding and cannot be retracted</li>
                <li>• Winner will be contacted via email</li>
                <li>
                  • Questions?{' '}
                  <Link href="/contact" className="text-blue-600 hover:underline">
                    Contact support
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          
          {/* Similar Auctions */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="font-semibold mb-4">Similar Properties</h3>
            <p className="text-gray-500 text-sm">
              More properties like this coming soon...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}