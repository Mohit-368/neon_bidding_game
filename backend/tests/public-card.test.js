const test = require('node:test');
const assert = require('node:assert/strict');
const { toPublicCard } = require('../src/utils/public-card');

 test('public card whitelist never exposes hidden power', () => {
  const internal = { id: 'pk-01', name: 'Pikachu', image: '/pokemon_cards/pikachu.svg', power: 72, tier: 'Epic' };
  const publicCard = toPublicCard(internal);
  assert.deepEqual(publicCard, {
    id: 'pk-01', name: 'Pikachu', image: '/pokemon_cards/pikachu.svg', tier: 'Epic'
  });
  assert.equal(Object.hasOwn(publicCard, 'power'), false);
});
