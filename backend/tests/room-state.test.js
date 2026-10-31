const test = require('node:test');
const assert = require('node:assert/strict');
const { buildPublicRoomState } = require('../src/utils/room-state');

test('room state excludes card power from the current item and awarded deck cards', () => {
  const card = { id: 'pk-01', name: 'Pikachu', image: '/pokemon_cards/pikachu.svg', power: 72, tier: 'Epic', paidPrice: 5 };
  const room = {
    code: 'ABC123', phase: 'bidding', startingBudget: 20, players: [{
      id: 'player-1', name: 'Player One', isAdmin: true, connected: true,
      initialBudget: 20, balance: 15, reservedAmount: 0, deck: [card]
    }],
    currentItem: card, currentBid: 0, highBidderId: null, itemNumber: 1,
    cardPool: [card], poolIndex: 1, itemEndsAt: 12345, battleResults: null
  };
  const state = buildPublicRoomState(room);
  assert.equal(state.currentItem.power, undefined);
  assert.equal(state.players[0].deck[0].power, undefined);
  assert.equal(JSON.stringify(state).includes('"power"'), false);
});
