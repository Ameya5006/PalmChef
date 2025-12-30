import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Allow large text payloads

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/api/parse-recipe', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'No text provided' });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      You are a specialized sous-chef AI. 
      Extract the cooking instructions from the following text into a clean, sequential list of steps.
      
      Rules:
      1. Ignore intro fluff, author stories, or nutritional info.
      2. If a step has a specific time duration (e.g., "bake for 15 mins"), extract it in seconds.
      3. Return ONLY a JSON array of strings (for simple steps) or objects if there is a timer.
      
      Format your response as a pure JSON array of strings. Example: ["Preheat oven to 350F", "Mix eggs and flour", "Bake for 20 mins"]
      
      Text to parse:
      ${text}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const textResponse = response.text();
    
    // Clean up the markdown JSON block if Gemini adds it
    const cleanJson = textResponse.replace(/```json|```/g, '').trim();
    const steps = JSON.parse(cleanJson);

    res.json({ steps });
  } catch (error) {
    console.error('AI Parsing Error:', error);
    res.status(500).json({ error: 'Failed to parse recipe with AI' });
  }
});

app.listen(PORT, () => {
  console.log(`PalmChef Backend running on http://localhost:${PORT}`);
});