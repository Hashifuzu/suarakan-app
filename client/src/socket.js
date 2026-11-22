import { io } from 'socket.io-client';

// If deployed on Vercel or production with env variable, use that, otherwise default to local server or current host
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export const socket = io(BACKEND_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000
});

export const API_BASE_URL = `${BACKEND_URL}/api`;
