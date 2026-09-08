import express from "express";
import cors from "cors";
import { config } from "./config.js";
import { initSchema } from "./db.js";
import { errorHandler } from "./middleware.js";
import { authRouter } from "./routes/auth.js";
import { brandsRouter } from "./routes/brands.js";
import { flyCategoriesRouter } from "./routes/flyCategories.js";
import { materialCategoriesRouter } from "./routes/materialCategories.js";
import { hooksRouter } from "./routes/hooks.js";
import { materialsRouter } from "./routes/materials.js";
import { fliesRouter } from "./routes/flies.js";

async function main() {
  await initSchema();

  const app = express();
  app.use(cors({ origin: config.corsOrigins }));
  app.use(express.json());

  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

  app.use("/api/auth", authRouter);
  app.use("/api/brands", brandsRouter);
  app.use("/api/fly-categories", flyCategoriesRouter);
  app.use("/api/material-categories", materialCategoriesRouter);
  app.use("/api/hooks", hooksRouter);
  app.use("/api/materials", materialsRouter);
  app.use("/api/flies", fliesRouter);

  app.use(errorHandler);

  app.listen(config.port, () => {
    console.log(`FlyTying API listening on http://localhost:${config.port}`);
  });
}

main().catch((err) => {
  console.error("Failed to start API:", err);
  process.exit(1);
});
