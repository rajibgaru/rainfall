// src/app/api/auctions/[id]/watchlist/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isValidObjectId } from '@/lib/objectId';

// Add to watchlist
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
    
    const userId = session.user.id;
    const auctionId = params.id;
    
    // Check if auction exists
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId }
    });
    
    if (!auction) {
      return NextResponse.json({ error: 'Auction not found' }, { status: 404 });
    }
    
    // Check if already in watchlist
    const existingWatchlist = await prisma.watchlist.findFirst({
      where: {
        userId,
        auctionId
      }
    });
    
    if (existingWatchlist) {
      return NextResponse.json({ 
        success: true,
        message: 'Auction is already in your watchlist',
        isWatchlisted: true
      });
    }
    
    // Add to watchlist
    await prisma.watchlist.create({
      data: {
        userId,
        auctionId
      }
    });
    
    // Create notification for user
    await prisma.notification.create({
      data: {
        title: 'Added to Watchlist',
        message: `You added "${auction.title}" to your watchlist`,
        type: 'WATCHLIST_ADDED',
        userId
      }
    });
    
    return NextResponse.json({ 
      success: true,
      message: 'Added to watchlist',
      isWatchlisted: true
    });
    
  } catch (error) {
    console.error('Error adding to watchlist:', error);
    return NextResponse.json(
      { error: 'Failed to add to watchlist' },
      { status: 500 }
    );
  }
}

// Remove from watchlist
export async function DELETE(
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
    
    const userId = session.user.id;
    const auctionId = params.id;
    
    // Check if in watchlist
    const watchlistItem = await prisma.watchlist.findFirst({
      where: {
        userId,
        auctionId
      }
    });
    
    if (!watchlistItem) {
      return NextResponse.json({ 
        success: true,
        message: 'Auction is not in your watchlist',
        isWatchlisted: false
      });
    }
    
    // Remove from watchlist
    await prisma.watchlist.delete({
      where: {
        id: watchlistItem.id
      }
    });
    
    return NextResponse.json({ 
      success: true,
      message: 'Removed from watchlist',
      isWatchlisted: false
    });
    
  } catch (error) {
    console.error('Error removing from watchlist:', error);
    return NextResponse.json(
      { error: 'Failed to remove from watchlist' },
      { status: 500 }
    );
  }
}

// Check watchlist status
export async function GET(
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
      return NextResponse.json({ 
        isWatchlisted: false 
      });
    }
    
    const userId = session.user.id;
    const auctionId = params.id;
    
    // Check if in watchlist
    const watchlistItem = await prisma.watchlist.findFirst({
      where: {
        userId,
        auctionId
      }
    });
    
    return NextResponse.json({ 
      isWatchlisted: !!watchlistItem 
    });
    
  } catch (error) {
    console.error('Error checking watchlist status:', error);
    return NextResponse.json(
      { error: 'Failed to check watchlist status' },
      { status: 500 }
    );
  }
}