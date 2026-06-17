import { useEffect } from "react";
import { ActivityIndicator, Image, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useAuth } from "@/features/auth/AuthContext";
import { colors, spacing } from "@/core/theme";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function SplashRoute() {
  const { isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    SplashScreen.hideAsync().catch(() => {});

    const timer = setTimeout(() => {
      if (isAuthenticated) {
        router.replace("/(tabs)");
      } else {
        router.replace("/(auth)/login");
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [isLoading, isAuthenticated]);

  return (
    <Animated.View entering={FadeIn.duration(400)} exiting={FadeOut} style={styles.container}>
      <View style={styles.logoWrap}>
        <Image source={require("../assets/splash-icon.png")} style={styles.logo} resizeMode="contain" />
      </View>
      <Text style={styles.title}>EZOA-TO</Text>
      <Text style={styles.subtitle}>Archives scolaires du Togo</Text>
      <ActivityIndicator color={colors.accent} style={styles.loader} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  logoWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  logo: { width: 80, height: 80 },
  title: {
    fontSize: 36,
    fontWeight: "800",
    color: colors.white,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 15,
    color: colors.accent,
    marginTop: spacing.sm,
    fontWeight: "600",
  },
  loader: { marginTop: spacing.xl },
});
