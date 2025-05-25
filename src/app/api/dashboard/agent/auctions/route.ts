// src/app/api/dashboard/agent/auctions/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check authentication
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if user is an agent
    if (session.user.role !== 'AGENT') {
      return NextResponse.json({ error: 'Access denied. Agent role required.' }, { status: 403 });
    }
    
    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    
    // Get query parameters for filtering and pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status'); // UPCOMING, LIVE, ENDED, CANCELLED
    const search = searchParams.get('search');
    
    // Calculate skip for pagination
    const skip = (page - 1) * limit;
    
    // Build where clause
    const where = {
      sellerId: userId
    };
    
    // Add status filter if provided
    if (status && ['UPCOMING', 'LIVE', 'ENDED', 'CANCELLED'].includes(status)) {
      where.status = status;
    }
    
    // Add search filter if provided
    if (search && search.trim()) {
      where.OR = [
        {
          title: {
            contains: search.trim(),
            mode: 'insensitive'
          }
        },
        {
          description: {
            contains: search.trim(),
            mode: 'insensitive'
          }
        },
        {
          location: {
            contains: search.trim(),
            mode: 'insensitive'
          }
        }
      ];
    }
    
    // Get auctions with pagination
    const [auctions, totalCount] = await Promise.all([
      prisma.auction.findMany({
        where,
        select: {
          id: true,
          title: true,
          description: true,
          images: true,
          startingBid: true,
          reservePrice: true,
          currentBid: true,
          location: true,
          category: true,
          status: true,
          featured: true,
          startDate: true,
          endDate: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              bids: true,
              watchlist: true
            }
          }
        },
        orderBy: [
          { featured: 'desc' },
          { createdAt: 'desc' }
        ],
        skip,
        take: limit
      }),
      prisma.auction.count({ where })
    ]);
    
    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const hasMore = page < totalPages;
    
    // Get auction statistics for the agent
    const stats = await prisma.auction.groupBy({
      by: ['status'],
      where: { sellerId: userId },
      _count: {
        status: true
      }
    });
    
    // Format stats for easier frontend consumption
    const statusStats = {
      UPCOMING: 0,
      LIVE: 0,
      ENDED: 0,
      CANCELLED: 0,
      total: totalCount
    };
    
    stats.forEach(stat => {
      statusStats[stat.status] = stat._count.status;
    });
    
    // Get total bids across all agent's auctions
    const totalBidsResult = await prisma.bid.aggregate({
      where: {
        auction: {
          sellerId: userId
        }
      },
      _count: {
        id: true
      }
    });
    
    return NextResponse.json({
      success: true,
      data: auctions,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasMore,
        limit
      },
      stats: {
        ...statusStats,
        totalBids: totalBidsResult._count.id
      },
      filters: {
        status,
        search
      }
    });
    
  } catch (error) {
    console.error('Agent auctions API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch auctions. Please try again.' },
      { status: 500 }
    );
  }
}

// POST method for creating new auctions (if needed in the future)
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (session.user.role !== 'AGENT') {
      return NextResponse.json({ error: 'Access denied. Agent role required.' }, { status: 403 });
    }
    
    // This could be implemented later for quick auction creation
    // For now, redirect to the main auction creation flow
    return NextResponse.json({
      message: 'Use the main auction creation endpoint',
      redirect: '/auctions/create'
    }, { status: 200 });
    
  } catch (error) {
    console.error('Agent auction creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create auction. Please try again.' },
      { status: 500 }
    );
  }
}