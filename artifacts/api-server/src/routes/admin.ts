import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { activities } from "./activity.js";
import { foodLogs } from "./foodStore.js";

const router = Router();

const JWT_SECRET = process.env["SESSION_SECRET"] || "fitness-admin-secret-key-2024";

// Admin auth middleware
function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    res.status(401).json({ error: "No token provided" });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { role: string };
    if (decoded.role !== "admin") {
      res.status(401).json({ error: "Not authorized" });
      return;
    }
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

// POST /api/admin/login
router.post("/login", (req: Request, res: Response) => {
  const { username, password } = req.body as { username?: string; password?: string };

  const adminUsername = process.env["ADMIN_USERNAME"] || "admin";
  const adminPassword = process.env["ADMIN_PASSWORD"] || "password";

  if (username !== adminUsername || password !== adminPassword) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const token = jwt.sign({ role: "admin", username }, JWT_SECRET, { expiresIn: "24h" });

  res.json({ token, message: "Login successful" });
});

// GET /api/admin/dashboard
router.get("/dashboard", requireAdmin, (_req: Request, res: Response) => {
  const totalSteps = activities.reduce((sum, a) => sum + a.steps, 0);
  const totalCaloriesBurned = activities.reduce((sum, a) => sum + a.caloriesBurned, 0);
  const totalCaloriesConsumed = foodLogs.reduce((sum, f) => sum + f.calories, 0);

  res.json({
    totalActivities: activities.length,
    totalFoodLogs: foodLogs.length,
    totalSteps,
    totalCaloriesBurned,
    totalCaloriesConsumed,
    recentActivities: [...activities]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10),
    recentFoodLogs: [...foodLogs]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10),
  });
});

// GET /api/admin/food-logs
router.get("/food-logs", requireAdmin, (_req: Request, res: Response) => {
  const sorted = [...foodLogs].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
  res.json(sorted);
});

// DELETE /api/admin/food-logs/:id
router.delete("/food-logs/:id", requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const idx = foodLogs.findIndex((f) => f.id === id);
  if (idx === -1) {
    res.status(404).json({ error: "Food log not found" });
    return;
  }
  foodLogs.splice(idx, 1);
  res.json({ success: true, message: "Food log deleted" });
});

// GET /api/admin/activities
router.get("/activities", requireAdmin, (_req: Request, res: Response) => {
  const sorted = [...activities].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
  res.json(sorted);
});

// DELETE /api/admin/activities/:id
router.delete("/activities/:id", requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const idx = activities.findIndex((a) => a.id === id);
  if (idx === -1) {
    res.status(404).json({ error: "Activity not found" });
    return;
  }
  activities.splice(idx, 1);
  res.json({ success: true, message: "Activity deleted" });
});

export default router;
