// Renders the PWA icons from one SVG source. Run: node scripts/generate-icons.mjs
import { mkdir, writeFile } from "node:fs/promises";
import sharp from "sharp";

const PRIMARY = "#4f46e5";

// Lightbulb mark, drawn on a 512 grid. `inset` shrinks it for maskable icons,
// whose outer ~20% may be cropped by the OS.
function svg({ inset, rounded }) {
  const scale = (512 - inset * 2) / 512;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="${rounded ? 112 : 0}" fill="${PRIMARY}"/>
  <g transform="translate(${inset} ${inset}) scale(${scale})" fill="none" stroke="#fff" stroke-width="28" stroke-linecap="round" stroke-linejoin="round">
    <path d="M200 372h112M216 412h80"/>
    <path d="M176 316c-26-22-40-52-40-84 0-66 54-112 120-112s120 46 120 112c0 32-14 62-40 84-12 10-20 24-22 40h-116c-2-16-10-30-22-40z"/>
  </g>
</svg>`;
}

const targets = [
  { file: "icon-192.png", size: 192, inset: 0, rounded: true },
  { file: "icon-512.png", size: 512, inset: 0, rounded: true },
  { file: "icon-maskable-512.png", size: 512, inset: 80, rounded: false },
  { file: "apple-touch-icon.png", size: 180, inset: 0, rounded: false },
];

await mkdir("public/icons", { recursive: true });

for (const { file, size, inset, rounded } of targets) {
  await sharp(Buffer.from(svg({ inset, rounded })))
    .resize(size, size)
    .png()
    .toFile(`public/icons/${file}`);
}

await writeFile("public/icons/icon.svg", svg({ inset: 0, rounded: true }));
console.log("Icons written to public/icons");
