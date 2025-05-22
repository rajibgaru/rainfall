// src/hooks/useAuctionStatus.ts
'use client';
import { useState, useEffect } from 'react';

export function useAuctionStatus(startDate: Date, endDate: Date, initialStatus: string) {
  const [currentStatus, setCurrentStatus] = useState(initialStatus);
  
  useEffect(() => {
    console.log('🔍 Hook initialized with:', {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      initialStatus,
      now: new Date().toISOString()
    });
    
    const updateStatus = () => {
      const now = new Date();
      let newStatus = initialStatus;
      
      console.log('⏰ Checking status at:', now.toISOString());
      console.log('📅 Start date:', startDate.toISOString());
      console.log('📅 End date:', endDate.toISOString());
      
      if (initialStatus === 'CANCELLED') {
        newStatus = 'CANCELLED';
        console.log('🚫 Status is CANCELLED, keeping as is');
      } else if (now < startDate) {
        newStatus = 'UPCOMING';
        console.log('⏳ Current time is before start date -> UPCOMING');
      } else if (now >= startDate && now < endDate) {
        newStatus = 'LIVE';
        console.log('🔥 Current time is between start and end -> LIVE');
      } else {
        newStatus = 'ENDED';
        console.log('✅ Current time is after end date -> ENDED');
      }
      
      console.log('🎯 Calculated status:', newStatus);
      
      if (newStatus !== currentStatus) {
        console.log('🔄 Status changed from', currentStatus, 'to', newStatus);
        setCurrentStatus(newStatus);
      } else {
        console.log('⚡ Status unchanged:', currentStatus);
      }
    };
    
    // Update status immediately
    updateStatus();
    
    // Set up interval to check every minute
    const interval = setInterval(updateStatus, 10000);
    
    return () => {
      console.log('🧹 Cleaning up interval');
      clearInterval(interval);
    };
  }, [startDate, endDate, initialStatus, currentStatus]);
  
  return currentStatus;
}