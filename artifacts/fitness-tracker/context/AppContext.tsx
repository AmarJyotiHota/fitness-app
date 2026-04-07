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
  adminToken: string | null;
  setAdminToken: (token: string | null) => void;
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
  adminToken: null,
  setAdminToken: () => {},
});

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [goals, setGoalsState] = useState<Goals>(defaultGoals);
  const [darkMode, setDarkMode] = useState(false);
  const [adminToken, setAdminTokenState] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem("goals").then((val) => {
      if (val) setGoalsState(JSON.parse(val) as Goals);
    });
    AsyncStorage.getItem("darkMode").then((val) => {
      if (val === "true") setDarkMode(true);
    });
    AsyncStorage.getItem("adminToken").then((val) => {
      if (val) setAdminTokenState(val);
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

  const setAdminToken = (token: string | null) => {
    setAdminTokenState(token);
    if (token) AsyncStorage.setItem("adminToken", token);
    else AsyncStorage.removeItem("adminToken");
  };

  return (
    <AppContext.Provider value={{ goals, setGoals, darkMode, toggleDarkMode, adminToken, setAdminToken }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
