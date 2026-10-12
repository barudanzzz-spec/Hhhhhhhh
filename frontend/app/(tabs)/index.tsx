import { View, Text, StyleSheet, ScrollView, Pressable, FlatList, RefreshControl, ActivityIndicator } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Zap, Search, TrendingUp } from "lucide-react-native";
import { api } from "@/src/api";
import { colors, formatRupiah } from "@/src/theme";
import { useState } from "react";

export default function Home() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const catsQ = useQuery({ queryKey: ["cats"], queryFn: api.categories });
  const listingsQ = useQuery({ queryKey: ["listings-home"], queryFn: () => api.listings({ limit: 20 }) });
  const settingsQ = useQuery({ queryKey: ["settings"], queryFn: api.siteSettings });

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([catsQ.refetch(), listingsQ.refetch(), settingsQ.refetch()]);
    setRefreshing(false);
  };

  const featured = (listingsQ.data || []).filter((l) => l.featured);
  const latest = listingsQ.data || [];

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View style={styles.logoBox}><Zap size={20} color={colors.brand} fill={colors.brand} /></View>
            <View>
              <Text style={{ color: colors.onSurface, fontWeight: "900", fontSize: 16, letterSpacing: 1.5 }}>{settingsQ.data?.store_name || "DANZ STORE V5"}</Text>
              <Text style={{ color: colors.muted, fontSize: 11 }}>{settingsQ.data?.tagline || "Marketplace Premium Akun Game"}</Text>
            </View>
          </View>
        </View>

        {/* Hero */}
        <View style={styles.hero}>
          <Image
            source={{ uri: "https://images.unsplash.com/photo-1605362001336-f91645086f32?w=1200" }}
            style={StyleSheet.absoluteFillObject}
            contentFit="cover"
          />
          <LinearGradient colors={["transparent", "rgba(10,10,10,0.95)"]} style={StyleSheet.absoluteFillObject} />
          <View style={styles.heroContent}>
            <Text style={styles.heroEyebrow}>FLASH DEAL</Text>
            <Text style={styles.heroTitle}>Akun Premium{"\n"}Dengan Harga Terbaik</Text>
            <Pressable style={styles.heroBtn} onPress={() => router.push("/(tabs)/kategori")} testID="hero-explore">
              <Text style={{ color: colors.onBrandPrimary, fontWeight: "800" }}>Jelajahi Katalog</Text>
            </Pressable>
          </View>
        </View>

        {/* Categories */}
        <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Kategori Game</Text>
            <Pressable onPress={() => router.push("/(tabs)/kategori")}><Text style={{ color: colors.brand, fontWeight: "700" }}>Lihat Semua</Text></Pressable>
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 10, paddingTop: 12 }}>
          {(catsQ.data || []).map((c) => (
            <Pressable key={c.id} testID={`cat-chip-${c.slug}`} style={styles.catChip} onPress={() => router.push({ pathname: "/(tabs)/kategori", params: { cat: c.id } })}>
              <Text style={{ color: colors.onSurfaceSecondary, fontWeight: "700", fontSize: 13 }}>{c.name}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Featured */}
        {featured.length > 0 && (
          <>
            <View style={[styles.sectionHead, { paddingHorizontal: 16, marginTop: 28 }]}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <TrendingUp size={18} color={colors.brand} />
                <Text style={styles.sectionTitle}>Produk Unggulan</Text>
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12, paddingTop: 12 }}>
              {featured.map((l) => <FeaturedCard key={l.id} item={l} onPress={() => router.push(`/product/${l.id}`)} />)}
            </ScrollView>
          </>
        )}

        {/* Latest grid */}
        <View style={[styles.sectionHead, { paddingHorizontal: 16, marginTop: 28 }]}>
          <Text style={styles.sectionTitle}>Terbaru</Text>
        </View>
        {listingsQ.isLoading ? (
          <ActivityIndicator color={colors.brand} style={{ marginTop: 24 }} />
        ) : latest.length === 0 ? (
          <Text style={{ color: colors.muted, textAlign: "center", padding: 24 }}>Belum ada listing.</Text>
        ) : (
          <View style={styles.grid}>
            {latest.map((l) => <GridCard key={l.id} item={l} onPress={() => router.push(`/product/${l.id}`)} />)}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function FeaturedCard({ item, onPress }: any) {
  return (
    <Pressable testID={`featured-${item.id}`} onPress={onPress} style={styles.featured}>
      <Image source={{ uri: item.images?.[0] || "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600" }} style={{ width: "100%", height: 160 }} contentFit="cover" />
      <View style={{ padding: 12 }}>
        <Text numberOfLines={2} style={{ color: colors.onSurface, fontWeight: "700" }}>{item.title}</Text>
        <Text style={{ color: colors.brand, fontWeight: "900", marginTop: 6, fontSize: 16 }}>{formatRupiah(item.price)}</Text>
      </View>
      {item.is_demo && <View style={styles.demoBadge}><Text style={styles.demoTxt}>DEMO</Text></View>}
    </Pressable>
  );
}

function GridCard({ item, onPress }: any) {
  return (
    <Pressable testID={`listing-${item.id}`} onPress={onPress} style={styles.gridCard}>
      <Image source={{ uri: item.images?.[0] || "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600" }} style={{ width: "100%", height: 130 }} contentFit="cover" />
      <View style={{ padding: 10 }}>
        <Text style={{ color: colors.muted, fontSize: 10, fontWeight: "700" }}>{item.category_name}</Text>
        <Text numberOfLines={2} style={{ color: colors.onSurface, fontWeight: "700", fontSize: 13, marginTop: 4, minHeight: 36 }}>{item.title}</Text>
        <Text style={{ color: colors.brand, fontWeight: "900", marginTop: 6 }}>{formatRupiah(item.price)}</Text>
      </View>
      {item.is_demo && <View style={styles.demoBadge}><Text style={styles.demoTxt}>DEMO</Text></View>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingVertical: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  logoBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.brandTertiary, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.brand },
  hero: { marginHorizontal: 16, borderRadius: 20, overflow: "hidden", height: 200, backgroundColor: colors.surfaceSecondary, marginTop: 12 },
  heroContent: { position: "absolute", left: 0, right: 0, bottom: 0, padding: 20 },
  heroEyebrow: { color: colors.brand, fontWeight: "800", letterSpacing: 2, fontSize: 11 },
  heroTitle: { color: colors.onSurface, fontSize: 22, fontWeight: "900", marginTop: 6 },
  heroBtn: { backgroundColor: colors.brandPrimary, alignSelf: "flex-start", paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12, marginTop: 12 },
  sectionHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionTitle: { color: colors.onSurface, fontSize: 18, fontWeight: "800" },
  catChip: { backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999, flexShrink: 0 },
  featured: { width: 240, backgroundColor: colors.surfaceSecondary, borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: colors.border },
  grid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 12, paddingTop: 12, gap: 8 },
  gridCard: { width: "48%", flexGrow: 1, backgroundColor: colors.surfaceSecondary, borderRadius: 14, overflow: "hidden", borderWidth: 1, borderColor: colors.border, minWidth: 150, maxWidth: "48.5%" },
  demoBadge: { position: "absolute", top: 8, left: 8, backgroundColor: colors.warning, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  demoTxt: { color: colors.onWarning, fontSize: 10, fontWeight: "900", letterSpacing: 1 },
});
