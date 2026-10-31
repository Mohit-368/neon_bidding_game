const path = require('node:path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
require('dotenv').config();

function readInteger(name, fallback, { min = 1, max = Number.MAX_SAFE_INTEGER } = {}) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const value = Number.parseInt(raw, 10);
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new Error(`Invalid ${name}. Expected an integer between ${min} and ${max}.`);
  }
  return value;
}

const nodeEnv = process.env.NODE_ENV || 'development';
const defaultClientOrigin = nodeEnv === 'production' ? '' : 'http://localhost:5173';
const clientOrigins = (process.env.CLIENT_ORIGIN ?? defaultClientOrigin)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

module.exports = Object.freeze({
  nodeEnv,
  port: readInteger('PORT', 4000, { min: 1, max: 65535 }),
  clientOrigins,
  auctionDurationSeconds: readInteger('AUCTION_DURATION_SECONDS', 10, { min: 5, max: 60 }),
  disconnectGraceSeconds: readInteger('ROOM_DISCONNECT_GRACE_SECONDS', 60, { min: 10, max: 600 }),
  defaultStartingBudget: readInteger('DEFAULT_STARTING_BUDGET', 20, { min: 1, max: 100000 })
});
