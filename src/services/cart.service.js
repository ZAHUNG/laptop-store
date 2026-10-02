// Nghiệp vụ giỏ hàng: kiểm tra input, sản phẩm, tồn kho và cập nhật cart.
import mongoose from "mongoose";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import AppError from "../utils/AppError.js";

const validateProductAndQuantity = (productId, quantity) => {
  if (!productId) throw new AppError("Product ID is required", 400);
  if (!mongoose.Types.ObjectId.isValid(productId)) throw new AppError("Invalid product ID", 400);
  if (quantity === undefined) throw new AppError("Quantity is required", 400);
  if (typeof quantity !== "number") throw new AppError("Quantity must be a number", 400);
  if (quantity < 1) throw new AppError("Quantity must be greater than 0", 400);
};

const getAvailableProduct = async (productId) => {
  const product = await Product.findById(productId);
  if (!product) throw new AppError("Product not found", 404);
  if (!product.isActive) throw new AppError("Product is unavailable", 400);
  return product;
};

const assertStock = (quantity, product) => {
  if (quantity > product.stock) throw new AppError(`Only ${product.stock} products left in stock`, 400);
};

export const getCart = async (userId) => {
  let cart = await Cart.findOne({ userId }).populate("items.productId");
  if (!cart) cart = await Cart.create({ userId, items: [] });
  return cart;
};

export const addToCart = async (userId, { productId, quantity }) => {
  validateProductAndQuantity(productId, quantity);
  const product = await getAvailableProduct(productId);
  assertStock(quantity, product);

  let cart = await Cart.findOne({ userId });
  if (!cart) cart = new Cart({ userId, items: [] });
  const existingItem = cart.items.find((item) => item.productId.toString() === productId);

  if (existingItem) {
    assertStock(existingItem.quantity + quantity, product);
    existingItem.quantity += quantity;
  } else {
    cart.items.push({ productId, quantity });
  }

  await cart.save();
  return cart;
};

export const updateCartItem = async (userId, { productId, quantity }) => {
  validateProductAndQuantity(productId, quantity);
  const cart = await Cart.findOne({ userId });
  if (!cart) throw new AppError("Cart not found", 404);
  const item = cart.items.find((entry) => entry.productId.toString() === productId);
  if (!item) throw new AppError("Item not found", 404);

  const product = await getAvailableProduct(productId);
  assertStock(quantity, product);
  item.quantity = quantity;
  await cart.save();
  return cart;
};

export const removeCartItem = async (userId, productId) => {
  if (!mongoose.Types.ObjectId.isValid(productId)) throw new AppError("Invalid product ID", 400);
  const cart = await Cart.findOne({ userId });
  if (!cart) throw new AppError("Cart not found", 404);
  if (!cart.items.some((item) => item.productId.toString() === productId)) {
    throw new AppError("Item not found", 404);
  }

  cart.items = cart.items.filter((item) => item.productId.toString() !== productId);
  await cart.save();
  return cart;
};

export const clearCart = async (userId) => {
  const cart = await Cart.findOne({ userId });
  if (!cart) throw new AppError("Cart not found", 404);
  cart.items = [];
  await cart.save();
  return cart;
};
