import { prisma } from '../prisma';

export class EscrowWalletService {
  
  /**
   * Get or create user's escrow wallet
   */
  async getWallet(userId) {
    try {
      let wallet = await prisma.escrowWallet.findUnique({
        where: { userId },
        include: { 
          transactions: { 
            orderBy: { createdAt: 'desc' },
            take: 20 // Last 20 transactions
          } 
        }
      });
      
      // Create wallet if it doesn't exist
      if (!wallet) {
        wallet = await prisma.escrowWallet.create({
          data: { userId },
          include: { 
            transactions: { 
              orderBy: { createdAt: 'desc' },
              take: 20
            } 
          }
        });
      }
      
      return wallet;
    } catch (error) {
      throw new Error(`Failed to get wallet: ${error.message}`);
    }
  }

  /**
   * Get wallet balance info
   */
  async getWalletBalance(userId) {
    const wallet = await this.getWallet(userId);
    
    return {
      totalBalance: wallet.balance,
      frozenAmount: wallet.frozenAmount,
      availableBalance: wallet.balance - wallet.frozenAmount,
      walletId: wallet.id
    };
  }

  /**
   * Check if user can bid on specific auction
   */
  async canBid(userId, auctionId) {
    try {
      const wallet = await this.getWallet(userId);
      
      // Get bid requirement for this auction
      let bidRequirement = await prisma.bidRequirement.findUnique({
        where: { auctionId }
      });
      
      // If no specific requirement exists, create default one
      if (!bidRequirement) {
        bidRequirement = await prisma.bidRequirement.create({
          data: { 
            auctionId,
            requiredAmount: 5000 // Default $5k requirement
          }
        });
      }
      
      const availableBalance = wallet.balance - wallet.frozenAmount;
      const canBid = availableBalance >= bidRequirement.requiredAmount;
      
      return {
        canBid,
        availableBalance,
        requiredAmount: bidRequirement.requiredAmount,
        currentBalance: wallet.balance,
        frozenAmount: wallet.frozenAmount,
        shortfall: canBid ? 0 : bidRequirement.requiredAmount - availableBalance
      };
    } catch (error) {
      throw new Error(`Failed to check bid eligibility: ${error.message}`);
    }
  }

  /**
   * Process deposit (admin function)
   * adminId is optional - can be null for system/automated deposits
   */
  async processDeposit(userId, amount, reference, adminId = null, description = null) {
    if (amount <= 0) {
      throw new Error('Deposit amount must be positive');
    }

    try {
      const wallet = await this.getWallet(userId);
      
      return await prisma.$transaction(async (tx) => {
        // Prepare transaction data
        const transactionData = {
          walletId: wallet.id,
          type: 'DEPOSIT',
          amount,
          reference,
          description: description || `Deposit via ${reference}`,
          status: 'COMPLETED',
          processedAt: new Date()
        };

        // Only add processedBy if adminId is a valid ObjectId (not system strings)
        if (adminId && adminId !== 'PLAID_AUTO' && adminId !== 'SYSTEM_AUTO') {
          transactionData.processedBy = adminId;
        }

        // Create transaction record
        const transaction = await tx.escrowTransaction.create({
          data: transactionData
        });
        
        // Update wallet balance
        const updatedWallet = await tx.escrowWallet.update({
          where: { id: wallet.id },
          data: { 
            balance: { increment: amount },
            updatedAt: new Date()
          }
        });
        
        return { transaction, wallet: updatedWallet };
      });
    } catch (error) {
      throw new Error(`Failed to process deposit: ${error.message}`);
    }
  }

