const path = require('node:path');
const fs = require('node:fs');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const config = require('./config/env');
const healthRoutes = require('./routes/health.routes');
const { notFoundHandler, errorHandler } = require('./middleware/error.middleware');

const app = express();

app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(cors({ origin: config.clientOrigins.length ? config.clientOrigins : false, credentials: true }));
app.use(express.json({ limit: '32kb' }));
app.use('/api', healthRoutes);
app.use('/api', notFoundHandler);

const frontendDist = path.resolve(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist, { maxAge: config.nodeEnv === 'production' ? '1h' : 0 }));
  app.get('*', (_request, response) => response.sendFile(path.join(frontendDist, 'index.html')));
} else {
  app.get('/', (_request, response) => {
    response.status(200).json({
      service: 'Auction Arena API',
      message: 'Frontend build not found. Run npm run build from the project root.',
      health: '/api/health'
    });
  });
}

app.use(errorHandler);

module.exports = app;
