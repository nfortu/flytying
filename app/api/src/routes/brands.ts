import { Router } from "express";
import { z } from "zod";
import { db } from "../db.js";
import { toBrand } from "../mappers.js";
import { asyncHandler, HttpError, requireAuth, requireRole } from "../middleware.js";

export const brandsRouter = Router();

const bodySchema = z.object({ name: z.string().trim().min(1) });

// Reads: any authenticated user. Writes: admin only.
brandsRouter.use(requireAuth);

brandsRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const result = await db.execute("SELECT id, name FROM brands ORDER BY name");
    res.json(result.rows.map(toBrand));
  }),
);

brandsRouter.post(
  "/",
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const parsed = bodySchema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, "name is required");
    const result = await db.execute({
      sql: "INSERT INTO brands (name) VALUES (?) RETURNING id, name",
      args: [parsed.data.name],
    });
    res.status(201).json(toBrand(result.rows[0]));
  }),
);

brandsRouter.put(
  "/:id",
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const parsed = bodySchema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, "name is required");
    const result = await db.execute({
      sql: "UPDATE brands SET name = ? WHERE id = ? RETURNING id, name",
      args: [parsed.data.name, Number(req.params.id)],
    });
    if (result.rows.length === 0) throw new HttpError(404, "Brand not found");
    res.json(toBrand(result.rows[0]));
  }),
);

brandsRouter.delete(
  "/:id",
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const result = await db.execute({
      sql: "DELETE FROM brands WHERE id = ?",
      args: [Number(req.params.id)],
    });
    if (result.rowsAffected === 0) throw new HttpError(404, "Brand not found");
    res.status(204).end();
  }),
);
