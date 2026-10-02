// HTTP adapter cho giỏ hàng; logic tồn kho và thao tác database nằm trong cart service.
import asyncHandler from "../utils/asyncHandler.js";
import * as cartService from "../services/cart.service.js";

export const getCart = asyncHandler(async (req, res) => {
  res.json(await cartService.getCart(req.user._id));
});

export const addToCart = asyncHandler(async (req, res) => {
  const cart = await cartService.addToCart(req.user._id, req.body);
  res.json({ message: "Product added to cart successfully", cart });
});

export const updateCartItem = asyncHandler(async (req, res) => {
  const cart = await cartService.updateCartItem(req.user._id, req.body);
  res.json({ message: "Cart updated successfully", cart });
});

export const removeCartItem = asyncHandler(async (req, res) => {
  const cart = await cartService.removeCartItem(req.user._id, req.params.productId);
  res.json({ message: "Item removed from cart successfully", cart });
});

export const clearCart = asyncHandler(async (req, res) => {
  const cart = await cartService.clearCart(req.user._id);
  res.json({ message: "Cart cleared successfully", cart });
});
