import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Glow } from './Particles';
import { signTexture } from './textures';
import { prefersReducedMotion } from '../state';

const BUNTING = ['#e7ad43', '#b87975', '#2d775b', '#f4e8d1', '#6a9b97', '#c8503d'];

const wireY = (x, base, sag = 0.7) => base - sag * (1 - (x / 6.7) ** 2);

function Wire({ z, y = 6.4, sag = 0.7, bunting = false }) {
  const curve = useMemo(() => {
    const pts = [];
    for (let i = 0; i <= 24; i++) {
      const x = -6.7 + (13.4 * i) / 24;
      pts.push(new THREE.Vector3(x, wireY(x, y, sag), z));
    }
    return new THREE.CatmullRomCurve3(pts);
  }, [z, y, sag]);
  const flags = useRef([]);
  const count = 20;
  useFrame(({ clock }) => {
    if (!bunting || prefersReducedMotion()) return;
    const t = clock.elapsedTime;
    flags.current.forEach((f, i) => { if (f) f.rotation.x = Math.sin(t * 1.1 + i * 0.7) * 0.12; });
  });
  const tri = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-0.17, 0, 0, 0.17, 0, 0, 0, -0.44, 0]), 3));
    g.computeVertexNormals();
    return g;
  }, []);
  return (
    <group>
      <mesh>
        <tubeGeometry args={[curve, 40, 0.014, 5, false]} />
        <meshStandardMaterial color="#14141a" roughness={0.6} />
      </mesh>
      {bunting && Array.from({ length: count }).map((_, i) => {
        const x = -6 + (12 * (i + 0.5)) / count;
        return (
          <group key={i} position={[x, wireY(x, y, sag) - 0.01, z]} ref={(n) => (flags.current[i] = n)}>
            <mesh geometry={tri}>
              <meshStandardMaterial color={BUNTING[i % BUNTING.length]} side={THREE.DoubleSide} roughness={0.9} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

export function Wires() {
  return (
    <group>
      <Wire z={9.2} y={6.6} />
      <Wire z={-1.6} y={6.9} sag={0.8} bunting />
      <Wire z={2.4} y={6.4} sag={0.9} />
      <Wire z={-14.8} y={6.5} bunting />
    </group>
  );
}

/** Caged bulb hanging from the wire over the chai counter. */
export function HangingBulb({ position }) {
  const [x, y, z] = position;
  const top = wireY(x, 6.4, 0.9);
  return (
    <group>
      <mesh position={[x, (top + y) / 2, z]}>
        <cylinderGeometry args={[0.012, 0.012, top - y, 4]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      <mesh position={[x, y, z]}>
        <sphereGeometry args={[0.13, 14, 12]} />
        <meshBasicMaterial color="#fff0cf" toneMapped={false} />
      </mesh>
      <mesh position={[x, y + 0.2, z]}>
        <cylinderGeometry args={[0.06, 0.06, 0.12, 8]} />
        <meshStandardMaterial color="#1c1c20" metalness={0.5} />
      </mesh>
      <Glow position={[x, y, z]} color="#ffa94d" size={2.6} opacity={0.6} />
    </group>
  );
}

function Crate({ position, rotY = 0, size = [0.62, 0.42, 0.46], color = '#8a6642' }) {
  return (
    <group position={position} rotation-y={rotY}>
      <mesh position={[0, size[1] / 2, 0]}>
        <boxGeometry args={size} />
        <meshStandardMaterial color={color} roughness={0.85} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[0, size[1] / 2, (s * size[2]) / 2]}>
          <boxGeometry args={[size[0] + 0.02, size[1] * 0.18, 0.025]} />
          <meshStandardMaterial color="#5c4328" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

function Matka({ position }) {
  const geo = useMemo(() => {
    const p = [[0, 0], [0.16, 0.0], [0.28, 0.12], [0.34, 0.3], [0.3, 0.5], [0.18, 0.62], [0.2, 0.68], [0.0, 0.68]].map(([x, y]) => new THREE.Vector2(x, y));
    return new THREE.LatheGeometry(p, 16);
  }, []);
  return (
    <group position={position}>
      <mesh geometry={geo}>
        <meshStandardMaterial color="#a8553a" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.7, 0]}>
        <cylinderGeometry args={[0.21, 0.24, 0.05, 14]} />
        <meshStandardMaterial color="#8a4630" roughness={0.9} />
      </mesh>
    </group>
  );
}

function Plant({ position, scale = 1 }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.24, 0.17, 0.4, 12]} />
        <meshStandardMaterial color="#b4603f" roughness={0.9} />
      </mesh>
      {[[0, 0.62, 0, 0.28], [0.14, 0.5, 0.1, 0.2], [-0.13, 0.52, -0.08, 0.22], [0.02, 0.8, -0.04, 0.18], [-0.1, 0.72, 0.12, 0.17]].map(([x, y, z, r], i) => (
        <mesh key={i} position={[x, y, z]}>
          <icosahedronGeometry args={[r, 1]} />
          <meshStandardMaterial color={i % 2 ? '#3f7a45' : '#2f6a3c'} roughness={0.95} flatShading />
        </mesh>
      ))}
    </group>
  );
}

function MenuBoard({ position, rotY }) {
  const tex = useMemo(
    () => signTexture({
      w: 256, h: 340, bg: '#26302c', border: '#f4e8d1', seed: 9,
      lines: [
        { text: 'आज की चाय', font: '700 56px Mukta, sans-serif', color: '#f4e8d1', y: 90 },
        { text: 'CHAI · KADAK', font: '600 54px Teko, sans-serif', color: '#e7ad43', y: 170 },
        { text: 'CUTTING · MASALA', font: '600 40px Teko, sans-serif', color: '#f4e8d1', y: 230 },
      ],
    }),
    [],
  );
  return (
    <group position={position} rotation-y={rotY}>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[0, 0.5, s * 0.16]} rotation-x={s * 0.2}>
          <boxGeometry args={[0.62, 1.02, 0.04]} />
          <meshStandardMaterial map={s > 0 ? tex : undefined} color={s > 0 ? '#ffffff' : '#6b4a2e'} roughness={0.85} />
        </mesh>
      ))}
    </group>
  );
}

