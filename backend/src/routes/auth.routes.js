import express from "express";
import { loginController, getMeController } from "../controller/auth.controller.js";
import { authMiddleware } from "../middleware/authmiddleware.js";

const router = express.Router();

router.get("/me", authMiddleware, getMeController);
router.post("/login", authMiddleware, loginController);

export default router;