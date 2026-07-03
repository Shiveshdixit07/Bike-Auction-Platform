import { io } from 'socket.io-client';

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io('/', {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
  }
  return socket;
}

export function connectSocket() {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
  }
  return s;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function joinAuction(auctionId) {
  const s = getSocket();
  s.emit('join_auction', { auctionId });
}

export function leaveAuction(auctionId) {
  const s = getSocket();
  s.emit('leave_auction', { auctionId });
}

export function onBidPlaced(callback) {
  const s = getSocket();
  s.on('bid_placed', callback);
  return () => s.off('bid_placed', callback);
}

export function onAuctionStatusChanged(callback) {
  const s = getSocket();
  s.on('auction_status_changed', callback);
  return () => s.off('auction_status_changed', callback);
}
