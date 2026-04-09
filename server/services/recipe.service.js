import { recipeModel } from "../lib/gemini.js";
import { StepsSchema } from "../validators/recipe.validator.js";

export async function parseRecipeText(text) {
  const prompt = `
You are a cooking assistant AI.

TASK:
Extract ONLY the actual cooking steps.

RULES (STRICT):
- Ignore intros, stories, nutrition, ads.
- Each step must be ONE clear cooking action.
- Detect time durations and convert to SECONDS.
- Output ONLY valid JSON.
- Do NOT include markdown or explanation.

FORMAT (STRICT JSON ARRAY):
@@ -71,28 +87,97 @@ TIME EXAMPLES:
TEXT:
"""
${text.slice(0, 12000)}
"""
`;

  const result = await recipeModel.generateContent(prompt);
  const raw = result.response.text().replace(/```json|```/g, "").trim();

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    const error = new Error("Invalid JSON from AI");
    error.status = 422;
    throw error;
  }

  return StepsSchema.parse(parsed);
}