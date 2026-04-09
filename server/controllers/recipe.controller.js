import { ZodError } from "zod";
import { parseRecipeText } from "../services/recipe.service.js";

export async function parseRecipe(req, res) {
  try {
    const { text } = req.body;

    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Text is required" });
    }

    const steps = await parseRecipeText(text);
    return res.json({ steps });
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ error: err.errors });
    }

    return res.status(err.status || 500).json({
      error: err.message || "Failed to parse recipe"
    });
  }
}