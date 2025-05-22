// src/app/api/auctions/update-statuses/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    const now = new Date();
    
    // Update UPCOMING auctions to LIVE if start date has passed
    const startedResults = await prisma.auction.updateMany({
      where: {
        status: 'UPCOMING',
        startDate: {
          lte: now
        }
      },
      data: {
        status: 'LIVE'
      }
    });
    
    // Update LIVE auctions to ENDED if end date has passed
    const endedResults = await prisma.auction.updateMany({
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
      message: 'Auction statuses updated successfully',
      started: startedResults.count,
      ended: endedResults.count
    });
  } catch (error) {
    console.error('Error updating auction statuses:', error);
    return NextResponse.json(
      { error: 'Failed to update auction statuses' },
      { status: 500 }
    );
  }
}