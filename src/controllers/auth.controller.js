import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import User from "../models/User.js";

import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/jwt.js";

// REGISTER
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existedUser = await User.findOne({
      email,
    });

    if (existedUser) {
      return res.status(400).json({
        message: "Email đã tồn tại",
      });
    }

    const passwordHash = await bcrypt.hash(
      password,
      10
    );

    const user = await User.create({
      name,
      email,
      passwordHash,
    });

    res.status(201).json({
      message: "Đăng ký thành công",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// LOGIN
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({
      email,
    });

    if (!user) {
      return res.status(400).json({
        message:
          "Email hoặc mật khẩu không đúng",
      });
    }

    const isMatch = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!isMatch) {
      return res.status(400).json({
        message:
          "Email hoặc mật khẩu không đúng",
      });
    }

    const accessToken =
      generateAccessToken(user._id);

    const refreshToken =
      generateRefreshToken(user._id);

    user.refreshToken = refreshToken;

    await user.save();

    res.cookie(
      "refreshToken",
      refreshToken,
      {
        httpOnly: true,
        secure: false,
        sameSite: "strict",
        maxAge:
          7 * 24 * 60 * 60 * 1000,
      }
    );

    res.json({
      message: "Đăng nhập thành công",
      accessToken,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// PROFILE
export const getProfile = async (
  req,
  res
) => {
  res.json(req.user);
};

// REFRESH TOKEN
export const refreshToken = async (
  req,
  res
) => {
  try {
    // console.log(req.cookies);
    // console.log(req.cookies.refreshToken);
    const token =
      req.cookies.refreshToken;

    if (!token) {
      return res.status(401).json({
        message:
          "Refresh token missing",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env
        .REFRESH_TOKEN_SECRET
    );

    const user =
      await User.findById(
        decoded.userId
      );

    if (!user) {
      return res.status(401).json({
        message: "User not found",
      });
    }

    if (
      user.refreshToken !== token
    ) {
      return res.status(401).json({
        message:
          "Invalid refresh token",
      });
    }

    const newAccessToken =
      generateAccessToken(user._id);

    res.json({
      accessToken:
        newAccessToken,
    });
  } catch (error) {
    res.status(401).json({
      message:
        "Refresh token invalid",
    });
  }
};

// LOGOUT
export const logout = async (
  req,
  res
) => {
  try {
    console.log("Cookies:", req.cookies);
    console.log(
    "RefreshToken:",
    req.cookies.refreshToken
    );
    const token =
      req.cookies.refreshToken;

    if (token) {
      await User.findOneAndUpdate(
        {
          refreshToken: token,
        },
        {
          refreshToken: null,
        }
      );
    }

    res.clearCookie(
      "refreshToken"
    );

    res.json({
      message:
        "Logout success",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};