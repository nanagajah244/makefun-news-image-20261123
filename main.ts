// news-image-20261123 — "Sum up 23 November's world news in one image"
// A deterministic 1024x1024 front page for Monday 23 November 2026.
// Pure Node stdlib: a hand-written 5x7 bitmap font + a zlib PNG encoder.
// No network, no randomness, no clock reads — the same bytes every run.
// Writes ONE image to $MAKEFUN_OUTPUT_DIR/entry.png (default /output).

import * as fs from "node:fs";
import * as path from "node:path";
import * as zlib from "node:zlib";

// ---------------------------------------------------------------- constants
const W = 1024;
const H = 1024;
const PAPER = [247, 242, 231]; // warm newsprint
const CARD = [253, 250, 244]; // tile paper
const INK = [22, 22, 22];
const RED = [178, 34, 34];
const NAVY = [31, 58, 95];
const MUTED = [96, 90, 80];

// ---------------------------------------------------------------- 5x7 font
// Each glyph is 7 rows of 5 bits (bit 4 = leftmost column). Hand-defined
// from the prose brief; no font file is loaded.
const FONT = {
  A: [0x0e, 0x11, 0x11, 0x1f, 0x11, 0x11, 0x11],
  B: [0x1e, 0x11, 0x11, 0x1e, 0x11, 0x11, 0x1e],
  C: [0x0e, 0x11, 0x10, 0x10, 0x10, 0x11, 0x0e],
  D: [0x1e, 0x11, 0x11, 0x11, 0x11, 0x11, 0x1e],
  E: [0x1f, 0x10, 0x10, 0x1e, 0x10, 0x10, 0x1f],
  F: [0x1f, 0x10, 0x10, 0x1e, 0x10, 0x10, 0x10],
  G: [0x0e, 0x11, 0x10, 0x17, 0x11, 0x11, 0x0f],
  H: [0x11, 0x11, 0x11, 0x1f, 0x11, 0x11, 0x11],
  I: [0x0e, 0x04, 0x04, 0x04, 0x04, 0x04, 0x0e],
  J: [0x07, 0x02, 0x02, 0x02, 0x02, 0x12, 0x0c],
  K: [0x11, 0x12, 0x14, 0x18, 0x14, 0x12, 0x11],
  L: [0x10, 0x10, 0x10, 0x10, 0x10, 0x10, 0x1f],
  M: [0x11, 0x1b, 0x15, 0x15, 0x11, 0x11, 0x11],
  N: [0x11, 0x19, 0x15, 0x13, 0x11, 0x11, 0x11],
  O: [0x0e, 0x11, 0x11, 0x11, 0x11, 0x11, 0x0e],
  P: [0x1e, 0x11, 0x11, 0x1e, 0x10, 0x10, 0x10],
  Q: [0x0e, 0x11, 0x11, 0x11, 0x15, 0x12, 0x0d],
  R: [0x1e, 0x11, 0x11, 0x1e, 0x14, 0x12, 0x11],
  S: [0x0f, 0x10, 0x10, 0x0e, 0x01, 0x01, 0x1e],
  T: [0x1f, 0x04, 0x04, 0x04, 0x04, 0x04, 0x04],
  U: [0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x0e],
  V: [0x11, 0x11, 0x11, 0x11, 0x11, 0x0a, 0x04],
  W: [0x11, 0x11, 0x11, 0x15, 0x15, 0x1b, 0x11],
  X: [0x11, 0x11, 0x0a, 0x04, 0x0a, 0x11, 0x11],
  Y: [0x11, 0x11, 0x0a, 0x04, 0x04, 0x04, 0x04],
  Z: [0x1f, 0x01, 0x02, 0x04, 0x08, 0x10, 0x1f],
  a: [0x00, 0x00, 0x0e, 0x01, 0x0f, 0x11, 0x0f],
  b: [0x10, 0x10, 0x16, 0x19, 0x11, 0x11, 0x1e],
  c: [0x00, 0x00, 0x0e, 0x11, 0x10, 0x11, 0x0e],
  d: [0x01, 0x01, 0x0d, 0x13, 0x11, 0x11, 0x0f],
  e: [0x00, 0x00, 0x0e, 0x11, 0x1f, 0x10, 0x0e],
  f: [0x06, 0x08, 0x08, 0x1e, 0x08, 0x08, 0x08],
  g: [0x00, 0x0f, 0x11, 0x11, 0x0f, 0x01, 0x0e],
  h: [0x10, 0x10, 0x16, 0x19, 0x11, 0x11, 0x11],
  i: [0x04, 0x00, 0x0c, 0x04, 0x04, 0x04, 0x0e],
  j: [0x02, 0x00, 0x06, 0x02, 0x02, 0x12, 0x0c],
  k: [0x10, 0x10, 0x12, 0x14, 0x18, 0x14, 0x12],
  l: [0x0c, 0x04, 0x04, 0x04, 0x04, 0x04, 0x0e],
  m: [0x00, 0x00, 0x1a, 0x15, 0x15, 0x15, 0x15],
  n: [0x00, 0x00, 0x16, 0x19, 0x11, 0x11, 0x11],
  o: [0x00, 0x00, 0x0e, 0x11, 0x11, 0x11, 0x0e],
  p: [0x00, 0x00, 0x1e, 0x11, 0x1e, 0x10, 0x10],
  q: [0x00, 0x00, 0x0d, 0x13, 0x0f, 0x01, 0x01],
  r: [0x00, 0x00, 0x16, 0x19, 0x10, 0x10, 0x10],
  s: [0x00, 0x00, 0x0f, 0x10, 0x0e, 0x01, 0x1e],
  t: [0x08, 0x08, 0x1e, 0x08, 0x08, 0x09, 0x06],
  u: [0x00, 0x00, 0x11, 0x11, 0x11, 0x13, 0x0d],
  v: [0x00, 0x00, 0x11, 0x11, 0x11, 0x0a, 0x04],
  w: [0x00, 0x00, 0x11, 0x11, 0x15, 0x15, 0x1b],
  x: [0x00, 0x00, 0x11, 0x0a, 0x04, 0x0a, 0x11],
  y: [0x00, 0x00, 0x11, 0x11, 0x0f, 0x01, 0x0e],
  z: [0x00, 0x00, 0x1f, 0x02, 0x04, 0x08, 0x1f],
  "0": [0x0e, 0x11, 0x13, 0x15, 0x19, 0x11, 0x0e],
  "1": [0x04, 0x0c, 0x04, 0x04, 0x04, 0x04, 0x0e],
  "2": [0x0e, 0x11, 0x01, 0x06, 0x08, 0x10, 0x1f],
  "3": [0x1f, 0x02, 0x04, 0x02, 0x01, 0x11, 0x0e],
  "4": [0x02, 0x06, 0x0a, 0x12, 0x1f, 0x02, 0x02],
  "5": [0x1f, 0x10, 0x1e, 0x01, 0x01, 0x11, 0x0e],
  "6": [0x06, 0x08, 0x10, 0x1e, 0x11, 0x11, 0x0e],
  "7": [0x1f, 0x01, 0x02, 0x04, 0x08, 0x08, 0x08],
  "8": [0x0e, 0x11, 0x11, 0x0e, 0x11, 0x11, 0x0e],
  "9": [0x0e, 0x11, 0x11, 0x0f, 0x01, 0x02, 0x0c],
  " ": [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],
  ".": [0x00, 0x00, 0x00, 0x00, 0x00, 0x0c, 0x0c],
  ",": [0x00, 0x00, 0x00, 0x00, 0x0c, 0x04, 0x08],
  ":": [0x00, 0x0c, 0x0c, 0x00, 0x0c, 0x0c, 0x00],
  ";": [0x00, 0x0c, 0x0c, 0x00, 0x0c, 0x04, 0x08],
  "!": [0x04, 0x04, 0x04, 0x04, 0x04, 0x00, 0x04],
  "?": [0x0e, 0x11, 0x01, 0x02, 0x04, 0x00, 0x04],
  "-": [0x00, 0x00, 0x00, 0x0e, 0x00, 0x00, 0x00],
  "'": [0x04, 0x04, 0x08, 0x00, 0x00, 0x00, 0x00],
  '"': [0x0a, 0x0a, 0x0a, 0x00, 0x00, 0x00, 0x00],
  "(": [0x02, 0x04, 0x08, 0x08, 0x08, 0x04, 0x02],
  ")": [0x08, 0x04, 0x02, 0x02, 0x02, 0x04, 0x08],
  "/": [0x01, 0x01, 0x02, 0x04, 0x08, 0x10, 0x10],
  "%": [0x19, 0x19, 0x02, 0x04, 0x08, 0x13, 0x13],
  $: [0x04, 0x0f, 0x14, 0x0e, 0x05, 0x1e, 0x04],
  "&": [0x0c, 0x12, 0x14, 0x08, 0x15, 0x12, 0x0d],
  "+": [0x00, 0x04, 0x04, 0x1f, 0x04, 0x04, 0x00],
  "=": [0x00, 0x00, 0x1f, 0x00, 0x1f, 0x00, 0x00],
  "|": [0x04, 0x04, 0x04, 0x04, 0x04, 0x04, 0x04],
};

