import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { BoxBatch, BoxCollector } from './Batches';
import { plasterTexture, pavingTexture, rng, skyTexture, glowTexture } from './textures';
import { STREET, PALETTE } from '../sceneLayout';
import { prefersReducedMotion } from '../state';

const W = STREET.walk;
const GROUND_H = 3.2; // height of the shopfront storey
const FLOOR_H = 2.7;

const WALL_COLORS = {
  pink: '#c98a84',
  sandstone: '#d9bb95',
  ochre: '#d1a45a',
  turquoise: '#7fb0a8',
  cream: '#ecdcc0',
};
const SHUTTER = ['#3f8a86', '#2f7a5c', '#7a4a3a', '#3f8a86'];
const TRIM = '#efe0c4';

/* Left side z-ranges (from near → far). cyber café recess is z ∈ [-1.4, -8.0] */
const LEFT = [
  { z0: 19, z1: 14.4, H: 8.4, color: 'pink', d: 0 },
  { z0: 14.4, z1: 10.2, H: 6.6, color: 'sandstone', d: -0.35 },
  { z0: 10.2, z1: 6.2, H: 7.8, color: 'ochre', d: 0.2 },
  { z0: 6.2, z1: 1.6, H: 6.4, color: 'turquoise', d: -0.2 },
  { z0: 1.6, z1: -1.4, H: 5.6, color: 'sandstone', d: 0.25 },
  { recess: true, z0: -1.4, z1: -8.0, H: 7.4, color: 'pink' },
  { z0: -8.0, z1: -12.6, H: 7.2, color: 'sandstone', d: -0.2 },
  { z0: -12.6, z1: -17.2, H: 8.8, color: 'pink', d: 0.15 },
  { z0: -17.2, z1: -22.2, H: 6.8, color: 'ochre', d: -0.3 },
  { z0: -22.2, z1: -27.4, H: 8.0, color: 'turquoise', d: 0.1 },
];
/* Right side. Tea-nook recess is z ∈ [-9.0, -14.4] */
const RIGHT = [
  { z0: 19, z1: 14.6, H: 7.4, color: 'sandstone', d: 0.1 },
  { z0: 14.6, z1: 10.0, H: 8.8, color: 'pink', d: -0.3 },
  { z0: 10.0, z1: 5.6, H: 6.4, color: 'ochre', d: 0.15 },
  { z0: 5.6, z1: -1.2, H: 6.2, color: 'turquoise', d: 0, shop: 'chai' },
  { z0: -1.2, z1: -9.0, H: 7.8, color: 'pink', d: -0.15 },
  { recess: true, z0: -9.0, z1: -14.4, H: 7.0, color: 'sandstone' },
  { z0: -14.4, z1: -19.2, H: 8.2, color: 'pink', d: 0.2 },
  { z0: -19.2, z1: -23.4, H: 6.6, color: 'sandstone', d: -0.2 },
  { z0: -23.4, z1: -27.4, H: 7.8, color: 'ochre', d: 0 },
];

const wallMats = {};
function wallMaterial(colorKey, seed) {
  const key = `${colorKey}-${seed % 4}`;
  if (!wallMats[key]) {
    wallMats[key] = new THREE.MeshStandardMaterial({
      color: WALL_COLORS[colorKey] ?? colorKey,
      map: plasterTexture((seed % 4) + 1),
      roughness: 0.96,
      metalness: 0,
    });
  }
  return wallMats[key];
}

