import "dotenv/config";
import { createServer } from "http";
import { Server } from "socket.io";
import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import session from "express-session"; // ✅ CAMBIO IMPORTANTE
import passport from "passport";

import { config } from "./config/app.config";
import connectDatabase from "./config/database.config";
import { errorHandler } from "./middlewares/errorHandler.middleware";
import { HTTPSTATUS } from "./config/http.config";
import { asyncHandler } from "./middlewares/asyncHandler.middleware";
import { BadRequestException } from "./utils/appError";
import { ErrorCodeEnum } from "./enums/error-code.enum";
import { initSocket } from "./socket";

import messageRoutes from "./routes/message.route";
import authRoutes from "./routes/auth.route";
import userRoutes from "./routes/user.route";
import workspaceRoutes from "./routes/workspace.route";
import memberRoutes from "./routes/member.route";
import projectRoutes from "./routes/project.route";
import taskRoutes from "./routes/task.route";

import isAuthenticated from "./middlewares/isAuthenticated.middleware";

import "./config/passport.config";

// Swagger
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger.config";

const app = express();
const BASE_PATH = config.BASE_PATH;

// ================== MIDDLEWARES ==================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ SESSION CORRECTA (EXPRESS-SESSION)
app.use(
  session({
    secret: config.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: config.NODE_ENV === "production", // false en local
      httpOnly: true,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000, // 1 día
    },
  })
);

// ✅ PASSPORT (DESPUÉS DE SESSION)
app.use(passport.initialize());
app.use(passport.session());

// ✅ CORS (IMPORTANTE PARA FRONTEND)
app.use(
  cors({
    origin: config.FRONTEND_ORIGIN,
    credentials: true,
  })
);

// ================== ROUTES ==================

app.get(
  `/`,
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    throw new BadRequestException(
      "This is a bad request",
      ErrorCodeEnum.AUTH_INVALID_TOKEN
    );

    return res.status(HTTPSTATUS.OK).json({
      message: "Hello world",
    });
  })
);

// Swagger
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API routes
app.use(`${BASE_PATH}/auth`, authRoutes);
app.use(`${BASE_PATH}/user`, isAuthenticated, userRoutes);
app.use(`${BASE_PATH}/workspace`, isAuthenticated, workspaceRoutes);
app.use(`${BASE_PATH}/member`, isAuthenticated, memberRoutes);
app.use(`${BASE_PATH}/project`, isAuthenticated, projectRoutes);
app.use(`${BASE_PATH}/task`, isAuthenticated, taskRoutes);
app.use(`${BASE_PATH}/message`, messageRoutes);

// ================== ERROR HANDLER ==================

app.use(errorHandler);

// ================== SERVER ==================

const server = createServer(app);

export const io = new Server(server, {
  cors: {
    origin: config.FRONTEND_ORIGIN,
    credentials: true,
  },
});

initSocket(server);

// ================== START ==================

server.listen(config.PORT, async () => {
  console.log(`Server running on ${config.PORT}`);
  await connectDatabase();
});