// src/app/api/auctions/[id]/bid/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { isValidObjectId } from '@/lib/objectId';
import { EscrowWalletService } from '@/lib/services/escrowWallet';

const escrowService = new EscrowWalletService();

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Validate ID format
    if (!isValidObjectId(params.id)) {
      return NextResponse.json(
        { error: 'Invalid auction ID format' },
        { status: 400 }
      );
    }
    
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if user is an agent - prevent agents from bidding
    if (session.user.role === 'AGENT') {
      return NextResponse.json(
        { error: 'As a real estate agent, you cannot place bids on auctions' },
        { status: 403 }
      );
    }
    
    const { amount } = await request.json();
    const userId = session.user.id;
    const auctionId = params.id;
    
    // ESCROW VALIDATION - Check if user can bid on this auction
    try {
      const eligibility = await escrowService.canBid(userId, auctionId);
      
      if (!eligibility.canBid) {
        return NextResponse.json({
          error: 'Insufficient escrow deposit to bid on this auction',
          details: {
            availableBalance: eligibility.availableBalance,
            requiredAmount: eligibility.requiredAmount,
            shortfall: eligibility.shortfall,
            escrowRequired: true
          }
        }, { status: 400 });
      }
    } catch (escrowError) {
      console.error('Escrow validation error:', escrowError);
      return NextResponse.json({
        error: 'Unable to validate escrow eligibility. Please try again.',
        escrowError: true
      }, { status: 500 });
    }
    
    // Get the auction with current bid and reserve price
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      select: {
        id: true,
        currentBid: true,
        incrementAmount: true,
        reservePrice: true,
        endDate: true,
        status: true,
        sellerId: true,
        title: true
      }
    });
    
    if (!auction) {
      return NextResponse.json({ error: 'Auction not found' }, { status: 404 });
    }
    
    // Prevent seller from bidding on their own auction
    if (auction.sellerId === userId) {
      return NextResponse.json(
        { error: 'You cannot bid on your own auction' },
        { status: 400 }
      );
    }
    
    // Check if auction is still active
    if (auction.status !== 'LIVE' || auction.endDate < new Date()) {
      return NextResponse.json(
        { error: 'Auction is not active' },
        { status: 400 }
      );
    }
    
    // Validate bid amount
    const minimumBid = auction.currentBid + auction.incrementAmount;
    if (amount < minimumBid) {
      return NextResponse.json(
        { 
          error: `Bid must be at least $${minimumBid.toLocaleString()}`,
          minimumBid 
        },
        { status: 400 }
      );
    }
    
    // Create the bid and update auction in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the bid
      const bid = await tx.bid.create({
        data: {
          amount,
          auctionId,
          bidderId: userId
        }
      });
      
      // Update auction current bid
      await tx.auction.update({
        where: { id: auctionId },
        data: { currentBid: amount }
      });
      
      return bid;
    });
    
    // Determine if reserve has been met
    const reserveMet = auction.reservePrice > 0 && amount >= auction.reservePrice;
    const wasReserveMet = auction.reservePrice > 0 && auction.currentBid >= auction.reservePrice;
    const reserveJustMet = reserveMet && !wasReserveMet;
    
    // Create notification for the seller
    await prisma.notification.create({
      data: {
        title: 'New Bid Placed',
        message: `A new bid of $${amount.toLocaleString()} was placed on "${auction.title}".${
          reserveJustMet ? ' The reserve price has now been met!' : ''
        }`,
        type: reserveJustMet ? 'RESERVE_MET' : 'BID_PLACED',
        userId: auction.sellerId
      }
    });
    
    // If reserve was just met, notify the bidder too
    if (reserveJustMet) {
      await prisma.notification.create({
        data: {
          title: 'Reserve Price Met',
          message: `Your bid of $${amount.toLocaleString()} has met the reserve price for "${auction.title}"!`,
          type: 'RESERVE_MET',
          userId: userId
        }
      });
    }
    
    // Create activity notification for the bidder
    await prisma.notification.create({
      data: {
        title: 'Bid Placed Successfully',
        message: `Your bid of $${amount.toLocaleString()} has been placed on "${auction.title}".`,
        type: 'BID_PLACED',
        userId: userId
      }
    });
    
    return NextResponse.json({ 
      success: true, 
      bid: result,
      reserveMet,
      reserveJustMet,
      message: 'Bid placed successfully!'
    });
    
  } catch (error) {
    console.error('Bid error:', error);
    return NextResponse.json(
      { error: 'Failed to place bid. Please try again.' },
      { status: 500 }
    );
  }
}