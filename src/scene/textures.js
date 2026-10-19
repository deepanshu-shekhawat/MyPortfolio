import * as THREE from 'three';

export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const canvas = (w, h) => {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return [c, c.getContext('2d')];
};

const finish = (c, { repeat, srgb = true, aniso = 4 } = {}) => {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
  t.anisotropy = aniso;
  return t;
};

/** Soft blotchy plaster with damp streaks near the bottom. Mostly neutral so material colour tints it. */
const plasterCache = new Map();
export function plasterTexture(seed = 1) {
  if (plasterCache.has(seed)) return plasterCache.get(seed);
  const r = rng(seed * 977);
  const [c, g] = canvas(256, 256);
  g.fillStyle = '#e8e8e8'; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 90; i++) {
    const x = r() * 256, y = r() * 256, rad = 14 + r() * 50;
    const gr = g.createRadialGradient(x, y, 0, x, y, rad);
    const dark = r() > 0.5;
    gr.addColorStop(0, dark ? 'rgba(90,70,60,0.10)' : 'rgba(255,255,255,0.12)');
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  // damp streaks rising from the bottom
  for (let i = 0; i < 24; i++) {
    const x = r() * 256, h = 30 + r() * 90, w = 4 + r() * 14;
    const gr = g.createLinearGradient(0, 256, 0, 256 - h);
    gr.addColorStop(0, 'rgba(60,45,40,0.22)'); gr.addColorStop(1, 'rgba(60,45,40,0)');
    g.fillStyle = gr; g.fillRect(x, 256 - h, w, h);
  }
  // fine grain
  const img = g.getImageData(0, 0, 256, 256);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (r() - 0.5) * 16;
    img.data[i] += n; img.data[i + 1] += n; img.data[i + 2] += n;
  }
  g.putImageData(img, 0, 0);
  // a few hairline cracks
  g.strokeStyle = 'rgba(50,40,35,0.35)'; g.lineWidth = 1;
  for (let i = 0; i < 4; i++) {
    let x = r() * 256, y = r() * 256; g.beginPath(); g.moveTo(x, y);
    for (let k = 0; k < 7; k++) { x += (r() - 0.5) * 22; y += r() * 18; g.lineTo(x, y); }
    g.stroke();
  }
  const t = finish(c);
  plasterCache.set(seed, t);
  return t;
}

/** Irregular flagstone paving. */
export function pavingTexture({ base = '#6b625a', joint = '#3d3733', repeat = [3, 16], seed = 4, tile = 6 } = {}) {
  const r = rng(seed);
  const S = 512;
  const [c, g] = canvas(S, S);
  g.fillStyle = base; g.fillRect(0, 0, S, S);
  const n = tile;
  const step = S / n;
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const shade = (r() - 0.5) * 26;
      const col = new THREE.Color(base);
      col.offsetHSL(0, 0, shade / 255);
      g.fillStyle = `#${col.getHexString()}`;
      const ox = (r() - 0.5) * 6, oy = (r() - 0.5) * 6;
      g.fillRect(x * step + 3 + ox, y * step + 3 + oy, step - 6, step - 6);
    }
  }
  const img = g.getImageData(0, 0, S, S);
  for (let i = 0; i < img.data.length; i += 4) {
    const k = (r() - 0.5) * 20;
    img.data[i] += k; img.data[i + 1] += k; img.data[i + 2] += k;
  }
  g.putImageData(img, 0, 0);
  g.strokeStyle = joint; g.lineWidth = 3;
  for (let i = 0; i <= n; i++) {
    g.beginPath(); g.moveTo(0, i * step + (r() - 0.5) * 4); g.lineTo(S, i * step + (r() - 0.5) * 4); g.stroke();
    g.beginPath(); g.moveTo(i * step + (r() - 0.5) * 4, 0); g.lineTo(i * step + (r() - 0.5) * 4, S); g.stroke();
  }
  // wear patches + cracks
  for (let i = 0; i < 22; i++) {
    const x = r() * S, y = r() * S, rad = 20 + r() * 50;
    const gr = g.createRadialGradient(x, y, 0, x, y, rad);
    gr.addColorStop(0, r() > 0.5 ? 'rgba(20,16,12,0.16)' : 'rgba(210,190,160,0.10)');
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  g.strokeStyle = 'rgba(25,20,18,0.55)'; g.lineWidth = 1.2;
  for (let i = 0; i < 6; i++) {
    let x = r() * S, y = r() * S; g.beginPath(); g.moveTo(x, y);
    for (let k = 0; k < 8; k++) { x += (r() - 0.5) * 40; y += (r() - 0.3) * 30; g.lineTo(x, y); }
    g.stroke();
  }
  return finish(c, { repeat, aniso: 8 });
}

