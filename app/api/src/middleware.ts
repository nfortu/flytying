import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { Role } from "@flytying/shared";
import { verifyToken, type TokenPayload } from "./auth.js";

// Augment Express' Request with the authenticated user.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

/** Thrown by route handlers to produce a specific HTTP status. */
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Wraps an async handler so thrown/rejected errors reach the error middleware. */
export function asyncHandler(fn: RequestHandler): RequestHandler {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

/** Requires a valid bearer token; attaches the decoded payload to req.user. */
export const requireAuth: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    throw new HttpError(401, "Missing or malformed Authorization header");
  }
  try {
    req.user = verifyToken(header.slice("Bearer ".length));
    next();
  } catch {
    throw new HttpError(401, "Invalid or expired token");
  }
};

/** Requires the authenticated user to hold one of the given roles. */
export function requireRole(...roles: Role[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) throw new HttpError(401, "Not authenticated");
    if (!roles.includes(req.user.role)) throw new HttpError(403, "Insufficient permissions");
    next();
  };
}

/** Terminal error handler — normalises everything into { error } JSON. */
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
}