/** Wooden counter legs for the old PC (the supplied model is only the tabletop and machines). */
export function PcCounter({ height }) {
  const wood = '#6e4631';
  return (
    <group>
      {[[-1.12, -0.42], [1.12, -0.42], [-1.12, 0.42], [1.12, 0.42]].map(([x, z], i) => (
        <mesh key={i} position={[x, -0.06 - height / 2, z]}>
          <boxGeometry args={[0.1, height, 0.1]} />
          <meshStandardMaterial color={wood} roughness={0.85} />
        </mesh>
      ))}
      <mesh position={[0, -0.06 - height * 0.72, 0]}>
        <boxGeometry args={[2.2, 0.05, 0.9]} />
        <meshStandardMaterial color={wood} roughness={0.85} />
      </mesh>
      <mesh position={[0, -0.06 - height * 0.5, -0.44]}>
        <boxGeometry args={[2.2, height * 0.9, 0.04]} />
        <meshStandardMaterial color="#5a3826" roughness={0.9} />
      </mesh>
    </group>
  );
}

export function Stool({ position, color = '#c8503d' }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.48, 0]}>
        <cylinderGeometry args={[0.24, 0.22, 0.07, 14]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[Math.cos((i * 2 * Math.PI) / 3) * 0.14, 0.24, Math.sin((i * 2 * Math.PI) / 3) * 0.14]} rotation={[Math.sin((i * 2 * Math.PI) / 3) * 0.12, 0, -Math.cos((i * 2 * Math.PI) / 3) * 0.12]}>
          <cylinderGeometry args={[0.025, 0.03, 0.48, 6]} />
          <meshStandardMaterial color="#2a2a30" metalness={0.5} roughness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

/** Wall-mounted caged light for the tea nook. */
function WallLight({ position, color = '#ffb65e' }) {
  return (
    <group position={position}>
      <mesh rotation-z={Math.PI / 2} position={[0.12, 0, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 0.4, 6]} />
        <meshStandardMaterial color="#1c1c20" metalness={0.5} />
      </mesh>
      <mesh position={[-0.12, 0, 0]}>
        <sphereGeometry args={[0.1, 12, 10]} />
        <meshBasicMaterial color="#fff0cf" toneMapped={false} />
      </mesh>
      <Glow position={[-0.12, 0, 0]} color={color} size={2.2} opacity={0.55} />
    </group>
  );
}

export function StreetProps() {
  return (
    <group>
      {/* around the chai stall */}
      <Crate position={[6.15, 0, 4.3]} rotY={0.1} />
      <Crate position={[6.2, 0.42, 4.3]} rotY={-0.15} size={[0.55, 0.38, 0.42]} color="#9a7249" />
      <Crate position={[6.05, 0, 5.1]} rotY={0.3} size={[0.5, 0.4, 0.4]} />
      <Matka position={[6.3, 0, -1.2]} />
      <MenuBoard position={[1.1, 0, 3.7]} rotY={0.45} />
      {/* doorsteps */}
      <Plant position={[-6.25, 0, 8.2]} />
      <Plant position={[-6.3, 0, 1.7]} scale={0.9} />
      <Plant position={[6.35, 0, 10.2]} />
      <Plant position={[6.3, 0, -9.7]} scale={0.85} />
      <Plant position={[-6.2, 0, -13.3]} scale={1.1} />
      {/* tea nook */}
      <WallLight position={[8.7, 2.9, -11.6]} />
      <WallLight position={[-8.75, 3.0, -4.7]} color="#8fffc4" />
      {/* a couple of extra crates by the café */}
      <Crate position={[-6.5, 0, -8.6]} rotY={0.4} color="#7d5b3a" />
    </group>
  );
}
