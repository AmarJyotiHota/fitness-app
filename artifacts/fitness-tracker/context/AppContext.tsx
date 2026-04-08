import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Goals {
  dailySteps: number;
  dailyCaloriesBurned: number;
  dailyCaloriesConsumed: number;
}

interface UserProfile {
  name: string;
  weightKg: number;
  heightCm: number;
  fitnessLevel: "beginner" | "intermediate" | "advanced";
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: string;
}

interface GamificationState {
  xp: number;
  level: number;
  badges: Badge[];
  muscleXP: Record<string, number>;
}

export type SubscriptionTier = "free" | "pro" | "elite";

interface SubscriptionState {
  tier: SubscriptionTier;
  purchasedAt?: string;
  expiresAt?: string;
  plan?: "monthly" | "yearly";
}

interface AppContextType {
  goals: Goals;
  setGoals: (goals: Goals) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  profile: UserProfile;
  setProfile: (p: UserProfile) => void;
  gamification: GamificationState;
  addXP: (amount: number, muscleGroups?: string[]) => void;
  checkBadges: (steps: number, streak: number) => void;
  subscription: SubscriptionState;
  subscribe: (tier: SubscriptionTier, plan: "monthly" | "yearly") => void;
  cancelSubscription: () => void;
  isPro: boolean;
  isElite: boolean;
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const defaultGoals: Goals = { dailySteps: 10000, dailyCaloriesBurned: 500, dailyCaloriesConsumed: 2000 };
const defaultProfile: UserProfile = { name: "", weightKg: 70, heightCm: 170, fitnessLevel: "intermediate" };
const defaultGamification: GamificationState = {
  xp: 0,
  level: 1,
  badges: [],
  muscleXP: {},
};
const defaultSubscription: SubscriptionState = { tier: "free" };

// ─── XP / Rank Config ─────────────────────────────────────────────────────────

export const XP_PER_LEVEL = 500;

export const RANKS = [
  { name: "Bronze",   minXP: 0,     color: "#cd7f32", emoji: "🥉" },
  { name: "Silver",   minXP: 200,   color: "#94a3b8", emoji: "🥈" },
  { name: "Gold",     minXP: 500,   color: "#f59e0b", emoji: "🥇" },
  { name: "Platinum", minXP: 1000,  color: "#67e8f9", emoji: "💎" },
  { name: "Diamond",  minXP: 2000,  color: "#a78bfa", emoji: "💠" },
  { name: "Mythic",   minXP: 4000,  color: "#f472b6", emoji: "⚡" },
];

export const MUSCLE_GROUPS = [
  { id: "chest",     label: "Chest",     emoji: "💪", color: "#ef4444" },
  { id: "back",      label: "Back",      emoji: "🔙", color: "#3b82f6" },
  { id: "legs",      label: "Legs",      emoji: "🦵", color: "#22c55e" },
  { id: "arms",      label: "Arms",      emoji: "💪", color: "#f97316" },
  { id: "shoulders", label: "Shoulders", emoji: "🏋️", color: "#a855f7" },
  { id: "core",      label: "Core",      emoji: "🔥", color: "#f59e0b" },
  { id: "cardio",    label: "Cardio",    emoji: "🏃", color: "#06b6d4" },
];

export function getRank(xp: number) {
  let rank = RANKS[0]!;
  for (const r of RANKS) {
    if (xp >= r.minXP) rank = r;
    else break;
  }
  return rank;
}

export function getNextRank(xp: number) {
  const idx = RANKS.findIndex((r) => r === getRank(xp));
  return RANKS[idx + 1] ?? null;
}

export function getRankProgress(xp: number): number {
  const current = getRank(xp);
  const next = getNextRank(xp);
  if (!next) return 1;
  return Math.min((xp - current.minXP) / (next.minXP - current.minXP), 1);
}

export function getMuscleRank(xp: number) {
  return getRank(Math.floor(xp / 3));
}

// ─── Subscription Plans ───────────────────────────────────────────────────────

export const SUBSCRIPTION_PLANS = {
  pro: {
    monthly: { price: "$9.99", label: "Pro Monthly", period: "/ month" },
    yearly: { price: "$59.99", label: "Pro Yearly", period: "/ year", savings: "Save 50%" },
  },
  elite: {
    monthly: { price: "$19.99", label: "Elite Monthly", period: "/ month" },
    yearly: { price: "$99.99", label: "Elite Yearly", period: "/ year", savings: "Save 58%" },
  },
};

export const PLAN_FEATURES = {
  free: [
    "Basic activity logging",
    "Step & calorie tracking",
    "Daily goals",
    "3 AI calls per day",
  ],
  pro: [
    "Everything in Free",
    "Unlimited AI meal suggestions",
    "Unlimited workout recommendations",
    "Advanced weekly analytics",
    "Muscle group rank tracking",
    "Streak bonuses (+25% XP)",
    "Exclusive Pro badges",
  ],
  elite: [
    "Everything in Pro",
    "Priority AI responses",
    "Custom goal templates",
    "Elite-only rank rewards",
    "Monthly performance report",
    "Early access to new features",
    "Elite badge & profile glow",
  ],
};

// ─── Badges ───────────────────────────────────────────────────────────────────

export const ALL_BADGES = [
  { id: "first_steps",   name: "First Steps",    description: "Log your first activity",    icon: "award" },
  { id: "steps_5k",      name: "5K Warrior",      description: "5,000 steps in a day",       icon: "trending-up" },
  { id: "steps_10k",     name: "10K Legend",      description: "10,000 steps in a day",      icon: "zap" },
  { id: "streak_3",      name: "On Fire",         description: "3-day streak",               icon: "activity" },
  { id: "streak_7",      name: "Week Warrior",    description: "7-day streak",               icon: "award" },
  { id: "silver_rank",   name: "Silver Ranked",   description: "Reached Silver rank",        icon: "shield" },
  { id: "gold_rank",     name: "Gold Ranked",     description: "Reached Gold rank",          icon: "star" },
  { id: "diamond_rank",  name: "Diamond Ranked",  description: "Reached Diamond rank",       icon: "diamond" },
  { id: "pro_member",    name: "Pro Member",      description: "Subscribed to Pro",          icon: "award" },
  { id: "elite_member",  name: "Elite Member",    description: "Subscribed to Elite",        icon: "zap" },
  { id: "muscle_all",    name: "All-Rounder",     description: "Trained all 7 muscle groups",icon: "trending-up" },
];

// ─── Context ──────────────────────────────────────────────────────────────────

export const AppContext = createContext<AppContextType>({
  goals: defaultGoals,
  setGoals: () => {},
  darkMode: true,
  toggleDarkMode: () => {},
  profile: defaultProfile,
  setProfile: () => {},
  gamification: defaultGamification,
  addXP: () => {},
  checkBadges: () => {},
  subscription: defaultSubscription,
  subscribe: () => {},
  cancelSubscription: () => {},
  isPro: false,
  isElite: false,
});

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [goals, setGoalsState] = useState<Goals>(defaultGoals);
  const [darkMode, setDarkMode] = useState(true);
  const [profile, setProfileState] = useState<UserProfile>(defaultProfile);
  const [gamification, setGamification] = useState<GamificationState>(defaultGamification);
  const [subscription, setSubscription] = useState<SubscriptionState>(defaultSubscription);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.multiGet(["goals", "darkMode", "profile", "gamification", "subscription"]).then((pairs) => {
      pairs.forEach(([key, val]) => {
        if (!val) return;
        if (key === "goals") setGoalsState(JSON.parse(val) as Goals);
        if (key === "darkMode") setDarkMode(val === "true");
        if (key === "profile") setProfileState(JSON.parse(val) as UserProfile);
        if (key === "gamification") setGamification(JSON.parse(val) as GamificationState);
        if (key === "subscription") setSubscription(JSON.parse(val) as SubscriptionState);
      });
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (loaded) AsyncStorage.setItem("darkMode", String(darkMode));
  }, [darkMode, loaded]);

