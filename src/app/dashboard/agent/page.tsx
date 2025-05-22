// src/app/dashboard/agent/page.tsx
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function AgentDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [auctions, setAuctions] = useState([]);
  const [agentProfile, setAgentProfile] = useState(null);
  const [stats, setStats] = useState({
    activeAuctions: 0,
    upcomingAuctions: 0,
    completedAuctions: 0,
    totalAuctions: 0
  });
  
  useEffect(() => {
    // Check if user is authenticated and is an agent
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session.user.role !== 'AGENT') {
      router.push('/dashboard');
    } else if (status === 'authenticated') {
      // Fetch agent's auctions and profile
      fetchAgentData();
    }
  }, [status, session, router]);
  
  const fetchAgentData = async () => {
    try {
      // Fetch both auctions and profile in parallel
      const [auctionsResponse, profileResponse] = await Promise.all([
        fetch('/api/auctions/my-auctions'),
        fetch('/api/user/profile')
      ]);
      
      if (auctionsResponse.ok) {
        const data = await auctionsResponse.json();
        setAuctions(data.auctions || []);
        
        // Calculate stats
        const active = data.auctions.filter(a => a.status === 'LIVE').length;
        const upcoming = data.auctions.filter(a => a.status === 'UPCOMING').length;
        const completed = data.auctions.filter(a => a.status === 'ENDED').length;
        
        setStats({
          activeAuctions: active,
          upcomingAuctions: upcoming,
          completedAuctions: completed,
          totalAuctions: data.auctions.length
        });
      }
      
      if (profileResponse.ok) {
        const data = await profileResponse.json();
        setAgentProfile(data.user);
      }
    } catch (error) {
      console.error('Error fetching agent data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading || status === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="h-12 w-12 border-4 border-t-blue-600 border-gray-200 rounded-full animate-spin"></div>
      </div>
    );
  }
  
  // Use agent profile data if available, otherwise fall back to session data
  const profile = agentProfile || session?.user;
  
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Agent Dashboard</h1>
      
      {/* Agent Account Information */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-lg font-medium mb-2">Agent Account Information</h2>
        <p className="text-gray-700 mb-4">
          As a registered real estate agent, you can create and manage property auction listings.
          However, to maintain professional integrity and avoid conflicts of interest, 
          you cannot place bids on any auctions on this platform.
        </p>
        <p className="text-gray-700">
          Your role is to represent property sellers and manage the auction process.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-sm font-medium text-gray-500 mb-1">Active Auctions</h2>
          <p className="text-3xl font-bold text-blue-600">{stats.activeAuctions}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-sm font-medium text-gray-500 mb-1">Upcoming Auctions</h2>
          <p className="text-3xl font-bold text-amber-600">{stats.upcomingAuctions}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-sm font-medium text-gray-500 mb-1">Completed Auctions</h2>
          <p className="text-3xl font-bold text-green-600">{stats.completedAuctions}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-sm font-medium text-gray-500 mb-1">Total Auctions</h2>
          <p className="text-3xl font-bold text-gray-700">{stats.totalAuctions}</p>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">Your Auctions</h2>
          <Link href="/auctions/create" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            Create New Auction
          </Link>
        </div>
        
        {auctions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Property
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Bid
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    End Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {auctions.map((auction) => (
                  <tr key={auction.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {auction.images && auction.images[0] ? (
                            <img
                              className="h-10 w-10 rounded-md object-cover"
                              src={auction.images[0]}
                              alt={auction.title}
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-md bg-gray-200" />
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {auction.title}
                          </div>
                          <div className="text-sm text-gray-500">
                            {auction.location}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">${auction.currentBid.toLocaleString()}</div>
                      <div className="text-xs text-gray-500">Started: ${auction.startingBid.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${auction.status === 'LIVE' ? 'bg-green-100 text-green-800' : 
                          auction.status === 'UPCOMING' ? 'bg-blue-100 text-blue-800' : 
                          'bg-gray-100 text-gray-800'}`}
                      >
                        {auction.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(auction.endDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link
                        href={`/auctions/${auction.id}`}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        View
                      </Link>
                      <Link
                        href={`/auctions/${auction.id}/edit`}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-gray-500 mb-4">You haven't created any auctions yet</p>
            <p className="text-gray-400 text-sm mb-6">Start by creating your first auction listing</p>
            <Link
              href="/auctions/create"
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Create Your First Auction
            </Link>
          </div>
        )}
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">Agent Profile</h2>
          <Link
            href="/dashboard/agent/profile"
            className="text-blue-600 hover:underline"
          >
            Edit Profile
          </Link>
        </div>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Company/Brokerage</h3>
            <p className="mt-1">{profile?.companyName || 'Not specified'}</p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-500">License Number</h3>
            <p className="mt-1">{profile?.licenseNumber || 'Not specified'}</p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-500">License State</h3>
            <p className="mt-1">{profile?.licenseState || 'Not specified'}</p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-500">Business Address</h3>
            <p className="mt-1">{profile?.businessAddress || 'Not specified'}</p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-500">Business Phone</h3>
            <p className="mt-1">{profile?.businessPhone || 'Not specified'}</p>
          </div>
          
          {profile?.website && (
            <div>
              <h3 className="text-sm font-medium text-gray-500">Website</h3>
              <p className="mt-1">
                <a 
                  href={profile.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {profile.website}
                </a>
              </p>
            </div>
          )}
          
          {profile?.bio && (
            <div>
              <h3 className="text-sm font-medium text-gray-500">Bio</h3>
              <p className="mt-1">{profile.bio}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}