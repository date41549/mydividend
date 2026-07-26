// calc.ts などの純粋ロジックの単体テスト用。RN/Expo に依存しないので node 環境で回す。
// 変換は babel-jest（純JS）を jest 内スコープの babel 設定で使う。
// ※ ネイティブ依存（@swc 等）を入れないことで、EASのLinuxビルドで npm ci が壊れる問題を回避する。
// ※ babel.config.js は置かない（Metro/アプリのbabelに影響させないため、ここに閉じ込める）。
module.exports = {
  testEnvironment: "node",
  transform: {
    "^.+\\.(t|j)sx?$": [
      "babel-jest",
      {
        babelrc: false,
        configFile: false,
        presets: [
          ["@babel/preset-env", { targets: { node: "current" } }],
          "@babel/preset-typescript",
        ],
      },
    ],
  },
  testMatch: ["**/__tests__/**/*.test.ts"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
};
