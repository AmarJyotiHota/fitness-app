import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { useGetActivitySummary } from "@workspace/api-client-react";

const TAB_BAR_HEIGHT = Platform.OS === "web" ? 84 : 70;

function StatCard({
  label,
  value,
  unit,
  icon,
  color,
  colors,
}: {
  label: string;
  value: string | number;
  unit: string;
  icon: string;
  color: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.statIcon, { backgroundColor: color + "20" }]}>
        <Feather name={icon as any} size={20} color={color} />
      </View>
      <Text style={[styles.statValue, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </Text>
      <Text style={[styles.statUnit, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
        {unit}
      </Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
        {label}
      </Text>
    </View>
  );
}

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min(value / max, 1);
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${pct * 100}%` as any, backgroundColor: color }]} />
    </View>
  );
}

function GoalRow({
  label,
  current,
  goal,
  color,
  unit,
  colors,
}: {
  label: string;
  current: number;
  goal: number;
  color: string;
  unit: string;
  colors: ReturnType<typeof useColors>;
}) {
  const pct = Math.min(Math.round((current / goal) * 100), 100);
  return (
    <View style={styles.goalRow}>
      <View style={styles.goalHeader}>
        <Text style={[styles.goalLabel, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>
          {label}
        </Text>
        <Text style={[styles.goalValue, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
          {current.toLocaleString()} / {goal.toLocaleString()} {unit}
        </Text>
      </View>
      <ProgressBar value={current} max={goal} color={color} />
      <Text style={[styles.goalPct, { color: pct >= 100 ? colors.success : color, fontFamily: "Inter_600SemiBold" }]}>
        {pct}%
      </Text>
    </View>
  );
}

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { goals } = useApp();
  const [refreshing, setRefreshing] = useState(false);

  const { data: summary, isLoading, refetch } = useGetActivitySummary({
    query: { queryKey: ["activity", "summary"] },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Good {getTimeOfDay()},
            </Text>
            <Text style={[styles.title, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
              Your Dashboard
            </Text>
          </View>
        </View>

        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* Today Stats Grid */}
            <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
              Today
            </Text>
            <View style={styles.statsGrid}>
              <StatCard
                label="Steps"
                value={summary?.todaySteps ?? 0}
                unit="steps"
                icon="trending-up"
                color={colors.primary}
                colors={colors}
              />
              <StatCard
                label="Burned"
                value={summary?.todayCaloriesBurned ?? 0}
                unit="kcal"
                icon="zap"
                color={colors.orange}
                colors={colors}
              />
              <StatCard
                label="Consumed"
                value={summary?.todayCaloriesConsumed ?? 0}
                unit="kcal"
                icon="coffee"
                color={colors.success}
                colors={colors}
              />
              <StatCard
                label="This Week"
                value={Math.round((summary?.weeklySteps ?? 0) / 1000)}
                unit="K steps"
                icon="bar-chart-2"
                color={colors.info}
                colors={colors}
              />
            </View>

            {/* Goal Progress */}
            <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold", marginTop: 24 }]}>
              Daily Goals
            </Text>
            <View style={[styles.goalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <GoalRow
                label="Steps"
                current={summary?.todaySteps ?? 0}
                goal={goals.dailySteps}
                color={colors.primary}
                unit=""
                colors={colors}
              />
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <GoalRow
                label="Calories Burned"
                current={summary?.todayCaloriesBurned ?? 0}
                goal={goals.dailyCaloriesBurned}
                color={colors.orange}
                unit="kcal"
                colors={colors}
              />
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <GoalRow
                label="Calories Consumed"
                current={summary?.todayCaloriesConsumed ?? 0}
                goal={goals.dailyCaloriesConsumed}
                color={colors.success}
                unit="kcal"
                colors={colors}
              />
            </View>

            {/* Weekly Summary */}
            <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold", marginTop: 24 }]}>
              This Week
            </Text>
            <View style={[styles.weekCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <WeekStat label="Steps" value={(summary?.weeklySteps ?? 0).toLocaleString()} icon="trending-up" color={colors.primary} colors={colors} />
              <WeekStat label="Burned" value={`${summary?.weeklyCaloriesBurned ?? 0} kcal`} icon="zap" color={colors.orange} colors={colors} />
              <WeekStat label="Consumed" value={`${summary?.weeklyCaloriesConsumed ?? 0} kcal`} icon="coffee" color={colors.success} colors={colors} />
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function WeekStat({
  label, value, icon, color, colors,
}: {
  label: string; value: string; icon: string; color: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.weekStat}>
      <Feather name={icon as any} size={16} color={color} />
      <View style={{ marginLeft: 10, flex: 1 }}>
        <Text style={[styles.weekStatLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{label}</Text>
        <Text style={[styles.weekStatValue, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>{value}</Text>
      </View>
    </View>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 24 },
  greeting: { fontSize: 14 },
  title: { fontSize: 26, marginTop: 2 },
  sectionTitle: { fontSize: 17, marginBottom: 12 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  statCard: {
    width: "47%",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 4,
  },
  statIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", marginBottom: 6 },
  statValue: { fontSize: 24 },
  statUnit: { fontSize: 12 },
  statLabel: { fontSize: 13 },
  goalCard: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  goalRow: { padding: 16 },
  goalHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  goalLabel: { fontSize: 14 },
  goalValue: { fontSize: 13 },
  progressTrack: { height: 6, backgroundColor: "#e2e8f0", borderRadius: 3, overflow: "hidden" },
  progressFill: { height: 6, borderRadius: 3 },
  goalPct: { fontSize: 12, textAlign: "right", marginTop: 4 },
  divider: { height: 1 },
  weekCard: { borderRadius: 16, borderWidth: 1, padding: 8 },
  weekStat: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 10 },
  weekStatLabel: { fontSize: 12 },
  weekStatValue: { fontSize: 15 },
});
