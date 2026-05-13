import { Server, Socket } from "socket.io";
import * as jwt from "jsonwebtoken";
import { MessageModel } from "./models/message.model";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface JwtPayload {
  id: string;
  email: string;
}

interface AuthSocket extends Socket {
  userId?: string;
  userEmail?: string;
}

interface SendMessagePayload {
  workspaceId: string;
  projectId?: string;
  content: string;
  tempId: string;
}

interface TypingPayload {
  workspaceId: string;
  projectId?: string;
  username: string;
}

interface PrivateMessagePayload {
  toUserId: string;
  content: string;
  tempId: string;
}

// ─── Utilidades ───────────────────────────────────────────────────────────────

const roomId = (workspaceId: string, projectId?: string) =>
  projectId ? `project:${projectId}` : `workspace:${workspaceId}`;

const dmRoomId = (a: string, b: string) =>
  `dm:${[a, b].sort().join("_")}`;

// ─── Usuarios online ──────────────────────────────────────────────────────────

const onlineUsers = new Map<string, Set<string>>();

const addOnline = (userId: string, socketId: string) => {
  if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
  onlineUsers.get(userId)!.add(socketId);
};

const removeOnline = (userId: string, socketId: string) => {
  onlineUsers.get(userId)?.delete(socketId);
  if (onlineUsers.get(userId)?.size === 0) {
    onlineUsers.delete(userId);
  }
};

const isOnline = (userId: string) => onlineUsers.has(userId);

// ─── Inicialización ───────────────────────────────────────────────────────────

let io: Server;

export const initSocket = (server: any) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "*",
      credentials: true,
    },
  });

  // ── Middleware JWT ──────────────────────────────────────────────────────────
  io.use((socket: AuthSocket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.split(" ")[1];

    if (!token) return next(new Error("AUTH_REQUIRED"));

    try {
      const payload = jwt.verify(
        token,
        process.env.JWT_SECRET || "secret"
      ) as JwtPayload;

      socket.userId = payload.id;
      socket.userEmail = payload.email;

      next();
    } catch {
      next(new Error("INVALID_TOKEN"));
    }
  });

  // ── Conexión ────────────────────────────────────────────────────────────────
  io.on("connection", (socket: AuthSocket) => {
    const userId = socket.userId!;
    console.log(`🟢 Conectado: ${userId} (${socket.id})`);

    addOnline(userId, socket.id);

    // ── JOIN ─────────────────────────────────────────────────────────────────
    socket.on(
      "join",
      (data: { workspaceIds: string[]; projectIds?: string[] }) => {
        const { workspaceIds = [], projectIds = [] } = data;

        workspaceIds.forEach((wid) => {
          socket.join(`workspace:${wid}`);
          socket.to(`workspace:${wid}`).emit("user:online", { userId });
        });

        projectIds.forEach((pid) => {
          socket.join(`project:${pid}`);
        });

        const onlineIds = Array.from(onlineUsers.keys());
        socket.emit("users:online", onlineIds);
      }
    );

    // ── JOIN DM ──────────────────────────────────────────────────────────────
    socket.on("join:dm", (toUserId: string) => {
      socket.join(dmRoomId(userId, toUserId));
    });

    // ── MENSAJE NORMAL ───────────────────────────────────────────────────────
    socket.on("message:send", async (payload: SendMessagePayload) => {
      try {
        const { workspaceId, projectId, content, tempId } = payload;

        if (!content?.trim()) return;

        const message = await MessageModel.create({
          workspaceId,
          projectId: projectId || null,
          senderId: userId,
          content: content.trim(),
        });

        const populated = await message.populate(
          "senderId",
          "name email imageUrl"
        );

        const room = roomId(workspaceId, projectId);

        socket.emit("message:sent", { tempId, message: populated });
        socket.to(room).emit("message:new", populated);
      } catch (err) {
        socket.emit("message:error", {
          message: "Error al enviar mensaje",
        });
      }
    });

    // ── MENSAJE DIRECTO ──────────────────────────────────────────────────────
    socket.on("message:dm", async (payload: PrivateMessagePayload) => {
      try {
        const { toUserId, content, tempId } = payload;

        if (!content?.trim()) return;

        const message = await MessageModel.create({
          senderId: userId,
          recipientId: toUserId,
          content: content.trim(),
          isDirect: true,
        });

        const populated = await message.populate(
          "senderId",
          "name email imageUrl"
        );

        const room = dmRoomId(userId, toUserId);

        socket.emit("message:dm:sent", { tempId, message: populated });
        socket.to(room).emit("message:dm:new", populated);
      } catch (err) {
        socket.emit("message:error", {
          message: "Error al enviar DM",
        });
      }
    });

    // ── TYPING ───────────────────────────────────────────────────────────────
    socket.on("typing:start", (payload: TypingPayload) => {
      const { workspaceId, projectId, username } = payload;
      const room = roomId(workspaceId, projectId);

      socket.to(room).emit("typing:start", {
        userId,
        username,
      });
    });

    socket.on(
      "typing:stop",
      (payload: Omit<TypingPayload, "username">) => {
        const { workspaceId, projectId } = payload;
        const room = roomId(workspaceId, projectId);

        socket.to(room).emit("typing:stop", { userId });
      }
    );

    // ── DISCONNECT ───────────────────────────────────────────────────────────
    socket.on("disconnect", () => {
      console.log(`🔴 Desconectado: ${userId} (${socket.id})`);

      removeOnline(userId, socket.id);

      if (!isOnline(userId)) {
        socket.rooms.forEach((room) => {
          io.to(room).emit("user:offline", { userId });
        });
      }
    });
  });

  return io;
};

// ─── UTILIDADES GLOBALES ─────────────────────────────────────────────────────

export const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
};

export const emitToRoom = (room: string, event: string, data: any) => {
  getIO().to(room).emit(event, data);
};

export const emitToWorkspace = (
  workspaceId: string,
  event: string,
  data: any
) => {
  emitToRoom(`workspace:${workspaceId}`, event, data);
};

export const emitToProject = (
  projectId: string,
  event: string,
  data: any
) => {
  emitToRoom(`project:${projectId}`, event, data);
};