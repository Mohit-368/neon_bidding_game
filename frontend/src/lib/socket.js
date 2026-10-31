import { io } from 'socket.io-client';

export const socket = io(import.meta.env.VITE_SERVER_URL || undefined, {
  autoConnect: false,
  path: '/socket.io',
  transports: ['websocket', 'polling'],
  withCredentials: true,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 500,
  reconnectionDelayMax: 5000,
  timeout: 10000
});

export const SESSION_STORAGE_KEY = 'auction-arena-session-v1';
