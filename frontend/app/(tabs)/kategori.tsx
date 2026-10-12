import { useState, useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, ActivityIndicator } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Search } from "lucide-react-native";
import { api } from "@/src/api";
import { Chip } from "@/src/ui";
import { colors, formatRupiah } from "@/src/theme";

export default function Kategori() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ cat?: string }>();
  const router = useRouter();
  const [selectedCat, setSelectedCat] = useState<string | null>(params.cat || null);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"newest" | "price_asc" | "price_desc">("newest");

  const catsQ = useQuery({ queryKey: ["cats"], queryFn: api.categories });
  const listQ = useQuery({
    queryKey: ["listings", selectedCat, q, sort],
    queryFn: () => api.listings({ category_id: selectedCat || undefined, q: q || undefined, sort, limit: 100 }),
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.title}>Kategori</Text>
        <View style={styles.searchBox}>
          <Search size={16} color={colors.muted} />
          <TextInput
            testID="cat-search"
            value={q}
            onChangeText={setQ}
            placeholder="Cari akun game..."
            placeholderTextColor={colors.muted}
            style={{ flex: 1, color: colors.onSurface, marginLeft: 8 }}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingVertical: 10 }} style={{ height: 56 }}>
          <Chip testID="cat-all" label="Semua" selected={!selectedCat} onPress={() => setSelectedCat(null)} />
          {(catsQ.data || []).map((c) => (
            <Chip key={c.id} testID={`chip-${c.slug}`} label={c.name} selected={selectedCat === c.id} onPress={() => setSelectedCat(c.id)} />
          ))}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingBottom: 10 }} style={{ height: 46 }}>
          <Chip label="Terbaru" selected={sort === "newest"} onPress={() => setSort("newest")} testID="sort-newest" />
          <Chip label="Termurah" selected={sort === "price_asc"} onPress={() => setSort("price_asc")} testID="sort-asc" />
          <Chip label="Termahal" selected={sort === "price_desc"} onPress={() => setSort("price_desc")} testID="sort-desc" />
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: 32 }}>
        {listQ.isLoading ? (
          <ActivityIndicator color={colors.brand} />
        ) : (listQ.data || []).length === 0 ? (
          <Text style={{ color: colors.muted, textAlign: "center", padding: 32 }}>Tidak ada hasil</Text>
        ) : (
          <View style={styles.grid}>
            {(listQ.data || []).map((l) => (
              <Pressable key={l.id} testID={`cat-item-${l.id}`} style={styles.card} onPress={() => router.push(`/product/${l.id}`)}>
                <Image source={{ uri: l.images?.[0] || "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600" }} style={{ width: "100%", height: 130 }} contentFit="cover" />
                <View style={{ padding: 10 }}>
                  <Text style={{ color: colors.muted, fontSize: 10, fontWeight: "700" }}>{l.category_name}</Text>
                  <Text numberOfLines={2} style={{ color: colors.onSurface, fontWeight: "700", fontSize: 13, marginTop: 4, minHeight: 36 }}>{l.title}</Text>
                  <Text style={{ color: colors.brand, fontWeight: "900", marginTop: 6 }}>{formatRupiah(l.price)}</Text>
                </View>
                {l.is_demo && <View style={styles.demoBadge}><Text style={styles.demoTxt}>DEMO</Text></View>}
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  header: { backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border, paddingHorizontal: 16, paddingBottom: 4 },
  title: { color: colors.onSurface, fontSize: 24, fontWeight: "900", marginBottom: 12 },
  searchBox: { flexDirection: "row", alignItems: "center", backgroundColor: colors.surfaceTertiary, paddingHorizontal: 12, borderRadius: 12, height: 42 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  card: { width: "48%", flexGrow: 1, backgroundColor: colors.surfaceSecondary, borderRadius: 14, overflow: "hidden", borderWidth: 1, borderColor: colors.border, minWidth: 150, maxWidth: "48.5%" },
  demoBadge: { position: "absolute", top: 8, left: 8, backgroundColor: colors.warning, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  demoTxt: { color: colors.onWarning, fontSize: 10, fontWeight: "900", letterSpacing: 1 },
});
