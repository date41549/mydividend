import { describe, test, expect } from "@jest/globals";
import { Holding, Goal } from "../types";
import {
  TAX_RATE,
  US_WITHHOLDING,
  currency,
  annualDividend,
  afterTaxDividend,
  currentYield,
  yieldOnCost,
  marketValue,
  acquisitionValue,
  unrealizedPL,
  plPercent,
  annualDividendJPY,
  marketValueJPY,
  unrealizedPLJPY,
  totalAnnual,
  totalAnnualAfterTax,
  totalMarketValue,
  totalAcquisition,
  totalUnrealizedPL,
  portfolioYield,
  monthlyDividends,
  accountSummary,
  accountLabel,
  goalProgress,
  cyclicalityBalance,
  portfolioComposition,
  nisaLifetimeUsed,
  NISA_LIFETIME_CAP,
  yocHistogram,
  yen,
  signedYen,
  pct,
  signedPct,
} from "../calc";

// テスト用の Holding を組み立てるヘルパー（必要な項目だけ上書き）。
function h(over: Partial<Holding> = {}): Holding {
  return {
    id: "x",
    code: "0000",
    name: "テスト",
    assetType: "jp_stock",
    shares: 100,
    dividendPerShare: 10,
    price: 200,
    acquisitionPrice: 100,
    payoutMonths: [6, 12],
    account: "specific",
    ...over,
  };
}

// 代表的な銘柄（三菱商事 8058：日本株・卸売業＝景気敏感）
const mitsubishi = h({
  id: "mit",
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
});

// 米国株（KO コカ・コーラ：USD建て・四半期配当）
const coke = h({
  id: "ko",
  code: "KO",
  name: "コカ・コーラ",
  assetType: "us_stock",
  shares: 20,
  dividendPerShare: 1.94,
  price: 62,
  acquisitionPrice: 50,
  payoutMonths: [3, 6, 9, 12],
  account: "specific",
  sector: undefined,
});

describe("1銘柄あたりの計算（通貨建て）", () => {
  test("currency は資産種別から通貨を導出", () => {
    expect(currency(h({ assetType: "jp_stock" }))).toBe("JPY");
    expect(currency(h({ assetType: "us_etf" }))).toBe("USD");
  });

  test("annualDividend = 株数 × 1株配当", () => {
    expect(annualDividend(h({ shares: 4, dividendPerShare: 125 }))).toBe(500);
  });

  test("afterTaxDividend: NISAは非課税、課税口座は20.315%控除（日本資産）", () => {
    expect(afterTaxDividend(h({ shares: 4, dividendPerShare: 125, account: "nisa" }))).toBe(500);
    expect(
      afterTaxDividend(h({ shares: 4, dividendPerShare: 125, account: "specific" }))
    ).toBeCloseTo(500 * (1 - TAX_RATE), 6);
    expect(TAX_RATE).toBeCloseTo(0.20315, 6);
  });

  test("afterTaxDividend: 米国資産は米国源泉10%を先に控除", () => {
    // 米国株・特定：米国源泉10% → 日本20.315%
    const usSpecific = h({ assetType: "us_stock", shares: 10, dividendPerShare: 2, account: "specific" });
    expect(afterTaxDividend(usSpecific)).toBeCloseTo(20 * (1 - US_WITHHOLDING) * (1 - TAX_RATE), 6);
    // 米国株・NISA：日本は非課税でも米国源泉10%は課税される
    const usNisa = h({ assetType: "us_stock", shares: 10, dividendPerShare: 2, account: "nisa" });
    expect(afterTaxDividend(usNisa)).toBeCloseTo(20 * (1 - US_WITHHOLDING), 6);
    // 日本株・NISAは満額（米国源泉なし）
    expect(afterTaxDividend(h({ assetType: "jp_stock", shares: 10, dividendPerShare: 2, account: "nisa" }))).toBe(20);
    expect(US_WITHHOLDING).toBeCloseTo(0.1, 6);
  });

  test("currentYield = 1株配当 ÷ 株価 ×100、株価0以下なら0", () => {
    expect(currentYield(h({ dividendPerShare: 10, price: 200 }))).toBeCloseTo(5, 6);
    expect(currentYield(h({ price: 0 }))).toBe(0);
    expect(currentYield(h({ price: -1 }))).toBe(0);
  });

  test("yieldOnCost（簿価利回り）取得単価が無ければ null", () => {
    expect(yieldOnCost(h({ dividendPerShare: 10, acquisitionPrice: 100 }))).toBeCloseTo(10, 6);
    expect(yieldOnCost(h({ acquisitionPrice: undefined }))).toBeNull();
    expect(yieldOnCost(h({ acquisitionPrice: 0 }))).toBeNull();
  });

  test("marketValue / acquisitionValue", () => {
    expect(marketValue(h({ shares: 4, price: 5000 }))).toBe(20000);
    expect(acquisitionValue(h({ shares: 4, acquisitionPrice: 2600 }))).toBe(10400);
    expect(acquisitionValue(h({ acquisitionPrice: undefined }))).toBeNull();
  });

  test("unrealizedPL / plPercent、取得単価なしは null", () => {
    const g = h({ shares: 4, price: 5000, acquisitionPrice: 2600 }); // 20000 - 10400 = 9600
    expect(unrealizedPL(g)).toBe(9600);
    expect(plPercent(g)).toBeCloseTo((9600 / 10400) * 100, 6);
    expect(unrealizedPL(h({ acquisitionPrice: undefined }))).toBeNull();
    expect(plPercent(h({ acquisitionPrice: undefined }))).toBeNull();
  });

  test("含み損益はマイナスにもなる", () => {
    expect(unrealizedPL(h({ shares: 10, price: 90, acquisitionPrice: 100 }))).toBe(-100);
  });
});

