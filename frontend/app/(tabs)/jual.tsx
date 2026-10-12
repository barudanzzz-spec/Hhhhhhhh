import { useState } from "react";
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Pressable } from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "@/src/api";
import { useAuth } from "@/src/auth-context";
import { Button, Input, Chip } from "@/src/ui";
import { colors } from "@/src/theme";

export default function Jual() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const qc = useQueryClient();
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [desc, setDesc] = useState("");
  const [image, setImage] = useState("");
  const [itemInfo, setItemInfo] = useState("");
  const [catId, setCatId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const catsQ = useQuery({ queryKey: ["cats"], queryFn: api.categories });
  const mut = useMutation({
    mutationFn: () => api.createListing({ title, category_id: catId!, price: parseFloat(price), description: desc, images: image ? [image] : [], item_info: itemInfo || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["listings-home"] });
      qc.invalidateQueries({ queryKey: ["listings"] });
      setOk(true); setTitle(""); setPrice(""); setDesc(""); setImage(""); setItemInfo(""); setCatId(null);
      setTimeout(() => setOk(false), 3000);
    },
    onError: (e: any) => setErr(e.message),
  });

  if (!user) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center", padding: 24 }}>
        <Text style={{ color: colors.onSurface, fontSize: 18, fontWeight: "700", marginBottom: 12 }}>Masuk Dulu</Text>
        <Text style={{ color: colors.muted, textAlign: "center", marginBottom: 20 }}>Silakan login untuk menjual akun game.</Text>
        <Button title="Masuk" onPress={() => router.push("/login")} />
      </View>
    );
  }

  const submit = () => {
    setErr(null);
    if (!title || !catId || !price || !desc) { setErr("Lengkapi semua field wajib"); return; }
    if (parseFloat(price) <= 0) { setErr("Harga harus positif"); return; }
    mut.mutate();
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.surface }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: insets.top + 16, paddingBottom: 100 }}>
        <Text style={{ color: colors.onSurface, fontSize: 24, fontWeight: "900" }}>Jual Akun Game</Text>
        <Text style={{ color: colors.muted, marginTop: 4, marginBottom: 20 }}>Listing akan ditinjau admin sebelum tayang.</Text>

        <Text style={styles.label}>Kategori Game *</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }} style={{ marginBottom: 14 }}>
          {(catsQ.data || []).map((c) => (
            <Chip key={c.id} testID={`sell-cat-${c.slug}`} label={c.name} selected={catId === c.id} onPress={() => setCatId(c.id)} />
          ))}
        </ScrollView>

        <Text style={styles.label}>Judul Listing *</Text>
        <Input testID="sell-title" value={title} onChangeText={setTitle} placeholder="Contoh: Akun ML Mythic Glory" />

        <Text style={[styles.label, { marginTop: 14 }]}>Harga (Rp) *</Text>
        <Input testID="sell-price" value={price} onChangeText={setPrice} placeholder="150000" keyboardType="numeric" />

        <Text style={[styles.label, { marginTop: 14 }]}>Deskripsi *</Text>
        <Input testID="sell-desc" value={desc} onChangeText={setDesc} placeholder="Deskripsikan akun kamu" multiline numberOfLines={5} />

        <Text style={[styles.label, { marginTop: 14 }]}>URL Gambar</Text>
        <Input testID="sell-image" value={image} onChangeText={setImage} placeholder="https://..." />

        <Text style={[styles.label, { marginTop: 14 }]}>Info Item (opsional)</Text>
        <Input testID="sell-info" value={itemInfo} onChangeText={setItemInfo} placeholder="Rank, hero/skin, dll" multiline numberOfLines={3} />

        {err && <Text style={{ color: colors.error, marginTop: 12 }} testID="sell-error">{err}</Text>}
        {ok && <Text style={{ color: colors.success, marginTop: 12 }} testID="sell-ok">Listing berhasil dikirim! Menunggu moderasi admin.</Text>}

        <View style={{ height: 20 }} />
        <Button testID="sell-submit" title="Kirim ke Moderasi" onPress={submit} loading={mut.isPending} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
const styles = StyleSheet.create({
  label: { color: colors.muted, fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 },
});
