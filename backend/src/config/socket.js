const { Server } = require('socket.io');
const config = require('./env');
const { registerSocketHandlers } = require('../events/socket.handlers');

function initializeSocketServer(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: config.clientOrigins.length ? config.clientOrigins : false,
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingInterval: 25000,
    pingTimeout: 20000,
    maxHttpBufferSize: 1e6,
    transports: ['websocket', 'polling']
  });

  registerSocketHandlers(io);
  return io;
}

module.exports = { initializeSocketServer };
