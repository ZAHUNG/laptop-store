import express from "express";
import {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart
} from "../controllers/cart.controller.js";

import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", getCart);
router.post("/", addToCart);
router.put("/", updateCartItem);
router.delete("/", clearCart);
router.delete("/:productId", removeCartItem);

export default router;