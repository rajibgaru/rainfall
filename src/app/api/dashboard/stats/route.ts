// src/app/api/dashboard/stats/route.ts
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

    const userId = session.user.id;
    const now = new Date();

    // Get active bid count (bids on live auctions)
    const activeBidCount = await prisma.bid.count({
      where: {
        bidderId: userId,
        auction: {
          status: 'LIVE',
          endDate: { gt: now }
        }
      }
    });

    // Get watchlist count
    const watchlistCount = await prisma.watchlist.count({
      where: { userId }
    });

    // Get won auctions and calculate total spent
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
          orderBy: { amount: 'desc' },
          take: 1
        }
      }
    });

    // Filter auctions where user actually won (has the highest bid)
    const actuallyWonAuctions = wonAuctions.filter(auction => 
      auction.bids[0]?.bidderId === userId
    );

    const wonAuctionCount = actuallyWonAuctions.length;
    const totalSpent = actuallyWonAuctions.reduce((sum, auction) => 
      sum + (auction.bids[0]?.amount || 0), 0
    );

    return NextResponse.json({
      activeBidCount,
      watchlistCount,
      totalSpent,
      wonAuctionCount,
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}