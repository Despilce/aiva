import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import userRoutes from "./routes/user.route.js";
import statsRoutes from "./routes/stats.route.js";

import connectToMongoDB from "./db/connectToMongoDB.js";
import { app, server } from "./socket/socket.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const PORT = process.env.PORT || 5001;

app.use(express.json()); // Parse JSON bodies
app.use(cookieParser()); // Parse cookies
app.use(cors()); // Enable CORS

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/users", userRoutes);
app.use("/api/stats", statsRoutes);

app.use(express.static(path.join(__dirname, "../../frontend/dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../../frontend/dist/index.html"));
});

server.listen(PORT, () => {
  connectToMongoDB();
  console.log(`Server is running on port ${PORT}`);
});
