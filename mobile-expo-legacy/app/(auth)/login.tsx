import { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { Link, router } from "expo-router";
import { useAuth } from "@/features/auth/AuthContext";
import { Button } from "@/shared/components/Button";
import { Input } from "@/shared/components/Input";
import { colors, spacing } from "@/core/theme";

export default function LoginScreen() {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    setError(null);
    if (!identifier.trim() || !password) {
      setError("Identifiant et mot de passe requis");
      return;
    }
    setLoading(true);
    try {
      await login(identifier.trim(), password);
      router.replace("/(tabs)");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Connexion impossible";
      setError(msg);
      Alert.alert("Erreur", msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.heading}>Bienvenue sur EZOA-TO</Text>
        <Text style={styles.desc}>Connectez-vous pour accéder aux épreuves</Text>

        <Input
          label="Email ou téléphone"
          value={identifier}
          onChangeText={setIdentifier}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="username"
        />
        <Input
          label="Mot de passe"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="password"
          error={error ?? undefined}
        />

        <Button title="Se connecter" onPress={handleLogin} loading={loading} style={styles.btn} />

        <View style={styles.footer}>
          <Text style={styles.footerText}>Pas encore de compte ? </Text>
          <Link href="/(auth)/register" style={styles.link}>
            S'inscrire
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, paddingBottom: spacing.xl },
  heading: { fontSize: 26, fontWeight: "800", color: colors.text, marginBottom: spacing.xs },
  desc: { fontSize: 15, color: colors.textMuted, marginBottom: spacing.lg },
  btn: { marginTop: spacing.lg },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: spacing.lg },
  footerText: { color: colors.textMuted },
  link: { color: colors.primary, fontWeight: "700" },
});
