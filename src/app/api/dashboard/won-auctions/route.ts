// src/app/api/dashboard/won-auctions/route.ts
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
    const paymentStatus = searchParams.get('paymentStatus'); // 'paid', 'pending', 'overdue'
    
    const skip = (page - 1) * limit;

    // Get all ended auctions where user has bids
    const endedAuctions = await prisma.auction.findMany({
      where: {
        status: 'ENDED',
        bids: {
          some: {
            bidderId: session.user.id
          }
        }
      },
      include: {
        bids: {
          orderBy: { amount: 'desc' },
        },
        seller: {
          select: { 
            id: true, 
            name: true, 
            email: true, 
            companyName: true,
            businessPhone: true 
          }
        },
        _count: {
          select: { bids: true }
        }
      },
      orderBy: { endDate: 'desc' },
    });

    // Filter for auctions actually won by the user (user has the highest bid)
    const wonAuctions = endedAuctions
      .filter(auction => {
        const highestBid = auction.bids[0];
        return highestBid?.bidderId === session.user.id;
      })
      .slice(skip, skip + limit);

    // Transform the data to include additional info
    const transformedWonAuctions = wonAuctions.map(auction => {
      const winningBid = auction.bids[0]; // Highest bid (user's winning bid)
      const userBids = auction.bids.filter(bid => bid.bidderId === session.user.id);
      
      // Calculate payment due date (e.g., 7 days after auction end)
      const paymentDueDate = new Date(auction.endDate);
      paymentDueDate.setDate(paymentDueDate.getDate() + 7);
      
      // Determine payment status (you might want to add a payment table to track this)
      const now = new Date();
      const isOverdue = now > paymentDueDate;
      const daysSinceEnd = Math.floor((now.getTime() - auction.endDate.getTime()) / (1000 * 60 * 60 * 24));
      
      return {
        id: auction.id,
        title: auction.title,
        description: auction.description,
        location: auction.location,
        category: auction.category,
        images: auction.images,
        endDate: auction.endDate,
        reservePrice: auction.reservePrice,
        propertyDetails: auction.propertyDetails,
        seller: auction.seller,
        totalBids: auction._count.bids,
        
        // Winning bid details
        winningBid: {
          id: winningBid.id,
          amount: winningBid.amount,
          placedAt: winningBid.createdAt,
        },
        
        // User's bidding activity on this auction
        userBidding: {
          totalBids: userBids.length,
          firstBid: userBids[userBids.length - 1]?.amount || 0,
          finalBid: winningBid.amount,
          bidHistory: userBids.map(bid => ({
            amount: bid.amount,
            placedAt: bid.createdAt
          }))
        },
        
        // Payment information
        payment: {
          amount: winningBid.amount,
          dueDate: paymentDueDate,
          status: isOverdue ? 'overdue' : daysSinceEnd <= 1 ? 'pending' : 'due',
          daysSinceWon: daysSinceEnd,
          isOverdue,
        },
        
        // Status flags
        isRecentWin: daysSinceEnd <= 7,
        needsAttention: isOverdue,
      };
    });

    // Filter by payment status if requested
    let filteredAuctions = transformedWonAuctions;
    if (paymentStatus) {
      filteredAuctions = transformedWonAuctions.filter(auction => 
        auction.payment.status === paymentStatus
      );
    }

    // Calculate summary statistics
    const totalWonAuctions = endedAuctions.filter(auction => 
      auction.bids[0]?.bidderId === session.user.id
    ).length;

    const summary = {
      total: totalWonAuctions,
      pending: transformedWonAuctions.filter(a => a.payment.status === 'pending').length,
      due: transformedWonAuctions.filter(a => a.payment.status === 'due').length,
      overdue: transformedWonAuctions.filter(a => a.payment.status === 'overdue').length,
      recentWins: transformedWonAuctions.filter(a => a.isRecentWin).length,
      totalValue: transformedWonAuctions.reduce((sum, auction) => sum + auction.winningBid.amount, 0),
    };

    return NextResponse.json({
      wonAuctions: filteredAuctions,
      summary,
      pagination: {
        page,
        limit,
        total: totalWonAuctions,
        totalPages: Math.ceil(totalWonAuctions / limit),
      },
    });

  } catch (error) {
    console.error('Error fetching won auctions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Get specific won auction details
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

    // Get the specific auction with full details
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      include: {
        bids: {
          orderBy: { amount: 'desc' },
          include: {
            bidder: {
              select: { id: true, name: true }
            }
          }
        },
        seller: {
          select: { 
            id: true, 
            name: true, 
            email: true, 
            companyName: true,
            businessPhone: true,
            businessAddress: true 
          }
        },
      }
    });

    if (!auction) {
      return NextResponse.json(
        { error: 'Auction not found' },
        { status: 404 }
      );
    }

    // Verify user won this auction
    const highestBid = auction.bids[0];
    if (!highestBid || highestBid.bidderId !== session.user.id) {
      return NextResponse.json(
        { error: 'You did not win this auction' },
        { status: 403 }
      );
    }

    // Get user's bid history for this auction
    const userBids = auction.bids.filter(bid => bid.bidderId === session.user.id);

    const detailedAuction = {
      ...auction,
      winningBid: highestBid,
      userBidHistory: userBids,
      bidCompetition: auction.bids.slice(0, 10), // Top 10 bids for context
    };

    return NextResponse.json({
      auction: detailedAuction,
    });

  } catch (error) {
    console.error('Error fetching won auction details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}