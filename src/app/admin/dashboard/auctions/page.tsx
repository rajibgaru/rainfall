// src/app/admin/dashboard/auctions/page.tsx
'use client'

import { useState, useEffect } from 'react'

interface Auction {
  id: string
  title: string
  description: string
  location: string
  currentBid: number
  startingBid: number
  reservePrice: number
  status: 'UPCOMING' | 'LIVE' | 'ENDED' | 'CANCELLED'
  startDate: string
  endDate: string
  category: string
  featured: boolean
  seller: {
    name: string
    email: string
    role: string
  }
  _count: {
    bids: number
    watchlist: number
  }
  createdAt: string
}

export default function AdminAuctions() {
  const [auctions, setAuctions] = useState<Auction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedAuctions, setSelectedAuctions] = useState<string[]>([])

  const toggleAuctionSelection = (auctionId: string) => {
    setSelectedAuctions(prev => 
      prev.includes(auctionId) 
        ? prev.filter(id => id !== auctionId)
        : [...prev, auctionId]
    )
  }

  const toggleAllAuctions = () => {
    if (selectedAuctions.length === filteredAuctions.length) {
      setSelectedAuctions([])
    } else {
      setSelectedAuctions(filteredAuctions.map(auction => auction.id))
    }
  }

  const bulkDeleteAuctions = async () => {
    if (selectedAuctions.length === 0) {
      alert('No auctions selected')
      return
    }

    const selectedAuctionDetails = auctions.filter(a => selectedAuctions.includes(a.id))
    const auctionsWithBids = selectedAuctionDetails.filter(a => a._count.bids > 0)
    
    const confirmMessage = `⚠️ BULK DELETE CONFIRMATION ⚠️

You are about to delete ${selectedAuctions.length} auction(s):

${selectedAuctionDetails.map(a => `• ${a.title} (${a.status}, ${a._count.bids} bids)`).join('\n')}

${auctionsWithBids.length > 0 ? 
  `\n⚠️ WARNING: ${auctionsWithBids.length} auction(s) have bids that will be removed.\n` : 
  ''
}

Type "DELETE ALL" to confirm:`

    const userConfirmation = prompt(confirmMessage)
    
    if (userConfirmation !== 'DELETE ALL') {
      return
    }

    try {
      setLoading(true)
      const results = []
      
      // Delete auctions one by one (could be optimized with Promise.all but this gives better error handling)
      for (const auctionId of selectedAuctions) {
        try {
          const response = await fetch(`/api/admin/auctions/${auctionId}`, {
            method: 'DELETE'
          })
          
          if (response.ok) {
            results.push({ id: auctionId, success: true })
          } else {
            const error = await response.json()
            results.push({ id: auctionId, success: false, error: error.error })
          }
        } catch (error) {
          results.push({ id: auctionId, success: false, error: error.message })
        }
      }
      
      // Update local state - remove successfully deleted auctions
      const successfullyDeleted = results.filter(r => r.success).map(r => r.id)
      setAuctions(auctions.filter(auction => !successfullyDeleted.includes(auction.id)))
      setSelectedAuctions([])
      
      // Show results
      const successful = results.filter(r => r.success).length
      const failed = results.filter(r => !r.success).length
      
      let message = `✅ Bulk delete completed!\n\n`
      message += `• Successfully deleted: ${successful} auction(s)\n`
      if (failed > 0) {
        message += `• Failed to delete: ${failed} auction(s)\n\n`
        message += 'Failed deletions:\n'
        results.filter(r => !r.success).forEach(r => {
          const auction = selectedAuctionDetails.find(a => a.id === r.id)
          message += `• ${auction?.title || r.id}: ${r.error}\n`
        })
      }
      
      alert(message)
      
    } catch (error) {
      console.error('Error in bulk delete:', error)
      alert('Error during bulk delete: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAuctions()
  }, [])

  const fetchAuctions = async () => {
    try {
      console.log('Fetching auctions from /api/admin/auctions...')
      const response = await fetch('/api/admin/auctions')
      
      console.log('Response status:', response.status)
      console.log('Response ok:', response.ok)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Error response:', errorText)
        throw new Error(`Failed to fetch auctions: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('Received auctions data:', data)
      setAuctions(data)
      setError('') // Clear any previous errors
    } catch (err) {
      console.error('Full error object:', err)
      setError(`Failed to load auctions: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const updateAuctionStatus = async (auctionId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/auctions/${auctionId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update auction status')
      }

      const data = await response.json()
      
      setAuctions(auctions.map(auction => 
        auction.id === auctionId 
          ? { ...auction, status: newStatus as any }
          : auction
      ))

      // Show success message (you can add a toast notification here)
      console.log('Auction status updated successfully')
      
    } catch (error) {
      console.error('Error updating auction status:', error)
      alert(`Error: ${error.message}`)
    }
  }

  const toggleFeatured = async (auctionId: string, featured: boolean) => {
    try {
      const response = await fetch(`/api/admin/auctions/${auctionId}/featured`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featured: !featured })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update featured status')
      }

      const data = await response.json()
      
      setAuctions(auctions.map(auction => 
        auction.id === auctionId 
          ? { ...auction, featured: !featured }
          : auction
      ))

      // Show success message
      console.log('Featured status updated successfully')
      
    } catch (error) {
      console.error('Error toggling featured status:', error)
      alert(`Error: ${error.message}`)
    }
  }

  const deleteAuction = async (auctionId: string) => {
    const auction = auctions.find(a => a.id === auctionId)
    
    if (!auction) {
      alert('Auction not found')
      return
    }

    // Enhanced confirmation dialog with auction details
    const confirmMessage = `⚠️ DELETE AUCTION CONFIRMATION ⚠️

Auction: "${auction.title}"
Location: ${auction.location}
Current Bid: ${auction.currentBid.toLocaleString()}
Status: ${auction.status}
Bids: ${auction._count.bids}
Watchers: ${auction._count.watchlist}

This action cannot be undone!

${auction._count.bids > 0 ? 
  `⚠️ WARNING: This auction has ${auction._count.bids} bid(s). Deleting will remove all bids and notify bidders.` : 
  ''
}

Type "DELETE" to confirm:`

    const userConfirmation = prompt(confirmMessage)
    
    if (userConfirmation !== 'DELETE') {
      console.log('Deletion cancelled by user')
      return
    }

    try {
      setLoading(true)
      
      const response = await fetch(`/api/admin/auctions/${auctionId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete auction')
      }

      // Remove auction from local state
      setAuctions(auctions.filter(auction => auction.id !== auctionId))
      
      // Show success message with details
      const successMessage = `✅ Auction deleted successfully!

${data.details.auctionTitle}
• ${data.details.bidsRemoved} bids removed
• ${data.details.watchlistRemoved} watchlist entries removed
• ${data.details.notificationsRemoved} notifications cleaned up`

      alert(successMessage)
      
      console.log('Auction deleted successfully:', data)
      
    } catch (error) {
      console.error('Error deleting auction:', error)
      
      // Show user-friendly error message
      let errorMessage = 'Failed to delete auction: ' + error.message
      
      if (error.message.includes('existing bids')) {
        errorMessage = `❌ Cannot Delete Auction

This auction has active bids and cannot be deleted.

Options:
1. Cancel the auction instead of deleting
2. Wait for auction to end naturally
3. Contact bidders before taking action

Reason: ${error.message}`
      }
      
      alert(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const filteredAuctions = auctions.filter(auction => {
    const matchesFilter = filter === 'all' || auction.status.toLowerCase() === filter.toLowerCase()
    const matchesSearch = auction.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         auction.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         auction.seller.name.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'LIVE': return 'bg-green-100 text-green-800'
      case 'UPCOMING': return 'bg-yellow-100 text-yellow-800'
      case 'ENDED': return 'bg-gray-100 text-gray-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          {error}
          <button 
            onClick={() => {
              setError('')
              setLoading(true)
              fetchAuctions()
            }}
            className="ml-4 text-red-800 underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Bulk Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Auction Management</h1>
          <p className="mt-2 text-gray-600">
            Manage all auctions on your platform
          </p>
        </div>
        <div className="flex space-x-3">
          {selectedAuctions.length > 0 && (
            <button 
              onClick={bulkDeleteAuctions}
              disabled={loading}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              Delete Selected ({selectedAuctions.length})
            </button>
          )}
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            Create New Auction
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search auctions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="upcoming">Upcoming</option>
            <option value="live">Live</option>
            <option value="ended">Ended</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-blue-600">
            {auctions.filter(a => a.status === 'LIVE').length}
          </div>
          <div className="text-sm text-gray-600">Live Auctions</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-yellow-600">
            {auctions.filter(a => a.status === 'UPCOMING').length}
          </div>
          <div className="text-sm text-gray-600">Upcoming</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-gray-600">
            {auctions.filter(a => a.status === 'ENDED').length}
          </div>
          <div className="text-sm text-gray-600">Completed</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-green-600">
            {auctions.filter(a => a.featured).length}
          </div>
          <div className="text-sm text-gray-600">Featured</div>
        </div>
      </div>

      {/* Auctions Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <input 
                  type="checkbox" 
                  className="rounded"
                  checked={filteredAuctions.length > 0 && selectedAuctions.length === filteredAuctions.length}
                  onChange={toggleAllAuctions}
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Auction Details
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Seller
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Bids
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Current Bid
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAuctions.map((auction) => (
              <tr key={auction.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <input 
                    type="checkbox" 
                    className="rounded"
                    checked={selectedAuctions.includes(auction.id)}
                    onChange={() => toggleAuctionSelection(auction.id)}
                  />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-lg bg-gray-200 flex items-center justify-center">
                        <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900 flex items-center">
                        {auction.title}
                        {auction.featured && (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Featured
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">{auction.location}</div>
                      <div className="text-sm text-gray-500">{auction.category}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{auction.seller.name}</div>
                  <div className="text-sm text-gray-500">{auction.seller.email}</div>
                  <div className="text-xs text-gray-400">{auction.seller.role}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{auction._count.bids} bids</div>
                  <div className="text-sm text-gray-500">{auction._count.watchlist} watching</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    ${auction.currentBid.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500">
                    Reserve: ${auction.reservePrice.toLocaleString()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(auction.status)}`}>
                    {auction.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => toggleFeatured(auction.id, auction.featured)}
                      className="text-yellow-600 hover:text-yellow-900"
                      title={auction.featured ? 'Remove from featured' : 'Mark as featured'}
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </button>
                    <select
                      value={auction.status}
                      onChange={(e) => updateAuctionStatus(auction.id, e.target.value)}
                      className="text-xs border border-gray-300 rounded px-2 py-1"
                    >
                      <option value="UPCOMING">Upcoming</option>
                      <option value="LIVE">Live</option>
                      <option value="ENDED">Ended</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                    <button className="text-blue-600 hover:text-blue-900">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    <button 
                      onClick={() => deleteAuction(auction.id)}
                      disabled={loading}
                      className={`text-red-600 hover:text-red-900 disabled:opacity-50 ${
                        auction._count.bids > 0 && (auction.status === 'LIVE' || auction.status === 'ENDED')
                          ? 'cursor-not-allowed opacity-50' 
                          : ''
                      }`}
                      title={
                        auction._count.bids > 0 && (auction.status === 'LIVE' || auction.status === 'ENDED')
                          ? `Cannot delete ${auction.status.toLowerCase()} auction with ${auction._count.bids} bids. Cancel auction instead.`
                          : `Delete auction "${auction.title}"`
                      }
                    >
                      {auction._count.bids > 0 && (auction.status === 'LIVE' || auction.status === 'ENDED') ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredAuctions.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No auctions found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filter !== 'all' ? 'Try adjusting your search or filter criteria.' : 'Get started by creating a new auction.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}