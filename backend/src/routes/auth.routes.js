import express from "express";
import { loginController } from "../controllers/auth.controller.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/login", authMiddleware, loginController);

export default router;