// Nghiệp vụ tài khoản: database, mã hóa mật khẩu và JWT.
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import AppError from "../utils/AppError.js";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt.js";

const toPublicUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
});

export const register = async ({ name, email, password }) => {
  const existedUser = await User.findOne({ email });
  if (existedUser) throw new AppError("Email đã tồn tại", 400);

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, passwordHash });
  return toPublicUser(user);
};

export const login = async ({ email, password }) => {
  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new AppError("Email hoặc mật khẩu không đúng", 400);
  }

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);
  user.refreshToken = refreshToken;
  await user.save();
  return { accessToken, refreshToken, user: toPublicUser(user) };
};

export const getProfile = (user) => user;

export const refreshAccessToken = async (token) => {
  if (!token) throw new AppError("Refresh token missing", 401);

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
  } catch {
    throw new AppError("Refresh token invalid", 401);
  }

  const user = await User.findById(decoded.userId);
  if (!user) throw new AppError("User not found", 401);
  if (user.refreshToken !== token) throw new AppError("Invalid refresh token", 401);
  return generateAccessToken(user._id);
};

export const logout = async (token) => {
  if (token) await User.findOneAndUpdate({ refreshToken: token }, { refreshToken: null });
};
