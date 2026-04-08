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
  ALL_BADGES,
} from "@/context/AppContext";
import { useUpdateGoals } from "@workspace/api-client-react";

const TAB_BAR_HEIGHT = Platform.OS === "web" ? 84 : 70;
const FITNESS_LEVELS = ["beginner", "intermediate", "advanced"] as const;

const RANK_ICONS: Record<string, string> = {
  Bronze: "🥉", Silver: "🥈", Gold: "🥇",
  Platinum: "💎", Diamond: "💠", Mythic: "⚡",
};

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { goals, setGoals, darkMode, toggleDarkMode, profile, setProfile, gamification } = useApp();

  const [stepGoal, setStepGoal] = useState(String(goals.dailySteps));
  const [burnGoal, setBurnGoal] = useState(String(goals.dailyCaloriesBurned));
  const [consumeGoal, setConsumeGoal] = useState(String(goals.dailyCaloriesConsumed));
  const [editingGoals, setEditingGoals] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);

  const [nameInput, setNameInput] = useState(profile.name);
  const [weightInput, setWeightInput] = useState(String(profile.weightKg));
  const [heightInput, setHeightInput] = useState(String(profile.heightCm));
  const [fitnessLevel, setFitnessLevel] = useState(profile.fitnessLevel);

  const rank = getRank(gamification.xp);
  const nextRank = getNextRank(gamification.xp);
  const rankProgress = getRankProgress(gamification.xp);
  const xpInCurrentLevel = gamification.xp % XP_PER_LEVEL;
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
    if (!s || !b || !c) { Alert.alert("Validation", "Fill in all goal values"); return; }
    const newGoals = { dailySteps: s, dailyCaloriesBurned: b, dailyCaloriesConsumed: c };
    setGoals(newGoals);
    updateGoalsMutation.mutate({ data: newGoals });
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

        {/* Rank Hero Card */}
        <View style={[styles.rankHero, { backgroundColor: colors.card, borderColor: rank.color + "40" }]}>
          <View style={[styles.rankGlow, { backgroundColor: rank.color + "12" }]} />
          <View style={styles.rankTop}>
            <View style={styles.rankAvatarWrap}>
              <View style={[styles.rankAvatar, { backgroundColor: rank.color + "20", borderColor: rank.color + "50" }]}>
                <Text style={styles.rankAvatarEmoji}>{RANK_ICONS[rank.name]}</Text>
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rankTitle, { color: rank.color, fontFamily: "Inter_700Bold" }]}>
                {rank.name} Rank
              </Text>
              {profile.name ? (
                <Text style={[styles.rankPlayerName, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                  {profile.name}
                </Text>
              ) : null}
              <Text style={[styles.rankSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                Level {gamification.level}  ·  {gamification.xp.toLocaleString()} XP
              </Text>
            </View>
          </View>

          {/* Rank progress */}
          <View style={{ gap: 6 }}>
            <View style={styles.rankBarRow}>
              <Text style={[styles.rankBarLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                {rank.name}
              </Text>
              <Text style={[styles.rankBarLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                {nextRank ? nextRank.name : "MAX"}
              </Text>
            </View>
            <View style={[styles.rankBarTrack, { backgroundColor: colors.border }]}>
              <View style={[styles.rankBarFill, { width: `${rankProgress * 100}%` as any, backgroundColor: rank.color }]} />
            </View>
            {nextRank && (
              <Text style={[styles.rankXPLeft, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                {nextRank.minXP - gamification.xp} XP to {nextRank.name}
              </Text>
            )}
          </View>

          {/* All ranks */}
          <View style={styles.allRanks}>
            {RANKS.map((r) => {
              const unlocked = gamification.xp >= r.minXP;
              return (
                <View key={r.name} style={styles.rankPip}>
                  <View style={[styles.rankPipDot, {
                    backgroundColor: unlocked ? r.color : colors.border,
                    shadowColor: unlocked ? r.color : "transparent",
                    shadowRadius: unlocked ? 6 : 0,
                    shadowOpacity: unlocked ? 0.8 : 0,
                    elevation: unlocked ? 3 : 0,
                  }]} />
                  <Text style={[styles.rankPipLabel, {
                    color: unlocked ? r.color : colors.mutedForeground,
                    fontFamily: unlocked ? "Inter_600SemiBold" : "Inter_400Regular",
                  }]}>
                    {r.name}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

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
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>My Profile</Text>
            <TouchableOpacity onPress={() => setEditingProfile(!editingProfile)}>
              <Feather name={editingProfile ? "x" : "edit-2"} size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>
          {editingProfile ? (
            <View style={{ gap: 10 }}>
              <InputField label="Name" value={nameInput} onChangeText={setNameInput} colors={colors} keyboardType="default" />
              <InputField label="Weight (kg)" value={weightInput} onChangeText={setWeightInput} colors={colors} keyboardType="numeric" />
              <InputField label="Height (cm)" value={heightInput} onChangeText={setHeightInput} colors={colors} keyboardType="numeric" />
              <Text style={[styles.inputLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Fitness Level</Text>
              <View style={styles.fitnessRow}>
                {FITNESS_LEVELS.map((level) => (
                  <TouchableOpacity
                    key={level}
                    onPress={() => setFitnessLevel(level)}
                    style={[styles.fitnessBtn, {
                      backgroundColor: fitnessLevel === level ? colors.primary : colors.secondary,
                      borderColor: fitnessLevel === level ? colors.primary : colors.border,
                    }]}
                  >
                    <Text style={[styles.fitnessBtnText, {
                      color: fitnessLevel === level ? "#fff" : colors.mutedForeground,
                      fontFamily: "Inter_500Medium",
                    }]}>
                      {level.charAt(0).toUpperCase() + level.slice(1)}
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
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 14 }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>Daily Goals</Text>
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
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 14 }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold", marginBottom: 8 }]}>Settings</Text>
          <View style={styles.settingRow}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Feather name="moon" size={18} color={colors.info} />
              <Text style={[styles.settingLabel, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}>Dark Mode</Text>
            </View>
            <Switch value={darkMode} onValueChange={toggleDarkMode} trackColor={{ false: colors.border, true: colors.primary }} thumbColor="#fff" />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function ProfileRow({ icon, label, value, color, colors }: { icon: string; label: string; value: string; color: string; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={styles.profileRow}>
      <View style={[styles.profileIcon, { backgroundColor: color + "20" }]}>
        <Feather name={icon as any} size={14} color={color} />
      </View>
      <Text style={[styles.profileLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{label}</Text>
      <Text style={[styles.profileValue, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>{value}</Text>
    </View>
  );
}

function InputField({ label, value, onChangeText, colors, keyboardType }: { label: string; value: string; onChangeText: (v: string) => void; colors: ReturnType<typeof useColors>; keyboardType: any }) {
  return (
    <View>
      <Text style={[styles.inputLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{label}</Text>
      <TextInput style={[styles.textInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.secondary, fontFamily: "Inter_400Regular" }]} value={value} onChangeText={onChangeText} keyboardType={keyboardType} />
    </View>
  );
}

function GoalRow({ icon, label, value, onChangeText, editable, color, colors, unit = "" }: { icon: string; label: string; value: string; onChangeText: (v: string) => void; editable: boolean; color: string; colors: ReturnType<typeof useColors>; unit?: string }) {
  return (
    <View style={styles.goalRow}>
      <View style={[styles.goalIcon, { backgroundColor: color + "20" }]}>
        <Feather name={icon as any} size={14} color={color} />
      </View>
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

  rankHero: { borderRadius: 20, borderWidth: 1, padding: 20, marginBottom: 24, gap: 16, overflow: "hidden" },
  rankGlow: { position: "absolute", top: -60, right: -60, width: 200, height: 200, borderRadius: 100 },
  rankTop: { flexDirection: "row", alignItems: "center", gap: 14 },
  rankAvatarWrap: {},
  rankAvatar: { width: 70, height: 70, borderRadius: 35, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  rankAvatarEmoji: { fontSize: 32 },
  rankTitle: { fontSize: 20 },
  rankPlayerName: { fontSize: 17, marginTop: 2 },
  rankSub: { fontSize: 13, marginTop: 4 },
  rankBarRow: { flexDirection: "row", justifyContent: "space-between" },
  rankBarLabel: { fontSize: 11 },
  rankBarTrack: { height: 8, borderRadius: 4, overflow: "hidden" },
  rankBarFill: { height: 8, borderRadius: 4 },
  rankXPLeft: { fontSize: 12 },
  allRanks: { flexDirection: "row", justifyContent: "space-between" },
  rankPip: { alignItems: "center", gap: 4 },
  rankPipDot: { width: 10, height: 10, borderRadius: 5 },
  rankPipLabel: { fontSize: 9 },

  badgesRow: { flexDirection: "row", gap: 10, paddingRight: 20 },
  badge: { width: 110, borderRadius: 14, borderWidth: 1, padding: 12, alignItems: "center", gap: 6 },
  badgeIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  badgeName: { fontSize: 12, textAlign: "center" },
  badgeDesc: { fontSize: 10, textAlign: "center", lineHeight: 14 },

  section: { borderRadius: 16, borderWidth: 1, padding: 16 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle: { fontSize: 16 },
  divider: { height: 1, marginVertical: 4 },

  profileRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 6 },
  profileIcon: { width: 30, height: 30, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  profileLabel: { flex: 1, fontSize: 13 },
  profileValue: { fontSize: 14 },

  inputLabel: { fontSize: 12, marginBottom: 4 },
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

  settingRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 8 },
  settingLabel: { fontSize: 15 },
});
