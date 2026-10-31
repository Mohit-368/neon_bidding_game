const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');

// The test suite focuses on game logic and does not need dotenv to be installed first.
const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === 'dotenv') return { config: () => ({ parsed: {} }) };
  return originalLoad.call(this, request, parent, isMain);
};
const { AuctionService } = require('../src/services/auction.service');
Module._load = originalLoad;

test('two-player auction reserves bids, awards the card, and reveals only final total power', () => {
  const emitted = [];
  const io = { to: (room) => ({ emit: (event, payload) => emitted.push({ room, event, payload }) }) };
  const service = new AuctionService(io);
  const socketOne = { id: 'socket-one', data: {}, join() {}, leave() {}, emit() {} };
  const socketTwo = { id: 'socket-two', data: {}, join() {}, leave() {}, emit() {} };

  const one = service.createRoom({ name: 'Alpha', budget: 20, socket: socketOne });
  const two = service.joinRoom({ roomCode: one.session.roomCode, name: 'Bravo', socket: socketTwo });
  service.startGame({ roomCode: one.session.roomCode, playerId: one.session.playerId });

  const room = service.rooms.get(one.session.roomCode);
  const hiddenPower = room.currentItem.power;
  service.placeBid({ roomCode: room.code, playerId: one.session.playerId, amount: 4 });
  service.placeBid({ roomCode: room.code, playerId: two.session.playerId, amount: 7 });

  assert.equal(room.players[0].reservedAmount, 0);
  assert.equal(room.players[1].reservedAmount, 7);

  room.poolIndex = room.cardPool.length;
  service.resolveCurrentItem(room);

  const award = emitted.find((entry) => entry.event === 'card_awarded').payload;
  const results = emitted.find((entry) => entry.event === 'game_over_battle_results').payload;
  assert.equal(award.winner.id, two.session.playerId);
  assert.equal(award.amount, 7);
  assert.equal(room.players[1].balance, 13);
  assert.equal(results.leaderboard[0].totalPower, hiddenPower);
  assert.equal(JSON.stringify(award).includes('"power"'), false);
  assert.equal(JSON.stringify(results.leaderboard[0].cards).includes('"power"'), false);
  assert.equal(room.phase, 'battle');
  service.clearRoomTimers(room);
});
