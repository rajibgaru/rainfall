// src/app/api/admin/dashboard-stats/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
// import { authOptions } from '@/app/api/auth/[...nextauth]/route' // Uncomment when you have NextAuth set up
// import { prisma } from '@/lib/prisma' // Uncomment when you have Prisma set up

export async function GET(request: NextRequest) {
  try {
    // Temporary: Skip auth check for testing
    // TODO: Uncomment when NextAuth is fully configured
    /*
    const session = await getServerSession(authOptions)
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    */

    // Mock data for testing - replace with real Prisma queries when ready
    const mockStats = {
      totalUsers: 1250,
      totalAuctions: 342,
      activeAuctions: 28,
      pendingAgents: 15,
      totalBids: 4890,
      recentAuctions: [
        {
          id: '1',
          title: 'Modern Downtown Condo',
          location: 'New York, NY',
          currentBid: 850000,
          status: 'LIVE',
          seller: {
            name: 'John Smith',
            email: 'john@example.com'
          },
          _count: {
            bids: 12
          }
        },
        {
          id: '2',
          title: 'Suburban Family Home',
          location: 'Austin, TX',
          currentBid: 420000,
          status: 'UPCOMING',
          seller: {
            name: 'Sarah Johnson',
            email: 'sarah@example.com'
          },
          _count: {
            bids: 8
          }
        },
        {
          id: '3',
          title: 'Luxury Beachfront Property',
          location: 'Miami, FL',
          currentBid: 1200000,
          status: 'LIVE',
          seller: {
            name: 'Mike Davis',
            email: 'mike@example.com'
          },
          _count: {
            bids: 25
          }
        },
        {
          id: '4',
          title: 'Historic Victorian House',
          location: 'San Francisco, CA',
          currentBid: 950000,
          status: 'ENDED',
          seller: {
            name: 'Emily Chen',
            email: 'emily@example.com'
          },
          _count: {
            bids: 18
          }
        },
        {
          id: '5',
          title: 'Mountain Cabin Retreat',
          location: 'Denver, CO',
          currentBid: 320000,
          status: 'UPCOMING',
          seller: {
            name: 'Robert Wilson',
            email: 'robert@example.com'
          },
          _count: {
            bids: 5
          }
        }
      ]
    }

    return NextResponse.json(mockStats)

    /* 
    // Real Prisma queries - uncomment when Prisma is set up
    const [
      totalUsers,
      totalAuctions,
      activeAuctions,
      pendingAgents,
      totalBids,
      recentAuctions
    ] = await Promise.all([
      prisma.user.count(),
      prisma.auction.count(),
      prisma.auction.count({
        where: { status: 'LIVE' }
      }),
      prisma.user.count({
        where: { 
          role: 'AGENT',
          isVerified: false 
        }
      }),
      prisma.bid.count(),
      prisma.auction.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          seller: {
            select: { name: true, email: true }
          },
          _count: {
            select: { bids: true }
          }
        }
      })
    ])

    const stats = {
      totalUsers,
      totalAuctions,
      activeAuctions,
      pendingAgents,
      totalBids,
      recentAuctions
    }

    return NextResponse.json(stats)
    */

  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}