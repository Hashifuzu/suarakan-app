import { io } from 'socket.io-client';

// Dynamic host & backend resolution:
// 1. If VITE_BACKEND_URL is set, use it.
// 2. If running on Vercel or any HTTPS domain, use relative path ("") so that
//    API calls seamlessly query /api/... on the same origin without CORS or Mixed Content issues.
// 3. If running locally or on mobile via LAN IP (e.g. http://192.168.1.8:3000), point to port 5000.
const getBackendUrl = () => {
  if (import.meta.env.VITE_BACKEND_URL) {
    return import.meta.env.VITE_BACKEND_URL;
  }
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    const protocol = window.location.protocol;

    // Production / Vercel deployment:
    if (protocol === 'https:' || host.endsWith('vercel.app')) {
      return ''; // Relative path for API
    }

    // Local / LAN access:
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:5000';
    }
    return `http://${host}:5000`;
  }
  return 'http://localhost:5000';
};

const BACKEND_URL = getBackendUrl();
const isVercel = typeof window !== 'undefined' && 
  (window.location.protocol === 'https:' || window.location.hostname.endsWith('vercel.app'));

export const socket = io(BACKEND_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000'), {
  autoConnect: !isVercel,
  reconnection: true,
  reconnectionAttempts: 3,
  reconnectionDelay: 2000,
  transports: ['websocket', 'polling']
});

export const API_BASE_URL = BACKEND_URL ? `${BACKEND_URL}/api` : '/api';
