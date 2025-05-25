// src/app/api/dashboard/bids/route.ts
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
    const status = searchParams.get('status'); // 'active', 'won', 'lost'
    
    const skip = (page - 1) * limit;

    // Base query to get user's bids with auction details
    const whereClause: any = {
      bidderId: session.user.id,
    };

    // Filter by status if provided
    if (status) {
      const now = new Date();
      
      switch (status) {
        case 'active':
          whereClause.auction = {
            status: 'LIVE',
            endDate: { gt: now }
          };
          break;
        case 'won':
          whereClause.auction = {
            status: 'ENDED',
            // User's bid is the highest bid
          };
          break;
        case 'lost':
          whereClause.auction = {
            status: 'ENDED',
            // User's bid is not the highest bid
          };
          break;
      }
    }

    // Get user's bids with auction details
    const bids = await prisma.bid.findMany({
      where: whereClause,
      include: {
        auction: {
          include: {
            bids: {
              orderBy: { amount: 'desc' },
              take: 1, // Get highest bid to determine if user won
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
    const totalCount = await prisma.bid.count({
      where: whereClause,
    });

    // Transform the data to include additional info
    const transformedBids = bids.map(bid => {
      const auction = bid.auction;
      const highestBid = auction.bids[0];
      const isWinning = highestBid?.bidderId === session.user.id;
      const isEnded = auction.status === 'ENDED';
      
      return {
        id: bid.id,
        amount: bid.amount,
        createdAt: bid.createdAt,
        auction: {
          id: auction.id,
          title: auction.title,
          location: auction.location,
          images: auction.images,
          status: auction.status,
          startDate: auction.startDate,
          endDate: auction.endDate,
          currentBid: auction.currentBid,
          startingBid: auction.startingBid,
          reservePrice: auction.reservePrice,
          totalBids: auction._count.bids,
        },
        isWinning,
        isEnded,
        won: isEnded && isWinning,
        lost: isEnded && !isWinning,
      };
    });

    // Group bids by status for summary
    const summary = {
      active: transformedBids.filter(bid => !bid.isEnded).length,
      won: transformedBids.filter(bid => bid.won).length,
      lost: transformedBids.filter(bid => bid.lost).length,
      total: totalCount,
    };

    return NextResponse.json({
      bids: transformedBids,
      summary,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });

  } catch (error) {
    console.error('Error fetching dashboard bids:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}