import mongoose from "mongoose";
import Cart from "../models/Cart.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import AppError from "../utils/AppError.js";

const SHIPPING_FEE_STANDARD = 30000;
const FREE_SHIPPING_THRESHOLD = 5000000;

export const createOrder = async (userId, payload) => {
  const { shippingAddress, paymentMethod = "COD", note = "" } = payload;

  if (!shippingAddress) {
    throw new AppError("Shipping address is required", 400);
  }

  const { fullName, phone, city, district, ward, detail } = shippingAddress;
  if (!fullName || !phone || !city || !district || !ward || !detail) {
    throw new AppError("Please provide complete shipping information", 400);
  }

  if (paymentMethod !== "COD") {
    throw new AppError("Only COD payment method is currently supported", 400);
  }

  // 1. Lấy giỏ hàng của user
  const cart = await Cart.findOne({ userId }).populate("items.productId");
  if (!cart || !cart.items || cart.items.length === 0) {
    throw new AppError("Cart is empty", 400);
  }

  // 2. Thẩm tra sản phẩm & tính toán giá trị tài chính (Price Snapshot)
  let subtotal = 0;
  const orderItems = [];

  for (const item of cart.items) {
    const product = item.productId;
    if (!product) {
      throw new AppError("Product in cart no longer exists", 404);
    }
    if (!product.isActive) {
      throw new AppError(`Product "${product.name}" is currently unavailable`, 400);
    }
    if (item.quantity > product.stock) {
      throw new AppError(
        `Product "${product.name}" only has ${product.stock} item(s) left in stock`,
        400
      );
    }

    const itemPrice = product.price;
    subtotal += itemPrice * item.quantity;
    orderItems.push({
      productId: product._id,
      productName: product.name,
      quantity: item.quantity,
      price: itemPrice,
    });
  }

  const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE_STANDARD;
  const totalPrice = subtotal + shippingFee;

  // 3. Mở MongoDB Session & Transaction để đảm bảo tính nhất quán dữ liệu (ACID)
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 3.1. Trừ tồn kho và tăng số lượng đã bán một cách an toàn (Atomic update)
    for (const item of orderItems) {
      const updatedProduct = await Product.findOneAndUpdate(
        {
          _id: item.productId,
          stock: { $gte: item.quantity },
          isActive: true,
        },
        {
          $inc: {
            stock: -item.quantity,
            sold: item.quantity,
          },
        },
        { session, new: true }
      );

      if (!updatedProduct) {
        throw new AppError(
          `Product "${item.productName}" ran out of stock during checkout`,
          400
        );
      }
    }

    // 3.2. Tạo bản ghi Order trong DB
    const [createdOrder] = await Order.create(
      [
        {
          userId,
          orderItems,
          shippingAddress: {
            fullName: fullName.trim(),
            phone: phone.trim(),
            city: city.trim(),
            district: district.trim(),
            ward: ward.trim(),
            detail: detail.trim(),
          },
          paymentMethod,
          paymentStatus: "pending",
          orderStatus: "pending",
          subtotal,
          shippingFee,
          totalPrice,
          note: note ? note.trim() : "",
        },
      ],
      { session }
    );

    // 3.3. Làm rỗng giỏ hàng sau khi đặt thành công
    await Cart.findOneAndUpdate(
      { userId },
      { $set: { items: [] } },
      { session }
    );

    // 3.4. Commit toàn bộ thay đổi vào CSDL
    await session.commitTransaction();
    return createdOrder;
  } catch (error) {
    // Rollback toàn bộ nếu có bất kỳ lỗi nào xảy ra
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};
