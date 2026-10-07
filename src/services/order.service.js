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
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

// ======================= PHÂN HỆ KHÁCH HÀNG (CUSTOMER) =======================

export const getMyOrders = async (userId, query = {}) => {
  const { orderStatus, page = 1, limit = 10 } = query;
  const filter = { userId };

  if (orderStatus) {
    filter.orderStatus = orderStatus;
  }

  const numericPage = Math.max(1, Number(page) || 1);
  const numericLimit = Math.max(1, Number(limit) || 10);
  const skip = (numericPage - 1) * numericLimit;

  const [orders, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(numericLimit),
    Order.countDocuments(filter),
  ]);

  return {
    data: orders,
    pagination: {
      total,
      page: numericPage,
      limit: numericLimit,
      totalPages: Math.ceil(total / numericLimit),
    },
  };
};

export const getMyOrderDetail = async (userId, orderId) => {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new AppError("Invalid Order ID", 400);
  }

  const order = await Order.findOne({ _id: orderId, userId });
  if (!order) {
    throw new AppError("Order not found", 404);
  }

  return order;
};

export const cancelMyOrder = async (userId, orderId, { cancelReason } = {}) => {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new AppError("Invalid Order ID", 400);
  }

  const order = await Order.findOne({ _id: orderId, userId });
  if (!order) {
    throw new AppError("Order not found", 404);
  }

  if (order.orderStatus !== "pending") {
    throw new AppError(
      `Cannot cancel order in "${order.orderStatus}" status. Please contact support.`,
      400
    );
  }

  // Khởi tạo Transaction để hoàn kho an toàn
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Hoàn lại tồn kho cho từng sản phẩm trong đơn
    for (const item of order.orderItems) {
      await Product.findByIdAndUpdate(
        item.productId,
        {
          $inc: {
            stock: item.quantity,
            sold: -item.quantity,
          },
        },
        { session }
      );
    }

    order.orderStatus = "cancelled";
    order.cancelReason = cancelReason ? cancelReason.trim() : "Cancelled by customer";
    await order.save({ session });

    await session.commitTransaction();
    return order;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

// ======================= PHÂN HỆ QUẢN TRỊ VIÊN (ADMIN) =======================

export const getAllOrders = async (query = {}) => {
  const {
    orderStatus,
    paymentStatus,
    paymentMethod,
    search,
    startDate,
    endDate,
    page = 1,
    limit = 10,
  } = query;

  const filter = {};

  if (orderStatus) filter.orderStatus = orderStatus;
  if (paymentStatus) filter.paymentStatus = paymentStatus;
  if (paymentMethod) filter.paymentMethod = paymentMethod;

  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  if (search) {
    const searchRegex = { $regex: search.trim(), $options: "i" };
    if (mongoose.Types.ObjectId.isValid(search.trim())) {
      filter.$or = [{ _id: search.trim() }, { "shippingAddress.phone": searchRegex }, { "shippingAddress.fullName": searchRegex }];
    } else {
      filter.$or = [{ "shippingAddress.phone": searchRegex }, { "shippingAddress.fullName": searchRegex }];
    }
  }

  const numericPage = Math.max(1, Number(page) || 1);
  const numericLimit = Math.max(1, Number(limit) || 10);
  const skip = (numericPage - 1) * numericLimit;

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate("userId", "name email phone")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(numericLimit),
    Order.countDocuments(filter),
  ]);

  return {
    data: orders,
    pagination: {
      total,
      page: numericPage,
      limit: numericLimit,
      totalPages: Math.ceil(total / numericLimit),
    },
  };
};

export const getOrderDetailForAdmin = async (orderId) => {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new AppError("Invalid Order ID", 400);
  }

  const order = await Order.findById(orderId).populate("userId", "name email phone avatar");
  if (!order) {
    throw new AppError("Order not found", 404);
  }

  return order;
};

export const updateOrderStatus = async (orderId, payload = {}) => {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new AppError("Invalid Order ID", 400);
  }

  const { orderStatus, cancelReason } = payload;
  const validStatuses = ["pending", "processing", "shipping", "delivered", "cancelled"];

  if (!orderStatus || !validStatuses.includes(orderStatus)) {
    throw new AppError(`Invalid order status. Must be one of: ${validStatuses.join(", ")}`, 400);
  }

  const order = await Order.findById(orderId);
  if (!order) {
    throw new AppError("Order not found", 404);
  }

  if (order.orderStatus === "delivered") {
    throw new AppError("Delivered orders cannot be modified", 400);
  }

  if (order.orderStatus === "cancelled") {
    throw new AppError("Cancelled orders cannot be modified", 400);
  }

  // Trường hợp 1: Admin hủy đơn -> Thực hiện hoàn kho qua Transaction
  if (orderStatus === "cancelled") {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      for (const item of order.orderItems) {
        await Product.findByIdAndUpdate(
          item.productId,
          {
            $inc: {
              stock: item.quantity,
              sold: -item.quantity,
            },
          },
          { session }
        );
      }

      order.orderStatus = "cancelled";
      order.cancelReason = cancelReason ? cancelReason.trim() : "Cancelled by admin";
      await order.save({ session });

      await session.commitTransaction();
      return order;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // Trường hợp 2: Chuyển sang delivered với đơn COD -> tự động đổi paymentStatus = "paid"
  if (orderStatus === "delivered" && order.paymentMethod === "COD") {
    order.paymentStatus = "paid";
  }

  order.orderStatus = orderStatus;
  await order.save();
  return order;
};
