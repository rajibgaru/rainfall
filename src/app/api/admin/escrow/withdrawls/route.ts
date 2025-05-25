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

    const pendingWithdrawals = await escrowService.getPendingWithdrawals();

    return NextResponse.json({
      success: true,
      data: pendingWithdrawals.map(tx => ({
        id: tx.id,
        amount: tx.amount,
        description: tx.description,
        reference: tx.reference,
        createdAt: tx.createdAt,
        user: {
          id: tx.wallet.user.id,
          name: tx.wallet.user.name,
          email: tx.wallet.user.email
        },
        walletBalance: tx.wallet.balance,
        walletFrozen: tx.wallet.frozenAmount
      }))
    });
  } catch (error) {
    console.error('Get pending withdrawals error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
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

    const adminId = session.user.id;
    const body = await request.json();
    const { transactionId, approved, notes } = body;

    // Validation
    if (!transactionId) {
      return NextResponse.json({ error: 'Transaction ID is required' }, { status: 400 });
    }

    if (typeof approved !== 'boolean') {
      return NextResponse.json({ error: 'Approved status must be true or false' }, { status: 400 });
    }

    // Process withdrawal
    const result = await escrowService.processWithdrawal(
      transactionId,
      adminId,
      approved,
      notes
    );

    return NextResponse.json({
      success: true,
      message: approved ? 'Withdrawal approved and processed' : 'Withdrawal rejected',
      data: {
        transaction: {
          id: result.transaction.id,
          amount: result.transaction.amount,
          status: result.transaction.status,
          description: result.transaction.description,
          processedAt: result.transaction.processedAt
        },
        wallet: {
          id: result.wallet.id,
          balance: result.wallet.balance,
          frozenAmount: result.wallet.frozenAmount
        }
      }
    });
  } catch (error) {
    console.error('Process withdrawal error:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}