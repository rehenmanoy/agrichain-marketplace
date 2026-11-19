import { AppError } from "../utils/AppError.js";

// PostgreSQL error codes that are caused by bad input rather than a server bug
const PG_ERRORS = {
  23505: [409, "A record with these values already exists"],
  23503: [400, "A referenced record does not exist"],
  23514: [400, "A value violates a data constraint"],
  "22P02": [400, "Invalid input value"],
};

export function notFoundHandler(req, res) {
  res.status(404).json({ error: { message: `Route ${req.method} ${req.originalUrl} not found` } });
}

// Express recognises error handlers by their 4-argument signature
export function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return res.status(err.status).json({
      error: { message: err.message, ...(err.details && { details: err.details }) },
    });
  }

  // Problems found by the upload middleware (file too big, too many files, wrong field name)
  if (err.name === "MulterError") {
    const messages = {
      LIMIT_FILE_SIZE: "Each photo must be 5 MB or smaller",
      LIMIT_FILE_COUNT: "Too many photos",
      LIMIT_UNEXPECTED_FILE: "Too many photos",
    };
    return res.status(400).json({ error: { message: messages[err.code] ?? "Photo upload failed" } });
  }

  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: { message: "Request body is not valid JSON" } });
  }

  if (err.code && PG_ERRORS[err.code]) {
    const [status, message] = PG_ERRORS[err.code];
    return res.status(status).json({ error: { message, details: err.detail } });
  }

  console.error(err);
  res.status(500).json({ error: { message: "Internal server error" } });
}
