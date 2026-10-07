import asyncHandler from "../utils/asyncHandler.js";
import * as orderService from "../services/order.service.js";

// ======================= PHÂN HỆ KHÁCH HÀNG (CUSTOMER) =======================

export const createOrder = asyncHandler(async (req, res) => {
  const order = await orderService.createOrder(req.user._id, req.body);
  res.status(201).json({
    message: "Order placed successfully",
    data: order,
  });
});

export const getMyOrders = asyncHandler(async (req, res) => {
  const result = await orderService.getMyOrders(req.user._id, req.query);
  res.json(result);
});

export const getMyOrderDetail = asyncHandler(async (req, res) => {
  const order = await orderService.getMyOrderDetail(req.user._id, req.params.id);
  res.json(order);
});

export const cancelMyOrder = asyncHandler(async (req, res) => {
  const order = await orderService.cancelMyOrder(req.user._id, req.params.id, req.body);
  res.json({
    message: "Order cancelled successfully and stock refunded",
    data: order,
  });
});

// ======================= PHÂN HỆ QUẢN TRỊ VIÊN (ADMIN) =======================

export const getAllOrders = asyncHandler(async (req, res) => {
  const result = await orderService.getAllOrders(req.query);
  res.json(result);
});

export const getOrderDetailForAdmin = asyncHandler(async (req, res) => {
  const order = await orderService.getOrderDetailForAdmin(req.params.id);
  res.json(order);
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await orderService.updateOrderStatus(req.params.id, req.body);
  res.json({
    message: "Order status updated successfully",
    data: order,
  });
});
