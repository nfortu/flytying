import { createClient, type Client } from "@libsql/client";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { config } from "./config.js";

// For a local file:// url, make sure the parent directory exists before libSQL
// tries to open the database file.
if (config.databaseUrl.startsWith("file:")) {
  const path = config.databaseUrl.slice("file:".length);
  try {
    mkdirSync(dirname(path), { recursive: true });
  } catch {
    // best effort — libSQL will surface a clearer error if the path is unusable
  }
}

export const db: Client = createClient({
  url: config.databaseUrl,
  authToken: config.databaseAuthToken,
});

/** Create tables if they don't exist. Idempotent — safe to call on every boot. */
export async function initSchema(): Promise<void> {
  await db.batch(
    [
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('admin','user'))
      )`,
      `CREATE TABLE IF NOT EXISTS brands (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE
      )`,
      `CREATE TABLE IF NOT EXISTS fly_categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        details TEXT NOT NULL DEFAULT ''
      )`,
      `CREATE TABLE IF NOT EXISTS material_categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE
      )`,
      `CREATE TABLE IF NOT EXISTS hooks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        model TEXT NOT NULL,
        brand_id INTEGER NOT NULL REFERENCES brands(id),
        intended_for TEXT NOT NULL DEFAULT '[]',
        details TEXT NOT NULL DEFAULT '',
        sizes TEXT NOT NULL DEFAULT '[]'
      )`,
      `CREATE TABLE IF NOT EXISTS materials (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_id INTEGER NOT NULL REFERENCES material_categories(id),
        name TEXT NOT NULL,
        details TEXT NOT NULL DEFAULT '',
        brand_ids TEXT NOT NULL DEFAULT '[]'
      )`,
      `CREATE TABLE IF NOT EXISTS flies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category_id INTEGER NOT NULL REFERENCES fly_categories(id),
        hook_model TEXT NOT NULL DEFAULT '',
        hook_size TEXT NOT NULL DEFAULT '',
        pictures TEXT NOT NULL DEFAULT '[]',
        material_ids TEXT NOT NULL DEFAULT '[]',
        owner_id INTEGER REFERENCES users(id)
      )`,
      `CREATE TABLE IF NOT EXISTS fly_variants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fly_id INTEGER NOT NULL REFERENCES flies(id),
        name TEXT NOT NULL,
        pictures TEXT NOT NULL DEFAULT '[]'
      )`,
      `CREATE TABLE IF NOT EXISTS fly_variant_materials (
        variant_id INTEGER NOT NULL REFERENCES fly_variants(id),
        base_material_id INTEGER NOT NULL REFERENCES materials(id),
        replacement_material_id INTEGER NOT NULL REFERENCES materials(id),
        PRIMARY KEY (variant_id, base_material_id)
      )`,
    ],
    "write",
  );
}
