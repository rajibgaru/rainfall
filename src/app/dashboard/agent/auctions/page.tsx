'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Building, Clock, AlertCircle, Plus, Eye, Edit, Trash2, Users, DollarSign } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'react-hot-toast';

export default function AgentAuctionsPage() {
  const { data: session } = useSession();
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'live', 'upcoming', 'ended'
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [auctionToDelete, setAuctionToDelete] = useState(null);

  useEffect(() => {
    fetchAgentAuctions();
  }, []);

  const fetchAgentAuctions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/dashboard/agent/auctions');
      
      if (!response.ok) {
        throw new Error('Failed to fetch auctions');
      }
      
      const data = await response.json();
      setAuctions(data.auctions || []);
    } catch (error) {
      console.error('Error fetching auctions:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAuction = async () => {
    if (!auctionToDelete) return;
    
    try {
      const response = await fetch(`/api/auctions/${auctionToDelete}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete auction');
      }
      
      // Remove the auction from the list
      setAuctions(auctions.filter(auction => auction.id !== auctionToDelete));
      
      // Show success message
      toast.success('Auction deleted successfully');
      
      // Close the modal
      setShowDeleteModal(false);
      setAuctionToDelete(null);
    } catch (error) {
      console.error('Error deleting auction:', error);
      toast.error('Failed to delete auction');
    }
  };

  // Function to confirm deletion
  const confirmDelete = (auctionId) => {
    setAuctionToDelete(auctionId);
    setShowDeleteModal(true);
  };

  // Filter auctions based on selected filter
  const filteredAuctions = auctions.filter(auction => {
    if (filter === 'all') return true;
    return auction.status.toLowerCase() === filter.toLowerCase();
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
          onClick={fetchAgentAuctions}
          className="mt-2 px-3 py-1 bg-red-100 text-red-800 rounded text-sm"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="text-2xl font-bold">My Auctions</h1>
        
        <Link 
          href="/auctions/create" 
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={18} className="mr-2" />
          Create New Auction
        </Link>
      </div>
      
      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">Total Auctions</div>
              <div className="text-2xl font-bold">{auctions.length}</div>
            </div>
            <div className="p-3 bg-blue-100 rounded-full text-blue-600">
              <Building size={20} />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">Active Auctions</div>
              <div className="text-2xl font-bold">{auctions.filter(a => a.status === 'LIVE').length}</div>
            </div>
            <div className="p-3 bg-green-100 rounded-full text-green-600">
              <Clock size={20} />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">Total Bids</div>
              <div className="text-2xl font-bold">
                {auctions.reduce((total, auction) => total + (auction._count?.bids || 0), 0)}
              </div>
            </div>
            <div className="p-3 bg-purple-100 rounded-full text-purple-600">
              <Users size={20} />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">Total Value</div>
              <div className="text-2xl font-bold">
                ${auctions.reduce((total, auction) => total + (auction.currentBid || auction.startingBid || 0), 0).toLocaleString()}
              </div>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full text-yellow-600">
              <DollarSign size={20} />
            </div>
          </div>
        </div>
      </div>
      
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
      
      {filteredAuctions.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Building size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">No auctions found</h3>
          <p className="text-gray-500 mb-4">Get started by creating your first auction.</p>
          <Link 
            href="/auctions/create" 
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus size={18} className="mr-2" />
            Create New Auction
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Property
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Bid
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bids
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredAuctions.map((auction) => (
                <tr key={auction.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0 relative rounded overflow-hidden">
                        <Image
                          src={auction.images?.[0] || '/images/placeholder.jpg'}
                          alt={auction.title || 'Property'}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{auction.title}</div>
                        <div className="text-xs text-gray-500">{auction.location}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      auction.status === 'LIVE' 
                        ? 'bg-green-100 text-green-800' 
                        : auction.status === 'UPCOMING'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                    }`}>
                      {auction.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      ${(auction.currentBid || auction.startingBid || 0).toLocaleString()}
                    </div>
                    {auction.reservePrice > 0 && (
                      <div className="text-xs text-gray-500">
                        Reserve: ${auction.reservePrice.toLocaleString()}
                        {auction.currentBid >= auction.reservePrice && (
                          <span className="ml-1 text-green-600">(Met)</span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {auction._count?.bids || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {auction.status === 'LIVE' && (
                        <span className="text-green-600">
                          Ends {new Date(auction.endDate).toLocaleDateString()}
                        </span>
                      )}
                      {auction.status === 'UPCOMING' && (
                        <span className="text-yellow-600">
                          Starts {new Date(auction.startDate).toLocaleDateString()}
                        </span>
                      )}
                      {auction.status === 'ENDED' && (
                        <span className="text-gray-600">
                          Ended {new Date(auction.endDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <Link 
                        href={`/auctions/${auction.id}`} 
                        className="text-blue-600 hover:text-blue-900"
                        title="View"
                      >
                        <Eye size={18} />
                      </Link>
                      
                      {auction.status === 'UPCOMING' && (
                        <Link 
                          href={`/auctions/${auction.id}/edit`} 
                          className="text-yellow-600 hover:text-yellow-900"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </Link>
                      )}
                      
                      {auction.status === 'UPCOMING' && (
                        <button
                          onClick={() => confirmDelete(auction.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Confirm Deletion</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this auction? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAuction}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete Auction
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}