// src/app/api/dashboard/activity/route.ts
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

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const userId = session.user.id;

    // Get recent activities from various sources
    const activities = [];

    // Recent bids
    const recentBids = await prisma.bid.findMany({
      where: { bidderId: userId },
      include: {
        auction: {
          select: { title: true, location: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    recentBids.forEach(bid => {
      activities.push({
        id: `bid-${bid.id}`,
        type: 'BID_PLACED',
        title: 'Bid Placed',
        message: `You placed a bid of $${bid.amount.toLocaleString()} on "${bid.auction.title}"`,
        createdAt: bid.createdAt,
        relatedId: bid.auctionId,
      });
    });

    // Recent watchlist additions
    const recentWatchlist = await prisma.watchlist.findMany({
      where: { userId },
      include: {
        auction: {
          select: { title: true, location: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    recentWatchlist.forEach(watch => {
      activities.push({
        id: `watch-${watch.id}`,
        type: 'WATCHLIST_ADDED',
        title: 'Added to Watchlist',
        message: `You added "${watch.auction.title}" to your watchlist`,
        createdAt: watch.createdAt,
        relatedId: watch.auctionId,
      });
    });

    // Check for won auctions
    const wonAuctions = await prisma.auction.findMany({
      where: {
        status: 'ENDED',
        bids: {
          some: {
            bidderId: userId
          }
        }
      },
      include: {
        bids: {
          where: { bidderId: userId },
          orderBy: { amount: 'desc' },
          take: 1
        }
      },
      orderBy: { endDate: 'desc' },
      take: limit,
    });

    // Filter for auctions where user actually won
    const actualWonAuctions = await Promise.all(
      wonAuctions.map(async (auction) => {
        const highestBid = await prisma.bid.findFirst({
          where: { auctionId: auction.id },
          orderBy: { amount: 'desc' },
          include: { bidder: true }
        });
        
        if (highestBid?.bidderId === userId) {
          return { auction, winningBid: highestBid };
        }
        return null;
      })
    );

    actualWonAuctions
      .filter(result => result !== null)
      .forEach(result => {
        activities.push({
          id: `won-${result!.auction.id}`,
          type: 'AUCTION_WON',
          title: 'Auction Won!',
          message: `Congratulations! You won "${result!.auction.title}" with a bid of $${result!.winningBid.amount.toLocaleString()}`,
          createdAt: result!.auction.endDate,
          relatedId: result!.auction.id,
        });
      });

    // Sort all activities by date and limit
    const sortedActivities = activities
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);

    return NextResponse.json({
      activities: sortedActivities,
      total: sortedActivities.length,
    });

  } catch (error) {
    console.error('Error fetching dashboard activity:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}