import { io } from "socket.io-client";

export const socket = io("http://localhost:8000"); 
// ⚠️ pon tu URL real backend