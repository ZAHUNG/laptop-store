import Cart from "../models/Cart.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";

export const createOrder = async (req, res) => {
  try {
    const { shippingAddress, paymentMethod, note } = req.body;

    // Module 1 - Validate Request
    if (!shippingAddress) {
        return res.status(400).json({
            message: "Shipping address is required",
        });
        }

    const {
        fullName,
        phone,
        city,
        district,
        ward,
        detail,
        } = shippingAddress;
    
    if (
        !fullName ||
        !phone ||
        !city ||
        !district ||
        !ward ||
        !detail
        ) {
        return res.status(400).json({
            message: "Please provide complete shipping information",
        });
        }

        if (!paymentMethod) {
            return res.status(400).json({
                message: "Payment method is required",
            });
            }

        if (paymentMethod !== "COD") {
            return res.status(400).json({
                message: "Invalid payment method",
            });
            }

        // =====================================
        // Module 2 - Find User Cart
        // =====================================

        const cart = await Cart.findOne({
        userId: req.user._id,
        }).populate("items.productId");

        // =====================================
        // Module 3 - Check Empty Cart
        // =====================================

        if (!cart || cart.items.length === 0) {
        return res.status(400).json({
            message: "Cart is empty",
        });
        }
    
        // =====================================
        // Module 4 - Validate Products
        // =====================================

        for (const item of cart.items) {

        const product = item.productId;

        // 1. Product còn tồn tại?
        if (!product) {
            return res.status(404).json({
            message: "Product not found",
            });
        }

        // 2. Product còn bán?
        if (!product.isActive) {
            return res.status(400).json({
            message: `${product.name} is unavailable`,
            });
        }

        // 3. Đủ hàng?
        if (item.quantity > product.stock) {
            return res.status(400).json({
            message: `${product.name} only has ${product.stock} items left`,
            });
        }
        }

        // =====================================
        // Module 5 - Create Order Items
        // =====================================

        const orderItems = cart.items.map((item) => ({
        productId: item.productId._id,
        productName: item.productId.name,
        quantity: item.quantity,
        price: item.productId.price,
        }));


        res.json({
            message: "Create Order API",
            });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};