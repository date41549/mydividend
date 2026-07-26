import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { Holding } from "../types";
import { yocHistogram } from "../calc";
import { Theme, useTheme, spacing, radius } from "../theme";

// 簿価利回り(YOC)の分布ヒストグラム（FR-14）。取得単価のある銘柄が無ければ非表示。
export function YocHistogramCard({ holdings }: { holdings: Holding[] }) {
  const t = useTheme();
  const s = styles(t);
  const hist = yocHistogram(holdings);
  const total = hist.reduce((sum, b) => sum + b.count, 0);
  if (total === 0) return null;

  const max = Math.max(1, ...hist.map((b) => b.count));
  const peak = hist.reduce((mi, b, i, arr) => (b.count > arr[mi].count ? i : mi), 0);

  return (
    <View style={s.card}>
      <View style={s.head}>
        <Text style={s.title}>簿価利回りの分布</Text>
        <Text style={s.sub}>{total}銘柄</Text>
      </View>
      <Text style={s.caption}>取得時の利回り(YOC)がどの帯に多いか</Text>

      <View style={s.bars}>
        {hist.map((b, i) => {
          const isPeak = i === peak && b.count > 0;
          return (
            <View key={b.label} style={s.row}>
              <Text style={[s.label, isPeak && s.labelPeak]}>{b.label}</Text>
              <View style={s.track}>
                <View
                  style={[
                    s.fill,
                    { width: `${(b.count / max) * 100}%` },
                    b.count === 0 && s.empty,
                    isPeak && s.fillPeak,
                  ]}
                />
              </View>
              <Text style={[s.count, b.count === 0 && s.countEmpty]}>{b.count}</Text>
            </View>
          );
        })}
      </View>
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
    sub: { color: t.sub, fontSize: 12, fontWeight: "700", fontVariant: ["tabular-nums"] },
    caption: { color: t.faint, fontSize: 11.5, marginTop: 2 },
    bars: { marginTop: spacing.md },
    row: { flexDirection: "row", alignItems: "center", paddingVertical: spacing.xs },
    label: { color: t.sub, fontSize: 12, width: 44, fontVariant: ["tabular-nums"] },
    labelPeak: { color: t.text, fontWeight: "700" },
    track: {
      flex: 1,
      height: 14,
      backgroundColor: t.chipBg,
      borderRadius: radius.sm,
      marginHorizontal: spacing.sm,
      overflow: "hidden",
    },
    fill: { height: "100%", backgroundColor: t.primary, borderRadius: radius.sm, opacity: 0.55 },
    fillPeak: { opacity: 1 },
    empty: { backgroundColor: "transparent" },
    count: {
      color: t.text,
      fontSize: 12.5,
      fontWeight: "700",
      width: 24,
      textAlign: "right",
      fontVariant: ["tabular-nums"],
    },
    countEmpty: { color: t.faint, fontWeight: "400" },
  });
