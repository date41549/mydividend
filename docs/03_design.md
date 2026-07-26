# 基本設計：マイ配当

## アーキテクチャ

- **フレームワーク**：Expo (React Native) + TypeScript
- **状態管理**：MVPは React の useState/useContext で十分。肥大化したら zustand を検討。
- **永続化**：AsyncStorage（端末内 KVS）。全保有を1つのJSON配列として保存。
- **ナビゲーション**：MVPは状態駆動のシンプルな下部タブ（保有 / カレンダー / 目標 / 設定）。将来 expo-router に移行可。
- **データ源**：MVPは手入力のみ。将来 J-Quants API を `services/` 層に差し込む。

```
src/
  types.ts                   データ型（Holding / Goal / Settings / AssetType / Currency ...）
  calc.ts                    配当・利回り・簿価利回り・含み損益・月別・税・目標の計算（★円換算=fx対応の純粋関数）
  assetClass.ts              資産種別ラベル・通貨導出（currencyOf）・通貨整形（fmtNative）・円換算（toJPY）
  sectorClassification.ts    業種→景気感応度の分類テーブル＋外部リンクURLの組み立て
  storage.ts                 AsyncStorage 読み書き（holdings/goals/settings）
  theme.ts                   色・余白・タイポの定数
  components/
    SummaryHeader.tsx        サマリー（年間配当・税引後・利回り・含み損益、円換算）
    AccountSummary.tsx       口座別サマリー（NISA/課税）
    HoldingCard.tsx          保有1件のカード（YOC・含み損益・外部リンク／米国は現地通貨＋円換算併記）
    HoldingForm.tsx          追加/編集フォーム（資産種別選択で通貨自動、モーダル）
    CalendarView.tsx         月別カレンダー
    GoalView.tsx             目標 vs 実績
  App.tsx                    画面切替＋状態の親（為替バー FxRateBar 含む）
```

## データモデル

MVPの `Holding`（`types.ts`）に、B（ガチ勢向け）を見据えた項目を最初から持たせる：

```ts
type AccountType = "nisa" | "specific" | "general"; // NISA / 特定 / 一般
type Cyclicality = "defensive" | "cyclical";        // ☘️ディフェンシブ / 🔥景気敏感
type AssetType = "jp_stock" | "jp_etf" | "jp_reit" | "us_stock" | "us_etf"; // 資産種別
type Currency = "JPY" | "USD";                       // 通貨（assetTypeから導出）

type Holding = {
  id: string;
  code: string;              // 証券コード/ティッカー 例 "8058", "VYM"
  name: string;              // 銘柄名
  assetType: AssetType;      // 資産種別（通貨・税・分類の基点）
  shares: number;            // 保有株数（口数）
  dividendPerShare: number;  // 1株あたり年間配当（★その銘柄の通貨建て）
  price: number;             // 現在株価（通貨建て。0で利回り非表示）
  acquisitionPrice?: number; // 取得単価（通貨建て。含み損益・簿価利回り用）
  payoutMonths: number[];    // 配当支払月 例 [6, 12]
  account: AccountType;      // 口座種別（税引後計算の分岐に使用）
  sector?: string;           // 業種（日本株の景気感応度導出・分散分析で使用）
  memo?: string;             // 銘柄メモ（買い理由・方針）
};

type Settings = { fxUsdJpy: number };  // 為替レート（1USD=何円、手入力）
```

- **資産種別＋通貨**：`assetType` が基点。通貨は `currencyOf()` で導出（`us_*` → USD、他 → JPY）。金額系フィールドはすべてその銘柄の通貨建てで保持し、**集計・合算は円換算して統一**（`toJPY(amount, currency, fx)`）。カードは現地通貨＋円換算を併記。
- **景気感応度**：業種→景気感応度は分類テーブルで自動導出（`cyclicalityOf()`）。stored field は持たず派生で扱う（不整合を避ける）。dividend-buy の「ディフェンシブ50%」ルールの可視化に使う。
- **口座種別**：NISA は配当非課税 → 税引後計算・口座別サマリー（FR-6）で分岐。MVPから実装。米国の二重課税・J-REIT特有は MVP では未反映（注記）。
- **取得単価**：簿価利回り（YOC）と含み損益の算出に使う。既存シートの中核指標なので MVP から。

