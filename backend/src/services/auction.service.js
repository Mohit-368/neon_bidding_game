const crypto = require('node:crypto');
const config = require('../config/env');
const { AppError } = require('../utils/errors');
const { createRoomCode } = require('../utils/room-code');
const { createPlayer, createGameRoom } = require('../models/game-room.model');
const { getAllCards, getCardCount } = require('../repositories/card.repository');
const { buildPublicRoomState } = require('../utils/room-state');
const { toPublicCard, toPublicDeckCard } = require('../utils/public-card');
const { validateBid } = require('./bid-rules.service');
const { calculateBattleResults } = require('./battle.service');

class AuctionService {
  constructor(io) {
    this.io = io;
    this.rooms = new Map();
  }

  createRoom({ name, budget, socket }) {
    const code = createRoomCode(this.rooms);
    const player = createPlayer(name, budget, true);
    const room = createGameRoom(code, budget, player);
    this.rooms.set(code, room);
    this.attachSocket(socket, room, player);
    socket.join(code);
    this.emitRoomState(room);
    return this.joinPayload(room, player);
  }

  joinRoom({ roomCode, name, socket }) {
    const room = this.getRoom(roomCode);
    if (room.phase !== 'waiting') throw new AppError('This game has already started.', 409, 'GAME_ALREADY_STARTED');
    if (room.players.length >= 4) throw new AppError('This room already has 4 players.', 409, 'ROOM_FULL');
    const shouldPromote = !room.players.some((candidate) => candidate.isAdmin && candidate.connected);
    if (shouldPromote) room.players.forEach((candidate) => { candidate.isAdmin = false; });
    const player = createPlayer(name, room.startingBudget, shouldPromote);
    room.players.push(player);
    room.updatedAt = Date.now();
    this.attachSocket(socket, room, player);
    socket.join(room.code);
    this.emitRoomState(room);
    return this.joinPayload(room, player);
  }

  joinRandomRoom({ name, socket }) {
    const availableRooms = [...this.rooms.values()].filter((room) =>
      room.phase === 'waiting' && room.players.length < 4
    );
    if (availableRooms.length === 0) {
      return this.createRoom({ name, budget: config.defaultStartingBudget, socket });
    }
    const room = availableRooms[crypto.randomInt(availableRooms.length)];
    const shouldPromote = !room.players.some((candidate) => candidate.isAdmin && candidate.connected);
    if (shouldPromote) room.players.forEach((candidate) => { candidate.isAdmin = false; });
    const player = createPlayer(name, room.startingBudget, shouldPromote);
    room.players.push(player);
    room.updatedAt = Date.now();
    this.attachSocket(socket, room, player);
    socket.join(room.code);
    this.emitRoomState(room);
    return this.joinPayload(room, player);
  }

  rejoinRoom({ roomCode, playerId, reconnectToken, socket }) {
    const room = this.getRoom(roomCode);
    const player = room.players.find((candidate) => candidate.id === playerId);
    if (!player || !safeTokenEquals(player.reconnectToken, reconnectToken)) {
      throw new AppError('This reconnect session is invalid or expired.', 403, 'INVALID_SESSION');
    }
    if (player.disconnectTimeout) {
      clearTimeout(player.disconnectTimeout);
      player.disconnectTimeout = null;
    }
    player.connected = true;
    room.updatedAt = Date.now();
    this.attachSocket(socket, room, player);
    socket.join(room.code);
    this.emitRoomState(room);
    return this.joinPayload(room, player);
  }

  updateSettings({ roomCode, playerId, budget }) {
    const room = this.getRoom(roomCode);
    this.assertAdmin(room, playerId);
    if (room.phase !== 'waiting') throw new AppError('Room settings are locked after the game starts.', 409);
    room.startingBudget = budget;
    room.players.forEach((player) => {
      player.initialBudget = budget;
      player.balance = budget;
      player.reservedAmount = 0;
    });
    room.updatedAt = Date.now();
    this.emitRoomState(room);
    return buildPublicRoomState(room);
  }

  startGame({ roomCode, playerId }) {
    const room = this.getRoom(roomCode);
    this.assertAdmin(room, playerId);
    if (room.phase !== 'waiting') throw new AppError('This game has already started.', 409);
    const connectedPlayers = room.players.filter((player) => player.connected);
    if (connectedPlayers.length < 2) throw new AppError('At least 2 connected players are required to start.', 409, 'NOT_ENOUGH_PLAYERS');
    if (getCardCount() < connectedPlayers.length) throw new AppError('Add more cards to card_database.json before starting.');

    // Starting the match freezes the table. Offline waiting-room guests are removed.
    room.players.forEach((player) => {
      if (player.disconnectTimeout) clearTimeout(player.disconnectTimeout);
      player.disconnectTimeout = null;
    });
    room.players = connectedPlayers;
    room.phase = 'bidding';
    room.cardPool = shuffle(getAllCards());
    room.poolIndex = 0;
    room.itemNumber = 0;
    room.updatedAt = Date.now();
    this.openNextItem(room);
    return buildPublicRoomState(room);
  }

