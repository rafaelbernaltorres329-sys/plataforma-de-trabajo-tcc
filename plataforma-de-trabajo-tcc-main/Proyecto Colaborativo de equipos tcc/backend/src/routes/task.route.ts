import { Router } from "express";
import {
  createTaskController,
  deleteTaskController,
  getAllTasksController,
  getTaskByIdController,
  updateTaskController,
  createCommentController
} from "../controllers/task.controller";

const taskRoutes = Router();
/**
 * @swagger
 * /api/task/project/{projectId}/workspace/{workspaceId}/create:
 *   post:
 *     summary: Crear tarea
 *     tags: [Task]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: workspaceId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             title: "Nueva tarea"
 *             description: "Descripción"
 *             priority: "MEDIUM"
 *             status: "TODO"
 *     responses:
 *       200:
 *         description: Tarea creada
 */
taskRoutes.post(
  "/project/:projectId/workspace/:workspaceId/create",
  createTaskController
);

taskRoutes.delete("/:id/workspace/:workspaceId/delete", deleteTaskController);

taskRoutes.put(
  "/:id/project/:projectId/workspace/:workspaceId/update",
  updateTaskController
);
taskRoutes.post("/:taskId/comment", createCommentController);

taskRoutes.get("/workspace/:workspaceId/all", getAllTasksController);

taskRoutes.get(
  "/:id/project/:projectId/workspace/:workspaceId",
  getTaskByIdController
);

export default taskRoutes;
