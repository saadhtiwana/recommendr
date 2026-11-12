// Rasterizes the hand-drawn brand SVGs into every PNG/ICO browsers, OSes and social sites need.
// Sources: src/app/icon.svg (favicon tile) and public/brand/og-template.svg.
// Run after editing either: node scripts/gen-brand.mjs
import { Resvg } from "@resvg/resvg-js";
import { readFileSync, writeFileSync } from "node:fs";

const root = new URL("../", import.meta.url);
const png = (svgPath, width) =>
  new Resvg(readFileSync(new URL(svgPath, root), "utf8"), { fitTo: { mode: "width", value: width } }).render().asPng();
const write = (outPath, buf) => {
  writeFileSync(new URL(outPath, root), buf);
  console.log(`${outPath} (${buf.length} bytes)`);
};

// App Router file conventions: app/icon.svg (source), app/apple-icon.png, app/favicon.ico
write("src/app/apple-icon.png", png("src/app/icon.svg", 180));

// favicon.ico for old browsers and crawlers: PNG-compressed entries at 16, 32 and 48px.
// ICO = 6-byte header + 16-byte directory entry per image + the PNG payloads.
const sizes = [16, 32, 48];
const images = sizes.map((s) => png("src/app/icon.svg", s));
const header = Buffer.alloc(6 + 16 * sizes.length);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // type 1 = icon
header.writeUInt16LE(sizes.length, 4);
let offset = header.length;
sizes.forEach((s, i) => {
  const e = 6 + 16 * i;
  header.writeUInt8(s, e); // width (0 would mean 256)
  header.writeUInt8(s, e + 1); // height
  header.writeUInt16LE(1, e + 4); // colour planes
  header.writeUInt16LE(32, e + 6); // bits per pixel
  header.writeUInt32LE(images[i].length, e + 8);
  header.writeUInt32LE(offset, e + 12);
  offset += images[i].length;
});
write("src/app/favicon.ico", Buffer.concat([header, ...images]));

// Web app manifest icons (referenced from src/app/manifest.ts)
write("public/icon-192.png", png("src/app/icon.svg", 192));
write("public/icon-512.png", png("src/app/icon.svg", 512));

// Default Open Graph / Twitter image (referenced from the root layout metadata)
write("public/brand/og-image.png", png("public/brand/og-template.svg", 1200));
