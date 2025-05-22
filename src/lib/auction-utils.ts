// src/lib/auction-utils.ts
export function getCurrentAuctionStatus(
  currentStatus: string,
  startDate: Date,
  endDate: Date
): 'UPCOMING' | 'LIVE' | 'ENDED' | 'CANCELLED' {
  const now = new Date();
  
  // Don't change status if it's manually set to CANCELLED
  if (currentStatus === 'CANCELLED') {
    return 'CANCELLED';
  }
  
  if (now < startDate) {
    return 'UPCOMING';
  } else if (now >= startDate && now < endDate) {
    return 'LIVE';
  } else {
    return 'ENDED';
  }
}