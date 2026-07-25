# dividend-tracker 開発ルール（エージェント向け）

## Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

## ドキュメント駆動（必守）

- **`docs/` を"正"として実装する。** 特に要件定義 `02_requirements.md`・基本設計 `03_design.md`・UI/UX設計 `08_ui_ux_design.md`。作業前に該当ドキュメントを読む。
- **場当たりで機能・UIを足さない。** 実装候補はロードマップ（02）とMVPスコープに沿わせる。ロードマップ外へ横飛びしそうな時は、まず要件側で位置づけを確認する。
- **方針・仕様・UIの変更が決まったら、コードより先に該当ドキュメントを更新する。** 実装とドキュメントの乖離を残さない。UIの見た目を変える時は `08_ui_ux_design.md` を先に直す。
- 現在の到達点：**MVP（FR-1〜9）コード実装完了**。次は実機CRuDテスト → v1.1（単体テスト・JSONバックアップ・UX磨き・アイコン/スプラッシュ）でストア審査品質へ。
