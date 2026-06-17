import { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { Link, router } from "expo-router";
import { useAuth } from "@/features/auth/AuthContext";
import { Button } from "@/shared/components/Button";
import { Input } from "@/shared/components/Input";
import { colors, spacing } from "@/core/theme";

export default function RegisterScreen() {
  const { register } = useAuth();
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRegister() {
    setError(null);
    if (!nom.trim() || !email.trim() || !telephone.trim() || password.length < 8) {
      setError("Remplissez tous les champs (mot de passe 8+ caractères)");
      return;
    }
    setLoading(true);
    try {
      await register(nom.trim(), email.trim(), telephone.trim(), password);
      router.replace("/(tabs)");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Inscription impossible";
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
        <Text style={styles.heading}>Créer un compte</Text>
        <Text style={styles.desc}>Rejoignez la communauté EZOA-TO</Text>

        <Input label="Nom complet" value={nom} onChangeText={setNom} autoComplete="name" />
        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />
        <Input
          label="Téléphone"
          value={telephone}
          onChangeText={setTelephone}
          keyboardType="phone-pad"
          autoComplete="tel"
        />
        <Input
          label="Mot de passe"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          error={error ?? undefined}
        />

        <Button title="S'inscrire" onPress={handleRegister} loading={loading} style={styles.btn} />

        <View style={styles.footer}>
          <Text style={styles.footerText}>Déjà inscrit ? </Text>
          <Link href="/(auth)/login" style={styles.link}>
            Se connecter
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
