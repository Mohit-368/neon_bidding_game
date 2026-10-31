const { AppError } = require('./errors');

function normalizeName(value) {
  if (typeof value !== 'string') throw new AppError('Enter a player name.');
  const name = value.trim().replace(/\s+/g, ' ');
  if (name.length < 2 || name.length > 18) {
    throw new AppError('Player name must be between 2 and 18 characters.');
  }
  return name;
}

function normalizeRoomCode(value) {
  if (typeof value !== 'string') throw new AppError('Enter a room code.');
  const code = value.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!/^[A-Z0-9]{6}$/.test(code)) throw new AppError('Room code must contain 6 letters or numbers.');
  return code;
}

function normalizeBudget(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  const budget = Number(value);
  if (!Number.isSafeInteger(budget) || budget < 1 || budget > 100000) {
    throw new AppError('Starting budget must be a whole number between 1 and 100,000.');
  }
  return budget;
}

function normalizeBid(value) {
  const amount = Number(value);
  if (!Number.isSafeInteger(amount) || amount < 1) {
    throw new AppError('Bid must be a positive whole number.');
  }
  return amount;
}

module.exports = { normalizeName, normalizeRoomCode, normalizeBudget, normalizeBid };
