import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  SafeAreaView,
  TextInput,
  Platform,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Holding, HoldingInput, Goal, DEFAULT_GOAL, Settings, DEFAULT_SETTINGS } from "./src/types";
import {
  loadHoldings,
  saveHoldings,
  loadGoal,
  saveGoal,
  loadSettings,
  saveSettings,
  newId,
} from "./src/storage";
import { isUS } from "./src/assetClass";
import {
  annualDividendJPY,
  currentYield,
  marketValueJPY,
  unrealizedPLJPY,
} from "./src/calc";
import { useTheme, Theme, spacing, radius } from "./src/theme";
import { SummaryHeader } from "./src/components/SummaryHeader";
import { AccountSummary } from "./src/components/AccountSummary";
import { HoldingCard } from "./src/components/HoldingCard";
import { HoldingForm } from "./src/components/HoldingForm";
import { CalendarView } from "./src/components/CalendarView";
import { GoalView } from "./src/components/GoalView";

type Tab = "holdings" | "calendar" | "goal";

const TABS: { key: Tab; label: string }[] = [
  { key: "holdings", label: "保有" },
  { key: "calendar", label: "カレンダー" },
  { key: "goal", label: "目標" },
];

type SortKey = "dividend" | "yield" | "value" | "pl" | "name";

const SORT_OPTS: { key: SortKey; label: string }[] = [
  { key: "dividend", label: "配当" },
  { key: "yield", label: "利回り" },
  { key: "value", label: "評価額" },
  { key: "pl", label: "損益" },
  { key: "name", label: "名前" },
];

// 保有一覧をソート（金額系は円換算で横断比較）。名前以外は降順。
function sortHoldings(hs: Holding[], key: SortKey, fx: number): Holding[] {
  const arr = [...hs];
  switch (key) {
    case "dividend":
      return arr.sort((a, b) => annualDividendJPY(b, fx) - annualDividendJPY(a, fx));
    case "yield":
      return arr.sort((a, b) => currentYield(b) - currentYield(a));
    case "value":
      return arr.sort((a, b) => marketValueJPY(b, fx) - marketValueJPY(a, fx));
    case "pl":
      return arr.sort((a, b) => unrealizedPLJPY(b, fx) - unrealizedPLJPY(a, fx));
    case "name":
      return arr.sort((a, b) => (a.name || "").localeCompare(b.name || "", "ja"));
  }
}

