import { Router } from "express";
import { z } from "zod";
import type { AuthResponse, Role, User } from "@flytying/shared";
import { db } from "../db.js";
import { signToken, verifyPassword } from "../auth.js";
import { asyncHandler, HttpError, requireAuth } from "../middleware.js";

export const authRouter = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, "Invalid credentials payload");

    const { email, password } = parsed.data;
    const result = await db.execute({
      sql: "SELECT id, email, password_hash, role FROM users WHERE email = ?",
      args: [email],
    });
    const row = result.rows[0];
    if (!row) throw new HttpError(401, "Invalid email or password");

    const ok = await verifyPassword(password, String(row.password_hash));
    if (!ok) throw new HttpError(401, "Invalid email or password");

    const user: User = { id: Number(row.id), email: String(row.email), role: String(row.role) as Role };
    const response: AuthResponse = { token: signToken(user), user };
    res.json(response);
  }),
);

/** Returns the currently authenticated user (used by portals to restore a session). */
authRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = req.user!;
    const payload: User = { id: user.sub, email: user.email, role: user.role };
    res.json(payload);
  }),
);
