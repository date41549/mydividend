import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, Platform } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { Holding } from "../types";
import { portfolioComposition, totalMarketValue, CompositionMode, CompositionSlice, yen, pct } from "../calc";
import { Theme, useTheme, spacing, radius } from "../theme";

// カテゴリカル配色（dataviz バリデータでライト/ダーク両方 全チェックPASS：順序固定・色覚安全・地色コントラストOK）。
const PALETTE = ["#00A83D", "#2563EB", "#D97706", "#8B5CF6", "#EC4899", "#0891B2"];

const MODES: { key: CompositionMode; label: string }[] = [
  { key: "assetType", label: "資産種別" },
  { key: "sector", label: "セクター" },
  { key: "holding", label: "銘柄" },
];

// スライスの色。「その他」「未分類」は中立グレー、それ以外は固定パレット順。
function sliceColor(s: CompositionSlice, i: number, neutral: string): string {
  if (s.key === "__other" || s.key === "__unknown") return neutral;
  return PALETTE[i % PALETTE.length];
}

// 保有画面の「内訳」カード。評価額での構成比をドーナツ＋凡例で。資産種別/セクター/銘柄を切替。
export function CompositionCard({ holdings, fx }: { holdings: Holding[]; fx: number }) {
  const t = useTheme();
  const s = styles(t);
  const [mode, setMode] = useState<CompositionMode>("assetType");
  const data = portfolioComposition(holdings, fx, mode);
  const total = totalMarketValue(holdings, fx);

  if (data.length === 0) return null;

  return (
    <View style={s.card}>
      <View style={s.head}>
        <Text style={s.title}>内訳</Text>
        <View style={s.toggle}>
          {MODES.map((m) => {
            const on = mode === m.key;
            return (
              <Pressable key={m.key} onPress={() => setMode(m.key)} style={[s.chip, on && s.chipOn]}>
                <Text style={[s.chipText, on && s.chipTextOn]}>{m.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={s.body}>
        <Donut data={data} total={total} t={t} />
        <View style={s.legend}>
          {data.map((slice, i) => (
            <View key={slice.key} style={s.legendRow}>
              <View style={[s.dot, { backgroundColor: sliceColor(slice, i, t.faint) }]} />
              <Text style={s.legendLabel} numberOfLines={1}>
                {slice.label}
              </Text>
              <Text style={s.legendPct}>{pct(slice.pct, 1)}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

function Donut({ data, total, t }: { data: CompositionSlice[]; total: number; t: Theme }) {
  const s = styles(t);
  const size = 132;
  const thickness = 20;
  const r = (size - thickness) / 2;
  const c = size / 2;
  const C = 2 * Math.PI * r;
  const gap = data.length > 1 ? 3 : 0;

  return (
    <View style={{ width: size, height: size }}>
      {/* 12時開始にするため Svg を包む View ごと -90°回す（web でも安全）。中央テキストは回さない */}
      <View style={{ transform: [{ rotate: "-90deg" }] }}>
        <Svg width={size} height={size}>
          <Circle cx={c} cy={c} r={r} stroke={t.chipBg} strokeWidth={thickness} fill="none" />
          {data.map((slice, i) => {
            // 開始位置＝手前スライスの累積（純粋計算・n≤7なので前方合計でOK）
            const startPct = data.slice(0, i).reduce((sum, x) => sum + x.pct, 0);
            const offset = (C * startPct) / 100;
            const arc = (C * slice.pct) / 100;
            const dash = Math.max(arc - gap, 0.6);
            return (
              <Circle
                key={slice.key}
                cx={c}
                cy={c}
                r={r}
                stroke={sliceColor(slice, i, t.faint)}
                strokeWidth={thickness}
                fill="none"
                strokeDasharray={`${dash} ${C - dash}`}
                strokeDashoffset={-offset}
              />
            );
          })}
        </Svg>
      </View>
      <View style={s.center} pointerEvents="none">
        <Text style={s.centerLabel}>評価額</Text>
        <Text style={s.centerValue} numberOfLines={1}>
          {yen(total)}
        </Text>
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
    head: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: spacing.sm,
    },
    title: { color: t.text, fontSize: 15, fontWeight: "800" },
    toggle: { flexDirection: "row", gap: spacing.xs },
    chip: {
      paddingHorizontal: spacing.md,
      paddingVertical: 5,
      borderRadius: 999,
      backgroundColor: t.chipBg,
      ...Platform.select({ web: { cursor: "pointer" as const }, default: {} }),
    },
    chipOn: { backgroundColor: t.primary },
    chipText: { color: t.sub, fontSize: 12, fontWeight: "700" },
    chipTextOn: { color: t.primaryText },
    body: { flexDirection: "row", alignItems: "center", marginTop: spacing.md, gap: spacing.lg },
    center: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      alignItems: "center",
      justifyContent: "center",
    },
    centerLabel: { color: t.sub, fontSize: 10, fontWeight: "600", letterSpacing: 0.5 },
    centerValue: { color: t.text, fontSize: 14, fontWeight: "800", fontVariant: ["tabular-nums"] },
    legend: { flex: 1, gap: spacing.xs },
    legendRow: { flexDirection: "row", alignItems: "center" },
    dot: { width: 11, height: 11, borderRadius: 3, marginRight: spacing.sm },
    legendLabel: { color: t.text, fontSize: 12.5, flex: 1 },
    legendPct: { color: t.sub, fontSize: 12.5, fontWeight: "700", fontVariant: ["tabular-nums"] },
  });
