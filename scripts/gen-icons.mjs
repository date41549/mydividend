// アプリのアイコン／スプラッシュ／ファビコンを1つのブランドマークから生成する。
// マーク＝緑地に白の「¥コイン」（リング＋¥）。ブランド色は theme.ts と揃える。
// 実行: node scripts/gen-icons.mjs  （sharp が必要）
import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const assets = join(root, "assets");
mkdirSync(assets, { recursive: true });

const GREEN = "#00C24A";
const GREEN_DARK = "#00A33C";

// 白（or 指定色）の「¥コイン」マーク。1024キャンバス基準で設計。
function mark(stroke) {
  return `
    <g fill="none" stroke="${stroke}" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="512" cy="512" r="338" stroke-width="60"/>
      <path d="M372 366 L512 506" stroke-width="46"/>
      <path d="M652 366 L512 506" stroke-width="46"/>
      <path d="M512 506 L512 686" stroke-width="46"/>
      <path d="M398 556 L626 556" stroke-width="46"/>
      <path d="M398 611 L626 611" stroke-width="46"/>
    </g>`;
}

// Android アダプティブの安全域（中央~66%）に収めるための縮小版。
function markSafe(stroke) {
  return `<g transform="translate(512 512) scale(0.62) translate(-512 -512)">${mark(stroke)}</g>`;
}

const grad = `
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${GREEN}"/>
      <stop offset="1" stop-color="${GREEN_DARK}"/>
    </linearGradient>
  </defs>`;

function svg(inner) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">${inner}</svg>`;
}

// 生成対象。[ファイル名, SVG, 出力サイズ]
const green = `<rect width="1024" height="1024" fill="url(#g)"/>`;
const targets = [
  ["icon.png", svg(grad + green + mark("#ffffff")), 1024], // iOS/汎用（OSが角を丸める）
  ["favicon.png", svg(grad + green + mark("#ffffff")), 256], // web
  ["splash-icon.png", svg(mark("#ffffff")), 1024], // スプラッシュ（緑地に白マークを中央配置）
  ["android-icon-background.png", svg(grad + green), 1024], // アダプティブ背景（緑）
  ["android-icon-foreground.png", svg(markSafe("#ffffff")), 1024], // アダプティブ前景（白マーク・安全域）
  ["android-icon-monochrome.png", svg(markSafe("#000000")), 1024], // テーマアイコン用シルエット
];

for (const [name, s, size] of targets) {
  const out = join(assets, name);
  await sharp(Buffer.from(s)).resize(size, size).png().toFile(out);
  console.log(`generated ${name} (${size}x${size})`);
}
console.log("done.");
