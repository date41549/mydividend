import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, Platform, Switch } from "react-native";
import * as Clipboard from "expo-clipboard";
import { Holding, Goal, Settings } from "../types";
import { buildBackup, parseBackup, ParsedBackup } from "../backup";
import { Theme, useTheme, spacing, radius } from "../theme";

// 設定タブ。今は「データのバックアップ」（FR-10）を提供。
export function SettingsView({
  holdings,
  goal,
  settings,
  onImport,
  onToggleNotify,
}: {
  holdings: Holding[];
  goal: Goal;
  settings: Settings;
  onImport: (data: ParsedBackup) => void;
  onToggleNotify: (on: boolean) => void;
}) {
  const t = useTheme();
  const s = styles(t);

  const [exportMsg, setExportMsg] = useState<string | null>(null);
  const [importText, setImportText] = useState("");
  const [pending, setPending] = useState<ParsedBackup | null>(null);
  const [importErr, setImportErr] = useState<string | null>(null);
  const [importMsg, setImportMsg] = useState<string | null>(null);

  function currentJson(): string {
    return buildBackup(holdings, goal, settings, new Date().toISOString());
  }

  async function handleCopy() {
    try {
      await Clipboard.setStringAsync(currentJson());
      setExportMsg("クリップボードにコピーしました。安全な場所（メモやメール）に保存してね。");
    } catch {
      setExportMsg(
        Platform.OS === "web"
          ? "コピーできませんでした。「ダウンロード」でファイル保存してください。"
          : "コピーできませんでした。もう一度お試しください。"
      );
    }
  }

  // Web はファイルとしてダウンロードも可能に。
  function handleDownload() {
    if (Platform.OS !== "web" || typeof document === "undefined") return;
    const blob = new Blob([currentJson()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dividend-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExportMsg("JSONファイルをダウンロードしました。");
  }

  // 貼り付けたJSONを検証（この時点ではまだ置換しない）。
  function handleCheck() {
    setImportErr(null);
    setImportMsg(null);
    try {
      const data = parseBackup(importText);
      setPending(data);
    } catch (e: any) {
      setPending(null);
      setImportErr(e?.message ?? "取り込みに失敗しました。");
    }
  }

  // 確認後に全置換して保存。
  function handleApply() {
    if (!pending) return;
    onImport(pending);
    setImportMsg(`${pending.holdings.length}件の銘柄を取り込みました。`);
    setPending(null);
    setImportText("");
  }

  return (
    <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
      {/* 通知（FR-17） */}
      <View style={s.card}>
        <View style={s.toggleRow}>
          <View style={s.toggleTexts}>
            <Text style={s.cardTitle}>配当月リマインド</Text>
            <Text style={s.desc}>配当が入る月の初めに「今月は配当月」と通知します。</Text>
          </View>
          <Switch
            value={settings.notifyDividendMonth}
            onValueChange={onToggleNotify}
            trackColor={{ true: t.primary }}
          />
        </View>
      </View>

      {/* エクスポート */}
      <View style={s.card}>
        <Text style={s.cardTitle}>データのバックアップ</Text>
        <Text style={s.desc}>
          保有 {holdings.length}件・目標・為替を1つのJSONに書き出します。端末を変える時や、消える前の保険に。
        </Text>
        <View style={s.actions}>
          <Pressable style={s.btn} onPress={handleCopy}>
            <Text style={s.btnText}>コピー</Text>
          </Pressable>
          {Platform.OS === "web" ? (
            <Pressable style={s.btnGhost} onPress={handleDownload}>
              <Text style={s.btnGhostText}>ダウンロード</Text>
            </Pressable>
          ) : null}
        </View>
        {exportMsg ? <Text style={s.okMsg}>{exportMsg}</Text> : null}
      </View>

      {/* インポート */}
      <View style={s.card}>
        <Text style={s.cardTitle}>データの復元</Text>
        <Text style={s.desc}>
          バックアップのJSONを貼り付けて取り込みます。
          <Text style={s.descWarn}>現在のデータは置き換わります。</Text>
        </Text>
        <TextInput
          style={s.input}
          value={importText}
          onChangeText={(v) => {
            setImportText(v);
            setPending(null);
            setImportErr(null);
            setImportMsg(null);
          }}
          placeholder="ここにバックアップJSONを貼り付け"
          placeholderTextColor={t.faint}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
        />
        {importErr ? <Text style={s.errMsg}>{importErr}</Text> : null}

        {pending ? (
          <View style={s.confirmBox}>
            <Text style={s.confirmText}>
              銘柄 {pending.holdings.length}件を取り込み、今のデータを置き換えます。よろしい？
            </Text>
            <View style={s.actions}>
              <Pressable style={s.btnGhost} onPress={() => setPending(null)}>
                <Text style={s.btnGhostText}>キャンセル</Text>
              </Pressable>
              <Pressable style={s.btnDanger} onPress={handleApply}>
                <Text style={s.btnText}>置き換えて取り込む</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable
            style={[s.btn, !importText.trim() && s.btnDisabled]}
            disabled={!importText.trim()}
            onPress={handleCheck}
          >
            <Text style={s.btnText}>内容を確認</Text>
          </Pressable>
        )}
        {importMsg ? <Text style={s.okMsg}>{importMsg}</Text> : null}
      </View>

      <Text style={s.note}>
        ※ バックアップは端末内データのコピーです。証券口座とは連携していません。
      </Text>
    </ScrollView>
  );
}

const pointer = Platform.select({ web: { cursor: "pointer" as const }, default: {} });
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
    cardTitle: { color: t.text, fontSize: 16, fontWeight: "800" },
    toggleRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
    toggleTexts: { flex: 1 },
    desc: { color: t.sub, fontSize: 12.5, lineHeight: 18, marginTop: spacing.xs },
    descWarn: { color: t.negative, fontWeight: "700" },
    actions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
    btn: {
      backgroundColor: t.primary,
      borderRadius: radius.md,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      alignItems: "center",
      flexGrow: 1,
      ...pointer,
    },
    btnText: { color: t.primaryText, fontWeight: "800", fontSize: 14 },
    btnDisabled: { opacity: 0.45 },
    btnGhost: {
      borderRadius: radius.md,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      alignItems: "center",
      flexGrow: 1,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.border,
      ...pointer,
    },
    btnGhostText: { color: t.sub, fontWeight: "700", fontSize: 14 },
    btnDanger: {
      backgroundColor: t.negative,
      borderRadius: radius.md,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      alignItems: "center",
      flexGrow: 1,
      ...pointer,
    },
    input: {
      borderWidth: 1.5,
      borderColor: t.border,
      borderRadius: radius.sm,
      backgroundColor: t.chipBg,
      color: t.text,
      fontSize: 13,
      padding: spacing.md,
      marginTop: spacing.md,
      minHeight: 110,
    },
    confirmBox: {
      marginTop: spacing.md,
      padding: spacing.md,
      borderRadius: radius.sm,
      backgroundColor: t.chipBg,
    },
    confirmText: { color: t.text, fontSize: 13, lineHeight: 18 },
    okMsg: { color: t.primary, fontSize: 12.5, marginTop: spacing.md, lineHeight: 18 },
    errMsg: { color: t.negative, fontSize: 12.5, marginTop: spacing.md, lineHeight: 18 },
    note: { color: t.faint, fontSize: 11, marginHorizontal: spacing.xs, lineHeight: 16 },
  });
