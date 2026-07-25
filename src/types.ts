// 口座種別。NISA は配当が非課税、特定・一般は課税（税引後計算の分岐に使う）。
export type AccountType = "nisa" | "specific" | "general";

// 景気感応度。業種から自動で決まる（sectorClassification.ts 参照）。
export type Cyclicality = "defensive" | "cyclical";

// 資産種別。配当が出る資産を横断で扱う。通貨はここから導出（米国=USD）。
export type AssetType = "jp_stock" | "jp_etf" | "jp_reit" | "us_stock" | "us_etf";

// 通貨。米国資産は USD、それ以外は JPY。
export type Currency = "JPY" | "USD";

// 保有している配当資産1銘柄を表すデータ。
// 金額系（price / dividendPerShare / acquisitionPrice）はその銘柄の通貨建て。
// この形のオブジェクトを配列で持って、端末内に保存する。
export type Holding = {
  id: string; // アプリ内で一意なID（追加時に自動生成）
  code: string; // 証券コード/ティッカー 例: "8058"（三菱商事）, "VYM"
  name: string; // 銘柄名 例: "三菱商事"
  assetType: AssetType; // 資産種別（通貨・税・分類の基点）
  shares: number; // 保有株数（口数）
  dividendPerShare: number; // 1株あたりの年間配当（その銘柄の通貨建て）
  price: number; // 現在の株価（通貨建て。0なら利回りは非表示）
  acquisitionPrice?: number; // 取得単価（通貨建て。未入力なら簿価利回り・含み損益はスキップ）
  payoutMonths: number[]; // 配当が支払われる月（1〜12）例: [6, 12]
  account: AccountType; // 口座種別
  sector?: string; // 業種 例: "卸売業"（日本株の景気感応度導出に使用。米国は任意）
  memo?: string; // 銘柄メモ（買い理由・方針など）
};

// 新規追加フォームの入力値。idはまだ無いのでOmitで除外する。
export type HoldingInput = Omit<Holding, "id">;

// 目標値（目標 vs 実績 画面で使う）。金額はすべて円換算ベース。
export type Goal = {
  monthlyDividend: number; // 月間配当金の目標（円）
  annualDividend: number; // 年間配当金の目標（円）
  yieldPercent: number; // 利回りの目標（%）
  holdingsCount: number; // 銘柄数の目標
  acquisitionTotal: number; // 取得額の目標（円）
};

// 目標未設定時の初期値。
export const DEFAULT_GOAL: Goal = {
  monthlyDividend: 10000,
  annualDividend: 120000,
  yieldPercent: 4.0,
  holdingsCount: 50,
  acquisitionTotal: 3000000,
};

// アプリ設定。米国資産を円換算するための為替レートなど。
export type Settings = {
  fxUsdJpy: number; // 1USD = 何円（手入力）
};

export const DEFAULT_SETTINGS: Settings = {
  fxUsdJpy: 150,
};
