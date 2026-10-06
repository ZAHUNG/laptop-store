import express from "express";
import {
  createBrand,
  getBrands,
  getBrandDetail,
  updateBrand,
  deleteBrand,
} from "../controllers/brand.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import adminMiddleware from "../middlewares/admin.middleware.js";

const router = express.Router();

router.get("/", getBrands);
router.get("/:idOrSlug", getBrandDetail);

router.post("/", authMiddleware, adminMiddleware, createBrand);
router.put("/:id", authMiddleware, adminMiddleware, updateBrand);
router.delete("/:id", authMiddleware, adminMiddleware, deleteBrand);

export default router;
