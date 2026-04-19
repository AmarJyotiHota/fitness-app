import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { db } from "@workspace/db";
import { activities, foodLogs } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";

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
router.get("/dashboard", requireAdmin, async (_req: Request, res: Response) => {
  try {
    const allActivities = await db.select().from(activities).orderBy(desc(activities.date));
    const allFoodLogs = await db.select().from(foodLogs).orderBy(desc(foodLogs.date));

    const totalSteps = allActivities.reduce((sum, a) => sum + a.steps, 0);
    const totalCaloriesBurned = allActivities.reduce((sum, a) => sum + a.caloriesBurned, 0);
    const totalCaloriesConsumed = allFoodLogs.reduce((sum, f) => sum + f.calories, 0);

    res.json({
      totalActivities: allActivities.length,
      totalFoodLogs: allFoodLogs.length,
      totalSteps,
      totalCaloriesBurned,
      totalCaloriesConsumed,
      recentActivities: allActivities.slice(0, 10),
      recentFoodLogs: allFoodLogs.slice(0, 10),
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to load dashboard" });
  }
});

// GET /api/admin/food-logs
router.get("/food-logs", requireAdmin, async (_req: Request, res: Response) => {
  try {
    const logs = await db.select().from(foodLogs).orderBy(desc(foodLogs.date));
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: "Failed to load food logs" });
  }
});

// DELETE /api/admin/food-logs/:id
router.delete("/food-logs/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await db.delete(foodLogs).where(eq(foodLogs.id, id));
    res.json({ success: true, message: "Food log deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete food log" });
  }
});

// GET /api/admin/activities
router.get("/activities", requireAdmin, async (_req: Request, res: Response) => {
  try {
    const allActivities = await db.select().from(activities).orderBy(desc(activities.date));
    res.json(allActivities);
  } catch (error) {
    res.status(500).json({ error: "Failed to load activities" });
  }
});

// DELETE /api/admin/activities/:id
router.delete("/activities/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await db.delete(activities).where(eq(activities.id, id));
    res.json({ success: true, message: "Activity deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete activity" });
  }
});

export default router;