function buildStreet() {
  const solid = new BoxCollector(); // trim, steps, columns (stone)
  const wood = new BoxCollector();
  const shutters = new BoxCollector();
  const dark = new BoxCollector(); // dark openings
  const lit = new BoxCollector(); // glowing panes (static)
  const blink = new BoxCollector(); // panes that occasionally change
  const bodies = []; // plaster boxes

  const R = rng(42);

  const addBuilding = (s, spec, idx) => {
    const { z0, z1, H, color, d = 0, recess, shop } = spec;
    const len = z0 - z1 - 0.04;
    const zc = (z0 + z1) / 2;
    const fx = s * (W + d); // facade plane
    const D = 7;
    const inward = -s; // direction pointing to street centre
    const seed = idx + (s > 0 ? 7 : 0);

    if (recess) {
      const wallX = s * 8.9;
      // upper block sits on the arcade
      bodies.push({ pos: [(fx + s * D / 2), GROUND_H + (H - GROUND_H) / 2, zc], size: [D, H - GROUND_H, len], color, seed });
      // solid mass behind the recess
      const bx0 = Math.abs(wallX), bx1 = W + d + D;
      bodies.push({ pos: [s * (bx0 + bx1) / 2, GROUND_H / 2, zc], size: [bx1 - bx0, GROUND_H, len], color, seed: seed + 1 });
      // side walls of the recess
      [z0 - 0.15, z1 + 0.15].forEach((z) => {
        bodies.push({ pos: [s * (Math.abs(fx) + bx0) / 2, GROUND_H / 2, z], size: [bx0 - Math.abs(fx), GROUND_H, 0.3], color, seed: seed + 2 });
      });
      // columns + beam
      [z0 - 0.5, z1 + 0.5, zc].forEach((z, i) => {
        solid.box('stone', [fx - s * 0.1, GROUND_H / 2, z], [0.42, GROUND_H, 0.42], TRIM);
        solid.box('stone', [fx - s * 0.1, 0.18, z], [0.62, 0.36, 0.62], '#c9b08a');
        solid.box('stone', [fx - s * 0.1, GROUND_H - 0.2, z], [0.7, 0.4, 0.7], '#c9b08a');
      });
      solid.box('stone', [fx - s * 0.1, GROUND_H - 0.1, zc], [0.5, 0.3, len], '#c9b08a');
      // back wall: dark interior + half-open shutter
      dark.box('dark', [wallX - s * 0.02, 1.4, zc], [0.1, 2.5, len - 1.0], '#150f0d');
      shutters.box('shutter', [wallX + inward * 0.12, 2.35, zc], [0.1, 0.55, len - 1.0], '#6c7378');
      return decorateUpper(s, fx, zc, len, H, GROUND_H, seed, true);
    }

    bodies.push({ pos: [fx + s * D / 2, H / 2, zc], size: [D, H, len], color, seed });

    // ── ground-floor shopfronts ──
    const n = Math.max(1, Math.floor(len / 2.4));
    const slot = len / n;
    for (let i = 0; i < n; i++) {
      const zc2 = z0 - 0.02 - slot * (i + 0.5);
      const ow = slot - 0.9;
      const kind = shop === 'chai' ? 'open' : ['open', 'shutter', 'door', 'open'][Math.floor(R() * 4)];
      // frame
      solid.box('stone', [fx + inward * 0.06, 1.35, zc2 - ow / 2 - 0.11], [0.2, 2.7, 0.22], TRIM);
      solid.box('stone', [fx + inward * 0.06, 1.35, zc2 + ow / 2 + 0.11], [0.2, 2.7, 0.22], TRIM);
      solid.box('stone', [fx + inward * 0.06, 2.78, zc2], [0.22, 0.24, ow + 0.46], TRIM);
      solid.box('stone', [fx + inward * 0.12, 0.08, zc2], [0.4, 0.16, ow + 0.4], '#bda27c'); // threshold step
      if (kind === 'door') {
        wood.box('wood', [fx + inward * 0.05, 1.3, zc2], [0.12, 2.5, ow], '#6e4631');
        wood.box('wood', [fx + inward * 0.12, 1.3, zc2], [0.04, 2.2, ow - 0.3], '#7b5139');
      } else {
        dark.box('dark', [fx + inward * 0.04, 1.3, zc2], [0.1, 2.5, ow], '#1b1310');
        if (kind === 'shutter') {
          shutters.box('shutter', [fx + inward * 0.1, 1.2, zc2], [0.1, 2.4, ow], '#6c7378');
        } else {
          // partially raised shutter + goods hint
          shutters.box('shutter', [fx + inward * 0.1, 2.3, zc2], [0.1, 0.45 + R() * 0.4, ow], '#6c7378');
          const warm = R() > 0.35;
          if (warm) lit.box('lit', [fx + s * 0.1, 1.5, zc2], [0.04, 0.5, ow * 0.7], '#e8a550');
        }
      }
      // hanging shop number plate
      solid.box('stone', [fx + inward * 0.1, 2.52, zc2 + ow / 2 - 0.1], [0.04, 0.22, 0.34], '#2e5a73');
    }

    // a cornice dividing shopfront from the floors above
    solid.box('stone', [fx + inward * 0.12, GROUND_H, zc], [0.34, 0.2, len + 0.1], TRIM);

    decorateUpper(s, fx, zc, len, H, GROUND_H, seed, false);
  };

  const decorateUpper = (s, fx, zc, len, H, baseY, seed, arcade) => {
    const inward = -s;
    const floors = Math.max(1, Math.floor((H - baseY - 0.4) / FLOOR_H));
    const n = Math.max(1, Math.floor(len / 2.1));
    const slot = len / n;
    for (let f = 0; f < floors; f++) {
      const y = baseY + 0.45 + FLOOR_H * (f + 0.5);
      for (let i = 0; i < n; i++) {
        const z = zc + len / 2 - slot * (i + 0.5);
        const litNow = R() > 0.7;
        solid.box('stone', [fx + inward * 0.08, y, z], [0.18, 1.62, 1.04], TRIM);
        const paneGroup = litNow ? (R() > 0.45 ? 'blink' : 'lit') : 'dark';
        const col = litNow ? (R() > 0.5 ? '#f0b45f' : '#e89a48') : '#10121e';
        (paneGroup === 'blink' ? blink : paneGroup === 'lit' ? lit : dark).box(paneGroup, [fx + inward * 0.17, y, z], [0.06, 1.34, 0.76], col);
        // open shutters on either side
        const sc = SHUTTER[Math.floor(R() * SHUTTER.length)];
        shutters.box('shutter', [fx + inward * 0.2, y, z - 0.66], [0.08, 1.5, 0.3], sc);
        shutters.box('shutter', [fx + inward * 0.2, y, z + 0.66], [0.08, 1.5, 0.3], sc);
        solid.box('stone', [fx + inward * 0.2, y - 0.86, z], [0.34, 0.1, 1.2], TRIM); // sill
        // jharokha-style balcony on the first upper storey, sometimes
        if (f === 0 && !arcade && R() > 0.62) {
          solid.box('stone', [fx + inward * 0.55, y - 0.78, z], [1.05, 0.14, 1.5], '#d9c39d');
          for (let k = -2; k <= 2; k++) solid.box('stone', [fx + inward * 1.0, y - 0.3, z + k * 0.3], [0.05, 0.9, 0.05], '#d9c39d');
          solid.box('stone', [fx + inward * 1.0, y + 0.18, z], [0.08, 0.07, 1.46], '#d9c39d');
          solid.box('stone', [fx + inward * 0.6, y + 1.05, z], [1.2, 0.09, 1.7], '#c4a57a'); // chhajja
        }
      }
    }
    // cornice, parapet and merlons
    solid.box('stone', [fx + inward * 0.14, H - 0.05, zc], [0.4, 0.22, len + 0.12], TRIM);
    solid.box('stone', [fx + s * 0.1, H + 0.35, zc], [0.3, 0.7, len], '#d8c3a0');
    const m = Math.floor(len / 0.9);
    for (let k = 0; k < m; k++) {
      solid.box('stone', [fx + s * 0.1, H + 0.87, zc - len / 2 + 0.45 + k * (len / m)], [0.3, 0.36, 0.4], '#d8c3a0');
    }
  };

  LEFT.forEach((b, i) => addBuilding(-1, b, i));
  RIGHT.forEach((b, i) => addBuilding(1, b, i + 20));

  return { bodies, solid: solid.groups, wood: wood.groups, shutters: shutters.groups, dark: dark.groups, lit: lit.groups, blink: blink.groups };
}

