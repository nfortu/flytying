# FlyTying domain & data model

FlyTying is a fly fishing platform to record fly tying recipes and browse a
library of patterns. This document describes the app domain and data model **as
currently implemented**. Items from the original design that are not built yet
are called out in [Not yet implemented](#not-yet-implemented).

Data splits into two kinds:
- **Catalog data**: reference/common data curated by admins (Brand, FlyCategory, MaterialCategory, Hook, Material). Both portals read this catalog; only the admin portal writes to it.
- **User data**: data owned by individual users (Fly, FlyVariant).

The shared TypeScript types for every entity below live in
[`app/shared/src/index.ts`](../app/shared/src/index.ts); the SQL schema lives in
[`app/api/src/db.ts`](../app/api/src/db.ts).

## Catalog (admin-managed)

### Brand
- id
- name

e.g. Hareline, MFC, Whiting

### FlyCategory
- id
- name
- details

e.g. dry, wet, emerger, nymph, streamer

### MaterialCategory
- id
- name

e.g. feathers, hair, thread, fibers, beadheads, eyes

### Hook
- id
- model
- brandId (Brand)
- intendedFor: FlyCategory ids this hook is suited for (many-to-many)
- details
- sizes: list of available sizes, e.g. [4, 5, 6, 7, 8, 9, 10]

### Material
- id
- categoryId (MaterialCategory)
- name
- details
- brandIds: Brands this material is available from (many-to-many; may be empty for generic/natural materials)

## User data

### User
- id
- email
- password (hashed; `password_hash` column, never returned by the API)
- role: user | admin

The API only exposes `{ id, email, role }` (see `User` in the shared model).

### Fly (pattern)
The base identity of a tying pattern, optionally owned by the user who authored it, along with its default recipe.
- id
- name
- categoryId (FlyCategory)
- hookModel: free-text hook model (not a foreign key to Hook)
- hookSize: free-text size, e.g. "12-16"
- pictures: list of image URLs (uploaded files are served under `/api/uploads/...`)
- materialIds: default list of required Materials (many-to-many)
- ownerId (User) — nullable; null denotes a shared/unowned pattern

Any authenticated user can read every fly; only the owner (or an admin) can
update or delete one. There is no per-fly visibility flag — all flies are
readable by all authenticated users.

### FlyVariant
A color/material variation of a Fly (e.g. a Woolly Bugger tied in Olive vs Black), sharing the parent Fly's category, hook, and materials. A variant only records how its materials differ from the base Fly.
- id
- flyId (Fly)
- name: variant label, e.g. "Olive", "Black"
- pictures: list of image URLs, specific to this variant (falls back to the parent Fly's pictures if empty)
- substitutions: list of FlyVariantMaterial (see below)

### FlyVariantMaterial
A material substitution for a FlyVariant: swaps one of the base Fly's materials for a different one in this variant. A variant with no substitutions simply uses the base Fly's materials list as-is.
- baseMaterialId (Material) — a material from the parent Fly's materials list
- replacementMaterialId (Material) — the material used instead, in this variant

A variant's effective materials list = the parent Fly's materials, with any `baseMaterialId` replaced by its `replacementMaterialId`.

## Relationships summary
- Brand 1—* Hook (`brand_id`)
- Brand *—* Material (`brand_ids`)
- MaterialCategory 1—* Material (`category_id`)
- FlyCategory *—* Hook (`intended_for`)
- FlyCategory 1—* Fly (`category_id`)
- User 1—* Fly (ownership; `owner_id`, nullable)
- Fly *—* Material (default materials list; `material_ids`)
- Fly 1—* FlyVariant
- FlyVariant *—* Material, via FlyVariantMaterial (substitutions only)

## Core behaviors this model supports
- Author a Fly recipe (category, free-text hook model + size, default materials list, pictures).
- Add FlyVariants to a Fly to capture color/material variations without duplicating the whole recipe.
- Browse every fly, browse only your own (`/api/flies/mine`), and search/filter the catalog by name and fly category (user portal).
- Upload pattern pictures (JPG/PNG/WEBP, up to 5 per fly, 5 MB each).

## Not yet implemented

These appear in the original product design but are **not** in the current data
model or API. See also the "not yet built" note in the [README](../README.md).

- **Color** entity and `Material.color` — no colors table or color field exists; searching by material color is not supported.
- **Inventory** (User ↔ Material) and the "what can I tie" tie-able matcher.
- **Fly visibility** (private vs published shared library) — all flies are visible to all authenticated users.
- **Fly `tying_steps`** — ordered free-text tying instructions.
- **Timestamps** — `created_at` / `updated_at` on User, Fly, and FlyVariant.
- **User `username` and `display_name`**.
- **Hook as a foreign key on Fly** with `hook_size` validated against `hook.sizes` — flies currently store free-text hook model and size.
