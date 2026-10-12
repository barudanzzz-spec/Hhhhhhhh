import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { ChevronLeft } from "lucide-react-native";
import { api } from "@/src/api";
import { StatusBadge } from "@/src/ui";
import { colors, formatRupiah } from "@/src/theme";

export default function MyListings() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const q = useQuery({ queryKey: ["my-listings"], queryFn: api.myListings });

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable onPress={() => router.back()}><ChevronLeft size={22} color={colors.onSurface} /></Pressable>
        <Text style={styles.title}>Listing Saya</Text>
        <View style={{ width: 22 }} />
      </View>
      {q.isLoading ? <ActivityIndicator color={colors.brand} style={{ marginTop: 24 }} /> : (q.data || []).length === 0 ? (
        <Text style={{ color: colors.muted, textAlign: "center", padding: 32 }}>Belum ada listing. Kirim dari tab Jual Akun.</Text>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
          {(q.data || []).map((l: any) => (
            <Pressable key={l.id} testID={`ml-${l.id}`} onPress={() => router.push(`/product/${l.id}`)} style={styles.row}>
              <Image source={{ uri: l.images?.[0] || "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400" }} style={{ width: 72, height: 72, borderRadius: 10 }} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text numberOfLines={2} style={{ color: colors.onSurface, fontWeight: "700" }}>{l.title}</Text>
                <Text style={{ color: colors.brand, fontWeight: "900", marginTop: 6 }}>{formatRupiah(l.price)}</Text>
                <View style={{ marginTop: 6 }}><StatusBadge status={l.status} /></View>
                {l.status === "rejected" && l.reject_reason ? <Text style={{ color: colors.error, fontSize: 11, marginTop: 4 }}>Alasan: {l.reject_reason}</Text> : null}
              </View>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { color: colors.onSurface, fontSize: 18, fontWeight: "800" },
  row: { flexDirection: "row", backgroundColor: colors.surfaceSecondary, padding: 12, borderRadius: 14, borderWidth: 1, borderColor: colors.border },
});
