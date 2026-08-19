# 公開作業チェックリスト（伊達さん用）

コードは完成済み。ここから先の「アカウント・ビルド・テスター・ストア」を順番にやるための手順。
細かい背景は [05_release_process.md](05_release_process.md)、掲載文は [store_listing.md](store_listing.md)。

> **現在地（2026-08-19）：両ストア公開完了 🎉 このチェックリストは役目を終えた。**
> - **Android＝Google Play 一般公開中**（v1.0.1 / versionCode 2・2026-08-19 14:04 公開・176か国配信）
> - **iOS＝App Store 一般公開中**（v1.0.0 / build 1）
> - LP（`site/index.html`）の Google Play ボタンも実URLへ差し替え済み。
> - ※12人×14日のテスト要件は**アカウント単位・初回のみ**なので、2本目以降のアプリでは不要（＝この関門は突破済み）。
> **次にやることは公開作業ではなく運用**：FB3/FB2b の OTA 配信 → ASO一次最適化 → レビュー導線（→ [09_roadmap.md](09_roadmap.md) の v1.0.x）。

## 事前の方針決め
- **どのストアに出す？**
  - **Android(Google Play)**：登録$25買い切り・安い。ただし新規個人アカウントは**12人×14日テスト**の関門あり。
  - **iOS(App Store)**：登録$99/年。テスト関門は無く速い。**日本の20〜30代はiPhone7〜8割**＝ターゲット到達はiOSの方が大きい。
  - → 迷うなら「iOSを先に出す＋Androidのテストを裏で並行」。安さ最優先ならAndroidのみ。

---

## Phase 0：アカウント・環境（半日）
- [x] Expoアカウント作成（無料）→ `npm i -g eas-cli` → `eas login`
- [x] プロジェクト作成：アプリのフォルダで `eas init`（`app.json` に projectId が自動で入る）
- [x] ストア開発者登録
  - [x] Google Play Developer（$25・買い切り）※Android出すなら
  - [x] Apple Developer Program（$99/年）※iOS出すなら
- [x] **プライバシーポリシーを公開URL化**（[privacy_policy.md](privacy_policy.md) をGitHub Pages等で公開＋連絡先メール記入）

## Phase 1：実機で動作確認（1日）
- [x] `eas build -p android --profile preview`（APK生成）→ 自分のAndroid実機に入れて一通り触る
  - [x] 銘柄の追加・編集・削除（CRUD）が正しく動く
  - [x] ダークモード・小さめ/大きめ端末で崩れない
  - [x] スプラッシュ・アイコンが出る
- [x] 気になる不具合があればメモ → 直す（私に投げてOK）

## Phase 2：Androidテスター集め（★早めに並行開始・合計2〜3週間）
※Android出す場合。iOSのみなら不要。
- [x] Play Consoleでアプリ作成 → **クローズドテスト**トラックにAAB（`eas build -p android --profile production`）をアップロード
- [x] テスター用の **Google Group** を作り、テスターに指定
- [x] **12人（余裕みて15人）**集める：
  - [x] Discord「Androidクローズドテスト攻略組」で相互テスト（まず数本テストして貸しを作る）
  - [x] Xで募集（`#Androidクローズドテスト` ＋「クローズドテスト」検索で相互声がけ）
  - [x] 身内2〜3人（iPhoneはNG・別端末は別Googleアカウント）
- [x] **14日連続**キープ（抜けて12未満にしない）→ テスト中にひとことフィードバックを集めておく
- [x] 14日経過後、**本番アクセスを申請**（「何をテストして何を直したか」に答える）→ **2026-08 審査通過**

## Phase 3：ストア掲載情報（半日）
- [x] [store_listing.md](store_listing.md) から貼る：アプリ名・サブタイトル・キーワード・簡単な説明・詳細説明・リリースノート
- [x] **スクショ撮影**（ライトモードが映える。iOS 6.7"=1290×2796 / Android 縦1080px以上）→ 上にキャプション（store_listing の構成案）
- [x] **データ申告**：Android「データセーフティ」/ iOS「プライバシー質問票」＝ **収集なし・端末内保存・外部送信なし・トラッキングなし** で回答
- [x] 年齢レーティング申告

## Phase 4：提出・公開
- [x] iOS：`eas submit -p ios` → TestFlight確認 → 審査提出（1〜3日）→ **一般公開中**（v1.0.0 / build 1）
- [x] Android：本番アクセス承認 → 製品版トラックへ v1.0.1 / versionCode 2 の AAB を**昇格**（再アップ不可＝同じ versionCode は使えないので「ライブラリから追加」or「リリースを昇格」）→ 審査 → **2026-08-19 14:04 公開**
- [x] Android 公開後：LP（`site/index.html`）の Google Play ボタンを実URL（`https://play.google.com/store/apps/details?id=com.datz.mydividend`）へ差し替え → Cloudflare Pages に反映
- [x] 公開🎉

## OTA（expo-updates）※導入済み（2026-07-30）
- **設定済み**：`updates.url` / `runtimeVersion`(policy=appVersion) / eas.json の channel（production/preview/development）。v1.0.1 以降のビルドが対象。
- **JSのみの修正の配信手順**：`eas update --channel production --message "説明"` → v1.0.1 以降を入れた端末が次回起動時に自動取得（審査なし）。
- **ネイティブ変更（新ライブラリ・app.json のネイティブ設定・SDK上げ）は OTA 不可** → 新AAB/IPA を作り直してストアへ。app.json の `version` を上げると runtimeVersion も変わり、旧ビルドはそのOTA対象外になる（＝ネイティブ変更時は version を上げる、JSのみは据え置き）。

## 公開後（v1.2〜）
- [ ] 反応・レビューを見る
- [ ] 広告(AdMob)・課金(RevenueCat)・深掘り分析の有料化を検討（要EAS Dev Build・ネイティブ再ビルド）

---

### つまずいたら私にできること
- ビルドエラー・app.json/eas.jsonの調整・権限まわり
- スクショのキャプション文・追加のストア文言
- v1.2機能（分析・広告・課金）の実装
- 実機で見つかった不具合の修正
