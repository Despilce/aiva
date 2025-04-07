import { Server } from "socket.io";
import http from "http";
import express from "express";
import User from "../models/user.model.js";

export const app = express();
export const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin:
      process.env.NODE_ENV === "production"
        ? [process.env.FRONTEND_URL || "https://your-frontend-url.com"]
        : ["http://localhost:5173"],
    credentials: true,
  },
});

export const getReceiverSocketId = (receiverId) => {
  return userSocketMap[receiverId];
};

// used to store online users
const userSocketMap = {}; // {userId: socketId}

io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId) {
    userSocketMap[userId] = socket.id;
    // Update user's online status and last seen
    User.findByIdAndUpdate(userId, {
      lastSeen: new Date(),
      isOnline: true,
    }).exec();
  }

  // io.emit() is used to send events to all the connected clients
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // Handle timer start event
  socket.on("timerStarted", ({ senderId, receiverId }) => {
    const receiverSocketId = userSocketMap[receiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("timerStarted", { senderId });
    }
  });

  // Handle timer pause event
  socket.on("timerPaused", ({ senderId, receiverId, timeRemaining }) => {
    const receiverSocketId = userSocketMap[receiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("timerPaused", { senderId, timeRemaining });
    }
  });

  // Handle timer resume event
  socket.on("timerResumed", ({ senderId, receiverId, timeRemaining }) => {
    const receiverSocketId = userSocketMap[receiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("timerResumed", { senderId, timeRemaining });
    }
  });

  // Handle timer total stop event
  socket.on("timerTotalStopped", ({ senderId, receiverId }) => {
    const receiverSocketId = userSocketMap[receiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("timerTotalStopped", { senderId });
    }
  });

  // Handle timer expired event
  socket.on("timerExpired", ({ senderId, receiverId }) => {
    const receiverSocketId = userSocketMap[receiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("timerExpired", { senderId });
    }
  });

  socket.on("disconnect", async () => {
    console.log("A user disconnected", socket.id);
    if (userId) {
      delete userSocketMap[userId];
      // Update last seen time when user goes offline
      await User.findByIdAndUpdate(userId, {
        lastSeen: new Date(),
        isOnline: false,
      });
    }
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { io };
