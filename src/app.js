import express from "express";
import cors from "cors";
import morgan from "morgan";
import "./models/index.js";
import authRoute from "./routes/auth.route.js";
import productRoute from "./routes/product.route.js";
import cartRoute from "./routes/cart.route.js";
import orderRoute from "./routes/order.route.js";
import cookieParser from "cookie-parser";
import errorMiddleware from "./middlewares/error.middleware.js";

const app = express();

app.use(cors());

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(morgan("dev"));

app.use(cookieParser());

app.use("/api/auth", authRoute);
app.use("/api/products", productRoute);
app.use("/api/cart", cartRoute);
app.use("/api/orders", orderRoute);
app.get("/", (req, res) => {
  res.json({
    message: "API Running"
  });
});

// Phải đặt sau routes để bắt lỗi phát sinh từ controller/service.
app.use(errorMiddleware);

export default app;
