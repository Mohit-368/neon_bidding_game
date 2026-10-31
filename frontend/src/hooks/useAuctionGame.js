import { useCallback, useEffect, useMemo, useState } from 'react';
import { SESSION_STORAGE_KEY, socket } from '../lib/socket';

function readSavedSession() {
  try {
    const value = localStorage.getItem(SESSION_STORAGE_KEY);
    return value ? JSON.parse(value) : null;
  } catch {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    return null;
  }
}

export function useAuctionGame() {
  const [connection, setConnection] = useState(socket.connected ? 'connected' : 'connecting');
  const [room, setRoom] = useState(null);
  const [session, setSession] = useState(readSavedSession);
  const [timer, setTimer] = useState(null);
  const [lastAward, setLastAward] = useState(null);
  const [battleResults, setBattleResults] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const applyJoinPayload = useCallback((payload) => {
    if (!payload?.room || !payload?.session) return;
    setRoom(payload.room);
    setSession(payload.session);
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(payload.session));
    setBattleResults(payload.room.leaderboard || null);
    setError('');
  }, []);

  useEffect(() => {
    const onConnect = () => {
      setConnection('connected');
      const saved = readSavedSession();
      if (saved?.roomCode && saved?.playerId && saved?.reconnectToken) {
        socket.emit('rejoin_room', saved, (response) => {
          if (response?.ok) {
            if (response.data) applyJoinPayload(response.data);
          } else if (response?.error?.code === 'ROOM_NOT_FOUND' || response?.error?.code === 'INVALID_SESSION') {
            localStorage.removeItem(SESSION_STORAGE_KEY);
            setSession(null);
          }
        });
      }
    };
    const onDisconnect = () => setConnection('disconnected');
    const onConnectError = () => setConnection('reconnecting');
    const onRoomCreated = applyJoinPayload;
    const onRoomJoined = applyJoinPayload;
    const onRoomState = (nextRoom) => {
      setRoom(nextRoom);
      if (nextRoom?.leaderboard) setBattleResults(nextRoom.leaderboard);
    };
    const onNextItem = (payload) => {
      setTimer({ endsAt: payload.endsAt, remainingSeconds: payload.durationSeconds, remainingMs: payload.durationSeconds * 1000 });
      setLastAward(null);
      setNotice('');
    };
    const onTimerTick = (payload) => setTimer(payload);
    const onBidUpdated = (payload) => {
      setRoom((current) => current ? {
        ...current,
        currentBid: payload.currentBid,
        highBidderId: payload.highBidderId,
        highBidderName: payload.highBidderName,
        players: current.players.map((player) => {
          const patch = payload.players?.find((candidate) => candidate.id === player.id);
          return patch ? { ...player, wallet: { ...player.wallet, ...patch.wallet } } : player;
        })
      } : current);
    };
    const onCardAwarded = (payload) => {
      setLastAward(payload);
      setNotice(payload.sold ? `${payload.winner.name} secured ${payload.card.name} for $${payload.amount}.` : `${payload.card.name} went unsold.`);
    };
    const onBattleResults = (payload) => {
      setBattleResults(payload.leaderboard || []);
      setRoom((current) => current ? { ...current, phase: 'battle', leaderboard: payload.leaderboard || [] } : current);
      setTimer(null);
    };
    const onGameError = (payload) => setError(payload?.message || 'Something went wrong.');

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
    socket.on('room_created', onRoomCreated);
    socket.on('room_joined', onRoomJoined);
    socket.on('room_state_updated', onRoomState);
    socket.on('next_item', onNextItem);
    socket.on('timer_tick', onTimerTick);
    socket.on('bid_updated', onBidUpdated);
    socket.on('card_awarded', onCardAwarded);
    socket.on('game_over_battle_results', onBattleResults);
    socket.on('game_error', onGameError);

    socket.connect();

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.off('room_created', onRoomCreated);
      socket.off('room_joined', onRoomJoined);
      socket.off('room_state_updated', onRoomState);
      socket.off('next_item', onNextItem);
      socket.off('timer_tick', onTimerTick);
      socket.off('bid_updated', onBidUpdated);
      socket.off('card_awarded', onCardAwarded);
      socket.off('game_over_battle_results', onBattleResults);
      socket.off('game_error', onGameError);
    };
  }, [applyJoinPayload]);

  const request = useCallback((eventName, payload = {}) => new Promise((resolve, reject) => {
    if (!socket.connected) {
      const connectionError = new Error('Server connection is unavailable. Reconnecting now.');
      setError(connectionError.message);
      reject(connectionError);
      return;
    }
    const timeout = window.setTimeout(() => reject(new Error('The server did not respond. Try again.')), 9000);
    socket.emit(eventName, payload, (response) => {
      window.clearTimeout(timeout);
      if (response?.ok) {
        resolve(response.data);
      } else {
        const requestError = new Error(response?.error?.message || 'The request could not be completed.');
        setError(requestError.message);
        reject(requestError);
      }
    });
  }), []);

  const createRoom = useCallback(async (name, budget) => {
    setError('');
    return request('create_room', { name, budget });
  }, [request]);

  const joinRoom = useCallback(async (name, roomCode) => {
    setError('');
    return request('join_room', { name, roomCode });
  }, [request]);

  const joinRandomRoom = useCallback(async (name) => {
    setError('');
    return request('join_random_room', { name });
  }, [request]);

  const updateBudget = useCallback(async (budget) => {
    setError('');
    return request('update_room_settings', { roomCode: room?.roomCode, budget });
  }, [request, room?.roomCode]);

  const startGame = useCallback(async () => {
    setError('');
    return request('start_game', { roomCode: room?.roomCode });
  }, [request, room?.roomCode]);

  const placeBid = useCallback(async (amount) => {
    setError('');
    return request('place_bid', { roomCode: room?.roomCode, amount });
  }, [request, room?.roomCode]);

  const leaveRoom = useCallback(async () => {
    try {
      await request('leave_room', { roomCode: room?.roomCode });
    } catch {
      // Clear the local session even when the server connection is already gone.
    } finally {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      setRoom(null);
      setSession(null);
      setTimer(null);
      setBattleResults(null);
      setLastAward(null);
      setError('');
    }
  }, [request, room?.roomCode]);

  const dismissError = useCallback(() => setError(''), []);
  const dismissNotice = useCallback(() => setNotice(''), []);
  const me = useMemo(() => room?.players?.find((player) => player.id === session?.playerId) || null, [room, session]);

  return {
    connection, room, session, me, timer, lastAward, battleResults, error, notice,
    createRoom, joinRoom, joinRandomRoom, updateBudget, startGame, placeBid, leaveRoom,
    dismissError, dismissNotice
  };
}
