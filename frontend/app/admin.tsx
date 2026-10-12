import { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft, Users, Package, CreditCard, BarChart3, Settings as SettingsIcon } from "lucide-react-native";
import { api } from "@/src/api";
import { useAuth } from "@/src/auth-context";
import { Button, Chip, Input, StatusBadge } from "@/src/ui";
import { colors, formatRupiah } from "@/src/theme";

type Tab = "stats" | "listings" | "orders" | "users" | "payments" | "settings";

export default function Admin() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("stats");

  if (!user || user.role !== "admin") {
    return (
      <View style={{ flex: 1, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center", padding: 24 }}>
        <Text style={{ color: colors.error, fontWeight: "800", fontSize: 18 }}>Akses Ditolak</Text>
        <Text style={{ color: colors.muted, marginTop: 8 }}>Hanya admin yang dapat mengakses halaman ini.</Text>
        <View style={{ height: 16 }} />
        <Button title="Kembali" onPress={() => router.back()} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.surface }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable onPress={() => router.back()}><ChevronLeft size={22} color={colors.onSurface} /></Pressable>
        <Text style={styles.title}>Admin Dashboard</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingVertical: 10 }} style={{ height: 56 }}>
        <Chip testID="tab-stats" label="Statistik" selected={tab === "stats"} onPress={() => setTab("stats")} />
        <Chip testID="tab-listings" label="Moderasi" selected={tab === "listings"} onPress={() => setTab("listings")} />
        <Chip testID="tab-orders" label="Pesanan" selected={tab === "orders"} onPress={() => setTab("orders")} />
        <Chip testID="tab-users" label="Pengguna" selected={tab === "users"} onPress={() => setTab("users")} />
        <Chip testID="tab-payments" label="Pembayaran" selected={tab === "payments"} onPress={() => setTab("payments")} />
        <Chip testID="tab-settings" label="Pengaturan" selected={tab === "settings"} onPress={() => setTab("settings")} />
      </ScrollView>

      {tab === "stats" && <StatsTab />}
      {tab === "listings" && <ListingsTab />}
      {tab === "orders" && <OrdersTab />}
      {tab === "users" && <UsersTab />}
      {tab === "payments" && <PaymentsTab />}
      {tab === "settings" && <SettingsTab />}
    </KeyboardAvoidingView>
  );
}

function StatsTab() {
  const q = useQuery({ queryKey: ["admin-stats"], queryFn: api.adminStats });
  if (q.isLoading) return <ActivityIndicator color={colors.brand} style={{ marginTop: 24 }} />;
  const s = q.data || {};
  const Stat = ({ label, value, hero }: any) => (
    <View style={[styles.stat, hero && { backgroundColor: colors.brandTertiary, borderColor: colors.brand }]}>
      <Text style={{ color: colors.muted, fontSize: 11, fontWeight: "700", letterSpacing: 1 }}>{label.toUpperCase()}</Text>
      <Text style={{ color: hero ? colors.brand : colors.onSurface, fontSize: 22, fontWeight: "900", marginTop: 6 }}>{value}</Text>
    </View>
  );
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
      <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
        <Stat label="Pengguna" value={s.users ?? 0} />
        <Stat label="Listing Total" value={s.listings_total ?? 0} />
        <Stat label="Menunggu Moderasi" value={s.listings_pending ?? 0} />
        <Stat label="Listing Aktif" value={s.listings_approved ?? 0} />
        <Stat label="Pesanan Total" value={s.orders_total ?? 0} />
        <Stat label="Pesanan Pending" value={s.orders_pending ?? 0} />
        <Stat label="Pesanan Berhasil" value={s.orders_paid ?? 0} />
        <Stat label="Revenue" value={formatRupiah(s.revenue ?? 0)} hero />
      </View>
    </ScrollView>
  );
}

