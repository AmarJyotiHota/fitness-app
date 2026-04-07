import { Router } from "express";
import type { Request, Response } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { foodLogs, type FoodLog } from "./foodStore.js";

const router = Router();

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substring(2, 9);
}

function getDateStr(): string {
  return new Date().toISOString().split("T")[0]!;
}

// POST /api/food/analyze
router.post("/analyze", async (req: Request, res: Response) => {
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

    // Strip data URL prefix if present
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

    // Extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }

    const parsed = JSON.parse(jsonMatch[0]) as {
      foodName: string;
      calories: number;
      confidence: string;
      protein?: number;
      carbs?: number;
      fat?: number;
      servingSize?: string;
    };

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
router.post("/log", (req: Request, res: Response) => {
  const { foodName, calories, imageBase64, protein, carbs, fat, mealType } = req.body as {
    foodName: string;
    calories: number;
    imageBase64?: string;
    protein?: number;
    carbs?: number;
    fat?: number;
    mealType?: string;
  };

  if (!foodName || typeof calories !== "number") {
    res.status(400).json({ error: "foodName and calories are required" });
    return;
  }

  const log: FoodLog = {
    id: generateId(),
    foodName,
    calories,
    imageBase64,
    protein,
    carbs,
    fat,
    mealType,
    date: getDateStr(),
  };

  foodLogs.push(log);
  res.status(201).json(log);
});

// GET /api/food/log
router.get("/log", (_req: Request, res: Response) => {
  const sorted = [...foodLogs].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
  res.json(sorted);
});

export default router;
