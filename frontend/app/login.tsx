import { useState } from "react";
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Pressable } from "react-native";
import { Link, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Zap } from "lucide-react-native";
import { useAuth } from "@/src/auth-context";
import { Button, Input } from "@/src/ui";
import { colors } from "@/src/theme";

export default function Login() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    setLoading(true);
    try {
      const u = await login(email.trim(), password);
      if (u.must_change_password) {
        router.replace("/change-password");
      } else {
        router.replace("/(tabs)");
      }
    } catch (e: any) {
      setError(e.message || "Login gagal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.surface }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={[styles.container, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.logoWrap}>
          <View style={styles.logoBox}>
            <Zap size={48} color={colors.brand} fill={colors.brand} />
          </View>
          <Text style={styles.title}>DANZ STORE V5</Text>
          <Text style={styles.tagline}>Marketplace Premium Akun Game</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Masuk Akun</Text>

          <Text style={styles.label}>Email</Text>
          <Input testID="login-email" value={email} onChangeText={setEmail} placeholder="emailmu@domain.com" keyboardType="email-address" />

          <Text style={[styles.label, { marginTop: 14 }]}>Password</Text>
          <Input testID="login-password" value={password} onChangeText={setPassword} placeholder="••••••••" secureTextEntry />

          {error && <Text style={styles.error} testID="login-error">{error}</Text>}

          <View style={{ height: 20 }} />
          <Button testID="login-submit-button" title="Masuk" onPress={submit} loading={loading} />

          <Pressable onPress={() => router.push("/register")} style={{ marginTop: 20, alignItems: "center" }} testID="goto-register">
            <Text style={{ color: colors.muted }}>
              Belum punya akun? <Text style={{ color: colors.brand, fontWeight: "700" }}>Daftar</Text>
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 24 },
  logoWrap: { alignItems: "center", marginBottom: 32 },
  logoBox: { width: 92, height: 92, borderRadius: 24, backgroundColor: colors.brandTertiary, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.brand },
  title: { color: colors.onSurface, fontSize: 28, fontWeight: "900", letterSpacing: 2, marginTop: 20 },
  tagline: { color: colors.muted, fontSize: 13, marginTop: 6 },
  card: { backgroundColor: colors.surfaceSecondary, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: colors.border },
  cardTitle: { color: colors.onSurface, fontSize: 20, fontWeight: "800", marginBottom: 20 },
  label: { color: colors.muted, fontSize: 12, fontWeight: "600", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 },
  error: { color: colors.error, marginTop: 12, fontSize: 13 },
});
