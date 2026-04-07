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
import { useApp } from "@/context/AppContext";
import { useUpdateGoals } from "@workspace/api-client-react";
import { useRouter } from "expo-router";

const TAB_BAR_HEIGHT = Platform.OS === "web" ? 84 : 70;

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { goals, setGoals, darkMode, toggleDarkMode, adminToken, setAdminToken } = useApp();
  const router = useRouter();

  const [stepGoal, setStepGoal] = useState(String(goals.dailySteps));
  const [burnGoal, setBurnGoal] = useState(String(goals.dailyCaloriesBurned));
  const [consumeGoal, setConsumeGoal] = useState(String(goals.dailyCaloriesConsumed));
  const [editing, setEditing] = useState(false);

  const updateGoalsMutation = useUpdateGoals({
    mutation: {
      onSuccess: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setEditing(false);
      },
    },
  });

  const handleSaveGoals = () => {
    const s = parseInt(stepGoal, 10);
    const b = parseFloat(burnGoal);
    const c = parseFloat(consumeGoal);
    if (!s || !b || !c) {
      Alert.alert("Validation", "Please fill in all goal values");
      return;
    }
    const newGoals = { dailySteps: s, dailyCaloriesBurned: b, dailyCaloriesConsumed: c };
    setGoals(newGoals);
    updateGoalsMutation.mutate({ data: newGoals });
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
        <Text style={[styles.title, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
          Profile
        </Text>

        {/* Goals Section */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
              Daily Goals
            </Text>
            <TouchableOpacity onPress={() => setEditing(!editing)}>
              <Feather name={editing ? "x" : "edit-2"} size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <GoalRow
            icon="trending-up"
            label="Steps Goal"
            value={editing ? stepGoal : String(goals.dailySteps)}
            onChangeText={setStepGoal}
            editable={editing}
            color={colors.primary}
            colors={colors}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <GoalRow
            icon="zap"
            label="Calories to Burn"
            value={editing ? burnGoal : String(goals.dailyCaloriesBurned)}
            onChangeText={setBurnGoal}
            editable={editing}
            color={colors.orange}
            colors={colors}
            unit="kcal"
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <GoalRow
            icon="coffee"
            label="Calorie Intake"
            value={editing ? consumeGoal : String(goals.dailyCaloriesConsumed)}
            onChangeText={setConsumeGoal}
            editable={editing}
            color={colors.success}
            colors={colors}
            unit="kcal"
          />

          {editing && (
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: colors.primary }]}
              onPress={handleSaveGoals}
              disabled={updateGoalsMutation.isPending}
            >
              {updateGoalsMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={[styles.saveBtnText, { fontFamily: "Inter_600SemiBold" }]}>Save Goals</Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Settings */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 16 }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
            Settings
          </Text>
          <View style={styles.settingRow}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Feather name="moon" size={18} color={colors.info} />
              <Text style={[styles.settingLabel, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}>
                Dark Mode
              </Text>
            </View>
            <Switch
              value={darkMode}
              onValueChange={toggleDarkMode}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Admin Section */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 16 }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
            Admin
          </Text>
          {adminToken ? (
            <>
              <View style={styles.settingRow}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <Feather name="shield" size={18} color={colors.success} />
                  <Text style={[styles.settingLabel, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}>
                    Logged in as Admin
                  </Text>
                </View>
                <Feather name="check-circle" size={18} color={colors.success} />
              </View>
              <TouchableOpacity
                style={[styles.adminBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]}
                onPress={() => router.push("/admin/index")}
              >
                <Feather name="bar-chart-2" size={16} color={colors.foreground} />
                <Text style={[styles.adminBtnText, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>
                  Open Admin Dashboard
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.adminBtn, { backgroundColor: colors.destructive + "15", borderColor: colors.destructive + "40" }]}
                onPress={() => {
                  setAdminToken(null);
                  Alert.alert("Logged out", "Admin session ended");
                }}
              >
                <Feather name="log-out" size={16} color={colors.destructive} />
                <Text style={[styles.adminBtnText, { color: colors.destructive, fontFamily: "Inter_500Medium" }]}>
                  Logout Admin
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={[styles.adminBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]}
              onPress={() => router.push("/admin/login")}
            >
              <Feather name="shield" size={16} color={colors.foreground} />
              <Text style={[styles.adminBtnText, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>
                Admin Login
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function GoalRow({
  icon, label, value, onChangeText, editable, color, colors, unit = "",
}: {
  icon: string;
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  editable: boolean;
  color: string;
  colors: ReturnType<typeof useColors>;
  unit?: string;
}) {
  return (
    <View style={styles.goalRow}>
      <View style={[styles.goalIcon, { backgroundColor: color + "20" }]}>
        <Feather name={icon as any} size={16} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.goalLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
          {label}
        </Text>
        {editable ? (
          <TextInput
            style={[styles.goalInput, { color: colors.foreground, borderColor: colors.border, fontFamily: "Inter_600SemiBold" }]}
            value={value}
            onChangeText={onChangeText}
            keyboardType="numeric"
          />
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
  section: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 4 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle: { fontSize: 16 },
  divider: { height: 1, marginVertical: 4 },
  goalRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8 },
  goalIcon: { width: 34, height: 34, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  goalLabel: { fontSize: 12 },
  goalValue: { fontSize: 16, marginTop: 2 },
  goalInput: {
    fontSize: 16,
    marginTop: 2,
    borderBottomWidth: 1,
    paddingBottom: 2,
  },
  saveBtn: { borderRadius: 10, paddingVertical: 12, alignItems: "center", marginTop: 12 },
  saveBtnText: { color: "#fff", fontSize: 15 },
  settingRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 8 },
  settingLabel: { fontSize: 15 },
  adminBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
  },
  adminBtnText: { fontSize: 14 },
});
