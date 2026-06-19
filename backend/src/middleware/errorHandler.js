import { logger } from "../utils/logger.js";

export function errorHandler(err, req, res, next) {
  logger.error(`${err.message} — ${req.method} ${req.path}`);
  const status = err.statusCode || err.status || 500;
  res.status(status).json({
    error: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack })
  });
}

export class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}
