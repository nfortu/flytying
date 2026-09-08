# FlyTying domain & data model

FlyTying is a fly fishing platform to record fly tying recipes, browse a shared library of patterns, and track which flies can be tied with the materials a user owns. This document describes the app domain and data model.

Data splits into two kinds:
- **Catalog data**: reference/common data curated by admins (Brand, FlyType, MaterialCategory, Color, Hook, Material). Both portals read this catalog; only the admin portal writes to it.
- **User data**: data owned by individual users (Fly, FlyVariant, Inventory).

## Catalog (admin-managed)

### Brand
- id
- name

e.g. Hareline, MFC, Whiting

### FlyType
- id
- name
- details

e.g. Dry, Wet, Emerger, Nymph, Streamer

### MaterialCategory
- id
- name

e.g. Feathers, Hair, Thread, Fibers, Beadheads, Eyes

### Color
- id
- name

e.g. Black, Olive, White, Chartreuse, UV Pearl, Natural

### Hook
- id
- model
- brand (Brand)
- details
- sizes: list of available sizes, e.g. [4, 5, 6, 7, 8, 9, 10]
- intended_for: FlyTypes this hook is suited for (many-to-many)

### Material
- id
- category (MaterialCategory)
- name
- details
- color (Color, optional)
- brands: Brands this material is available from (many-to-many; may be empty for generic/natural materials)

## User data

### User
- id
- username
- email
- password (hashed)
- display_name
- role: user | admin
- created_at

### Fly (pattern)
The base identity of a tying pattern, owned by the user who authored it, along with its default recipe.
- id
- owner (User)
- name
- fly_type (FlyType)
- hook (Hook)
- hook_size: one value taken from hook.sizes
- materials: default list of required Materials (many-to-many)
- tying_steps: ordered list of free-text steps
- pictures: list of image URLs
- visibility: private | published
  - private: visible only to the owner
  - published: visible to all authenticated users, part of the shared library
- created_at
- updated_at

### FlyVariant
A color/material variation of a Fly (e.g. a Woolly Bugger tied in Olive vs Black), sharing the parent Fly's type, hook, and tying steps. A variant only records how its materials differ from the base Fly.
- id
- fly (Fly)
- name: variant label, e.g. "Olive", "Black"
- pictures: list of image URLs, specific to this variant (falls back to the parent Fly's pictures if empty)
- created_at
- updated_at

### FlyVariantMaterial
A material substitution for a FlyVariant: swaps one of the base Fly's materials for a different one in this variant. A variant with no substitutions simply uses the base Fly's materials list as-is.
- variant (FlyVariant)
- base_material (Material) — a material from the parent Fly's materials list
- replacement_material (Material) — the material used instead, in this variant

A variant's effective materials list = the parent Fly's materials, with any `base_material` replaced by its `replacement_material`.

### Inventory (User ↔ Material)
The set of materials a user currently owns.
- user (User)
- material (Material)
- added_at

## Relationships summary
- Brand 1—* Hook
- Brand *—* Material
- MaterialCategory 1—* Material
- Color 1—* Material
- FlyType *—* Hook (intended_for)
- FlyType 1—* Fly
- Hook 1—* Fly
- User 1—* Fly (ownership)
- Fly *—* Material (default materials list)
- Fly 1—* FlyVariant
- FlyVariant *—* Material, via FlyVariantMaterial (substitutions only)
- User *—* Material, via Inventory (materials the user owns)

## Core behaviors this model supports
- Author a Fly recipe (hook, default materials list, tying steps, pictures), keep it private or publish it to the shared library.
- Add FlyVariants to a Fly to capture color/material variations without duplicating the whole recipe.
- Browse and search published Flies (and their variants) by name, fly type, hook, or material color.
- Maintain a personal Inventory of owned materials.
- Given a Fly or FlyVariant's effective material list, check whether the user's Inventory covers it (tie-able check); given the Inventory, find which Flies/variants (own + published) are fully tie-able.
