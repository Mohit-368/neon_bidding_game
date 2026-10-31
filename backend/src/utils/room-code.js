const crypto = require('node:crypto');
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function createRoomCode(existingCodes) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const bytes = crypto.randomBytes(6);
    let code = '';
    for (const byte of bytes) code += ALPHABET[byte % ALPHABET.length];
    if (!existingCodes.has(code)) return code;
  }
  throw new Error('Unable to allocate a unique room code.');
}

function createPlayerId() {
  return crypto.randomUUID();
}

function createReconnectToken() {
  return crypto.randomBytes(32).toString('hex');
}

module.exports = { createRoomCode, createPlayerId, createReconnectToken };
