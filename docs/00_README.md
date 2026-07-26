# マイ配当 ドキュメント

初アプリ開発（Expo / React Native / TypeScript）。高配当株の配当を管理するスマホアプリ。
公開・収益化を見据えつつ、まずは学習・練習として作り切ることを優先する。

## ドキュメント一覧

| ファイル | 内容 |
|----------|------|
| [01_competitive_analysis.md](01_competitive_analysis.md) | 競合分析・市場評価・差別化ポイント |
| [02_requirements.md](02_requirements.md) | 要件定義（機能/非機能・MVPスコープ・ロードマップ） |
| [03_design.md](03_design.md) | 基本設計（アーキ・データモデル・画面・計算ロジック） |
| [04_monetization.md](04_monetization.md) | マネタイズ設計（フリーミアム・実装方針・収益試算・法務） |
| [05_release_process.md](05_release_process.md) | iOS / Android 公開手順（EAS・アカウント費用・審査） |
| [06_cicd.md](06_cicd.md) | CI/CD 設計（GitHub Actions ＋ EAS Build/Submit） |
| [07_go_to_market.md](07_go_to_market.md) | 宣伝・ユーザー獲得戦略（ASO・オーガニック・広告） |
| [08_ui_ux_design.md](08_ui_ux_design.md) | UI/UX設計（デザインシステム・配色/タイポ・コンポーネント・アフォーダンス）※UI実装の正 |
| [launch_checklist.md](launch_checklist.md) | 公開作業チェックリスト（伊達さん用の手順書。アカウント→ビルド→テスター→提出） |
| [store_listing.md](store_listing.md) | ストア掲載文ドラフト（名前/サブ/キーワード/説明/スクショ構成。コピペ用） |
| [privacy_policy.md](privacy_policy.md) | プライバシーポリシー（公開URL化して両ストアに登録） |

## 決定事項（サマリー）

- **アプリ名**：**マイ配当**（bundle id `com.datz.mydividend`）
- **ポジショニング**：高配当ガチ勢向けの、モダンで深掘りできる配当トラッカー（B×A ハイブリッド）
- **UI/UX方針**：モダンで可読性の高いデザイン（明るいグリーン基調・等幅の数字・押せる場所が明快・ライト/ダーク対応）。差別化は課金の分析深度で担保（詳細 08）
- **マネタイズ**：フリーミアム（広告 ＋ 月額課金 250〜300円）
- **データ源**：MVPは手入力（規約・法律・コストを回避）。将来 J-Quants を検討
- **技術**：Expo + TypeScript、AsyncStorage、MVPはシンプルなタブUI

## 現状（2026-07-26 時点）

### アプリ実装（MVP＋v1.1/v1.2の一部まで完成）
- UI/UXを **B（明るくポップ＋データ密／緑の¥コイン）** で刷新・アフォーダンス整備（`08`）・**セーフエリア対応**・ダーク対応
- 保有CRUD・円換算・並び替え・サマリー・カレンダー・目標・口座別・永続化・免責・外部リンク（FR-1〜9）
- **JSONバックアップ(FR-10)** ／ **内訳ドーナツ(FR-4b：資産種別/セクター/景気感応度/銘柄 × 評価額/配当)** ／ **NISA生涯枠ゲージ(FR-11)** ／ **簿価利回りヒストグラム(FR-14)**
- アイコン/スプラッシュ（緑¥コイン・`scripts/gen-icons.mjs`）・表示名「マイ配当」
- **品質**：ESLint＋型＋単体テスト(calc/backup **47ケース**)の3ゲート緑・CI(`.github/workflows`)・**expo-doctor 20/20**
- **識別子**：bundle id `com.datz.mydividend`

### 公開準備（素材はほぼ完成）
- **LP**：`https://mydividend.datz.app`（リポの `site/` を Cloudflare Pages にGit連携で自動デプロイ）＋ **OG画像**(`site/og.png`)
- **プライバシーポリシー**：`https://mydividend.datz.app/privacy.html`（連絡先 `hello@datz.app`）
- **ストア掲載文**：`store_listing.md`（名前/サブ/キーワード/説明/スクショ構成）
- **ドメイン**：`datz.app`（Cloudflare・屋号アンブレラ）／メール `hello@datz.app`（個人Gmailへ転送）
- **EAS**：`eas init`済み・**Android実機ビルド成功＆インストール確認済み**（`package-lock.json`を追跡せず `npm install` 運用でLinuxビルドのlock不整合を回避）

### ⏳ 待ち／次（Play本人確認が解けたら再開）
- **Google Play 開発者アカウント 本人確認中（数日）** ← ここが解けるまで公開作業は停止中
- 承認後：クローズドテスト設定 → AABアップ → **12人×14日**（知人をPlay経由＋Discord相互）→ 審査 → 公開。公開時にLPの「近日公開」をPlay URLへ差し替え
- iOS未着手（Macありなのでシミュレータ可）／広告・課金(v1.2〜)はEAS Dev Build時に

## 開発の進め方（ルール）

- **要件定義（02）・基本設計（03）・UI/UX（08）を"正"として実装する。** 場当たりで機能を足さない。
- **方針・仕様が変わったら、コードより先に該当ドキュメントを更新する。** 実装とドキュメントの乖離を残さない。
- **リポ**：GitHub `date41549/mydividend`（private）。**commit→push で Cloudflare Pages が `site/` を自動デプロイ**。UI変更後は3ゲート（型/lint/test）を通す。