  const setGoals = (g: Goals) => {
    setGoalsState(g);
    AsyncStorage.setItem("goals", JSON.stringify(g));
  };

  const toggleDarkMode = () => setDarkMode((p) => !p);

  const setProfile = (p: UserProfile) => {
    setProfileState(p);
    AsyncStorage.setItem("profile", JSON.stringify(p));
  };

  const addXP = (amount: number, muscleGroups?: string[]) => {
    setGamification((prev) => {
      const tier = subscription.tier;
      const bonus = tier === "elite" ? 1.5 : tier === "pro" ? 1.25 : 1;
      const earned = Math.round(amount * bonus);
      const newXP = prev.xp + earned;
      const newLevel = Math.floor(newXP / XP_PER_LEVEL) + 1;

      const newMuscleXP = { ...prev.muscleXP };
      if (muscleGroups && muscleGroups.length > 0) {
        const perMuscle = Math.round(earned / muscleGroups.length);
        muscleGroups.forEach((mg) => {
          newMuscleXP[mg] = (newMuscleXP[mg] ?? 0) + perMuscle;
        });
      }

      const next: GamificationState = { ...prev, xp: newXP, level: newLevel, muscleXP: newMuscleXP };
      AsyncStorage.setItem("gamification", JSON.stringify(next));
      return next;
    });
  };

