import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Heart } from "lucide-react-native";
import { api } from "@/src/api";
import { useAuth } from "@/src/auth-context";
import { Button } from "@/src/ui";
import { colors, formatRupiah } from "@/src/theme";

export default function Favorit() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const q = useQuery({ queryKey: ["favorites"], queryFn: api.favorites, enabled: !!user });

  if (!user) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center", padding: 24 }}>
        <Heart size={48} color={colors.muted} />
        <Text style={{ color: colors.onSurface, fontSize: 18, fontWeight: "700", marginTop: 16 }}>Masuk Dulu</Text>
        <Text style={{ color: colors.muted, textAlign: "center", marginVertical: 12 }}>Login untuk menyimpan listing favorit.</Text>
        <Button title="Masuk" onPress={() => router.push("/login")} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={{ paddingTop: insets.top + 16, paddingHorizontal: 16, paddingBottom: 12 }}>
        <Text style={{ color: colors.onSurface, fontSize: 24, fontWeight: "900" }}>Favorit</Text>
      </View>
      {q.isLoading ? (
        <ActivityIndicator color={colors.brand} style={{ marginTop: 24 }} />
      ) : (q.data || []).length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
          <Heart size={48} color={colors.muted} />
          <Text style={{ color: colors.muted, marginTop: 12 }}>Belum ada favorit. Mulai jelajah katalog.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
          {(q.data || []).map((l: any) => (
            <Pressable key={l.id} testID={`fav-${l.id}`} style={styles.row} onPress={() => router.push(`/product/${l.id}`)}>
              <Image source={{ uri: l.images?.[0] || "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400" }} style={{ width: 90, height: 90, borderRadius: 10 }} contentFit="cover" />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ color: colors.muted, fontSize: 10, fontWeight: "700" }}>{l.category_name}</Text>
                <Text numberOfLines={2} style={{ color: colors.onSurface, fontWeight: "700", marginTop: 2 }}>{l.title}</Text>
                <Text style={{ color: colors.brand, fontWeight: "900", marginTop: 8 }}>{formatRupiah(l.price)}</Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  row: { flexDirection: "row", backgroundColor: colors.surfaceSecondary, padding: 10, borderRadius: 14, borderWidth: 1, borderColor: colors.border },
});
