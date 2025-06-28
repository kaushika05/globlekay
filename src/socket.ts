import { io, Socket } from "socket.io-client";

// Use environment variable for socket URL, fallback to localhost:8080 for development
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || "http://localhost:8080";

const socket: Socket = io(SOCKET_URL, {
  transports: ['websocket', 'polling'],
  timeout: 20000,
  forceNew: true
});

export default socket;
