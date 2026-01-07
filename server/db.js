import mongoose from "mongoose";

export async function connectDatabase() {
  const { MONGODB_URI, MONGO_URI, DATABASE_URL } = process.env;
  const connectionString = MONGODB_URI || MONGO_URI || DATABASE_URL;

  if (!connectionString) {
    throw new Error("MongoDB connection string is not set");
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  await mongoose.connect(connectionString);
  return mongoose.connection;
}