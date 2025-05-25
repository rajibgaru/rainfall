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

    const wallet = await escrowService.getWallet(userId);
    const balance = await escrowService.getWalletBalance(userId);
    
    // Get recent transactions (last 10 for dashboard)
    const recentTransactions = await escrowService.getTransactionHistory(userId, 10);
    
    return NextResponse.json({
      success: true,
      data: {
        wallet: {
          id: wallet.id,
          ...balance,
          createdAt: wallet.createdAt,
          updatedAt: wallet.updatedAt
        },
        recentTransactions: recentTransactions.map(tx => ({
          id: tx.id,
          type: tx.type,
          amount: tx.amount,
          status: tx.status,
          description: tx.description,
          reference: tx.reference,
          createdAt: tx.createdAt,
          processedAt: tx.processedAt,
          auction: tx.auction ? {
            id: tx.auction.id,
            title: tx.auction.title
          } : null
        }))
      }
    });
  } catch (error) {
    console.error('Wallet API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}