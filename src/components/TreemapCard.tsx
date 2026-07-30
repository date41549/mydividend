import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, Platform } from "react-native";
import Svg, { Rect, Text as SvgText, G } from "react-native-svg";
import { Holding } from "../types";
import {
  portfolioComposition,
  squarifiedTreemap,
  CompositionMode,
  CompositionMetric,
  CompositionSlice,
  pct,
} from "../calc";
import { Theme, useTheme, spacing, radius } from "../theme";

// CompositionCard と同じカテゴリカル配色（ライト/ダーク両対応・色覚安全）。
const PALETTE = ["#00A83D", "#2563EB", "#D97706", "#8B5CF6", "#EC4899", "#0891B2"];

const MODES: { key: CompositionMode; label: string }[] = [
  { key: "sector", label: "セクター" },
  { key: "assetType", label: "資産種別" },
  { key: "cyclicality", label: "感応度" },
  { key: "holding", label: "銘柄" },
];

const METRICS: { key: CompositionMetric; label: string }[] = [
  { key: "value", label: "評価額" },
  { key: "dividend", label: "配当" },
];

function sliceColor(s: CompositionSlice, i: number, neutral: string): string {
  if (s.key === "__other" || s.key === "__unknown") return neutral;
  return PALETTE[i % PALETTE.length];
}

// 深掘り分析（FR-13）：構成比を面積で見せるツリーマップ。ドーナツより「大小の差」が直感的。
// 業種別を主眼に、資産種別/感応度/銘柄、評価額/配当で切替。
export function TreemapCard({ holdings, fx }: { holdings: Holding[]; fx: number }) {
  const t = useTheme();
  const s = styles(t);
  const [mode, setMode] = useState<CompositionMode>("sector");
  const [metric, setMetric] = useState<CompositionMetric>("value");
  const [width, setWidth] = useState(0);

  const data = portfolioComposition(holdings, fx, mode, metric);
  if (data.length === 0) return null;

  const height = Math.round(Math.max(160, width * 0.6));
  const rects = width > 0 ? squarifiedTreemap(data, width, height) : [];
  const colorByKey = new Map(data.map((sl, i) => [sl.key, sliceColor(sl, i, t.faint)]));

  return (
    <View style={s.card}>
      <View style={s.head}>
        <Text style={s.title}>構成ツリーマップ</Text>
        <View style={s.segmented}>
          {METRICS.map((m) => {
            const on = metric === m.key;
            return (
              <Pressable key={m.key} onPress={() => setMetric(m.key)} style={[s.segItem, on && s.segItemOn]}>
                <Text style={[s.segText, on && s.segTextOn]}>{m.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={s.modeRow}>
        <Text style={s.modeLabel}>分け方</Text>
        {MODES.map((m) => {
          const on = mode === m.key;
          return (
            <Pressable key={m.key} onPress={() => setMode(m.key)} style={[s.chip, on && s.chipOn]}>
              <Text style={[s.chipText, on && s.chipTextOn]}>{m.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={s.canvas} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        {width > 0 && (
          <Svg width={width} height={height}>
            {rects.map((r) => {
              const fill = colorByKey.get(r.key) ?? t.faint;
              const showLabel = r.w > 54 && r.h > 30;
              const showPct = r.w > 54 && r.h > 48;
              return (
                <G key={r.key}>
                  <Rect x={r.x} y={r.y} width={r.w} height={r.h} fill={fill} rx={4} stroke={t.card} strokeWidth={2} />
                  {showLabel && (
                    <SvgText x={r.x + 8} y={r.y + 20} fontSize={12} fontWeight="700" fill="#ffffff">
                      {r.label}
                    </SvgText>
                  )}
                  {showPct && (
                    <SvgText x={r.x + 8} y={r.y + 37} fontSize={11} fontWeight="600" fill="rgba(255,255,255,0.9)">
                      {pct(r.pct, 1)}
                    </SvgText>
                  )}
                </G>
              );
            })}
          </Svg>
        )}
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
    modeRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
      gap: spacing.xs,
      marginTop: spacing.md,
    },
    modeLabel: { color: t.faint, fontSize: 11, fontWeight: "700", marginRight: spacing.xs },
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
    segmented: { flexDirection: "row", backgroundColor: t.chipBg, borderRadius: 999, padding: 2 },
    segItem: {
      paddingHorizontal: spacing.md,
      paddingVertical: 4,
      borderRadius: 999,
      ...Platform.select({ web: { cursor: "pointer" as const }, default: {} }),
    },
    segItemOn: {
      backgroundColor: t.card,
      ...Platform.select({
        web: { boxShadow: "0 1px 2px rgba(11,36,24,0.12)" },
        default: {
          shadowColor: "#0B2418",
          shadowOpacity: 0.12,
          shadowRadius: 2,
          shadowOffset: { width: 0, height: 1 },
          elevation: 1,
        },
      }),
    },
    segText: { color: t.sub, fontSize: 12, fontWeight: "700" },
    segTextOn: { color: t.primary },
    canvas: { width: "100%", marginTop: spacing.md, borderRadius: radius.sm, overflow: "hidden" },
  });
