const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const { createServer } = require("http");
const { Server } = require("socket.io");

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*", // allow all or specific frontend
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

// Pass io to request
app.set("io", io);

// Socket connections
io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);
  
  socket.on("join", (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined their room`);
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

// Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Connect Database
connectDB();

// Import Routes
const authRoutes = require("./routes/authRoutes");
const issueRoutes = require("./routes/issueRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const updateRoutes = require("./routes/updateRoutes");
const adminRoutes = require("./routes/adminRoutes");
const scheduleEscalations = require("./cron/escalationJob");
const scheduleReminders = require("./cron/reminderJob");

// Use Routes
app.use("/api/auth", authRoutes);
app.use("/api/issues", issueRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/updates", updateRoutes);
app.use("/api/admin", adminRoutes);

// Initialize Cron Jobs
scheduleEscalations();
scheduleReminders(app);

// Test Route
app.get("/", (req, res) => {
  res.send("Backend is running");
});

const PORT = 5000;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});