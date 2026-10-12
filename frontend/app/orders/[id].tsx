import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState } from "react";
import { ChevronLeft } from "lucide-react-native";
import { api } from "@/src/api";
import { Button, Input, StatusBadge } from "@/src/ui";
import { colors, formatRupiah } from "@/src/theme";

export default function OrderDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [proof, setProof] = useState("");
  const [note, setNote] = useState("");
  const q = useQuery({ queryKey: ["order", id], queryFn: () => api.order(id!), enabled: !!id });

  const submitProof = useMutation({
    mutationFn: () => api.submitProof(id!, proof, note),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["order", id] }),
  });
  const cancel = useMutation({
    mutationFn: () => api.cancelOrder(id!),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["order", id] }),
  });

  if (q.isLoading || !q.data) return <View style={{ flex: 1, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" }}><ActivityIndicator color={colors.brand} /></View>;
  const o = q.data;

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable onPress={() => router.back()}><ChevronLeft size={22} color={colors.onSurface} /></Pressable>
        <Text style={styles.title}>Detail Pesanan</Text>
        <View style={{ width: 22 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <View style={styles.card}>
          <Text style={{ color: colors.muted, fontSize: 11 }}>ID #{o.id.slice(0, 12)}</Text>
          <Text style={{ color: colors.onSurface, fontWeight: "800", fontSize: 16, marginTop: 6 }}>{o.listing_snapshot?.title}</Text>
          <Text style={{ color: colors.brand, fontWeight: "900", fontSize: 20, marginTop: 10 }}>{formatRupiah(o.total)}</Text>
          <View style={{ marginTop: 10 }}><StatusBadge status={o.status} /></View>
        </View>

        <View style={[styles.card, { marginTop: 16 }]}>
          <Text style={styles.h2}>Pembayaran</Text>
          <Text style={{ color: colors.onSurface, fontWeight: "800", marginTop: 6 }}>{o.payment?.method_name}</Text>
          {o.payment?.account_number ? <Text style={{ color: colors.onSurfaceSecondary, marginTop: 4 }}>No: {o.payment.account_number}</Text> : null}
          {o.payment?.account_name ? <Text style={{ color: colors.onSurfaceSecondary, marginTop: 2 }}>a.n: {o.payment.account_name}</Text> : null}
          {o.payment?.bank_name ? <Text style={{ color: colors.onSurfaceSecondary, marginTop: 2 }}>Bank: {o.payment.bank_name}</Text> : null}
          {o.payment?.instructions ? <Text style={{ color: colors.muted, marginTop: 8, fontSize: 12 }}>{o.payment.instructions}</Text> : null}
        </View>

        {o.status === "pending_payment" && (
          <View style={[styles.card, { marginTop: 16 }]}>
            <Text style={styles.h2}>Konfirmasi Pembayaran</Text>
            <Text style={{ color: colors.muted, marginBottom: 12, fontSize: 12 }}>Setelah transfer, kirim bukti dan catatan opsional.</Text>
            <Input testID="op-proof" value={proof} onChangeText={setProof} placeholder="URL bukti (opsional)" />
            <View style={{ height: 10 }} />
            <Input testID="op-note" value={note} onChangeText={setNote} placeholder="Catatan untuk admin" multiline numberOfLines={3} />
            <View style={{ height: 12 }} />
            <Button testID="op-submit" title="Kirim Bukti Pembayaran" onPress={() => submitProof.mutate()} loading={submitProof.isPending} />
            <View style={{ height: 10 }} />
            <Button testID="op-cancel" title="Batalkan Pesanan" variant="secondary" onPress={() => cancel.mutate()} loading={cancel.isPending} />
          </View>
        )}
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { color: colors.onSurface, fontSize: 18, fontWeight: "800" },
  card: { backgroundColor: colors.surfaceSecondary, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 16 },
  h2: { color: colors.onSurface, fontSize: 15, fontWeight: "800" },
});
