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

interface WorkoutItem {
  name: string;
  duration: string;
  calories?: number;
  intensity?: string;
  description: string;
  steps?: string[];
}

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
  const { data: streak } = useGetStreak({ query: { queryKey: ["analytics", "streak"] } });
  const { data: water, refetch: refetchWater } = useGetTodayWater({ query: { queryKey: ["water", "today"] } });
  const { data: summary } = useGetActivitySummary({ query: { queryKey: ["activity", "summary"] } });

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
        <Text style={[styles.title, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Insights</Text>

        {/* Streak Card */}
        <View style={[styles.streakCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.streakGlow, { backgroundColor: colors.orange + "15" }]} />
          <View style={styles.streakLeft}>
            <Text style={styles.streakFire}>🔥</Text>
            <View>
              <Text style={[styles.streakNum, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
                {streak?.currentStreak ?? 0}
              </Text>
              <Text style={[styles.streakLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>day streak</Text>
            </View>
          </View>
          <View style={styles.streakRight}>
            <View style={[styles.streakBestBadge, { backgroundColor: colors.warning + "20", borderColor: colors.warning + "30" }]}>
              <Feather name="award" size={13} color={colors.warning} />
              <Text style={[styles.streakBestText, { color: colors.warning, fontFamily: "Inter_600SemiBold" }]}>
                Best: {streak?.longestStreak ?? 0} days
              </Text>
            </View>
            {(streak?.currentStreak ?? 0) > 0 && (
              <View style={styles.streakDots}>
                {streak!.streakDates.slice(0, 7).reverse().map((_, i) => (
                  <View key={i} style={[styles.streakDot, { backgroundColor: colors.orange, opacity: 1 - i * 0.12 }]} />
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Weekly Chart */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>WEEKLY STEPS</Text>
        <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {loadingWeekly ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <View style={styles.barChart}>
              {(weekly?.days ?? []).map((day, i) => {
                const pct = day.steps / maxSteps;
                const isMax = day.steps === maxSteps && day.steps > 0;
                return (
                  <View key={i} style={styles.barCol}>
                    {day.steps > 0 && (
                      <Text style={[styles.barValue, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
                        {day.steps >= 1000 ? `${(day.steps / 1000).toFixed(1)}k` : day.steps}
                      </Text>
                    )}
                    <View style={styles.barTrack}>
                      <View style={[
                        styles.barFill,
                        {
                          height: `${Math.max(pct * 100, 4)}%` as any,
                          backgroundColor: isMax ? colors.primary : colors.primary + "50",
                        },
                      ]} />
                    </View>
                    <Text style={[styles.barDay, { color: isMax ? colors.primary : colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
                      {day.day}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
          <View style={[styles.chartStatsRow, { borderTopColor: colors.border }]}>
            <ChartStat label="Avg" value={(weekly?.averageSteps ?? 0).toLocaleString()} colors={colors} />
            <ChartStat label="Total" value={(weekly?.totalSteps ?? 0).toLocaleString()} colors={colors} />
            <ChartStat label="Best" value={weekly?.bestDay ?? "—"} colors={colors} highlight />
          </View>
        </View>

        {/* Water Intake */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>WATER INTAKE</Text>
        <View style={[styles.waterCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.waterTop}>
            <View>
              <Text style={[styles.waterAmt, { color: colors.cyan, fontFamily: "Inter_700Bold" }]}>
                {water?.totalMl ?? 0} <Text style={[styles.waterUnit, { fontFamily: "Inter_400Regular" }]}>ml</Text>
              </Text>
              <Text style={[styles.waterGoal, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                of {water?.goalMl ?? 2500} ml daily goal
              </Text>
            </View>
            <View style={[styles.waterPctCircle, { borderColor: colors.cyan + "50", backgroundColor: colors.cyan + "15" }]}>
              <Text style={[styles.waterPct, { color: colors.cyan, fontFamily: "Inter_700Bold" }]}>
                {water?.percentage ?? 0}%
              </Text>
            </View>
          </View>
          <View style={[styles.waterTrack, { backgroundColor: colors.border }]}>
            <View style={[styles.waterFill, { width: `${Math.min(water?.percentage ?? 0, 100)}%` as any, backgroundColor: colors.cyan }]} />
          </View>
          <View style={styles.waterBtns}>
            {WATER_AMOUNTS.map((ml) => (
              <TouchableOpacity
                key={ml}
                style={[styles.waterBtn, { backgroundColor: colors.cyan + "15", borderColor: colors.cyan + "30" }]}
                onPress={() => logWaterMutation.mutate({ data: { amount: ml } })}
                disabled={logWaterMutation.isPending}
              >
                <Text style={styles.waterBtnEmoji}>💧</Text>
                <Text style={[styles.waterBtnText, { color: colors.cyan, fontFamily: "Inter_600SemiBold" }]}>+{ml}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* BMI Calculator */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>BMI CALCULATOR</Text>
        <View style={[styles.bmiCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.bmiInputRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.bmiLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Height (cm)</Text>
              <TextInput
                style={[styles.bmiInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.secondary, fontFamily: "Inter_600SemiBold" }]}
                value={bmiHeight}
                onChangeText={setBmiHeight}
                keyboardType="numeric"
                placeholderTextColor={colors.mutedForeground}
                placeholder="170"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.bmiLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Weight (kg)</Text>
              <TextInput
                style={[styles.bmiInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.secondary, fontFamily: "Inter_600SemiBold" }]}
                value={bmiWeight}
                onChangeText={setBmiWeight}
                keyboardType="numeric"
                placeholderTextColor={colors.mutedForeground}
                placeholder="70"
              />
            </View>
          </View>
          {bmi > 0 && (
            <View style={styles.bmiResult}>
              <View style={[styles.bmiValueBox, { backgroundColor: bmiCategory.color + "20", borderColor: bmiCategory.color + "40" }]}>
                <Text style={[styles.bmiValue, { color: bmiCategory.color, fontFamily: "Inter_700Bold" }]}>{bmi.toFixed(1)}</Text>
                <Text style={[styles.bmiValueUnit, { color: bmiCategory.color, fontFamily: "Inter_400Regular" }]}>BMI</Text>
              </View>
              <View style={{ flex: 1 }}>
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

        {/* AI Workout Plan */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>AI WORKOUT PLAN</Text>
        <TouchableOpacity
          style={[styles.aiBtn, { backgroundColor: colors.primary }]}
          onPress={handleGetWorkouts}
          disabled={loadingWorkouts}
        >
          {loadingWorkouts ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.aiBtnEmoji}>🤖</Text>
              <Text style={[styles.aiBtnText, { fontFamily: "Inter_600SemiBold" }]}>Generate My Workout Plan</Text>
            </>
          )}
        </TouchableOpacity>

        {workoutMessage ? (
          <View style={[styles.motivationCard, { backgroundColor: colors.info + "15", borderColor: colors.info + "25" }]}>
            <Feather name="star" size={16} color={colors.info} />
            <Text style={[styles.motivationText, { color: colors.info, fontFamily: "Inter_500Medium" }]}>
              {workoutMessage}
            </Text>
          </View>
        ) : null}

        {workouts && workouts.length > 0 && (
          <View style={{ gap: 10, marginTop: 4 }}>
            {workouts.map((w, i) => (
              <WorkoutCard key={i} workout={w} colors={colors} />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function WorkoutCard({ workout, colors }: { workout: WorkoutItem; colors: ReturnType<typeof useColors> }) {
  const [expanded, setExpanded] = useState(false);
  const intensityColor =
    workout.intensity === "high" ? colors.destructive :
    workout.intensity === "moderate" ? colors.warning : colors.success;

  return (
    <TouchableOpacity
      style={[styles.workoutCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.8}
    >
      <View style={styles.workoutRow}>
        <View style={[styles.workoutIcon, { backgroundColor: colors.primary + "20" }]}>
          <Feather name="activity" size={18} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.workoutName, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>{workout.name}</Text>
          <View style={styles.workoutMeta}>
            <Feather name="clock" size={11} color={colors.mutedForeground} />
            <Text style={[styles.workoutMetaText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{workout.duration}</Text>
            {workout.calories ? (
              <>
                <Text style={{ color: colors.mutedForeground }}> · </Text>
                <Feather name="zap" size={11} color={colors.orange} />
                <Text style={[styles.workoutMetaText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{workout.calories} kcal</Text>
              </>
            ) : null}
          </View>
        </View>
        {workout.intensity && (
          <View style={[styles.intensityBadge, { backgroundColor: intensityColor + "20" }]}>
            <Text style={[styles.intensityText, { color: intensityColor, fontFamily: "Inter_500Medium" }]}>{workout.intensity}</Text>
          </View>
        )}
        <Feather name={expanded ? "chevron-up" : "chevron-down"} size={15} color={colors.mutedForeground} style={{ marginLeft: 6 }} />
      </View>
      {expanded && (
        <View style={{ marginTop: 10, gap: 6 }}>
          <Text style={[styles.workoutDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{workout.description}</Text>
          {(workout.steps ?? []).map((step, i) => (
            <View key={i} style={styles.workoutStep}>
              <View style={[styles.stepNum, { backgroundColor: colors.primary + "20" }]}>
                <Text style={[styles.stepNumText, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>{i + 1}</Text>
              </View>
              <Text style={[styles.stepText, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}>{step}</Text>
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
}

function ChartStat({ label, value, colors, highlight }: { label: string; value: string; colors: ReturnType<typeof useColors>; highlight?: boolean }) {
  return (
    <View style={{ alignItems: "center" }}>
      <Text style={[styles.chartStatValue, { color: highlight ? colors.primary : colors.foreground, fontFamily: "Inter_700Bold" }]}>{value}</Text>
      <Text style={[styles.chartStatLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{label}</Text>
    </View>
  );
}

function calcBMI(h: number, w: number) {
  if (!h || !w || h <= 0) return 0;
  return w / Math.pow(h / 100, 2);
}

function getBMICategory(bmi: number) {
  if (bmi <= 0) return { label: "", description: "", color: "#94a3b8" };
  if (bmi < 18.5) return { label: "Underweight", description: "Consider a nutritionist consultation", color: "#f59e0b" };
  if (bmi < 25) return { label: "Normal Weight", description: "You're in a healthy range", color: "#22c55e" };
  if (bmi < 30) return { label: "Overweight", description: "Lifestyle adjustments may help", color: "#f97316" };
  return { label: "Obese", description: "Consult a healthcare professional", color: "#ef4444" };
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20 },
  title: { fontSize: 26, marginBottom: 20 },
  sectionLabel: { fontSize: 11, letterSpacing: 1.2, marginBottom: 10, marginTop: 4 },

  streakCard: { borderRadius: 18, borderWidth: 1, padding: 18, marginBottom: 24, flexDirection: "row", alignItems: "center", justifyContent: "space-between", overflow: "hidden" },
  streakGlow: { position: "absolute", top: -50, left: -50, width: 160, height: 160, borderRadius: 80 },
  streakLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  streakFire: { fontSize: 40 },
  streakNum: { fontSize: 42, lineHeight: 46 },
  streakLabel: { fontSize: 14 },
  streakRight: { alignItems: "flex-end", gap: 8 },
  streakBestBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  streakBestText: { fontSize: 12 },
  streakDots: { flexDirection: "row", gap: 5 },
  streakDot: { width: 8, height: 8, borderRadius: 4 },

  chartCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 24 },
  barChart: { flexDirection: "row", height: 110, gap: 4, alignItems: "flex-end", marginBottom: 12 },
  barCol: { flex: 1, alignItems: "center", height: "100%" },
  barValue: { fontSize: 8, marginBottom: 2, height: 12 },
  barTrack: { flex: 1, width: "100%", justifyContent: "flex-end" },
  barFill: { width: "100%", borderRadius: 4 },
  barDay: { fontSize: 10, marginTop: 4 },
  chartStatsRow: { flexDirection: "row", justifyContent: "space-around", borderTopWidth: 1, paddingTop: 12 },
  chartStatValue: { fontSize: 16, textAlign: "center" },
  chartStatLabel: { fontSize: 11, marginTop: 2 },

  waterCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 24, gap: 12 },
  waterTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  waterAmt: { fontSize: 32 },
  waterUnit: { fontSize: 18 },
  waterGoal: { fontSize: 13, marginTop: 4 },
  waterPctCircle: { width: 60, height: 60, borderRadius: 30, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  waterPct: { fontSize: 18 },
  waterTrack: { height: 8, borderRadius: 4, overflow: "hidden" },
  waterFill: { height: 8, borderRadius: 4 },
  waterBtns: { flexDirection: "row", gap: 8 },
  waterBtn: { flex: 1, borderRadius: 10, borderWidth: 1, paddingVertical: 10, alignItems: "center", gap: 2 },
  waterBtnEmoji: { fontSize: 16 },
  waterBtnText: { fontSize: 12 },

  bmiCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 24, gap: 14 },
  bmiInputRow: { flexDirection: "row", gap: 12 },
  bmiLabel: { fontSize: 12, marginBottom: 6 },
  bmiInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16 },
  bmiResult: { flexDirection: "row", alignItems: "center", gap: 14 },
  bmiValueBox: { width: 80, height: 80, borderRadius: 16, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  bmiValue: { fontSize: 28, lineHeight: 32 },
  bmiValueUnit: { fontSize: 13 },
  bmiCategory: { fontSize: 18 },
  bmiDesc: { fontSize: 13, lineHeight: 18, marginTop: 4 },

  aiBtn: { flexDirection: "row", gap: 10, borderRadius: 14, paddingVertical: 14, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  aiBtnEmoji: { fontSize: 20 },
  aiBtnText: { color: "#fff", fontSize: 15 },
  motivationCard: { flexDirection: "row", gap: 8, alignItems: "center", borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 12 },
  motivationText: { flex: 1, fontSize: 13, lineHeight: 19 },

  workoutCard: { borderRadius: 14, borderWidth: 1, padding: 14 },
  workoutRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  workoutIcon: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  workoutName: { fontSize: 15, marginBottom: 4 },
  workoutMeta: { flexDirection: "row", alignItems: "center", gap: 4 },
  workoutMetaText: { fontSize: 12 },
  intensityBadge: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20 },
  intensityText: { fontSize: 11 },
  workoutDesc: { fontSize: 13, lineHeight: 18 },
  workoutStep: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  stepNum: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  stepNumText: { fontSize: 11 },
  stepText: { flex: 1, fontSize: 13, lineHeight: 18 },
});
