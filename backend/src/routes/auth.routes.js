import express from "express";
import { loginController } from "../controller/auth.controller.js";
import { authMiddleware } from "../middleware/authmiddleware.js";

const router = express.Router();

router.post("/login", authMiddleware, loginController);

export default router;