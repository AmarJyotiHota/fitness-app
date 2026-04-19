import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { pinoHttp } from "pino-http";
import { logger } from "./lib/logger.js";
import 'dotenv/config'; // Load .env file

import postsRouter from "./routes/posts.js";
import usersRouter from "./routes/users.js";
import activityRouter from "./routes/activity.js";
import foodRouter from "./routes/food.js";
import waterRouter from "./routes/water.js";
import analyticsRouter from "./routes/analytics.js";
import aiRouter from "./routes/ai.js";
import adminRouter from "./routes/admin.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());
app.use(pinoHttp({ logger }));

// Routes
app.use("/api/posts", postsRouter);
app.use("/api/users", usersRouter);
app.use("/api/activity", activityRouter);
app.use("/api/food", foodRouter);
app.use("/api/water", waterRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/ai", aiRouter);
app.use("/api/admin", adminRouter);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error(err);
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
  });
});

export default app;