export default function App() {
  const t = useTheme();
  const s = styles(t);

  const [loading, setLoading] = useState(true);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [goal, setGoal] = useState<Goal>(DEFAULT_GOAL);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [tab, setTab] = useState<Tab>("holdings");
  const [sortKey, setSortKey] = useState<SortKey>("dividend");
  const [formVisible, setFormVisible] = useState(false);
  const [editing, setEditing] = useState<Holding | null>(null);

  const fx = settings.fxUsdJpy;
  const hasUS = holdings.some((h) => isUS(h.assetType));
  const sortedHoldings = useMemo(() => sortHoldings(holdings, sortKey, fx), [holdings, sortKey, fx]);

  // 起動時に端末内データを読み込む。
  useEffect(() => {
    (async () => {
      const [h, g, st] = await Promise.all([loadHoldings(), loadGoal(), loadSettings()]);
      setHoldings(h);
      if (g) setGoal(g);
      setSettings(st);
      setLoading(false);
    })();
  }, []);

  function handleSaveFx(rate: number) {
    const next = { ...settings, fxUsdJpy: rate };
    setSettings(next);
    saveSettings(next);
  }

  // 保有を更新して保存する共通処理。
  function persist(next: Holding[]) {
    setHoldings(next);
    saveHoldings(next);
  }

  function openAdd() {
    setEditing(null);
    setFormVisible(true);
  }
  function openEdit(h: Holding) {
    setEditing(h);
    setFormVisible(true);
  }

  function handleSubmit(input: HoldingInput) {
    if (editing) {
      persist(holdings.map((h) => (h.id === editing.id ? { ...input, id: editing.id } : h)));
    } else {
      persist([...holdings, { ...input, id: newId() }]);
    }
    setFormVisible(false);
    setEditing(null);
  }

  function handleDelete(id: string) {
    persist(holdings.filter((h) => h.id !== id));
    setFormVisible(false);
    setEditing(null);
  }

  function handleSaveGoal(g: Goal) {
    setGoal(g);
    saveGoal(g);
  }

  if (loading) {
    return (
      <View style={[s.screen, s.center]}>
        <ActivityIndicator color={t.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={s.screen}>
      <StatusBar style="auto" />

      <View style={s.titleBar}>
        <Text style={s.brand}>DIVIDEND</Text>
        <Text style={s.title}>配当トラッカー</Text>
      </View>

      <View style={s.content}>
        {tab === "holdings" && (
          <FlatList
            data={sortedHoldings}
            keyExtractor={(h) => h.id}
            ListHeaderComponent={
              holdings.length > 0 ? (
                <>
                  <SummaryHeader holdings={holdings} fx={fx} />
                  {hasUS ? <FxRateBar t={t} fx={fx} onSave={handleSaveFx} /> : null}
                  <AccountSummary holdings={holdings} fx={fx} />
                  <SortBar t={t} value={sortKey} onChange={setSortKey} />
                </>
              ) : null
            }
            renderItem={({ item }) => <HoldingCard holding={item} fx={fx} onEdit={openEdit} />}
            ListEmptyComponent={<EmptyState t={t} onAdd={openAdd} />}
            ListFooterComponent={<Disclaimer t={t} hasUS={hasUS} />}
            contentContainerStyle={{ paddingBottom: 96 }}
          />
        )}
        {tab === "calendar" && <CalendarView holdings={holdings} fx={fx} />}
        {tab === "goal" && (
          <GoalView holdings={holdings} goal={goal} fx={fx} onSave={handleSaveGoal} />
        )}
      </View>

      {tab === "holdings" && (
        <Pressable style={s.fab} onPress={openAdd}>
          <Text style={s.fabText}>＋</Text>
        </Pressable>
      )}

      <View style={s.tabBar}>
        {TABS.map((x) => (
          <Pressable key={x.key} style={s.tabItem} onPress={() => setTab(x.key)}>
            <View style={[s.tabPill, tab === x.key && s.tabPillOn]}>
              <Text style={[s.tabText, tab === x.key && s.tabTextOn]}>{x.label}</Text>
            </View>
          </Pressable>
        ))}
      </View>

      <HoldingForm
        visible={formVisible}
        initial={editing}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
        onClose={() => {
          setFormVisible(false);
          setEditing(null);
        }}
      />
    </SafeAreaView>
  );
}

function EmptyState({ t, onAdd }: { t: Theme; onAdd: () => void }) {
  const s = styles(t);
  return (
    <View style={s.empty}>
      <Text style={s.emptyTitle}>まだ銘柄がありません</Text>
      <Text style={s.emptySub}>最初の高配当株を追加しよう</Text>
      <Pressable style={s.emptyBtn} onPress={onAdd}>
        <Text style={s.emptyBtnText}>＋ 銘柄を追加</Text>
      </Pressable>
    </View>
  );
}

// 為替レート編集バー。米国資産を保有しているときだけ表示する。
function FxRateBar({ t, fx, onSave }: { t: Theme; fx: number; onSave: (n: number) => void }) {
  const s = styles(t);
  const [text, setText] = useState(String(fx));

  // 外部（別端末の復元など）で fx が変わったら追従する。
  useEffect(() => {
    setText(String(fx));
  }, [fx]);

  function commit() {
    const n = parseFloat(text.replace(/,/g, ""));
    if (!isNaN(n) && n > 0) onSave(n);
    else setText(String(fx));
  }

  return (
    <View style={s.fxBar}>
      <Text style={s.fxLabel}>為替　1 USD =</Text>
      <TextInput
        style={s.fxInput}
        value={text}
        onChangeText={setText}
        onBlur={commit}
        onSubmitEditing={commit}
        keyboardType="numeric"
        returnKeyType="done"
      />
      <Text style={s.fxLabel}>円</Text>
      <Text style={s.fxNote}>（米国資産の円換算に使用・手入力）</Text>
    </View>
  );
}

// 保有一覧の並び替えチップ。
function SortBar({
  t,
  value,
  onChange,
}: {
  t: Theme;
  value: SortKey;
  onChange: (k: SortKey) => void;
}) {
  const s = styles(t);
  return (
    <View style={s.sortBar}>
      <Text style={s.sortLabel}>並び替え</Text>
      <View style={s.sortChips}>
        {SORT_OPTS.map((o) => {
          const on = value === o.key;
          return (
            <Pressable
              key={o.key}
              onPress={() => onChange(o.key)}
              style={[s.sortChip, on && s.sortChipOn]}
            >
              <Text style={[s.sortChipText, on && s.sortChipTextOn]}>{o.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function Disclaimer({ t, hasUS }: { t: Theme; hasUS: boolean }) {
  const s = styles(t);
  return (
    <Text style={s.disclaimer}>
      本アプリは保有配当の記録・可視化を目的としたツールであり、投資の勧誘・助言を行うものではありません。データは手入力に基づく概算です。
      {hasUS
        ? "\n※米国資産の税引後は国内20.315%のみの概算で、米国源泉10%（二重課税）やJ-REIT特有の扱いは未反映です。"
        : ""}
    </Text>
  );
}

const styles = (t: Theme) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: t.bg },
    center: { alignItems: "center", justifyContent: "center" },
    titleBar: {
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.xl + spacing.md,
      paddingBottom: spacing.md,
      backgroundColor: t.bg,
    },
    brand: { color: t.primary, fontSize: 10, fontWeight: "800", letterSpacing: 3 },
    title: { color: t.text, fontSize: 24, fontWeight: "800", letterSpacing: -0.3, marginTop: 2 },
    content: { flex: 1 },
    fab: {
      position: "absolute",
      right: spacing.lg,
      bottom: 72,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: t.primary,
      alignItems: "center",
      justifyContent: "center",
      elevation: 4,
      shadowColor: "#000",
      shadowOpacity: 0.2,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
    },
    fabText: { color: t.primaryText, fontSize: 28, fontWeight: "700", lineHeight: 30 },
    tabBar: {
      flexDirection: "row",
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: t.border,
      backgroundColor: t.card,
      paddingBottom: spacing.md,
    },
    sortBar: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
      paddingBottom: spacing.xs,
    },
    sortLabel: {
      color: t.faint,
      fontSize: 10.5,
      fontWeight: "600",
      letterSpacing: 0.8,
      textTransform: "uppercase",
      marginBottom: spacing.xs,
      marginLeft: spacing.xs,
    },
    sortChips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
    sortChip: {
      paddingHorizontal: spacing.md,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: t.chipBg,
      ...Platform.select({ web: { cursor: "pointer" as const }, default: {} }),
    },
    sortChipOn: { backgroundColor: t.primary },
    sortChipText: { color: t.sub, fontSize: 12.5, fontWeight: "700" },
    sortChipTextOn: { color: t.primaryText },
    tabItem: {
      flex: 1,
      alignItems: "center",
      paddingVertical: spacing.sm,
      ...Platform.select({ web: { cursor: "pointer" as const }, default: {} }),
    },
    tabPill: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.xs + 2,
      borderRadius: 999,
    },
    tabPillOn: { backgroundColor: t.chipBg },
    tabText: { color: t.sub, fontSize: 13, fontWeight: "600" },
    tabTextOn: { color: t.primary, fontWeight: "800" },
    empty: { alignItems: "center", padding: spacing.xl, marginTop: spacing.xl },
    emptyTitle: { color: t.text, fontSize: 18, fontWeight: "700" },
    emptySub: { color: t.sub, fontSize: 14, marginTop: spacing.xs },
    emptyBtn: {
      marginTop: spacing.lg,
      backgroundColor: t.primary,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md,
      borderRadius: radius.md,
    },
    emptyBtnText: { color: t.primaryText, fontWeight: "700", fontSize: 15 },
    disclaimer: {
      color: t.sub,
      fontSize: 11,
      lineHeight: 16,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.lg,
    },
    fxBar: {
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
      backgroundColor: t.card,
      borderRadius: radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.border,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      marginHorizontal: spacing.md,
      marginBottom: spacing.md,
      gap: spacing.xs,
    },
    fxLabel: { color: t.text, fontSize: 13, fontWeight: "600" },
    fxInput: {
      minWidth: 72,
      borderWidth: 1.5,
      borderColor: t.primary,
      borderRadius: radius.sm,
      backgroundColor: t.chipBg,
      color: t.text,
      fontSize: 15,
      fontWeight: "700",
      paddingVertical: 4,
      paddingHorizontal: spacing.sm,
      textAlign: "center",
    },
    fxNote: { color: t.sub, fontSize: 11, width: "100%", marginTop: 2 },
  });
