import bcrypt from "bcryptjs";
import { User } from "../models/user.js";
import { createToken } from "../lib/token.js";

export async function signupUser(payload) {
  const existingUser = await User.findOne({ email: payload.email });

  if (existingUser) {
    const error = new Error("Email already registered");
    error.status = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(payload.password, 12);
  const user = await User.create({
    email: payload.email,
    passwordHash
  });

  return {
    token: createToken(user),
    user: { id: user._id, email: user.email }
  };
}

export async function loginUser(payload) {
  const user = await User.findOne({ email: payload.email });

  if (!user) {
    const error = new Error("Invalid credentials");
    error.status = 401;
    throw error;
  }

  const passwordMatches = await bcrypt.compare(payload.password, user.passwordHash);

  if (!passwordMatches) {
    const error = new Error("Invalid credentials");
    error.status = 401;
    throw error;
  }

  return {
    token: createToken(user),
    user: { id: user._id, email: user.email }
  };
}