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
import { useApp } from "@/context/AppContext";
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
  const { addXP, checkBadges } = useApp();
  const [steps, setSteps] = useState("");
  const [calories, setCalories] = useState("");
  const [note, setNote] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [period, setPeriod] = useState<"day" | "week" | "month">("week");

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
        setShowForm(false);
        addXP(50, "activity_logged");
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

        {/* Streak banner */}
        {(streak?.currentStreak ?? 0) > 0 && (
          <View style={[styles.streakBanner, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.streakIconWrap, { backgroundColor: colors.orange + "20" }]}>
              <Text style={styles.streakFire}>🔥</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.streakNum, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
                {streak?.currentStreak ?? 0} Day Streak
              </Text>
              <Text style={[styles.streakSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                Best: {streak?.longestStreak ?? 0} days · Keep it up!
              </Text>
            </View>
            <View style={[styles.streakXP, { backgroundColor: colors.primary + "20" }]}>
              <Text style={[styles.streakXPText, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>+50 XP</Text>
            </View>
          </View>
        )}

        {/* Add Form */}
        {showForm && (
          <View style={[styles.form, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.formTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
              Log Workout
            </Text>
            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.inputLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Steps</Text>
                <TextInput
                  style={[styles.input, { color: colors.foreground, backgroundColor: colors.secondary, borderColor: colors.border, fontFamily: "Inter_400Regular" }]}
                  placeholder="8000"
                  placeholderTextColor={colors.mutedForeground}
                  value={steps}
                  onChangeText={setSteps}
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
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
            <Text style={[styles.inputLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Note (optional)</Text>
            <TextInput
              style={[styles.input, { color: colors.foreground, backgroundColor: colors.secondary, borderColor: colors.border, fontFamily: "Inter_400Regular" }]}
              placeholder="Morning run, gym session..."
              placeholderTextColor={colors.mutedForeground}
              value={note}
              onChangeText={setNote}
            />
            <View style={styles.xpPreview}>
              <Feather name="zap" size={14} color={colors.primary} />
              <Text style={[styles.xpPreviewText, { color: colors.primary, fontFamily: "Inter_500Medium" }]}>
                +50 XP for logging this activity
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
        <View style={[styles.periodTabs, { backgroundColor: colors.secondary, borderRadius: 12 }]}>
          {PERIODS.map((p) => (
            <TouchableOpacity
              key={p}
              onPress={() => setPeriod(p)}
              style={[
                styles.periodTab,
                period === p && { backgroundColor: colors.primary, borderRadius: 10 },
              ]}
            >
              <Text style={[
                styles.periodTabText,
                { color: period === p ? "#fff" : colors.mutedForeground, fontFamily: "Inter_600SemiBold" },
              ]}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Activity list */}
        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 30 }} />
        ) : (activities ?? []).length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.primary + "20" }]}>
              <Feather name="activity" size={28} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
              No activities yet
            </Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Start logging your workouts to earn XP and level up your rank!
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
                  <View style={styles.activityStatRow}>
                    <Feather name="trending-up" size={12} color={colors.primary} />
                    <Text style={[styles.activityStat, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                      {a.steps.toLocaleString()}
                    </Text>
                    <Text style={[styles.activityStatUnit, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>steps</Text>
                  </View>
                  <View style={styles.activityStatRow}>
                    <Feather name="zap" size={12} color={colors.orange} />
                    <Text style={[styles.activityStat, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                      {a.caloriesBurned}
                    </Text>
                    <Text style={[styles.activityStatUnit, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>kcal</Text>
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

  streakBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 18,
  },
  streakIconWrap: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" },
  streakFire: { fontSize: 24 },
  streakNum: { fontSize: 16 },
  streakSub: { fontSize: 12, marginTop: 2 },
  streakXP: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  streakXPText: { fontSize: 12 },

  form: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    marginBottom: 20,
    gap: 12,
  },
  formTitle: { fontSize: 17, marginBottom: 4 },
  inputRow: { flexDirection: "row", gap: 12 },
  inputGroup: { gap: 6 },
  inputLabel: { fontSize: 12 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  xpPreview: { flexDirection: "row", alignItems: "center", gap: 6 },
  xpPreviewText: { fontSize: 13 },
  submitBtn: {
    flexDirection: "row",
    gap: 8,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  submitBtnText: { color: "#fff", fontSize: 15 },

  periodTabs: { flexDirection: "row", padding: 4, marginBottom: 4 },
  periodTab: { flex: 1, paddingVertical: 8, alignItems: "center" },
  periodTabText: { fontSize: 13 },

  emptyState: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 32,
    alignItems: "center",
    gap: 12,
    marginTop: 20,
  },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: 18 },
  emptyText: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  emptyBtn: { borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24, marginTop: 8 },
  emptyBtnText: { color: "#fff", fontSize: 15 },

  activityCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  activityIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  activityNote: { fontSize: 15 },
  activityDate: { fontSize: 12, marginTop: 2 },
  activityStatRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  activityStat: { fontSize: 14 },
  activityStatUnit: { fontSize: 12 },
});
