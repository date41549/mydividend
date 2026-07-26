import { Holding, AccountType, Cyclicality, Goal, Currency } from "./types";
import { cyclicalityOf } from "./sectorClassification";
import { currencyOf, toJPY, assetLabel } from "./assetClass";

// 日本株の配当にかかる税率（所得税15.315% + 住民税5% = 20.315%）
export const TAX_RATE = 0.20315;

// ---- 1銘柄あたりの計算（すべて銘柄の通貨建て） ---------------------------

export function currency(h: Holding): Currency {
  return currencyOf(h.assetType);
}

// 年間配当（税引前・通貨建て）＝ 保有株数 × 1株配当
export function annualDividend(h: Holding): number {
  return h.shares * h.dividendPerShare;
}

// 年間配当（税引後・通貨建て）。NISAは非課税、それ以外は20.315%控除。
// ※米国資産の米国源泉10%やJ-REIT特有の扱いはMVPでは未考慮（概算）。
export function afterTaxDividend(h: Holding): number {
  const gross = annualDividend(h);
  return h.account === "nisa" ? gross : gross * (1 - TAX_RATE);
}

// 現在利回り（%）＝ 1株配当 ÷ 現在株価 × 100。通貨に依存しない比率。
export function currentYield(h: Holding): number {
  if (h.price <= 0) return 0;
  return (h.dividendPerShare / h.price) * 100;
}

// 簿価利回り（YOC, %）＝ 1株配当 ÷ 取得単価 × 100。取得単価未入力なら null。
export function yieldOnCost(h: Holding): number | null {
  if (!h.acquisitionPrice || h.acquisitionPrice <= 0) return null;
  return (h.dividendPerShare / h.acquisitionPrice) * 100;
}

// 評価額（通貨建て）＝ 保有株数 × 現在株価
export function marketValue(h: Holding): number {
  return h.shares * h.price;
}

// 取得額（通貨建て）。未入力なら null。
export function acquisitionValue(h: Holding): number | null {
  if (!h.acquisitionPrice || h.acquisitionPrice <= 0) return null;
  return h.shares * h.acquisitionPrice;
}

// 含み損益（通貨建て）＝ 評価額 − 取得額。取得単価未入力なら null。
export function unrealizedPL(h: Holding): number | null {
  const acq = acquisitionValue(h);
  if (acq === null) return null;
  return marketValue(h) - acq;
}

// 損益率（%）。通貨に依存しない比率。取得単価未入力なら null。
export function plPercent(h: Holding): number | null {
  const acq = acquisitionValue(h);
  const pl = unrealizedPL(h);
  if (acq === null || pl === null || acq <= 0) return null;
  return (pl / acq) * 100;
}

// ---- 円換算版（集計・合算はすべて円で行う） ------------------------------

export function annualDividendJPY(h: Holding, fx: number): number {
  return toJPY(annualDividend(h), currency(h), fx);
}
export function afterTaxDividendJPY(h: Holding, fx: number): number {
  return toJPY(afterTaxDividend(h), currency(h), fx);
}
export function marketValueJPY(h: Holding, fx: number): number {
  return toJPY(marketValue(h), currency(h), fx);
}
export function acquisitionValueJPY(h: Holding, fx: number): number {
  const acq = acquisitionValue(h);
  return acq === null ? 0 : toJPY(acq, currency(h), fx);
}
export function unrealizedPLJPY(h: Holding, fx: number): number {
  const pl = unrealizedPL(h);
  return pl === null ? 0 : toJPY(pl, currency(h), fx);
}

// ---- ポートフォリオ全体（円ベース） --------------------------------------

export function totalAnnual(holdings: Holding[], fx: number): number {
  return holdings.reduce((sum, h) => sum + annualDividendJPY(h, fx), 0);
}

export function totalAnnualAfterTax(holdings: Holding[], fx: number): number {
  return holdings.reduce((sum, h) => sum + afterTaxDividendJPY(h, fx), 0);
}

