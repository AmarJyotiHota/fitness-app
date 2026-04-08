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
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useApp, getRank, getNextRank, getRankProgress, RANKS } from "@/context/AppContext";
import { useGetActivitySummary } from "@workspace/api-client-react";

const TAB_BAR_HEIGHT = Platform.OS === "web" ? 84 : 70;

const RANK_ICONS: Record<string, string> = {
  Bronze: "🥉",
  Silver: "🥈",
  Gold: "🥇",
  Platinum: "💎",
  Diamond: "💠",
  Mythic: "⚡",
};

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { goals, gamification, profile, isPro, isElite } = useApp();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const topPad = Platform.OS === "web" ? 67 : insets.top + 16;

  const { data: summary, isLoading, refetch } = useGetActivitySummary({
    query: { queryKey: ["activity", "summary"] },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const rank = getRank(gamification.xp);
  const nextRank = getNextRank(gamification.xp);
  const rankProgress = getRankProgress(gamification.xp);
  const xpToNext = nextRank ? nextRank.minXP - gamification.xp : 0;

  const stepsGoalPct = Math.min((summary?.todaySteps ?? 0) / goals.dailySteps, 1);
  const burnGoalPct = Math.min((summary?.todayCaloriesBurned ?? 0) / goals.dailyCaloriesBurned, 1);
  const consumeGoalPct = Math.min((summary?.todayCaloriesConsumed ?? 0) / goals.dailyCaloriesConsumed, 1);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: topPad, paddingBottom: TAB_BAR_HEIGHT + 24 + (Platform.OS === "web" ? 34 : 0) },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              {greeting()}{profile.name ? `, ${profile.name}` : ""}
            </Text>
            <Text style={[styles.title, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
              Your Dashboard
            </Text>
          </View>
          <View style={[styles.xpChip, { backgroundColor: colors.primary + "25", borderColor: colors.primary + "50" }]}>
            <Feather name="zap" size={13} color={colors.primary} />
            <Text style={[styles.xpChipText, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>
              {gamification.xp.toLocaleString()} XP
            </Text>
          </View>
        </View>

        {/* Rank Card */}
        <View style={[styles.rankCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.rankCardInner}>
            {/* Decorative glow */}
            <View style={[styles.rankGlow, { backgroundColor: rank.color + "18" }]} />

            <View style={styles.rankLeft}>
              <Text style={styles.rankEmoji}>{RANK_ICONS[rank.name]}</Text>
              <View>
                <Text style={[styles.rankName, { color: rank.color, fontFamily: "Inter_700Bold" }]}>
                  {rank.name} Rank
                </Text>
                <Text style={[styles.rankLevel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                  Level {gamification.level}
                </Text>
              </View>
            </View>

            {nextRank ? (
              <View style={styles.rankRight}>
                <Text style={[styles.rankNextLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                  Next: {nextRank.name}
                </Text>
                <Text style={[styles.rankXPLeft, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                  {xpToNext} XP away
                </Text>
              </View>
            ) : (
              <View style={[styles.mythicBadge, { backgroundColor: rank.color + "25" }]}>
                <Text style={[styles.mythicText, { color: rank.color, fontFamily: "Inter_700Bold" }]}>MAX RANK</Text>
              </View>
            )}
          </View>

          {/* XP Progress bar */}
          <View style={styles.rankBarRow}>
            <View style={[styles.rankBarTrack, { backgroundColor: colors.border }]}>
              <View
                style={[
                  styles.rankBarFill,
                  {
                    width: `${rankProgress * 100}%` as any,
                    backgroundColor: rank.color,
                  },
                ]}
              />
            </View>
            <Text style={[styles.rankBarPct, { color: rank.color, fontFamily: "Inter_600SemiBold" }]}>
              {Math.round(rankProgress * 100)}%
            </Text>
          </View>

          {/* Badges strip */}
          {gamification.badges.length > 0 && (
            <View style={styles.badgeStrip}>
              {gamification.badges.slice(0, 6).map((b) => (
                <View key={b.id} style={[styles.badgeDot, { backgroundColor: colors.warning + "20", borderColor: colors.warning + "40" }]}>
                  <Feather name="award" size={12} color={colors.warning} />
                </View>
              ))}
              {gamification.badges.length > 6 && (
                <View style={[styles.badgeDot, { backgroundColor: colors.mutedForeground + "20" }]}>
                  <Text style={[styles.badgeMore, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>
                    +{gamification.badges.length - 6}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Premium CTA (free users only) */}
        {!isPro && (
          <TouchableOpacity
            style={[styles.premiumCTA, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "40" }]}
            onPress={() => router.push("/premium")}
            activeOpacity={0.85}
          >
            <View style={[styles.premiumCTALeft, { gap: 10 }]}>
              <Text style={styles.premiumCTAEmoji}>⚡</Text>
              <View>
                <Text style={[styles.premiumCTATitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
                  Unlock Pro Features
                </Text>
                <Text style={[styles.premiumCTASub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                  +25% XP · AI coaching · Muscle ranks
                </Text>
              </View>
            </View>
            <View style={[styles.premiumCTABtn, { backgroundColor: colors.primary }]}>
              <Text style={[styles.premiumCTABtnText, { fontFamily: "Inter_700Bold" }]}>Upgrade</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Today Stats */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>
          TODAY'S STATS
        </Text>

        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
        ) : (
          <View style={styles.statsGrid}>
            <StatCard
              icon="trending-up"
              label="Steps"
              value={(summary?.todaySteps ?? 0).toLocaleString()}
              sub={`${Math.round(stepsGoalPct * 100)}% of goal`}
              color={colors.primary}
              progress={stepsGoalPct}
              colors={colors}
            />
            <StatCard
              icon="zap"
              label="Burned"
              value={String(summary?.todayCaloriesBurned ?? 0)}
              sub="kcal"
              color={colors.orange}
              progress={burnGoalPct}
              colors={colors}
            />
            <StatCard
              icon="coffee"
              label="Consumed"
              value={String(summary?.todayCaloriesConsumed ?? 0)}
              sub="kcal"
              color={colors.success}
              progress={consumeGoalPct}
              colors={colors}
            />
            <StatCard
              icon="bar-chart-2"
              label="This Week"
              value={((summary?.weeklySteps ?? 0) / 1000).toFixed(1)}
              sub="K steps"
              color={colors.info}
              progress={Math.min((summary?.weeklySteps ?? 0) / (goals.dailySteps * 7), 1)}
              colors={colors}
            />
          </View>
        )}

        {/* Daily Goals */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>
          DAILY GOALS
        </Text>
        <View style={[styles.goalsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
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
            label="Calorie Intake"
            current={summary?.todayCaloriesConsumed ?? 0}
            goal={goals.dailyCaloriesConsumed}
            color={colors.success}
            unit="kcal"
            colors={colors}
          />
        </View>

        {/* Recent Activity */}
        {(summary?.recentActivities ?? []).length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>
              RECENT ACTIVITY
            </Text>
            <View style={[styles.recentCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {(summary?.recentActivities ?? []).slice(0, 3).map((a) => (
                <View key={a.id} style={styles.recentRow}>
                  <View style={[styles.recentIcon, { backgroundColor: colors.primary + "20" }]}>
                    <Feather name="activity" size={14} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.recentTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                      {a.note ?? "Workout"}
                    </Text>
                    <Text style={[styles.recentSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                      {a.steps.toLocaleString()} steps · {a.caloriesBurned} kcal
                    </Text>
                  </View>
                  <Text style={[styles.recentDate, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                    {a.date}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function StatCard({
  icon, label, value, sub, color, progress, colors,
}: {
  icon: string; label: string; value: string; sub: string;
  color: string; progress: number;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.statIcon, { backgroundColor: color + "20" }]}>
        <Feather name={icon as any} size={18} color={color} />
      </View>
      <Text style={[styles.statValue, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{label}</Text>
      <View style={[styles.statBar, { backgroundColor: colors.border }]}>
        <View style={[styles.statBarFill, { width: `${progress * 100}%` as any, backgroundColor: color }]} />
      </View>
      <Text style={[styles.statSub, { color: color, fontFamily: "Inter_500Medium" }]}>{sub}</Text>
    </View>
  );
}

function GoalRow({
  label, current, goal, color, unit, colors,
}: {
  label: string; current: number; goal: number; color: string; unit: string;
  colors: ReturnType<typeof useColors>;
}) {
  const pct = Math.min(current / goal, 1);
  return (
    <View style={styles.goalRow}>
      <View style={styles.goalRowTop}>
        <Text style={[styles.goalLabel, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>{label}</Text>
        <Text style={[styles.goalValue, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
          <Text style={{ color: colors.foreground, fontFamily: "Inter_700Bold" }}>
            {current.toLocaleString()}
          </Text>
          {" "}/{" "}{goal.toLocaleString()}{unit ? ` ${unit}` : ""}
        </Text>
      </View>
      <View style={[styles.goalBar, { backgroundColor: colors.border }]}>
        <View style={[styles.goalBarFill, { width: `${pct * 100}%` as any, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  greeting: { fontSize: 13, marginBottom: 4 },
  title: { fontSize: 26 },
  xpChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 4,
  },
  xpChipText: { fontSize: 13 },

  rankCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    marginBottom: 24,
    overflow: "hidden",
    gap: 14,
  },
  rankCardInner: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  rankGlow: {
    position: "absolute",
    top: -40,
    right: -40,
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  rankLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  rankEmoji: { fontSize: 36 },
  rankName: { fontSize: 20 },
  rankLevel: { fontSize: 13, marginTop: 2 },
  rankRight: { alignItems: "flex-end", gap: 2 },
  rankNextLabel: { fontSize: 12 },
  rankXPLeft: { fontSize: 14 },
  mythicBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  mythicText: { fontSize: 12 },
  rankBarRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  rankBarTrack: { flex: 1, height: 6, borderRadius: 3, overflow: "hidden" },
  rankBarFill: { height: 6, borderRadius: 3 },
  rankBarPct: { fontSize: 12, width: 36, textAlign: "right" },
  badgeStrip: { flexDirection: "row", gap: 6 },
  badgeDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeMore: { fontSize: 10 },

  sectionLabel: { fontSize: 11, letterSpacing: 1.2, marginBottom: 10, marginTop: 4 },

  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 24 },
  statCard: {
    width: "47.5%",
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 6,
  },
  statIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  statValue: { fontSize: 24 },
  statLabel: { fontSize: 12 },
  statBar: { height: 3, borderRadius: 2, overflow: "hidden", marginTop: 2 },
  statBarFill: { height: 3, borderRadius: 2 },
  statSub: { fontSize: 11, marginTop: 2 },

  goalsCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 24, gap: 4 },
  divider: { height: 1, marginVertical: 4 },
  goalRow: { paddingVertical: 8, gap: 8 },
  goalRowTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  goalLabel: { fontSize: 14 },
  goalValue: { fontSize: 13 },
  goalBar: { height: 4, borderRadius: 2, overflow: "hidden" },
  goalBarFill: { height: 4, borderRadius: 2 },

  recentCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12, marginBottom: 16 },
  recentRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  recentIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  recentTitle: { fontSize: 14 },
  recentSub: { fontSize: 12, marginTop: 2 },
  recentDate: { fontSize: 11 },

  premiumCTA: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 24,
  },
  premiumCTALeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  premiumCTAEmoji: { fontSize: 26, marginRight: 10 },
  premiumCTATitle: { fontSize: 15 },
  premiumCTASub: { fontSize: 12, marginTop: 2 },
  premiumCTABtn: { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  premiumCTABtnText: { color: "#fff", fontSize: 13 },
});