  const checkBadges = (steps: number, streak: number) => {
    setGamification((prev) => {
      const existingIds = new Set(prev.badges.map((b) => b.id));
      const newBadges = [...prev.badges];
      let xpBonus = 0;
      const tier = subscription.tier;

      const mint = (id: string, cond: boolean) => {
        if (cond && !existingIds.has(id)) {
          const t = ALL_BADGES.find((b) => b.id === id);
          if (t) { newBadges.push({ ...t, unlockedAt: new Date().toISOString() }); existingIds.add(id); xpBonus += 150; }
        }
      };

      mint("first_steps",  steps > 0);
      mint("steps_5k",     steps >= 5000);
      mint("steps_10k",    steps >= 10000);
      mint("streak_3",     streak >= 3);
      mint("streak_7",     streak >= 7);
      mint("silver_rank",  prev.xp >= 200);
      mint("gold_rank",    prev.xp >= 500);
      mint("diamond_rank", prev.xp >= 2000);
      mint("pro_member",   tier === "pro" || tier === "elite");
      mint("elite_member", tier === "elite");
      const allMusclesTrained = MUSCLE_GROUPS.every((mg) => (prev.muscleXP[mg.id] ?? 0) > 0);
      mint("muscle_all",   allMusclesTrained);

      const newXP = prev.xp + xpBonus;
      const next: GamificationState = {
        xp: newXP,
        level: Math.floor(newXP / XP_PER_LEVEL) + 1,
        badges: newBadges,
        muscleXP: prev.muscleXP,
      };
      AsyncStorage.setItem("gamification", JSON.stringify(next));
      return next;
    });
  };

  const subscribe = (tier: SubscriptionTier, plan: "monthly" | "yearly") => {
    const now = new Date();
    const expires = new Date(now);
    if (plan === "monthly") expires.setMonth(expires.getMonth() + 1);
    else expires.setFullYear(expires.getFullYear() + 1);
    const state: SubscriptionState = {
      tier,
      plan,
      purchasedAt: now.toISOString(),
      expiresAt: expires.toISOString(),
    };
    setSubscription(state);
    AsyncStorage.setItem("subscription", JSON.stringify(state));
    checkBadges(0, 0);
  };

  const cancelSubscription = () => {
    const state: SubscriptionState = { tier: "free" };
    setSubscription(state);
    AsyncStorage.setItem("subscription", JSON.stringify(state));
  };

  const isPro = subscription.tier === "pro" || subscription.tier === "elite";
  const isElite = subscription.tier === "elite";

  return (
    <AppContext.Provider value={{
      goals, setGoals, darkMode, toggleDarkMode, profile, setProfile,
      gamification, addXP, checkBadges,
      subscription, subscribe, cancelSubscription, isPro, isElite,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}

export type { Badge, GamificationState, UserProfile };
