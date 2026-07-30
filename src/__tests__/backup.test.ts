import { describe, test, expect } from "@jest/globals";
import { Holding, Goal, Settings } from "../types";
import { buildBackup, parseBackup, BACKUP_VERSION } from "../backup";

const holdings: Holding[] = [
  {
    id: "a",
    code: "8058",
    name: "三菱商事",
    assetType: "jp_stock",
    shares: 4,
    dividendPerShare: 125,
    price: 5000,
    acquisitionPrice: 2600,
    payoutMonths: [3, 9],
    account: "nisa",
    sector: "卸売業",
  },
  {
    id: "b",
    code: "KO",
    name: "コカ・コーラ",
    assetType: "us_stock",
    shares: 20,
    dividendPerShare: 1.94,
    price: 62,
    payoutMonths: [3, 6, 9, 12],
    account: "specific",
  },
];
const goal: Goal = {
  monthlyDividend: 10000,
  annualDividend: 120000,
  yieldPercent: 4,
  holdingsCount: 50,
  acquisitionTotal: 3000000,
};
const settings: Settings = { fxUsdJpy: 160, notifyDividendMonth: true };

describe("buildBackup", () => {
  test("app/version/exportedAt を含む整形JSONを返す", () => {
    const json = buildBackup(holdings, goal, settings, "2026-07-26T00:00:00.000Z");
    const obj = JSON.parse(json);
    expect(obj.app).toBe("dividend-tracker");
    expect(obj.version).toBe(BACKUP_VERSION);
    expect(obj.exportedAt).toBe("2026-07-26T00:00:00.000Z");
    expect(obj.holdings).toHaveLength(2);
    expect(json).toContain("\n"); // 整形（インデント）されている
  });
});

describe("往復（build → parse）で無損失", () => {
  test("holdings/goal/settings が一致", () => {
    const json = buildBackup(holdings, goal, settings, "2026-07-26T00:00:00.000Z");
    const parsed = parseBackup(json);
    expect(parsed.holdings).toEqual(holdings);
    expect(parsed.goal).toEqual(goal);
    expect(parsed.settings).toEqual(settings);
  });
});

describe("parseBackup: 異常系", () => {
  test("JSONとして壊れていればエラー", () => {
    expect(() => parseBackup("{壊れた")).toThrow(/JSON/);
  });
  test("別アプリのバックアップは弾く", () => {
    expect(() => parseBackup(JSON.stringify({ app: "other", holdings: [] }))).toThrow(/このアプリ/);
  });
  test("holdings が配列でなければエラー", () => {
    expect(() => parseBackup(JSON.stringify({ app: "dividend-tracker", holdings: {} }))).toThrow(
      /holdings/
    );
  });
  test("app フィールドが無くても holdings があれば受け入れる", () => {
    const parsed = parseBackup(JSON.stringify({ holdings: [] }));
    expect(parsed.holdings).toEqual([]);
  });
});

describe("parseBackup: 正規化（欠損・不正値の補完）", () => {
  test("goal/settings 欠損は既定値で補う", () => {
    const parsed = parseBackup(JSON.stringify({ holdings: [] }));
    expect(parsed.goal.monthlyDividend).toBe(10000);
    expect(parsed.settings.fxUsdJpy).toBe(150);
  });

  test("為替が0以下なら既定値に戻す", () => {
    const parsed = parseBackup(JSON.stringify({ holdings: [], settings: { fxUsdJpy: 0 } }));
    expect(parsed.settings.fxUsdJpy).toBe(150);
  });

  test("不正な assetType/account は安全な既定へ、月は1〜12だけ残す", () => {
    const parsed = parseBackup(
      JSON.stringify({
        holdings: [
          { code: "X", name: "壊れ", assetType: "crypto", account: "hoge", payoutMonths: [0, 6, 13, 12] },
        ],
      })
    );
    const h = parsed.holdings[0];
    expect(h.assetType).toBe("jp_stock");
    expect(h.account).toBe("specific");
    expect(h.payoutMonths).toEqual([6, 12]);
    expect(h.shares).toBe(0); // 数値欠損は0
    expect(h.id).toContain("imported-"); // id欠損は生成
  });

  test("id が無い銘柄には一意なフォールバックIDを付ける", () => {
    const parsed = parseBackup(
      JSON.stringify({ holdings: [{ code: "A" }, { code: "B" }] })
    );
    expect(parsed.holdings[0].id).not.toBe(parsed.holdings[1].id);
  });
});
