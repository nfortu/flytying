import { Router } from "express";
import { z } from "zod";
import { db } from "../db.js";
import { toMaterial } from "../mappers.js";
import { asyncHandler, HttpError, requireAuth, requireRole } from "../middleware.js";

export const materialsRouter = Router();

const bodySchema = z.object({
  categoryId: z.number().int().positive(),
  name: z.string().trim().min(1),
  details: z.string().trim().default(""),
  brandIds: z.array(z.number().int()).default([]),
});

materialsRouter.use(requireAuth);

materialsRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const result = await db.execute(
      "SELECT id, category_id, name, details, brand_ids FROM materials ORDER BY name",
    );
    res.json(result.rows.map(toMaterial));
  }),
);

materialsRouter.post(
  "/",
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const parsed = bodySchema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, "Invalid material payload");
    const { categoryId, name, details, brandIds } = parsed.data;
    const result = await db.execute({
      sql: `INSERT INTO materials (category_id, name, details, brand_ids)
            VALUES (?, ?, ?, ?)
            RETURNING id, category_id, name, details, brand_ids`,
      args: [categoryId, name, details, JSON.stringify(brandIds)],
    });
    res.status(201).json(toMaterial(result.rows[0]));
  }),
);

materialsRouter.put(
  "/:id",
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const parsed = bodySchema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, "Invalid material payload");
    const { categoryId, name, details, brandIds } = parsed.data;
    const result = await db.execute({
      sql: `UPDATE materials SET category_id = ?, name = ?, details = ?, brand_ids = ?
            WHERE id = ?
            RETURNING id, category_id, name, details, brand_ids`,
      args: [categoryId, name, details, JSON.stringify(brandIds), Number(req.params.id)],
    });
    if (result.rows.length === 0) throw new HttpError(404, "Material not found");
    res.json(toMaterial(result.rows[0]));
  }),
);

materialsRouter.delete(
  "/:id",
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const result = await db.execute({
      sql: "DELETE FROM materials WHERE id = ?",
      args: [Number(req.params.id)],
    });
    if (result.rowsAffected === 0) throw new HttpError(404, "Material not found");
    res.status(204).end();
  }),
);