describe("円換算（USDは為替を掛ける）", () => {
  const fx = 150;
  test("annualDividendJPY: JPYはそのまま / USDは ×fx", () => {
    expect(annualDividendJPY(h({ shares: 4, dividendPerShare: 125, assetType: "jp_stock" }), fx)).toBe(500);
    // KO: 20 × 1.94 = 38.8 USD → ×150 = 5820円
    expect(annualDividendJPY(coke, fx)).toBeCloseTo(38.8 * 150, 4);
  });

  test("marketValueJPY / unrealizedPLJPY（USD）", () => {
    expect(marketValueJPY(coke, fx)).toBeCloseTo(20 * 62 * 150, 4); // 1240 USD
    expect(unrealizedPLJPY(coke, fx)).toBeCloseTo((20 * 62 - 20 * 50) * 150, 4); // (1240-1000)×150
  });
});

describe("ポートフォリオ全体（円ベース）", () => {
  const fx = 150;
  const port = [mitsubishi, coke];

  test("totalAnnual = 各銘柄の円換算年間配当の合計", () => {
    const expected = 4 * 125 + 38.8 * 150; // 500 + 5820
    expect(totalAnnual(port, fx)).toBeCloseTo(expected, 4);
  });

  test("totalAnnualAfterTax: NISAは満額、課税は控除", () => {
    const mitsubishiAfter = 500; // NISA・日本株＝満額
    const cokeAfter = 38.8 * 150 * (1 - US_WITHHOLDING) * (1 - TAX_RATE); // 米国・特定＝米国源泉10%→日本課税
    expect(totalAnnualAfterTax(port, fx)).toBeCloseTo(mitsubishiAfter + cokeAfter, 4);
  });

  test("totalMarketValue / totalAcquisition / totalUnrealizedPL", () => {
    const mv = 4 * 5000 + 20 * 62 * 150; // 20000 + 186000
    const acq = 4 * 2600 + 20 * 50 * 150; // 10400 + 150000
    expect(totalMarketValue(port, fx)).toBeCloseTo(mv, 4);
    expect(totalAcquisition(port, fx)).toBeCloseTo(acq, 4);
    expect(totalUnrealizedPL(port, fx)).toBeCloseTo(mv - acq, 4);
  });

  test("portfolioYield = 総年間配当 ÷ 総評価額 ×100、評価額0なら0", () => {
    const y = (totalAnnual(port, fx) / totalMarketValue(port, fx)) * 100;
    expect(portfolioYield(port, fx)).toBeCloseTo(y, 6);
    expect(portfolioYield([], fx)).toBe(0);
  });

  test("空ポートフォリオは全て0", () => {
    expect(totalAnnual([], fx)).toBe(0);
    expect(totalMarketValue([], fx)).toBe(0);
    expect(totalUnrealizedPL([], fx)).toBe(0);
  });
});

describe("月別配当（支払月で等分）", () => {
  const fx = 150;
  test("年2回払いは各月に半額ずつ", () => {
    const m = monthlyDividends([h({ shares: 4, dividendPerShare: 125, payoutMonths: [3, 9] })], fx);
    expect(m[2]).toBeCloseTo(250, 6); // 3月
    expect(m[8]).toBeCloseTo(250, 6); // 9月
    expect(m[0]).toBe(0); // 1月
    expect(m.length).toBe(12);
  });

  test("支払月が空の銘柄はスキップ（合計に載らない）", () => {
    const m = monthlyDividends([h({ payoutMonths: [] })], fx);
    expect(m.reduce((a, b) => a + b, 0)).toBe(0);
  });

  test("四半期払い（USD）は円換算して4等分", () => {
    const m = monthlyDividends([coke], fx);
    const perQ = (38.8 * 150) / 4;
    [2, 5, 8, 11].forEach((i) => expect(m[i]).toBeCloseTo(perQ, 4));
  });
});

