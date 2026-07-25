// calc.ts などの純粋ロジックの単体テスト用。RN/Expo に依存しないので node 環境＋swc で軽量に回す。
module.exports = {
  testEnvironment: "node",
  transform: {
    "^.+\\.(t|j)sx?$": ["@swc/jest"],
  },
  testMatch: ["**/__tests__/**/*.test.ts"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
};
