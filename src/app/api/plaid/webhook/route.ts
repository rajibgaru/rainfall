import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { EscrowWalletService } from '@/lib/services/escrowWallet';

const escrowService = new EscrowWalletService();

export async function POST(request: Request) {
  try {
    const webhook = await request.json();
    
    console.log('🔔 Received Plaid webhook:', {
      type: webhook.webhook_type,
      code: webhook.webhook_code,
      timestamp: new Date().toISOString()
    });

    // Handle different webhook types
    switch (webhook.webhook_type) {
      case 'TRANSFER':
        await handleTransferWebhook(webhook);
        break;
      case 'ITEM':
        await handleItemWebhook(webhook);
        break;
      default:
        console.log('ℹ️ Unhandled webhook type:', webhook.webhook_type);
    }

    return NextResponse.json({ status: 'received' });
  } catch (error: any) {
    console.error('❌ Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleTransferWebhook(webhook: any) {
  const { webhook_code, transfer_id, new_transfer_status, failure_reason } = webhook;

  console.log('💸 Processing transfer webhook:', {
    code: webhook_code,
    transferId: transfer_id,
    status: new_transfer_status,
    failure: failure_reason
  });

  try {
    // Find the deposit request by Plaid transfer ID
    const depositRequest = await prisma.depositRequest.findFirst({
      where: { plaidTransferId: transfer_id },
      include: { user: true },
    });

    if (!depositRequest) {
      console.log('⚠️ No deposit request found for transfer:', transfer_id);
      return;
    }

    console.log('📋 Found deposit request:', {
      id: depositRequest.id,
      userId: depositRequest.userId,
      amount: depositRequest.amount,
      currentStatus: depositRequest.status
    });

    switch (new_transfer_status) {
      case 'settled':
        await processTransferSettled(depositRequest);
        break;
      case 'failed':
      case 'cancelled':
        await processTransferFailed(depositRequest, failure_reason);
        break;
      case 'pending':
        await processTransferPending(depositRequest);
        break;
      default:
        console.log('ℹ️ Unhandled transfer status:', new_transfer_status);
    }
  } catch (error: any) {
    console.error('❌ Error processing transfer webhook:', error);
  }
}

async function processTransferSettled(depositRequest: any) {
  const isDeposit = depositRequest.amount > 0;
  const isWithdrawal = depositRequest.amount < 0;
  
  console.log(`✅ Processing settled ${isDeposit ? 'deposit' : 'withdrawal'} for user:`, depositRequest.user.email);

  try {
    // Update deposit/withdrawal request status
    await prisma.depositRequest.update({
      where: { id: depositRequest.id },
      data: { 
        status: 'COMPLETED', 
        processedAt: new Date() 
      },
    });

    if (isDeposit) {
      // Add funds to user's escrow wallet
      await escrowService.processDeposit(
        depositRequest.userId,
        depositRequest.amount,
        depositRequest.reference,
        null, // System processed
        'ACH deposit completed successfully'
      );

      // Create success notification
      await prisma.notification.create({
        data: {
          userId: depositRequest.userId,
          title: 'Deposit Completed',
          message: `Your deposit of $${depositRequest.amount.toLocaleString()} has been added to your escrow wallet.`,
          type: 'DEPOSIT_COMPLETED',
        },
      });
    } else if (isWithdrawal) {
      // Withdrawal completion notification (funds already deducted)
      await prisma.notification.create({
        data: {
          userId: depositRequest.userId,
          title: 'Withdrawal Completed',
          message: `Your withdrawal of $${Math.abs(depositRequest.amount).toLocaleString()} has been completed and sent to your bank account.`,
          type: 'WITHDRAWAL_COMPLETED',
        },
      });
    }

    console.log(`🎉 Successfully processed settled ${isDeposit ? 'deposit' : 'withdrawal'}`);

  } catch (error: any) {
    console.error(`❌ Error processing settled ${isDeposit ? 'deposit' : 'withdrawal'}:`, error);
  }
}

async function processTransferFailed(depositRequest: any, failureReason: any) {
  const isDeposit = depositRequest.amount > 0;
  const isWithdrawal = depositRequest.amount < 0;
  
  console.log(`❌ Processing failed ${isDeposit ? 'deposit' : 'withdrawal'}:`, failureReason);

  try {
    // Update deposit request status
    await prisma.depositRequest.update({
      where: { id: depositRequest.id },
      data: { 
        status: 'FAILED', 
        processedAt: new Date(),
        errorMessage: failureReason?.error_message || 'Transfer failed'
      },
    });

    if (isDeposit) {
      // Create failure notification for deposit
      await prisma.notification.create({
        data: {
          userId: depositRequest.userId,
          title: 'Deposit Failed',
          message: `Your deposit of $${depositRequest.amount.toLocaleString()} could not be processed. ${failureReason?.error_message || 'Please try again or contact support.'}`,
          type: 'DEPOSIT_FAILED',
        },
      });
    } else if (isWithdrawal) {
      // For failed withdrawal, we need to refund the money back to escrow
      await escrowService.processDeposit(
        depositRequest.userId,
        Math.abs(depositRequest.amount), // Positive amount to refund
        `${depositRequest.reference}-REFUND`,
        null,
        'Withdrawal failed - funds refunded to escrow'
      );

      await prisma.notification.create({
        data: {
          userId: depositRequest.userId,
          title: 'Withdrawal Failed',
          message: `Your withdrawal of $${Math.abs(depositRequest.amount).toLocaleString()} could not be processed and has been refunded to your escrow wallet. ${failureReason?.error_message || 'Please try again or contact support.'}`,
          type: 'WITHDRAWAL_FAILED',
        },
      });
    }

    console.log(`📝 Marked ${isDeposit ? 'deposit' : 'withdrawal'} as failed`);

  } catch (error: any) {
    console.error(`❌ Error processing failed ${isDeposit ? 'deposit' : 'withdrawal'}:`, error);
  }
}

async function processTransferPending(depositRequest: any) {
  console.log('⏳ Processing pending transfer');

  try {
    // Update deposit request status if not already processing
    if (depositRequest.status === 'PENDING') {
      await prisma.depositRequest.update({
        where: { id: depositRequest.id },
        data: { status: 'PROCESSING' },
      });
    }

    console.log('🔄 Updated transfer to processing');

  } catch (error: any) {
    console.error('❌ Error processing pending transfer:', error);
  }
}

async function handleItemWebhook(webhook: any) {
  const { webhook_code, item_id, error } = webhook;

  console.log('🔗 Processing item webhook:', {
    code: webhook_code,
    itemId: item_id,
    error: error
  });

  // Handle item-related webhooks (bank account disconnections, etc.)
  switch (webhook_code) {
    case 'ERROR':
      await handleItemError(item_id, error);
      break;
    case 'PENDING_EXPIRATION':
      await handleItemPendingExpiration(item_id);
      break;
    default:
      console.log('ℹ️ Unhandled item webhook code:', webhook_code);
  }
}

async function handleItemError(itemId: string, error: any) {
  console.log('❌ Item error:', error);

  try {
    // Find affected bank accounts
    const bankAccounts = await prisma.userBankAccount.findMany({
      where: { plaidItemId: itemId },
      include: { user: true }
    });

    // Deactivate affected accounts and notify users
    for (const account of bankAccounts) {
      await prisma.userBankAccount.update({
        where: { id: account.id },
        data: { isActive: false }
      });

      await prisma.notification.create({
        data: {
          userId: account.userId,
          title: 'Bank Account Issue',
          message: `There's an issue with your linked bank account (${account.accountName}). Please re-link your account to continue making deposits.`,
          type: 'BANK_ACCOUNT_ERROR',
        },
      });
    }

    console.log(`🔧 Deactivated ${bankAccounts.length} affected bank accounts`);

  } catch (error: any) {
    console.error('❌ Error handling item error:', error);
  }
}

async function handleItemPendingExpiration(itemId: string) {
  console.log('⚠️ Item pending expiration:', itemId);

  try {
    // Find affected bank accounts
    const bankAccounts = await prisma.userBankAccount.findMany({
      where: { plaidItemId: itemId },
      include: { user: true }
    });

    // Notify users about pending expiration
    for (const account of bankAccounts) {
      await prisma.notification.create({
        data: {
          userId: account.userId,
          title: 'Bank Account Expiring',
          message: `Your linked bank account (${account.accountName}) needs to be re-authenticated. Please update your account to avoid service interruption.`,
          type: 'BANK_ACCOUNT_EXPIRING',
        },
      });
    }

    console.log(`📧 Notified ${bankAccounts.length} users about expiring accounts`);

  } catch (error: any) {
    console.error('❌ Error handling pending expiration:', error);
  }
}