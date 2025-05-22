// src/app/api/auctions/my-auctions/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Verify user is an agent
    if (session.user.role !== 'AGENT') {
      return NextResponse.json(
        { error: 'Only agents can access their listings' }, 
        { status: 403 }
      );
    }
    
    // Get all auctions by this agent
    const auctions = await prisma.auction.findMany({
      where: {
        sellerId: session.user.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Make sure dates are serialized properly for JSON
    const serializedAuctions = auctions.map(auction => ({
      ...auction,
      startDate: auction.startDate.toISOString(),
      endDate: auction.endDate.toISOString(),
      createdAt: auction.createdAt.toISOString(),
      updatedAt: auction.updatedAt.toISOString(),
    }));
    
    return NextResponse.json({ auctions: serializedAuctions });
  } catch (error) {
    console.error('Error fetching agent auctions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch auctions' }, 
      { status: 500 }
    );
  }
}