function ListingsTab() {
  const qc = useQueryClient();
  const [reason, setReason] = useState<Record<string, string>>({});
  const q = useQuery({ queryKey: ["pending-listings"], queryFn: api.listingsPending });
  const act = useMutation({
    mutationFn: ({ id, action, r }: any) => api.moderateListing(id, action, r),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pending-listings"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
      qc.invalidateQueries({ queryKey: ["listings-home"] });
    },
  });
  if (q.isLoading) return <ActivityIndicator color={colors.brand} style={{ marginTop: 24 }} />;
  const data = q.data || [];
  if (data.length === 0) return <Text style={{ color: colors.muted, textAlign: "center", padding: 32 }}>Tidak ada listing menunggu moderasi</Text>;
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      {data.map((l: any) => (
        <View key={l.id} style={styles.card}>
          <Text style={{ color: colors.onSurface, fontWeight: "800" }}>{l.title}</Text>
          <Text style={{ color: colors.muted, fontSize: 11, marginTop: 2 }}>{l.category_name} • {l.seller_name}</Text>
          <Text style={{ color: colors.brand, fontWeight: "900", marginTop: 6 }}>{formatRupiah(l.price)}</Text>
          <Text numberOfLines={3} style={{ color: colors.onSurfaceSecondary, marginTop: 8, fontSize: 13 }}>{l.description}</Text>
          <View style={{ marginTop: 10, flexDirection: "row", gap: 8 }}>
            <Button testID={`approve-${l.id}`} title="Setujui" onPress={() => act.mutate({ id: l.id, action: "approve" })} style={{ flex: 1 }} />
            <Button testID={`reject-${l.id}`} title="Tolak" variant="danger" onPress={() => act.mutate({ id: l.id, action: "reject", r: reason[l.id] || "Tidak sesuai kebijakan" })} style={{ flex: 1 }} />
          </View>
          <View style={{ marginTop: 8 }}>
            <Input value={reason[l.id] || ""} onChangeText={(v: string) => setReason({ ...reason, [l.id]: v })} placeholder="Alasan penolakan (opsional)" />
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

function OrdersTab() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["admin-orders"], queryFn: api.adminOrders });
  const upd = useMutation({
    mutationFn: ({ id, status }: any) => api.adminUpdateOrderStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-orders"] }),
  });
  if (q.isLoading) return <ActivityIndicator color={colors.brand} style={{ marginTop: 24 }} />;
  const data = q.data || [];
  const nextMap: Record<string, string> = {
    pending_payment: "cancelled",
    pending_verification: "paid",
    paid: "completed",
    in_progress: "completed",
    pending_delivery: "completed",
  };
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      {data.length === 0 && <Text style={{ color: colors.muted, textAlign: "center", padding: 24 }}>Belum ada pesanan</Text>}
      {data.map((o: any) => (
        <View key={o.id} style={styles.card}>
          <Text style={{ color: colors.muted, fontSize: 10 }}>#{o.id.slice(0, 10)}</Text>
          <Text style={{ color: colors.onSurface, fontWeight: "700", marginTop: 4 }} numberOfLines={1}>{o.listing_snapshot?.title}</Text>
          <Text style={{ color: colors.brand, fontWeight: "900", marginTop: 6 }}>{formatRupiah(o.total)}</Text>
          <View style={{ marginTop: 8 }}><StatusBadge status={o.status} /></View>
          <Text style={{ color: colors.muted, fontSize: 12, marginTop: 6 }}>Pembeli: {o.buyer_name}</Text>
          {o.proof_url && <Text style={{ color: colors.info, fontSize: 12, marginTop: 2 }}>Bukti: {o.proof_url}</Text>}
          {nextMap[o.status] && (
            <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
              {o.status === "pending_verification" && <Button testID={`verify-${o.id}`} title="Konfirmasi Lunas" onPress={() => upd.mutate({ id: o.id, status: "paid" })} style={{ flex: 1 }} />}
              <Button testID={`complete-${o.id}`} title="Tandai Selesai" variant="secondary" onPress={() => upd.mutate({ id: o.id, status: "completed" })} style={{ flex: 1 }} />
            </View>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

function UsersTab() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["admin-users"], queryFn: api.adminUsers });
  const t = useMutation({
    mutationFn: (id: string) => api.toggleUser(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });
  if (q.isLoading) return <ActivityIndicator color={colors.brand} style={{ marginTop: 24 }} />;
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
      {(q.data || []).map((u: any) => (
        <View key={u.id} style={styles.card}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.onSurface, fontWeight: "700" }}>{u.display_name}</Text>
              <Text style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>{u.email}</Text>
              <View style={{ flexDirection: "row", gap: 6, marginTop: 6 }}>
                <View style={{ backgroundColor: u.role === "admin" ? colors.brandTertiary : colors.surfaceTertiary, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 }}>
                  <Text style={{ color: u.role === "admin" ? colors.brand : colors.muted, fontSize: 10, fontWeight: "800" }}>{u.role.toUpperCase()}</Text>
                </View>
                {u.disabled && <View style={{ backgroundColor: colors.error, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 }}><Text style={{ color: colors.onError, fontSize: 10, fontWeight: "800" }}>DISABLED</Text></View>}
              </View>
            </View>
            {u.role !== "admin" && (
              <Button testID={`toggle-${u.id}`} title={u.disabled ? "Aktifkan" : "Nonaktifkan"} variant={u.disabled ? "primary" : "secondary"} onPress={() => t.mutate(u.id)} />
            )}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

function PaymentsTab() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["admin-pm"], queryFn: api.adminPaymentMethods });
  const upd = useMutation({
    mutationFn: ({ id, body }: any) => api.updatePaymentMethod(id, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-pm"] }); qc.invalidateQueries({ queryKey: ["payment-methods"] }); },
  });
  const [edits, setEdits] = useState<Record<string, any>>({});
  if (q.isLoading) return <ActivityIndicator color={colors.brand} style={{ marginTop: 24 }} />;

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }} keyboardShouldPersistTaps="handled">
      {(q.data || []).map((pm: any) => {
        const current = { ...pm, ...(edits[pm.id] || {}) };
        const setField = (k: string, v: any) => setEdits({ ...edits, [pm.id]: { ...(edits[pm.id] || {}), [k]: v } });
        return (
          <View key={pm.id} style={styles.card}>
            <Text style={{ color: colors.onSurface, fontWeight: "800", fontSize: 16 }}>{pm.name}</Text>
            <Text style={{ color: colors.muted, fontSize: 11, marginTop: 2 }}>{pm.type.toUpperCase()}</Text>
            <View style={{ height: 10 }} />
            <Text style={styles.lbl}>Nomor / Rekening</Text>
            <Input testID={`pm-num-${pm.name}`} value={current.account_number || ""} onChangeText={(v: string) => setField("account_number", v)} placeholder="Nomor rekening/e-wallet" />
            <View style={{ height: 8 }} />
            <Text style={styles.lbl}>Nama Pemilik</Text>
            <Input value={current.account_name || ""} onChangeText={(v: string) => setField("account_name", v)} placeholder="Nama pemilik" />
            <View style={{ height: 8 }} />
            <Text style={styles.lbl}>Instruksi</Text>
            <Input value={current.instructions || ""} onChangeText={(v: string) => setField("instructions", v)} placeholder="Instruksi untuk pembeli" multiline numberOfLines={3} />
            <View style={{ height: 10 }} />
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Button
                testID={`pm-toggle-${pm.name}`}
                title={current.enabled ? "Nonaktifkan" : "Aktifkan"}
                variant="secondary"
                onPress={() => upd.mutate({ id: pm.id, body: { ...current, enabled: !current.enabled } })}
                style={{ flex: 1 }}
              />
              <Button
                testID={`pm-save-${pm.name}`}
                title="Simpan"
                onPress={() => upd.mutate({ id: pm.id, body: current })}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

function SettingsTab() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["settings"], queryFn: api.siteSettings });
  const [draft, setDraft] = useState<any>({});
  const current = { ...(q.data || {}), ...draft };
  const save = useMutation({
    mutationFn: () => api.updateSiteSettings(draft),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["settings"] }); setDraft({}); },
  });
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
      <View style={styles.card}>
        <Text style={styles.lbl}>Nama Toko</Text>
        <Input testID="st-name" value={current.store_name || ""} onChangeText={(v: string) => setDraft({ ...draft, store_name: v })} />
        <View style={{ height: 10 }} />
        <Text style={styles.lbl}>Tagline</Text>
        <Input testID="st-tag" value={current.tagline || ""} onChangeText={(v: string) => setDraft({ ...draft, tagline: v })} />
        <View style={{ height: 10 }} />
        <Text style={styles.lbl}>WhatsApp</Text>
        <Input value={current.contact_whatsapp || ""} onChangeText={(v: string) => setDraft({ ...draft, contact_whatsapp: v })} />
        <View style={{ height: 10 }} />
        <Text style={styles.lbl}>Email</Text>
        <Input value={current.contact_email || ""} onChangeText={(v: string) => setDraft({ ...draft, contact_email: v })} />
        <View style={{ height: 10 }} />
        <Text style={styles.lbl}>Pengumuman</Text>
        <Input value={current.announcement || ""} onChangeText={(v: string) => setDraft({ ...draft, announcement: v })} multiline numberOfLines={3} />
        <View style={{ height: 12 }} />
        <Button testID="st-save" title="Simpan Pengaturan" onPress={() => save.mutate()} loading={save.isPending} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { color: colors.onSurface, fontSize: 18, fontWeight: "800" },
  stat: { backgroundColor: colors.surfaceSecondary, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: colors.border, width: "48%", flexGrow: 1 },
  card: { backgroundColor: colors.surfaceSecondary, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: colors.border },
  lbl: { color: colors.muted, fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 },
});
