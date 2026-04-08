import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
}

interface AppContextType {
  goals: Goals;
  setGoals: (goals: Goals) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  profile: UserProfile;
  setProfile: (p: UserProfile) => void;
  gamification: GamificationState;
  addXP: (amount: number, reason?: string) => void;
  checkBadges: (steps: number, streak: number) => void;
}

const defaultGoals: Goals = {
  dailySteps: 10000,
  dailyCaloriesBurned: 500,
  dailyCaloriesConsumed: 2000,
};

const defaultProfile: UserProfile = {
  name: "",
  weightKg: 70,
  heightCm: 170,
  fitnessLevel: "intermediate",
};

const defaultGamification: GamificationState = {
  xp: 0,
  level: 1,
  badges: [],
};

export const XP_PER_LEVEL = 500;

export const RANKS = [
  { name: "Bronze",   minXP: 0,     color: "#cd7f32", gradient: ["#7a4a1e", "#cd7f32"] },
  { name: "Silver",   minXP: 500,   color: "#94a3b8", gradient: ["#475569", "#94a3b8"] },
  { name: "Gold",     minXP: 1500,  color: "#f59e0b", gradient: ["#92400e", "#f59e0b"] },
  { name: "Platinum", minXP: 3000,  color: "#67e8f9", gradient: ["#164e63", "#67e8f9"] },
  { name: "Diamond",  minXP: 6000,  color: "#818cf8", gradient: ["#1e1b4b", "#a5b4fc"] },
  { name: "Mythic",   minXP: 12000, color: "#f472b6", gradient: ["#831843", "#f9a8d4"] },
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
  const range = next.minXP - current.minXP;
  const progress = xp - current.minXP;
  return Math.min(progress / range, 1);
}

export const ALL_BADGES = [
  { id: "first_steps",  name: "First Steps",   description: "Log your first activity",    icon: "footprints" },
  { id: "steps_5k",     name: "5K Warrior",     description: "Walk 5,000 steps in a day",  icon: "trending-up" },
  { id: "steps_10k",    name: "10K Legend",     description: "Walk 10,000 steps in a day", icon: "zap" },
  { id: "streak_3",     name: "On Fire",        description: "Active 3 days in a row",     icon: "flame" },
  { id: "streak_7",     name: "Week Warrior",   description: "7-day streak",               icon: "award" },
  { id: "food_tracker", name: "Nutrition Pro",  description: "Log your first meal",        icon: "camera" },
  { id: "water_goal",   name: "Hydrated",       description: "Reach daily water goal",     icon: "droplet" },
  { id: "silver_rank",  name: "Silver Ranked",  description: "Reach Silver rank",          icon: "shield" },
  { id: "gold_rank",    name: "Gold Ranked",    description: "Reach Gold rank",            icon: "star" },
];

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
});

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [goals, setGoalsState] = useState<Goals>(defaultGoals);
  const [darkMode, setDarkMode] = useState(true);
  const [profile, setProfileState] = useState<UserProfile>(defaultProfile);
  const [gamification, setGamification] = useState<GamificationState>(defaultGamification);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.multiGet(["goals", "darkMode", "profile", "gamification"]).then((pairs) => {
      pairs.forEach(([key, val]) => {
        if (!val) return;
        if (key === "goals") setGoalsState(JSON.parse(val) as Goals);
        if (key === "darkMode") setDarkMode(val === "true");
        if (key === "profile") setProfileState(JSON.parse(val) as UserProfile);
        if (key === "gamification") setGamification(JSON.parse(val) as GamificationState);
      });
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (loaded) {
      AsyncStorage.setItem("darkMode", String(darkMode));
    }
  }, [darkMode, loaded]);

  const setGoals = (g: Goals) => {
    setGoalsState(g);
    AsyncStorage.setItem("goals", JSON.stringify(g));
  };

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  const setProfile = (p: UserProfile) => {
    setProfileState(p);
    AsyncStorage.setItem("profile", JSON.stringify(p));
  };

  const addXP = (amount: number, _reason?: string) => {
    setGamification((prev) => {
      const newXP = prev.xp + amount;
      const newLevel = Math.floor(newXP / XP_PER_LEVEL) + 1;
      const next: GamificationState = { ...prev, xp: newXP, level: newLevel };
      AsyncStorage.setItem("gamification", JSON.stringify(next));
      return next;
    });
  };

  const checkBadges = (steps: number, streak: number) => {
    setGamification((prev) => {
      const existingIds = new Set(prev.badges.map((b) => b.id));
      const newBadges: Badge[] = [...prev.badges];
      let xpBonus = 0;

      const maybeMint = (id: string, condition: boolean) => {
        if (condition && !existingIds.has(id)) {
          const template = ALL_BADGES.find((b) => b.id === id);
          if (template) {
            newBadges.push({ ...template, unlockedAt: new Date().toISOString() });
            existingIds.add(id);
            xpBonus += 150;
          }
        }
      };

      maybeMint("first_steps",  steps > 0);
      maybeMint("steps_5k",     steps >= 5000);
      maybeMint("steps_10k",    steps >= 10000);
      maybeMint("streak_3",     streak >= 3);
      maybeMint("streak_7",     streak >= 7);
      maybeMint("silver_rank",  prev.xp + xpBonus >= 500);
      maybeMint("gold_rank",    prev.xp + xpBonus >= 1500);

      const newXP = prev.xp + xpBonus;
      const next: GamificationState = {
        xp: newXP,
        level: Math.floor(newXP / XP_PER_LEVEL) + 1,
        badges: newBadges,
      };
      AsyncStorage.setItem("gamification", JSON.stringify(next));
      return next;
    });
  };

  return (
    <AppContext.Provider
      value={{ goals, setGoals, darkMode, toggleDarkMode, profile, setProfile, gamification, addXP, checkBadges }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}

export type { Badge, GamificationState, UserProfile };
