import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import {
  useGetWeeklyAnalytics,
  useGetStreak,
  useGetTodayWater,
  useLogWater,
  useGetWorkoutRecommendations,
  useGetActivitySummary,
} from "@workspace/api-client-react";

const TAB_BAR_HEIGHT = Platform.OS === "web" ? 84 : 70;
const WATER_AMOUNTS = [150, 250, 350, 500];

export default function InsightsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { profile, checkBadges } = useApp();
  const topPad = Platform.OS === "web" ? 67 : insets.top + 16;

  const [bmiHeight, setBmiHeight] = useState(String(profile.heightCm || 170));
  const [bmiWeight, setBmiWeight] = useState(String(profile.weightKg || 70));
  const [loadingWorkouts, setLoadingWorkouts] = useState(false);
  const [workouts, setWorkouts] = useState<WorkoutItem[] | null>(null);
  const [workoutMessage, setWorkoutMessage] = useState("");

  const { data: weekly, isLoading: loadingWeekly } = useGetWeeklyAnalytics({
    query: { queryKey: ["analytics", "weekly"] },
  });
  const { data: streak } = useGetStreak({
    query: { queryKey: ["analytics", "streak"] },
  });
  const { data: water, refetch: refetchWater } = useGetTodayWater({
    query: { queryKey: ["water", "today"] },
  });
  const { data: summary } = useGetActivitySummary({
    query: { queryKey: ["activity", "summary"] },
  });

  const logWaterMutation = useLogWater({
    mutation: {
      onSuccess: () => {
        refetchWater();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        checkBadges(summary?.todaySteps ?? 0, streak?.currentStreak ?? 0);
      },
    },
  });

  const workoutMutation = useGetWorkoutRecommendations({
    mutation: {
      onSuccess: (data) => {
        setWorkouts((data.recommendations ?? []) as WorkoutItem[]);
        setWorkoutMessage(data.motivationalMessage ?? "");
      },
      onError: () => Alert.alert("Error", "Failed to get recommendations"),
    },
  });

  const handleGetWorkouts = async () => {
    setLoadingWorkouts(true);
    try {
      await workoutMutation.mutateAsync({
        data: {
          todaySteps: summary?.todaySteps ?? 0,
          weeklySteps: summary?.weeklySteps ?? 0,
          caloriesBurned: summary?.todayCaloriesBurned ?? 0,
          fitnessLevel: profile.fitnessLevel,
        },
      });
    } finally {
      setLoadingWorkouts(false);
    }
  };

  const bmi = calcBMI(parseFloat(bmiHeight), parseFloat(bmiWeight));
  const bmiCategory = getBMICategory(bmi);
  const maxSteps = Math.max(...(weekly?.days.map((d) => d.steps) ?? [1]), 1);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: topPad, paddingBottom: TAB_BAR_HEIGHT + 24 + (Platform.OS === "web" ? 34 : 0) },
        ]}
      >
        <Text style={[styles.title, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
          Insights
        </Text>

        {/* Streak Card */}
        <View style={[styles.streakCard, { backgroundColor: colors.primary }]}>
          <View style={styles.streakLeft}>
            <Feather name="zap" size={28} color="#fff" />
            <View style={{ marginLeft: 14 }}>
              <Text style={[styles.streakNum, { fontFamily: "Inter_700Bold" }]}>
                {streak?.currentStreak ?? 0}
              </Text>
              <Text style={[styles.streakLabel, { fontFamily: "Inter_400Regular" }]}>day streak</Text>
            </View>
          </View>
          <View style={styles.streakRight}>
            <Text style={[styles.streakBest, { fontFamily: "Inter_500Medium" }]}>
              Best: {streak?.longestStreak ?? 0} days
            </Text>
            {streak && streak.currentStreak > 0 && (
              <View style={styles.streakDots}>
                {streak.streakDates.slice(0, 7).reverse().map((d, i) => (
                  <View key={i} style={[styles.streakDot, { opacity: 1 - i * 0.1 }]} />
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Weekly Chart */}
        <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
          Weekly Steps
        </Text>
        <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {loadingWeekly ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <View style={styles.barChart}>
              {(weekly?.days ?? []).map((day, i) => {
                const pct = day.steps / maxSteps;
                const isMax = day.steps === Math.max(...(weekly?.days.map((d) => d.steps) ?? [0]));
                return (
                  <View key={i} style={styles.barCol}>
                    <Text style={[styles.barValue, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
                      {day.steps >= 1000 ? `${(day.steps / 1000).toFixed(1)}k` : day.steps > 0 ? day.steps : ""}
                    </Text>
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.barFill,
                          {
                            height: `${Math.max(pct * 100, 4)}%` as any,
                            backgroundColor: isMax ? colors.primary : colors.primary + "60",
                            borderRadius: 4,
                          },
                        ]}
                      />
                    </View>
                    <Text style={[styles.barDay, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
                      {day.day}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
          <View style={styles.chartStats}>
            <ChartStat label="Avg Steps" value={(weekly?.averageSteps ?? 0).toLocaleString()} colors={colors} />
            <ChartStat label="Total Steps" value={(weekly?.totalSteps ?? 0).toLocaleString()} colors={colors} />
            <ChartStat label="Best Day" value={weekly?.bestDay ?? "—"} colors={colors} />
          </View>
        </View>

        {/* Water Intake */}
        <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
          Water Intake
        </Text>
        <View style={[styles.waterCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.waterHeader}>
            <View>
              <Text style={[styles.waterAmount, { color: colors.cyan, fontFamily: "Inter_700Bold" }]}>
                {water?.totalMl ?? 0} ml
              </Text>
              <Text style={[styles.waterGoal, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                of {water?.goalMl ?? 2500} ml goal
              </Text>
            </View>
            <View style={styles.waterCircle}>
              <Text style={[styles.waterPct, { color: colors.cyan, fontFamily: "Inter_700Bold" }]}>
                {water?.percentage ?? 0}%
              </Text>
            </View>
          </View>
          <WaterProgressBar pct={(water?.percentage ?? 0) / 100} color={colors.cyan} />
          <Text style={[styles.waterQuickLabel, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
            Quick add
          </Text>
          <View style={styles.waterBtns}>
            {WATER_AMOUNTS.map((ml) => (
              <TouchableOpacity
                key={ml}
                style={[styles.waterBtn, { backgroundColor: colors.cyan + "20", borderColor: colors.cyan + "40" }]}
                onPress={() => logWaterMutation.mutate({ data: { amount: ml } })}
                disabled={logWaterMutation.isPending}
              >
                <Feather name="droplet" size={14} color={colors.cyan} />
                <Text style={[styles.waterBtnText, { color: colors.cyan, fontFamily: "Inter_600SemiBold" }]}>
                  {ml}ml
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* BMI Calculator */}
        <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
          BMI Calculator
        </Text>
        <View style={[styles.bmiCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.bmiInputRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.bmiInputLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                Height (cm)
              </Text>
              <TextInput
                style={[styles.bmiInput, { color: colors.foreground, borderColor: colors.border, fontFamily: "Inter_600SemiBold", backgroundColor: colors.secondary }]}
                value={bmiHeight}
                onChangeText={setBmiHeight}
                keyboardType="numeric"
                placeholder="170"
                placeholderTextColor={colors.mutedForeground}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.bmiInputLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                Weight (kg)
              </Text>
              <TextInput
                style={[styles.bmiInput, { color: colors.foreground, borderColor: colors.border, fontFamily: "Inter_600SemiBold", backgroundColor: colors.secondary }]}
                value={bmiWeight}
                onChangeText={setBmiWeight}
                keyboardType="numeric"
                placeholder="70"
                placeholderTextColor={colors.mutedForeground}
              />
            </View>
          </View>
          {bmi > 0 && (
            <View style={styles.bmiResult}>
              <View style={[styles.bmiValueBox, { backgroundColor: bmiCategory.color + "20" }]}>
                <Text style={[styles.bmiValue, { color: bmiCategory.color, fontFamily: "Inter_700Bold" }]}>
                  {bmi.toFixed(1)}
                </Text>
                <Text style={[styles.bmiUnit, { color: bmiCategory.color, fontFamily: "Inter_400Regular" }]}>BMI</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={[styles.bmiCategory, { color: bmiCategory.color, fontFamily: "Inter_700Bold" }]}>
                  {bmiCategory.label}
                </Text>
                <Text style={[styles.bmiDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                  {bmiCategory.description}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* AI Workout Recommendations */}
        <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
          AI Workout Plan
        </Text>
        <TouchableOpacity
          style={[styles.aiBtn, { backgroundColor: colors.info }]}
          onPress={handleGetWorkouts}
          disabled={loadingWorkouts}
        >
          {loadingWorkouts ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Feather name="cpu" size={18} color="#fff" />
              <Text style={[styles.aiBtnText, { fontFamily: "Inter_600SemiBold" }]}>
                Get AI Workout Recommendations
              </Text>
            </>
          )}
        </TouchableOpacity>

        {workouts && workouts.length > 0 && (
          <>
            {workoutMessage ? (
              <View style={[styles.motivationCard, { backgroundColor: colors.info + "15", borderColor: colors.info + "30" }]}>
                <Feather name="star" size={16} color={colors.info} />
                <Text style={[styles.motivationText, { color: colors.info, fontFamily: "Inter_500Medium" }]}>
                  {workoutMessage}
                </Text>
              </View>
            ) : null}
            <View style={styles.workoutList}>
              {workouts.map((w, i) => (
                <WorkoutCard key={i} workout={w} colors={colors} />
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

interface WorkoutItem {
  name: string;
  duration: string;
  calories?: number;
  intensity?: string;
  description: string;
  steps?: string[];
}

function WorkoutCard({ workout, colors }: { workout: WorkoutItem; colors: ReturnType<typeof useColors> }) {
  const [expanded, setExpanded] = useState(false);
  const intensityColor =
    workout.intensity === "high" ? colors.destructive :
    workout.intensity === "moderate" ? colors.warning :
    colors.success;

  return (
    <TouchableOpacity
      style={[styles.workoutCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.8}
    >
      <View style={styles.workoutHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.workoutName, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
            {workout.name}
          </Text>
          <View style={styles.workoutMeta}>
            <Feather name="clock" size={12} color={colors.mutedForeground} />
            <Text style={[styles.workoutMetaText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              {workout.duration}
            </Text>
            {workout.calories ? (
              <>
                <Text style={{ color: colors.mutedForeground }}> · </Text>
                <Feather name="zap" size={12} color={colors.orange} />
                <Text style={[styles.workoutMetaText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                  {workout.calories} kcal
                </Text>
              </>
            ) : null}
          </View>
        </View>
        {workout.intensity && (
          <View style={[styles.intensityBadge, { backgroundColor: intensityColor + "20" }]}>
            <Text style={[styles.intensityText, { color: intensityColor, fontFamily: "Inter_500Medium" }]}>
              {workout.intensity}
            </Text>
          </View>
        )}
        <Feather name={expanded ? "chevron-up" : "chevron-down"} size={16} color={colors.mutedForeground} style={{ marginLeft: 8 }} />
      </View>
      {expanded && (
        <View style={{ marginTop: 10 }}>
          <Text style={[styles.workoutDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            {workout.description}
          </Text>
          {workout.steps && workout.steps.length > 0 && (
            <View style={{ marginTop: 8, gap: 6 }}>
              {workout.steps.map((step, i) => (
                <View key={i} style={styles.workoutStep}>
                  <View style={[styles.stepNum, { backgroundColor: colors.info + "20" }]}>
                    <Text style={[styles.stepNumText, { color: colors.info, fontFamily: "Inter_600SemiBold" }]}>
                      {i + 1}
                    </Text>
                  </View>
                  <Text style={[styles.stepText, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}>
                    {step}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

function ChartStat({ label, value, colors }: { label: string; value: string; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={{ alignItems: "center" }}>
      <Text style={[styles.chartStatValue, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>{value}</Text>
      <Text style={[styles.chartStatLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{label}</Text>
    </View>
  );
}

function WaterProgressBar({ pct, color }: { pct: number; color: string }) {
  return (
    <View style={[styles.waterTrack, { backgroundColor: color + "20" }]}>
      <View style={[styles.waterFill, { width: `${Math.min(pct * 100, 100)}%` as any, backgroundColor: color }]} />
    </View>
  );
}

function calcBMI(heightCm: number, weightKg: number): number {
  if (!heightCm || !weightKg || heightCm <= 0) return 0;
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

function getBMICategory(bmi: number) {
  if (bmi <= 0) return { label: "", description: "", color: "#94a3b8" };
  if (bmi < 18.5) return { label: "Underweight", description: "Consider consulting a nutritionist", color: "#f59e0b" };
  if (bmi < 25) return { label: "Normal weight", description: "You are in a healthy weight range", color: "#22c55e" };
  if (bmi < 30) return { label: "Overweight", description: "Some lifestyle adjustments may help", color: "#f97316" };
  return { label: "Obese", description: "Consult a healthcare professional", color: "#ef4444" };
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20 },
  title: { fontSize: 26, marginBottom: 20 },
  streakCard: {
    borderRadius: 18,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  streakLeft: { flexDirection: "row", alignItems: "center" },
  streakNum: { color: "#fff", fontSize: 40, lineHeight: 44 },
  streakLabel: { color: "rgba(255,255,255,0.8)", fontSize: 14 },
  streakRight: { alignItems: "flex-end", gap: 8 },
  streakBest: { color: "rgba(255,255,255,0.85)", fontSize: 13 },
  streakDots: { flexDirection: "row", gap: 5 },
  streakDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.9)" },
  sectionTitle: { fontSize: 17, marginBottom: 12 },
  chartCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 24 },
  barChart: { flexDirection: "row", height: 100, gap: 4, alignItems: "flex-end", marginBottom: 12 },
  barCol: { flex: 1, alignItems: "center", height: "100%" },
  barValue: { fontSize: 8, marginBottom: 2, height: 12 },
  barTrack: { flex: 1, width: "100%", justifyContent: "flex-end" },
  barFill: { width: "100%" },
  barDay: { fontSize: 10, marginTop: 4 },
  chartStats: { flexDirection: "row", justifyContent: "space-around", borderTopWidth: 1, borderTopColor: "#e2e8f0", paddingTop: 12 },
  chartStatValue: { fontSize: 15, textAlign: "center" },
  chartStatLabel: { fontSize: 11, marginTop: 2 },
  waterCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 24, gap: 12 },
  waterHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  waterAmount: { fontSize: 28 },
  waterGoal: { fontSize: 13, marginTop: 2 },
  waterCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: "rgba(6,182,212,0.15)", alignItems: "center", justifyContent: "center" },
  waterPct: { fontSize: 18 },
  waterTrack: { height: 8, borderRadius: 4, overflow: "hidden" },
  waterFill: { height: 8, borderRadius: 4 },
  waterQuickLabel: { fontSize: 12 },
  waterBtns: { flexDirection: "row", gap: 8 },
  waterBtn: { flex: 1, borderRadius: 10, borderWidth: 1, paddingVertical: 8, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 4 },
  waterBtnText: { fontSize: 13 },
  bmiCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 24, gap: 14 },
  bmiInputRow: { flexDirection: "row", gap: 12 },
  bmiInputLabel: { fontSize: 12, marginBottom: 6 },
  bmiInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  bmiResult: { flexDirection: "row", alignItems: "center" },
  bmiValueBox: { width: 76, height: 76, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  bmiValue: { fontSize: 26, lineHeight: 30 },
  bmiUnit: { fontSize: 12 },
  bmiCategory: { fontSize: 18, marginBottom: 4 },
  bmiDesc: { fontSize: 13, lineHeight: 18 },
  aiBtn: {
    flexDirection: "row",
    gap: 10,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  aiBtnText: { color: "#fff", fontSize: 15 },
  motivationCard: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
  },
  motivationText: { flex: 1, fontSize: 14, lineHeight: 20 },
  workoutList: { gap: 10, marginBottom: 12 },
  workoutCard: { borderRadius: 14, borderWidth: 1, padding: 14 },
  workoutHeader: { flexDirection: "row", alignItems: "center" },
  workoutName: { fontSize: 15, marginBottom: 4 },
  workoutMeta: { flexDirection: "row", alignItems: "center", gap: 4 },
  workoutMetaText: { fontSize: 12 },
  intensityBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  intensityText: { fontSize: 11 },
  workoutDesc: { fontSize: 13, lineHeight: 18 },
  workoutStep: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  stepNum: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  stepNumText: { fontSize: 11 },
  stepText: { flex: 1, fontSize: 13, lineHeight: 18 },
});
