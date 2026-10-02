// Nơi duy nhất chuyển lỗi ứng dụng thành HTTP response JSON.
const errorMiddleware = (error, req, res, next) => {
  const statusCode = error.statusCode || 500;

  res.status(statusCode).json({
    message: error.message || "Internal server error",
  });
};

export default errorMiddleware;
