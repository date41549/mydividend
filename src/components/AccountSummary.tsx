import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Holding } from "../types";
import { accountSummary, accountLabel, yen, currency } from "../calc";
import { Theme, useTheme, spacing, radius } from "../theme";

// 口座別（NISA/特定/一般）のサマリー。白カードに、保有がある口座だけ表示。
export function AccountSummary({ holdings, fx }: { holdings: Holding[]; fx: number }) {
  const t = useTheme();
  const s = styles(t);
  const rows = accountSummary(holdings, fx);
  if (rows.length === 0) return null;
  const hasUS = holdings.some((h) => currency(h) === "USD");

  return (
    <View style={s.card}>
      <Text style={s.section}>口座別 · 年間配当（税引後）</Text>
      {rows.map((r, i) => (
        <View key={r.account} style={[s.row, i === rows.length - 1 && s.rowLast]}>
          <Text style={s.acc}>{accountLabel(r.account)}</Text>
          <View style={s.right}>
            <Text style={s.amount}>{yen(r.afterTax)}</Text>
            <Text style={s.sub}>
              {r.count}銘柄 · 税引前 {yen(r.annual)}
            </Text>
          </View>
        </View>
      ))}
      {hasUS && (
        <Text style={s.note}>
          ※税引後は米国株・ETFの米国源泉税10%を控除した概算です。特定口座の外国税額控除（確定申告で一部還付）は未反映。
        </Text>
      )}
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
      paddingTop: spacing.md,
      paddingBottom: spacing.xs,
    },
    section: {
      color: t.faint,
      fontSize: 10.5,
      fontWeight: "600",
      letterSpacing: 0.8,
      textTransform: "uppercase",
      marginBottom: spacing.xs,
    },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: t.border,
    },
    rowLast: { borderBottomWidth: 0 },
    acc: { color: t.text, fontSize: 14, fontWeight: "600" },
    right: { alignItems: "flex-end" },
    amount: { color: t.text, fontSize: 15, fontWeight: "700", fontVariant: ["tabular-nums"] },
    sub: { color: t.sub, fontSize: 11.5, marginTop: 2, fontVariant: ["tabular-nums"] },
    note: {
      color: t.faint,
      fontSize: 10.5,
      lineHeight: 15,
      paddingTop: spacing.sm,
      paddingBottom: spacing.xs,
    },
  });
