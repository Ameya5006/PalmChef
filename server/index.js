import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { connectDatabase } from "./db.js";
import { User } from "./models/user.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "change-me";

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

const AuthSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

function createToken(user) {
  return jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, {
    expiresIn: "7d"
  });
}

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
@@ -71,28 +87,97 @@ TIME EXAMPLES:
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

app.post("/api/signup", async (req, res) => {
  try {
    const payload = AuthSchema.parse(req.body);
    const existingUser = await User.findOne({ email: payload.email });

    if (existingUser) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(payload.password, 12);
    const user = await User.create({
      email: payload.email,
      passwordHash
    });

    return res.status(201).json({
      token: createToken(user),
      user: { id: user._id, email: user.email }
    });
  } catch (err) {
    console.error("Signup Error:", err);
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors });
    }
    return res.status(500).json({ error: "Failed to sign up" });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const payload = AuthSchema.parse(req.body);
    const user = await User.findOne({ email: payload.email });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const passwordMatches = await bcrypt.compare(
      payload.password,
      user.passwordHash
    );

    if (!passwordMatches) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    return res.json({
      token: createToken(user),
      user: { id: user._id, email: user.email }
    });
  } catch (err) {
    console.error("Login Error:", err);
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors });
    }
    return res.status(500).json({ error: "Failed to log in" });
  }
});

async function startServer() {
  try {
    await connectDatabase();
    app.listen(PORT, () => {
      console.log(`PalmChef Backend running at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Database connection failed:", err);
    process.exit(1);
  }
}

startServer();