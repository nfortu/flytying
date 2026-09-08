import { Router } from "express";
import { z } from "zod";
import { db } from "../db.js";
import { toFly } from "../mappers.js";
import { asyncHandler, HttpError, requireAuth } from "../middleware.js";
import { flyVariantsRouter } from "./flyVariants.js";

export const fliesRouter = Router();

const FLY_COLUMNS = "id, name, category_id, hook_model, hook_size, pictures, material_ids, owner_id";

const bodySchema = z.object({
  name: z.string().trim().min(1),
  categoryId: z.number().int().positive(),
  hookModel: z.string().trim().default(""),
  hookSize: z.string().trim().default(""),
  pictures: z.array(z.string().url()).default([]),
  materialIds: z.array(z.number().int()).default([]),
});

fliesRouter.use(requireAuth);

/** All flies — shared patterns plus every user's patterns (read-only browsing). */
fliesRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const result = await db.execute(`SELECT ${FLY_COLUMNS} FROM flies ORDER BY name`);
    res.json(result.rows.map(toFly));
  }),
);

/** Only the current user's patterns. */
fliesRouter.get(
  "/mine",
  asyncHandler(async (req, res) => {
    const result = await db.execute({
      sql: `SELECT ${FLY_COLUMNS} FROM flies WHERE owner_id = ? ORDER BY name`,
      args: [req.user!.sub],
    });
    res.json(result.rows.map(toFly));
  }),
);

/** A single fly by id (detail screen). */
fliesRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const result = await db.execute({
      sql: `SELECT ${FLY_COLUMNS} FROM flies WHERE id = ?`,
      args: [Number(req.params.id)],
    });
    if (result.rows.length === 0) throw new HttpError(404, "Fly not found");
    res.json(toFly(result.rows[0]));
  }),
);

fliesRouter.use("/:id/variants", flyVariantsRouter);

fliesRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const parsed = bodySchema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, "Invalid fly payload");
    const { name, categoryId, hookModel, hookSize, pictures, materialIds } = parsed.data;
    const result = await db.execute({
      sql: `INSERT INTO flies (name, category_id, hook_model, hook_size, pictures, material_ids, owner_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            RETURNING ${FLY_COLUMNS}`,
      args: [
        name,
        categoryId,
        hookModel,
        hookSize,
        JSON.stringify(pictures),
        JSON.stringify(materialIds),
        req.user!.sub,
      ],
    });
    res.status(201).json(toFly(result.rows[0]));
  }),
);

/** Load a fly and assert the caller may modify it (owner or admin). */
async function assertOwnerOrAdmin(id: number, userId: number, isAdmin: boolean): Promise<void> {
  const existing = await db.execute({ sql: "SELECT owner_id FROM flies WHERE id = ?", args: [id] });
  if (existing.rows.length === 0) throw new HttpError(404, "Fly not found");
  const ownerId = existing.rows[0].owner_id;
  if (!isAdmin && Number(ownerId) !== userId) throw new HttpError(403, "You do not own this fly");
}

fliesRouter.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const parsed = bodySchema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, "Invalid fly payload");
    const id = Number(req.params.id);
    await assertOwnerOrAdmin(id, req.user!.sub, req.user!.role === "admin");

    const { name, categoryId, hookModel, hookSize, pictures, materialIds } = parsed.data;
    const result = await db.execute({
      sql: `UPDATE flies SET name = ?, category_id = ?, hook_model = ?, hook_size = ?, pictures = ?, material_ids = ?
            WHERE id = ?
            RETURNING ${FLY_COLUMNS}`,
      args: [name, categoryId, hookModel, hookSize, JSON.stringify(pictures), JSON.stringify(materialIds), id],
    });
    res.json(toFly(result.rows[0]));
  }),
);

fliesRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    await assertOwnerOrAdmin(id, req.user!.sub, req.user!.role === "admin");
    await db.execute({ sql: "DELETE FROM flies WHERE id = ?", args: [id] });
    res.status(204).end();
  }),
);