export function Buildings() {
  const data = useMemo(buildStreet, []);
  const blinkRef = useRef();
  const blinkState = useRef(null);

  // Occasionally toggle a handful of distant windows.
  useEffect(() => {
    const items = data.blink.blink ?? [];
    blinkState.current = items.map((it, i) => ({ on: true, next: 3 + (i * 1.7) % 9 }));
  }, [data]);
  useFrame(({ clock }) => {
    const m = blinkRef.current;
    const st = blinkState.current;
    if (!m || !st || prefersReducedMotion()) return;
    const t = clock.elapsedTime;
    const col = new THREE.Color();
    let changed = false;
    st.forEach((s, i) => {
      if (t > s.next) {
        s.on = !s.on;
        s.next = t + 4 + Math.random() * 14;
        col.set(s.on ? '#f0b45f' : '#171a2b');
        m.setColorAt(i, col);
        changed = true;
      }
    });
    if (changed && m.instanceColor) m.instanceColor.needsUpdate = true;
  });

  return (
    <group>
      {data.bodies.map((b, i) => (
        <mesh key={i} position={b.pos} material={wallMaterial(b.color, b.seed)}>
          <boxGeometry args={b.size} />
        </mesh>
      ))}
      {data.solid.stone && (
        <BoxBatch items={data.solid.stone}>
          <meshStandardMaterial roughness={0.92} />
        </BoxBatch>
      )}
      {data.wood.wood && (
        <BoxBatch items={data.wood.wood}>
          <meshStandardMaterial roughness={0.8} />
        </BoxBatch>
      )}
      {data.shutters.shutter && (
        <BoxBatch items={data.shutters.shutter}>
          <meshStandardMaterial roughness={0.7} metalness={0.15} />
        </BoxBatch>
      )}
      {data.dark.dark && (
        <BoxBatch items={data.dark.dark}>
          <meshStandardMaterial roughness={0.4} metalness={0.1} />
        </BoxBatch>
      )}
      {data.lit.lit && (
        <BoxBatch items={data.lit.lit}>
          <meshBasicMaterial toneMapped={false} />
        </BoxBatch>
      )}
      {data.blink.blink && (
        <BoxBatch ref={blinkRef} items={data.blink.blink}>
          <meshBasicMaterial toneMapped={false} />
        </BoxBatch>
      )}
    </group>
  );
}

