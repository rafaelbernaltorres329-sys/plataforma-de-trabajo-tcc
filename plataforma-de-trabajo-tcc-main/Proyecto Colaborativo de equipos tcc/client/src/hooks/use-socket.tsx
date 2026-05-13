import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  _id: string;
  workspaceId?: string;
  projectId?: string | null;
  senderId: {
    _id: string;
    name: string;
    email: string;
    imageUrl?: string;
  };
  recipientId?: string;
  content: string;
  isDirect?: boolean;
  createdAt: string;
}

export interface TypingUser {
  userId: string;
  username: string;
}

interface UseSocketOptions {
  token: string | null;
  workspaceIds?: string[];
  projectIds?: string[];
  onMessageNew?: (msg: ChatMessage) => void;
  onMessageSent?: (data: { tempId: string; message: ChatMessage }) => void;
  onDmNew?: (msg: ChatMessage) => void;
  onDmSent?: (data: { tempId: string; message: ChatMessage }) => void;
  onTypingStart?: (user: TypingUser) => void;
  onTypingStop?: (data: { userId: string }) => void;
  onUserOnline?: (data: { userId: string }) => void;
  onUserOffline?: (data: { userId: string }) => void;
  onUsersOnline?: (userIds: string[]) => void;
}

// ─── Singleton del socket (persiste entre renders) ────────────────────────────
let socketInstance: Socket | null = null;

const getSocket = (token: string): Socket => {
  if (!socketInstance || !socketInstance.connected) {
    socketInstance = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000", {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1500,
    });
  }
  return socketInstance;
};

export const disconnectSocket = () => {
  socketInstance?.disconnect();
  socketInstance = null;
};

// ─── Hook principal ───────────────────────────────────────────────────────────

export const useSocket = (options: UseSocketOptions) => {
  const {
    token,
    workspaceIds = [],
    projectIds = [],
    onMessageNew,
    onMessageSent,
    onDmNew,
    onDmSent,
    onTypingStart,
    onTypingStop,
    onUserOnline,
    onUserOffline,
    onUsersOnline,
  } = options;

  const socketRef = useRef<Socket | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!token) return;

    const socket = getSocket(token);
    socketRef.current = socket;

    // Unirse a salas cuando conecte (o ya conectado)
    const handleConnect = () => {
      socket.emit("join", { workspaceIds, projectIds });
    };

    if (socket.connected) {
      handleConnect();
    }

    socket.on("connect", handleConnect);
    socket.on("message:new", (msg: ChatMessage) => onMessageNew?.(msg));
    socket.on("message:sent", (data: { tempId: string; message: ChatMessage }) => onMessageSent?.(data));
    socket.on("message:dm:new", (msg: ChatMessage) => onDmNew?.(msg));
    socket.on("message:dm:sent", (data: { tempId: string; message: ChatMessage }) => onDmSent?.(data));
    socket.on("typing:start", (user: TypingUser) => onTypingStart?.(user));
    socket.on("typing:stop", (data: { userId: string }) => onTypingStop?.(data));
    socket.on("user:online", (data: { userId: string }) => onUserOnline?.(data));
    socket.on("user:offline", (data: { userId: string }) => onUserOffline?.(data));
    socket.on("users:online", (ids: string[]) => onUsersOnline?.(ids));

    return () => {
      socket.off("connect", handleConnect);
      socket.off("message:new");
      socket.off("message:sent");
      socket.off("message:dm:new");
      socket.off("message:dm:sent");
      socket.off("typing:start");
      socket.off("typing:stop");
      socket.off("user:online");
      socket.off("user:offline");
      socket.off("users:online");
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, workspaceIds.join(","), projectIds.join(",")]);

  // ── Acciones ────────────────────────────────────────────────────────────────

  const sendMessage = useCallback(
    (payload: { workspaceId: string; projectId?: string; content: string }) => {
      const tempId = `temp_${Date.now()}`;
      socketRef.current?.emit("message:send", { ...payload, tempId });
      return tempId;
    },
    []
  );

  const sendDm = useCallback(
    (payload: { toUserId: string; content: string }) => {
      const tempId = `temp_${Date.now()}`;
      socketRef.current?.emit("message:dm", { ...payload, tempId });
      return tempId;
    },
    []
  );

  const joinDm = useCallback((toUserId: string) => {
    socketRef.current?.emit("join:dm", toUserId);
  }, []);

  const emitTyping = useCallback(
    (payload: { workspaceId: string; projectId?: string; username: string }) => {
      socketRef.current?.emit("typing:start", payload);

      // Auto-stop después de 2.5s sin llamar de nuevo
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        socketRef.current?.emit("typing:stop", {
          workspaceId: payload.workspaceId,
          projectId: payload.projectId,
        });
      }, 2500);
    },
    []
  );

  const stopTyping = useCallback(
    (payload: { workspaceId: string; projectId?: string }) => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      socketRef.current?.emit("typing:stop", payload);
    },
    []
  );

  const isConnected = () => socketRef.current?.connected ?? false;

  return { sendMessage, sendDm, joinDm, emitTyping, stopTyping, isConnected };
};