describe("口座別サマリー", () => {
  const fx = 150;
  test("保有のある口座だけ、nisa→specific→general の順で返す", () => {
    const rows = accountSummary([mitsubishi, coke], fx);
    expect(rows.map((r) => r.account)).toEqual(["nisa", "specific"]);
    const nisa = rows.find((r) => r.account === "nisa")!;
    expect(nisa.count).toBe(1);
    expect(nisa.annual).toBeCloseTo(500, 4);
    expect(nisa.afterTax).toBeCloseTo(500, 4); // NISAは非課税
  });

  test("accountLabel", () => {
    expect(accountLabel("nisa")).toContain("NISA");
    expect(accountLabel("specific")).toBe("特定口座");
    expect(accountLabel("general")).toBe("一般口座");
  });

  test("nisaLifetimeUsed：NISA口座の簿価だけ合算、上限は1800万", () => {
    // mitsubishi(NISA, 取得 4×2600=10400) / coke(特定, 除外)
    expect(nisaLifetimeUsed([mitsubishi, coke], fx)).toBeCloseTo(10400, 4);
    expect(nisaLifetimeUsed([coke], fx)).toBe(0); // NISA無し
    expect(NISA_LIFETIME_CAP).toBe(18000000);
  });
});

describe("目標 vs 実績", () => {
  const fx = 150;
  const goal: Goal = {
    monthlyDividend: 10000,
    annualDividend: 120000,
    yieldPercent: 4.0,
    holdingsCount: 50,
    acquisitionTotal: 3000000,
  };

  test("5指標を返し、達成率 = 実績 ÷ 目標", () => {
    const rows = goalProgress([mitsubishi, coke], goal, fx);
    expect(rows.map((r) => r.key)).toEqual(["monthly", "annual", "yield", "count", "acq"]);
    const annual = totalAnnual([mitsubishi, coke], fx);
    const annualRow = rows.find((r) => r.key === "annual")!;
    expect(annualRow.actual).toBeCloseTo(annual, 4);
    expect(annualRow.ratio).toBeCloseTo(annual / 120000, 6);
    const countRow = rows.find((r) => r.key === "count")!;
    expect(countRow.actual).toBe(2);
  });

  test("目標0のときは達成率0（ゼロ除算を避ける）", () => {
    const zero: Goal = { ...goal, annualDividend: 0 };
    const rows = goalProgress([mitsubishi], zero, fx);
    expect(rows.find((r) => r.key === "annual")!.ratio).toBe(0);
  });
});

describe("景気感応度バランス（分散の下地）", () => {
  const fx = 150;
  test("業種から defensive/cyclical/unknown を評価額で按分（%合計≒100）", () => {
    // 卸売業＝景気敏感 / 食料品＝ディフェンシブ / sector無し＝unknown
    const cyc = h({ shares: 10, price: 1000, sector: "卸売業" }); // 10000
    const def = h({ shares: 10, price: 1000, sector: "食料品" }); // 10000
    const unk = h({ shares: 10, price: 1000, sector: undefined }); // 10000
    const b = cyclicalityBalance([cyc, def, unk], fx);
    expect(b.cyclical).toBeCloseTo(100 / 3, 4);
    expect(b.defensive).toBeCloseTo(100 / 3, 4);
    expect(b.unknown).toBeCloseTo(100 / 3, 4);
    expect(b.cyclical + b.defensive + b.unknown).toBeCloseTo(100, 6);
  });

  test("空ポートフォリオは全て0", () => {
    expect(cyclicalityBalance([], fx)).toEqual({ defensive: 0, cyclical: 0, unknown: 0 });
  });
});

