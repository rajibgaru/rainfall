// src/app/api/auctions/[id]/bid/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { isValidObjectId } from '@/lib/objectId';

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
    
    // Get the auction with current bid and reserve price
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      select: {
        id: true,
        currentBid: true,
        incrementAmount: true,
        reservePrice: true, // Add reserve price to selection
        endDate: true,
        status: true,
        sellerId: true
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
          error: `Bid must be at least ${minimumBid}`,
          minimumBid 
        },
        { status: 400 }
      );
    }
    
    // Create the bid and update auction
    const bid = await prisma.bid.create({
      data: {
        amount,
        auctionId,
        bidderId: userId
      }
    });
    
    // Determine if reserve has been met
    const reserveMet = auction.reservePrice > 0 && amount >= auction.reservePrice;
    const wasReserveMet = auction.reservePrice > 0 && auction.currentBid >= auction.reservePrice;
    const reserveJustMet = reserveMet && !wasReserveMet;
    
    // Update auction current bid
    await prisma.auction.update({
      where: { id: auctionId },
      data: { currentBid: amount }
    });
    
    // Create notification for the seller
    await prisma.notification.create({
      data: {
        title: 'New Bid Placed',
        message: `A new bid of $${amount} was placed on your auction.${
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
          message: `Your bid of $${amount} has met the reserve price for this auction!`,
          type: 'RESERVE_MET',
          userId: userId
        }
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      bid,
      reserveMet,
      reserveJustMet
    });
  } catch (error) {
    console.error('Bid error:', error);
    return NextResponse.json(
      { error: 'Failed to place bid' },
      { status: 500 }
    );
  }
}