### 業種→景気感応度の分類テーブル

既存スプレッドシート「業種一覧」を踏襲して `sectorClassification.ts` に定数で持つ：

```ts
// ☘️ディフェンシブ：サービス業/その他製品/医薬品/金属製品/小売業/情報・通信/
//   食料品/倉庫・運輸関連業/電気・ガス業/不動産業/保険業/水産・農林業/パルプ・紙/陸運業
// 🔥景気敏感：ガラス・土石製品/ゴム製品/その他金融業/卸売業/化学/機械/銀行業/建設業/
//   鉱業/繊維製品/電気機器/石油・石炭製品/鉄鋼/非鉄金属/輸送用機器/精密機器/海運業/空運業/証券業
```

## 画面設計

※ ビジュアル言語（配色・タイポ・コンポーネント・アフォーダンス）の詳細は [08_ui_ux_design.md](08_ui_ux_design.md) を正とする。ここでは画面構成のみ定義する。

### 1. 保有一覧（メイン）
- 上部：**サマリー**（年間配当 税引前ヒーロー／税引後・平均利回り・評価額合計・総含み損益のチップ）
- **口座別サマリー**（NISA=非課税分 / 特定・一般=課税分 を分けて表示）
- **並び替えバー**（配当/利回り/評価額/損益/名前。金額系は円換算で横断ソート）
- 中央：**保有カードのリスト**（銘柄名・コード / 株数 / 年間配当 / 現在利回り / **簿価利回り** / **含み損益・損益率**）。タップで編集。
- 各カードから**外部リンク**（株探/みんかぶ/IRBANK/バフェット・コード/Yahoo!ファイナンス）へワンタップ。
- 右下：**＋ボタン**（追加フォームを開く）
- 空状態：「最初の銘柄を追加しよう」の空表示
- 下部タブ（保有/カレンダー/目標）は現在地をピルで明示。

### 2. 追加/編集フォーム（モーダル）
- 入力：コード・銘柄名・株数・1株配当・株価・取得単価・権利月（複数選択）・口座種別・業種（選ぶと景気感応度が自動設定）・メモ
- バリデーション：数値項目は正の数、必須は銘柄名/株数/1株配当
- 削除ボタン（編集時のみ）

### 3. 配当カレンダー
- 12ヶ月グリッド or 縦リストで、各月の配当見込み額を表示
- 年間合計と、月別の棒の視覚化（MVPは簡易バーでOK）

### 4. 目標 vs 実績
- 目標入力：月間配当・年間配当・利回り・銘柄数・取得額（既存シートの「目標」欄を踏襲）
- 実績と達成率をゲージ/プログレスバーで表示。継続のモチベを支える中核画面。

### 5. 設定（下部タブに追加）
- **データのバックアップ**（FR-10：エクスポート／インポート）※実装済み
- 以降で追加：NISA枠トラッカー（FR-11）、免責・プライバシーポリシー、（課金導入後）プレミアム

## 計算ロジック（`calc.ts`：実装済み）

- `annualDividend(h)` = shares × dividendPerShare
- `currentYield(h)` = dividendPerShare ÷ price × 100（現在株価ベースの利回り）
- `yieldOnCost(h)` = dividendPerShare ÷ acquisitionPrice × 100（**簿価利回り／YOC**）
- `unrealizedPL(h)` = (price − acquisitionPrice) × shares（**含み損益**）／ `plPercent(h)`（損益率）
- `totalAnnual` / `totalAnnualAfterTax` / `portfolioYield` / `totalUnrealizedPL`
- **税の分岐（MVPから）**：`account === "nisa"` は非課税として税引後＝税引前。特定・一般は税率 **20.315%** を控除。口座別サマリー（FR-6）もこの分岐で集計。
- `monthlyDividends`：年間配当を支払月で等分し月別に集計
- `goalProgress`：目標（月間/年間配当・利回り・銘柄数・取得額）に対する実績と達成率（FR-5）
- `portfolioComposition`：構成比（資産種別／セクター／上位銘柄）を円換算評価額で按分（FR-4bのドーナツ用）
- `cyclicalityBalance`：ディフェンシブ／景気敏感の構成比（課金分析、dividend-buy連動）※関数は実装済み・UI未接続
- `dividendContribution`：銘柄別・業種別の配当金構成比（課金分析 FR-13）※**未実装（v1.2 予定）**

