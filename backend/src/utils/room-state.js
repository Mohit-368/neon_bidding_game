const { toPublicCard, toPublicDeckCard } = require('./public-card');

function serializePlayer(player) {
  return {
    id: player.id,
    name: player.name,
    isAdmin: player.isAdmin,
    connected: player.connected,
    wallet: {
      initial: player.initialBudget,
      balance: player.balance,
      reserved: player.reservedAmount,
      available: Math.max(0, player.balance - player.reservedAmount),
      spent: player.initialBudget - player.balance
    },
    deckCount: player.deck.length,
    deck: player.deck.map(toPublicDeckCard)
  };
}

function buildPublicRoomState(room) {
  const highBidder = room.players.find((player) => player.id === room.highBidderId) || null;
  return {
    roomCode: room.code,
    phase: room.phase,
    startingBudget: room.startingBudget,
    maxPlayers: 4,
    maxCardsPerPlayer: 5,
    auctionDurationSeconds: Number(process.env.AUCTION_DURATION_SECONDS || 10),
    players: room.players.map(serializePlayer),
    currentItem: toPublicCard(room.currentItem),
    currentBid: room.currentBid,
    highBidderId: room.highBidderId,
    highBidderName: highBidder ? highBidder.name : null,
    itemNumber: room.itemNumber,
    totalItems: room.cardPool.length,
    cardsRemaining: Math.max(0, room.cardPool.length - room.poolIndex),
    timerEndsAt: room.itemEndsAt,
    leaderboard: room.battleResults
  };
}

module.exports = { buildPublicRoomState };
