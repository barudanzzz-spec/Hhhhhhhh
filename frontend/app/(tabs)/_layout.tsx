import { Tabs } from "expo-router";
import { Home, Grid3x3, Plus, Heart, User } from "lucide-react-native";
import { colors } from "@/src/theme";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.surfaceSecondary,
          borderTopColor: colors.border,
          borderTopWidth: 1,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        tabBarItemStyle: { alignSelf: "center" },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Beranda", tabBarIcon: ({ color }) => <Home size={22} color={color} /> }} />
      <Tabs.Screen name="kategori" options={{ title: "Kategori", tabBarIcon: ({ color }) => <Grid3x3 size={22} color={color} /> }} />
      <Tabs.Screen name="jual" options={{ title: "Jual Akun", tabBarIcon: ({ color }) => <Plus size={22} color={color} /> }} />
      <Tabs.Screen name="favorit" options={{ title: "Favorit", tabBarIcon: ({ color }) => <Heart size={22} color={color} /> }} />
      <Tabs.Screen name="profil" options={{ title: "Profil", tabBarIcon: ({ color }) => <User size={22} color={color} /> }} />
    </Tabs>
  );
}
