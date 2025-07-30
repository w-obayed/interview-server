import express from "express";
import dotenv from "dotenv";
import colors from "colors";
import errorHandler from "./middleware/error.middleware.js";
import authRouter from "./routes/auth.routes.js";
import taskRouter from "./routes/task.routes.js";
import passport from "passport";
import "./util/passport.js";
import connectDB from "./config/db.config.js";
import helmet from "helmet";
import cors from "cors";

// configure express app & dotenv
const app = express();
dotenv.config();

// cors platfrom access
app.use(
  cors({
    origin: process.env.CLIENT_HOME_PAGE_URL,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  })
);

// Use helmet before routes
app.use(helmet());

// Middleware to parse JSON bodies
app.use(express.json({ limit: "50mb" }));

// Middleware to parse URL-encoded bodies
app.use(express.urlencoded({ limit: "50mb", extended: false }));

// Middleware to serve static files from the 'public' directory
app.use(express.static("public"));

// Initialize passport
app.use(passport.initialize());

// route
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/task", taskRouter);

//  health check route BEFORE 404 handler
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Server is healthy",
    timestamp: new Date(),
  });
});

//  404 handler AFTER all routes
app.use((req, res) => {
  res.status(404).json({
    status: "fail",
    message: "Route not found",
    path: req.originalUrl,
  });
});

// error handler
app.use(errorHandler);

// port configuration
const PORT = process.env.PORT || 3000;

// Start the server
app.listen(PORT, async () => {
  await connectDB();
  console.log(`Server is running on port ${PORT}`.bgMagenta.white.bold);
});
