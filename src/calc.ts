import { Holding, AccountType, Cyclicality, Goal, Currency } from "./types";
import { cyclicalityOf } from "./sectorClassification";
import { currencyOf, toJPY } from "./assetClass";

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
