import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useApp, MUSCLE_GROUPS, getRank } from "@/context/AppContext";
import {
  useGetActivities,
  useCreateActivity,
  useGetStreak,
} from "@workspace/api-client-react";

const TAB_BAR_HEIGHT = Platform.OS === "web" ? 84 : 70;
const PERIODS = ["day", "week", "month"] as const;

export default function ActivityScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addXP, checkBadges, isPro } = useApp();
  const [steps, setSteps] = useState("");
  const [calories, setCalories] = useState("");
  const [note, setNote] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [period, setPeriod] = useState<"day" | "week" | "month">("week");
  const [selectedMuscles, setSelectedMuscles] = useState<string[]>([]);

  const { data: activities, isLoading, refetch } = useGetActivities(
    { period },
    { query: { queryKey: ["activities", period] } },
  );
  const { data: streak, refetch: refetchStreak } = useGetStreak({
    query: { queryKey: ["analytics", "streak"] },
  });

  const createMutation = useCreateActivity({
    mutation: {
      onSuccess: (data) => {
        refetch();
        refetchStreak();
        setSteps("");
        setCalories("");
        setNote("");
        setSelectedMuscles([]);
        setShowForm(false);
        const muscles = selectedMuscles.length > 0 ? selectedMuscles : undefined;
        addXP(50, muscles);
        checkBadges(data.steps ?? 0, (streak?.currentStreak ?? 0) + 1);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      },
      onError: () => Alert.alert("Error", "Failed to save activity"),
    },
  });

  const handleSubmit = () => {
    const s = parseInt(steps, 10);
    const c = parseFloat(calories);
    if (!s || !c) { Alert.alert("Validation", "Please enter steps and calories burned"); return; }
    createMutation.mutate({ data: { steps: s, caloriesBurned: c, note: note || undefined } });
  };

  const toggleMuscle = (id: string) => {
    setSelectedMuscles((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id],
    );
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top + 16;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: topPad, paddingBottom: TAB_BAR_HEIGHT + 24 + (Platform.OS === "web" ? 34 : 0) },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Activity</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Track your workouts
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
            onPress={() => setShowForm(!showForm)}
          >
            <Feather name={showForm ? "x" : "plus"} size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Streak Banner */}
        {(streak?.currentStreak ?? 0) > 0 && (
          <View style={[styles.streakBanner, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.streakFireWrap, { backgroundColor: colors.orange + "20" }]}>
              <Text style={styles.streakFire}>🔥</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.streakNum, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
                {streak?.currentStreak ?? 0} Day Streak
              </Text>
              <Text style={[styles.streakSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                Best: {streak?.longestStreak ?? 0} days
              </Text>
            </View>
            <View style={[styles.xpBadge, { backgroundColor: colors.primary + "25" }]}>
              <Feather name="zap" size={13} color={colors.primary} />
              <Text style={[styles.xpBadgeText, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>+50 XP</Text>
            </View>
          </View>
        )}

        {/* Log Form */}
        {showForm && (
          <View style={[styles.form, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.formTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
              Log Workout
            </Text>

            <View style={styles.inputRow}>
              <View style={{ flex: 1, gap: 6 }}>
                <Text style={[styles.inputLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Steps</Text>
                <TextInput
                  style={[styles.input, { color: colors.foreground, backgroundColor: colors.secondary, borderColor: colors.border, fontFamily: "Inter_400Regular" }]}
                  placeholder="8,000"
                  placeholderTextColor={colors.mutedForeground}
                  value={steps}
                  onChangeText={setSteps}
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1, gap: 6 }}>
                <Text style={[styles.inputLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Calories</Text>
                <TextInput
                  style={[styles.input, { color: colors.foreground, backgroundColor: colors.secondary, borderColor: colors.border, fontFamily: "Inter_400Regular" }]}
                  placeholder="320"
                  placeholderTextColor={colors.mutedForeground}
                  value={calories}
                  onChangeText={setCalories}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={{ gap: 6 }}>
              <Text style={[styles.inputLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Note (optional)</Text>
              <TextInput
                style={[styles.input, { color: colors.foreground, backgroundColor: colors.secondary, borderColor: colors.border, fontFamily: "Inter_400Regular" }]}
                placeholder="Morning run, gym session..."
                placeholderTextColor={colors.mutedForeground}
                value={note}
                onChangeText={setNote}
              />
            </View>

            {/* Muscle Group Selector */}
            <View>
              <View style={styles.muscleTitleRow}>
                <Text style={[styles.inputLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                  Muscles Trained
                </Text>
                {!isPro && (
                  <View style={[styles.proBadge, { backgroundColor: colors.warning + "20" }]}>
                    <Text style={[styles.proBadgeText, { color: colors.warning, fontFamily: "Inter_600SemiBold" }]}>PRO</Text>
                  </View>
                )}
              </View>
              <View style={styles.muscleGrid}>
                {MUSCLE_GROUPS.map((mg) => {
                  const selected = selectedMuscles.includes(mg.id);
                  return (
                    <TouchableOpacity
                      key={mg.id}
                      onPress={() => toggleMuscle(mg.id)}
                      style={[
                        styles.muscleBtn,
                        {
                          backgroundColor: selected ? mg.color + "25" : colors.secondary,
                          borderColor: selected ? mg.color : colors.border,
                          borderWidth: selected ? 1.5 : 1,
                        },
                      ]}
                    >
                      <Text style={styles.muscleBtnEmoji}>{mg.emoji}</Text>
                      <Text style={[styles.muscleBtnLabel, {
                        color: selected ? mg.color : colors.mutedForeground,
                        fontFamily: selected ? "Inter_600SemiBold" : "Inter_400Regular",
                      }]}>
                        {mg.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* XP preview */}
            <View style={[styles.xpPreview, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "25" }]}>
              <Feather name="zap" size={16} color={colors.primary} />
              <Text style={[styles.xpPreviewText, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>
                +50 XP{selectedMuscles.length > 0 ? ` split across ${selectedMuscles.length} muscle group${selectedMuscles.length > 1 ? "s" : ""}` : ""}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: colors.primary }]}
              onPress={handleSubmit}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Feather name="check-circle" size={18} color="#fff" />
                  <Text style={[styles.submitBtnText, { fontFamily: "Inter_600SemiBold" }]}>Log Activity</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Period tabs */}
        <View style={[styles.periodTabs, { backgroundColor: colors.secondary }]}>
          {PERIODS.map((p) => (
            <TouchableOpacity
              key={p}
              onPress={() => setPeriod(p)}
              style={[styles.periodTab, period === p && { backgroundColor: colors.primary, borderRadius: 10 }]}
            >
              <Text style={[styles.periodTabText, {
                color: period === p ? "#fff" : colors.mutedForeground,
                fontFamily: "Inter_600SemiBold",
              }]}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Activity list */}
        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 30 }} />
        ) : (activities ?? []).length === 0 ? (
          <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.primary + "20" }]}>
              <Feather name="activity" size={28} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
              No activities yet
            </Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Log your first workout to earn XP and climb the ranks!
            </Text>
            <TouchableOpacity
              style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
              onPress={() => setShowForm(true)}
            >
              <Text style={[styles.emptyBtnText, { fontFamily: "Inter_600SemiBold" }]}>Log First Activity</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ gap: 10, marginTop: 16 }}>
            {(activities ?? []).map((a) => (
              <View key={a.id} style={[styles.activityCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.activityIcon, { backgroundColor: colors.primary + "20" }]}>
                  <Feather name="activity" size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.activityNote, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                    {a.note ?? "Workout"}
                  </Text>
                  <Text style={[styles.activityDate, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                    {a.date}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end", gap: 4 }}>
                  <View style={styles.statRow}>
                    <Feather name="trending-up" size={12} color={colors.primary} />
                    <Text style={[styles.statVal, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
                      {a.steps.toLocaleString()}
                    </Text>
                    <Text style={[styles.statUnit, { color: colors.mutedForeground }]}>steps</Text>
                  </View>
                  <View style={styles.statRow}>
                    <Feather name="zap" size={12} color={colors.orange} />
                    <Text style={[styles.statVal, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
                      {a.caloriesBurned}
                    </Text>
                    <Text style={[styles.statUnit, { color: colors.mutedForeground }]}>kcal</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  title: { fontSize: 26 },
  subtitle: { fontSize: 13, marginTop: 2 },
  addBtn: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", marginTop: 4 },

  streakBanner: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 18 },
  streakFireWrap: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" },
  streakFire: { fontSize: 24 },
  streakNum: { fontSize: 16 },
  streakSub: { fontSize: 12, marginTop: 2 },
  xpBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  xpBadgeText: { fontSize: 13 },

  form: { borderRadius: 18, borderWidth: 1, padding: 18, marginBottom: 20, gap: 14 },
  formTitle: { fontSize: 18 },
  inputRow: { flexDirection: "row", gap: 12 },
  inputLabel: { fontSize: 12, marginBottom: 4 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },

  muscleTitleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  proBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 },
  proBadgeText: { fontSize: 10, letterSpacing: 0.5 },
  muscleGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  muscleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  muscleBtnEmoji: { fontSize: 14 },
  muscleBtnLabel: { fontSize: 13 },

  xpPreview: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 10, borderWidth: 1, padding: 10 },
  xpPreviewText: { fontSize: 13 },

  submitBtn: { flexDirection: "row", gap: 8, borderRadius: 12, paddingVertical: 13, alignItems: "center", justifyContent: "center" },
  submitBtnText: { color: "#fff", fontSize: 15 },

  periodTabs: { flexDirection: "row", padding: 4, borderRadius: 12, marginBottom: 4 },
  periodTab: { flex: 1, paddingVertical: 8, alignItems: "center" },
  periodTabText: { fontSize: 13 },

  empty: { borderRadius: 18, borderWidth: 1, padding: 32, alignItems: "center", gap: 12, marginTop: 20 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: 18 },
  emptyText: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  emptyBtn: { borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24, marginTop: 8 },
  emptyBtnText: { color: "#fff", fontSize: 15 },

  activityCard: { flexDirection: "row", alignItems: "center", gap: 14, borderRadius: 16, borderWidth: 1, padding: 14 },
  activityIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  activityNote: { fontSize: 15 },
  activityDate: { fontSize: 12, marginTop: 2 },
  statRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  statVal: { fontSize: 14 },
  statUnit: { fontSize: 12 },
});