/** Radial glow for additive sprites. */
let _glow;
export function glowTexture() {
  if (_glow) return _glow;
  const [c, g] = canvas(128, 128);
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,1)');
  gr.addColorStop(0.25, 'rgba(255,255,255,0.45)');
  gr.addColorStop(0.6, 'rgba(255,255,255,0.1)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  _glow = finish(c, { srgb: false });
  return _glow;
}

/** Dark soft blob used as a cheap contact shadow. */
let _blob;
export function blobTexture() {
  if (_blob) return _blob;
  const [c, g] = canvas(128, 128);
  const gr = g.createRadialGradient(64, 64, 6, 64, 64, 64);
  gr.addColorStop(0, 'rgba(0,0,0,0.85)');
  gr.addColorStop(0.55, 'rgba(0,0,0,0.45)');
  gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  _blob = finish(c, { srgb: false });
  return _blob;
}

/** Vertical indigo → warm horizon gradient used as scene background. */
export function skyTexture() {
  const [c, g] = canvas(8, 512);
  const gr = g.createLinearGradient(0, 0, 0, 512);
  gr.addColorStop(0, '#0d1024');
  gr.addColorStop(0.35, '#1a1f3c');
  gr.addColorStop(0.62, '#2d2f55');
  gr.addColorStop(0.82, '#6a4a5e');
  gr.addColorStop(1, '#c0805f');
  g.fillStyle = gr; g.fillRect(0, 0, 8, 512);
  return finish(c);
}

/**
 * Painted signboard. `lines` = [{ text, font, size, color, y }]
 */
export function signTexture({ w = 512, h = 160, bg, border, lines, wear = true, seed = 3 }) {
  const r = rng(seed);
  const [c, g] = canvas(w, h);
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  g.strokeStyle = border; g.lineWidth = 8; g.strokeRect(10, 10, w - 20, h - 20);
  g.lineWidth = 2; g.strokeRect(22, 22, w - 44, h - 44);
  g.textAlign = 'center'; g.textBaseline = 'middle';
  for (const l of lines) {
    g.font = l.font; g.fillStyle = l.color;
    g.fillText(l.text, w / 2, l.y, w - 60);
  }
  if (wear) {
    const img = g.getImageData(0, 0, w, h);
    for (let i = 0; i < img.data.length; i += 4) {
      const n = (r() - 0.5) * 14; img.data[i] += n; img.data[i + 1] += n; img.data[i + 2] += n;
    }
    g.putImageData(img, 0, 0);
    for (let i = 0; i < 26; i++) {
      g.fillStyle = `rgba(30,20,10,${0.04 + r() * 0.08})`;
      g.beginPath(); g.arc(r() * w, r() * h, 3 + r() * 14, 0, Math.PI * 2); g.fill();
    }
  }
  return finish(c, { aniso: 8 });
}

/** Faded paper poster. */
export function posterTexture({ w = 256, h = 360, bg, ink, accent, title, sub, seed = 7 }) {
  const r = rng(seed);
  const [c, g] = canvas(w, h);
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  g.fillStyle = accent; g.fillRect(0, 0, w, 70); g.fillRect(0, h - 40, w, 40);
  g.fillStyle = ink; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = '700 54px Teko, sans-serif'; g.fillText(title, w / 2, 36, w - 24);
  g.font = '600 26px Mukta, sans-serif'; g.fillText(sub, w / 2, h - 20, w - 24);
  g.fillStyle = ink; g.globalAlpha = 0.7;
  g.beginPath(); g.arc(w / 2, h / 2 - 6, 62, 0, Math.PI * 2); g.fill();
  g.globalAlpha = 1; g.fillStyle = bg; g.beginPath(); g.arc(w / 2, h / 2 - 6, 40, 0, Math.PI * 2); g.fill();
  g.fillStyle = accent; g.beginPath(); g.arc(w / 2, h / 2 - 6, 18, 0, Math.PI * 2); g.fill();
  const img = g.getImageData(0, 0, w, h);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (r() - 0.5) * 22; img.data[i] += n + 8; img.data[i + 1] += n + 6; img.data[i + 2] += n;
  }
  g.putImageData(img, 0, 0);
  // torn edge / wrinkles
  g.strokeStyle = 'rgba(255,255,255,0.18)'; g.lineWidth = 2;
  for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(0, r() * h); g.lineTo(w, r() * h); g.stroke(); }
  return finish(c, { aniso: 8 });
}

export function loadFonts() {
  if (typeof document === 'undefined' || !document.fonts) return Promise.resolve();
  const wanted = [
    ['600 80px Teko', 'ABC'],
    ['700 60px Teko', 'ABC'],
    ['600 40px Mukta', 'चाय'],
    ['700 40px Mukta', 'चाय'],
    ['400 20px Hind', 'ABC'],
    ['500 20px "JetBrains Mono"', 'ABC'],
  ];
  const timeout = new Promise((res) => setTimeout(res, 2500));
  return Promise.race([Promise.all(wanted.map(([f, t]) => document.fonts.load(f, t).catch(() => {}))), timeout]);
}