/** Ground: worn road, flush flagstone pavements, kerb lines. */
export function Ground() {
  const road = useMemo(() => pavingTexture({ base: '#5f5750', joint: '#352f2b', repeat: [4, 13], seed: 11, tile: 5 }), []);
  const walk = useMemo(() => pavingTexture({ base: '#a58f74', joint: '#5b4d3c', repeat: [2.2, 15], seed: 21, tile: 4 }), []);
  const len = STREET.zNear - STREET.zFar;
  const zc = (STREET.zNear + STREET.zFar) / 2;
  const roadW = STREET.halfRoad * 2;
  const walkW = 12 - STREET.halfRoad; // to |x|=12 under buildings
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, zc]}>
        <planeGeometry args={[roadW, len]} />
        <meshStandardMaterial map={road} roughness={0.96} color="#d6cdc4" />
      </mesh>
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh rotation-x={-Math.PI / 2} position={[s * (STREET.halfRoad + walkW / 2), 0.003, zc]}>
            <planeGeometry args={[walkW, len]} />
            <meshStandardMaterial map={walk} roughness={0.95} />
          </mesh>
          {/* kerb */}
          <mesh position={[s * (STREET.halfRoad + 0.06), 0.035, zc]}>
            <boxGeometry args={[0.16, 0.07, len]} />
            <meshStandardMaterial color="#b9a687" roughness={0.9} />
          </mesh>
        </group>
      ))}
      {/* faded centre-line dashes */}
      {Array.from({ length: 12 }).map((_, i) => (
        <mesh key={i} rotation-x={-Math.PI / 2} position={[0, 0.006, 16 - i * 3.8]}>
          <planeGeometry args={[0.11, 1.4]} />
          <meshStandardMaterial color="#9a8f74" roughness={1} transparent opacity={0.45} />
        </mesh>
      ))}
    </group>
  );
}

