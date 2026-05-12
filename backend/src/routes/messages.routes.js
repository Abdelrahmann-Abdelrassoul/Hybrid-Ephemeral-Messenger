import express from "express";
import { authMiddleware } from "../middleware/authmiddleware.js";
import { getMessageHistory } from "../controller/messages.controller.js";

const router = express.Router();

router.get("/:receiverUid", authMiddleware, getMessageHistory);

export default router;
