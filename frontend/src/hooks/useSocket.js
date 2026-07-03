import { useEffect, useCallback } from 'react';
import { connectSocket, disconnectSocket, joinAuction, leaveAuction, onBidPlaced, onAuctionStatusChanged } from '../lib/socket';

export function useSocket(auctionId) {
  useEffect(() => {
    connectSocket();

    if (auctionId) {
      joinAuction(auctionId);
    }

    return () => {
      if (auctionId) {
        leaveAuction(auctionId);
      }
    };
  }, [auctionId]);

  const subscribeToBidPlaced = useCallback((callback) => {
    return onBidPlaced(callback);
  }, []);

  const subscribeToAuctionStatus = useCallback((callback) => {
    return onAuctionStatusChanged(callback);
  }, []);

  return { subscribeToBidPlaced, subscribeToAuctionStatus };
}
