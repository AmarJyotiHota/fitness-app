import { Router } from "express";
import type { Request, Response } from "express";
import { db } from "@workspace/db";
import { activities, goals, foodLogs } from "@workspace/db/schema";
import { eq, desc, and, gte } from "drizzle-orm";
import { requireAuthMiddleware } from "../middleware/auth.js";

const router = Router();

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substring(2, 9);
}

function getDateStr(d?: Date): string {
  const date = d ?? new Date();
  return date.toISOString().split("T")[0]!;
}

// POST /api/activity
router.post("/", requireAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const { steps, caloriesBurned, date, note } = req.body;

    if (typeof steps !== "number" || typeof caloriesBurned !== "number") {
      res.status(400).json({ error: "steps and caloriesBurned are required numbers" });
      return;
    }

    const [activity] = await db.insert(activities).values({
      id: generateId(),
      userId,
      steps,
      caloriesBurned,
      date: date ?? getDateStr(),
      note,
    }).returning();

    res.status(201).json(activity);
  } catch (error) {
    res.status(500).json({ error: "Failed to create activity" });
  }
});

// GET /api/activity
router.get("/", requireAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const { period } = req.query as { period?: string };
    const now = new Date();

    let query = db.select().from(activities).where(eq(activities.userId, userId));

    if (period === "day") {
      query = db.select().from(activities).where(and(eq(activities.userId, userId), eq(activities.date, getDateStr(now))));
    } else if (period === "week") {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      query = db.select().from(activities).where(and(eq(activities.userId, userId), gte(activities.date, getDateStr(weekAgo))));
    } else if (period === "month") {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      query = db.select().from(activities).where(and(eq(activities.userId, userId), gte(activities.date, getDateStr(monthAgo))));
    }

    const results = await query.orderBy(desc(activities.date));
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch activities" });
  }
});

// GET /api/activity/summary
router.get("/summary", requireAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const today = getDateStr(now);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const userActivities = await db.select().from(activities).where(eq(activities.userId, userId));
    const userFoodLogs = await db.select().from(foodLogs).where(eq(foodLogs.userId, userId));

    const todayActivities = userActivities.filter((a) => a.date === today);
    const weekActivities = userActivities.filter((a) => a.date >= getDateStr(weekAgo));
    const monthActivities = userActivities.filter((a) => a.date >= getDateStr(monthAgo));

    const todayFoodLogs = userFoodLogs.filter((f) => f.date === today);
    const weekFoodLogs = userFoodLogs.filter((f) => f.date >= getDateStr(weekAgo));

    const todayCaloriesConsumed = todayFoodLogs.reduce((sum, f) => sum + f.calories, 0);
    const weeklyCaloriesConsumed = weekFoodLogs.reduce((sum, f) => sum + f.calories, 0);

    res.json({
      todaySteps: todayActivities.reduce((sum, a) => sum + a.steps, 0),
      todayCaloriesBurned: todayActivities.reduce((sum, a) => sum + a.caloriesBurned, 0),
      todayCaloriesConsumed,
      weeklySteps: weekActivities.reduce((sum, a) => sum + a.steps, 0),
      weeklyCaloriesBurned: weekActivities.reduce((sum, a) => sum + a.caloriesBurned, 0),
      weeklyCaloriesConsumed,
      monthlySteps: monthActivities.reduce((sum, a) => sum + a.steps, 0),
      recentActivities: userActivities
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10),
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch summary" });
  }
});

// GET /api/activity/goals
router.get("/goals", requireAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    let [userGoals] = await db.select().from(goals).where(eq(goals.userId, userId));
    
    if (!userGoals) {
      [userGoals] = await db.insert(goals).values({ userId }).returning();
    }
    
    res.json(userGoals);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch goals" });
  }
});

// PUT /api/activity/goals
router.put("/goals", requireAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const { dailySteps, dailyCaloriesBurned, dailyCaloriesConsumed } = req.body;
    
    const [userGoals] = await db.insert(goals)
      .values({ userId, dailySteps, dailyCaloriesBurned, dailyCaloriesConsumed })
      .onConflictDoUpdate({
        target: goals.userId,
        set: { dailySteps, dailyCaloriesBurned, dailyCaloriesConsumed }
      })
      .returning();

    res.json(userGoals);
  } catch (error) {
    res.status(500).json({ error: "Failed to update goals" });
  }
});

export default router;
