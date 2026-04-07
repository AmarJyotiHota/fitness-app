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
        const newSteps = data.steps ?? 0;
        const currentStreak = streak?.currentStreak ?? 0;
        checkBadges(newSteps, currentStreak + 1);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      },
      onError: () => {
        Alert.alert("Error", "Failed to save activity");
      },
    },
  });

  const handleSubmit = () => {
    const s = parseInt(steps, 10);
    const c = parseFloat(calories);
    if (!s || !c) {
      Alert.alert("Validation", "Please enter steps and calories burned");
      return;
    }
    createMutation.mutate({
      data: { steps: s, caloriesBurned: c, note: note || undefined },
    });
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
          <Text style={[styles.title, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
            Activity
          </Text>
          <TouchableOpacity
            onPress={() => setShowForm(!showForm)}
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
          >
            <Feather name={showForm ? "x" : "plus"} size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Add Activity Form */}
        {showForm && (
          <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.formTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
              Log Activity
            </Text>
            <View style={[styles.input, { borderColor: colors.border, backgroundColor: colors.secondary }]}>
              <Feather name="trending-up" size={16} color={colors.mutedForeground} style={{ marginRight: 8 }} />
              <TextInput
                style={[styles.inputText, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}
                placeholder="Steps taken"
                placeholderTextColor={colors.mutedForeground}
                value={steps}
                onChangeText={setSteps}
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.input, { borderColor: colors.border, backgroundColor: colors.secondary }]}>
              <Feather name="zap" size={16} color={colors.mutedForeground} style={{ marginRight: 8 }} />
              <TextInput
                style={[styles.inputText, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}
                placeholder="Calories burned"
                placeholderTextColor={colors.mutedForeground}
                value={calories}
                onChangeText={setCalories}
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.input, { borderColor: colors.border, backgroundColor: colors.secondary }]}>
              <Feather name="edit-2" size={16} color={colors.mutedForeground} style={{ marginRight: 8 }} />
              <TextInput
                style={[styles.inputText, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}
                placeholder="Note (optional)"
                placeholderTextColor={colors.mutedForeground}
                value={note}
                onChangeText={setNote}
              />
            </View>
            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: colors.primary }]}
              onPress={handleSubmit}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={[styles.submitBtnText, { fontFamily: "Inter_600SemiBold" }]}>Save Activity</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Period Filter */}
        <View style={styles.periodRow}>
          {(["day", "week", "month"] as const).map((p) => (
            <TouchableOpacity
              key={p}
              onPress={() => setPeriod(p)}
              style={[
                styles.periodBtn,
                {
                  backgroundColor: period === p ? colors.primary : colors.secondary,
                  borderColor: period === p ? colors.primary : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.periodBtnText,
                  {
                    color: period === p ? "#fff" : colors.mutedForeground,
                    fontFamily: "Inter_500Medium",
                  },
                ]}
              >
                {p === "day" ? "Today" : p === "week" ? "Week" : "Month"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Activity List */}
        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        ) : !activities || activities.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="activity" size={48} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              No activities yet
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Tap the + button to log your first activity
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {activities.map((a) => (
              <View
                key={a.id}
                style={[styles.activityItem, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={[styles.activityIcon, { backgroundColor: colors.primary + "20" }]}>
                  <Feather name="trending-up" size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={[styles.activitySteps, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                      {a.steps.toLocaleString()} steps
                    </Text>
                    <Text style={[styles.activityDate, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                      {formatDate(a.date)}
                    </Text>
                  </View>
                  <Text style={[styles.activityCals, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                    {a.caloriesBurned} kcal burned
                  </Text>
                  {a.note && (
                    <Text style={[styles.activityNote, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                      {a.note}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function formatDate(d: string) {
  const date = new Date(d + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = today.getTime() - date.getTime();
  if (diff < 86400000) return "Today";
  if (diff < 172800000) return "Yesterday";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  title: { fontSize: 26 },
  addBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  formCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 20, gap: 12 },
  formTitle: { fontSize: 16, marginBottom: 4 },
  input: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inputText: { flex: 1, fontSize: 15 },
  submitBtn: { borderRadius: 10, paddingVertical: 13, alignItems: "center" },
  submitBtnText: { color: "#fff", fontSize: 15 },
  periodRow: { flexDirection: "row", gap: 8, marginBottom: 20 },
  periodBtn: { flex: 1, borderRadius: 10, borderWidth: 1, paddingVertical: 8, alignItems: "center" },
  periodBtnText: { fontSize: 13 },
  list: { gap: 10 },
  activityItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  activityIcon: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  activitySteps: { fontSize: 15 },
  activityDate: { fontSize: 12 },
  activityCals: { fontSize: 13, marginTop: 2 },
  activityNote: { fontSize: 12, marginTop: 4, fontStyle: "italic" },
  empty: { alignItems: "center", justifyContent: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 18 },
  emptySubtext: { fontSize: 14, textAlign: "center" },
});
