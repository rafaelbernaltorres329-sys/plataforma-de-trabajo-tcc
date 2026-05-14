import { io } from "socket.io-client";

export const socket = io(
  "https://plataforma-de-trabajo-tcc-production.up.railway.app",
  {
    withCredentials: true,
  }
);