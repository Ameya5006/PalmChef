import { Router } from "express";
import { parseRecipe } from "../controllers/recipe.controller.js";

const router = Router();

router.post("/parse-recipe", parseRecipe);

export default router;