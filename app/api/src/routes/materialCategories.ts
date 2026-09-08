import { Router } from "express";
import { z } from "zod";
import { db } from "../db.js";
import { toMaterialCategory } from "../mappers.js";
import { asyncHandler, HttpError, requireAuth, requireRole } from "../middleware.js";

export const materialCategoriesRouter = Router();

const bodySchema = z.object({ name: z.string().trim().min(1) });

materialCategoriesRouter.use(requireAuth);

materialCategoriesRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const result = await db.execute("SELECT id, name FROM material_categories ORDER BY name");
    res.json(result.rows.map(toMaterialCategory));
  }),
);

materialCategoriesRouter.post(
  "/",
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const parsed = bodySchema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, "name is required");
    const result = await db.execute({
      sql: "INSERT INTO material_categories (name) VALUES (?) RETURNING id, name",
      args: [parsed.data.name],
    });
    res.status(201).json(toMaterialCategory(result.rows[0]));
  }),
);

materialCategoriesRouter.put(
  "/:id",
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const parsed = bodySchema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, "name is required");
    const result = await db.execute({
      sql: "UPDATE material_categories SET name = ? WHERE id = ? RETURNING id, name",
      args: [parsed.data.name, Number(req.params.id)],
    });
    if (result.rows.length === 0) throw new HttpError(404, "Material category not found");
    res.json(toMaterialCategory(result.rows[0]));
  }),
);

materialCategoriesRouter.delete(
  "/:id",
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const result = await db.execute({
      sql: "DELETE FROM material_categories WHERE id = ?",
      args: [Number(req.params.id)],
    });
    if (result.rowsAffected === 0) throw new HttpError(404, "Material category not found");
    res.status(204).end();
  }),
);
