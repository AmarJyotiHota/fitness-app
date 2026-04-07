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

const XP_PER_LEVEL = 500;

const ALL_BADGES = [
  { id: "first_steps", name: "First Steps", description: "Log your first activity", icon: "footprints" },
  { id: "steps_5k", name: "5K Steps", description: "Walk 5,000 steps in a day", icon: "trending-up" },
  { id: "steps_10k", name: "10K Steps", description: "Walk 10,000 steps in a day", icon: "zap" },
  { id: "streak_3", name: "3-Day Streak", description: "Active 3 days in a row", icon: "flame" },
  { id: "streak_7", name: "Week Warrior", description: "Active 7 days in a row", icon: "award" },
  { id: "food_tracker", name: "Food Tracker", description: "Log your first meal", icon: "camera" },
  { id: "water_goal", name: "Hydrated", description: "Reach daily water goal", icon: "droplet" },
];

const AppContext = createContext<AppContextType>({
  goals: defaultGoals,
  setGoals: () => {},
  darkMode: false,
  toggleDarkMode: () => {},
  profile: defaultProfile,
  setProfile: () => {},
  gamification: defaultGamification,
  addXP: () => {},
  checkBadges: () => {},
});

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [goals, setGoalsState] = useState<Goals>(defaultGoals);
  const [darkMode, setDarkMode] = useState(false);
  const [profile, setProfileState] = useState<UserProfile>(defaultProfile);
  const [gamification, setGamification] = useState<GamificationState>(defaultGamification);

  useEffect(() => {
    AsyncStorage.multiGet(["goals", "darkMode", "profile", "gamification"]).then((pairs) => {
      pairs.forEach(([key, val]) => {
        if (!val) return;
        if (key === "goals") setGoalsState(JSON.parse(val) as Goals);
        if (key === "darkMode") setDarkMode(val === "true");
        if (key === "profile") setProfileState(JSON.parse(val) as UserProfile);
        if (key === "gamification") setGamification(JSON.parse(val) as GamificationState);
      });
    });
  }, []);

  const setGoals = (g: Goals) => {
    setGoalsState(g);
    AsyncStorage.setItem("goals", JSON.stringify(g));
  };

  const toggleDarkMode = () => {
    setDarkMode((prev) => {
      const next = !prev;
      AsyncStorage.setItem("darkMode", String(next));
      return next;
    });
  };

  const setProfile = (p: UserProfile) => {
    setProfileState(p);
    AsyncStorage.setItem("profile", JSON.stringify(p));
  };

  const addXP = (amount: number, _reason?: string) => {
    setGamification((prev) => {
      const newXP = prev.xp + amount;
      const newLevel = Math.floor(newXP / XP_PER_LEVEL) + 1;
      const next = { ...prev, xp: newXP, level: newLevel };
      AsyncStorage.setItem("gamification", JSON.stringify(next));
      return next;
    });
  };

  const checkBadges = (steps: number, streak: number) => {
    setGamification((prev) => {
      const existingIds = new Set(prev.badges.map((b) => b.badge_id ?? b.id));
      const newBadges: Badge[] = [...prev.badges];
      let xpBonus = 0;

      const maybeMint = (id: string, condition: boolean) => {
        if (condition && !existingIds.has(id)) {
          const template = ALL_BADGES.find((b) => b.id === id);
          if (template) {
            newBadges.push({ ...template, unlockedAt: new Date().toISOString() });
            existingIds.add(id);
            xpBonus += 100;
          }
        }
      };

      maybeMint("first_steps", steps > 0);
      maybeMint("steps_5k", steps >= 5000);
      maybeMint("steps_10k", steps >= 10000);
      maybeMint("streak_3", streak >= 3);
      maybeMint("streak_7", streak >= 7);

      const next = {
        xp: prev.xp + xpBonus,
        level: Math.floor((prev.xp + xpBonus) / XP_PER_LEVEL) + 1,
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

export { XP_PER_LEVEL, ALL_BADGES };
export type { Badge, GamificationState, UserProfile };
