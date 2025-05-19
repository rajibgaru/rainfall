import { io } from 'socket.io-client';

let socket;

export const initializeSocket = (token) => {
  if (socket) return socket;

  socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000', {
    auth: {
      token,
    },
  });
  
  socket.on('connect', () => {
    console.log('Socket connected');
  });
  
  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });
  
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
  
  return socket;
};

export const getSocket = () => {
  if (!socket) {
    throw new Error('Socket not initialized');
  }
  
  return socket;
};