import { EscrowWalletService } from '@/lib/services/escrowWallet';
import { getServerSession } from 'next-auth/next';
// Update this import path to match your NextAuth config
import { authOptions } from "@/lib/auth";
import { NextResponse } from 'next/server';

const escrowService = new EscrowWalletService();

export async function GET(request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const auctionId = searchParams.get('auctionId');

    if (!auctionId) {
      return NextResponse.json({ error: 'Auction ID is required' }, { status: 400 });
    }

    // Check bid eligibility
    const eligibility = await escrowService.canBid(userId, auctionId);

    return NextResponse.json({
      success: true,
      data: eligibility
    });
  } catch (error) {
    console.error('Can bid check error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}