// ---------------------------------------------------------------- pixel canvas
const px = new Uint8Array(W * H * 3);
function fillAll(c) {
  for (let i = 0; i < W * H; i++) {
    px[i * 3] = c[0];
    px[i * 3 + 1] = c[1];
    px[i * 3 + 2] = c[2];
  }
}
function setPix(x, y, c) {
  if (x < 0 || x >= W || y < 0 || y >= H) return;
  const i = (y * W + x) * 3;
  px[i] = c[0];
  px[i + 1] = c[1];
  px[i + 2] = c[2];
}
function fillRect(x, y, w, h, c) {
  for (let yy = y; yy < y + h; yy++)
    for (let xx = x; xx < x + w; xx++) setPix(xx, yy, c);
}
function hline(x, y, w, t, c) {
  fillRect(x, y, w, t, c);
}
function vline(x, y, h, t, c) {
  fillRect(x, y, t, h, c);
}

// ---------------------------------------------------------------- text
function adv(scale) {
  return 6 * scale - 1; // 1px tighter than the 6-unit cell
}
function textW(s, scale) {
  return s.length * adv(scale);
}
function drawChar(x, y, ch, scale, c) {
  const g = FONT[ch] || FONT["?"];
  for (let r = 0; r < 7; r++) {
    const row = g[r];
    for (let col = 0; col < 5; col++) {
      if (row & (1 << (4 - col))) {
        fillRect(x + col * scale, y + r * scale, scale, scale, c);
      }
    }
  }
}
function drawText(x, y, s, scale, c) {
  for (let i = 0; i < s.length; i++) {
    drawChar(x + i * adv(scale), y, s[i], scale, c);
  }
}
function drawTextCentered(cx, y, s, scale, c) {
  drawText(Math.round(cx - textW(s, scale) / 2), y, s, scale, c);
}
// Greedy word wrap; returns the lines actually drawn.
function drawWrapped(x, y, s, maxW, scale, c, lineH) {
  const words = s.split(" ");
  const lines = [];
  let cur = "";
  for (const w of words) {
    const test = cur === "" ? w : cur + " " + w;
    if (textW(test, scale) <= maxW || cur === "") {
      cur = test;
    } else {
      lines.push(cur);
      cur = w;
    }
  }
  if (cur !== "") lines.push(cur);
  lines.forEach((ln, i) => drawText(x, y + i * lineH, ln, scale, c));
  return lines.length;
}
// Headline: first word in red, rest in ink; wrapped to maxW.
function drawHeadline(x, y, s, maxW, scale, lineH) {
  const firstSpace = s.indexOf(" ");
  const first = firstSpace === -1 ? s : s.slice(0, firstSpace);
  const rest = firstSpace === -1 ? "" : s.slice(firstSpace + 1);
  // Wrap the whole headline, then re-draw with the first word red.
  const words = s.split(" ");
  const lines = [];
  let cur = "";
  for (const w of words) {
    const test = cur === "" ? w : cur + " " + w;
    if (textW(test, scale) <= maxW || cur === "") cur = test;
    else {
      lines.push(cur);
      cur = w;
    }
  }
  if (cur !== "") lines.push(cur);
  lines.forEach((ln, i) => {
    let cx = x;
    if (i === 0) {
      drawText(cx, y, first, scale, RED);
      cx += textW(first + " ", scale);
      const tail = ln.slice(first.length + 1);
      if (tail) drawText(cx, y, tail, scale, INK);
    } else {
      drawText(cx, y + i * lineH, ln, scale, INK);
    }
  });
  return lines.length;
}

