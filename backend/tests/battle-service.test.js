const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateBattleResults } = require('../src/services/battle.service');

test('battle results sum hidden power and rank players on the server', () => {
  const results = calculateBattleResults([
    { id: 'p1', name: 'One', initialBudget: 20, balance: 10, deck: [{ id: 'a', name: 'A', image: '/a.svg', tier: 'Common', power: 30, paidPrice: 10 }] },
    { id: 'p2', name: 'Two', initialBudget: 20, balance: 5, deck: [{ id: 'b', name: 'B', image: '/b.svg', tier: 'Epic', power: 50, paidPrice: 15 }] }
  ]);
  assert.equal(results[0].playerId, 'p2');
  assert.equal(results[0].totalPower, 50);
  assert.equal(results[0].rank, 1);
  assert.equal(results[1].totalPower, 30);
  assert.equal(results[1].rank, 2);
  assert.equal(results[0].cards[0].power, undefined);
});
