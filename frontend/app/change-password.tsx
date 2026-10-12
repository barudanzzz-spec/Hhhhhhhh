import { useState } from "react";
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "@/src/api";
import { useAuth } from "@/src/auth-context";
import { Button, Input } from "@/src/ui";
import { colors } from "@/src/theme";

export default function ChangePassword() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { refresh, logout } = useAuth();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    setErr(null);
    setLoading(true);
    try {
      await api.changePassword(current, next);
      await refresh();
      router.replace("/(tabs)");
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.surface }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingTop: insets.top + 40 }}>
        <Text style={{ color: colors.onSurface, fontSize: 24, fontWeight: "900" }}>Ganti Password</Text>
        <Text style={{ color: colors.muted, marginTop: 8, marginBottom: 24 }}>Admin wajib mengganti password awal sebelum lanjut.</Text>
        <View style={styles.card}>
          <Text style={styles.label}>Password Saat Ini</Text>
          <Input testID="cp-current" value={current} onChangeText={setCurrent} secureTextEntry placeholder="Password awal" />
          <Text style={[styles.label, { marginTop: 14 }]}>Password Baru</Text>
          <Input testID="cp-new" value={next} onChangeText={setNext} secureTextEntry placeholder="Minimal 6 karakter" />
          {err && <Text style={{ color: colors.error, marginTop: 12 }}>{err}</Text>}
          <View style={{ height: 20 }} />
          <Button testID="cp-submit" title="Simpan" onPress={submit} loading={loading} />
          <Pressable onPress={async () => { await logout(); router.replace("/login"); }} style={{ marginTop: 16, alignItems: "center" }}>
            <Text style={{ color: colors.muted }}>Logout</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
const styles = StyleSheet.create({
  card: { backgroundColor: colors.surfaceSecondary, padding: 20, borderRadius: 20, borderWidth: 1, borderColor: colors.border },
  label: { color: colors.muted, fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 },
});