export function totalMarketValue(holdings: Holding[], fx: number): number {
  return holdings.reduce((sum, h) => sum + marketValueJPY(h, fx), 0);
}

export function totalAcquisition(holdings: Holding[], fx: number): number {
  return holdings.reduce((sum, h) => sum + acquisitionValueJPY(h, fx), 0);
}

export function totalUnrealizedPL(holdings: Holding[], fx: number): number {
  return holdings.reduce((sum, h) => sum + unrealizedPLJPY(h, fx), 0);
}

export function portfolioYield(holdings: Holding[], fx: number): number {
  const mv = totalMarketValue(holdings, fx);
  if (mv <= 0) return 0;
  return (totalAnnual(holdings, fx) / mv) * 100;
}

// 月別（1〜12月）の配当見込み額（円）。各銘柄の年間配当を支払月の数で等分。
export function monthlyDividends(holdings: Holding[], fx: number): number[] {
  const months = new Array(12).fill(0);
  for (const h of holdings) {
    if (h.payoutMonths.length === 0) continue;
    const perMonth = annualDividendJPY(h, fx) / h.payoutMonths.length;
    for (const m of h.payoutMonths) {
      if (m >= 1 && m <= 12) months[m - 1] += perMonth;
    }
  }
  return months;
}

// ---- 口座別サマリー（円ベース） ------------------------------------------

export type AccountSummaryRow = {
  account: AccountType;
  count: number;
  annual: number;
  afterTax: number;
  marketValue: number;
};

export function accountSummary(holdings: Holding[], fx: number): AccountSummaryRow[] {
  const order: AccountType[] = ["nisa", "specific", "general"];
  return order
    .map((account) => {
      const rows = holdings.filter((h) => h.account === account);
      return {
        account,
        count: rows.length,
        annual: totalAnnual(rows, fx),
        afterTax: totalAnnualAfterTax(rows, fx),
        marketValue: totalMarketValue(rows, fx),
      };
    })
    .filter((r) => r.count > 0);
}

// NISA 生涯非課税保有限度額（簿価ベース・成長投資枠＋つみたて枠の合算上限）。
export const NISA_LIFETIME_CAP = 18_000_000;

// NISA口座の簿価（取得額）合計＝生涯枠の消化額。売却済みは保有に無いので現在の枠使用を概算できる。
// ※年間240万枠は購入年の情報が要るため未対応（生涯枠のみ）。
export function nisaLifetimeUsed(holdings: Holding[], fx: number): number {
  return holdings
    .filter((h) => h.account === "nisa")
    .reduce((sum, h) => sum + acquisitionValueJPY(h, fx), 0);
}

export function accountLabel(a: AccountType): string {
  if (a === "nisa") return "NISA（非課税）";
  if (a === "specific") return "特定口座";
  return "一般口座";
}

// ---- 目標 vs 実績（円ベース） --------------------------------------------

export type GoalRow = {
  key: string;
  label: string;
  goal: number;
  actual: number;
  ratio: number;
  unit: "yen" | "percent" | "count";
};

export function goalProgress(holdings: Holding[], goal: Goal, fx: number): GoalRow[] {
  const annual = totalAnnual(holdings, fx);
  const rows: Omit<GoalRow, "ratio">[] = [
    { key: "monthly", label: "月間配当金", goal: goal.monthlyDividend, actual: annual / 12, unit: "yen" },
    { key: "annual", label: "年間配当金", goal: goal.annualDividend, actual: annual, unit: "yen" },
    { key: "yield", label: "利回り", goal: goal.yieldPercent, actual: portfolioYield(holdings, fx), unit: "percent" },
    { key: "count", label: "銘柄数", goal: goal.holdingsCount, actual: holdings.length, unit: "count" },
    { key: "acq", label: "取得額", goal: goal.acquisitionTotal, actual: totalAcquisition(holdings, fx), unit: "yen" },
  ];
  return rows.map((r) => ({ ...r, ratio: r.goal > 0 ? r.actual / r.goal : 0 }));
}

