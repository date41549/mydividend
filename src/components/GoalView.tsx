import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Keyboard,
  Platform,
} from "react-native";
import { Holding, Goal } from "../types";
import { goalProgress, GoalRow, yen, pct } from "../calc";
import { Theme, useTheme, spacing, radius } from "../theme";

// 目標 vs 実績。目標値を編集して保存できる。
export function GoalView({
  holdings,
  goal,
  fx,
  onSave,
}: {
  holdings: Holding[];
  goal: Goal;
  fx: number;
  onSave: (g: Goal) => void;
}) {
  const t = useTheme();
  const s = styles(t);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Goal>(goal);

  const rows = goalProgress(holdings, goal, fx);

  function formatActual(r: GoalRow): string {
    if (r.unit === "yen") return yen(r.actual);
    if (r.unit === "percent") return pct(r.actual);
    return `${Math.round(r.actual)}`;
  }
  function formatGoal(r: GoalRow): string {
    if (r.unit === "yen") return yen(r.goal);
    if (r.unit === "percent") return pct(r.goal);
    return `${Math.round(r.goal)}`;
  }

  if (editing) {
    return (
      <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
        <View style={s.card}>
          <Text style={s.title}>目標を編集</Text>
          <NumField t={t} label="月間配当金（円）" value={draft.monthlyDividend} onChange={(n) => setDraft({ ...draft, monthlyDividend: n })} />
          <NumField t={t} label="年間配当金（円）" value={draft.annualDividend} onChange={(n) => setDraft({ ...draft, annualDividend: n })} />
          <NumField t={t} label="利回り（%）" value={draft.yieldPercent} onChange={(n) => setDraft({ ...draft, yieldPercent: n })} />
          <NumField t={t} label="銘柄数" value={draft.holdingsCount} onChange={(n) => setDraft({ ...draft, holdingsCount: n })} />
          <NumField t={t} label="取得額（円）" value={draft.acquisitionTotal} onChange={(n) => setDraft({ ...draft, acquisitionTotal: n })} />
          <View style={s.actions}>
            <Pressable style={s.btnGhost} onPress={() => { setDraft(goal); setEditing(false); }}>
              <Text style={s.btnGhostText}>キャンセル</Text>
            </Pressable>
            <Pressable
              style={s.btn}
              onPress={() => { Keyboard.dismiss(); onSave(draft); setEditing(false); }}
            >
              <Text style={s.btnText}>保存</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={s.container}>
      {rows.map((r) => {
        const ratio = Math.max(0, Math.min(1, r.ratio));
        const reached = r.ratio >= 1;
        return (
          <View key={r.key} style={s.card}>
            <View style={s.rowHead}>
              <Text style={s.label}>{r.label}</Text>
              <Text style={[s.ratio, reached ? { color: t.positive } : null]}>
                {Math.round(r.ratio * 100)}%
              </Text>
            </View>
            <View style={s.barTrack}>
              <View style={[s.barFill, { width: `${ratio * 100}%`, backgroundColor: reached ? t.positive : t.primary }]} />
            </View>
            <Text style={s.detail}>
              {formatActual(r)} / {formatGoal(r)}
            </Text>
          </View>
        );
      })}
      <Pressable style={s.editBtn} onPress={() => { setDraft(goal); setEditing(true); }}>
        <Text style={s.editBtnText}>目標を編集</Text>
      </Pressable>
    </ScrollView>
  );
}

function NumField({
  t,
  label,
  value,
  onChange,
}: {
  t: Theme;
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  const s = styles(t);
  const [text, setText] = useState(String(value));
  return (
    <View style={s.field}>
      <Text style={s.fieldLabel}>{label}</Text>
      <TextInput
        style={s.input}
        value={text}
        onChangeText={(v) => {
          setText(v);
          const n = parseFloat(v.replace(/,/g, ""));
          onChange(isNaN(n) ? 0 : n);
        }}
        keyboardType="numeric"
        placeholderTextColor={t.sub}
      />
    </View>
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
const pointer = Platform.select({ web: { cursor: "pointer" as const }, default: {} });

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
    title: { color: t.text, fontSize: 16, fontWeight: "700", marginBottom: spacing.sm },
    rowHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    label: { color: t.text, fontSize: 15, fontWeight: "700" },
    ratio: { color: t.text, fontSize: 16, fontWeight: "800", fontVariant: ["tabular-nums"] },
    barTrack: {
      height: 14,
      backgroundColor: t.chipBg,
      borderRadius: radius.sm,
      marginTop: spacing.md,
      overflow: "hidden",
    },
    barFill: { height: "100%", borderRadius: radius.sm },
    detail: { color: t.sub, fontSize: 12.5, marginTop: spacing.sm, fontVariant: ["tabular-nums"] },
    field: { marginTop: spacing.md },
    fieldLabel: { color: t.sub, fontSize: 12, fontWeight: "600", marginBottom: spacing.xs },
    input: {
      borderWidth: 1.5,
      borderColor: t.border,
      borderRadius: radius.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 1,
      color: t.text,
      fontSize: 16,
      fontWeight: "600",
      backgroundColor: t.chipBg,
    },
    actions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.lg },
    btn: {
      flex: 1,
      backgroundColor: t.primary,
      borderRadius: radius.md,
      paddingVertical: spacing.md,
      alignItems: "center",
      ...pointer,
    },
    btnText: { color: t.primaryText, fontWeight: "800", fontSize: 15 },
    btnGhost: {
      flex: 1,
      borderRadius: radius.md,
      paddingVertical: spacing.md,
      alignItems: "center",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.border,
      ...pointer,
    },
    btnGhostText: { color: t.sub, fontWeight: "700", fontSize: 15 },
    editBtn: {
      borderRadius: radius.md,
      paddingVertical: spacing.md,
      alignItems: "center",
      backgroundColor: t.chipBg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.border,
      ...cardShadow,
      ...pointer,
    },
    editBtnText: { color: t.primary, fontWeight: "800", fontSize: 15 },
  });
