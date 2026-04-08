import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  Switch,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import {
  useApp,
  XP_PER_LEVEL,
  getRank,
  getNextRank,
  getRankProgress,
  RANKS,
  MUSCLE_GROUPS,
  getMuscleRank,
  SUBSCRIPTION_PLANS,
} from "@/context/AppContext";
import { useUpdateGoals } from "@workspace/api-client-react";

const TAB_BAR_HEIGHT = Platform.OS === "web" ? 84 : 70;
const FITNESS_LEVELS = ["beginner", "intermediate", "advanced"] as const;

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { goals, setGoals, darkMode, toggleDarkMode, profile, setProfile, gamification, subscription, isPro, isElite } = useApp();

  const [editingGoals, setEditingGoals] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [stepGoal, setStepGoal] = useState(String(goals.dailySteps));
  const [burnGoal, setBurnGoal] = useState(String(goals.dailyCaloriesBurned));
  const [consumeGoal, setConsumeGoal] = useState(String(goals.dailyCaloriesConsumed));
  const [nameInput, setNameInput] = useState(profile.name);
  const [weightInput, setWeightInput] = useState(String(profile.weightKg));
  const [heightInput, setHeightInput] = useState(String(profile.heightCm));
  const [fitnessLevel, setFitnessLevel] = useState(profile.fitnessLevel);

  const rank = getRank(gamification.xp);
  const nextRank = getNextRank(gamification.xp);
  const rankProgress = getRankProgress(gamification.xp);
  const topPad = Platform.OS === "web" ? 67 : insets.top + 16;

  const updateGoalsMutation = useUpdateGoals({
    mutation: {
      onSuccess: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setEditingGoals(false);
      },
    },
  });

  const handleSaveGoals = () => {
    const s = parseInt(stepGoal, 10);
    const b = parseFloat(burnGoal);
    const c = parseFloat(consumeGoal);
    if (!s || !b || !c) { Alert.alert("Validation", "Fill in all values"); return; }
    const g = { dailySteps: s, dailyCaloriesBurned: b, dailyCaloriesConsumed: c };
    setGoals(g);
    updateGoalsMutation.mutate({ data: g });
  };

  const handleSaveProfile = () => {
    setProfile({ name: nameInput, weightKg: parseFloat(weightInput) || 70, heightCm: parseFloat(heightInput) || 170, fitnessLevel });
    setEditingProfile(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: topPad, paddingBottom: TAB_BAR_HEIGHT + 24 + (Platform.OS === "web" ? 34 : 0) },
        ]}
      >
        <Text style={[styles.title, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Profile</Text>

        {/* Subscription Banner */}
        {!isPro ? (
          <TouchableOpacity
            style={[styles.upgradeBanner, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "40" }]}
            onPress={() => router.push("/premium")}
            activeOpacity={0.85}
          >
            <View style={styles.upgradeBannerLeft}>
              <Text style={styles.upgradeEmoji}>⚡</Text>
              <View>
                <Text style={[styles.upgradeTitle, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>
                  Upgrade to Pro
                </Text>
                <Text style={[styles.upgradeSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                  Unlimited AI · +25% XP boost · Muscle ranks
                </Text>
              </View>
            </View>
            <Feather name="chevron-right" size={18} color={colors.primary} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.proBanner, {
              backgroundColor: isElite ? colors.warning + "15" : colors.primary + "15",
              borderColor: isElite ? colors.warning + "40" : colors.primary + "40",
            }]}
            onPress={() => router.push("/premium")}
            activeOpacity={0.85}
          >
            <Text style={styles.proBannerEmoji}>{isElite ? "👑" : "⚡"}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.proBannerTitle, { color: isElite ? colors.warning : colors.primary, fontFamily: "Inter_700Bold" }]}>
                {isElite ? "Elite" : "Pro"} Member
              </Text>
              <Text style={[styles.proBannerSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                {subscription.plan === "yearly" ? "Yearly" : "Monthly"} · Renews {new Date(subscription.expiresAt!).toLocaleDateString()}
              </Text>
            </View>
            <View style={[styles.xpBoostBadge, { backgroundColor: colors.success + "20" }]}>
              <Text style={[styles.xpBoostText, { color: colors.success, fontFamily: "Inter_700Bold" }]}>
                +{isElite ? "50" : "25"}% XP
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Rank Hero */}
        <View style={[styles.rankHero, { backgroundColor: colors.card, borderColor: rank.color + "40" }]}>
          <View style={[styles.rankGlow, { backgroundColor: rank.color + "10" }]} />
          <View style={styles.rankTop}>
            <View style={[styles.rankAvatar, { backgroundColor: rank.color + "20", borderColor: rank.color + "50" }]}>
              <Text style={styles.rankEmoji}>{rank.emoji}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rankName, { color: rank.color, fontFamily: "Inter_700Bold" }]}>
                {rank.name} Rank
              </Text>
              {profile.name ? (
                <Text style={[styles.playerName, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                  {profile.name}
                </Text>
              ) : null}
              <Text style={[styles.rankMeta, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                Level {gamification.level}  ·  {gamification.xp.toLocaleString()} XP
              </Text>
            </View>
          </View>
          <View style={[styles.rankBarTrack, { backgroundColor: colors.border }]}>
            <View style={[styles.rankBarFill, { width: `${rankProgress * 100}%` as any, backgroundColor: rank.color }]} />
          </View>
          {nextRank ? (
            <Text style={[styles.rankXPLeft, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              {nextRank.minXP - gamification.xp} XP to {nextRank.emoji} {nextRank.name}
            </Text>
          ) : null}
          <View style={styles.allRanks}>
            {RANKS.map((r) => {
              const unlocked = gamification.xp >= r.minXP;
              return (
                <View key={r.name} style={styles.rankPip}>
                  <Text style={[styles.rankPipEmoji, { opacity: unlocked ? 1 : 0.25 }]}>{r.emoji}</Text>
                  <Text style={[styles.rankPipLabel, { color: unlocked ? r.color : colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
                    {r.name}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Muscle Group Ranks */}
        {isPro && (
          <>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>
              MUSCLE RANKS
            </Text>
            <View style={[styles.muscleCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {MUSCLE_GROUPS.map((mg, i) => {
                const xp = gamification.muscleXP[mg.id] ?? 0;
                const mRank = getMuscleRank(xp);
                const nextMRank = getNextRank(xp / 3);
                const pct = xp > 0 ? getRankProgress(xp / 3) : 0;
                return (
                  <View key={mg.id}>
                    {i > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
                    <View style={styles.muscleRow}>
                      <View style={[styles.muscleIconWrap, { backgroundColor: mg.color + "20" }]}>
                        <Text style={styles.muscleEmoji}>{mg.emoji}</Text>
                      </View>
                      <View style={{ flex: 1, gap: 4 }}>
                        <View style={styles.muscleLabelRow}>
                          <Text style={[styles.muscleLabel, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                            {mg.label}
                          </Text>
                          <View style={styles.muscleRankRow}>
                            <Text style={[styles.muscleRankEmoji]}>{mRank.emoji}</Text>
                            <Text style={[styles.muscleRankName, { color: mRank.color, fontFamily: "Inter_600SemiBold" }]}>
                              {mRank.name}
                            </Text>
                          </View>
                        </View>
                        <View style={[styles.muscleBar, { backgroundColor: colors.border }]}>
                          <View style={[styles.muscleBarFill, {
                            width: `${Math.max(pct * 100, xp > 0 ? 4 : 0)}%` as any,
                            backgroundColor: mg.color,
                          }]} />
                        </View>
                        <Text style={[styles.muscleXP, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                          {xp} XP{nextMRank ? ` · ${nextMRank.minXP * 3 - xp} to ${nextMRank.name}` : " · MAX"}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}

        {!isPro && (
          <TouchableOpacity
            style={[styles.muscleLockedCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push("/premium")}
          >
            <View style={[styles.lockIcon, { backgroundColor: colors.primary + "20" }]}>
              <Feather name="lock" size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.lockTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                Muscle Group Ranks
              </Text>
              <Text style={[styles.lockSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                Track individual ranks for 7 muscle groups — Pro feature
              </Text>
            </View>
            <View style={[styles.proBadge, { backgroundColor: colors.primary }]}>
              <Text style={[styles.proBadgeText, { fontFamily: "Inter_700Bold" }]}>PRO</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Badges */}
        {gamification.badges.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>
              BADGES ({gamification.badges.length})
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
              <View style={styles.badgesRow}>
                {gamification.badges.map((badge) => (
                  <View key={badge.id} style={[styles.badge, { backgroundColor: colors.card, borderColor: colors.warning + "40" }]}>
                    <View style={[styles.badgeIcon, { backgroundColor: colors.warning + "20" }]}>
                      <Feather name="award" size={22} color={colors.warning} />
                    </View>
                    <Text style={[styles.badgeName, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                      {badge.name}
                    </Text>
                    <Text style={[styles.badgeDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                      {badge.description}
                    </Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </>
        )}

        {/* Profile card */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>My Profile</Text>
            <TouchableOpacity onPress={() => setEditingProfile(!editingProfile)}>
              <Feather name={editingProfile ? "x" : "edit-2"} size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>
          {editingProfile ? (
            <View style={{ gap: 10 }}>
              <FieldInput label="Name" value={nameInput} onChangeText={setNameInput} colors={colors} keyboardType="default" />
              <FieldInput label="Weight (kg)" value={weightInput} onChangeText={setWeightInput} colors={colors} keyboardType="numeric" />
              <FieldInput label="Height (cm)" value={heightInput} onChangeText={setHeightInput} colors={colors} keyboardType="numeric" />
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Fitness Level</Text>
              <View style={styles.fitnessRow}>
                {FITNESS_LEVELS.map((lvl) => (
                  <TouchableOpacity key={lvl} onPress={() => setFitnessLevel(lvl)}
                    style={[styles.fitnessBtn, { backgroundColor: fitnessLevel === lvl ? colors.primary : colors.secondary, borderColor: fitnessLevel === lvl ? colors.primary : colors.border }]}>
                    <Text style={[styles.fitnessBtnText, { color: fitnessLevel === lvl ? "#fff" : colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
                      {lvl.charAt(0).toUpperCase() + lvl.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={handleSaveProfile}>
                <Text style={[styles.saveBtnText, { fontFamily: "Inter_600SemiBold" }]}>Save Profile</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ gap: 8 }}>
              <ProfileRow icon="user" label="Name" value={profile.name || "Not set"} color={colors.primary} colors={colors} />
              <ProfileRow icon="trending-up" label="Weight" value={`${profile.weightKg} kg`} color={colors.orange} colors={colors} />
              <ProfileRow icon="maximize" label="Height" value={`${profile.heightCm} cm`} color={colors.success} colors={colors} />
              <ProfileRow icon="zap" label="Fitness Level" value={profile.fitnessLevel} color={colors.info} colors={colors} />
            </View>
          )}
        </View>

        {/* Goals card */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 14 }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>Daily Goals</Text>
            <TouchableOpacity onPress={() => setEditingGoals(!editingGoals)}>
              <Feather name={editingGoals ? "x" : "edit-2"} size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>
          <GoalRow icon="trending-up" label="Steps" value={editingGoals ? stepGoal : String(goals.dailySteps)} onChangeText={setStepGoal} editable={editingGoals} color={colors.primary} colors={colors} />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <GoalRow icon="zap" label="Calories Burned" value={editingGoals ? burnGoal : String(goals.dailyCaloriesBurned)} onChangeText={setBurnGoal} editable={editingGoals} color={colors.orange} colors={colors} unit="kcal" />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <GoalRow icon="coffee" label="Calorie Intake" value={editingGoals ? consumeGoal : String(goals.dailyCaloriesConsumed)} onChangeText={setConsumeGoal} editable={editingGoals} color={colors.success} colors={colors} unit="kcal" />
          {editingGoals && (
            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary, marginTop: 12 }]} onPress={handleSaveGoals} disabled={updateGoalsMutation.isPending}>
              {updateGoalsMutation.isPending ? <ActivityIndicator color="#fff" /> : <Text style={[styles.saveBtnText, { fontFamily: "Inter_600SemiBold" }]}>Save Goals</Text>}
            </TouchableOpacity>
          )}
        </View>

        {/* Settings */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 14 }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold", marginBottom: 8 }]}>Settings</Text>
          <View style={styles.settingRow}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Feather name="moon" size={18} color={colors.info} />
              <Text style={[styles.settingLabel, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}>Dark Mode</Text>
            </View>
            <Switch value={darkMode} onValueChange={toggleDarkMode} trackColor={{ false: colors.border, true: colors.primary }} thumbColor="#fff" />
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <TouchableOpacity style={styles.settingRow} onPress={() => router.push("/premium")}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Feather name="star" size={18} color={colors.warning} />
              <Text style={[styles.settingLabel, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}>Manage Subscription</Text>
            </View>
            <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

function ProfileRow({ icon, label, value, color, colors }: { icon: string; label: string; value: string; color: string; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={styles.profileRow}>
      <View style={[styles.profileIcon, { backgroundColor: color + "20" }]}><Feather name={icon as any} size={14} color={color} /></View>
      <Text style={[styles.profileLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{label}</Text>
      <Text style={[styles.profileValue, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>{value}</Text>
    </View>
  );
}

function FieldInput({ label, value, onChangeText, colors, keyboardType }: { label: string; value: string; onChangeText: (v: string) => void; colors: ReturnType<typeof useColors>; keyboardType: any }) {
  return (
    <View>
      <Text style={[styles.fieldLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{label}</Text>
      <TextInput style={[styles.textInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.secondary, fontFamily: "Inter_400Regular" }]} value={value} onChangeText={onChangeText} keyboardType={keyboardType} />
    </View>
  );
}

function GoalRow({ icon, label, value, onChangeText, editable, color, colors, unit = "" }: { icon: string; label: string; value: string; onChangeText: (v: string) => void; editable: boolean; color: string; colors: ReturnType<typeof useColors>; unit?: string }) {
  return (
    <View style={styles.goalRow}>
      <View style={[styles.goalIcon, { backgroundColor: color + "20" }]}><Feather name={icon as any} size={14} color={color} /></View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.goalLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{label}</Text>
        {editable ? (
          <TextInput style={[styles.goalInput, { color: colors.foreground, borderColor: colors.border, fontFamily: "Inter_600SemiBold" }]} value={value} onChangeText={onChangeText} keyboardType="numeric" />
        ) : (
          <Text style={[styles.goalValue, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
            {parseInt(value, 10).toLocaleString()}{unit ? ` ${unit}` : ""}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20 },
  title: { fontSize: 26, marginBottom: 20 },
  sectionLabel: { fontSize: 11, letterSpacing: 1.2, marginBottom: 10, marginTop: 4 },

  upgradeBanner: {
    flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 20,
  },
  upgradeBannerLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  upgradeEmoji: { fontSize: 24 },
  upgradeTitle: { fontSize: 16 },
  upgradeSub: { fontSize: 12, marginTop: 2 },

  proBanner: {
    flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 20,
  },
  proBannerEmoji: { fontSize: 24 },
  proBannerTitle: { fontSize: 16 },
  proBannerSub: { fontSize: 12, marginTop: 2 },
  xpBoostBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  xpBoostText: { fontSize: 12 },

  rankHero: { borderRadius: 20, borderWidth: 1, padding: 20, marginBottom: 24, gap: 14, overflow: "hidden" },
  rankGlow: { position: "absolute", top: -60, right: -60, width: 200, height: 200, borderRadius: 100 },
  rankTop: { flexDirection: "row", alignItems: "center", gap: 14 },
  rankAvatar: { width: 68, height: 68, borderRadius: 34, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  rankEmoji: { fontSize: 32 },
  rankName: { fontSize: 20 },
  playerName: { fontSize: 16, marginTop: 2 },
  rankMeta: { fontSize: 13, marginTop: 4 },
  rankBarTrack: { height: 8, borderRadius: 4, overflow: "hidden" },
  rankBarFill: { height: 8, borderRadius: 4 },
  rankXPLeft: { fontSize: 12 },
  allRanks: { flexDirection: "row", justifyContent: "space-between" },
  rankPip: { alignItems: "center", gap: 3 },
  rankPipEmoji: { fontSize: 16 },
  rankPipLabel: { fontSize: 9 },

  muscleCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 24, gap: 4 },
  muscleRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10 },
  muscleIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  muscleEmoji: { fontSize: 18 },
  muscleLabelRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  muscleLabel: { fontSize: 14 },
  muscleRankRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  muscleRankEmoji: { fontSize: 12 },
  muscleRankName: { fontSize: 12 },
  muscleBar: { height: 4, borderRadius: 2, overflow: "hidden" },
  muscleBarFill: { height: 4, borderRadius: 2 },
  muscleXP: { fontSize: 11 },

  muscleLockedCard: { borderRadius: 16, borderWidth: 1, borderStyle: "dashed", padding: 16, marginBottom: 24, flexDirection: "row", alignItems: "center", gap: 14 },
  lockIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  lockTitle: { fontSize: 15 },
  lockSub: { fontSize: 12, marginTop: 2, lineHeight: 16 },
  proBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  proBadgeText: { color: "#fff", fontSize: 11 },

  badgesRow: { flexDirection: "row", gap: 10, paddingRight: 20 },
  badge: { width: 110, borderRadius: 14, borderWidth: 1, padding: 12, alignItems: "center", gap: 6 },
  badgeIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  badgeName: { fontSize: 12, textAlign: "center" },
  badgeDesc: { fontSize: 10, textAlign: "center", lineHeight: 14 },

  card: { borderRadius: 16, borderWidth: 1, padding: 16 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  cardTitle: { fontSize: 16 },
  divider: { height: 1, marginVertical: 4 },

  profileRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 6 },
  profileIcon: { width: 30, height: 30, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  profileLabel: { flex: 1, fontSize: 13 },
  profileValue: { fontSize: 14 },

  fieldLabel: { fontSize: 12, marginBottom: 4 },
  textInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
  fitnessRow: { flexDirection: "row", gap: 8 },
  fitnessBtn: { flex: 1, borderWidth: 1, borderRadius: 10, paddingVertical: 8, alignItems: "center" },
  fitnessBtnText: { fontSize: 12 },

  goalRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8 },
  goalIcon: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  goalLabel: { fontSize: 12 },
  goalValue: { fontSize: 15, marginTop: 2 },
  goalInput: { fontSize: 15, marginTop: 2, borderBottomWidth: 1, paddingBottom: 2 },

  saveBtn: { borderRadius: 10, paddingVertical: 12, alignItems: "center" },
  saveBtnText: { color: "#fff", fontSize: 15 },

  settingRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 10 },
  settingLabel: { fontSize: 15 },
});
