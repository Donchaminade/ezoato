import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/core/api/client";
import { Button } from "@/shared/components/Button";
import { Input } from "@/shared/components/Input";
import { Screen } from "@/shared/components/Screen";
import { colors, radius, spacing } from "@/core/theme";

type Tab = "info" | "security";

export default function ProfileScreen() {
  const [tab, setTab] = useState<Tab>("info");
  const queryClient = useQueryClient();

  const profileQuery = useQuery({
    queryKey: ["profile"],
    queryFn: () => api.getProfile(),
  });

  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [ville, setVille] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (profileQuery.data) {
      setNom(profileQuery.data.user.nom);
      setEmail(profileQuery.data.user.email);
      setTelephone(profileQuery.data.user.telephone ?? "");
      setVille(profileQuery.data.user.ville ?? "");
    }
  }, [profileQuery.data]);

  async function saveInfo() {
    setLoading(true);
    try {
      await api.updateProfile({ nom, email, telephone, ville: ville || null });
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
      Alert.alert("Succès", "Profil mis à jour");
    } catch (e) {
      Alert.alert("Erreur", e instanceof Error ? e.message : "Échec");
    } finally {
      setLoading(false);
    }
  }

  async function savePassword() {
    if (!currentPassword || password.length < 8) {
      Alert.alert("Erreur", "Mot de passe actuel et nouveau (8+) requis");
      return;
    }
    setLoading(true);
    try {
      await api.updateProfile({
        nom,
        email,
        telephone,
        ville: ville || null,
        currentPassword,
        password,
      });
      setCurrentPassword("");
      setPassword("");
      Alert.alert("Succès", "Mot de passe modifié");
    } catch (e) {
      Alert.alert("Erreur", e instanceof Error ? e.message : "Échec");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen loading={profileQuery.isLoading}>
      <View style={styles.tabs}>
        <TabButton label="Informations" active={tab === "info"} onPress={() => setTab("info")} />
        <TabButton label="Sécurité" active={tab === "security"} onPress={() => setTab("security")} />
      </View>

      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        {tab === "info" ? (
          <>
            <Input label="Nom" value={nom} onChangeText={setNom} />
            <Input label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" />
            <Input label="Téléphone" value={telephone} onChangeText={setTelephone} keyboardType="phone-pad" />
            <Input label="Ville" value={ville} onChangeText={setVille} />
            <Button title="Enregistrer" onPress={saveInfo} loading={loading} style={styles.btn} />
          </>
        ) : (
          <>
            <Text style={styles.hint}>Changez votre mot de passe de connexion</Text>
            <Input
              label="Mot de passe actuel"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
            />
            <Input
              label="Nouveau mot de passe"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            <Button title="Modifier le mot de passe" onPress={savePassword} loading={loading} style={styles.btn} />
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

function TabButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Text style={[styles.tab, active && styles.tabActive]} onPress={onPress}>
      {label}
    </Text>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: "row",
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  tab: {
    flex: 1,
    textAlign: "center",
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    color: colors.textMuted,
    fontWeight: "600",
    overflow: "hidden",
  },
  tabActive: { backgroundColor: colors.primary, color: colors.white },
  form: { padding: spacing.md, paddingBottom: spacing.xl },
  hint: { fontSize: 14, color: colors.textMuted, marginBottom: spacing.sm },
  btn: { marginTop: spacing.lg },
});
