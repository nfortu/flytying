/**
 * Seeds the database with the static reference data from specs/domain-model.md
 * plus a demo admin and user. Idempotent: uses INSERT OR IGNORE on unique names.
 *
 * Run with: npm run seed --workspace app/api
 */
import { db, initSchema } from "./db.js";
import { hashPassword } from "./auth.js";

const BRANDS = ["Hareline", "MFC", "Whiting"];

const FLY_CATEGORIES: Array<[string, string]> = [
  ["dry", "Floats on the surface film, imitating adult insects."],
  ["wet", "Fished below the surface, imitating drowned or emerging insects."],
  ["emerger", "Imitates insects transitioning from nymph to adult at the surface."],
  ["nymph", "Imitates the underwater larval stage of aquatic insects."],
  ["streamer", "Larger patterns imitating baitfish, leeches and crayfish."],
];

const MATERIAL_CATEGORIES = ["feathers", "hair", "thread", "fibers", "beadheads", "eyes"];

async function seedUsers() {
  const users: Array<[string, string, string]> = [
    ["admin@flytying.dev", "admin1234", "admin"],
    ["tyer@flytying.dev", "tyer1234", "user"],
  ];
  for (const [email, password, role] of users) {
    const hash = await hashPassword(password);
    await db.execute({
      sql: "INSERT OR IGNORE INTO users (email, password_hash, role) VALUES (?, ?, ?)",
      args: [email, hash, role],
    });
  }
}

async function main() {
  await initSchema();

  for (const name of BRANDS) {
    await db.execute({ sql: "INSERT OR IGNORE INTO brands (name) VALUES (?)", args: [name] });
  }
  for (const [name, details] of FLY_CATEGORIES) {
    await db.execute({
      sql: "INSERT OR IGNORE INTO fly_categories (name, details) VALUES (?, ?)",
      args: [name, details],
    });
  }
  for (const name of MATERIAL_CATEGORIES) {
    await db.execute({ sql: "INSERT OR IGNORE INTO material_categories (name) VALUES (?)", args: [name] });
  }

  await seedUsers();

  console.log("Seed complete.");
  console.log("  admin@flytying.dev / admin1234");
  console.log("  tyer@flytying.dev  / tyer1234");
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
