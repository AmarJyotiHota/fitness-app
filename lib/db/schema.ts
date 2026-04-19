import { pgTable, text, serial, timestamp, boolean, index, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

export const users = pgTable("users", {
  id: text("id").primaryKey(), // Using Supabase user.id
  email: text("email").unique().notNull(),
  name: text("name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const posts = pgTable(
  "posts",
  {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    content: text("content"),
    authorId: text("author_id")
      .references(() => users.id)
      .notNull(),
    published: boolean("published").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => {
    return {
      authorIdIdx: index("author_id_idx").on(table.authorId),
    };
  }
);

export const activities = pgTable("activities", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id).notNull(),
  steps: integer("steps").notNull(),
  caloriesBurned: integer("calories_burned").notNull(),
  date: text("date").notNull(), // YYYY-MM-DD
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const foodLogs = pgTable("food_logs", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id).notNull(),
  foodName: text("food_name").notNull(),
  calories: integer("calories").notNull(),
  imageBase64: text("image_base64"),
  protein: integer("protein"),
  carbs: integer("carbs"),
  fat: integer("fat"),
  mealType: text("meal_type"), // breakfast, lunch, dinner, snack
  date: text("date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const waterLogs = pgTable("water_logs", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id).notNull(),
  amount: integer("amount").notNull(), // ml
  date: text("date").notNull(),
  time: text("time").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const goals = pgTable("goals", {
  userId: text("user_id").primaryKey().references(() => users.id),
  dailySteps: integer("daily_steps").default(10000).notNull(),
  dailyCaloriesBurned: integer("daily_calories_burned").default(500).notNull(),
  dailyCaloriesConsumed: integer("daily_calories_consumed").default(2000).notNull(),
});

// Zod schemas for easy validation
export const insertUserSchema = createInsertSchema(users);
export const insertPostSchema = createInsertSchema(posts);

// Types
export type User = typeof users.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type Activity = typeof activities.$inferSelect;
export type FoodLog = typeof foodLogs.$inferSelect;
export type WaterLog = typeof waterLogs.$inferSelect;
export type Goal = typeof goals.$inferSelect;
