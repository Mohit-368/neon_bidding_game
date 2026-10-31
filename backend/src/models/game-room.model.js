const { createPlayerId, createReconnectToken } = require('../utils/room-code');

function createPlayer(name, startingBudget, isAdmin = false) {
  return {
    id: createPlayerId(),
    name,
    isAdmin,
    connected: true,
    socketId: null,
    reconnectToken: createReconnectToken(),
    joinedAt: Date.now(),
    initialBudget: startingBudget,
    balance: startingBudget,
    reservedAmount: 0,
    deck: [],
    disconnectTimeout: null
  };
}

function createGameRoom(code, startingBudget, firstPlayer) {
  return {
    code,
    phase: 'waiting',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    startingBudget,
    players: [firstPlayer],
    cardPool: [],
    poolIndex: 0,
    currentItem: null,
    currentBid: 0,
    highBidderId: null,
    itemNumber: 0,
    itemEndsAt: null,
    timerInterval: null,
    endTimeout: null,
    advanceTimeout: null,
    battleResults: null
  };
}

module.exports = { createPlayer, createGameRoom };
