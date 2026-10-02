// HTTP adapter cho đơn hàng. Service hiện mới chuẩn bị/kiểm tra đơn, chưa lưu Order.
import asyncHandler from "../utils/asyncHandler.js";
import { prepareOrder } from "../services/order.service.js";

export const createOrder = asyncHandler(async (req, res) => {
  await prepareOrder(req.user._id, req.body);
  res.json({ message: "Create Order API" });
});
