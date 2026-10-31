function calculateBattleResults(players) {
  const rows = players.map((player) => ({
    playerId: player.id,
    name: player.name,
    deckCount: player.deck.length,
    totalPower: player.deck.reduce((sum, card) => sum + card.power, 0),
    remainingBudget: player.balance,
    spent: player.initialBudget - player.balance,
    cards: player.deck.map((card) => ({
      id: card.id,
      name: card.name,
      image: card.image,
      tier: card.tier,
      paidPrice: card.paidPrice
    }))
  }));

  rows.sort((a, b) =>
    b.totalPower - a.totalPower ||
    b.deckCount - a.deckCount ||
    b.remainingBudget - a.remainingBudget ||
    a.name.localeCompare(b.name)
  );

  let previousKey = null;
  let previousRank = 0;
  const ranked = rows.map((row, index) => {
    const key = `${row.totalPower}:${row.deckCount}:${row.remainingBudget}`;
    const rank = key === previousKey ? previousRank : index + 1;
    previousKey = key;
    previousRank = rank;
    return { ...row, rank, isWinner: rank === 1 };
  });

  return ranked;
}

module.exports = { calculateBattleResults };
