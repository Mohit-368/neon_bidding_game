const test = require('node:test');
const assert = require('node:assert/strict');
const { validateBid } = require('../src/services/bid-rules.service');

function player(overrides = {}) {
  return { id: 'p1', connected: true, deck: [], balance: 20, reservedAmount: 0, ...overrides };
}
const base = { amount: 5, currentBid: 4, highBidderId: null, now: 1000, itemEndsAt: 11000 };

test('accepts a valid bid within the available wallet', () => {
  assert.equal(validateBid({ ...base, player: player() }), true);
});

test('rejects a bid that does not exceed the current bid', () => {
  assert.throws(() => validateBid({ ...base, amount: 4, player: player() }), /higher than/);
});

test('rejects a bid above the available wallet', () => {
  assert.throws(() => validateBid({ ...base, amount: 21, player: player() }), /maximum available bid/);
});

test('lets the current high bidder raise their reserved bid up to wallet balance', () => {
  const leader = player({ reservedAmount: 8 });
  assert.equal(validateBid({ ...base, amount: 14, currentBid: 8, highBidderId: 'p1', player: leader }), true);
});

test('rejects bidding after the hand is full', () => {
  const fullPlayer = player({ deck: [{}, {}, {}, {}, {}] });
  assert.throws(() => validateBid({ ...base, player: fullPlayer }), /5-card hand/);
});

test('rejects bidding after the server deadline', () => {
  assert.throws(() => validateBid({ ...base, now: 11000, player: player() }), /timer has expired/);
});
