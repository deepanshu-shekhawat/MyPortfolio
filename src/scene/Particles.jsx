import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { glowTexture, rng, blobTexture } from './textures';
import { prefersReducedMotion } from '../state';

/** Warm dust motes drifting slowly through the lit part of the street. */
export function Dust({ count = 120 }) {
  const ref = useRef();
  const glow = useMemo(() => glowTexture(), []);
  const { base, positions } = useMemo(() => {
    const r = rng(77);
    const base = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      base[i * 3] = (r() - 0.5) * 13;
      base[i * 3 + 1] = 0.4 + r() * 5;
      base[i * 3 + 2] = 12 - r() * 26;
    }
    return { base, positions: new Float32Array(base) };
  }, [count]);
  useFrame(({ clock }) => {
    if (!ref.current || prefersReducedMotion()) return;
    const t = clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      positions[i * 3] = base[i * 3] + Math.sin(t * 0.07 + i) * 0.5;
      positions[i * 3 + 1] = base[i * 3 + 1] + Math.sin(t * 0.11 + i * 1.7) * 0.35;
      positions[i * 3 + 2] = base[i * 3 + 2] + Math.cos(t * 0.06 + i * 0.6) * 0.5;
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });
  return (
    <points ref={ref} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={positions} count={count} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial map={glow} color="#ffcf8f" size={0.09} transparent opacity={0.4} depthWrite={false} blending={THREE.AdditiveBlending} sizeAttenuation />
    </points>
  );
}

/** Rising steam. Position it as a child of the object that owns the kettle. */
export function Steam({ position = [0, 0, 0], count = 16, height = 1.3, spread = 0.12 }) {
  const ref = useRef();
  const glow = useMemo(() => glowTexture(), []);
  const seeds = useMemo(() => {
    const r = rng(31);
    return Array.from({ length: count }, () => ({ o: r(), sx: (r() - 0.5) * 2, sz: (r() - 0.5) * 2, sp: 0.18 + r() * 0.12 }));
  }, [count]);
  const { positions, colors } = useMemo(() => ({ positions: new Float32Array(count * 3), colors: new Float32Array(count * 3) }), [count]);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = prefersReducedMotion() ? 0 : clock.elapsedTime;
    seeds.forEach((s, i) => {
      const life = (t * s.sp + s.o) % 1;
      positions[i * 3] = s.sx * spread * (0.4 + life) + Math.sin(t * 0.8 + i) * 0.04 * life;
      positions[i * 3 + 1] = life * height;
      positions[i * 3 + 2] = s.sz * spread * (0.4 + life);
      const a = Math.sin(life * Math.PI) * 0.34;
      colors[i * 3] = colors[i * 3 + 1] = colors[i * 3 + 2] = a;
    });
    const g = ref.current.geometry;
    g.attributes.position.needsUpdate = true;
    g.attributes.color.needsUpdate = true;
  });
  return (
    <points ref={ref} position={position} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={positions} count={count} itemSize={3} />
        <bufferAttribute attach="attributes-color" array={colors} count={count} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial map={glow} vertexColors size={0.42} transparent depthWrite={false} blending={THREE.AdditiveBlending} sizeAttenuation />
    </points>
  );
}

/** Additive sprite glow (bulbs, lamps, screens). */
export function Glow({ position = [0, 0, 0], color = '#ffb35c', size = 2, opacity = 0.6, name }) {
  const tex = useMemo(() => glowTexture(), []);
  return (
    <sprite position={position} scale={[size, size, 1]} name={name}>
      <spriteMaterial map={tex} color={color} transparent opacity={opacity} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} />
    </sprite>
  );
}

/** Soft dark blob under an object so it feels grounded. */
export function ContactBlob({ position, size = [3, 3], opacity = 0.7, rotY = 0 }) {
  const tex = useMemo(() => blobTexture(), []);
  return (
    <mesh position={[position[0], 0.012, position[2]]} rotation={[-Math.PI / 2, 0, rotY]} renderOrder={1}>
      <planeGeometry args={size} />
      <meshBasicMaterial map={tex} transparent opacity={opacity} depthWrite={false} />
    </mesh>
  );
}
