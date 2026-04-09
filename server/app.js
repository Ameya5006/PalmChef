import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import recipeRoutes from "./routes/recipe.routes.js";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: "10mb" }));

  app.use("/api", authRoutes);
  app.use("/api", recipeRoutes);

  return app;
}