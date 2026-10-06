import express from "express";
import {
  createCategory,
  getCategories,
  getCategoryDetail,
  updateCategory,
  deleteCategory,
} from "../controllers/category.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import adminMiddleware from "../middlewares/admin.middleware.js";

const router = express.Router();

router.get("/", getCategories);
router.get("/:idOrSlug", getCategoryDetail);

router.post("/", authMiddleware, adminMiddleware, createCategory);
router.put("/:id", authMiddleware, adminMiddleware, updateCategory);
router.delete("/:id", authMiddleware, adminMiddleware, deleteCategory);

export default router;
