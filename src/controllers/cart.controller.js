import mongoose from "mongoose";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";

export const getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({
      userId: req.user._id,
    }).populate("items.productId");

    if (!cart) {
      cart = await Cart.create({
        userId: req.user._id,
        items: [],
      });
    }

    res.json(cart);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    // =====================================
    // Module 1 - Validate Request
    // =====================================

    if (!productId) {
      return res.status(400).json({
        message: "Product ID is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
          message: "Invalid product ID"
      });
    }

    if (quantity === undefined) {
      return res.status(400).json({
        message: "Quantity is required",
      });
    }

    if (typeof quantity !== "number") {
      return res.status(400).json({
        message: "Quantity must be a number",
      });
    }

    if (quantity < 1) {
      return res.status(400).json({
        message: "Quantity must be greater than 0",
      });
    }

    // =====================================
    // Module 2 - Find Product
    // =====================================

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    // =====================================
    // Module 3 - Check Product Status
    // =====================================

    if (!product.isActive) {
      return res.status(400).json({
        message: "Product is unavailable",
      });
    }

    // =====================================
    // Module 4 - Check Stock
    // =====================================

    if (quantity > product.stock) {
      return res.status(400).json({
        message: `Only ${product.stock} products left in stock`,
      });
    }
    
    // =====================================
    // Module 5 - Find User Cart
    // =====================================

    let cart = await Cart.findOne({
      userId: req.user._id,
    });

    if (!cart) {
      cart = new Cart({
        userId: req.user._id,
        items: [],
      });
    }
  
    // =====================================
    // Module 6 - Check Existing Item
    // =====================================

    const existingItem = cart.items.find(
      (item) =>
        item.productId.toString() === productId
    );

    if (existingItem) {
      const newQuantity =
        existingItem.quantity + quantity;

      if (newQuantity > product.stock) {
        return res.status(400).json({
          message: `Only ${product.stock} products left in stock`,
        });
      }
    }
    
    // =====================================
    // Module 7 - Update Cart
    // =====================================

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({
        productId,
        quantity,
      });
    }

    // =====================================
    // Module 8 - Save Cart
    // =====================================

    cart.updatedAt = new Date();

    await cart.save();

    return res.status(200).json({
      message: "Product added to cart successfully",
      cart,
    });

      } catch (error) {
        res.status(500).json({
          message: error.message,
        });
      }
    };
    
export const updateCartItem = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    // Module 1 - Validate Request
    if (!productId) {
      return res.status(400).json({
        message: "Product ID is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        message: "Invalid product ID",
      });
    }

    if (quantity === undefined) {
      return res.status(400).json({
        message: "Quantity is required",
      });
    }

    if (typeof quantity !== "number") {
      return res.status(400).json({
        message: "Quantity must be a number",
      });
    }

    if (quantity < 1) {
      return res.status(400).json({
        message: "Quantity must be greater than 0",
      });
    }
    // Module 2 - Find Cart
    const cart = await Cart.findOne({
      userId: req.user._id,
    });

    if (!cart) {
      return res.status(404).json({
        message: "Cart not found",
      });
    }

    // Module 3 - Find Item
    const item = cart.items.find(
      (i) => i.productId.toString() === productId
    );

    if (!item) {
      return res.status(404).json({
        message: "Item not found",
      });
    }

    // Module 4 - Find Product
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    // Module 5 - Check Product Status
    if (!product.isActive) {
      return res.status(400).json({
        message: "Product is unavailable",
      });
    }

    // Module 6 - Check Stock
    if (quantity > product.stock) {
      return res.status(400).json({
        message: `Only ${product.stock} products left in stock`,
      });
    }

    // Module 7 - Update Quantity
    item.quantity = quantity;

    // Module 8 - Save
    cart.updatedAt = new Date();

    await cart.save();

    return res.json({
      message: "Cart updated successfully",
      cart,
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const removeCartItem = async (req, res) => {
  try {
    const { productId } = req.params;

    // Module 1 - Validate ObjectId

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        message: "Invalid product ID",
      });
    }

    // Module 2 - Find Cart

    const cart = await Cart.findOne({
      userId: req.user._id,
    });

    if (!cart) {
      return res.status(404).json({
        message: "Cart not found",
      });
    }

    // Module 3 - Find Item

    const item = cart.items.find(
      (item) =>
        item.productId.toString() === productId
    );

    if (!item) {
      return res.status(404).json({
        message: "Item not found",
      });
    }

    // Module 4 - Remove Item
    cart.items = cart.items.filter(
      (item) =>
        item.productId.toString() !== productId
    );

    // Module 5 - Save
    cart.updatedAt = new Date();

    await cart.save();

    return res.json({
      message: "Item removed from cart successfully",
      cart,
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({
      userId: req.user._id,
    });

    if (!cart) {
      return res.status(404).json({
        message: "Cart not found",
      });
    }

    cart.items = [];

    cart.updatedAt = new Date();

    await cart.save();

    return res.json({
      message: "Cart cleared successfully",
      cart,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};