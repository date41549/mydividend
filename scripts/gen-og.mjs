// OGP画像（SNS共有カード 1200×630）を生成して site/og.png に出力。
// 実行: npm i sharp --no-save してから node scripts/gen-og.mjs
// ※ sharp は依存に常設しない（EASビルドを壊すため）。生成時だけ一時的に入れる。
import sharp from "sharp";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "site", "og.png");

const JP = "'Yu Gothic', 'YuGothic', 'Meiryo', 'MS PGothic', 'Noto Sans CJK JP', sans-serif";

// 白の「¥コイン」（リング＋¥）。中心(cx,cy)・半径r。
function coin(cx, cy, r) {
  const s = r / 340; // 元は1024キャンバスのr=338設計をスケール
  const t = (x, y) => `${cx + (x - 512) * s} ${cy + (y - 512) * s}`;
  return `
    <g fill="none" stroke="#ffffff" stroke-linecap="round" stroke-linejoin="round" stroke-width="${58 * s}">
      <circle cx="${cx}" cy="${cy}" r="${338 * s}" stroke-width="${58 * s}"/>
      <path d="M ${t(372,366)} L ${t(512,506)}"/>
      <path d="M ${t(652,366)} L ${t(512,506)}"/>
      <path d="M ${t(512,506)} L ${t(512,686)}"/>
      <path d="M ${t(398,556)} L ${t(626,556)}"/>
      <path d="M ${t(398,611)} L ${t(626,611)}"/>
    </g>`;
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#00c24a"/>
      <stop offset="1" stop-color="#00a33c"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#g)"/>
  <text x="92" y="212" fill="rgba(255,255,255,0.88)" font-family="${JP}" font-size="30" font-weight="700" letter-spacing="4">DIVIDEND · 配当管理アプリ</text>
  <text x="86" y="330" fill="#ffffff" font-family="${JP}" font-size="120" font-weight="800" letter-spacing="-2">マイ配当</text>
  <text x="92" y="410" fill="#ffffff" font-family="${JP}" font-size="40" font-weight="700">年間の配当が、ひと目でわかる。</text>
  <text x="92" y="470" fill="rgba(255,255,255,0.9)" font-family="${JP}" font-size="26" font-weight="600">高配当・NISA・利回りを、連携なしでシンプルに。</text>
  ${coin(980, 315, 200)}
</svg>`;

await sharp(Buffer.from(svg)).png().toFile(out);
console.log("generated site/og.png (1200x630)");
