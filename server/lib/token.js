import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "change-me";

export function createToken(user) {
  return jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, {
    expiresIn: "7d"
  });
}