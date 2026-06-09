import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";

import {
  register,
  login,
  getProfile,
  refreshToken,
logout,
} from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/register", register);

router.post("/login", login);

router.get("/profile", authMiddleware, getProfile);

router.post("/refresh-token", refreshToken);

router.post("/logout", logout);

export default router;