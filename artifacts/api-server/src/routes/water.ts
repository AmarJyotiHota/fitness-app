import { Router } from "express";
import type { Request, Response } from "express";
import { requireAuthMiddleware } from "../middleware/auth.js";
import { db } from "@workspace/db";
import { waterLogs } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";

const router = Router();

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
router.post("/log", requireAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const { amount } = req.body as { amount?: number };
    if (!amount || typeof amount !== "number" || amount <= 0) {
      res.status(400).json({ error: "amount must be a positive number (ml)" });
      return;
    }
    const [log] = await db.insert(waterLogs).values({
      id: generateId(),
      userId,
      amount,
      date: getDateStr(),
      time: getTimeStr(),
    }).returning();
    
    res.status(201).json(log);
  } catch (error) {
    res.status(500).json({ error: "Failed to log water" });
  }
});

// GET /api/water/today
router.get("/today", requireAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const today = getDateStr();
    const todayLogs = await db.select().from(waterLogs).where(eq(waterLogs.userId, userId)).orderBy(desc(waterLogs.time));
    
    // Filter for today
    const filteredLogs = todayLogs.filter(w => w.date === today);
    const totalMl = filteredLogs.reduce((sum, w) => sum + w.amount, 0);
    
    res.json({
      totalMl,
      goalMl: DAILY_GOAL_ML,
      logs: filteredLogs,
      percentage: Math.min(Math.round((totalMl / DAILY_GOAL_ML) * 100), 100),
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to get water logs" });
  }
});

export default router;
