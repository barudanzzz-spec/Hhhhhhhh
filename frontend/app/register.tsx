import { useState } from "react";
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Zap } from "lucide-react-native";
import { useAuth } from "@/src/auth-context";
import { Button, Input } from "@/src/ui";
import { colors } from "@/src/theme";

export default function Register() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    if (password.length < 6) { setError("Password minimal 6 karakter"); return; }
    setLoading(true);
    try {
      await register(email.trim(), password, name.trim());
      router.replace("/(tabs)");
    } catch (e: any) {
      setError(e.message || "Registrasi gagal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.surface }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={[styles.container, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 24 }]}>
        <View style={{ alignItems: "center", marginBottom: 24 }}>
          <View style={styles.logoBox}><Zap size={36} color={colors.brand} fill={colors.brand} /></View>
          <Text style={styles.title}>Buat Akun Baru</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Nama Tampilan</Text>
          <Input testID="reg-name" value={name} onChangeText={setName} placeholder="Nama kamu" />
          <Text style={[styles.label, { marginTop: 14 }]}>Email</Text>
          <Input testID="reg-email" value={email} onChangeText={setEmail} placeholder="email@domain.com" keyboardType="email-address" />
          <Text style={[styles.label, { marginTop: 14 }]}>Password</Text>
          <Input testID="reg-password" value={password} onChangeText={setPassword} placeholder="Minimal 6 karakter" secureTextEntry />

          {error && <Text style={styles.error} testID="reg-error">{error}</Text>}
          <View style={{ height: 20 }} />
          <Button testID="reg-submit" title="Daftar" onPress={submit} loading={loading} />

          <Pressable onPress={() => router.back()} style={{ marginTop: 20, alignItems: "center" }}>
            <Text style={{ color: colors.muted }}>Sudah punya akun? <Text style={{ color: colors.brand, fontWeight: "700" }}>Masuk</Text></Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 24 },
  logoBox: { width: 72, height: 72, borderRadius: 20, backgroundColor: colors.brandTertiary, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.brand },
  title: { color: colors.onSurface, fontSize: 22, fontWeight: "800", marginTop: 16 },
  card: { backgroundColor: colors.surfaceSecondary, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: colors.border },
  label: { color: colors.muted, fontSize: 12, fontWeight: "600", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 },
  error: { color: colors.error, marginTop: 12, fontSize: 13 },
});
