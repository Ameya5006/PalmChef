import type { Ingredient, RecipeStep } from "@/types";

const INGREDIENTS_HEADER_RE = /^ingredients?\b/i;

const STOPWORDS = new Set([
  "fresh",
  "chopped",
  "diced",
  "minced",
  "optional",
  "to",
  "taste",
  "for",
  "serving",
  "divided",
  "room",
  "temperature",
  "large",
  "small",
  "medium",
  "extra",
  "virgin",
  "and",
  "or",
  "of"
]);

function normalizeIngredientName(text: string): string {
  return text
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^a-z\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractSearchTokens(name: string): string[] {
  return normalizeIngredientName(name)
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token.length > 2 && !STOPWORDS.has(token));
}

function parseIngredientLine(line: string): Ingredient | null {
  const cleaned = line
    .replace(/^[-*•\d.)\s]+/, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned || cleaned.length < 3) return null;

  const match = cleaned.match(
    /^(?<quantity>\d+(?:[./]\d+)?(?:\s+\d+\/\d+)?)?\s*(?<unit>cups?|tbsp|tablespoons?|tsp|teaspoons?|g|kg|oz|lb|ml|l|cloves?|cans?|pinch|dash)?\s*(?<name>.+)$/i
  );

  if (!match?.groups?.name) return null;

  const name = match.groups.name.trim();
  if (name.length < 2) return null;

  return {
    id: crypto.randomUUID(),
    name,
    quantity: match.groups.quantity?.trim() || undefined,
    unit: match.groups.unit?.trim() || undefined,
    firstUsedStepIndex: 0
  };
}

function findIngredientSection(rawText: string): string[] {
  const lines = rawText
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const start = lines.findIndex((line) => INGREDIENTS_HEADER_RE.test(line));
  if (start === -1) return [];

  const result: string[] = [];
  for (let i = start + 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (/^(instructions?|directions?|method|steps?)\b/i.test(line)) {
      break;
    }
    result.push(line);
  }

  return result;
}

export function extractIngredients(rawText: string): Ingredient[] {
  const sectionLines = findIngredientSection(rawText);
  const parsed = sectionLines
    .map(parseIngredientLine)
    .filter((item): item is Ingredient => Boolean(item));

  return parsed;
}

export function mapFirstIngredientUsage(
  ingredients: Ingredient[],
  steps: RecipeStep[]
): Ingredient[] {
  return ingredients.map((ingredient) => {
    const tokens = extractSearchTokens(ingredient.name);
    const firstUsedStepIndex =
      steps.findIndex((step) => {
        const stepText = step.text.toLowerCase();
        return tokens.some((token) => stepText.includes(token));
      }) || 0;

    return {
      ...ingredient,
      firstUsedStepIndex
    };
  });
}

export function formatIngredientLine(ingredient: Ingredient): string {
  const quantity = ingredient.quantity ? `${ingredient.quantity} ` : "";
  const unit = ingredient.unit ? `${ingredient.unit} ` : "";
  return `${quantity}${unit}${ingredient.name}`.trim();
}

export function buildShoppingList(ingredients: Ingredient[]): string[] {
  return ingredients.map(formatIngredientLine);
}
