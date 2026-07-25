import { AssetType, Currency } from "./types";

// 資産種別の一覧とラベル（フォームの選択に使う）。
export const ASSET_TYPES: { key: AssetType; label: string }[] = [
  { key: "jp_stock", label: "日本株" },
  { key: "jp_etf", label: "日本ETF" },
  { key: "jp_reit", label: "J-REIT" },
  { key: "us_stock", label: "米国株" },
  { key: "us_etf", label: "米国ETF" },
];

export function assetLabel(a: AssetType): string {
  return ASSET_TYPES.find((x) => x.key === a)?.label ?? a;
}

// 米国資産か（USD建て・二重課税の対象）。
export function isUS(a: AssetType): boolean {
  return a === "us_stock" || a === "us_etf";
}

// 資産種別から通貨を導出する。
export function currencyOf(a: AssetType): Currency {
  return isUS(a) ? "USD" : "JPY";
}

// 通貨記号。
export function currencySymbol(c: Currency): string {
  return c === "USD" ? "$" : "¥";
}

// 通貨建ての金額を人間向けに整形する。USDは小数2桁、JPYは整数＋円。
export function fmtNative(amount: number, c: Currency, signed = false): string {
  const sign = signed && amount >= 0 ? "+" : "";
  if (c === "USD") {
    return `${sign}$${amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
  return `${sign}${Math.round(amount).toLocaleString("ja-JP")}円`;
}

// 通貨建ての金額を円に換算する。fx は 1USD=何円。
export function toJPY(amount: number, c: Currency, fx: number): number {
  return c === "USD" ? amount * fx : amount;
}