describe("構成比（ドーナツ用）", () => {
  const fx = 150;
  test("資産種別ごとに円換算評価額で按分・降順・pct合計100", () => {
    const comp = portfolioComposition([mitsubishi, coke], fx, "assetType");
    // 三菱商事(日本株) 4×5000=20000 / KO(米国株) 20×62×150=186000
    expect(comp.map((c) => c.label)).toEqual(["米国株", "日本株"]);
    expect(comp[0].value).toBeCloseTo(186000, 4);
    expect(comp[1].value).toBeCloseTo(20000, 4);
    expect(comp.reduce((s, c) => s + c.pct, 0)).toBeCloseTo(100, 6);
  });

  test("セクター：sector無しは『未分類』にまとまる", () => {
    const comp = portfolioComposition([mitsubishi, coke], fx, "sector");
    const labels = comp.map((c) => c.label);
    expect(labels).toContain("卸売業"); // 三菱商事
    expect(labels).toContain("未分類"); // KOはsector未設定
  });

  test("銘柄モード：各銘柄が1スライス", () => {
    const comp = portfolioComposition([mitsubishi, coke], fx, "holding");
    expect(comp.map((c) => c.label).sort()).toEqual(["コカ・コーラ", "三菱商事"]);
  });

  test("景気感応度モード：業種から自動分類、sector無しは未分類", () => {
    // 三菱商事(卸売業=景気敏感) / coke(sector無し=未分類)
    const comp = portfolioComposition([mitsubishi, coke], fx, "cyclicality");
    const labels = comp.map((c) => c.label);
    expect(labels.some((l) => l.includes("景気敏感"))).toBe(true);
    expect(labels).toContain("未分類");
    // 食料品=ディフェンシブ に集約されること
    const def = h({ id: "d", shares: 1, price: 1000, sector: "食料品" });
    const comp2 = portfolioComposition([mitsubishi, def], fx, "cyclicality");
    expect(comp2.map((c) => c.label).some((l) => l.includes("ディフェンシブ"))).toBe(true);
  });

  test("7件超は上位6＋『その他』に集約", () => {
    const many = Array.from({ length: 9 }, (_, i) =>
      h({ id: `h${i}`, name: `銘柄${i}`, shares: 1, price: (i + 1) * 100, acquisitionPrice: 1 })
    );
    const comp = portfolioComposition(many, fx, "holding");
    expect(comp.length).toBe(7);
    expect(comp[comp.length - 1].label).toBe("その他");
    expect(comp.reduce((s, c) => s + c.pct, 0)).toBeCloseTo(100, 6);
  });

  test("評価額0（株価0）は除外、全0なら空配列", () => {
    expect(portfolioComposition([h({ price: 0 })], fx, "assetType")).toEqual([]);
    expect(portfolioComposition([], fx, "assetType")).toEqual([]);
  });

  test("配当ベース：年間配当で按分（株価0でも配当があれば残る）", () => {
    const comp = portfolioComposition([mitsubishi, coke], fx, "assetType", "dividend");
    // 三菱商事 4×125=500 / KO 20×1.94×150=5820
    expect(comp.map((c) => c.label)).toEqual(["米国株", "日本株"]);
    expect(comp.find((c) => c.label === "日本株")!.value).toBeCloseTo(500, 4);
    expect(comp.find((c) => c.label === "米国株")!.value).toBeCloseTo(5820, 4);
    // 株価0でも配当があれば構成に含まれる（評価額ベースとの違い）
    const noPrice = h({ id: "np", price: 0, shares: 10, dividendPerShare: 5 });
    expect(portfolioComposition([noPrice], fx, "holding", "dividend")).toHaveLength(1);
    expect(portfolioComposition([noPrice], fx, "holding", "value")).toHaveLength(0);
  });
});

describe("簿価利回りヒストグラム", () => {
  test("YOCを利回り帯で数える・取得単価なしは除外", () => {
    // mitsubishi YOC=125/2600*100≈4.81%(4〜5%) / coke 取得単価あり 1.94/50*100≈3.88%(3〜4%)
    const hist = yocHistogram([mitsubishi, coke]);
    expect(hist.map((b) => b.label)).toEqual(["〜2%", "2〜3%", "3〜4%", "4〜5%", "5%〜"]);
    expect(hist[2].count).toBe(1); // coke 3〜4%
    expect(hist[3].count).toBe(1); // 三菱商事 4〜5%
    // 取得単価なしは除外
    const noAcq = h({ id: "na", acquisitionPrice: undefined });
    const hist2 = yocHistogram([noAcq]);
    expect(hist2.reduce((s, b) => s + b.count, 0)).toBe(0);
  });

  test("5%以上は最終バケットに", () => {
    const high = h({ id: "hi", dividendPerShare: 60, acquisitionPrice: 1000 }); // 6%
    expect(yocHistogram([high])[4].count).toBe(1);
  });
});

describe("表示ヘルパー", () => {
  test("yen: 四捨五入＋桁区切り＋円", () => {
    expect(yen(1234567)).toBe("1,234,567円");
    expect(yen(1234.6)).toBe("1,235円");
  });
  test("signedYen: プラスは+、マイナスは-（記号は数値側）", () => {
    expect(signedYen(9600)).toBe("+9,600円");
    expect(signedYen(-100)).toBe("-100円");
    expect(signedYen(0)).toBe("+0円");
  });
  test("pct / signedPct", () => {
    expect(pct(3.0512)).toBe("3.05%");
    expect(pct(5, 0)).toBe("5%");
    expect(signedPct(94.44)).toBe("+94.4%");
    expect(signedPct(-9.02)).toBe("-9.0%");
  });
});
