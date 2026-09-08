import { Router } from "express";
import { z } from "zod";
import { db } from "../db.js";
import { toFlyCategory } from "../mappers.js";
import { asyncHandler, HttpError, requireAuth, requireRole } from "../middleware.js";

export const flyCategoriesRouter = Router();

const bodySchema = z.object({
  name: z.string().trim().min(1),
  details: z.string().trim().default(""),
});

flyCategoriesRouter.use(requireAuth);

flyCategoriesRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const result = await db.execute("SELECT id, name, details FROM fly_categories ORDER BY name");
    res.json(result.rows.map(toFlyCategory));
  }),
);

flyCategoriesRouter.post(
  "/",
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const parsed = bodySchema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, "name is required");
    const result = await db.execute({
      sql: "INSERT INTO fly_categories (name, details) VALUES (?, ?) RETURNING id, name, details",
      args: [parsed.data.name, parsed.data.details],
    });
    res.status(201).json(toFlyCategory(result.rows[0]));
  }),
);

flyCategoriesRouter.put(
  "/:id",
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const parsed = bodySchema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, "name is required");
    const result = await db.execute({
      sql: "UPDATE fly_categories SET name = ?, details = ? WHERE id = ? RETURNING id, name, details",
      args: [parsed.data.name, parsed.data.details, Number(req.params.id)],
    });
    if (result.rows.length === 0) throw new HttpError(404, "Fly category not found");
    res.json(toFlyCategory(result.rows[0]));
  }),
);

flyCategoriesRouter.delete(
  "/:id",
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const result = await db.execute({
      sql: "DELETE FROM fly_categories WHERE id = ?",
      args: [Number(req.params.id)],
    });
    if (result.rowsAffected === 0) throw new HttpError(404, "Fly category not found");
    res.status(204).end();
  }),
);
