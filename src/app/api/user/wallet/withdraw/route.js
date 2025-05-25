import { EscrowWalletService } from '@/lib/services/escrowWallet';
import { getServerSession } from 'next-auth/next';
import { authOptions } from "@/lib/auth";
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { plaidClient, isPlaidSandbox } from '@/lib/plaid';

const escrowService = new EscrowWalletService();

export async function POST(request) {
  try {
    console.log('💸 Automated withdrawal API called');
    
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.log('❌ Unauthorized withdrawal attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const { amount, description, bankAccountId } = body;

    console.log('💰 Withdrawal request:', { userId, amount, description, bankAccountId });

    // Validation
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Valid amount is required' }, { status: 400 });
    }

    if (amount < 100) {
      return NextResponse.json({ error: 'Minimum withdrawal amount is $100' }, { status: 400 });
    }

    if (amount > 50000) {
      return NextResponse.json({ error: 'Maximum withdrawal amount is $50,000 per transaction' }, { status: 400 });
    }

    if (!bankAccountId) {
      return NextResponse.json({ error: 'Bank account selection is required' }, { status: 400 });
    }

    // Check user's wallet balance
    const walletBalance = await escrowService.getWalletBalance(userId);
    if (amount > walletBalance.availableBalance) {
      return NextResponse.json({ 
        error: `Insufficient funds. Available: $${walletBalance.availableBalance.toLocaleString()}` 
      }, { status: 400 });
    }

    // Get user's bank account
    const userBankAccount = await prisma.userBankAccount.findFirst({
      where: {
        id: bankAccountId,
        userId: userId,
        isActive: true,
      },
    });

    if (!userBankAccount) {
      return NextResponse.json({ error: 'Bank account not found or inactive' }, { status: 404 });
    }

    console.log('🏦 Found user bank account:', userBankAccount.accountName);

    // Generate unique reference
    const reference = `WD-${userId.substring(0, 8)}-${Date.now()}`;

    // In sandbox mode, simulate the withdrawal
    if (isPlaidSandbox()) {
      console.log('🧪 Sandbox mode: Simulating withdrawal transfer');
      
      // Create withdrawal request record
      const withdrawalRequest = await prisma.depositRequest.create({
        data: {
          userId: userId,
          bankAccountId: userBankAccount.id,
          amount: -amount, // Negative amount for withdrawal
          method: 'ACH',
          status: 'PROCESSING',
          reference: reference,
          plaidTransferId: `sandbox_withdrawal_${reference}`,
        },
      });

      // Immediately process the withdrawal in sandbox
      await processWithdrawalInEscrow(userId, amount, reference);

      // In sandbox, simulate completion after short delay
      setTimeout(async () => {
        try {
          await simulateWithdrawalCompletion(withdrawalRequest.id);
        } catch (error) {
          console.error('Error simulating withdrawal completion:', error);
        }
      }, 5000); // 5-second simulation

      return NextResponse.json({
        success: true,
        transferId: withdrawalRequest.plaidTransferId,
        status: 'PROCESSING',
        reference: reference,
        message: 'Withdrawal initiated successfully',
        sandbox: true,
        estimatedCompletion: '5 seconds (sandbox simulation)',
      });
    }

    // Production mode - Real Plaid Transfer (Credit to user's account)
    try {
      const transferResponse = await plaidClient.transferCreate({
        access_token: userBankAccount.plaidAccessToken,
        account_id: userBankAccount.accountId,
        amount: amount.toString(),
        description: `Escrow withdrawal - ${session.user.name}`,
        type: 'credit', // Send money to user's account
        network: 'same-day-ach',
        ach_class: 'ppd',
        user: {
          legal_name: session.user.name || 'Account Holder',
        },
      });

      console.log('✅ Plaid withdrawal transfer created:', transferResponse.data.transfer.id);

      // Process withdrawal from escrow immediately (optimistic processing)
      await processWithdrawalInEscrow(userId, amount, reference);

      // Store withdrawal request in database
      const withdrawalRequest = await prisma.depositRequest.create({
        data: {
          userId: userId,
          bankAccountId: userBankAccount.id,
          amount: -amount, // Negative amount for withdrawal
          method: 'ACH',
          status: 'PROCESSING',
          reference: reference,
          plaidTransferId: transferResponse.data.transfer.id,
        },
      });

      return NextResponse.json({
        success: true,
        transferId: transferResponse.data.transfer.id,
        status: transferResponse.data.transfer.status,
        reference: reference,
        message: 'Withdrawal initiated successfully',
        estimatedCompletion: '1-3 business days',
      });

    } catch (plaidError) {
      console.error('❌ Plaid withdrawal error:', plaidError.response?.data || plaidError.message);
      
      return NextResponse.json({
        error: 'Failed to initiate withdrawal transfer',
        details: isPlaidSandbox() ? plaidError.response?.data || plaidError.message : 'Please try again or contact support',
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Withdrawal request error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to process withdrawal request'
    }, { status: 500 });
  }
}

// Fixed helper function to process withdrawal from escrow wallet
async function processWithdrawalInEscrow(userId, amount, reference) {
  try {
    console.log('💳 Processing withdrawal from escrow wallet');
    
    // Use the new automated withdrawal method with positive amount
    await escrowService.processAutomatedWithdrawal(
      userId,
      amount, // Positive amount
      reference,
      'Automated withdrawal via ACH transfer'
    );

    // Create notification
    await prisma.notification.create({
      data: {
        userId: userId,
        title: 'Withdrawal Processing',
        message: `Your withdrawal of $${amount.toLocaleString()} is being processed and will arrive in your bank account within 1-3 business days.`,
        type: 'WITHDRAWAL_PROCESSING',
      },
    });

    console.log('✅ Withdrawal processed from escrow wallet');
  } catch (error) {
    console.error('❌ Error processing withdrawal from escrow:', error);
    throw error;
  }
}

// Sandbox simulation function
async function simulateWithdrawalCompletion(withdrawalRequestId) {
  try {
    console.log('🎭 Simulating withdrawal completion for:', withdrawalRequestId);
    
    const withdrawalRequest = await prisma.depositRequest.findUnique({
      where: { id: withdrawalRequestId },
      include: { user: true },
    });

    if (!withdrawalRequest) return;

    // Update withdrawal request to completed
    await prisma.depositRequest.update({
      where: { id: withdrawalRequestId },
      data: {
        status: 'COMPLETED',
        processedAt: new Date(),
      },
    });

    // Create completion notification
    await prisma.notification.create({
      data: {
        userId: withdrawalRequest.userId,
        title: 'Withdrawal Completed',
        message: `Your withdrawal of $${Math.abs(withdrawalRequest.amount).toLocaleString()} has been completed and sent to your bank account.`,
        type: 'WITHDRAWAL_COMPLETED',
      },
    });

    console.log('✅ Sandbox withdrawal completion simulated successfully');

  } catch (error) {
    console.error('❌ Error simulating withdrawal completion:', error);
  }
}