// ---------------------------------------------------------------- PNG encoder
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++)
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, "ascii");
  data.copy(out, 8);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type, "ascii"), data])), 0);
  crc.copy(out, 8 + data.length);
  return out;
}
function encodePNG() {
  const raw = Buffer.alloc((1 + W * 3) * H);
  for (let y = 0; y < H; y++) {
    raw[y * (1 + W * 3)] = 0; // filter: none
    raw.set(px.subarray(y * W * 3, (y + 1) * W * 3), y * (1 + W * 3) + 1);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ---------------------------------------------------------------- the news
// Verified from AP, Reuters, Xinhua, Dow Jones, ESA, Al Jazeera and other
// outlets reporting Monday 23 November 2026 (see build-report.md).
const LEAD = {
  kicker: "CLIMATE - COP31, ANTALYA, TURKIYE",
  head1: "COP31 ENDS WITH NO CLIMATE DEAL",
  head2: "AS NATIONS SPLIT OVER FOSSIL FUELS",
  detail:
    "After almost 48 hours of overtime talks, the UN climate summit closed without an overarching agreement. The EU refused any text without fossil-fuel phase-out language.",
};

const TILES = [
  { head: "UKRAINE SINKS RUSSIAN WARSHIP", detail: "Naval drones sank the corvette Merkury at Benghazi." },
  { head: "DEMOCRATS CLINCH 258 HOUSE SEATS", detail: "Largest majority since 1992; won by 330 votes." },
  { head: "RUSSIAN STRIKES KILL 11 AROUND KYIV", detail: "153 drones fired overnight; 134 shot down, Ukraine says." },
  { head: "FACTORY FIRE KILLS 24 IN INDONESIA", detail: "Blaze at a Banten candy factory; about 30 people missing." },
  { head: "FBI PROBES HACK OF CRIME DATABASE", detail: "Apparent breach of the NCIC crime database." },
  { head: "MEXICO CAPTURES 'EL CHAPO ISIDRO'", detail: "Fugitive Fausto Isidro Meza Flores seized in Sinaloa." },
  { head: "NVIDIA BRINGS BACK JENSEN HUANG", detail: "Board reinstates CEO; shares surge about 30%." },
  { head: "TRUMP WARNS IRAN OVER NEW YEAR", detail: "'Inclined' to resume conflict if no deal is reached." },
  { head: "EU PLANS 22ND RUSSIA SANCTIONS PACK", detail: "Von der Leyen proposes curbs on banks and crypto." },
  { head: "US SANCTIONS IRAN SHADOW BANKING", detail: "Treasury hits more than two dozen Iranian entities." },
  { head: "US BLACKLISTS AI FIRM MEGASPEED", detail: "Nvidia partner accused of diverting AI chips to China." },
  { head: "BEPICOLOMBO REACHES MERCURY", detail: "ESA craft enters orbit after an eight-year journey." },
  { head: "AI PROOF OF RIEMANN HYPOTHESIS", detail: "Two groups verify an AI-assisted proof, Anthropic says." },
  { head: "NASDAQ FUTURES BOUNCE AFTER ROUT", detail: "Futures rise about 3% after the worst week since 2020." },
  { head: "LIVERPOOL ROUT MAN UTD 4-0", detail: "Pochettino's debut ends in a rout; Yoro sent off early." },
  { head: "SKUBAL SIGNS RECORD $450M METS DEAL", detail: "Nine-year deal is the largest ever for a pitcher." },
  { head: "POLAND: RUSSIAN MISSILE DEBRIS FOUND", detail: "Kh-101 debris at three sites; NATO sends jets." },
  { head: "DELTA DELAYS 1,000+ ATLANTA FLIGHTS", detail: "Technical failure hits Atlanta flight operations." },
];

const TIMELINE = [
  { time: "02:37", text: "ESA flags BepiColombo software caveat before Mercury entry." },
  { time: "06:00", text: "Ukraine says 134 of 153 Russian drones were shot down overnight." },
  { time: "09:12", text: "Ukraine claims naval drones hit a Russian warship at Benghazi." },
  { time: "12:36", text: "Trump signs order limiting what Congress can demand from agencies." },
  { time: "14:24", text: "Nvidia board unanimously reinstates Jensen Huang as CEO." },
  { time: "15:49", text: "AP: Democrats clinch 258 House seats, most since 1992." },
];

const FOOTER = [
  "WORLD IN NUMBERS: 258 House seats - biggest Democratic majority since 1992",
  "153 drones fired at Ukraine, 134 downed - 24 killed in Indonesia factory fire",
  "$450M record deal for Skubal - +30% Nvidia - 1,000+ Delta flights delayed",
  "Sources: AP, Reuters, Xinhua, Dow Jones, ESA, Al Jazeera",
];

// ---------------------------------------------------------------- layout
function draw() {
  fillAll(PAPER);

  // Outer frame
  fillRect(8, 8, W - 16, 3, INK);
  fillRect(8, H - 11, W - 16, 3, INK);
  fillRect(8, 8, 3, H - 16, INK);
  fillRect(W - 11, 8, 3, H - 16, INK);

  // ---- masthead
  drawTextCentered(W / 2, 22, "THE WORLD IN ONE DAY", 2, RED);
  drawTextCentered(W / 2, 44, "MONDAY 23 NOVEMBER 2026", 6, INK);
  drawTextCentered(W / 2, 96, "THE DAY'S WORLD NEWS IN ONE IMAGE - ALL TIMES UTC", 2, MUTED);
  hline(24, 116, W - 48, 4, RED);
  hline(24, 122, W - 48, 2, INK);

  // ---- lead story (left column)
  const LX = 24;
  const LW = 736;
  drawText(LX, 134, LEAD.kicker, 2, RED);
  drawText(LX, 156, LEAD.head1, 3, INK);
  drawText(LX, 181, LEAD.head2, 3, INK);
  drawWrapped(LX, 212, LEAD.detail, LW - 16, 2, INK, 17);
  hline(LX, 290, LW, 2, INK);

  // ---- story tiles: 3 columns x 6 rows
  const tileW = 238;
  const tileH = 96;
  const gapX = 10;
  const gapY = 8;
  const startY = 304;
  TILES.forEach((t, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = LX + col * (tileW + gapX);
    const y = startY + row * (tileH + gapY);
    fillRect(x, y, tileW, tileH, CARD);
    // card border
    hline(x, y, tileW, 1, INK);
    hline(x, y + tileH - 1, tileW, 1, INK);
    vline(x, y, tileH, 1, INK);
    vline(x + tileW - 1, y, tileH, 1, INK);
    drawHeadline(x + 8, y + 6, t.head, tileW - 16, 2, 17);
    drawWrapped(x + 8, y + 43, t.detail, tileW - 16, 2, NAVY, 17);
  });

  // ---- UTC timeline (right column)
  const TX = 772;
  const TW = 228;
  vline(764, 128, 800, 2, INK);
  drawText(TX, 134, "THE DAY IN UTC", 2, INK);
  hline(TX, 154, TW, 3, RED);
  TIMELINE.forEach((item, i) => {
    const y = 168 + i * 122;
    fillRect(TX, y + 2, 8, 8, RED);
    drawText(TX + 14, y, item.time, 2, RED);
    drawWrapped(TX, y + 20, item.text, TW - 8, 2, INK, 17);
  });
  drawText(TX, 896, "ALL TIMES UTC.", 2, MUTED);

  // ---- footer
  hline(24, 934, W - 48, 2, INK);
  FOOTER.forEach((line, i) => {
    drawText(24, 944 + i * 17, line, 2, i === 3 ? MUTED : INK);
  });
}

// ---------------------------------------------------------------- main
function main() {
  const outDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";
  fs.mkdirSync(outDir, { recursive: true }); // mkdir only — never rmSync
  draw();
  const png = encodePNG();
  fs.writeFileSync(path.join(outDir, "entry.png"), png);
}

main();
