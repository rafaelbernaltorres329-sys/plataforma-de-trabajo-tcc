import { Router } from "express";
import passport from "passport";
import { config } from "../config/app.config";
import {
  googleLoginCallback,
  loginController,
  logOutController,
  registroUsuarioController,
} from "../controllers/auth.controller";

const failedUrl = `${config.FRONTEND_GOOGLE_CALLBACK_URL}?status=failure`;

const authRoutes = Router();
/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Registrar usuario
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             name: leo
 *             email: leonispe@gmail.com
 *             password: 123456
 *     responses:
 *       201:
 *         description: Usuario creado correctamente
 */
authRoutes.post("/register", registroUsuarioController);


/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Iniciar sesión
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             email: leonispe@gmail.com
 *             password: 123456
 *     responses:
 *       200:
 *         description: Login exitoso
 *         content:
 *           application/json:
 *             example:
 *               message: Logged in successfully
 *               user:
 *                 _id: "123"
 *                 name: "leo"
 *                 email: "leonispe@gmail.com"
 *       401:
 *         description: Credenciales inválidas
 */
authRoutes.post("/login", loginController);

authRoutes.post("/logout", logOutController);

authRoutes.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

authRoutes.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: failedUrl,
  }),
  googleLoginCallback
);

export default authRoutes;
