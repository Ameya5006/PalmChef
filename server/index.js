import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// --------------------
// Gemini Init
// --------------------
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  generationConfig: {
    temperature: 0.2,
    maxOutputTokens: 2048
  }
});

// --------------------
// Strict Schema
// --------------------
const StepSchema = z.object({
  text: z.string().min(5),
  seconds: z.number().int().positive().optional()
});

const StepsSchema = z.array(StepSchema).min(1);

// --------------------
// API Route
// --------------------
app.post("/api/parse-recipe", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Text is required" });
    }

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
[
  { "text": "Step description", "seconds"?: number }
]

TIME EXAMPLES:
- "15 minutes" → 900
- "1 hour 30 minutes" → 5400
- "overnight" → 28800

TEXT:
"""
${text.slice(0, 12000)}
"""
`;

    const result = await model.generateContent(prompt);
    const raw = result.response.text().replace(/```json|```/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return res.status(422).json({ error: "Invalid JSON from AI" });
    }

    const validatedSteps = StepsSchema.parse(parsed);
    return res.json({ steps: validatedSteps });

  } catch (err) {
    console.error("AI Parsing Error:", err);
    return res.status(500).json({ error: "Failed to parse recipe" });
  }
});

app.listen(PORT, () => {
  console.log(`PalmChef Backend running at http://localhost:${PORT}`);
});
