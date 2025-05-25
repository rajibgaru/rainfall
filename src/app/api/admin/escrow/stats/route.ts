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

    // Check if user is admin
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const stats = await escrowService.getWalletStats();

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalWallets: stats.totalWallets,
          totalEscrowBalance: stats.totalEscrowBalance,
          totalFrozenAmount: stats.totalFrozenAmount,
          totalAvailableBalance: stats.totalEscrowBalance - stats.totalFrozenAmount
        },
        pendingWithdrawals: {
          count: stats.pendingWithdrawals.count,
          totalAmount: stats.pendingWithdrawals.totalAmount
        }
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}