'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Award, AlertCircle, DollarSign, Phone, Mail, Building, MapPin, CalendarCheck } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function WonAuctionsPage() {
  const { data: session } = useSession();
  const [wonAuctions, setWonAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchWonAuctions();
  }, []);

  const fetchWonAuctions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/dashboard/won-auctions');
      
      if (!response.ok) {
        throw new Error('Failed to fetch won auctions');
      }
      
      const data = await response.json();
      setWonAuctions(data.auctions || []);
    } catch (error) {
      console.error('Error fetching won auctions:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

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
          onClick={fetchWonAuctions}
          className="mt-2 px-3 py-1 bg-red-100 text-red-800 rounded text-sm"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Won Auctions</h1>
      
      {wonAuctions.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Award size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">No auctions won yet</h3>
          <p className="text-gray-500 mb-4">
            Keep bidding! When you win an auction, you'll see details about your purchase here.
          </p>
          <Link 
            href="/auctions?status=LIVE" 
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            View Live Auctions
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {wonAuctions.map((auction) => (
            <div 
              key={auction.id} 
              className="bg-white rounded-lg shadow-sm border border-green-200 overflow-hidden"
            >
              <div className="p-4 bg-green-50 border-b border-green-200 flex items-center justify-between">
                <div className="flex items-center">
                  <Award size={20} className="text-green-600 mr-2" />
                  <h3 className="font-bold text-green-800">Auction Won</h3>
                </div>
                <div className="text-sm text-green-700">
                  Won on {new Date(auction.endDate).toLocaleDateString()}
                </div>
              </div>
              
              <div className="flex flex-col md:flex-row">
                {/* Auction Image */}
                <div className="md:w-56 h-48 md:h-auto relative">
                  <Image
                    src={auction.images?.[0] || '/images/placeholder.jpg'}
                    alt={auction.title || 'Property'}
                    fill
                    className="object-cover"
                  />
                </div>
                
                {/* Auction Details */}
                <div className="flex-grow p-4">
                  <h2 className="text-xl font-bold mb-2">{auction.title}</h2>
                  
                  <div className="flex items-center text-gray-600 mb-3">
                    <MapPin size={16} className="mr-1" />
                    <span className="text-sm">{auction.location}</span>
                  </div>
                  
                  <div className="mb-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Property Details</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                      {auction.propertyDetails?.beds && (
                        <div className="bg-gray-50 rounded p-2">
                          <div className="font-medium">{auction.propertyDetails.beds}</div>
                          <div className="text-xs text-gray-500">Bedrooms</div>
                        </div>
                      )}
                      {auction.propertyDetails?.baths && (
                        <div className="bg-gray-50 rounded p-2">
                          <div className="font-medium">{auction.propertyDetails.baths}</div>
                          <div className="text-xs text-gray-500">Bathrooms</div>
                        </div>
                      )}
                      {auction.propertyDetails?.sqft && (
                        <div className="bg-gray-50 rounded p-2">
                          <div className="font-medium">{Number(auction.propertyDetails.sqft).toLocaleString()}</div>
                          <div className="text-xs text-gray-500">Sq Ft</div>
                        </div>
                      )}
                      {auction.propertyDetails?.yearBuilt && (
                        <div className="bg-gray-50 rounded p-2">
                          <div className="font-medium">{auction.propertyDetails.yearBuilt}</div>
                          <div className="text-xs text-gray-500">Year Built</div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Next Steps</h4>
                    <ol className="list-decimal pl-5 text-sm text-gray-600 space-y-1">
                      <li>Our team will contact you to arrange payment</li>
                      <li>Complete the transaction within 7 days</li>
                      <li>Coordinate with the seller for property transfer</li>
                    </ol>
                  </div>
                </div>
                
                {/* Bid Information */}
                <div className="md:w-64 p-4 bg-gray-50 md:border-l border-gray-200 flex flex-col justify-center">
                  <div className="mb-4">
                    <div className="text-sm text-gray-500">Your Winning Bid</div>
                    <div className="text-2xl font-bold text-green-600">
                      ${auction.currentBid?.toLocaleString() || '0'}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Bid placed on {new Date(auction.bids?.[0]?.createdAt || auction.endDate).toLocaleDateString()}
                    </div>
                  </div>
                  
                  {auction.seller && (
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-2">Seller Contact</div>
                      <div className="space-y-2">
                        <div className="flex items-center text-sm">
                          <Building size={14} className="mr-2 text-gray-500" />
                          <span>{auction.seller.name || auction.seller.companyName || 'Seller'}</span>
                        </div>
                        {auction.seller.email && (
                          <div className="flex items-center text-sm">
                            <Mail size={14} className="mr-2 text-gray-500" />
                            <a href={`mailto:${auction.seller.email}`} className="text-blue-600 hover:underline">
                              {auction.seller.email}
                            </a>
                          </div>
                        )}
                        {auction.seller.phone && (
                          <div className="flex items-center text-sm">
                            <Phone size={14} className="mr-2 text-gray-500" />
                            <a href={`tel:${auction.seller.phone}`} className="text-blue-600 hover:underline">
                              {auction.seller.phone}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-4">
                    <Link 
                      href={`/auctions/${auction.id}`}
                      className="w-full inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                    >
                      View Auction Details
                    </Link>
                  </div>
                </div>
              </div>
              
              {/* Payment Schedule */}
              <div className="p-4 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center mb-2">
                  <CalendarCheck size={16} className="mr-2 text-blue-600" />
                  <h4 className="font-medium text-gray-800">Payment Schedule</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="bg-white p-3 rounded border border-gray-200">
                    <div className="font-medium">Deposit Due</div>
                    <div className="text-gray-600">
                      {new Date(new Date(auction.endDate).getTime() + 2 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                    </div>
                    <div className="text-blue-600 font-medium mt-1">
                      ${(auction.currentBid * 0.1).toLocaleString()} (10%)
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded border border-gray-200">
                    <div className="font-medium">Final Payment</div>
                    <div className="text-gray-600">
                      {new Date(new Date(auction.endDate).getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                    </div>
                    <div className="text-blue-600 font-medium mt-1">
                      ${(auction.currentBid * 0.9).toLocaleString()} (90%)
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded border border-gray-200">
                    <div className="font-medium">Total Amount</div>
                    <div className="text-gray-600">
                      Final Bid + Buyer's Premium
                    </div>
                    <div className="text-blue-600 font-medium mt-1">
                      ${auction.currentBid.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}