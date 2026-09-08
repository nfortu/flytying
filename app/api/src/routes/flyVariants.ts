import { Router } from "express";
import type { Row } from "@libsql/client";
import { z } from "zod";
import { db } from "../db.js";
import { toFlyVariant } from "../mappers.js";
import { asyncHandler, HttpError, requireAuth } from "../middleware.js";

/** Nested under /flies/:id/variants — mergeParams gives access to req.params.id (the fly id). */
export const flyVariantsRouter = Router({ mergeParams: true });

const bodySchema = z.object({
  name: z.string().trim().min(1),
  pictures: z.array(z.string().url()).default([]),
  substitutions: z
    .array(
      z.object({
        baseMaterialId: z.number().int().positive(),
        replacementMaterialId: z.number().int().positive(),
      }),
    )
    .default([]),
});

flyVariantsRouter.use(requireAuth);

async function loadFlyOr404(flyId: number): Promise<{ ownerId: number | null }> {
  const result = await db.execute({ sql: "SELECT owner_id FROM flies WHERE id = ?", args: [flyId] });
  if (result.rows.length === 0) throw new HttpError(404, "Fly not found");
  const row = result.rows[0];
  return { ownerId: row.owner_id == null ? null : Number(row.owner_id) };
}

/** All variants of a fly, each with its material substitutions. */
flyVariantsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const flyId = Number(req.params.id);
    await loadFlyOr404(flyId);

    const variants = await db.execute({
      sql: "SELECT id, fly_id, name, pictures FROM fly_variants WHERE fly_id = ? ORDER BY name",
      args: [flyId],
    });
    const subs = await db.execute({
      sql: `SELECT variant_id, base_material_id, replacement_material_id FROM fly_variant_materials
            WHERE variant_id IN (SELECT id FROM fly_variants WHERE fly_id = ?)`,
      args: [flyId],
    });
    res.json(
      variants.rows.map((v) =>
        toFlyVariant(
          v,
          subs.rows.filter((s) => Number(s.variant_id) === Number(v.id)),
        ),
      ),
    );
  }),
);

flyVariantsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const flyId = Number(req.params.id);
    const fly = await loadFlyOr404(flyId);
    const isAdmin = req.user!.role === "admin";
    if (!isAdmin && fly.ownerId !== req.user!.sub) {
      throw new HttpError(403, "You do not own this fly");
    }

    const parsed = bodySchema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, "Invalid variant payload");
    const { name, pictures, substitutions } = parsed.data;

    const inserted = await db.execute({
      sql: `INSERT INTO fly_variants (fly_id, name, pictures) VALUES (?, ?, ?)
            RETURNING id, fly_id, name, pictures`,
      args: [flyId, name, JSON.stringify(pictures)],
    });
    const variantRow = inserted.rows[0];
    const variantId = Number(variantRow.id);

    const subRows: Row[] = [];
    for (const sub of substitutions) {
      await db.execute({
        sql: `INSERT INTO fly_variant_materials (variant_id, base_material_id, replacement_material_id)
              VALUES (?, ?, ?)`,
        args: [variantId, sub.baseMaterialId, sub.replacementMaterialId],
      });
      subRows.push({
        variant_id: variantId,
        base_material_id: sub.baseMaterialId,
        replacement_material_id: sub.replacementMaterialId,
      } as unknown as Row);
    }

    res.status(201).json(toFlyVariant(variantRow, subRows));
  }),
);

flyVariantsRouter.delete(
  "/:variantId",
  asyncHandler(async (req, res) => {
    const flyId = Number(req.params.id);
    const fly = await loadFlyOr404(flyId);
    const isAdmin = req.user!.role === "admin";
    if (!isAdmin && fly.ownerId !== req.user!.sub) {
      throw new HttpError(403, "You do not own this fly");
    }
    await db.execute({
      sql: "DELETE FROM fly_variant_materials WHERE variant_id = ?",
      args: [Number(req.params.variantId)],
    });
    const result = await db.execute({
      sql: "DELETE FROM fly_variants WHERE id = ? AND fly_id = ?",
      args: [Number(req.params.variantId), flyId],
    });
    if (result.rowsAffected === 0) throw new HttpError(404, "Variant not found");
    res.status(204).end();
  }),
);
