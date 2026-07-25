import React from "react";
import { View, Text, StyleSheet, Pressable, Linking, Platform } from "react-native";
import { Holding } from "../types";
import {
  annualDividend,
  annualDividendJPY,
  currency,
  currentYield,
  yieldOnCost,
  unrealizedPL,
  plPercent,
  yen,
  pct,
  signedPct,
} from "../calc";
import { assetLabel, isUS, fmtNative } from "../assetClass";
import { cyclicalityOf, cyclicalityLabel, externalLinks } from "../sectorClassification";
import { Theme, useTheme, spacing, radius } from "../theme";

// 保有1銘柄の白カード。表面はポップ、中身は利回り/簿価/含み損益をきっちり。タップで編集。
export function HoldingCard({
  holding,
  fx,
  onEdit,
}: {
  holding: Holding;
  fx: number;
  onEdit: (h: Holding) => void;
}) {
  const t = useTheme();
  const s = styles(t);
  const cur = currency(holding);
  const yoc = yieldOnCost(holding);
  const pl = unrealizedPL(holding);
  const plp = plPercent(holding);
  const cyc = cyclicalityOf(holding.sector);
  const us = isUS(holding.assetType);
  const plColor = pl === null ? t.sub : pl >= 0 ? t.positive : t.negative;

  return (
    <Pressable
      style={({ pressed }) => [s.card, pressed && s.cardPressed]}
      onPress={() => onEdit(holding)}
    >
      <View style={s.head}>
        <View style={s.headLeft}>
          <Text style={s.name} numberOfLines={1}>
            {holding.name || "(名称未設定)"}
          </Text>
          <Text style={s.meta}>
            {holding.code} · {assetLabel(holding.assetType)} · {holding.shares}株
            {holding.account === "nisa" ? " · NISA" : ""}
          </Text>
        </View>
        <View style={s.annualBox}>
          <Text style={s.annual}>{fmtNative(annualDividend(holding), cur)}</Text>
          {us ? <Text style={s.annualSub}>≈{yen(annualDividendJPY(holding, fx))}</Text> : null}
        </View>
        <Text style={s.chevron}>›</Text>
      </View>

      <View style={s.metrics}>
        <Metric t={t} label="利回り" value={holding.price > 0 ? pct(currentYield(holding)) : "—"} />
        <Metric t={t} label="簿価" value={yoc !== null ? pct(yoc) : "—"} />
        <Metric
          t={t}
          label="含み損益"
          value={pl !== null ? fmtNative(pl, cur, true) : "—"}
          sub={plp !== null ? signedPct(plp) : undefined}
          color={plColor}
        />
      </View>

      {(holding.sector || holding.memo) && (
        <Text style={s.tagline} numberOfLines={1}>
          {holding.sector ? `${holding.sector}${cyc ? ` · ${cyclicalityLabel(cyc)}` : ""}` : ""}
          {holding.sector && holding.memo ? "　" : ""}
          {holding.memo ? holding.memo : ""}
        </Text>
      )}

      <View style={s.links}>
        {externalLinks(holding.code).map((l) => (
          <Pressable key={l.label} onPress={() => Linking.openURL(l.url)} hitSlop={6}>
            <Text style={s.link}>{l.label}</Text>
          </Pressable>
        ))}
      </View>
    </Pressable>
  );
}

function Metric({
  t,
  label,
  value,
  sub,
  color,
}: {
  t: Theme;
  label: string;
  value: string;
  sub?: string;
  color?: string;
}) {
  const s = styles(t);
  return (
    <View style={s.metric}>
      <Text style={s.metricLabel}>{label}</Text>
      <Text style={[s.metricValue, color ? { color } : null]}>{value}</Text>
      {sub ? <Text style={[s.metricSub, color ? { color } : null]}>{sub}</Text> : null}
    </View>
  );
}

const styles = (t: Theme) =>
  StyleSheet.create({
    card: {
      backgroundColor: t.card,
      borderRadius: radius.md,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      marginHorizontal: spacing.md,
      marginBottom: spacing.sm,
      ...Platform.select({
        web: { boxShadow: "0 1px 4px rgba(11,36,24,0.07)", cursor: "pointer" as const },
        default: {
          shadowColor: "#0B2418",
          shadowOpacity: 0.07,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: 1 },
          elevation: 1,
        },
      }),
    },
    cardPressed: { backgroundColor: t.chipBg, transform: [{ scale: 0.99 }] },
    head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    chevron: { color: t.faint, fontSize: 24, fontWeight: "600", marginLeft: spacing.sm, marginTop: -2 },
    headLeft: { flex: 1, paddingRight: spacing.sm },
    name: { color: t.text, fontSize: 16, fontWeight: "700" },
    meta: { color: t.sub, fontSize: 12, marginTop: 3, letterSpacing: 0.2 },
    annualBox: { alignItems: "flex-end" },
    annual: { color: t.primary, fontSize: 17, fontWeight: "800", fontVariant: ["tabular-nums"] },
    annualSub: { color: t.sub, fontSize: 11, marginTop: 2, fontVariant: ["tabular-nums"] },
    metrics: {
      flexDirection: "row",
      marginTop: spacing.md,
      backgroundColor: t.chipBg,
      borderRadius: radius.sm,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
    },
    metric: { flex: 1 },
    metricLabel: { color: t.sub, fontSize: 10.5, fontWeight: "600", letterSpacing: 0.3 },
    metricValue: {
      color: t.text,
      fontSize: 14,
      fontWeight: "700",
      marginTop: 3,
      fontVariant: ["tabular-nums"],
    },
    metricSub: { color: t.sub, fontSize: 11, marginTop: 1, fontVariant: ["tabular-nums"] },
    tagline: { color: t.sub, fontSize: 11.5, marginTop: spacing.md },
    links: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.md },
    link: {
      color: t.primary,
      fontSize: 11.5,
      fontWeight: "700",
      backgroundColor: t.chipBg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.border,
      paddingHorizontal: spacing.md,
      paddingVertical: 5,
      borderRadius: 999,
      overflow: "hidden",
      ...Platform.select({ web: { cursor: "pointer" as const }, default: {} }),
    },
  });
