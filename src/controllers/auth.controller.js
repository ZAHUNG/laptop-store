// HTTP adapter cho tài khoản: nhận request, gọi service, thiết lập cookie và trả response.
import asyncHandler from "../utils/asyncHandler.js";
import * as authService from "../services/auth.service.js";

const refreshCookieOptions = {
  httpOnly: true,
  secure: false,
  sameSite: "strict",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const register = asyncHandler(async (req, res) => {
  const user = await authService.register(req.body);
  res.status(201).json({ message: "Đăng ký thành công", user });
});

export const login = asyncHandler(async (req, res) => {
  const { accessToken, refreshToken, user } = await authService.login(req.body);
  res.cookie("refreshToken", refreshToken, refreshCookieOptions);
  res.json({ message: "Đăng nhập thành công", accessToken, user });
});

export const getProfile = asyncHandler(async (req, res) => {
  res.json(authService.getProfile(req.user));
});

export const refreshToken = asyncHandler(async (req, res) => {
  const accessToken = await authService.refreshAccessToken(req.cookies.refreshToken);
  res.json({ accessToken });
});

export const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.cookies.refreshToken);
  res.clearCookie("refreshToken");
  res.json({ message: "Logout success" });
});
