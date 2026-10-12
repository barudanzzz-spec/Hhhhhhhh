import React from "react";
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { colors } from "./theme";

export function Button({
  title,
  onPress,
  variant = "primary",
  loading,
  disabled,
  testID,
  style,
}: {
  title: string;
  onPress?: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  loading?: boolean;
  disabled?: boolean;
  testID?: string;
  style?: any;
}) {
  const bg =
    variant === "primary" ? colors.brandPrimary :
    variant === "secondary" ? colors.surfaceTertiary :
    variant === "danger" ? colors.error : "transparent";
  const fg =
    variant === "primary" ? colors.onBrandPrimary :
    variant === "secondary" ? colors.onSurfaceSecondary :
    variant === "danger" ? colors.onError : colors.onSurface;
  return (
    <Pressable
      testID={testID}
      disabled={disabled || loading}
      onPress={onPress}
      style={[styles.btn, { backgroundColor: bg, opacity: disabled ? 0.5 : 1 }, style]}
    >
      {loading ? <ActivityIndicator color={fg} /> : <Text style={[styles.btnTxt, { color: fg }]}>{title}</Text>}
    </Pressable>
  );
}

export function Chip({ label, selected, onPress, testID }: { label: string; selected?: boolean; onPress?: () => void; testID?: string }) {
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      style={[
        styles.chip,
        { borderColor: selected ? colors.brand : colors.border, backgroundColor: selected ? colors.brandTertiary : colors.surfaceSecondary },
      ]}
    >
      <Text style={{ color: selected ? colors.brand : colors.onSurfaceSecondary, fontWeight: selected ? "700" : "500" }}>{label}</Text>
    </Pressable>
  );
}

export function Input({
  value, onChangeText, placeholder, secureTextEntry, keyboardType, testID, multiline, numberOfLines,
}: any) {
  const { TextInput } = require("react-native");
  return (
    <TextInput
      testID={testID}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      secureTextEntry={secureTextEntry}
      keyboardType={keyboardType}
      placeholderTextColor={colors.muted}
      multiline={multiline}
      numberOfLines={numberOfLines}
      style={[
        styles.input,
        multiline && { minHeight: 100, textAlignVertical: "top", paddingTop: 14 },
      ]}
    />
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; fg: string; label: string }> = {
    pending_payment: { bg: colors.warning, fg: colors.onWarning, label: "Menunggu Pembayaran" },
    pending_verification: { bg: colors.info, fg: colors.onInfo, label: "Menunggu Verifikasi" },
    paid: { bg: colors.success, fg: colors.onSuccess, label: "Dibayar" },
    pending_delivery: { bg: colors.info, fg: colors.onInfo, label: "Menunggu Penyerahan" },
    in_progress: { bg: colors.info, fg: colors.onInfo, label: "Dalam Proses" },
    completed: { bg: colors.success, fg: colors.onSuccess, label: "Selesai" },
    cancelled: { bg: colors.surfaceTertiary, fg: colors.onSurfaceTertiary, label: "Dibatalkan" },
    failed: { bg: colors.error, fg: colors.onError, label: "Gagal" },
    dispute: { bg: colors.error, fg: colors.onError, label: "Sengketa" },
    refund_processing: { bg: colors.warning, fg: colors.onWarning, label: "Refund Diproses" },
    refunded: { bg: colors.muted, fg: colors.onSurface, label: "Refund Selesai" },
    pending: { bg: colors.warning, fg: colors.onWarning, label: "Menunggu Moderasi" },
    approved: { bg: colors.success, fg: colors.onSuccess, label: "Disetujui" },
    rejected: { bg: colors.error, fg: colors.onError, label: "Ditolak" },
  };
  const v = map[status] || { bg: colors.surfaceTertiary, fg: colors.onSurfaceTertiary, label: status };
  return (
    <View style={{ backgroundColor: v.bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, alignSelf: "flex-start" }}>
      <Text style={{ color: v.fg, fontSize: 11, fontWeight: "700" }}>{v.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  btn: { paddingVertical: 14, paddingHorizontal: 20, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  btnTxt: { fontWeight: "700", fontSize: 15 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1, height: 36, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  input: { backgroundColor: colors.surfaceTertiary, color: colors.onSurface, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, fontSize: 15, borderWidth: 1, borderColor: colors.border },
});
