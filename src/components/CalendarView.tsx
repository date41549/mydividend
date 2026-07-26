import React from "react";
import { View, Text, StyleSheet, ScrollView, Platform } from "react-native";
import { Holding } from "../types";
import { monthlyDividends, totalAnnual, yen } from "../calc";
import { Theme, useTheme, spacing, radius } from "../theme";

// 月別の配当見込み。年間合計は保有画面のヒーローと重複するので、ここでは控えめな参照に留め、
// この画面の主役＝月別の分布（棒グラフ）に集中する。質感は「内訳」カードに揃える。
export function CalendarView({ holdings, fx }: { holdings: Holding[]; fx: number }) {
  const t = useTheme();
  const s = styles(t);

  if (holdings.length === 0) {
    return (
      <ScrollView contentContainerStyle={s.container}>
        <View style={[s.card, s.emptyCard]}>
          <Text style={s.emptyTitle}>まだデータがありません</Text>
          <Text style={s.emptySub}>保有を追加すると、配当が何月にいくら入るかが見えます。</Text>
        </View>
      </ScrollView>
    );
  }

  const months = monthlyDividends(holdings, fx);
  const max = Math.max(1, ...months);
  const peak = months.indexOf(max);
  const annual = totalAnnual(holdings, fx);

  return (
    <ScrollView contentContainerStyle={s.container}>
      <View style={s.card}>
        <View style={s.head}>
          <View style={s.headLeft}>
            <Text style={s.title}>月別の配当見込み</Text>
            <Text style={s.caption}>月平均 {yen(annual / 12)}</Text>
          </View>
          <View style={s.headRight}>
            <Text style={s.annual}>{yen(annual)}</Text>
            <Text style={s.annualSub}>年間 · 税引前</Text>
          </View>
        </View>

        <View style={s.divider} />

        <View style={s.bars}>
          {months.map((v, i) => {
            const isPeak = i === peak && v > 0;
            return (
              <View key={i} style={s.row}>
                <Text style={[s.month, isPeak && s.monthPeak]}>{i + 1}月</Text>
                <View style={s.barTrack}>
                  <View
                    style={[s.barFill, { width: `${(v / max) * 100}%` }, v === 0 && s.barEmpty]}
                  />
                </View>
                <Text style={[s.amount, isPeak && s.amountPeak, v === 0 && s.amountEmpty]}>
                  {v > 0 ? yen(v) : "—"}
                </Text>
              </View>
            );
          })}
        </View>
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
    card: {
      backgroundColor: t.card,
      borderRadius: radius.md,
      padding: spacing.lg,
      marginBottom: spacing.md,
      ...cardShadow,
    },
    head: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
    headLeft: { flex: 1, paddingRight: spacing.sm },
    title: { color: t.text, fontSize: 15, fontWeight: "800" },
    caption: { color: t.sub, fontSize: 12, marginTop: 3, fontVariant: ["tabular-nums"] },
    headRight: { alignItems: "flex-end" },
    annual: { color: t.text, fontSize: 20, fontWeight: "800", fontVariant: ["tabular-nums"] },
    annualSub: { color: t.faint, fontSize: 10.5, fontWeight: "600", marginTop: 1 },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: t.border,
      marginVertical: spacing.md,
    },
    bars: {},
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
    emptyCard: { alignItems: "center", paddingVertical: spacing.xxl },
    emptyTitle: { color: t.text, fontSize: 16, fontWeight: "700" },
    emptySub: {
      color: t.sub,
      fontSize: 13,
      marginTop: spacing.sm,
      textAlign: "center",
      lineHeight: 19,
    },
  });
