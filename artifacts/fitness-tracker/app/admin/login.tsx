import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { useAdminLogin } from "@workspace/api-client-react";

export default function AdminLoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { setAdminToken } = useApp();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);

  const loginMutation = useAdminLogin({
    mutation: {
      onSuccess: (data) => {
        setAdminToken(data.token);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace("/admin/index");
      },
      onError: () => {
        Alert.alert("Login failed", "Invalid username or password");
      },
    },
  });

  const handleLogin = () => {
    if (!username || !password) {
      Alert.alert("Validation", "Please enter username and password");
      return;
    }
    loginMutation.mutate({ data: { username, password } });
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top + 16;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.inner, { paddingTop: topPad }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>

        <View style={[styles.iconWrap, { backgroundColor: colors.primary + "15" }]}>
          <Feather name="shield" size={36} color={colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
          Admin Login
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
          Access the admin dashboard
        </Text>

        <View style={[styles.form, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.secondary }]}>
            <Feather name="user" size={16} color={colors.mutedForeground} />
            <TextInput
              style={[styles.input, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}
              placeholder="Username"
              placeholderTextColor={colors.mutedForeground}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
          </View>
          <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.secondary }]}>
            <Feather name="lock" size={16} color={colors.mutedForeground} />
            <TextInput
              style={[styles.input, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}
              placeholder="Password"
              placeholderTextColor={colors.mutedForeground}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPw}
            />
            <TouchableOpacity onPress={() => setShowPw(!showPw)}>
              <Feather name={showPw ? "eye-off" : "eye"} size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={[styles.loginBtn, { backgroundColor: colors.primary }]}
            onPress={handleLogin}
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={[styles.loginBtnText, { fontFamily: "Inter_600SemiBold" }]}>Login</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, paddingHorizontal: 24 },
  backBtn: { marginBottom: 32 },
  iconWrap: { width: 72, height: 72, borderRadius: 20, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  title: { fontSize: 28, marginBottom: 6 },
  subtitle: { fontSize: 15, marginBottom: 32 },
  form: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  input: { flex: 1, fontSize: 15 },
  loginBtn: { borderRadius: 10, paddingVertical: 14, alignItems: "center", marginTop: 4 },
  loginBtnText: { color: "#fff", fontSize: 16 },
});