## 永続化設計（`storage.ts`）

- キー：`"holdings/v1"`（保有配列）、`"goals/v1"`（目標値）、`"settings/v1"`（為替レート等）
- 値：`Holding[]` / `Goal` / `Settings` を `JSON.stringify` で保存
- 起動時に読み込み、変更のたびに保存（デバウンス不要な規模）
- スキーマ変更に備え、キーにバージョン番号を付ける

### バックアップ（FR-10：JSONエクスポート/インポート）

手入力アプリなのでデータ消失＝致命傷。端末内データを1つのJSONにまとめて書き出し・取り込みできるようにする。

- **形式**：`{ app: "dividend-tracker", version: 1, exportedAt: ISO文字列, holdings, goal, settings }` の単一JSON。
- **純粋ロジックは `src/backup.ts` に分離**（UIから独立＝単体テスト可能）：
  - `buildBackup(holdings, goal, settings, exportedAt)` → 整形済みJSON文字列
  - `parseBackup(text)` → `{ holdings, goal, settings }`（構造検証。壊れたJSON・想定外形はエラーメッセージ付きで throw）
- **画面**：設定タブ（下記§画面設計5）に「データのバックアップ」節。
  - エクスポート：JSONを生成し、**Web=ファイルDL / ネイティブ＝クリップボードにコピー**（共有シート/ファイル保存はv1.1のUX磨きで追加）。
  - インポート：貼り付けたJSONを `parseBackup` で検証 → 件数を確認ダイアログ → 全データを置換して保存。
- **取り込みは全置換**（マージはしない）。誤操作対策に確認ダイアログを挟む。

## テスト

- **単体テスト**：`calc.ts` などの純粋ロジックを対象。`jest` ＋ `@swc/jest`（TSバージョン非依存・高速、`testEnvironment: node`）で RN/Expo に依存せず回す。`src/__tests__/*.test.ts`、実行は `npm test`。
- `calc.ts` は全公開関数をカバー済み（境界値・null分岐・円換算・混在ポート合算・月別等分・口座別・目標達成率・景気感応度按分・表示整形／27ケース）。
- UIコンポーネントのテストは今は対象外（純ロジックを calc に寄せてあるため費用対効果が高い層を優先）。将来必要なら jest-expo + React Native Testing Library を追加。

## 可視化（チャート）設計（FR-4b）

「見える化」で無料の第一印象を強くする。基本チャートは軽量に自前実装する。

- **描画基盤**：`react-native-svg`（iOS/Android/Web 共通）。チャート専用の重いライブラリは入れず、ドーナツ＝SVGの円弧、棒＝既存の View で描く（依存を最小化・デザイン完全掌握）。
- **計算は純関数**：`calc.ts` の `portfolioComposition(holdings, fx, mode)` が `mode`（`assetType`／`sector`／`holding`）ごとに「ラベル・円換算評価額・割合(%)」の配列を返す（テスト可能）。既存の `cyclicalityBalance` も流用。
- **配色**：`theme.ts` の緑ブランドと調和するカテゴリカル配色（緑を基点に色相を回す固定パレット）。ライト/ダーク両対応。1色は必ずアクセント緑。
- **コンポーネント**：`components/DonutChart.tsx`（汎用ドーナツ＋中央に合計）＋凡例。保有画面に「配当/資産の内訳」カードとして配置、資産種別／セクター／上位銘柄をチップで切替。
- **空・少数データ**：0件は非表示、1件は満円、"その他"に小さいスライスを集約。
- **高度な可視化（ツリーマップ・時系列・ドリルダウン）は FR-13＝課金**に置く。

## 拡張ポイント（将来）

- `services/quotes.ts`：株価・配当の取得を抽象化（手入力 / J-Quants を差し替え可能に）
- `services/notify.ts`：expo-notifications で権利日リマインド
- `services/billing.ts`：RevenueCat で課金
- 銘柄マスタ（コード→社名の内蔵辞書）で入力補助
