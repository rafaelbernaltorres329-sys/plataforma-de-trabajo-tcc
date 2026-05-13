import { Request, Response } from "express";
import { getIO } from "../socket";

export const sendMessageController = async (req: Request, res: Response) => {
  try {
    const { workspaceId } = req.params;

    const senderId = req.user?.id;

    if (!senderId) {
      return res.status(401).json({
        message: "Usuario no autenticado",
      });
    }

    const messageData = {
      ...req.body,
      workspaceId,
      senderId,
    };

    const message = await sendMessageService(messageData);

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


export function sendMessageService(messageData: any) {
  throw new Error("Function not implemented.");
}

