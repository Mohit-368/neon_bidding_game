const { createServer } = require('node:http');
const app = require('./app');
const config = require('./config/env');
const { initializeSocketServer } = require('./config/socket');

const httpServer = createServer(app);
const io = initializeSocketServer(httpServer);

httpServer.listen(config.port, () => {
  console.log(`Auction Arena server listening on port ${config.port}`);
  console.log(`Environment: ${config.nodeEnv}`);
});

function shutdown(signal) {
  console.log(`${signal} received. Closing server...`);
  io.close(() => {
    httpServer.close(() => process.exit(0));
  });
  setTimeout(() => process.exit(1), 10000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