// ---- 分散（課金機能の下地。円ベースの評価額で按分） ----------------------

export type CyclicalityBalance = {
  defensive: number;
  cyclical: number;
  unknown: number;
};

export function cyclicalityBalance(holdings: Holding[], fx: number): CyclicalityBalance {
  const total = totalMarketValue(holdings, fx);
  if (total <= 0) return { defensive: 0, cyclical: 0, unknown: 0 };
  let def = 0;
  let cyc = 0;
  let unk = 0;
  for (const h of holdings) {
    const mv = marketValueJPY(h, fx);
    const c: Cyclicality | undefined = cyclicalityOf(h.sector);
    if (c === "defensive") def += mv;
    else if (c === "cyclical") cyc += mv;
    else unk += mv;
  }
  return {
    defensive: (def / total) * 100,
    cyclical: (cyc / total) * 100,
    unknown: (unk / total) * 100,
  };
}

// ---- 構成比（ドーナツ用・FR-4b） ----------------------------------------

export type CompositionMode = "assetType" | "sector" | "holding";
export type CompositionMetric = "value" | "dividend";
export type CompositionSlice = { key: string; label: string; value: number; pct: number };

// 上位いくつまで個別スライスにするか（残りは「その他」に集約）。
const COMPOSITION_TOP = 6;

// ポートフォリオ構成を円換算で按分。mode で 資産種別／セクター／銘柄、metric で 評価額／年間配当 を切替。
// 大きい順。上位を超えた分は「その他」にまとめる。合計0なら空配列。
export function portfolioComposition(
  holdings: Holding[],
  fx: number,
  mode: CompositionMode,
  metric: CompositionMetric = "value"
): CompositionSlice[] {
  const groups = new Map<string, { label: string; value: number }>();
  for (const h of holdings) {
    const v = metric === "dividend" ? annualDividendJPY(h, fx) : marketValueJPY(h, fx);
    if (v <= 0) continue;
    let key: string;
    let label: string;
    if (mode === "assetType") {
      key = h.assetType;
      label = assetLabel(h.assetType);
    } else if (mode === "sector") {
      key = h.sector && h.sector.length > 0 ? h.sector : "__unknown";
      label = h.sector && h.sector.length > 0 ? h.sector : "未分類";
    } else {
      key = h.id;
      label = h.name || h.code || "(名称未設定)";
    }
    const g = groups.get(key);
    if (g) g.value += v;
    else groups.set(key, { label, value: v });
  }

  const total = [...groups.values()].reduce((s, g) => s + g.value, 0);
  if (total <= 0) return [];

  const sorted = [...groups.entries()]
    .map(([key, g]) => ({ key, label: g.label, value: g.value }))
    .sort((a, b) => b.value - a.value);

  let sliced: { key: string; label: string; value: number }[];
  if (sorted.length > COMPOSITION_TOP) {
    const head = sorted.slice(0, COMPOSITION_TOP);
    const rest = sorted.slice(COMPOSITION_TOP).reduce((s, x) => s + x.value, 0);
    sliced = [...head, { key: "__other", label: "その他", value: rest }];
  } else {
    sliced = sorted;
  }

  return sliced.map((s) => ({ ...s, pct: (s.value / total) * 100 }));
}

// ---- 表示ヘルパー（円） ---------------------------------------------------

export function yen(n: number): string {
  return Math.round(n).toLocaleString("ja-JP") + "円";
}

export function signedYen(n: number): string {
  const s = Math.round(n).toLocaleString("ja-JP");
  return (n >= 0 ? "+" : "") + s + "円";
}

export function pct(n: number, digits = 2): string {
  return n.toFixed(digits) + "%";
}

export function signedPct(n: number, digits = 1): string {
  return (n >= 0 ? "+" : "") + n.toFixed(digits) + "%";
}
