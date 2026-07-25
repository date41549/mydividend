# リリース手順：iOS / Android 公開

Expo (EAS) を使う前提。個人開発で最も手数が少ないルート。

## 0. 前提：Expo Go から EAS へ

- 開発初期（MVP）は **Expo Go** アプリで実機確認できる（ネイティブ設定不要）。
- ただし **AdMob広告・課金(RevenueCat)・プッシュ通知の一部** は Expo Go で動かない → **EAS Development Build** が必要。
- ストア公開のバイナリは **EAS Build** で作る。ローカルに Xcode/Android Studio を揃えなくてもクラウドでビルドできるのが EAS の利点。

```bash
npm install -g eas-cli
eas login
eas build:configure   # eas.json を生成
```

## 1. アカウント・費用（初期に必要）

| 項目 | 費用 | 備考 |
|------|------|------|
| Apple Developer Program | **$99/年** | iOS公開に必須。個人名義で登録可 |
| Google Play Developer | **$25（初回のみ買い切り）** | Android公開に必須 |
| Expo (EAS) | 無料枠あり | ビルド待ち時間短縮の有料枠($/月)は任意 |

→ iOS公開はランニング$99/年が発生。**まず Android(買い切り$25)だけ先に出す**のも現実的な戦略。

## 2. アプリの下準備（両OS共通）

- **アプリ名 / bundle identifier**（例 `com.hirokidate.dividendtracker`）を決める（後から変えられないので慎重に）
- **アイコン**（1024×1024）・**スプラッシュ画面**
- **プライバシーポリシー URL**（両ストア必須。GitHub Pages 等で無料公開可）
- **スクリーンショット**（各OS・各画面サイズ規定あり）
- **ストア説明文・キーワード**（ASO＝`07_go_to_market.md` 参照）
- **年齢レーティング**申告
- iOS：**App Tracking Transparency**（広告のトラッキング利用時）

## 3. Android（Google Play）公開手順

1. Play Console でアプリを作成
2. `eas build -p android --profile production` で **AAB** を生成
3. `eas submit -p android` でアップロード（初回は手動アップロードの方が確実な場合あり）
4. ストア掲載情報（説明・画像・分類・データセーフティ申告）を入力
5. **内部テスト → クローズドテスト → 製品版** の順で公開
   - ※新規個人デベロッパーは **20人以上のクローズドテスター×14日間** の要件がある点に注意（Googleの新ポリシー）。早めにテスター集めを始める。
6. 審査（通常数時間〜数日）→ 公開

## 4. iOS（App Store）公開手順

1. App Store Connect でアプリを作成
2. `eas build -p ios --profile production` で **IPA** を生成（証明書・プロビジョニングは EAS が自動管理）
3. `eas submit -p ios` で TestFlight にアップロード
4. **TestFlight** で実機テスト（自分＋数名）
5. ストア掲載情報・スクショ・プライバシー質問票（Nutrition Label）を入力
6. 審査に提出 → 審査（通常1〜3日）→ 公開
   - ※審査は Android より厳しめ。**広告・課金の実装不備、リンク切れ、プライバシー記載漏れ** でリジェクトされやすい。

## 5. バージョンアップ運用

- `app.json` の `version`（表示用）と `buildNumber`/`versionCode`（内部連番）を上げる
- EAS の **OTA更新（expo-updates）** で、JSだけの変更なら審査なしで即時配信できる（ネイティブ変更時は再ビルド必須）
- リリースノートを毎回書く

## 6. 公開前チェックリスト

- [ ] 免責文（投資助言でない旨）をアプリ内とストア説明に記載
- [ ] プライバシーポリシー URL 有効
- [ ] クラッシュしない（実機で一通り操作）
- [ ] ダークモード・小型/大型端末で崩れない
- [ ] （課金導入時）特定商取引法表記・復元ボタン
- [ ] アイコン・スプラッシュ・スクショ全サイズ
