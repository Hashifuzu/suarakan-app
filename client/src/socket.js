import { io } from 'socket.io-client';

// Dynamic host resolution:
// If running on a mobile device accessing via LAN (e.g., http://192.168.1.8:3000),
// automatically point backend to the same host IP on port 5000!
const getBackendUrl = () => {
  if (import.meta.env.VITE_BACKEND_URL) {
    return import.meta.env.VITE_BACKEND_URL;
  }
  if (typeof window !== 'undefined' && window.location.hostname) {
    // If opened on localhost / 127.0.0.1 or LAN IP (192.168.x.x)
    return `http://${window.location.hostname}:5000`;
  }
  return 'http://localhost:5000';
};

const BACKEND_URL = getBackendUrl();

export const socket = io(BACKEND_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000
});

export const API_BASE_URL = `${BACKEND_URL}/api`;
