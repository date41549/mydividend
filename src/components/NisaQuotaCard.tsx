import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { Holding } from "../types";
import { nisaLifetimeUsed, NISA_LIFETIME_CAP, yen, pct } from "../calc";
import { Theme, useTheme, spacing, radius } from "../theme";

// NISA 生涯投資枠（1800万・簿価ベース）の消化ゲージ（FR-11）。
// NISA口座に取得額のある保有が無ければ非表示。
export function NisaQuotaCard({ holdings, fx }: { holdings: Holding[]; fx: number }) {
  const t = useTheme();
  const s = styles(t);
  const used = nisaLifetimeUsed(holdings, fx);
  if (used <= 0) return null;

  const ratio = Math.min(1, used / NISA_LIFETIME_CAP);
  const remaining = Math.max(0, NISA_LIFETIME_CAP - used);

  return (
    <View style={s.card}>
      <View style={s.head}>
        <Text style={s.title}>NISA 生涯投資枠</Text>
        <Text style={s.ratio}>{pct(ratio * 100, 1)}</Text>
      </View>
      <View style={s.track}>
        <View style={[s.fill, { width: `${ratio * 100}%` }]} />
      </View>
      <View style={s.foot}>
        <Text style={s.used}>{yen(used)} / 1,800万円</Text>
        <Text style={s.remaining}>残り {yen(remaining)}</Text>
      </View>
      <Text style={s.note}>※ 簿価（取得額）ベースの概算。年間枠（240万）は未対応。</Text>
    </View>
  );
}

const styles = (t: Theme) =>
  StyleSheet.create({
    card: {
      backgroundColor: t.card,
      borderRadius: radius.md,
      marginHorizontal: spacing.md,
      marginTop: spacing.sm,
      marginBottom: spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      ...Platform.select({
        web: { boxShadow: "0 1px 4px rgba(11,36,24,0.07)" },
        default: {
          shadowColor: "#0B2418",
          shadowOpacity: 0.07,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: 1 },
          elevation: 1,
        },
      }),
    },
    head: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    title: { color: t.text, fontSize: 15, fontWeight: "800" },
    ratio: { color: t.primary, fontSize: 16, fontWeight: "800", fontVariant: ["tabular-nums"] },
    track: {
      height: 14,
      backgroundColor: t.chipBg,
      borderRadius: radius.sm,
      marginTop: spacing.md,
      overflow: "hidden",
    },
    fill: { height: "100%", backgroundColor: t.primary, borderRadius: radius.sm },
    foot: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: spacing.sm,
    },
    used: { color: t.text, fontSize: 13, fontWeight: "600", fontVariant: ["tabular-nums"] },
    remaining: { color: t.sub, fontSize: 12.5, fontVariant: ["tabular-nums"] },
    note: { color: t.faint, fontSize: 10.5, marginTop: spacing.sm, lineHeight: 15 },
  });
