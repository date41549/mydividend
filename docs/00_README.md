# 配当トラッカー（仮）ドキュメント

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

## 決定事項（サマリー）

- **ポジショニング**：高配当ガチ勢向けの、モダンで深掘りできる配当トラッカー（B×A ハイブリッド）
- **UI/UX方針**：モダンで可読性の高いデザイン（明るいグリーン基調・等幅の数字・押せる場所が明快・ライト/ダーク対応）。差別化は課金の分析深度で担保（詳細 08）
- **マネタイズ**：フリーミアム（広告 ＋ 月額課金 250〜300円）
- **データ源**：MVPは手入力（規約・法律・コストを回避）。将来 J-Quants を検討
- **技術**：Expo + TypeScript、AsyncStorage、MVPはシンプルなタブUI

## 現状

- **MVP（FR-1〜9）コード実装完了**（保有CRUD・円換算・並び替え・サマリー・カレンダー・目標・口座別・永続化・免責・外部リンク）
- UI/UX を B（明るくポップ＋データ密）で刷新済み。アフォーダンス整備済み（`08_ui_ux_design.md`）
- **単体テスト導入済み**（jest＋@swc/jest、calc＋backup で37ケース全パス。`npm test`）
- **JSONバックアップ（FR-10）実装済み**（設定タブ：エクスポート／インポート）
- **アプリアイコン・スプラッシュ実装済み**（緑の¥コイン。`scripts/gen-icons.mjs` で再生成可。表示名「配当トラッカー」・ダーク対応）
- **リリース準備着手**：ESLint導入（lint/型/テストの3ゲート緑）、`.github/workflows/`（CI＋タグでEASビルド）、`eas.json`、app.jsonに識別子（`com.hirokidate.dividendtracker`）、`docs/privacy_policy.md` 起草
- 残（伊達さん側が主）：実機CRUDテスト → Apple/Google登録・`eas init`/`EXPO_TOKEN` → プライバシーポリシー公開URL・スクショ → EASビルド/審査（05,06）

## 開発の進め方（ルール）

- **要件定義（02）・基本設計（03）・UI/UX（08）を"正"として実装する。** 場当たりで機能を足さない。
- **方針・仕様が変わったら、コードより先に該当ドキュメントを更新する。** 実装とドキュメントの乖離を残さない。
