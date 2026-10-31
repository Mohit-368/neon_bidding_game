function toPublicCard(card) {
  if (!card) return null;
  // Deliberately whitelist public fields. Never spread the internal card object here.
  return {
    id: card.id,
    name: card.name,
    image: card.image,
    tier: card.tier
  };
}

function toPublicDeckCard(card) {
  return {
    ...toPublicCard(card),
    paidPrice: card.paidPrice
  };
}

module.exports = { toPublicCard, toPublicDeckCard };
