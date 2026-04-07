import { Router } from "express";
import type { Request, Response } from "express";

const router = Router();

interface Activity {
  id: string;
  steps: number;
  caloriesBurned: number;
  date: string;
  note?: string;
}

// In-memory store (persists for server lifetime)
export const activities: Activity[] = [];

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substring(2, 9);
}

function getDateStr(d?: Date): string {
  const date = d ?? new Date();
  return date.toISOString().split("T")[0]!;
}

// POST /api/activity
router.post("/", (req: Request, res: Response) => {
  const { steps, caloriesBurned, date, note } = req.body as {
    steps: number;
    caloriesBurned: number;
    date?: string;
    note?: string;
  };

  if (typeof steps !== "number" || typeof caloriesBurned !== "number") {
    res.status(400).json({ error: "steps and caloriesBurned are required numbers" });
    return;
  }

  const activity: Activity = {
    id: generateId(),
    steps,
    caloriesBurned,
    date: date ?? getDateStr(),
    note,
  };

  activities.push(activity);
  res.status(201).json(activity);
});

// GET /api/activity
router.get("/", (req: Request, res: Response) => {
  const { period } = req.query as { period?: string };
  const now = new Date();

  let filtered = [...activities];

  if (period === "day") {
    const today = getDateStr(now);
    filtered = filtered.filter((a) => a.date === today);
  } else if (period === "week") {
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    filtered = filtered.filter((a) => new Date(a.date) >= weekAgo);
  } else if (period === "month") {
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    filtered = filtered.filter((a) => new Date(a.date) >= monthAgo);
  }

  res.json(filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
});

// GET /api/activity/summary
router.get("/summary", (req: Request, res: Response) => {
  const now = new Date();
  const today = getDateStr(now);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const todayActivities = activities.filter((a) => a.date === today);
  const weekActivities = activities.filter((a) => new Date(a.date) >= weekAgo);
  const monthActivities = activities.filter((a) => new Date(a.date) >= monthAgo);

  // Import food logs from food module for calorie totals
  const { getFoodLogsByDate, getFoodLogsByDateRange } = require("./foodStore");
  const todayFoodLogs = getFoodLogsByDate(today);
  const weekFoodLogs = getFoodLogsByDateRange(weekAgo);

  const todayCaloriesConsumed = todayFoodLogs.reduce(
    (sum: number, f: { calories: number }) => sum + f.calories,
    0,
  );
  const weeklyCaloriesConsumed = weekFoodLogs.reduce(
    (sum: number, f: { calories: number }) => sum + f.calories,
    0,
  );

  res.json({
    todaySteps: todayActivities.reduce((sum, a) => sum + a.steps, 0),
    todayCaloriesBurned: todayActivities.reduce((sum, a) => sum + a.caloriesBurned, 0),
    todayCaloriesConsumed,
    weeklySteps: weekActivities.reduce((sum, a) => sum + a.steps, 0),
    weeklyCaloriesBurned: weekActivities.reduce((sum, a) => sum + a.caloriesBurned, 0),
    weeklyCaloriesConsumed,
    monthlySteps: monthActivities.reduce((sum, a) => sum + a.steps, 0),
    recentActivities: activities
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10),
  });
});

// GET /api/activity/goals
const defaultGoals = { dailySteps: 10000, dailyCaloriesBurned: 500, dailyCaloriesConsumed: 2000 };
let goals = { ...defaultGoals };

router.get("/goals", (_req: Request, res: Response) => {
  res.json(goals);
});

// PUT /api/activity/goals
router.put("/goals", (req: Request, res: Response) => {
  const { dailySteps, dailyCaloriesBurned, dailyCaloriesConsumed } = req.body as typeof goals;
  goals = { dailySteps, dailyCaloriesBurned, dailyCaloriesConsumed };
  res.json(goals);
});

export default router;
