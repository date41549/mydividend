import { Holding, Goal, Settings, AccountType, AssetType, DEFAULT_GOAL, DEFAULT_SETTINGS } from "./types";

// バックアップJSONの形式。端末内の全データを1つにまとめる。
export const BACKUP_VERSION = 1;

export type Backup = {
  app: "dividend-tracker";
  version: number;
  exportedAt: string; // ISO 文字列
  holdings: Holding[];
  goal: Goal;
  settings: Settings;
};

export type ParsedBackup = {
  holdings: Holding[];
  goal: Goal;
  settings: Settings;
};

// 全データを整形済みJSON文字列に。exportedAt は呼び出し側から渡す（テスト容易性のため）。
export function buildBackup(
  holdings: Holding[],
  goal: Goal,
  settings: Settings,
  exportedAt: string
): string {
  const backup: Backup = {
    app: "dividend-tracker",
    version: BACKUP_VERSION,
    exportedAt,
    holdings,
    goal,
    settings,
  };
  return JSON.stringify(backup, null, 2);
}

const ACCOUNTS: AccountType[] = ["nisa", "specific", "general"];
const ASSET_TYPES: AssetType[] = ["jp_stock", "jp_etf", "jp_reit", "us_stock", "us_etf"];

function num(v: unknown, fallback = 0): number {
  return typeof v === "number" && isFinite(v) ? v : fallback;
}
function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

// 1銘柄を検証・正規化。想定外は捨てずに安全な既定へ寄せる（取り込みで落とさない）。
function normalizeHolding(raw: any, i: number): Holding {
  if (raw == null || typeof raw !== "object") {
    throw new Error(`${i + 1}件目の銘柄データが不正です。`);
  }
  const assetType = ASSET_TYPES.includes(raw.assetType) ? raw.assetType : "jp_stock";
  const account = ACCOUNTS.includes(raw.account) ? raw.account : "specific";
  const payoutMonths = Array.isArray(raw.payoutMonths)
    ? raw.payoutMonths.filter((m: unknown) => typeof m === "number" && m >= 1 && m <= 12)
    : [];
  const h: Holding = {
    id: str(raw.id) || `imported-${i}-${str(raw.code)}`,
    code: str(raw.code),
    name: str(raw.name),
    assetType,
    shares: num(raw.shares),
    dividendPerShare: num(raw.dividendPerShare),
    price: num(raw.price),
    payoutMonths,
    account,
  };
  if (raw.acquisitionPrice != null) h.acquisitionPrice = num(raw.acquisitionPrice);
  if (raw.sector != null) h.sector = str(raw.sector);
  if (raw.memo != null) h.memo = str(raw.memo);
  return h;
}

function normalizeGoal(raw: any): Goal {
  if (raw == null || typeof raw !== "object") return { ...DEFAULT_GOAL };
  return {
    monthlyDividend: num(raw.monthlyDividend, DEFAULT_GOAL.monthlyDividend),
    annualDividend: num(raw.annualDividend, DEFAULT_GOAL.annualDividend),
    yieldPercent: num(raw.yieldPercent, DEFAULT_GOAL.yieldPercent),
    holdingsCount: num(raw.holdingsCount, DEFAULT_GOAL.holdingsCount),
    acquisitionTotal: num(raw.acquisitionTotal, DEFAULT_GOAL.acquisitionTotal),
  };
}

function normalizeSettings(raw: any): Settings {
  const fx = num(raw?.fxUsdJpy, DEFAULT_SETTINGS.fxUsdJpy);
  return { fxUsdJpy: fx > 0 ? fx : DEFAULT_SETTINGS.fxUsdJpy };
}

// 貼り付け/読み込んだ文字列を検証してデータへ。壊れていれば日本語メッセージで throw。
export function parseBackup(text: string): ParsedBackup {
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("JSONとして読み取れませんでした。バックアップの文字列を丸ごと貼り付けてください。");
  }
  if (data == null || typeof data !== "object") {
    throw new Error("バックアップの形式が不正です。");
  }
  if (data.app !== undefined && data.app !== "dividend-tracker") {
    throw new Error("このアプリのバックアップではありません。");
  }
  if (!Array.isArray(data.holdings)) {
    throw new Error("保有データ（holdings）が見つかりません。");
  }
  const holdings = data.holdings.map((h: any, i: number) => normalizeHolding(h, i));
  return {
    holdings,
    goal: normalizeGoal(data.goal),
    settings: normalizeSettings(data.settings),
  };
}
