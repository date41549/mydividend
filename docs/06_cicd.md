# CI/CD 設計

個人開発なので「壊れたものを出さない」最低限を、手間なく回すのが目的。過剰にしない。

## 全体像

```
コード push (GitHub)
   │
   ├─ [CI] GitHub Actions … Lint / 型チェック / テスト（PR・main push で自動）
   │
   └─ [CD] EAS Build / Submit … タグ or 手動トリガでビルド→ストア提出
```

- **CI＝品質ゲート**：GitHub Actions で軽量に。
- **CD＝配布**：EAS（Expo）に任せる。ネイティブビルドを自前サーバで持たない。

## 段階的に導入（最初から全部やらない）

| 段階 | やること |
|------|---------|
| MVP開発中 | ローカルで `tsc`・`eslint` を回すだけ。CIなし |
| v1固まる頃 | GitHub Actions で lint＋型チェック＋テストを PR/main に自動化 |
| 公開前(v1.2) | EAS Build を GitHub Actions から起動（タグ push でビルド） |
| 公開後 | EAS Submit まで自動化＋OTA更新の運用 |

## CI：GitHub Actions（例）

`.github/workflows/ci.yml`：

```yaml
name: CI
on:
  pull_request:
  push:
    branches: [main]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npx tsc --noEmit          # 型チェック
      - run: npx eslint .              # Lint
      - run: npm test -- --ci          # テスト（calc.ts の純粋関数を優先的に）
```

- **テスト対象の優先順位**：`calc.ts`（配当・利回り・税・月別集計）＝ロジックの核。ここを Jest で固めるとコスパ最高。UIのE2Eは後回しで良い。

## CD：EAS Build / Submit

`eas.json` にプロファイルを定義：

```jsonc
{
  "build": {
    "development": { "developmentClient": true, "distribution": "internal" },
    "preview":     { "distribution": "internal" },        // 実機配布・テスター用
    "production":  {}                                       // ストア提出用
  },
  "submit": { "production": {} }
}
```

GitHub Actions から EAS を叩く場合（`.github/workflows/release.yml`、タグ push で起動）：

```yaml
on:
  push:
    tags: ["v*"]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm i -g eas-cli
      - run: eas build --platform all --non-interactive --profile production
        env: { EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }} }
      # 審査提出まで自動化するなら続けて eas submit
```

- **`EXPO_TOKEN`** は Expo のアクセストークンを GitHub Secrets に登録。
- iOS の署名証明書・Android のキーストアは **EAS が安全に保管・自動署名**（自前管理不要）。

## シークレット管理

- API キー等は **EAS Secrets** / GitHub Secrets に置く。**コードにハードコードしない・gitに入れない**（`.env` は `.gitignore`）。
- 現状MVPは外部APIなしなのでシークレットは EXPO_TOKEN 程度。将来 J-Quants キー等が増えたら EAS Secrets へ。

## リリースの型（推奨フロー）

1. feature ブランチで開発 → PR → CI通過 → main マージ
2. リリースするコミットに `vX.Y.Z` タグを打つ → release workflow が EAS Build
3. TestFlight / 内部テストで確認 → 問題なければストア公開
4. JSだけの小修正は **OTA更新**で即配信（再審査不要）

## やらないこと（過剰回避）

- 自前ビルドサーバ・Fastlane のフル自作（EASで足りる）
- 大掛かりなE2E（Detox等）は利用者が増えてから
- 複数環境(dev/stg/prod)の作り込みは不要。MVPは1本で十分