/** Closing gateway (a Jaipur-style pol), distant skyline and stars. */
export function FarEnd() {
  const gate = useMemo(() => {
    const w = 15, h = 10;
    const s = new THREE.Shape();
    s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(w / 2, h); s.lineTo(-w / 2, h); s.lineTo(-w / 2, 0);
    const hole = new THREE.Path();
    const aw = 2.6, ah = 4.4;
    hole.moveTo(-aw, 0); hole.lineTo(aw, 0); hole.lineTo(aw, ah);
    hole.absarc(0, ah, aw, 0, Math.PI, false);
    hole.lineTo(-aw, 0);
    s.holes.push(hole);
    return new THREE.ExtrudeGeometry(s, { depth: 2.4, bevelEnabled: false });
  }, []);
  const stars = useMemo(() => {
    const r = rng(5);
    const pos = [];
    for (let i = 0; i < 160; i++) {
      const a = r() * Math.PI * 2, e = 0.25 + r() * 1.0, rad = 140;
      pos.push(Math.cos(a) * Math.cos(e) * rad * 0.9, Math.sin(e) * rad * 0.8 + 6, -Math.abs(Math.sin(a)) * Math.cos(e) * rad - 30);
    }
    return new Float32Array(pos);
  }, []);
  const sky = useMemo(() => {
    const r = rng(9);
    return Array.from({ length: 13 }).map((_, i) => ({
      x: -26 + i * 4.4 + r() * 2, h: 5 + r() * 10, w: 3 + r() * 2.4, z: -36 - r() * 8,
      lit: Array.from({ length: 4 }).map(() => [r() - 0.5, r() * 0.8, r() > 0.45]),
    }));
  }, []);
  const glow = useMemo(() => glowTexture(), []);
  const wall = useMemo(() => wallMaterial('pink', 3), []);
  return (
    <group>
      <mesh geometry={gate} position={[0, 0, -29.9]} material={wall} />
      {/* warm city glow beyond the arch */}
      <sprite position={[0, 3.2, -33]} scale={[16, 12, 1]}>
        <spriteMaterial map={glow} color="#ff9c55" transparent opacity={0.65} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} />
      </sprite>
      {sky.map((b, i) => (
        <group key={i} position={[b.x, 0, b.z]}>
          <mesh position={[0, b.h / 2, 0]}>
            <boxGeometry args={[b.w, b.h, 3]} />
            <meshBasicMaterial color="#1a1e38" />
          </mesh>
          {b.lit.map(([ox, oy, on], k) => on && (
            <mesh key={k} position={[ox * b.w * 0.7, 1.5 + oy * (b.h - 2), 1.52]}>
              <planeGeometry args={[0.35, 0.5]} />
              <meshBasicMaterial color="#f3b968" toneMapped={false} />
            </mesh>
          ))}
        </group>
      ))}
      <points frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" array={stars} count={stars.length / 3} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial color="#d8dcff" size={1.4} sizeAttenuation={false} fog={false} transparent opacity={0.7} />
      </points>
    </group>
  );
}

export const useSkyTexture = () => useMemo(() => skyTexture(), []);
export { PALETTE };
