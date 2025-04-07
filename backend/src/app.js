const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const chatRoutes = require("./routes/chat.routes");
const statsRoutes = require("./routes/stats.routes");

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/stats", statsRoutes);
