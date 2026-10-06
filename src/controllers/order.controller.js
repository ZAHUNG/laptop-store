import asyncHandler from "../utils/asyncHandler.js";
import * as orderService from "../services/order.service.js";

export const createOrder = asyncHandler(async (req, res) => {
  const order = await orderService.createOrder(req.user._id, req.body);
  res.status(201).json({
    message: "Order created successfully",
    data: order,
  });
});
