/**
 * Shared domain model for the FlyTying platform.
 * Consumed by the api service and both portals so the contract stays in one place.
 * Mirrors specs/domain-model.md.
 */

// ---------------------------------------------------------------------------
// Static / reference types (admin-owned)
// ---------------------------------------------------------------------------

export interface Brand {
  id: number;
  name: string;
}

/** A fly category such as dry, wet, emerger, nymph, streamer. */
export interface FlyCategory {
  id: number;
  name: string;
  details: string;
}

/** A material category such as feathers, hair, thread, fibers, beadheads, eyes. */
export interface MaterialCategory {
  id: number;
  name: string;
}

// ---------------------------------------------------------------------------
// Core domain entities
// ---------------------------------------------------------------------------

export interface Hook {
  id: number;
  model: string;
  brandId: number;
  /** Fly categories this hook is intended for. */
  intendedFor: number[];
  details: string;
  /** Available hook sizes, e.g. [4,5,6,7,8,9,10]. */
  sizes: number[];
}

export interface Material {
  id: number;
  categoryId: number;
  name: string;
  details: string;
  brandIds: number[];
}

export interface Fly {
  id: number;
  name: string;
  categoryId: number;
  hookModel: string;
  /** Hook size range, e.g. "12-16". */
  hookSize: string;
  pictures: string[];
  /** Materials used to tie this fly. */
  materialIds: number[];
  /** Owning user (user-portal patterns are user-owned). Null for shared/admin data. */
  ownerId: number | null;
}

/** A material substitution: swaps one of the parent Fly's materials for another in a variant. */
export interface FlyVariantMaterial {
  baseMaterialId: number;
  replacementMaterialId: number;
}

/**
 * A color/material variation of a Fly (e.g. a Woolly Bugger tied in Olive vs Black), sharing
 * the parent Fly's category, hook and pictures unless overridden. Only records how its
 * materials differ from the base Fly.
 */
export interface FlyVariant {
  id: number;
  flyId: number;
  name: string;
  pictures: string[];
  substitutions: FlyVariantMaterial[];
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export type Role = "admin" | "user";

export interface User {
  id: number;
  email: string;
  role: Role;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

// ---------------------------------------------------------------------------
// Generic API error shape
// ---------------------------------------------------------------------------

export interface ApiError {
  error: string;
}
