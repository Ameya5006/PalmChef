import dotenv from "dotenv";
import { connectDatabase } from "./db.js";
import { createApp } from "./app.js";

dotenv.config();

const PORT = process.env.PORT || 3000;
const app = createApp();

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