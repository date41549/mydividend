import React, { useEffect, useRef, useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Holding, HoldingInput, AccountType, AssetType } from "../types";
import { SECTOR_LIST } from "../sectorClassification";
import { lookupStock } from "../stockDirectory";
import { ASSET_TYPES, currencyOf, currencySymbol } from "../assetClass";
import { Theme, useTheme, spacing, radius } from "../theme";

const ACCOUNTS: { key: AccountType; label: string }[] = [
  { key: "nisa", label: "NISA" },
  { key: "specific", label: "特定" },
  { key: "general", label: "一般" },
];
const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

// 追加/編集フォーム（モーダル）。initial があれば編集、なければ新規。
export function HoldingForm({
  visible,
  initial,
  onSubmit,
  onDelete,
  onClose,
}: {
  visible: boolean;
  initial: Holding | null;
  onSubmit: (input: HoldingInput) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  const t = useTheme();
  const s = styles(t);
  const insets = useSafeAreaInsets();

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [assetType, setAssetType] = useState<AssetType>("jp_stock");
  const [shares, setShares] = useState("");
  const [dividendPerShare, setDividendPerShare] = useState("");
  const [price, setPrice] = useState("");
  const [acquisitionPrice, setAcquisitionPrice] = useState("");
  const [payoutMonths, setPayoutMonths] = useState<number[]>([]);
  const [account, setAccount] = useState<AccountType>("nisa");
  const [sector, setSector] = useState<string | undefined>(undefined);
  const [memo, setMemo] = useState("");
  // コードからの自動補完（FB2）で入れた値を覚えておき、ユーザーが手で直した値は
  // 上書きしないためのしるし。編集時・別コードへの打ち替え時に賢く振る舞う。
  const [autoFilled, setAutoFilled] = useState<string | null>(null);
  const lastAuto = useRef<{ name?: string; sector?: string }>({});

  // モーダルを開くたびに initial の内容で初期化する。
  // 開いた瞬間に props から state を同期する意図的な初期化。key での再マウントでも
  // 実現できるが、Modal を常時マウントする構成のため effect で行う（このルールのみ局所的に無効化）。
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!visible) return;
    setCode(initial?.code ?? "");
    setName(initial?.name ?? "");
    setAssetType(initial?.assetType ?? "jp_stock");
    setShares(initial ? String(initial.shares) : "");
    setDividendPerShare(initial ? String(initial.dividendPerShare) : "");
    setPrice(initial ? String(initial.price) : "");
    setAcquisitionPrice(initial?.acquisitionPrice ? String(initial.acquisitionPrice) : "");
    setPayoutMonths(initial?.payoutMonths ?? []);
    setAccount(initial?.account ?? "nisa");
    setSector(initial?.sector);
    setMemo(initial?.memo ?? "");
    // 既存の値は「ユーザーの値」として扱い、自動補完の対象にしない。
    setAutoFilled(null);
    lastAuto.current = {};
  }, [visible, initial]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const cur = currencyOf(assetType);
  const sym = currencySymbol(cur);

  // コード入力時に銘柄名・業種を自動補完する（日本の資産のみ・辞書に載っていれば）。
  // 直前に自動補完した値、または空欄のときだけ入れる＝手入力は壊さない。
  function onChangeCode(v: string) {
    setCode(v);
    // 関数型 setState の更新関数は遅延実行される。その中で lastAuto.current を読むと
    // 下で書き換えた後の値になってしまうため、必ずローカルに退避してから使う。
    const prevAuto = lastAuto.current;
    const hit = cur === "JPY" ? lookupStock(v) : undefined;
    if (hit) {
      setName((prev) => (!prev.trim() || prev === prevAuto.name ? hit.name : prev));
      if (hit.sector) {
        const sec = hit.sector;
        setSector((prev) => (!prev || prev === prevAuto.sector ? sec : prev));
      }
      lastAuto.current = { name: hit.name, sector: hit.sector };
      setAutoFilled(hit.sector ? `${hit.name}・${hit.sector}` : hit.name);
    } else {
      // コードが辞書から外れたら、自動補完した値だけ引っ込める（手入力は残す）。
      setName((prev) => (prev === prevAuto.name ? "" : prev));
      setSector((prev) => (prev === prevAuto.sector ? undefined : prev));
      lastAuto.current = {};
      setAutoFilled(null);
    }
  }

  function toggleMonth(m: number) {
    setPayoutMonths((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m].sort((a, b) => a - b)
    );
  }

  function num(v: string): number {
    const n = parseFloat(v.replace(/,/g, ""));
    return isNaN(n) ? 0 : n;
  }

  function submit() {
    if (!name.trim()) {
      Alert.alert("入力エラー", "銘柄名を入力してください。");
      return;
    }
    if (num(shares) <= 0 || num(dividendPerShare) < 0) {
      Alert.alert("入力エラー", "保有株数・1株配当を正しく入力してください。");
      return;
    }
    const acq = num(acquisitionPrice);
    const input: HoldingInput = {
      code: code.trim(),
      name: name.trim(),
      assetType,
      shares: num(shares),
      dividendPerShare: num(dividendPerShare),
      price: num(price),
      acquisitionPrice: acq > 0 ? acq : undefined,
      payoutMonths,
      account,
      sector,
      memo: memo.trim() || undefined,
    };
    onSubmit(input);
  }

  function confirmDelete() {
    if (!initial) return;
    Alert.alert("削除", `「${initial.name}」を削除しますか？`, [
      { text: "キャンセル", style: "cancel" },
      { text: "削除", style: "destructive", onPress: () => onDelete(initial.id) },
    ]);
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[s.screen, { paddingTop: insets.top }]}>
        <View style={s.header}>
          <Pressable onPress={onClose} hitSlop={8}>
            <Text style={s.headerCancel}>閉じる</Text>
          </Pressable>
          <Text style={s.headerTitle}>{initial ? "銘柄を編集" : "銘柄を追加"}</Text>
          <Pressable onPress={submit} hitSlop={8}>
            <Text style={s.headerSave}>保存</Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={[s.body, { paddingBottom: spacing.xl + insets.bottom }]}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={s.label}>資産種別</Text>
          <View style={s.chips}>
            {ASSET_TYPES.map((a) => (
              <Pressable
                key={a.key}
                style={[s.chip, assetType === a.key && s.chipOn]}
                onPress={() => setAssetType(a.key)}
              >
                <Text style={[s.chipText, assetType === a.key && s.chipTextOn]}>{a.label}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={s.hint}>通貨：{cur === "USD" ? "米ドル（$）" : "円（¥）"}（資産種別から自動）</Text>

          <Row t={t}>
            <Field t={t} style={{ flex: 1 }} label="コード/ティッカー" value={code} onChangeText={onChangeCode} placeholder={cur === "USD" ? "VYM" : "8058"} keyboardType="default" autoCapitalize="characters" />
            <Field t={t} style={{ flex: 2 }} label="銘柄名 *" value={name} onChangeText={setName} placeholder={cur === "USD" ? "Vanguard 高配当ETF" : "三菱商事"} />
          </Row>
          {autoFilled ? <Text style={s.autoHint}>🔎 {autoFilled} を自動入力（そのまま直せます）</Text> : null}
          <Row t={t}>
            <SharesStepper t={t} value={shares} setValue={setShares} />
            <Field t={t} style={{ flex: 1 }} label={`1株配当（${sym}）*`} value={dividendPerShare} onChangeText={setDividendPerShare} placeholder={cur === "USD" ? "3.5" : "125"} keyboardType="numeric" />
          </Row>
          <Row t={t}>
            <Field t={t} style={{ flex: 1 }} label={`現在株価（${sym}）`} value={price} onChangeText={setPrice} placeholder={cur === "USD" ? "120" : "2500"} keyboardType="numeric" />
            <Field t={t} style={{ flex: 1 }} label={`取得単価（${sym}）`} value={acquisitionPrice} onChangeText={setAcquisitionPrice} placeholder={cur === "USD" ? "95" : "2000"} keyboardType="numeric" />
          </Row>

          <Text style={s.label}>口座種別</Text>
          <View style={s.segment}>
            {ACCOUNTS.map((a) => (
              <Pressable
                key={a.key}
                style={[s.segItem, account === a.key && s.segItemOn]}
                onPress={() => setAccount(a.key)}
              >
                <Text style={[s.segText, account === a.key && s.segTextOn]}>{a.label}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={s.label}>権利確定月（複数可）</Text>
          <View style={s.chips}>
            {MONTHS.map((m) => (
              <Pressable
                key={m}
                style={[s.chip, payoutMonths.includes(m) && s.chipOn]}
                onPress={() => toggleMonth(m)}
              >
                <Text style={[s.chipText, payoutMonths.includes(m) && s.chipTextOn]}>{m}月</Text>
              </Pressable>
            ))}
          </View>

          <Text style={s.label}>業種（景気感応度が自動で決まる）</Text>
          <View style={s.chips}>
            <Pressable style={[s.chip, !sector && s.chipOn]} onPress={() => setSector(undefined)}>
              <Text style={[s.chipText, !sector && s.chipTextOn]}>未設定</Text>
            </Pressable>
            {SECTOR_LIST.map((sec) => (
              <Pressable
                key={sec}
                style={[s.chip, sector === sec && s.chipOn]}
                onPress={() => setSector(sec)}
              >
                <Text style={[s.chipText, sector === sec && s.chipTextOn]}>{sec}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={s.label}>メモ</Text>
          <TextInput
            style={[s.input, s.memo]}
            value={memo}
            onChangeText={setMemo}
            placeholder="買い理由・方針など"
            placeholderTextColor={t.sub}
            multiline
          />

          {initial ? (
            <Pressable style={s.deleteBtn} onPress={confirmDelete}>
              <Text style={s.deleteText}>この銘柄を削除</Text>
            </Pressable>
          ) : null}
          <View style={{ height: spacing.xl }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

function Row({ t, children }: { t: Theme; children: React.ReactNode }) {
  return <View style={{ flexDirection: "row", gap: spacing.sm }}>{children}</View>;
}

// 保有株数の入力。単元（100株）単位で ＋/− できるステッパー。直接入力もできる。
// 日本株の多くは単元＝100株。単元未満（S株）や口数は直接入力で対応。
function SharesStepper({
  t,
  value,
  setValue,
  step = 100,
}: {
  t: Theme;
  value: string;
  setValue: React.Dispatch<React.SetStateAction<string>>;
  step?: number;
}) {
  const s = styles(t);
  // 連打しても取りこぼさないよう、直前の値からではなく関数型更新で加減する。
  const bump = (d: number) =>
    setValue((prev) => {
      const n = parseFloat((prev || "").replace(/,/g, ""));
      return String(Math.max(0, (isNaN(n) ? 0 : n) + d));
    });
  return (
    <View style={{ marginTop: spacing.md, flex: 1 }}>
      <Text style={s.label}>保有株数 *</Text>
      <View style={s.stepper}>
        <Pressable style={s.stepBtn} onPress={() => bump(-step)} hitSlop={6} accessibilityLabel="100株減らす">
          <Text style={s.stepBtnText}>−</Text>
        </Pressable>
        <TextInput
          style={[s.input, s.stepInput]}
          value={value}
          onChangeText={setValue}
          placeholder="100"
          placeholderTextColor={t.sub}
          keyboardType="numeric"
          textAlign="center"
        />
        <Pressable style={s.stepBtn} onPress={() => bump(step)} hitSlop={6} accessibilityLabel="100株増やす">
          <Text style={s.stepBtnText}>＋</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Field({
  t,
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize,
  style,
}: {
  t: Theme;
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: "numeric" | "numbers-and-punctuation" | "default";
  autoCapitalize?: "none" | "characters";
  style?: object;
}) {
  const s = styles(t);
  return (
    <View style={[{ marginTop: spacing.md }, style]}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        style={s.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={t.sub}
        keyboardType={keyboardType ?? "default"}
        autoCapitalize={autoCapitalize ?? "none"}
        autoCorrect={false}
      />
    </View>
  );
}

const styles = (t: Theme) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: t.bg },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xl + spacing.lg,
      paddingBottom: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: t.border,
      backgroundColor: t.card,
    },
    headerTitle: { color: t.text, fontSize: 16, fontWeight: "700" },
    headerCancel: { color: t.sub, fontSize: 15 },
    headerSave: { color: t.primary, fontSize: 15, fontWeight: "700" },
    body: { padding: spacing.lg },
    label: { color: t.sub, fontSize: 12, marginTop: spacing.md, marginBottom: spacing.xs },
    hint: { color: t.sub, fontSize: 11, marginTop: spacing.xs },
    autoHint: { color: t.primary, fontSize: 12, marginTop: spacing.xs, fontWeight: "600" },
    input: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.border,
      borderRadius: radius.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      color: t.text,
      fontSize: 16,
      backgroundColor: t.card,
    },
    memo: { minHeight: 64, textAlignVertical: "top" },
    stepper: { flexDirection: "row", alignItems: "stretch", gap: spacing.sm },
    stepBtn: {
      width: 44,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: radius.sm,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.border,
      backgroundColor: t.card,
    },
    stepBtnText: { color: t.primary, fontSize: 22, fontWeight: "700", lineHeight: 24 },
    stepInput: { flex: 1 },
    segment: { flexDirection: "row", gap: spacing.sm },
    segItem: {
      flex: 1,
      alignItems: "center",
      paddingVertical: spacing.sm,
      borderRadius: radius.sm,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.border,
      backgroundColor: t.card,
    },
    segItemOn: { backgroundColor: t.primary, borderColor: t.primary },
    segText: { color: t.text, fontWeight: "600" },
    segTextOn: { color: t.primaryText },
    chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
    chip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs + 2,
      borderRadius: radius.sm,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.border,
      backgroundColor: t.card,
    },
    chipOn: { backgroundColor: t.primary, borderColor: t.primary },
    chipText: { color: t.text, fontSize: 13 },
    chipTextOn: { color: t.primaryText, fontWeight: "700" },
    deleteBtn: {
      marginTop: spacing.xl,
      alignItems: "center",
      paddingVertical: spacing.md,
      borderRadius: radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.negative,
    },
    deleteText: { color: t.negative, fontWeight: "700", fontSize: 15 },
  });
