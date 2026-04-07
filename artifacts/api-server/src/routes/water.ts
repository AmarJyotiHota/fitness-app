import { Router } from "express";
import type { Request, Response } from "express";

const router = Router();

interface WaterLog {
  id: string;
  amount: number;
  date: string;
  time: string;
}

const waterLogs: WaterLog[] = [];
const DAILY_GOAL_ML = 2500;

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substring(2, 9);
}

function getDateStr(): string {
  return new Date().toISOString().split("T")[0]!;
}

function getTimeStr(): string {
  return new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

// POST /api/water/log
router.post("/log", (req: Request, res: Response) => {
  const { amount } = req.body as { amount?: number };
  if (!amount || typeof amount !== "number" || amount <= 0) {
    res.status(400).json({ error: "amount must be a positive number (ml)" });
    return;
  }
  const log: WaterLog = {
    id: generateId(),
    amount,
    date: getDateStr(),
    time: getTimeStr(),
  };
  waterLogs.push(log);
  res.status(201).json(log);
});

// GET /api/water/today
router.get("/today", (_req: Request, res: Response) => {
  const today = getDateStr();
  const todayLogs = waterLogs.filter((w) => w.date === today);
  const totalMl = todayLogs.reduce((sum, w) => sum + w.amount, 0);
  res.json({
    totalMl,
    goalMl: DAILY_GOAL_ML,
    logs: todayLogs,
    percentage: Math.min(Math.round((totalMl / DAILY_GOAL_ML) * 100), 100),
  });
});

export default router;
