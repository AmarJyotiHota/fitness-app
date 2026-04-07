interface FoodLog {
  id: string;
  foodName: string;
  calories: number;
  imageBase64?: string;
  protein?: number;
  carbs?: number;
  fat?: number;
  mealType?: string;
  date: string;
}

const foodLogs: FoodLog[] = [];

export function getFoodLogsByDate(date: string): FoodLog[] {
  return foodLogs.filter((f) => f.date === date);
}

export function getFoodLogsByDateRange(from: Date): FoodLog[] {
  return foodLogs.filter((f) => new Date(f.date) >= from);
}

export { foodLogs };
export type { FoodLog };
