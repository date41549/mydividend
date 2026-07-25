import { Cyclicality } from "./types";

// 業種（東証33業種ベース）→ 景気感応度の分類。
// 既存スプレッドシート（yoshiharu 版）の「業種一覧」を踏襲。
// ☘️ディフェンシブ＝景気に左右されにくい／🔥景気敏感＝景気に左右されやすい。
export const SECTOR_CLASSIFICATION: Record<string, Cyclicality> = {
  // ☘️ ディフェンシブ
  サービス業: "defensive",
  その他製品: "defensive",
  医薬品: "defensive",
  金属製品: "defensive",
  小売業: "defensive",
  "情報・通信": "defensive",
  食料品: "defensive",
  "倉庫・運輸関連業": "defensive",
  "電気・ガス業": "defensive",
  不動産業: "defensive",
  保険業: "defensive",
  "水産・農林業": "defensive",
  "パルプ・紙": "defensive",
  陸運業: "defensive",
  // 🔥 景気敏感
  "ガラス・土石製品": "cyclical",
  ゴム製品: "cyclical",
  その他金融業: "cyclical",
  卸売業: "cyclical",
  化学: "cyclical",
  機械: "cyclical",
  銀行業: "cyclical",
  建設業: "cyclical",
  鉱業: "cyclical",
  繊維製品: "cyclical",
  電気機器: "cyclical",
  "石油・石炭製品": "cyclical",
  鉄鋼: "cyclical",
  非鉄金属: "cyclical",
  輸送用機器: "cyclical",
  精密機器: "cyclical",
  海運業: "cyclical",
  空運業: "cyclical",
  証券業: "cyclical",
};

// フォームの業種選択に使う一覧（分類テーブルのキー）。
export const SECTOR_LIST: string[] = Object.keys(SECTOR_CLASSIFICATION);

// 業種から景気感応度を導出する。未知・未入力なら undefined。
export function cyclicalityOf(sector?: string): Cyclicality | undefined {
  if (!sector) return undefined;
  return SECTOR_CLASSIFICATION[sector];
}

// 景気感応度の表示ラベル（絵文字付き）。
export function cyclicalityLabel(c?: Cyclicality): string {
  if (c === "defensive") return "☘️ ディフェンシブ";
  if (c === "cyclical") return "🔥 景気敏感";
  return "—";
}

// 銘柄の外部詳細ページへのリンク。証券コードから組み立てる。
// カードから株探などにワンタップで飛べるようにする。
export type ExternalLink = { label: string; url: string };

export function externalLinks(code: string): ExternalLink[] {
  const c = encodeURIComponent(code.trim());
  if (!c) return [];
  return [
    { label: "株探", url: `https://kabutan.jp/stock/?code=${c}` },
    { label: "みんかぶ", url: `https://minkabu.jp/stock/${c}` },
    { label: "IRBANK", url: `https://irbank.net/${c}` },
    { label: "バフェット・コード", url: `https://www.buffett-code.com/company/${c}/` },
    { label: "Yahoo!ファイナンス", url: `https://finance.yahoo.co.jp/quote/${c}.T` },
  ];
}
