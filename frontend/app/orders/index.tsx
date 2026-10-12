import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft } from "lucide-react-native";
import { api } from "@/src/api";
import { StatusBadge } from "@/src/ui";
import { colors, formatRupiah } from "@/src/theme";

export default function Orders() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const q = useQuery({ queryKey: ["my-orders"], queryFn: api.myOrders });

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable onPress={() => router.back()}><ChevronLeft size={22} color={colors.onSurface} /></Pressable>
        <Text style={styles.title}>Pesanan Saya</Text>
        <View style={{ width: 22 }} />
      </View>
      {q.isLoading ? (
        <ActivityIndicator color={colors.brand} style={{ marginTop: 24 }} />
      ) : (q.data || []).length === 0 ? (
        <Text style={{ color: colors.muted, textAlign: "center", padding: 32 }}>Belum ada pesanan</Text>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
          {(q.data || []).map((o: any) => (
            <Pressable key={o.id} testID={`order-${o.id}`} onPress={() => router.push(`/orders/${o.id}`)} style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text numberOfLines={1} style={{ color: colors.onSurface, fontWeight: "700" }}>{o.listing_snapshot?.title}</Text>
                <Text style={{ color: colors.muted, fontSize: 11, marginTop: 2 }}>#{o.id.slice(0, 8)}</Text>
                <Text style={{ color: colors.brand, fontWeight: "900", marginTop: 8 }}>{formatRupiah(o.total)}</Text>
              </View>
              <StatusBadge status={o.status} />
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
  row: { flexDirection: "row", alignItems: "center", backgroundColor: colors.surfaceSecondary, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: colors.border },
});