  placeBid({ roomCode, playerId, amount }) {
    const room = this.getRoom(roomCode);
    if (room.phase !== 'bidding' || !room.currentItem) throw new AppError('There is no active auction.', 409, 'NO_ACTIVE_AUCTION');
    if (Date.now() >= room.itemEndsAt) {
      this.resolveCurrentItem(room);
      throw new AppError('The bidding timer has expired.', 409, 'BIDDING_CLOSED');
    }
    const player = room.players.find((candidate) => candidate.id === playerId);
    validateBid({
      player,
      amount,
      currentBid: room.currentBid,
      highBidderId: room.highBidderId,
      now: Date.now(),
      itemEndsAt: room.itemEndsAt
    });

    const previousLeader = room.players.find((candidate) => candidate.id === room.highBidderId);
    if (previousLeader) previousLeader.reservedAmount = 0;
    player.reservedAmount = amount;
    room.currentBid = amount;
    room.highBidderId = player.id;
    room.updatedAt = Date.now();

    this.io.to(room.code).emit('bid_updated', {
      currentBid: room.currentBid,
      highBidderId: room.highBidderId,
      highBidderName: player.name,
      players: room.players.map((candidate) => ({
        id: candidate.id,
        wallet: {
          balance: candidate.balance,
          reserved: candidate.reservedAmount,
          available: Math.max(0, candidate.balance - candidate.reservedAmount)
        }
      }))
    });
    this.emitRoomState(room);
    return { accepted: true, amount, playerId: player.id };
  }

  disconnectSocket(socket) {
    const { roomCode, playerId } = socket.data || {};
    if (!roomCode || !playerId) return;
    const room = this.rooms.get(roomCode);
    if (!room) return;
    const player = room.players.find((candidate) => candidate.id === playerId);
    if (!player || player.socketId !== socket.id) return;
    player.connected = false;
    room.updatedAt = Date.now();

    if (player.isAdmin) {
      const nextAdmin = room.players.find((candidate) => candidate.id !== player.id && candidate.connected);
      if (nextAdmin) {
        player.isAdmin = false;
        nextAdmin.isAdmin = true;
      }
    }

    if (room.phase === 'waiting') {
      player.disconnectTimeout = setTimeout(() => {
        this.removePlayer(room.code, player.id);
      }, config.disconnectGraceSeconds * 1000);
      player.disconnectTimeout.unref?.();
    }
    this.emitRoomState(room);
  }

  leaveRoom(socket) {
    const { roomCode, playerId } = socket.data || {};
    if (!roomCode || !playerId) return;
    socket.leave(roomCode);
    this.removePlayer(roomCode, playerId);
    socket.data.roomCode = null;
    socket.data.playerId = null;
  }

  removePlayer(roomCode, playerId) {
    const room = this.rooms.get(roomCode);
    if (!room) return;
    const index = room.players.findIndex((player) => player.id === playerId);
    if (index < 0) return;
    const [player] = room.players.splice(index, 1);
    if (player.disconnectTimeout) clearTimeout(player.disconnectTimeout);

    if (player.id === room.highBidderId) {
      room.highBidderId = null;
      room.currentBid = 0;
      room.players.forEach((candidate) => { candidate.reservedAmount = 0; });
    }
    if (room.players.length === 0) {
      this.destroyRoom(room);
      return;
    }
    if (!room.players.some((candidate) => candidate.isAdmin)) room.players[0].isAdmin = true;
    room.updatedAt = Date.now();
    this.emitRoomState(room);
  }

  openNextItem(room) {
    if (room.phase !== 'bidding') return;
    if (this.allHandsFull(room) || room.poolIndex >= room.cardPool.length) {
      this.finishBattle(room, this.allHandsFull(room) ? 'all_hands_full' : 'card_pool_exhausted');
      return;
    }

    room.currentItem = room.cardPool[room.poolIndex];
    room.poolIndex += 1;
    room.itemNumber += 1;
    room.currentBid = 0;
    room.highBidderId = null;
    room.itemEndsAt = Date.now() + config.auctionDurationSeconds * 1000;
    room.updatedAt = Date.now();

    this.io.to(room.code).emit('next_item', {
      card: toPublicCard(room.currentItem),
      itemNumber: room.itemNumber,
      totalItems: room.cardPool.length,
      startingBid: 1,
      durationSeconds: config.auctionDurationSeconds,
      endsAt: room.itemEndsAt
    });
    this.emitRoomState(room);

    if (room.timerInterval) clearInterval(room.timerInterval);
    if (room.endTimeout) clearTimeout(room.endTimeout);
    room.timerInterval = setInterval(() => {
      const remainingMs = Math.max(0, room.itemEndsAt - Date.now());
      this.io.to(room.code).emit('timer_tick', {
        remainingSeconds: Math.ceil(remainingMs / 1000),
        remainingMs,
        endsAt: room.itemEndsAt
      });
      if (remainingMs <= 0 && room.timerInterval) {
        clearInterval(room.timerInterval);
        room.timerInterval = null;
      }
    }, 250);
    room.timerInterval.unref?.();
    room.endTimeout = setTimeout(() => this.resolveCurrentItem(room), config.auctionDurationSeconds * 1000);
    room.endTimeout.unref?.();
  }

