import { Router } from "express";
import type { Request, Response } from "express";
import { activities } from "./activity.js";
import { getFoodLogsByDate, getFoodLogsByDateRange } from "./foodStore.js";

const router = Router();

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getDateStr(d: Date): string {
  return d.toISOString().split("T")[0]!;
}

// GET /api/analytics/weekly
router.get("/weekly", (_req: Request, res: Response) => {
  const now = new Date();
  const days = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const dateStr = getDateStr(d);

    const dayActivities = activities.filter((a) => a.date === dateStr);
    const dayFoodLogs = getFoodLogsByDate(dateStr);

    const steps = dayActivities.reduce((sum, a) => sum + a.steps, 0);
    const caloriesBurned = dayActivities.reduce((sum, a) => sum + a.caloriesBurned, 0);
    const caloriesConsumed = dayFoodLogs.reduce((sum: number, f: { calories: number }) => sum + f.calories, 0);

    days.push({
      date: dateStr,
      day: DAY_NAMES[d.getDay()]!,
      steps,
      caloriesBurned,
      caloriesConsumed,
    });
  }

  const totalSteps = days.reduce((s, d) => s + d.steps, 0);
  const activeDays = days.filter((d) => d.steps > 0).length || 1;
  const averageSteps = Math.round(totalSteps / activeDays);
  const averageCaloriesBurned = Math.round(
    days.reduce((s, d) => s + d.caloriesBurned, 0) / activeDays,
  );

  const bestDay = days.reduce((best, d) => (d.steps > (best?.steps ?? 0) ? d : best), days[0]);

  res.json({
    days,
    averageSteps,
    averageCaloriesBurned,
    totalSteps,
    bestDay: bestDay?.day ?? null,
  });
});

// GET /api/analytics/streak
router.get("/streak", (_req: Request, res: Response) => {
  if (activities.length === 0) {
    res.json({ currentStreak: 0, longestStreak: 0, streakDates: [] });
    return;
  }

  // Get unique dates with activity, sorted descending
  const uniqueDates = [...new Set(activities.map((a) => a.date))].sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime(),
  );

  const today = getDateStr(new Date());
  const yesterday = getDateStr(new Date(Date.now() - 86400000));

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  let prevDate: string | null = null;

  // Calculate streaks from sorted dates
  const sortedAsc = [...uniqueDates].reverse();
  for (const dateStr of sortedAsc) {
    if (!prevDate) {
      tempStreak = 1;
    } else {
      const diff =
        (new Date(dateStr).getTime() - new Date(prevDate).getTime()) / 86400000;
      if (diff === 1) {
        tempStreak++;
      } else {
        tempStreak = 1;
      }
    }
    if (tempStreak > longestStreak) longestStreak = tempStreak;
    prevDate = dateStr;
  }

  // Current streak: must include today or yesterday
  if (uniqueDates[0] === today || uniqueDates[0] === yesterday) {
    let streak = 1;
    for (let i = 1; i < uniqueDates.length; i++) {
      const diff =
        (new Date(uniqueDates[i - 1]!).getTime() - new Date(uniqueDates[i]!).getTime()) / 86400000;
      if (diff === 1) {
        streak++;
      } else {
        break;
      }
    }
    currentStreak = streak;
  }

  res.json({
    currentStreak,
    longestStreak,
    lastActiveDate: uniqueDates[0] ?? null,
    streakDates: uniqueDates.slice(0, 30),
  });
});

export default router;
