import { io } from 'socket.io-client';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const SOCKET_URL = new URL(API_URL).origin;

let socket = null;
let lastRole = null;

// Clean up socket when page enters the browser Back-Forward Cache (bfcache).
// Without this, the old WebSocket lingers and produces noisy reconnect errors
// once the page is restored via back/forward navigation.
const onBeforeUnload = () => { if (socket) socket.disconnect(); };

// On bfcache restore, reconnect the socket with the same role used before.
const onPageshow = (event) => {
  if (event.persisted && lastRole) {
    // Give the page a moment to render before reconnecting
    setTimeout(() => connectSocket(lastRole), 200);
  }
};

// Attach lifecycle listeners once at module load
if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', onBeforeUnload);
  window.addEventListener('pageshow', onPageshow);
}

export function connectSocket(role) {
  lastRole = role;
  if (socket) {
    socket.connect();
    return socket;
  }
  socket = io(SOCKET_URL, {
    query: { role },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 500,
    reconnectionDelayMax: 5000
  });

  socket.on('connect', () => {
    console.log('Socket connected');
  });

  socket.on('reconnect_attempt', () => {
    // auto-reconnect; no logging spam
  });

  socket.on('reconnect', () => {
    console.log('Socket reconnected');
  });

  socket.on('connect_error', () => {
    // transient (backend restart / tab freeze) — socket.io retries automatically
  });

  socket.on('disconnect', () => {
    // transient — socket.io reconnects automatically
  });

  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  lastRole = null;
}