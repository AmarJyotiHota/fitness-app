import { Router } from "express";
import type { Request, Response } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = Router();

function getGenAI() {
  const apiKey = process.env["GEMINI_API_KEY"];
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured");
  return new GoogleGenerativeAI(apiKey);
}

// POST /api/ai/meal-suggestions
router.post("/meal-suggestions", async (req: Request, res: Response) => {
  const { remainingCalories, mealType, dietaryPreferences } = req.body as {
    remainingCalories: number;
    mealType?: string;
    dietaryPreferences?: string;
  };

  try {
    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `You are a nutrition expert. Suggest 3 healthy meal options for someone with ${remainingCalories} remaining calories today.
${mealType ? `Meal type: ${mealType}` : ""}
${dietaryPreferences ? `Dietary preferences: ${dietaryPreferences}` : ""}

Return ONLY a valid JSON object in this exact format:
{
  "suggestions": [
    {
      "name": "Meal name",
      "calories": 350,
      "protein": 25,
      "carbs": 40,
      "fat": 8,
      "description": "Brief appetizing description",
      "prepTime": "15 min"
    }
  ],
  "tip": "A helpful nutrition tip"
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");
    const parsed = JSON.parse(jsonMatch[0]) as { suggestions: object[]; tip: string };
    res.json(parsed);
  } catch (err) {
    req.log.error({ err }, "Meal suggestions failed");
    res.status(500).json({ error: "Failed to generate meal suggestions" });
  }
});

// POST /api/ai/workout-recommendations
router.post("/workout-recommendations", async (req: Request, res: Response) => {
  const { todaySteps, weeklySteps, caloriesBurned, fitnessLevel } = req.body as {
    todaySteps: number;
    weeklySteps?: number;
    caloriesBurned?: number;
    fitnessLevel?: string;
  };

  try {
    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `You are a personal fitness trainer. Recommend 3 workouts for someone with these stats:
- Today's steps: ${todaySteps}
- Weekly steps: ${weeklySteps ?? 0}
- Calories burned today: ${caloriesBurned ?? 0}
- Fitness level: ${fitnessLevel ?? "intermediate"}

Return ONLY a valid JSON object in this exact format:
{
  "recommendations": [
    {
      "name": "Workout name",
      "duration": "20 min",
      "calories": 200,
      "intensity": "moderate",
      "description": "Brief description",
      "steps": ["Step 1", "Step 2", "Step 3"]
    }
  ],
  "motivationalMessage": "Short motivational message"
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");
    const parsed = JSON.parse(jsonMatch[0]) as { recommendations: object[]; motivationalMessage: string };
    res.json(parsed);
  } catch (err) {
    req.log.error({ err }, "Workout recommendations failed");
    res.status(500).json({ error: "Failed to generate workout recommendations" });
  }
});

export default router;
