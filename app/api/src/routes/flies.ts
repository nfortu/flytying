import { Router } from "express";
import { z } from "zod";
import { db } from "../db.js";
import { toFly } from "../mappers.js";
import { asyncHandler, HttpError, requireAuth } from "../middleware.js";
import { MAX_PICTURES, pictureUrlsFor, uploadPictures } from "../uploads.js";
import { flyVariantsRouter } from "./flyVariants.js";

export const fliesRouter = Router();

const FLY_COLUMNS = "id, name, category_id, hook_model, hook_size, pictures, material_ids, owner_id";

// POST and PUT both arrive as multipart/form-data (pictures are uploaded
// files), so fields come through as strings that need coercing.
const createFormSchema = z.object({
  name: z.string().trim().min(1),
  categoryId: z.coerce.number().int().positive(),
  hookModel: z.string().trim().default(""),
  hookSize: z.string().trim().default(""),
});

function jsonArray<T extends z.ZodTypeAny>(item: T) {
  return z
    .string()
    .default("[]")
    .transform((raw, ctx) => {
      try {
        const parsed = JSON.parse(raw);
        const result = z.array(item).safeParse(parsed);
        if (!result.success) throw new Error();
        return result.data;
      } catch {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid JSON array" });
        return z.NEVER;
      }
    });
}

// existingPictures may be externally hosted (legacy) or one of our own
// /api/uploads/... paths; new uploads are appended via pictureUrlsFor.
const updateFormSchema = createFormSchema.extend({
  existingPictures: jsonArray(z.string().min(1)),
  materialIds: jsonArray(z.number().int()),
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
  uploadPictures,
  asyncHandler(async (req, res) => {
    const parsed = createFormSchema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, "Invalid fly payload");
    const { name, categoryId, hookModel, hookSize } = parsed.data;
    const pictures = pictureUrlsFor(req);
    const result = await db.execute({
      sql: `INSERT INTO flies (name, category_id, hook_model, hook_size, pictures, material_ids, owner_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            RETURNING ${FLY_COLUMNS}`,
      args: [name, categoryId, hookModel, hookSize, JSON.stringify(pictures), JSON.stringify([]), req.user!.sub],
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
  uploadPictures,
  asyncHandler(async (req, res) => {
    const parsed = updateFormSchema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, "Invalid fly payload");
    const id = Number(req.params.id);
    await assertOwnerOrAdmin(id, req.user!.sub, req.user!.role === "admin");

    const { name, categoryId, hookModel, hookSize, existingPictures, materialIds } = parsed.data;
    const pictures = [...existingPictures, ...pictureUrlsFor(req)];
    if (pictures.length > MAX_PICTURES) throw new HttpError(400, `You can upload at most ${MAX_PICTURES} pictures`);

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
