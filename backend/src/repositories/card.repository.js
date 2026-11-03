const fs = require('node:fs');
const path = require('node:path');

let databasePath = ""; 
const randomNumber = Math.floor(Math.random() * 3) + 1;

// 2. Corrected 'elif' to 'else if'
if (randomNumber === 1) {
  databasePath = path.resolve(__dirname, '../../data/card_database.json');
} else if (randomNumber === 2) {
  databasePath = path.resolve(__dirname, '../../data/card_database2.json');
} else {
  databasePath = path.resolve(__dirname, '../../data/card_database3.json');
}

path.resolve(__dirname, '../../data/card_database.json');
const validTiers = new Set(['Common', 'Epic', 'Legendary']);

function loadCards() {
  const raw = fs.readFileSync(databasePath, 'utf8');
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed) || parsed.length < 5) {
    throw new Error('card_database.json must contain at least 5 cards.');
  }

  const ids = new Set();
  return parsed.map((card, index) => {
    if (!card || typeof card !== 'object') throw new Error(`Card ${index + 1} must be an object.`);
    const { id, name, image, power, tier } = card;
    if (!id || typeof id !== 'string' || ids.has(id)) throw new Error(`Card ${index + 1} has a missing or duplicate id.`);
    if (typeof name !== 'string' || !name.trim()) throw new Error(`Card ${id} has an invalid name.`);
    if (typeof image !== 'string' || !image.startsWith('/')) throw new Error(`Card ${id} image must be a local absolute path.`);
    if (!Number.isSafeInteger(power) || power < 1) throw new Error(`Card ${id} must have a positive integer power.`);
    if (!validTiers.has(tier)) throw new Error(`Card ${id} has an unsupported tier.`);
    ids.add(id);
    return Object.freeze({ id, name: name.trim(), image, power, tier });
  });
}

const CARDS = loadCards();

function getAllCards() {
  return CARDS.map((card) => ({ ...card }));
}

function getCardCount() {
  return CARDS.length;
}

module.exports = { getAllCards, getCardCount };
