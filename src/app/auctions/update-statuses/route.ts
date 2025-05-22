// Solution 1: API endpoint for status updates
// src/app/api/auctions/update-statuses/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    const now = new Date();
    
    // Update UPCOMING auctions to LIVE if their start date has passed
    await prisma.auction.updateMany({
      where: {
        status: 'UPCOMING',
        startDate: {
          lte: now
        },
        endDate: {
          gt: now
        }
      },
      data: {
        status: 'LIVE'
      }
    });
    
    // Update LIVE auctions to ENDED if their end date has passed
    await prisma.auction.updateMany({
      where: {
        status: 'LIVE',
        endDate: {
          lte: now
        }
      },
      data: {
        status: 'ENDED'
      }
    });
    
    return NextResponse.json({ 
      success: true, 
      message: 'Auction statuses updated successfully',
      timestamp: now.toISOString()
    });
  } catch (error) {
    console.error('Error updating auction statuses:', error);
    return NextResponse.json(
      { error: 'Failed to update auction statuses' },
      { status: 500 }
    );
  }
}

