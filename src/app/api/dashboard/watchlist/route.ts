// src/app/api/dashboard/watchlist/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth'; // Adjust path as needed
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Get the user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status'); // 'active', 'ended', 'upcoming'
    
    const skip = (page - 1) * limit;

    // Base query for user's watchlist
    const whereClause: any = {
      userId: session.user.id,
    };

    // Filter by auction status if provided
    if (status) {
      whereClause.auction = {
        status: status.toUpperCase()
      };
    }

    // Get user's watchlist with auction details
    const watchlistItems = await prisma.watchlist.findMany({
      where: whereClause,
      include: {
        auction: {
          include: {
            bids: {
              where: { bidderId: session.user.id },
              orderBy: { amount: 'desc' },
            },
            _count: {
              select: { bids: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    // Get total count for pagination
    const totalCount = await prisma.watchlist.count({
      where: whereClause,
    });

    // Transform the data to include additional info
    const transformedWatchlist = watchlistItems.map(item => {
      const auction = item.auction;
      const userBids = auction.bids;
      const highestUserBid = userBids.length > 0 ? userBids[0] : null;
      
      return {
        id: item.id,
        addedAt: item.createdAt,
        auction: {
          id: auction.id,
          title: auction.title,
          description: auction.description,
          location: auction.location,
          category: auction.category,
          images: auction.images,
          status: auction.status,
          startDate: auction.startDate,
          endDate: auction.endDate,
          currentBid: auction.currentBid,
          startingBid: auction.startingBid,
          reservePrice: auction.reservePrice,
          incrementAmount: auction.incrementAmount,
          featured: auction.featured,
          totalBids: auction._count.bids,
        },
        userBids: {
          count: userBids.length,
          highest: highestUserBid?.amount || null,
          latest: userBids.length > 0 ? userBids[userBids.length - 1] : null,
        },
        isActive: auction.status === 'LIVE',
        isUpcoming: auction.status === 'UPCOMING',
        isEnded: auction.status === 'ENDED',
        timeLeft: auction.status === 'LIVE' ? 
          Math.max(0, new Date(auction.endDate).getTime() - Date.now()) : null,
      };
    });

    // Group watchlist by status for summary
    const summary = {
      active: transformedWatchlist.filter(item => item.isActive).length,
      upcoming: transformedWatchlist.filter(item => item.isUpcoming).length,
      ended: transformedWatchlist.filter(item => item.isEnded).length,
      total: totalCount,
    };

    return NextResponse.json({
      watchlist: transformedWatchlist,
      summary,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });

  } catch (error) {
    console.error('Error fetching dashboard watchlist:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Add item to watchlist
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { auctionId } = await request.json();

    if (!auctionId) {
      return NextResponse.json(
        { error: 'Auction ID is required' },
        { status: 400 }
      );
    }

    // Check if auction exists
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId }
    });

    if (!auction) {
      return NextResponse.json(
        { error: 'Auction not found' },
        { status: 404 }
      );
    }

    // Check if already in watchlist
    const existingWatchlist = await prisma.watchlist.findUnique({
      where: {
        userId_auctionId: {
          userId: session.user.id,
          auctionId: auctionId
        }
      }
    });

    if (existingWatchlist) {
      return NextResponse.json(
        { error: 'Auction already in watchlist' },
        { status: 409 }
      );
    }

    // Add to watchlist
    const watchlistItem = await prisma.watchlist.create({
      data: {
        userId: session.user.id,
        auctionId: auctionId,
      },
      include: {
        auction: true
      }
    });

    return NextResponse.json({
      message: 'Added to watchlist successfully',
      watchlistItem,
    }, { status: 201 });

  } catch (error) {
    console.error('Error adding to watchlist:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Remove item from watchlist
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const auctionId = searchParams.get('auctionId');
    const watchlistId = searchParams.get('id');

    if (!auctionId && !watchlistId) {
      return NextResponse.json(
        { error: 'Auction ID or Watchlist ID is required' },
        { status: 400 }
      );
    }

    let whereClause: any = { userId: session.user.id };

    if (watchlistId) {
      whereClause.id = watchlistId;
    } else if (auctionId) {
      whereClause.auctionId = auctionId;
    }

    // Check if watchlist item exists
    const watchlistItem = await prisma.watchlist.findFirst({
      where: whereClause
    });

    if (!watchlistItem) {
      return NextResponse.json(
        { error: 'Watchlist item not found' },
        { status: 404 }
      );
    }

    // Remove from watchlist
    await prisma.watchlist.delete({
      where: { id: watchlistItem.id }
    });

    return NextResponse.json({
      message: 'Removed from watchlist successfully',
    });

  } catch (error) {
    console.error('Error removing from watchlist:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}