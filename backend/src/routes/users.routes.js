import express from "express";
import { authMiddleware } from "../middleware/authmiddleware.js";
import { listUsers } from "../controller/users.controller.js";

const router = express.Router();

router.get("/", authMiddleware, listUsers);

export default router;
