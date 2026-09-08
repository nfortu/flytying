import type { Row } from "@libsql/client";
import type { Brand, Fly, FlyCategory, Hook, Material, MaterialCategory } from "@flytying/shared";

function num(v: unknown): number {
  return Number(v);
}

function str(v: unknown): string {
  return v == null ? "" : String(v);
}

/** Parse a JSON text column into an array, tolerating null/garbage. */
function jsonArray<T>(v: unknown): T[] {
  if (v == null) return [];
  try {
    const parsed = JSON.parse(String(v));
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

export const toBrand = (r: Row): Brand => ({ id: num(r.id), name: str(r.name) });

export const toFlyCategory = (r: Row): FlyCategory => ({
  id: num(r.id),
  name: str(r.name),
  details: str(r.details),
});

export const toMaterialCategory = (r: Row): MaterialCategory => ({
  id: num(r.id),
  name: str(r.name),
});

export const toHook = (r: Row): Hook => ({
  id: num(r.id),
  model: str(r.model),
  brandId: num(r.brand_id),
  intendedFor: jsonArray<number>(r.intended_for),
  details: str(r.details),
  sizes: jsonArray<number>(r.sizes),
});

export const toMaterial = (r: Row): Material => ({
  id: num(r.id),
  categoryId: num(r.category_id),
  name: str(r.name),
  details: str(r.details),
  brandIds: jsonArray<number>(r.brand_ids),
});

export const toFly = (r: Row): Fly => ({
  id: num(r.id),
  name: str(r.name),
  categoryId: num(r.category_id),
  hookModel: str(r.hook_model),
  hookSize: str(r.hook_size),
  pictures: jsonArray<string>(r.pictures),
  materialIds: jsonArray<number>(r.material_ids),
  ownerId: r.owner_id == null ? null : num(r.owner_id),
});
