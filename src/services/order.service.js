// Nghiệp vụ checkout hiện có: xác thực địa chỉ, COD, giỏ và tồn kho.
// TODO: Giai đoạn tiếp theo sẽ tạo Order, tính tiền, trừ kho và xóa giỏ trong transaction.
import Cart from "../models/Cart.js";
import AppError from "../utils/AppError.js";

export const prepareOrder = async (userId, { shippingAddress, paymentMethod, note }) => {
  if (!shippingAddress) throw new AppError("Shipping address is required", 400);

  const { fullName, phone, city, district, ward, detail } = shippingAddress;
  if (!fullName || !phone || !city || !district || !ward || !detail) {
    throw new AppError("Please provide complete shipping information", 400);
  }
  if (!paymentMethod) throw new AppError("Payment method is required", 400);
  if (paymentMethod !== "COD") throw new AppError("Invalid payment method", 400);

  const cart = await Cart.findOne({ userId }).populate("items.productId");
  if (!cart || cart.items.length === 0) throw new AppError("Cart is empty", 400);

  const orderItems = cart.items.map((item) => {
    const product = item.productId;
    if (!product) throw new AppError("Product not found", 404);
    if (!product.isActive) throw new AppError(`${product.name} is unavailable`, 400);
    if (item.quantity > product.stock) {
      throw new AppError(`${product.name} only has ${product.stock} items left`, 400);
    }
    return { productId: product._id, productName: product.name, quantity: item.quantity, price: product.price };
  });

  return { orderItems, shippingAddress, paymentMethod, note };
};
