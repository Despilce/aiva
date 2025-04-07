import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { connectDB } from "./lib/db.js";

import { authRouter } from "./routes/auth.route.js";
import { messageRouter } from "./routes/message.route.js";
import { statsRouter } from "./routes/stats.route.js";
import { app, server } from "./lib/socket.js";

dotenv.config();

const PORT = process.env.PORT || 5001;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Debug middleware for all requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.use(express.json());
app.use(cookieParser());

// Configure CORS based on environment
const corsOptions = {
  origin:
    process.env.NODE_ENV === "production"
      ? process.env.FRONTEND_URL || "https://your-frontend-url.com"
      : "http://localhost:5173",
  credentials: true,
};
app.use(cors(corsOptions));

// Register routes
app.use("/api/auth", authRouter);
app.use("/api/messages", messageRouter);
app.use("/api/stats", statsRouter);

// Debug endpoint to check server status
app.get("/api/debug", (req, res) => {
  res.json({
    message: "Server is running",
    timestamp: new Date().toISOString(),
    routes: {
      auth: "/api/auth",
      messages: "/api/messages",
      stats: "/api/stats",
    },
  });
});

if (process.env.NODE_ENV === "production") {
  const frontendDistPath = path.join(__dirname, "../../frontend/dist");
  console.log("Serving static files from:", frontendDistPath);

  // Serve static files
  app.use(express.static(frontendDistPath));

  // Handle all other routes by serving the index.html
  app.get("*", (req, res) => {
    res.sendFile(path.join(frontendDistPath, "index.html"));
  });
}

server.listen(PORT, () => {
  console.log(`Server is running on PORT: ${PORT}`);
  console.log("Environment:", process.env.NODE_ENV);
  connectDB();
});
