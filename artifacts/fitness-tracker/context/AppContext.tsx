import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface Goals {
  dailySteps: number;
  dailyCaloriesBurned: number;
  dailyCaloriesConsumed: number;
}

interface AppContextType {
  goals: Goals;
  setGoals: (goals: Goals) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const defaultGoals: Goals = {
  dailySteps: 10000,
  dailyCaloriesBurned: 500,
  dailyCaloriesConsumed: 2000,
};

const AppContext = createContext<AppContextType>({
  goals: defaultGoals,
  setGoals: () => {},
  darkMode: false,
  toggleDarkMode: () => {},
});

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [goals, setGoalsState] = useState<Goals>(defaultGoals);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem("goals").then((val) => {
      if (val) setGoalsState(JSON.parse(val) as Goals);
    });
    AsyncStorage.getItem("darkMode").then((val) => {
      if (val === "true") setDarkMode(true);
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

  return (
    <AppContext.Provider value={{ goals, setGoals, darkMode, toggleDarkMode }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
