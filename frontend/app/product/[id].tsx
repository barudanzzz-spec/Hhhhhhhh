import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Heart, ChevronLeft, Flag } from "lucide-react-native";
import { useState, useEffect } from "react";
import { api } from "@/src/api";
import { useAuth } from "@/src/auth-context";
import { Button, StatusBadge } from "@/src/ui";
import { colors, formatRupiah } from "@/src/theme";

export default function ProductDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["listing", id], queryFn: () => api.listing(id!), enabled: !!id });
  const favQ = useQuery({ queryKey: ["favorites"], queryFn: api.favorites, enabled: !!user });
  const isFav = (favQ.data || []).some((f: any) => f.id === id);

  const favM = useMutation({
    mutationFn: async () => {
      if (isFav) await api.removeFavorite(id!);
      else await api.addFavorite(id!);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["favorites"] }),
  });

  if (q.isLoading || !q.data) {
    return <View style={{ flex: 1, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" }}><ActivityIndicator color={colors.brand} /></View>;
  }

  const l = q.data;
  const canBuy = l.status === "approved" && l.availability === "available" && user && user.id !== l.seller_id;

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={{ position: "relative" }}>
          <Image source={{ uri: l.images?.[0] || "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800" }} style={{ width: "100%", height: 320 }} contentFit="cover" />
          <Pressable testID="pd-back" onPress={() => router.back()} style={[styles.topBtn, { top: insets.top + 10, left: 16 }]}>
            <ChevronLeft size={22} color={colors.onSurface} />
          </Pressable>
          {user && (
            <Pressable testID="pd-fav" onPress={() => favM.mutate()} style={[styles.topBtn, { top: insets.top + 10, right: 16 }]}>
              <Heart size={22} color={isFav ? colors.brand : colors.onSurface} fill={isFav ? colors.brand : "transparent"} />
            </Pressable>
          )}
          {l.is_demo && <View style={[styles.demoBadge, { top: insets.top + 10, left: 72 }]}><Text style={styles.demoTxt}>DEMO</Text></View>}
        </View>

        <View style={{ padding: 20 }}>
          <Text style={{ color: colors.brand, fontSize: 12, fontWeight: "800", letterSpacing: 1 }}>{l.category_name?.toUpperCase()}</Text>
          <Text style={{ color: colors.onSurface, fontSize: 22, fontWeight: "900", marginTop: 6 }} testID="pd-title">{l.title}</Text>
          <Text style={{ color: colors.brand, fontSize: 26, fontWeight: "900", marginTop: 12 }} testID="pd-price">{formatRupiah(l.price)}</Text>
          <View style={{ marginTop: 10 }}>
            <StatusBadge status={l.availability === "sold" ? "cancelled" : l.availability === "reserved" ? "pending_verification" : l.status} />
          </View>

          <Text style={styles.h2}>Deskripsi</Text>
          <Text style={{ color: colors.onSurfaceSecondary, lineHeight: 22 }}>{l.description}</Text>

          {l.item_info && (
            <>
              <Text style={styles.h2}>Info Item</Text>
              <Text style={{ color: colors.onSurfaceSecondary, lineHeight: 22 }}>{l.item_info}</Text>
            </>
          )}

          <Text style={styles.h2}>Penjual</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.surfaceSecondary, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.border }}>
            <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: colors.brandTertiary, alignItems: "center", justifyContent: "center" }}>
              <Text style={{ color: colors.brand, fontWeight: "900" }}>{(l.seller?.display_name || "?")[0].toUpperCase()}</Text>
            </View>
            <Text style={{ color: colors.onSurface, fontWeight: "700" }}>{l.seller?.display_name || "—"}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        {canBuy ? (
          <Button testID="pd-buy" title="Beli Sekarang" onPress={() => router.push(`/checkout?id=${l.id}`)} />
        ) : !user ? (
          <Button testID="pd-login" title="Masuk untuk Membeli" onPress={() => router.push("/login")} />
        ) : (
          <Button title={l.availability !== "available" ? "Tidak Tersedia" : "Listing Milik Sendiri"} disabled onPress={() => {}} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topBtn: { position: "absolute", backgroundColor: "rgba(10,10,10,0.6)", width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  demoBadge: { position: "absolute", backgroundColor: colors.warning, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  demoTxt: { color: colors.onWarning, fontSize: 11, fontWeight: "900", letterSpacing: 1 },
  h2: { color: colors.onSurface, fontSize: 16, fontWeight: "800", marginTop: 22, marginBottom: 10 },
  bottomBar: { position: "absolute", left: 0, right: 0, bottom: 0, padding: 16, paddingTop: 12, backgroundColor: colors.surfaceSecondary, borderTopWidth: 1, borderTopColor: colors.border },
});
