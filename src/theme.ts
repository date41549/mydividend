import { useColorScheme, Platform } from "react-native";

// 視覚言語：「ボールド・ポップ（Cash App / Revolut 系）× データ密な中身」。
// 表面は鮮やかな緑と親しみやすい白カード、中身は利回り・簿価・含み損益をきっちり出す。
// 数字はサンセリフ＋等幅（tabular）。ライト基調＋ダーク対応。
export type Theme = {
  mode: "light" | "dark";
  bg: string; // 画面の地（うっすら緑）
  card: string; // 白カード
  text: string; // 主テキスト
  sub: string; // 補助テキスト
  faint: string; // さらに控えめ（キャプション）
  border: string; // ヘアライン罫
  primary: string; // アクセント（緑）
  primaryText: string; // アクセント上の文字
  positive: string; // プラス
  negative: string; // マイナス
  chipBg: string; // チップ背景（淡い緑）
  heroBlock: string; // ヒーローの塗り（鮮やかな緑）
  heroText: string; // ヒーロー塗り上の文字（白）
  heroSub: string; // ヒーロー塗り上の補助文字
  serif: string; // 予備（現在は未使用）
};

const SERIF = Platform.select({ ios: "Georgia", android: "serif", default: "Georgia" }) as string;

// ライト：うっすら緑の地 × 鮮やかな緑。親しみやすく“今っぽい”。
const light: Theme = {
  mode: "light",
  bg: "#EFF9F2",
  card: "#FFFFFF",
  text: "#0B2418",
  sub: "#5B7568",
  faint: "#8A998F",
  border: "#E4EFE8",
  primary: "#00A83D",
  primaryText: "#FFFFFF",
  positive: "#00A63E",
  negative: "#E5484D",
  chipBg: "#E7F7ED",
  heroBlock: "#00C24A",
  heroText: "#FFFFFF",
  heroSub: "rgba(255,255,255,0.82)",
  serif: SERIF,
};

// ダーク：深い緑黒の地 × 明るい緑。ポップさは保ちつつ夜も見やすく。
const dark: Theme = {
  mode: "dark",
  bg: "#0B120E",
  card: "#141F19",
  text: "#EAF5EE",
  sub: "#8AA398",
  faint: "#6C8478",
  border: "#1F2E26",
  primary: "#2CE884",
  primaryText: "#05160E",
  positive: "#2CE884",
  negative: "#FF6B6F",
  chipBg: "#17241D",
  heroBlock: "#00B84A",
  heroText: "#FFFFFF",
  heroSub: "rgba(255,255,255,0.85)",
  serif: SERIF,
};

export function useTheme(): Theme {
  return useColorScheme() === "dark" ? dark : light;
}

// 余白・角丸（角丸は大きめでポップに）。
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const radius = { sm: 10, md: 14, lg: 20 };
