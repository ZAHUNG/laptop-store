import express from "express";
import cors from "cors";
import morgan from "morgan";
import authRoute from "./routes/auth.route.js";
import cookieParser from "cookie-parser";

const app = express();

app.use(cors());

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(morgan("dev"));

app.use(cookieParser());

app.use("/api/auth", authRoute);


app.get("/", (req, res) => {
  res.json({
    message: "API Running"
  });
});

export default app;