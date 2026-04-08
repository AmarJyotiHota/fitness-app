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
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import {
  useApp,
  SUBSCRIPTION_PLANS,
  PLAN_FEATURES,
  SubscriptionTier,
} from "@/context/AppContext";

type Plan = "monthly" | "yearly";

export default function PremiumScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { subscription, subscribe, cancelSubscription, isPro, isElite } = useApp();

  const [selectedPlan, setSelectedPlan] = useState<Plan>("yearly");
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>("pro");
  const [loading, setLoading] = useState(false);

  const topPad = Platform.OS === "web" ? 20 : insets.top + 12;

  const handleSubscribe = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    subscribe(selectedTier, selectedPlan);
    setLoading(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(
      "🎉 Welcome to " + selectedTier.charAt(0).toUpperCase() + selectedTier.slice(1) + "!",
      "Your subscription is now active. Enjoy all premium features and +25% XP boost!",
      [{ text: "Let's go!", onPress: () => router.back() }],
    );
  };

  const handleCancel = () => {
    Alert.alert(
      "Cancel Subscription",
      "Are you sure you want to cancel? You'll lose access to premium features.",
      [
        { text: "Keep Subscription", style: "cancel" },
        {
          text: "Cancel",
          style: "destructive",
          onPress: () => {
            cancelSubscription();
            router.back();
          },
        },
      ],
    );
  };

  const planData = SUBSCRIPTION_PLANS[selectedTier as "pro" | "elite"]?.[selectedPlan];
  const proPrice = SUBSCRIPTION_PLANS.pro[selectedPlan];
  const elitePrice = SUBSCRIPTION_PLANS.elite[selectedPlan];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Feather name="x" size={22} color={colors.mutedForeground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
          Upgrade Plan
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={[styles.heroIcon, { backgroundColor: colors.primary + "20", borderColor: colors.primary + "40" }]}>
            <Text style={styles.heroEmoji}>⚡</Text>
          </View>
          <Text style={[styles.heroTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
            Unlock Your Full{"\n"}Potential
          </Text>
          <Text style={[styles.heroSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            Get unlimited AI coaching, muscle rank tracking,{"\n"}and XP bonuses with every workout.
          </Text>
        </View>

        {/* Active subscription notice */}
        {isPro && (
          <View style={[styles.activeBanner, { backgroundColor: colors.success + "20", borderColor: colors.success + "40" }]}>
            <Feather name="check-circle" size={18} color={colors.success} />
            <Text style={[styles.activeBannerText, { color: colors.success, fontFamily: "Inter_600SemiBold" }]}>
              {isElite ? "Elite" : "Pro"} — Active since {new Date(subscription.purchasedAt!).toLocaleDateString()}
            </Text>
          </View>
        )}

        {/* Billing toggle */}
        <View style={[styles.billingToggle, { backgroundColor: colors.secondary, borderRadius: 14 }]}>
          <TouchableOpacity
            onPress={() => setSelectedPlan("monthly")}
            style={[styles.billingBtn, selectedPlan === "monthly" && { backgroundColor: colors.card, borderRadius: 10 }]}
          >
            <Text style={[styles.billingBtnText, { color: selectedPlan === "monthly" ? colors.foreground : colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>
              Monthly
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setSelectedPlan("yearly")}
            style={[styles.billingBtn, selectedPlan === "yearly" && { backgroundColor: colors.card, borderRadius: 10 }]}
          >
            <Text style={[styles.billingBtnText, { color: selectedPlan === "yearly" ? colors.foreground : colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>
              Yearly
            </Text>
            {selectedPlan === "yearly" && (
              <View style={[styles.savingsBadge, { backgroundColor: colors.success + "25" }]}>
                <Text style={[styles.savingsText, { color: colors.success, fontFamily: "Inter_700Bold" }]}>BEST VALUE</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.plansRow}>
          {/* Pro Card */}
          <TierCard
            tier="pro"
            isSelected={selectedTier === "pro"}
            onPress={() => setSelectedTier("pro")}
            price={proPrice.price}
            period={proPrice.period}
            savings={selectedPlan === "yearly" ? SUBSCRIPTION_PLANS.pro.yearly.savings : undefined}
            label="PRO"
            color="#7c3aed"
            glow="#7c3aed"
            emoji="⚡"
            colors={colors}
            popular
          />
          {/* Elite Card */}
          <TierCard
            tier="elite"
            isSelected={selectedTier === "elite"}
            onPress={() => setSelectedTier("elite")}
            price={elitePrice.price}
            period={elitePrice.period}
            savings={selectedPlan === "yearly" ? SUBSCRIPTION_PLANS.elite.yearly.savings : undefined}
            label="ELITE"
            color="#f59e0b"
            glow="#f59e0b"
            emoji="👑"
            colors={colors}
          />
        </View>

        {/* Feature comparison */}
        <View style={[styles.featureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.featureCardTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
            {selectedTier === "pro" ? "⚡ Pro" : "👑 Elite"} includes:
          </Text>
          {(PLAN_FEATURES[selectedTier] as string[]).map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <View style={[styles.featureCheck, { backgroundColor: selectedTier === "elite" ? colors.warning + "20" : colors.primary + "20" }]}>
                <Feather name="check" size={12} color={selectedTier === "elite" ? colors.warning : colors.primary} />
              </View>
              <Text style={[styles.featureText, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}>{f}</Text>
            </View>
          ))}
        </View>

        {/* XP Bonus callout */}
        <View style={[styles.xpCallout, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "30" }]}>
          <Text style={styles.xpCalloutEmoji}>🚀</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.xpCalloutTitle, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>
              {selectedTier === "elite" ? "+50% XP Boost" : "+25% XP Boost"}
            </Text>
            <Text style={[styles.xpCalloutText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Every activity earns more XP — rank up faster than ever.
            </Text>
          </View>
        </View>

        {/* Subscribe button */}
        {!isPro ? (
          <TouchableOpacity
            style={[styles.subscribeBtn, { backgroundColor: selectedTier === "elite" ? colors.warning : colors.primary }]}
            onPress={handleSubscribe}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={[styles.subscribeBtnText, { fontFamily: "Inter_700Bold" }]}>
                  Start {selectedTier === "pro" ? "Pro" : "Elite"} — {planData?.price}{planData?.period}
                </Text>
                <Feather name="arrow-right" size={18} color="#fff" />
              </>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.subscribeBtn, {
              backgroundColor: selectedTier !== subscription.tier
                ? (selectedTier === "elite" ? colors.warning : colors.primary)
                : colors.secondary,
            }]}
            onPress={subscription.tier !== selectedTier ? handleSubscribe : undefined}
            disabled={loading || subscription.tier === selectedTier}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : subscription.tier === selectedTier ? (
              <Text style={[styles.subscribeBtnText, { color: colors.mutedForeground, fontFamily: "Inter_700Bold" }]}>
                Current Plan
              </Text>
            ) : (
              <Text style={[styles.subscribeBtnText, { fontFamily: "Inter_700Bold" }]}>
                Upgrade to {selectedTier === "elite" ? "Elite" : "Pro"}
              </Text>
            )}
          </TouchableOpacity>
        )}

        {isPro && (
          <TouchableOpacity onPress={handleCancel} style={styles.cancelLink}>
            <Text style={[styles.cancelText, { color: colors.destructive, fontFamily: "Inter_400Regular" }]}>
              Cancel Subscription
            </Text>
          </TouchableOpacity>
        )}

        <Text style={[styles.legal, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
          Subscriptions auto-renew unless cancelled at least 24 hours before the renewal date.
          Cancel anytime from your profile.
        </Text>
      </ScrollView>
    </View>
  );
}

function TierCard({
  tier, isSelected, onPress, price, period, savings, label, color, emoji, colors, popular,
}: {
  tier: SubscriptionTier; isSelected: boolean; onPress: () => void;
  price: string; period: string; savings?: string;
  label: string; color: string; glow: string; emoji: string;
  colors: ReturnType<typeof useColors>; popular?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.tierCard,
        {
          backgroundColor: isSelected ? color + "18" : colors.card,
          borderColor: isSelected ? color : colors.border,
          borderWidth: isSelected ? 2 : 1,
        },
      ]}
      activeOpacity={0.8}
    >
      {popular && (
        <View style={[styles.popularBadge, { backgroundColor: color }]}>
          <Text style={[styles.popularText, { fontFamily: "Inter_700Bold" }]}>POPULAR</Text>
        </View>
      )}
      <Text style={styles.tierEmoji}>{emoji}</Text>
      <Text style={[styles.tierLabel, { color, fontFamily: "Inter_700Bold" }]}>{label}</Text>
      <Text style={[styles.tierPrice, { color: isSelected ? color : colors.foreground, fontFamily: "Inter_700Bold" }]}>
        {price}
      </Text>
      <Text style={[styles.tierPeriod, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{period}</Text>
      {savings && (
        <View style={[styles.savingsPill, { backgroundColor: colors.success + "20" }]}>
          <Text style={[styles.savingsPillText, { color: colors.success, fontFamily: "Inter_600SemiBold" }]}>{savings}</Text>
        </View>
      )}
      {isSelected && (
        <View style={[styles.selectedCheck, { backgroundColor: color }]}>
          <Feather name="check" size={12} color="#fff" />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  closeBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18 },

  hero: { alignItems: "center", paddingTop: 28, paddingBottom: 24, paddingHorizontal: 20, gap: 12 },
  heroIcon: { width: 80, height: 80, borderRadius: 40, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  heroEmoji: { fontSize: 36 },
  heroTitle: { fontSize: 28, textAlign: "center", lineHeight: 34 },
  heroSub: { fontSize: 14, textAlign: "center", lineHeight: 20 },

  activeBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
  },
  activeBannerText: { fontSize: 14 },

  billingToggle: { flexDirection: "row", marginHorizontal: 20, padding: 4, marginBottom: 16 },
  billingBtn: { flex: 1, alignItems: "center", paddingVertical: 10, gap: 4, flexDirection: "row", justifyContent: "center" },
  billingBtnText: { fontSize: 14 },
  savingsBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, marginLeft: 6 },
  savingsText: { fontSize: 9 },

  plansRow: { flexDirection: "row", gap: 12, paddingHorizontal: 20, marginBottom: 20 },

  tierCard: {
    flex: 1,
    borderRadius: 18,
    padding: 16,
    alignItems: "center",
    gap: 4,
    overflow: "hidden",
    position: "relative",
    minHeight: 180,
  },
  popularBadge: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingVertical: 4,
  },
  popularText: { color: "#fff", fontSize: 9, letterSpacing: 1 },
  tierEmoji: { fontSize: 28, marginTop: 20 },
  tierLabel: { fontSize: 13, letterSpacing: 1.5, marginTop: 4 },
  tierPrice: { fontSize: 26, marginTop: 6 },
  tierPeriod: { fontSize: 12 },
  savingsPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, marginTop: 4 },
  savingsPillText: { fontSize: 10 },
  selectedCheck: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },

  featureCard: {
    marginHorizontal: 20,
    borderRadius: 18,
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
    gap: 10,
  },
  featureCardTitle: { fontSize: 17, marginBottom: 4 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  featureCheck: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  featureText: { fontSize: 14, lineHeight: 20, flex: 1 },

  xpCallout: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 24,
  },
  xpCalloutEmoji: { fontSize: 28 },
  xpCalloutTitle: { fontSize: 16 },
  xpCalloutText: { fontSize: 13, marginTop: 2, lineHeight: 18 },

  subscribeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginHorizontal: 20,
    borderRadius: 16,
    paddingVertical: 16,
    marginBottom: 12,
  },
  subscribeBtnText: { color: "#fff", fontSize: 16 },

  cancelLink: { alignItems: "center", paddingVertical: 8, marginBottom: 8 },
  cancelText: { fontSize: 14 },

  legal: {
    fontSize: 11,
    textAlign: "center",
    paddingHorizontal: 28,
    lineHeight: 16,
    marginTop: 8,
  },
});
