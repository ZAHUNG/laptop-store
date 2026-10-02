// Error dùng chung giữa các service; không phụ thuộc Express/HTTP response.
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
  }
}

export default AppError;
