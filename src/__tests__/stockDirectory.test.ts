import { describe, test, expect } from "@jest/globals";
import { STOCK_DIRECTORY, lookupStock } from "../stockDirectory";
import { SECTOR_CLASSIFICATION } from "../sectorClassification";

describe("stockDirectory", () => {
  test("代表的なコードで銘柄名・業種を引ける", () => {
    expect(lookupStock("8058")).toEqual({ name: "三菱商事", sector: "卸売業" });
    expect(lookupStock("9432")).toEqual({ name: "日本電信電話", sector: "情報・通信" });
    expect(lookupStock("2914")).toEqual({ name: "日本たばこ産業", sector: "食料品" });
  });

  test("前後の空白は無視して引ける", () => {
    expect(lookupStock("  8058 ")).toEqual({ name: "三菱商事", sector: "卸売業" });
  });

  test("未知コード・空文字は undefined", () => {
    expect(lookupStock("0000")).toBeUndefined();
    expect(lookupStock("")).toBeUndefined();
    expect(lookupStock("   ")).toBeUndefined();
  });

  test("ETF/J-REIT は業種なしで名前だけ引ける", () => {
    const etf = lookupStock("1489");
    expect(etf?.name).toContain("高配当");
    expect(etf?.sector).toBeUndefined();
  });

  test("全エントリの sector は東証33業種の分類キーと一致する", () => {
    const validSectors = new Set(Object.keys(SECTOR_CLASSIFICATION));
    for (const [code, entry] of Object.entries(STOCK_DIRECTORY)) {
      expect(entry.name.trim().length).toBeGreaterThan(0); // 空名エントリが無いこと
      if (entry.sector !== undefined) {
        expect(validSectors.has(entry.sector)).toBe(true);
      }
      // コードは辞書のキー＝そのまま lookup できること
      expect(lookupStock(code)).toEqual(entry);
    }
  });
});
