import React from "react";
import { View, Text, StyleSheet, ScrollView, Platform } from "react-native";
import { Holding } from "../types";
import { monthlyDividends, totalAnnual, yen } from "../calc";
import { Theme, useTheme, spacing, radius } from "../theme";

// 月別の配当見込み。緑ヒーロー＋白カードの横棒グラフ（円換算）。
export function CalendarView({ holdings, fx }: { holdings: Holding[]; fx: number }) {
  const t = useTheme();
  const s = styles(t);
  const months = monthlyDividends(holdings, fx);
  const max = Math.max(1, ...months);
  const peak = months.indexOf(max);
  const annual = totalAnnual(holdings, fx);

  return (
    <ScrollView contentContainerStyle={s.container}>
      <View style={s.hero}>
        <Text style={s.heroLabel}>年間配当見込み · 税引前</Text>
        <Text style={s.heroValue}>{yen(annual)}</Text>
        <Text style={s.heroSub}>月平均 {yen(annual / 12)}</Text>
      </View>

      <View style={s.card}>
        {months.map((v, i) => {
          const isPeak = i === peak && v > 0;
          return (
            <View key={i} style={s.row}>
              <Text style={[s.month, isPeak && s.monthPeak]}>{i + 1}月</Text>
              <View style={s.barTrack}>
                <View
                  style={[
                    s.barFill,
                    { width: `${(v / max) * 100}%` },
                    v === 0 && s.barEmpty,
                  ]}
                />
              </View>
              <Text style={[s.amount, isPeak && s.amountPeak, v === 0 && s.amountEmpty]}>
                {v > 0 ? yen(v) : "—"}
              </Text>
            </View>
          );
        })}
      </View>

      <Text style={s.note}>※ 各銘柄の年間配当を「権利確定月」の数で等分した概算です。</Text>
    </ScrollView>
  );
}

const cardShadow = Platform.select({
  web: { boxShadow: "0 1px 4px rgba(11,36,24,0.07)" },
  default: {
    shadowColor: "#0B2418",
    shadowOpacity: 0.07,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
});

const styles = (t: Theme) =>
  StyleSheet.create({
    container: { paddingVertical: spacing.md, paddingHorizontal: spacing.md },
    hero: {
      backgroundColor: t.heroBlock,
      borderRadius: radius.lg,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.lg,
      marginBottom: spacing.md,
    },
    heroLabel: { color: t.heroSub, fontSize: 12, fontWeight: "600", letterSpacing: 0.5 },
    heroValue: {
      color: t.heroText,
      fontSize: 40,
      fontWeight: "800",
      letterSpacing: -1.2,
      marginTop: spacing.xs,
      fontVariant: ["tabular-nums"],
    },
    heroSub: {
      color: t.heroSub,
      fontSize: 13,
      fontWeight: "600",
      marginTop: spacing.sm,
      fontVariant: ["tabular-nums"],
    },
    card: {
      backgroundColor: t.card,
      borderRadius: radius.md,
      padding: spacing.lg,
      marginBottom: spacing.md,
      ...cardShadow,
    },
    row: { flexDirection: "row", alignItems: "center", paddingVertical: spacing.xs + 1 },
    month: { color: t.sub, fontSize: 13, width: 36, fontVariant: ["tabular-nums"] },
    monthPeak: { color: t.text, fontWeight: "700" },
    barTrack: {
      flex: 1,
      height: 16,
      backgroundColor: t.chipBg,
      borderRadius: radius.sm,
      marginHorizontal: spacing.sm,
      overflow: "hidden",
    },
    barFill: { height: "100%", backgroundColor: t.primary, borderRadius: radius.sm },
    barEmpty: { backgroundColor: "transparent" },
    amount: {
      color: t.text,
      fontSize: 12.5,
      fontWeight: "600",
      width: 88,
      textAlign: "right",
      fontVariant: ["tabular-nums"],
    },
    amountPeak: { color: t.primary, fontWeight: "800" },
    amountEmpty: { color: t.faint, fontWeight: "400" },
    note: { color: t.sub, fontSize: 11, marginHorizontal: spacing.xs, lineHeight: 16 },
  });
