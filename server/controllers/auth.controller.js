import { z } from "zod";
import { AuthSchema } from "../validators/auth.validator.js";
import { loginUser, signupUser } from "../services/auth.service.js";

export async function signup(req, res) {
  try {
    const payload = AuthSchema.parse(req.body);
    const response = await signupUser(payload);
    return res.status(201).json(response);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors });
    }

    return res.status(err.status || 500).json({
      error: err.message || "Failed to sign up"
    });
  }
}

export async function login(req, res) {
  try {
    const payload = AuthSchema.parse(req.body);
    const response = await loginUser(payload);
    return res.json(response);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors });
    }

    return res.status(err.status || 500).json({
      error: err.message || "Failed to log in"
    });
  }
}