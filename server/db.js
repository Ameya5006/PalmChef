import mongoose from "mongoose";

const { MONGODB_URI } = process.env;

export async function connectDatabase() {
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not set");
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  await mongoose.connect(MONGODB_URI);
  return mongoose.connection;
}