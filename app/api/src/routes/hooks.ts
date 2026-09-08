import { Router } from "express";
import { z } from "zod";
import { db } from "../db.js";
import { toHook } from "../mappers.js";
import { asyncHandler, HttpError, requireAuth, requireRole } from "../middleware.js";

export const hooksRouter = Router();

const bodySchema = z.object({
  model: z.string().trim().min(1),
  brandId: z.number().int().positive(),
  intendedFor: z.array(z.number().int()).default([]),
  details: z.string().trim().default(""),
  sizes: z.array(z.number().int()).default([]),
});

hooksRouter.use(requireAuth);

hooksRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const result = await db.execute(
      "SELECT id, model, brand_id, intended_for, details, sizes FROM hooks ORDER BY model",
    );
    res.json(result.rows.map(toHook));
  }),
);

hooksRouter.post(
  "/",
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const parsed = bodySchema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, "Invalid hook payload");
    const { model, brandId, intendedFor, details, sizes } = parsed.data;
    const result = await db.execute({
      sql: `INSERT INTO hooks (model, brand_id, intended_for, details, sizes)
            VALUES (?, ?, ?, ?, ?)
            RETURNING id, model, brand_id, intended_for, details, sizes`,
      args: [model, brandId, JSON.stringify(intendedFor), details, JSON.stringify(sizes)],
    });
    res.status(201).json(toHook(result.rows[0]));
  }),
);

hooksRouter.put(
  "/:id",
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const parsed = bodySchema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, "Invalid hook payload");
    const { model, brandId, intendedFor, details, sizes } = parsed.data;
    const result = await db.execute({
      sql: `UPDATE hooks SET model = ?, brand_id = ?, intended_for = ?, details = ?, sizes = ?
            WHERE id = ?
            RETURNING id, model, brand_id, intended_for, details, sizes`,
      args: [model, brandId, JSON.stringify(intendedFor), details, JSON.stringify(sizes), Number(req.params.id)],
    });
    if (result.rows.length === 0) throw new HttpError(404, "Hook not found");
    res.json(toHook(result.rows[0]));
  }),
);

hooksRouter.delete(
  "/:id",
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const result = await db.execute({
      sql: "DELETE FROM hooks WHERE id = ?",
      args: [Number(req.params.id)],
    });
    if (result.rowsAffected === 0) throw new HttpError(404, "Hook not found");
    res.status(204).end();
  }),
);
