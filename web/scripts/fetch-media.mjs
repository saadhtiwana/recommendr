// Reproduces public/media: downloads the Mixkit clips listed below, re-encodes them for the web
// (no audio, 1280x720, H.264 + VP9, poster JPG + AVIF) and extracts the photo stills.
// Requires ffmpeg. Run: pnpm media
// License: Mixkit Stock Video Free License (commercial use, no attribution). Records: public/media/CREDITS.md
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";

const OUT = new URL("../public/media/", import.meta.url).pathname;
const CLIPS = [
  { id: "48714", seconds: 10 },
  { id: "9039", seconds: 10 },
  { id: "48713", seconds: 8 },
  { id: "4385", seconds: 10 },
];
// Stills: [mixkit id, file name, position in seconds]
const STILLS = [
  ["6424", "florist-tablet", 4.4],
  ["21670", "clinic-reception", 2.0],
  ["48713", "agency-team", 2.7],
  ["16073", "salon", 6.9],
  ["50033", "bakery", 6.4],
];

const ff = (...args) => execFileSync("ffmpeg", ["-loglevel", "error", "-y", ...args], { stdio: "inherit" });
const fetchTo = async (url, path) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  writeFileSync(path, Buffer.from(await res.arrayBuffer()));
};
const src = (id) => `https://assets.mixkit.co/videos/${id}/${id}-720.mp4`;
const VF = "scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720";

mkdirSync(`${OUT}video`, { recursive: true });
mkdirSync(`${OUT}photos`, { recursive: true });

for (const { id, seconds } of CLIPS) {
  const raw = `${OUT}video/${id}.src.mp4`;
  await fetchTo(src(id), raw);
  ff("-ss", "0.5", "-t", String(seconds), "-i", raw, "-an", "-vf", `${VF},fps=25`, "-c:v", "libx264", "-preset", "veryfast", "-crf", "28", "-pix_fmt", "yuv420p", "-movflags", "+faststart", `${OUT}video/${id}.mp4`);
  ff("-ss", "0.5", "-t", String(seconds), "-i", raw, "-an", "-vf", `${VF},fps=25`, "-c:v", "libvpx-vp9", "-b:v", "0", "-crf", "38", "-row-mt", "1", "-cpu-used", "4", `${OUT}video/${id}.webm`);
  ff("-ss", "2", "-i", raw, "-frames:v", "1", "-vf", VF, "-q:v", "3", `${OUT}video/${id}-poster.jpg`);
  ff("-i", `${OUT}video/${id}-poster.jpg`, "-c:v", "libsvtav1", "-crf", "34", "-frames:v", "1", `${OUT}video/${id}-poster.avif`);
  rmSync(raw);
  console.log(`video ${id} done`);
}

for (const [id, name, at] of STILLS) {
  const raw = `${OUT}photos/${id}.src.mp4`;
  await fetchTo(src(id), raw);
  ff("-ss", String(at), "-i", raw, "-frames:v", "1", "-vf", "scale='min(1600,iw)':-2", "-q:v", "4", `${OUT}photos/${name}.jpg`);
  rmSync(raw);
  console.log(`photo ${name} done`);
}
