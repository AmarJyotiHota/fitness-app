import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import {
  useGetFoodLogs,
  useAnalyzeFood,
  useLogFood,
} from "@workspace/api-client-react";

const TAB_BAR_HEIGHT = Platform.OS === "web" ? 84 : 70;

const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;
type MealType = (typeof MEAL_TYPES)[number];

interface FoodResult {
  foodName: string;
  calories: number;
  confidence: string;
  protein?: number;
  carbs?: number;
  fat?: number;
  servingSize?: string;
}

export default function FoodScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<FoodResult | null>(null);
  const [mealType, setMealType] = useState<MealType>("lunch");

  const { data: foodLogs, refetch } = useGetFoodLogs({
    query: { queryKey: ["food", "logs"] },
  });

  const analyzeMutation = useAnalyzeFood();
  const logMutation = useLogFood({
    mutation: {
      onSuccess: () => {
        refetch();
        setImageUri(null);
        setImageBase64(null);
        setResult(null);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      },
      onError: () => Alert.alert("Error", "Failed to log food"),
    },
  });

  const pickImage = async () => {
    if (Platform.OS === "web") {
      Alert.alert("Web", "Image upload works best on mobile. Please use Expo Go on your device.");
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please grant photo library access to analyze food");
      return;
    }
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      quality: 0.6,
      base64: true,
    });
    if (!picked.canceled && picked.assets[0]) {
      const asset = picked.assets[0];
      setImageUri(asset.uri);
      setImageBase64(asset.base64 ?? null);
      setResult(null);
      await analyzeImage(asset.base64 ?? "");
    }
  };

  const takePhoto = async () => {
    if (Platform.OS === "web") {
      Alert.alert("Web", "Camera works best on mobile. Please use Expo Go on your device.");
      return;
    }
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please grant camera access");
      return;
    }
    const picked = await ImagePicker.launchCameraAsync({
      quality: 0.6,
      base64: true,
    });
    if (!picked.canceled && picked.assets[0]) {
      const asset = picked.assets[0];
      setImageUri(asset.uri);
      setImageBase64(asset.base64 ?? null);
      setResult(null);
      await analyzeImage(asset.base64 ?? "");
    }
  };

  const analyzeImage = async (b64: string) => {
    setAnalyzing(true);
    try {
      const data = await analyzeMutation.mutateAsync({
        data: { imageBase64: b64 },
      });
      setResult(data as FoodResult);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      Alert.alert("Error", "Could not analyze the image. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleLog = () => {
    if (!result) return;
    logMutation.mutate({
      data: {
        foodName: result.foodName,
        calories: result.calories,
        imageBase64: imageBase64 ?? undefined,
        protein: result.protein,
        carbs: result.carbs,
        fat: result.fat,
        mealType,
      },
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
        <Text style={[styles.title, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
          Food Scanner
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
          AI-powered calorie detection
        </Text>

        {/* Camera Actions */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.primary }]}
            onPress={takePhoto}
          >
            <Feather name="camera" size={20} color="#fff" />
            <Text style={[styles.actionBtnText, { fontFamily: "Inter_600SemiBold" }]}>Take Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.secondary, borderWidth: 1, borderColor: colors.border }]}
            onPress={pickImage}
          >
            <Feather name="image" size={20} color={colors.foreground} />
            <Text style={[styles.actionBtnText, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>Gallery</Text>
          </TouchableOpacity>
        </View>

        {/* Image Preview */}
        {imageUri && (
          <View style={[styles.imageCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Image source={{ uri: imageUri }} style={styles.foodImage} resizeMode="cover" />
            {analyzing && (
              <View style={styles.analyzingOverlay}>
                <ActivityIndicator color="#fff" size="large" />
                <Text style={[styles.analyzingText, { fontFamily: "Inter_500Medium" }]}>Analyzing...</Text>
              </View>
            )}
          </View>
        )}

        {/* Analysis Result */}
        {result && !analyzing && (
          <View style={[styles.resultCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.resultHeader}>
              <View>
                <Text style={[styles.foodName, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
                  {result.foodName}
                </Text>
                <View style={[styles.confidenceBadge, {
                  backgroundColor: result.confidence === "high"
                    ? colors.success + "20"
                    : result.confidence === "medium"
                    ? colors.warning + "20"
                    : colors.destructive + "20"
                }]}>
                  <Text style={[styles.confidenceText, {
                    color: result.confidence === "high"
                      ? colors.success
                      : result.confidence === "medium"
                      ? colors.warning
                      : colors.destructive,
                    fontFamily: "Inter_500Medium"
                  }]}>
                    {result.confidence} confidence
                  </Text>
                </View>
              </View>
              <View style={[styles.calorieBubble, { backgroundColor: colors.primary + "20" }]}>
                <Text style={[styles.calorieNum, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>
                  {result.calories}
                </Text>
                <Text style={[styles.calorieUnit, { color: colors.primary, fontFamily: "Inter_400Regular" }]}>
                  kcal
                </Text>
              </View>
            </View>

            {/* Nutrition */}
            {(result.protein !== undefined || result.carbs !== undefined || result.fat !== undefined) && (
              <View style={styles.nutritionRow}>
                {result.protein !== undefined && (
                  <NutritionBadge label="Protein" value={result.protein} unit="g" color={colors.primary} colors={colors} />
                )}
                {result.carbs !== undefined && (
                  <NutritionBadge label="Carbs" value={result.carbs} unit="g" color={colors.warning} colors={colors} />
                )}
                {result.fat !== undefined && (
                  <NutritionBadge label="Fat" value={result.fat} unit="g" color={colors.orange} colors={colors} />
                )}
              </View>
            )}

            {result.servingSize && (
              <Text style={[styles.serving, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                Serving: {result.servingSize}
              </Text>
            )}

            {/* Meal Type */}
            <Text style={[styles.mealLabel, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>Meal Type</Text>
            <View style={styles.mealTypeRow}>
              {MEAL_TYPES.map((mt) => (
                <TouchableOpacity
                  key={mt}
                  onPress={() => setMealType(mt)}
                  style={[
                    styles.mealTypeBtn,
                    {
                      backgroundColor: mealType === mt ? colors.primary : colors.secondary,
                      borderColor: mealType === mt ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.mealTypeBtnText, { color: mealType === mt ? "#fff" : colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
                    {mt.charAt(0).toUpperCase() + mt.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.logBtn, { backgroundColor: colors.success }]}
              onPress={handleLog}
              disabled={logMutation.isPending}
            >
              {logMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Feather name="check-circle" size={18} color="#fff" />
                  <Text style={[styles.logBtnText, { fontFamily: "Inter_600SemiBold" }]}>Log This Food</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Food Logs */}
        {foodLogs && foodLogs.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold", marginTop: 28 }]}>
              Today's Food
            </Text>
            <View style={styles.logList}>
              {foodLogs.slice(0, 10).map((f) => (
                <View key={f.id} style={[styles.logItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  {f.imageBase64 ? (
                    <Image
                      source={{ uri: `data:image/jpeg;base64,${f.imageBase64}` }}
                      style={styles.logThumb}
                    />
                  ) : (
                    <View style={[styles.logThumbPlaceholder, { backgroundColor: colors.success + "20" }]}>
                      <Feather name="coffee" size={18} color={colors.success} />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.logFoodName, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                      {f.foodName}
                    </Text>
                    <Text style={[styles.logCalories, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                      {f.calories} kcal{f.mealType ? ` · ${f.mealType}` : ""}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function NutritionBadge({
  label, value, unit, color, colors,
}: {
  label: string; value: number; unit: string; color: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={[styles.nutriBadge, { backgroundColor: color + "15" }]}>
      <Text style={[styles.nutriValue, { color, fontFamily: "Inter_600SemiBold" }]}>{value}g</Text>
      <Text style={[styles.nutriLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20 },
  title: { fontSize: 26 },
  subtitle: { fontSize: 14, marginTop: 4, marginBottom: 24 },
  actionRow: { flexDirection: "row", gap: 12, marginBottom: 20 },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    paddingVertical: 14,
  },
  actionBtnText: { color: "#fff", fontSize: 15 },
  imageCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 16,
    position: "relative",
  },
  foodImage: { width: "100%", height: 220 },
  analyzingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  analyzingText: { color: "#fff", fontSize: 16 },
  resultCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 14, marginBottom: 16 },
  resultHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  foodName: { fontSize: 20, marginBottom: 6 },
  confidenceBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, alignSelf: "flex-start" },
  confidenceText: { fontSize: 11 },
  calorieBubble: { alignItems: "center", justifyContent: "center", padding: 14, borderRadius: 14, minWidth: 80 },
  calorieNum: { fontSize: 28, lineHeight: 32 },
  calorieUnit: { fontSize: 12 },
  nutritionRow: { flexDirection: "row", gap: 10 },
  nutriBadge: { flex: 1, borderRadius: 10, padding: 10, alignItems: "center" },
  nutriValue: { fontSize: 18 },
  nutriLabel: { fontSize: 11, marginTop: 2 },
  serving: { fontSize: 13, fontStyle: "italic" },
  mealLabel: { fontSize: 14 },
  mealTypeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  mealTypeBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  mealTypeBtnText: { fontSize: 13 },
  logBtn: { flexDirection: "row", gap: 8, borderRadius: 12, paddingVertical: 13, alignItems: "center", justifyContent: "center" },
  logBtnText: { color: "#fff", fontSize: 15 },
  sectionTitle: { fontSize: 17, marginBottom: 12 },
  logList: { gap: 10, paddingBottom: 20 },
  logItem: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 14, borderWidth: 1, padding: 12 },
  logThumb: { width: 50, height: 50, borderRadius: 10 },
  logThumbPlaceholder: { width: 50, height: 50, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  logFoodName: { fontSize: 15 },
  logCalories: { fontSize: 13, marginTop: 2 },
});
