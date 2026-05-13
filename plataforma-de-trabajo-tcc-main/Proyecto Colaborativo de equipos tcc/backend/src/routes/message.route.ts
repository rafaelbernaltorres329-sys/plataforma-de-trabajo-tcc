import { Router } from "express";
import { sendMessageController, getMessages } from "../controllers/message.controller";

const router = Router();

/**
 * @swagger
 * /api/message/:
 *   post:
 *     summary: mandar mensajes
 *     tags: [Message]
 */
router.post(
  "/workspace/:workspaceId/send",
  sendMessageController
);

router.get(
  "/workspace/:workspaceId",
  getMessages
);

export default router;