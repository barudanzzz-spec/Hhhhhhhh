import { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { ChevronLeft, Check } from "lucide-react-native";
import { api } from "@/src/api";
import { Button } from "@/src/ui";
import { colors, formatRupiah } from "@/src/theme";

export default function Checkout() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [pmId, setPmId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const listingQ = useQuery({ queryKey: ["listing", id], queryFn: () => api.listing(id!), enabled: !!id });
  const pmQ = useQuery({ queryKey: ["payment-methods"], queryFn: api.paymentMethods });

  const mut = useMutation({
    mutationFn: () => api.createOrder(id!, pmId!),
    onSuccess: (order: any) => router.replace(`/orders/${order.id}`),
    onError: (e: any) => setErr(e.message),
  });

  if (listingQ.isLoading || !listingQ.data) {
    return <View style={{ flex: 1, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" }}><ActivityIndicator color={colors.brand} /></View>;
  }
  const l = listingQ.data;

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable onPress={() => router.back()} testID="co-back"><ChevronLeft size={22} color={colors.onSurface} /></Pressable>
        <Text style={styles.title}>Checkout</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        <View style={styles.card}>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <Image source={{ uri: l.images?.[0] || "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400" }} style={{ width: 90, height: 90, borderRadius: 10 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.muted, fontSize: 11, fontWeight: "700" }}>{l.category_name}</Text>
              <Text numberOfLines={2} style={{ color: colors.onSurface, fontWeight: "700", marginTop: 4 }}>{l.title}</Text>
              <Text style={{ color: colors.brand, fontWeight: "900", marginTop: 8 }}>{formatRupiah(l.price)}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Pilih Metode Pembayaran</Text>
        {(pmQ.data || []).length === 0 && <Text style={{ color: colors.muted }}>Belum ada metode pembayaran aktif.</Text>}
        {(pmQ.data || []).map((pm: any) => (
          <Pressable
            key={pm.id}
            testID={`pm-${pm.name}`}
            onPress={() => setPmId(pm.id)}
            style={[styles.pmRow, { borderColor: pmId === pm.id ? colors.brand : colors.border }]}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.onSurface, fontWeight: "800" }}>{pm.name}</Text>
              <Text style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>{pm.type === "bank" ? pm.bank_name : pm.type.toUpperCase()}</Text>
            </View>
            {pmId === pm.id && <Check color={colors.brand} />}
          </Pressable>
        ))}

        <View style={[styles.card, { marginTop: 20 }]}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ color: colors.muted }}>Subtotal</Text>
            <Text style={{ color: colors.onSurface, fontWeight: "700" }}>{formatRupiah(l.price)}</Text>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border }}>
            <Text style={{ color: colors.onSurface, fontWeight: "800" }}>Total</Text>
            <Text style={{ color: colors.brand, fontWeight: "900", fontSize: 18 }}>{formatRupiah(l.price)}</Text>
          </View>
        </View>

        {err && <Text style={{ color: colors.error, marginTop: 12 }} testID="co-error">{err}</Text>}
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        <Button testID="co-pay" title="Buat Pesanan" onPress={() => { setErr(null); if (!pmId) { setErr("Pilih metode pembayaran"); return; } mut.mutate(); }} loading={mut.isPending} disabled={!pmId} />
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { color: colors.onSurface, fontSize: 18, fontWeight: "800" },
  card: { backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 14 },
  sectionTitle: { color: colors.onSurface, fontWeight: "800", fontSize: 16, marginTop: 24, marginBottom: 12 },
  pmRow: { backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderRadius: 12, padding: 14, flexDirection: "row", alignItems: "center", marginBottom: 10 },
  bottomBar: { position: "absolute", left: 0, right: 0, bottom: 0, padding: 16, paddingTop: 12, backgroundColor: colors.surfaceSecondary, borderTopWidth: 1, borderTopColor: colors.border },
});
