const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  // Initialize Socket.io
  const io = new Server(server, {
    cors: {
      origin: process.env.NEXT_PUBLIC_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Socket.io Authentication Middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    
    if (!token) {
      // For development, allow connections without token
      if (dev) {
        socket.user = { id: 'anonymous', email: 'anonymous' };
        return next();
      }
      return next(new Error('Authentication error'));
    }

    try {
      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (error) {
      return next(new Error('Authentication error'));
    }
  });

  // Socket.io Connection Handler
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.email}`);

    // Join auction room
    socket.on('join-auction', (auctionId) => {
      socket.join(`auction:${auctionId}`);
      console.log(`User ${socket.user.email} joined auction: ${auctionId}`);
    });

    // Leave auction room
    socket.on('leave-auction', (auctionId) => {
      socket.leave(`auction:${auctionId}`);
      console.log(`User ${socket.user.email} left auction: ${auctionId}`);
    });

    // Disconnect handler
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.email}`);
    });
  });

  // Make io accessible from other parts of the app
  global.io = io;

  // Start the server
  const PORT = process.env.PORT || 3000;
  server.listen(PORT, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${PORT}`);
  });
});