import { Request, Response } from "express";
import { sendMessageService } from "../services/message.service";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import { getIO } from "../socket";

/**
 * GET /api/messages
 */
export const getMessages = async (req: Request, res: Response) => {
  try {
    const { workspaceId, projectId, page = "1", limit = "50" } = req.query as Record<string, string>;

    if (!workspaceId) {
      return res.status(400).json({ message: "workspaceId es requerido" });
    }

    const filter: Record<string, any> = {
      workspaceId,
      isDirect: false,
    };

    if (projectId) {
      filter.projectId = projectId;
    } else {
      filter.projectId = null;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // 🔹 Cuando conectes Mongo
    /*
    const messages = await MessageModel.find(filter)
      .populate("senderId", "name email imageUrl")
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await MessageModel.countDocuments(filter);

    return res.json({
      messages,
      total,
      page: parseInt(page),
      hasMore: skip + messages.length < total,
    });
    */

    return res.json({
      messages: [],
      total: 0,
      page: 1,
      hasMore: false,
    });

  } catch (err) {
    return res.status(500).json({
      message: "Error al obtener mensajes",
      error: err,
    });
  }
};

/**
 * GET /api/messages/dm/:userId
 */
export const getDmMessages = async (req: Request, res: Response) => {
  try {
    const currentUserId = (req as any).user?.id;
    const { userId } = req.params;
    const { page = "1", limit = "50" } = req.query as Record<string, string>;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    /*
    const messages = await MessageModel.find({
      isDirect: true,
      $or: [
        { senderId: currentUserId, recipientId: userId },
        { senderId: userId, recipientId: currentUserId },
      ],
    })
      .populate("senderId", "name email imageUrl")
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    return res.json({ messages });
    */

    return res.json({ messages: [] });

  } catch (err) {
    return res.status(500).json({
      message: "Error al obtener DMs",
      error: err,
    });
  }
};

/**
 * POST /api/messages/:workspaceId
 */
export const sendMessageController = async (req: Request, res: Response) => {
  try {
    const { workspaceId } = req.params;

    const messageData = {
      ...req.body,
      workspaceId,
      senderId: (req as any).user?.id,
    };

    // 🔹 Guardar mensaje usando tu service
    const message = await sendMessageService(messageData);

    // 🔹 Emitir por socket.io
    const io = getIO();
    io.to(workspaceId).emit("newMessage", message);

    return res.status(201).json({
      message: "Mensaje enviado",
      data: message,
    });

  } catch (err) {
    return res.status(500).json({
      message: "Error al enviar mensaje",
      error: err,
    });
  }
};