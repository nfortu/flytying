import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { Role, User } from "@flytying/shared";
import { config } from "./config.js";

export interface TokenPayload {
  sub: number;
  email: string;
  role: Role;
}

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function signToken(user: User): string {
  const payload: TokenPayload = { sub: user.id, email: user.email, role: user.role };
  const options: jwt.SignOptions = { expiresIn: config.jwtExpiresIn as jwt.SignOptions["expiresIn"] };
  return jwt.sign(payload, config.jwtSecret, options);
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, config.jwtSecret) as unknown as TokenPayload;
}
