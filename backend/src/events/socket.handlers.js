const { AuctionService } = require('../services/auction.service');
const config = require('../config/env');
const { normalizeName, normalizeRoomCode, normalizeBudget, normalizeBid } = require('../utils/validators');

function registerSocketHandlers(io) {
  const auctionService = new AuctionService(io);

  io.on('connection', (socket) => {
    socket.on('create_room', (payload = {}, acknowledge) => execute(socket, acknowledge, () => {
      const name = normalizeName(payload.name);
      const budget = normalizeBudget(payload.budget, config.defaultStartingBudget);
      const result = auctionService.createRoom({ name, budget, socket });
      socket.emit('room_created', result);
      return result;
    }));

    socket.on('join_room', (payload = {}, acknowledge) => execute(socket, acknowledge, () => {
      const name = normalizeName(payload.name);
      const roomCode = normalizeRoomCode(payload.roomCode);
      const result = auctionService.joinRoom({ roomCode, name, socket });
      socket.emit('room_joined', result);
      return result;
    }));

    socket.on('join_random_room', (payload = {}, acknowledge) => execute(socket, acknowledge, () => {
      const name = normalizeName(payload.name);
      const result = auctionService.joinRandomRoom({ name, socket });
      socket.emit('room_joined', result);
      return result;
    }));

    socket.on('rejoin_room', (payload = {}, acknowledge) => execute(socket, acknowledge, () => {
      const roomCode = normalizeRoomCode(payload.roomCode);
      const result = auctionService.rejoinRoom({
        roomCode,
        playerId: payload.playerId,
        reconnectToken: payload.reconnectToken,
        socket
      });
      socket.emit('room_joined', result);
      return result;
    }));

    socket.on('update_room_settings', (payload = {}, acknowledge) => execute(socket, acknowledge, () => {
      const roomCode = normalizeRoomCode(payload.roomCode);
      const budget = normalizeBudget(payload.budget, config.defaultStartingBudget);
      return auctionService.updateSettings({ roomCode, playerId: socket.data.playerId, budget });
    }));

    socket.on('start_game', (payload = {}, acknowledge) => execute(socket, acknowledge, () => {
      const roomCode = normalizeRoomCode(payload.roomCode);
      return auctionService.startGame({ roomCode, playerId: socket.data.playerId });
    }));

    socket.on('place_bid', (payload = {}, acknowledge) => execute(socket, acknowledge, () => {
      const roomCode = normalizeRoomCode(payload.roomCode);
      const amount = normalizeBid(payload.amount);
      return auctionService.placeBid({ roomCode, playerId: socket.data.playerId, amount });
    }));

    socket.on('leave_room', (payload = {}, acknowledge) => execute(socket, acknowledge, () => {
      auctionService.leaveRoom(socket);
      return { left: true };
    }));

    socket.on('disconnect', () => auctionService.disconnectSocket(socket));
  });
}

function execute(socket, acknowledge, action) {
  try {
    const result = action();
    if (typeof acknowledge === 'function') acknowledge({ ok: true, data: result });
  } catch (error) {
    const response = {
      ok: false,
      error: {
        code: error.code || 'INTERNAL_ERROR',
        message: error.message || 'The request could not be completed.'
      }
    };
    socket.emit('game_error', response.error);
    if (typeof acknowledge === 'function') acknowledge(response);
  }
}

module.exports = { registerSocketHandlers };
