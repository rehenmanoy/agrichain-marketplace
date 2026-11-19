export class AppError extends Error {
  constructor(status, message, details) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.details = details;
  }
}

export const badRequest = (message, details) => new AppError(400, message, details);
export const unauthorized = (message = "Authentication required") => new AppError(401, message);
export const forbidden = (message = "You are not allowed to do this") => new AppError(403, message);
export const notFound = (message = "Resource not found") => new AppError(404, message);
export const conflict = (message) => new AppError(409, message);
export const serviceUnavailable = (message) => new AppError(503, message);
