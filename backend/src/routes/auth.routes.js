import express from "express";
import { loginController, getMeController } from "../controller/auth.controller.js";
import { startMfaController } from "../controller/mfa.controller.js";
import { authMiddleware } from "../middleware/authmiddleware.js";

const router = express.Router();

router.get("/me", authMiddleware, getMeController);
router.post("/login", authMiddleware, loginController);
router.post("/mfa/start", authMiddleware, startMfaController);

export default router;