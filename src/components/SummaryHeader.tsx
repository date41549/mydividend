import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, Platform } from "react-native";
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
  const [net, setNet] = useState(false); // false=額面(税引前) / true=手取り(税引後)
  const annual = totalAnnual(holdings, fx);
  const afterTax = totalAnnualAfterTax(holdings, fx);
  const mv = totalMarketValue(holdings, fx);
  const pl = totalUnrealizedPL(holdings, fx);
  const y = portfolioYield(holdings, fx);
  const shown = net ? afterTax : annual;

  return (
    <View style={s.wrap}>
      <View style={s.hero}>
        <View style={s.heroTop}>
          <Text style={s.heroLabel}>{net ? "年間配当 · 税引後（手取り）" : "年間配当 · 税引前"}</Text>
          <View style={s.toggle}>
            <Pressable onPress={() => setNet(false)} style={[s.seg, !net && s.segOn]}>
              <Text style={[s.segText, !net && s.segTextOn]}>額面</Text>
            </Pressable>
            <Pressable onPress={() => setNet(true)} style={[s.seg, net && s.segOn]}>
              <Text style={[s.segText, net && s.segTextOn]}>手取り</Text>
            </Pressable>
          </View>
        </View>
        <Text style={s.heroValue}>{yen(shown)}</Text>
        <Text style={s.heroSub}>
          月 {yen(shown / 12)} · 利回り {pct(y)}
        </Text>
      </View>
      <View style={s.chips}>
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
    heroTop: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm,
    },
    heroLabel: {
      color: t.heroSub,
      fontSize: 12,
      fontWeight: "600",
      letterSpacing: 0.5,
      flexShrink: 1,
    },
    toggle: {
      flexDirection: "row",
      backgroundColor: "rgba(255,255,255,0.22)",
      borderRadius: 999,
      padding: 2,
    },
    seg: {
      paddingHorizontal: spacing.md,
      paddingVertical: 4,
      borderRadius: 999,
      ...Platform.select({ web: { cursor: "pointer" as const }, default: {} }),
    },
    segOn: { backgroundColor: "#ffffff" },
    segText: { color: "rgba(255,255,255,0.95)", fontSize: 11.5, fontWeight: "700" },
    // 白セグメント上の文字。ヒーローは常に緑背景なので濃緑固定で可読性を担保。
    segTextOn: { color: "#00A83D", fontSize: 11.5, fontWeight: "800" },
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
