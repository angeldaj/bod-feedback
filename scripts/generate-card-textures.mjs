// Genera las texturas de la tarjeta de socio (Bodega Club v2) como WebP en
// public/club/texturas/. Se dibujan con canvas en un Chromium headless para
// que el resultado sea idéntico al prototipo, y se sirven como archivos
// estáticos: el navegador del socio no vuelve a calcularlas.
//
// Uso: node scripts/generate-card-textures.mjs
// Requiere Playwright (ya es devDependency) y Chrome o el Chromium de Playwright.

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const OUT_DIR = path.join(process.cwd(), "public", "club", "texturas");
const IDS = ["clasica", "masa", "trigo", "confluencia", "horno", "mosaico", "temporada"];

// El código de dibujo corre dentro de la página: se mantiene como string para
// no depender del bundler.
const DRAW_SOURCE = String.raw`
const TW = 856, TH = 540;
const L = a => "rgba(255,255,255," + a + ")", D = a => "rgba(0,0,0," + a + ")";
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function grain(c, r, n, a) { for (let i = 0; i < n; i++) { c.fillStyle = r() > .5 ? L(a * r()) : D(a * r()); c.fillRect(r() * TW, r() * TH, 1.6, 1.6); } }
const DRAW = {
  clasica(c, r) {
    c.lineWidth = 1.1;
    [[TW * .95, TH * 1.08, 1], [TW * .06, -TH * .12, 0]].forEach(([cx, cy, s]) => {
      for (let i = 0; i < 44; i++) {
        c.strokeStyle = i % 2 ? L(.2) : D(.08); c.beginPath();
        const rx = 60 + i * 15, ry = 36 + i * 9.5;
        for (let t = 0; t <= Math.PI * 2 + .02; t += .02) {
          const w = 1 + .035 * Math.sin(t * 22 + i * .6 + s);
          const x = cx + Math.cos(t) * rx * w, y = cy + Math.sin(t) * ry * w;
          t ? c.lineTo(x, y) : c.moveTo(x, y);
        }
        c.stroke();
      }
    });
    grain(c, r, 9000, .12);
  },
  masa(c, r) {
    const cells = []; let tries = 0;
    while (cells.length < 300 && tries < 9000) {
      tries++; const rad = 3 + Math.pow(r(), 2.3) * 36, x = r() * TW, y = r() * TH;
      if (cells.some(o => Math.hypot(o.x - x, o.y - y) < o.rad + rad + 4)) continue;
      cells.push({ x, y, rad });
    }
    for (const o of cells) {
      const ry = o.rad * (.55 + r() * .35);
      c.save(); c.translate(o.x, o.y); c.rotate((r() - .5) * .7);
      const g = c.createRadialGradient(0, -ry * .35, 0, 0, 0, o.rad);
      g.addColorStop(0, D(.34)); g.addColorStop(1, D(.07));
      c.fillStyle = g; c.beginPath(); c.ellipse(0, 0, o.rad, ry, 0, 0, Math.PI * 2); c.fill();
      c.strokeStyle = L(.42); c.lineWidth = 1.3; c.beginPath(); c.ellipse(0, 0, o.rad, ry, 0, .12 * Math.PI, .88 * Math.PI); c.stroke();
      c.restore();
    }
    grain(c, r, 7000, .1);
  },
  trigo(c, r) {
    c.lineCap = "round";
    for (let row = -1; row < TH / 78 + 2; row++) for (let col = -1; col < TW / 64 + 2; col++) {
      const x = col * 64 + (row % 2) * 32, y = row * 78;
      c.save(); c.translate(x, y); c.rotate(-.42 + (r() - .5) * .12);
      c.strokeStyle = L(.34); c.lineWidth = 1.2; c.beginPath(); c.moveTo(0, 44); c.quadraticCurveTo(3, 12, 0, -30); c.stroke();
      for (let k = 0; k < 5; k++) {
        const yy = -26 + k * 9.5;
        for (const s of [-1, 1]) {
          c.save(); c.translate(s * 2.8, yy); c.rotate(s * .5);
          c.fillStyle = D(.14); c.beginPath(); c.ellipse(1, 1.2, 2.7, 5.4, 0, 0, Math.PI * 2); c.fill();
          c.fillStyle = L(.4); c.beginPath(); c.ellipse(0, 0, 2.7, 5.4, 0, 0, Math.PI * 2); c.fill();
          c.restore();
        }
      }
      c.fillStyle = L(.4); c.beginPath(); c.ellipse(0, -32, 2.2, 4.6, 0, 0, Math.PI * 2); c.fill();
      c.restore();
    }
  },
  confluencia(c) {
    const N = 30, mid = TH * .56; c.lineWidth = 2.4;
    for (const side of [0, 1]) for (let i = 0; i < N; i++) {
      const f = i / (N - 1);
      const y0 = side ? TH * .45 + f * TH * .85 : -TH * .3 + f * TH * .85;
      const yEnd = mid + (side ? 5 + f * 78 : -83 + f * 78);
      c.strokeStyle = side ? D(.1 + .16 * f) : L(.14 + .28 * (1 - f));
      c.beginPath();
      for (let x = -10; x <= TW + 10; x += 6) {
        const t = Math.max(0, Math.min(1, x / TW)), e = t * t * (3 - 2 * t);
        const y = y0 + (yEnd - y0) * e + Math.sin(x * .011 + i * .42 + side * 2) * (10 * (1 - e) + 1.5);
        x === -10 ? c.moveTo(x, y) : c.lineTo(x, y);
      }
      c.stroke();
    }
  },
  horno(c, r) {
    const g = c.createRadialGradient(TW * .5, TH * 1.2, 20, TW * .5, TH * 1.2, TH * 1.15);
    g.addColorStop(0, L(.42)); g.addColorStop(1, L(0)); c.fillStyle = g; c.fillRect(0, 0, TW, TH);
    for (let i = 0; i < 30; i++) {
      const y = TH - i * 19, amp = 2 + i * .95;
      c.strokeStyle = L(.08 + .013 * (30 - i)); c.lineWidth = 1.5; c.beginPath();
      for (let x = 0; x <= TW; x += 5) { const yy = y + Math.sin(x * .018 + i * .9) * amp + Math.sin(x * .047 + i) * amp * .35; x ? c.lineTo(x, yy) : c.moveTo(x, yy); }
      c.stroke();
    }
    for (let i = 0; i < 130; i++) { const x = r() * TW, y = TH - Math.pow(r(), 2) * TH * .6, s = .6 + r() * 2.3; c.fillStyle = L(.25 + r() * .5); c.beginPath(); c.arc(x, y, s, 0, Math.PI * 2); c.fill(); }
  },
  mosaico(c) {
    const S = 108;
    for (let y = 0; y < TH + S; y += S) for (let x = 0; x < TW + S; x += S) {
      c.save(); c.translate(x, y);
      c.strokeStyle = L(.3); c.lineWidth = 1.4; c.strokeRect(0, 0, S, S);
      const corners = [[0, 0], [S, 0], [0, S], [S, S]];
      c.fillStyle = D(.11); corners.forEach(([cx, cy]) => { c.beginPath(); c.moveTo(cx, cy); c.arc(cx, cy, S * .32, 0, Math.PI * 2); c.fill(); });
      c.strokeStyle = L(.36); corners.forEach(([cx, cy]) => { c.beginPath(); c.arc(cx, cy, S * .23, 0, Math.PI * 2); c.stroke(); });
      c.beginPath(); c.moveTo(S / 2, S * .2); c.lineTo(S * .8, S / 2); c.lineTo(S / 2, S * .8); c.lineTo(S * .2, S / 2); c.closePath();
      c.fillStyle = L(.16); c.fill(); c.stroke();
      c.beginPath(); c.arc(S / 2, S / 2, S * .08, 0, Math.PI * 2); c.fillStyle = D(.18); c.fill();
      c.restore();
    }
  },
  temporada(c, r) {
    const star = (x, y, s, a, rot) => { c.save(); c.translate(x, y); c.rotate(rot); c.fillStyle = L(a); c.beginPath(); for (let k = 0; k < 16; k++) { const rr = k % 2 ? s * .38 : s, t = k * Math.PI / 8; c.lineTo(Math.cos(t) * rr, Math.sin(t) * rr); } c.closePath(); c.fill(); c.restore(); };
    for (let i = 0; i < 70; i++) star(r() * TW, r() * TH, 4 + Math.pow(r(), 3) * 28, .16 + r() * .32, r() * Math.PI);
    for (let i = 0; i < 320; i++) { c.fillStyle = L(.2 + r() * .35); c.fillRect(r() * TW, r() * TH, 1.6, 1.6); }
  },
};
window.renderTexture = (id) => {
  const cv = document.createElement("canvas"); cv.width = TW; cv.height = TH;
  DRAW[id](cv.getContext("2d"), rng(id.length * 7919 + 17));
  return cv.toDataURL("image/webp", 0.86);
};
`;

async function launch() {
  try {
    return await chromium.launch({ channel: "chrome" });
  } catch {
    return await chromium.launch();
  }
}

const browser = await launch();
try {
  const page = await browser.newPage();
  await page.setContent("<!doctype html><html><body></body></html>");
  await page.addScriptTag({ content: DRAW_SOURCE });
  await mkdir(OUT_DIR, { recursive: true });
  for (const id of IDS) {
    const dataUrl = await page.evaluate((textureId) => window.renderTexture(textureId), id);
    const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
    const file = path.join(OUT_DIR, `${id}.webp`);
    await writeFile(file, Buffer.from(base64, "base64"));
    console.log(`✓ ${path.relative(process.cwd(), file)}`);
  }
} finally {
  await browser.close();
}
