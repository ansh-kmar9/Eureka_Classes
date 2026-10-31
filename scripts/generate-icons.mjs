// Builds every icon from the one master artwork, public/icons/eureka_icon.png (transparent background).
// Run: node scripts/generate-icons.mjs
import { mkdir } from "node:fs/promises";
import sharp from "sharp";

const MASTER = "public/icons/eureka_icon.png";

// Deep violet tile the transparent mark sits on, so launcher icons are never see-through.
const tile = (size, rounded) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <radialGradient id="g" cx="50%" cy="38%" r="75%">
      <stop offset="0" stop-color="#3b1d8f"/>
      <stop offset="1" stop-color="#0a0420"/>
    </radialGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${rounded ? Math.round(size * 0.22) : 0}" fill="url(#g)"/>
</svg>`;

// Crop the empty border once so every size frames the mark the same way.
const mark = await sharp(MASTER).trim().toBuffer();

async function onTile({ out, size, fill, rounded }) {
  const box = Math.round(size * fill);
  const art = await sharp(mark).resize(box, box, { fit: "inside" }).toBuffer();
  await sharp(Buffer.from(tile(size, rounded)))
    .composite([{ input: art, gravity: "centre" }])
    .png()
    .toFile(out);
}

await mkdir("public/icons", { recursive: true });

// `fill` is how much of the tile the mark covers. Maskable icons keep to the middle, because
// the OS may crop the outer ~20% into a circle or squircle.
const targets = [
  { out: "public/icons/icon-192.png", size: 192, fill: 0.72, rounded: true },
  { out: "public/icons/icon-512.png", size: 512, fill: 0.72, rounded: true },
  { out: "public/icons/icon-maskable-512.png", size: 512, fill: 0.58, rounded: false },
  { out: "public/icons/apple-touch-icon.png", size: 180, fill: 0.74, rounded: false },
  { out: "src/app/apple-icon.png", size: 180, fill: 0.74, rounded: false },
  { out: "src/app/icon.png", size: 256, fill: 0.72, rounded: true },
];
for (const target of targets) await onTile(target);

// The mark alone, small, for the in-app logo and loader (the master is far too heavy to ship).
await sharp(mark).resize(160, 160, { fit: "inside" }).png({ compressionLevel: 9 }).toFile("public/icons/logo-mark.png");

console.log("Icons written");
