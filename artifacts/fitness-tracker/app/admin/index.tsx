import React, { useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import {
  useGetAdminDashboard,
  useAdminGetActivities,
  useAdminGetFoodLogs,
  useAdminDeleteActivity,
  useAdminDeleteFoodLog,
  setAuthTokenGetter,
} from "@workspace/api-client-react";

export default function AdminDashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { adminToken, setAdminToken } = useApp();

  // Set auth token for API calls
  useEffect(() => {
    setAuthTokenGetter(() => adminToken);
  }, [adminToken]);

  const { data: dashboard, isLoading: loadingDash } = useGetAdminDashboard({
    query: { queryKey: ["admin", "dashboard"], enabled: !!adminToken },
  });

  const { data: activities, refetch: refetchActivities } = useAdminGetActivities({
    query: { queryKey: ["admin", "activities"], enabled: !!adminToken },
  });

  const { data: foodLogs, refetch: refetchFoodLogs } = useAdminGetFoodLogs({
    query: { queryKey: ["admin", "food-logs"], enabled: !!adminToken },
  });

  const deleteActivityMutation = useAdminDeleteActivity({
    mutation: {
      onSuccess: () => refetchActivities(),
      onError: () => Alert.alert("Error", "Failed to delete activity"),
    },
  });

  const deleteFoodLogMutation = useAdminDeleteFoodLog({
    mutation: {
      onSuccess: () => refetchFoodLogs(),
      onError: () => Alert.alert("Error", "Failed to delete food log"),
    },
  });

  const handleLogout = () => {
    setAdminToken(null);
    router.replace("/");
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top + 16;

  if (!adminToken) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }]}>
        <Feather name="lock" size={48} color={colors.mutedForeground} />
        <Text style={[styles.accessDenied, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
          Not authorized
        </Text>
        <TouchableOpacity onPress={() => router.push("/admin/login")}>
          <Text style={[{ color: colors.primary, fontFamily: "Inter_600SemiBold", marginTop: 12, fontSize: 16 }]}>
            Login
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: topPad, paddingBottom: 40 + (Platform.OS === "web" ? 34 : 0) },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
            Admin
          </Text>
          <TouchableOpacity onPress={handleLogout} style={[styles.logoutBtn, { backgroundColor: colors.destructive + "15" }]}>
            <Feather name="log-out" size={16} color={colors.destructive} />
          </TouchableOpacity>
        </View>

        {loadingDash ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* Stats Overview */}
            <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
              Overview
            </Text>
            <View style={styles.statsGrid}>
              <AdminStatCard label="Activities" value={dashboard?.totalActivities ?? 0} icon="activity" color={colors.primary} colors={colors} />
              <AdminStatCard label="Food Logs" value={dashboard?.totalFoodLogs ?? 0} icon="coffee" color={colors.success} colors={colors} />
              <AdminStatCard label="Total Steps" value={(dashboard?.totalSteps ?? 0).toLocaleString()} icon="trending-up" color={colors.cyan} colors={colors} />
              <AdminStatCard label="Cal Burned" value={`${dashboard?.totalCaloriesBurned ?? 0}`} icon="zap" color={colors.orange} colors={colors} />
            </View>

            {/* Activities Table */}
            <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold", marginTop: 24 }]}>
              All Activities
            </Text>
            {!activities || activities.length === 0 ? (
              <EmptyState icon="activity" text="No activities logged" colors={colors} />
            ) : (
              <View style={[styles.tableCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.tableHeader, { borderColor: colors.border }]}>
                  <Text style={[styles.th, { color: colors.mutedForeground, fontFamily: "Inter_500Medium", flex: 2 }]}>Date</Text>
                  <Text style={[styles.th, { color: colors.mutedForeground, fontFamily: "Inter_500Medium", flex: 2 }]}>Steps</Text>
                  <Text style={[styles.th, { color: colors.mutedForeground, fontFamily: "Inter_500Medium", flex: 2 }]}>Kcal</Text>
                  <Text style={[styles.th, { color: colors.mutedForeground, fontFamily: "Inter_500Medium", flex: 1 }]}></Text>
                </View>
                {activities.map((a) => (
                  <View key={a.id} style={[styles.tableRow, { borderColor: colors.border }]}>
                    <Text style={[styles.td, { color: colors.foreground, fontFamily: "Inter_400Regular", flex: 2 }]}>
                      {a.date}
                    </Text>
                    <Text style={[styles.td, { color: colors.foreground, fontFamily: "Inter_400Regular", flex: 2 }]}>
                      {a.steps.toLocaleString()}
                    </Text>
                    <Text style={[styles.td, { color: colors.foreground, fontFamily: "Inter_400Regular", flex: 2 }]}>
                      {a.caloriesBurned}
                    </Text>
                    <TouchableOpacity
                      style={{ flex: 1, alignItems: "center" }}
                      onPress={() => {
                        Alert.alert("Delete", "Remove this activity?", [
                          { text: "Cancel" },
                          { text: "Delete", style: "destructive", onPress: () => deleteActivityMutation.mutate(a.id) },
                        ]);
                      }}
                    >
                      <Feather name="trash-2" size={15} color={colors.destructive} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Food Logs Table */}
            <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold", marginTop: 24 }]}>
              All Food Logs
            </Text>
            {!foodLogs || foodLogs.length === 0 ? (
              <EmptyState icon="coffee" text="No food logs yet" colors={colors} />
            ) : (
              <View style={[styles.tableCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.tableHeader, { borderColor: colors.border }]}>
                  <Text style={[styles.th, { color: colors.mutedForeground, fontFamily: "Inter_500Medium", flex: 3 }]}>Food</Text>
                  <Text style={[styles.th, { color: colors.mutedForeground, fontFamily: "Inter_500Medium", flex: 2 }]}>Kcal</Text>
                  <Text style={[styles.th, { color: colors.mutedForeground, fontFamily: "Inter_500Medium", flex: 2 }]}>Date</Text>
                  <Text style={[styles.th, { color: colors.mutedForeground, fontFamily: "Inter_500Medium", flex: 1 }]}></Text>
                </View>
                {foodLogs.map((f) => (
                  <View key={f.id} style={[styles.tableRow, { borderColor: colors.border }]}>
                    <Text
                      style={[styles.td, { color: colors.foreground, fontFamily: "Inter_400Regular", flex: 3 }]}
                      numberOfLines={1}
                    >
                      {f.foodName}
                    </Text>
                    <Text style={[styles.td, { color: colors.foreground, fontFamily: "Inter_400Regular", flex: 2 }]}>
                      {f.calories}
                    </Text>
                    <Text style={[styles.td, { color: colors.foreground, fontFamily: "Inter_400Regular", flex: 2 }]}>
                      {f.date}
                    </Text>
                    <TouchableOpacity
                      style={{ flex: 1, alignItems: "center" }}
                      onPress={() => {
                        Alert.alert("Delete", "Remove this food log?", [
                          { text: "Cancel" },
                          { text: "Delete", style: "destructive", onPress: () => deleteFoodLogMutation.mutate(f.id) },
                        ]);
                      }}
                    >
                      <Feather name="trash-2" size={15} color={colors.destructive} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function AdminStatCard({
  label, value, icon, color, colors,
}: {
  label: string; value: string | number; icon: string; color: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.statIcon, { backgroundColor: color + "20" }]}>
        <Feather name={icon as any} size={18} color={color} />
      </View>
      <Text style={[styles.statValue, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{label}</Text>
    </View>
  );
}

function EmptyState({ icon, text, colors }: { icon: string; text: string; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={styles.empty}>
      <Feather name={icon as any} size={32} color={colors.mutedForeground} />
      <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 24 },
  title: { fontSize: 22 },
  logoutBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  sectionTitle: { fontSize: 17, marginBottom: 12 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  statCard: { width: "47%", borderRadius: 14, borderWidth: 1, padding: 14, gap: 6 },
  statIcon: { width: 34, height: 34, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  statValue: { fontSize: 20 },
  statLabel: { fontSize: 12 },
  tableCard: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  tableHeader: { flexDirection: "row", borderBottomWidth: 1, paddingHorizontal: 12, paddingVertical: 10 },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, paddingHorizontal: 12, paddingVertical: 10, alignItems: "center" },
  th: { fontSize: 12, textTransform: "uppercase" },
  td: { fontSize: 13 },
  empty: { alignItems: "center", gap: 8, paddingVertical: 20 },
  emptyText: { fontSize: 14 },
  accessDenied: { fontSize: 18, marginTop: 12 },
});
