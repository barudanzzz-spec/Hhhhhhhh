import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { User, Package, LogOut, Shield, Settings, Store, ChevronRight, KeyRound } from "lucide-react-native";
import { useAuth } from "@/src/auth-context";
import { Button } from "@/src/ui";
import { colors } from "@/src/theme";

export default function Profil() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout } = useAuth();

  if (!user) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center", padding: 24 }}>
        <User size={48} color={colors.muted} />
        <Text style={{ color: colors.onSurface, fontSize: 18, fontWeight: "700", marginTop: 16 }}>Belum Masuk</Text>
        <View style={{ height: 20 }} />
        <Button title="Masuk" onPress={() => router.push("/login")} testID="profile-login-btn" />
      </View>
    );
  }

  const Row = ({ icon: Icon, label, onPress, testID, danger }: any) => (
    <Pressable testID={testID} style={styles.row} onPress={onPress}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}>
        <Icon size={20} color={danger ? colors.error : colors.brand} />
        <Text style={{ color: danger ? colors.error : colors.onSurface, fontWeight: "600", fontSize: 15 }}>{label}</Text>
      </View>
      <ChevronRight size={18} color={colors.muted} />
    </Pressable>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 24 }}>
        <View style={styles.header}>
          <View style={styles.avatar}><User size={34} color={colors.brand} /></View>
          <Text style={{ color: colors.onSurface, fontSize: 20, fontWeight: "800", marginTop: 12 }} testID="profile-name">{user.display_name}</Text>
          <Text style={{ color: colors.muted, marginTop: 4 }} testID="profile-email">{user.email}</Text>
          {user.role === "admin" && (
            <View style={{ backgroundColor: colors.brandTertiary, borderWidth: 1, borderColor: colors.brand, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, marginTop: 8 }}>
              <Text style={{ color: colors.brand, fontWeight: "800", fontSize: 11, letterSpacing: 1 }}>ADMIN</Text>
            </View>
          )}
        </View>

        <View style={{ paddingHorizontal: 16, gap: 10 }}>
          <Row icon={Package} label="Pesanan Saya" testID="row-orders" onPress={() => router.push("/orders")} />
          <Row icon={Store} label="Listing Saya" testID="row-my-listings" onPress={() => router.push("/my-listings")} />
          <Row icon={KeyRound} label="Ganti Password" testID="row-change-password" onPress={() => router.push("/change-password")} />
          {user.role === "admin" && (
            <Row icon={Shield} label="Admin Dashboard" testID="row-admin" onPress={() => router.push("/admin")} />
          )}
          <Row icon={LogOut} label="Logout" testID="row-logout" danger onPress={async () => { await logout(); router.replace("/login"); }} />
        </View>
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  header: { alignItems: "center", padding: 24 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.brandTertiary, borderWidth: 2, borderColor: colors.brand, alignItems: "center", justifyContent: "center" },
  row: { backgroundColor: colors.surfaceSecondary, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
});