  resolveCurrentItem(room) {
    if (room.phase !== 'bidding' || !room.currentItem) return;
    if (room.timerInterval) clearInterval(room.timerInterval);
    if (room.endTimeout) clearTimeout(room.endTimeout);
    room.timerInterval = null;
    room.endTimeout = null;

    const card = room.currentItem;
    const winner = room.players.find((player) => player.id === room.highBidderId) || null;
    let award = { sold: false, card: toPublicCard(card), winner: null, amount: 0 };

    if (winner) {
      winner.balance -= room.currentBid;
      winner.reservedAmount = 0;
      winner.deck.push({ ...card, paidPrice: room.currentBid });
      award = {
        sold: true,
        card: toPublicDeckCard({ ...card, paidPrice: room.currentBid }),
        winner: { id: winner.id, name: winner.name },
        amount: room.currentBid
      };
    }

    room.currentItem = null;
    room.itemEndsAt = null;
    room.currentBid = 0;
    room.highBidderId = null;
    room.updatedAt = Date.now();
    this.io.to(room.code).emit('card_awarded', award);
    this.emitRoomState(room);

    if (this.allHandsFull(room) || room.poolIndex >= room.cardPool.length) {
      this.finishBattle(room, this.allHandsFull(room) ? 'all_hands_full' : 'card_pool_exhausted');
      return;
    }

    room.advanceTimeout = setTimeout(() => this.openNextItem(room), 1100);
    room.advanceTimeout.unref?.();
  }

  finishBattle(room, reason) {
    if (room.phase === 'battle') return;
    this.clearRoomTimers(room);
    room.phase = 'battle';
    room.currentItem = null;
    room.itemEndsAt = null;
    room.currentBid = 0;
    room.highBidderId = null;
    room.players.forEach((player) => { player.reservedAmount = 0; });
    room.battleResults = calculateBattleResults(room.players);
    room.updatedAt = Date.now();

    this.emitRoomState(room);
    this.io.to(room.code).emit('game_over_battle_results', {
      reason,
      leaderboard: room.battleResults,
      completedAt: room.updatedAt
    });
  }

  allHandsFull(room) {
    return room.players.length > 0 && room.players.every((player) => player.deck.length >= 5);
  }

  emitRoomState(room) {
    this.io.to(room.code).emit('room_state_updated', buildPublicRoomState(room));
  }

  joinPayload(room, player) {
    return {
      room: buildPublicRoomState(room),
      session: {
        roomCode: room.code,
        playerId: player.id,
        reconnectToken: player.reconnectToken
      }
    };
  }

  attachSocket(socket, room, player) {
    player.socketId = socket.id;
    socket.data.roomCode = room.code;
    socket.data.playerId = player.id;
  }

  getRoom(roomCode) {
    const room = this.rooms.get(roomCode);
    if (!room) throw new AppError('Room not found. Check the code and try again.', 404, 'ROOM_NOT_FOUND');
    return room;
  }

  assertAdmin(room, playerId) {
    const player = room.players.find((candidate) => candidate.id === playerId);
    if (!player || !player.isAdmin) throw new AppError('Only the room admin can do that.', 403, 'ADMIN_ONLY');
    if (!player.connected) throw new AppError('The room admin must be connected.', 403, 'ADMIN_OFFLINE');
  }

  clearRoomTimers(room) {
    if (room.timerInterval) clearInterval(room.timerInterval);
    if (room.endTimeout) clearTimeout(room.endTimeout);
    if (room.advanceTimeout) clearTimeout(room.advanceTimeout);
    room.timerInterval = null;
    room.endTimeout = null;
    room.advanceTimeout = null;
  }

  destroyRoom(room) {
    this.clearRoomTimers(room);
    room.players.forEach((player) => {
      if (player.disconnectTimeout) clearTimeout(player.disconnectTimeout);
    });
    this.rooms.delete(room.code);
  }
}

function shuffle(items) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = crypto.randomInt(index + 1);
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function safeTokenEquals(left, right) {
  if (typeof left !== 'string' || typeof right !== 'string') return false;
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

module.exports = { AuctionService };
