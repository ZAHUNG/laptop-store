import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import adminMiddleware from "../middlewares/admin.middleware.js";
import {
  createOrder,
  getMyOrders,
  getMyOrderDetail,
  cancelMyOrder,
  getAllOrders,
  getOrderDetailForAdmin,
  updateOrderStatus,
} from "../controllers/order.controller.js";

const router = express.Router();

// Mọi route về đơn hàng đều bắt buộc người dùng phải đăng nhập
router.use(authMiddleware);

// ======================= PHÂN HỆ KHÁCH HÀNG (CUSTOMER) =======================
router.post("/", createOrder);
router.get("/my-orders", getMyOrders);
router.get("/my-orders/:id", getMyOrderDetail);
router.patch("/my-orders/:id/cancel", cancelMyOrder);

// ======================= PHÂN HỆ QUẢN TRỊ VIÊN (ADMIN) =======================
router.get("/", adminMiddleware, getAllOrders);
router.get("/:id", adminMiddleware, getOrderDetailForAdmin);
router.patch("/:id/status", adminMiddleware, updateOrderStatus);

export default router;