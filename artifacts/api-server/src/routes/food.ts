import { Router } from "express";
import type { Request, Response } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { requireAuthMiddleware } from "../middleware/auth.js";
import { db } from "@workspace/db";
import { foodLogs } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";

const router = Router();

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substring(2, 9);
}

function getDateStr(): string {
  return new Date().toISOString().split("T")[0]!;
}

// POST /api/food/analyze
router.post("/analyze", requireAuthMiddleware, async (req: Request, res: Response) => {
  const { imageBase64 } = req.body as { imageBase64?: string };

  if (!imageBase64) {
    res.status(400).json({ error: "imageBase64 is required" });
    return;
  }

  const apiKey = process.env["GEMINI_API_KEY"];
  if (!apiKey) {
    res.status(500).json({ error: "GEMINI_API_KEY not configured" });
    return;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const result = await model.generateContent([
      {
        inlineData: {
          data: base64Data,
          mimeType: "image/jpeg",
        },
      },
      `Analyze this food image and return ONLY a valid JSON object with these exact fields:
{
  "foodName": "name of the food",
  "calories": estimated_calories_as_number,
  "confidence": "high" or "medium" or "low",
  "protein": grams_as_number,
  "carbs": grams_as_number,
  "fat": grams_as_number,
  "servingSize": "e.g. 1 cup, 100g, 1 slice"
}
Do not include any text before or after the JSON. Only return the raw JSON object.`,
    ]);

    const text = result.response.text().trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }

    const parsed = JSON.parse(jsonMatch[0]);

    res.json({
      foodName: parsed.foodName || "Unknown food",
      calories: Number(parsed.calories) || 0,
      confidence: parsed.confidence || "low",
      protein: Number(parsed.protein) || undefined,
      carbs: Number(parsed.carbs) || undefined,
      fat: Number(parsed.fat) || undefined,
      servingSize: parsed.servingSize || undefined,
    });
  } catch (err) {
    req.log.error({ err }, "Gemini analysis failed");
    res.status(500).json({ error: "Failed to analyze food image" });
  }
});

// POST /api/food/log
router.post("/log", requireAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const { foodName, calories, imageBase64, protein, carbs, fat, mealType } = req.body;

    if (!foodName || typeof calories !== "number") {
      res.status(400).json({ error: "foodName and calories are required" });
      return;
    }

    const [log] = await db.insert(foodLogs).values({
      id: generateId(),
      userId,
      foodName,
      calories,
      imageBase64,
      protein,
      carbs,
      fat,
      mealType,
      date: getDateStr(),
    }).returning();

    res.status(201).json(log);
  } catch (error) {
    res.status(500).json({ error: "Failed to log food" });
  }
});

// GET /api/food/log
router.get("/log", requireAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const logs = await db.select().from(foodLogs).where(eq(foodLogs.userId, userId)).orderBy(desc(foodLogs.date));
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch food logs" });
  }
});

export default router;
