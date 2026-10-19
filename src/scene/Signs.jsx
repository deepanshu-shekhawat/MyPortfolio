import { useMemo } from 'react';
import { signTexture, posterTexture } from './textures';
import { STREET } from '../sceneLayout';

const W = STREET.walk;

const SIGNS = [
  // side, x(face offset from centre), y, z, w, h, hindi, english, bg, border, ink1, ink2
  { s: -1, x: 6.55, y: 3.75, z: 12.2, w: 3.4, h: 0.95, hi: 'गुलाब मिठाई', en: 'GULAB SWEETS', bg: '#9c3d4a', bd: '#f4e8d1', c1: '#f4e8d1', c2: '#e7ad43' },
  { s: -1, x: 6.62, y: 3.7, z: 4.1, w: 2.5, h: 0.85, hi: 'ऑटो स्टैंड', en: 'AUTO STAND', bg: '#e7ad43', bd: '#2d775b', c1: '#2d775b', c2: '#20243A' },
  { s: -1, x: 6.82, y: 3.8, z: -4.7, w: 4.6, h: 1.0, hi: 'साइबर कैफ़े', en: 'CYBER CAFÉ', bg: '#1f4a40', bd: '#e7ad43', c1: '#f4e8d1', c2: '#e7ad43' },
  { s: -1, x: 6.6, y: 3.7, z: -10.3, w: 3.6, h: 0.9, hi: 'मोबाइल रिचार्ज', en: 'MOBILE RECHARGE', bg: '#2e5a73', bd: '#f4e8d1', c1: '#f4e8d1', c2: '#e7ad43' },
  { s: 1, x: 6.8, y: 4.05, z: 1.3, w: 3.7, h: 1.05, hi: 'चाय की टपरी', en: 'CHAI TAPRI', bg: '#2f6f6b', bd: '#e7ad43', c1: '#f4e8d1', c2: '#e7ad43' },
  { s: 1, x: 6.95, y: 3.7, z: 7.8, w: 3.4, h: 0.9, hi: 'शर्मा टेलर्स', en: 'SHARMA TAILORS', bg: '#70452E', bd: '#e7ad43', c1: '#f4e8d1', c2: '#e7ad43' },
  { s: 1, x: 6.62, y: 3.75, z: -5.6, w: 4.2, h: 1.0, hi: 'जयपुर जनरल स्टोर', en: 'JAIPUR GENERAL STORE', bg: '#20243A', bd: '#e7ad43', c1: '#f4e8d1', c2: '#e7ad43' },
  { s: 1, x: 6.8, y: 3.75, z: -11.6, w: 3.4, h: 0.9, hi: 'चाय · कॉफ़ी', en: 'CHAI · COFFEE', bg: '#8a3a2e', bd: '#f4e8d1', c1: '#f4e8d1', c2: '#e7ad43' },
];

function Sign({ spec, index }) {
  const tex = useMemo(() => {
    const H = Math.round(640 * (spec.h / spec.w));
    return signTexture({
      w: 640, h: H, bg: spec.bg, border: spec.bd, seed: index + 2,
      lines: [
        { text: spec.hi, font: `700 ${Math.round(H * 0.34)}px Mukta, sans-serif`, color: spec.c1, y: H * 0.37 },
        { text: spec.en, font: `600 ${Math.round(H * 0.32)}px Teko, sans-serif`, color: spec.c2, y: H * 0.7 },
      ],
    });
  }, [spec, index]);
  const rot = spec.s > 0 ? -Math.PI / 2 : Math.PI / 2;
  const x = spec.s * spec.x;
  return (
    <group position={[x, spec.y, spec.z]} rotation-y={rot}>
      <mesh position={[0, 0, -0.04]}>
        <boxGeometry args={[spec.w + 0.18, spec.h + 0.18, 0.1]} />
        <meshStandardMaterial color="#3a2a20" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0, 0.02]}>
        <planeGeometry args={[spec.w, spec.h]} />
        <meshStandardMaterial map={tex} roughness={0.75} emissiveMap={tex} emissive="#ffffff" emissiveIntensity={0.18} />
      </mesh>
    </group>
  );
}

const POSTERS = [
  // x (signed), y, z, rotY, w, h, title, sub, bg, accent
  { x: -8.35, y: 1.75, z: -6.9, ry: Math.PI / 2, w: 0.8, h: 1.1, t: 'SALE', sub: 'बड़ी छूट', bg: '#e8d9b5', ink: '#5a2d22', ac: '#c8503d', seed: 1 },
  { x: -8.35, y: 1.55, z: -2.3, ry: Math.PI / 2, w: 0.7, h: 1.0, t: 'NET', sub: 'इंटरनेट · प्रिंट', bg: '#d6e0d0', ink: '#1f4a40', ac: '#e7ad43', seed: 2 },
  { x: 8.35, y: 1.8, z: -11.6, ry: -Math.PI / 2, w: 0.85, h: 1.2, t: 'MELA', sub: 'जयपुर मेला', bg: '#f0d9a8', ink: '#6a2c2c', ac: '#2d775b', seed: 3 },
  { x: 8.35, y: 1.7, z: -13.4, ry: -Math.PI / 2, w: 0.6, h: 0.85, t: 'TUITION', sub: 'ट्यूशन', bg: '#d6c9e0', ink: '#2f2a55', ac: '#e7ad43', seed: 4 },
  { x: 6.35, y: 1.9, z: -2.2, ry: -Math.PI / 2, w: 0.75, h: 1.05, t: 'FILM', sub: 'आज रात', bg: '#e9c9c0', ink: '#3a1f2a', ac: '#6a9b97', seed: 5 },
  { x: -6.55, y: 2.0, z: 8.6, ry: Math.PI / 2, w: 0.7, h: 1.0, t: 'OFFER', sub: 'सीमित समय', bg: '#e6dcb8', ink: '#3a3a1f', ac: '#b87975', seed: 6 },
];

function Poster({ p }) {
  const tex = useMemo(
    () => posterTexture({ bg: p.bg, ink: p.ink, accent: p.ac, title: p.t, sub: p.sub, seed: p.seed }),
    [p],
  );
  return (
    <mesh position={[p.x, p.y, p.z]} rotation-y={p.ry}>
      <planeGeometry args={[p.w, p.h]} />
      <meshStandardMaterial map={tex} roughness={0.9} />
    </mesh>
  );
}

export function Signs() {
  return (
    <group>
      {SIGNS.map((s, i) => <Sign key={i} spec={s} index={i} />)}
      {POSTERS.map((p, i) => <Poster key={i} p={p} />)}
    </group>
  );
}

export { W as _W };
