import { ActivityIndicator, StyleSheet, Text, View, type ViewProps } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing } from "@/core/theme";
import { OfflineBanner } from "./OfflineBanner";

interface ScreenProps extends ViewProps {
  title?: string;
  showOfflineBanner?: boolean;
  loading?: boolean;
  children?: React.ReactNode;
}

export function Screen({
  title,
  showOfflineBanner = true,
  loading,
  children,
  style,
  ...rest
}: ScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingTop: insets.top }]} {...rest}>
      {showOfflineBanner && <OfflineBanner />}
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <View style={[styles.content, style]}>{children}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  content: {
    flex: 1,
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