  /**
   * Request withdrawal (user function)
   */
  async requestWithdrawal(userId, amount, description = 'Withdrawal request') {
    if (amount <= 0) {
      throw new Error('Withdrawal amount must be positive');
    }

    try {
      const wallet = await this.getWallet(userId);
      const availableBalance = wallet.balance - wallet.frozenAmount;
      
      if (amount > availableBalance) {
        throw new Error(`Insufficient available balance. Available: $${availableBalance}, Requested: $${amount}`);
      }
      
      // Create pending withdrawal transaction
      const transaction = await prisma.escrowTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'WITHDRAWAL',
          amount,
          description,
          status: 'PENDING'
        }
      });
      
      return transaction;
    } catch (error) {
      throw new Error(`Failed to request withdrawal: ${error.message}`);
    }
  }

  /**
   * Process withdrawal (admin function)
   */
  async processWithdrawal(transactionId, adminId = null, approved = true, notes = null) {
    try {
      return await prisma.$transaction(async (tx) => {
        // Get the pending withdrawal transaction
        const transaction = await tx.escrowTransaction.findUnique({
          where: { id: transactionId },
          include: { wallet: true }
        });
        
        if (!transaction) {
          throw new Error('Transaction not found');
        }
        
        if (transaction.status !== 'PENDING') {
          throw new Error('Transaction is not pending');
        }
        
        if (transaction.type !== 'WITHDRAWAL') {
          throw new Error('Transaction is not a withdrawal');
        }
        
        const wallet = transaction.wallet;
        const availableBalance = wallet.balance - wallet.frozenAmount;
        
        if (approved) {
          // Check if funds are still available
          if (transaction.amount > availableBalance) {
            throw new Error('Insufficient funds for withdrawal');
          }
          
          // Prepare update data
          const updateData = {
            status: 'COMPLETED',
            processedAt: new Date(),
            description: `${transaction.description}${notes ? ` - ${notes}` : ''}`
          };

          // Only add processedBy if adminId is provided and valid
          if (adminId && adminId !== 'SYSTEM_AUTO' && adminId !== 'PLAID_AUTO') {
            updateData.processedBy = adminId;
          }
          
          // Update transaction status
          const updatedTransaction = await tx.escrowTransaction.update({
            where: { id: transactionId },
            data: updateData
          });
          
          // Deduct from wallet balance
          const updatedWallet = await tx.escrowWallet.update({
            where: { id: wallet.id },
            data: { 
              balance: { decrement: transaction.amount },
              updatedAt: new Date()
            }
          });
          
          return { transaction: updatedTransaction, wallet: updatedWallet };
        } else {
          // Prepare reject data
          const updateData = {
            status: 'CANCELLED',
            processedAt: new Date(),
            description: `${transaction.description} - REJECTED${notes ? `: ${notes}` : ''}`
          };

          // Only add processedBy if adminId is provided and valid
          if (adminId && adminId !== 'SYSTEM_AUTO' && adminId !== 'PLAID_AUTO') {
            updateData.processedBy = adminId;
          }

          // Reject withdrawal
          const updatedTransaction = await tx.escrowTransaction.update({
            where: { id: transactionId },
            data: updateData
          });
          
          return { transaction: updatedTransaction, wallet };
        }
      });
    } catch (error) {
      throw new Error(`Failed to process withdrawal: ${error.message}`);
    }
  }

  /**
   * Process automated withdrawal (for ACH/Plaid withdrawals)
   * This bypasses the request/approval flow for automated systems
   */
  async processAutomatedWithdrawal(userId, amount, reference, description = null) {
    if (amount <= 0) {
      throw new Error('Withdrawal amount must be positive');
    }

    try {
      const wallet = await this.getWallet(userId);
      const availableBalance = wallet.balance - wallet.frozenAmount;
      
      if (amount > availableBalance) {
        throw new Error(`Insufficient available balance. Available: $${availableBalance}, Requested: $${amount}`);
      }
      
      return await prisma.$transaction(async (tx) => {
        // Create and immediately complete withdrawal transaction
        const transaction = await tx.escrowTransaction.create({
          data: {
            walletId: wallet.id,
            type: 'WITHDRAWAL',
            amount,
            reference,
            description: description || `Automated withdrawal via ${reference}`,
            status: 'COMPLETED',
            processedAt: new Date(),
            processedBy: null // No admin for automated withdrawals
          }
        });
        
        // Deduct from wallet balance
        const updatedWallet = await tx.escrowWallet.update({
          where: { id: wallet.id },
          data: { 
            balance: { decrement: amount },
            updatedAt: new Date()
          }
        });
        
        return { transaction, wallet: updatedWallet };
      });
    } catch (error) {
      throw new Error(`Failed to process automated withdrawal: ${error.message}`);
    }
  }

  /**
   * Apply winning bid amount to purchase (when user wins auction)
   */
  async applyToPurchase(userId, auctionId, bidId, amount, adminId = null) {
    try {
      const wallet = await this.getWallet(userId);
      
      if (wallet.balance < amount) {
        throw new Error('Insufficient wallet balance for purchase application');
      }
      
      return await prisma.$transaction(async (tx) => {
        // Prepare transaction data
        const transactionData = {
          walletId: wallet.id,
          type: 'PURCHASE',
          amount,
          auctionId,
          bidId,
          description: `Applied to winning bid for auction`,
          status: 'COMPLETED',
          processedAt: new Date()
        };

        // Only add processedBy if adminId is provided and valid
        if (adminId && adminId !== 'SYSTEM_AUTO' && adminId !== 'PLAID_AUTO') {
          transactionData.processedBy = adminId;
        }

        // Create purchase transaction
        const transaction = await tx.escrowTransaction.create({
          data: transactionData
        });
        
        // Deduct from wallet balance
        const updatedWallet = await tx.escrowWallet.update({
          where: { id: wallet.id },
          data: { 
            balance: { decrement: amount },
            updatedAt: new Date()
          }
        });
        
        return { transaction, wallet: updatedWallet };
      });
    } catch (error) {
      throw new Error(`Failed to apply to purchase: ${error.message}`);
    }
  }

  /**
   * Get all pending withdrawal requests (admin function)
   */
  async getPendingWithdrawals() {
    try {
      return await prisma.escrowTransaction.findMany({
        where: {
          type: 'WITHDRAWAL',
          status: 'PENDING'
        },
        include: {
          wallet: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'asc' }
      });
    } catch (error) {
      throw new Error(`Failed to get pending withdrawals: ${error.message}`);
    }
  }

  /**
   * Get user's transaction history
   */
  async getTransactionHistory(userId, limit = 50) {
    try {
      const wallet = await this.getWallet(userId);
      
      return await prisma.escrowTransaction.findMany({
        where: { walletId: wallet.id },
        include: {
          auction: {
            select: {
              id: true,
              title: true
            }
          },
          bid: {
            select: {
              id: true,
              amount: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit
      });
    } catch (error) {
      throw new Error(`Failed to get transaction history: ${error.message}`);
    }
  }

  /**
   * Admin: Get wallet overview/stats
   */
  async getWalletStats() {
    try {
      const stats = await prisma.escrowWallet.aggregate({
        _sum: {
          balance: true,
          frozenAmount: true
        },
        _count: {
          id: true
        }
      });

      const pendingWithdrawals = await prisma.escrowTransaction.aggregate({
        where: {
          type: 'WITHDRAWAL',
          status: 'PENDING'
        },
        _sum: {
          amount: true
        },
        _count: {
          id: true
        }
      });

      return {
        totalWallets: stats._count.id || 0,
        totalEscrowBalance: stats._sum.balance || 0,
        totalFrozenAmount: stats._sum.frozenAmount || 0,
        pendingWithdrawals: {
          count: pendingWithdrawals._count.id || 0,
          totalAmount: pendingWithdrawals._sum.amount || 0
        }
      };
    } catch (error) {
      throw new Error(`Failed to get wallet stats: ${error.message}`);
    }
  }

  /**
   * Set bid requirement for auction (admin function)
   */
  async setBidRequirement(auctionId, requiredAmount, adminId = null) {
    try {
      return await prisma.bidRequirement.upsert({
        where: { auctionId },
        update: { 
          requiredAmount,
          updatedAt: new Date()
        },
        create: { 
          auctionId,
          requiredAmount
        }
      });
    } catch (error) {
      throw new Error(`Failed to set bid requirement: ${error.message}`);
    }
  }
}