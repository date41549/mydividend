import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Holding } from "../types";
import {
  totalAnnual,
  totalAnnualAfterTax,
  totalMarketValue,
  totalUnrealizedPL,
  portfolioYield,
  yen,
  signedYen,
  pct,
} from "../calc";
import { Theme, useTheme, spacing, radius } from "../theme";

// ポート全体のサマリー。鮮やかな緑ブロックに年間配当、その下に白チップで詳細。
export function SummaryHeader({ holdings, fx }: { holdings: Holding[]; fx: number }) {
  const t = useTheme();
  const s = styles(t);
  const annual = totalAnnual(holdings, fx);
  const afterTax = totalAnnualAfterTax(holdings, fx);
  const mv = totalMarketValue(holdings, fx);
  const pl = totalUnrealizedPL(holdings, fx);
  const y = portfolioYield(holdings, fx);

  return (
    <View style={s.wrap}>
      <View style={s.hero}>
        <Text style={s.heroLabel}>年間配当 · 税引前</Text>
        <Text style={s.heroValue}>{yen(annual)}</Text>
        <Text style={s.heroSub}>
          月 {yen(annual / 12)} · 利回り {pct(y)}
        </Text>
      </View>
      <View style={s.chips}>
        <Chip t={t} label="税引後" value={yen(afterTax)} />
        <Chip t={t} label="評価額" value={yen(mv)} />
        <Chip
          t={t}
          label="含み損益"
          value={signedYen(pl)}
          color={pl >= 0 ? t.positive : t.negative}
        />
      </View>
    </View>
  );
}

function Chip({
  t,
  label,
  value,
  color,
}: {
  t: Theme;
  label: string;
  value: string;
  color?: string;
}) {
  const s = styles(t);
  return (
    <View style={s.chip}>
      <Text style={s.chipLabel}>{label}</Text>
      <Text style={[s.chipValue, color ? { color } : null]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = (t: Theme) =>
  StyleSheet.create({
    wrap: { paddingHorizontal: spacing.md, paddingTop: spacing.sm },
    hero: {
      backgroundColor: t.heroBlock,
      borderRadius: radius.lg,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.lg,
    },
    heroLabel: {
      color: t.heroSub,
      fontSize: 12,
      fontWeight: "600",
      letterSpacing: 0.5,
    },
    heroValue: {
      color: t.heroText,
      fontSize: 42,
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
    chips: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
    chip: {
      flex: 1,
      backgroundColor: t.card,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
    },
    chipLabel: { color: t.sub, fontSize: 11, fontWeight: "600" },
    chipValue: {
      color: t.text,
      fontSize: 15,
      fontWeight: "700",
      marginTop: 3,
      fontVariant: ["tabular-nums"],
    },
  });
