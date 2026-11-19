import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { forbidden, unauthorized } from "../utils/AppError.js";

export function requireAuth(req, res, next) {
  const [scheme, token] = (req.headers.authorization ?? "").split(" ");
  if (scheme !== "Bearer" || !token) {
    throw unauthorized("Missing or invalid Authorization header");
  }

  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch {
    throw unauthorized("Invalid or expired token");
  }

  req.user = {
    id: Number(payload.sub),
    role: payload.role,
    regionId: payload.region_id,
    // tokens from before auth_time existed count from when they were issued
    authTime: payload.auth_time ?? payload.iat,
  };
  next();
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw forbidden(`Only ${roles.join(" or ")} users can perform this action`);
    }
    next();
  };
}
