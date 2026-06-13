import express from "express";

import {
  createProduct,
  getProducts,
  getProductDetail,
  updateProduct,
  deleteProduct,
} from "../controllers/product.controller.js";

import authMiddleware from "../middlewares/auth.middleware.js";
import adminMiddleware from "../middlewares/admin.middleware.js";

const router =
  express.Router();

router.get("/", getProducts);
router.get("/:slug", getProductDetail);

router.post("/",authMiddleware, adminMiddleware, createProduct);
router.put("/:id", authMiddleware, adminMiddleware, updateProduct);
router.delete("/:id", authMiddleware, adminMiddleware, deleteProduct);

export default router;