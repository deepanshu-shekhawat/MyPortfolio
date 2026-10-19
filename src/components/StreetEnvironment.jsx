import { Suspense, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { StreetObject } from './StreetObject';
import { Buildings, Ground, FarEnd, useSkyTexture } from '../scene/Buildings';
import { Signs } from '../scene/Signs';
import { StreetProps, Wires, HangingBulb, PcCounter, Stool } from '../scene/Props';
import { Dust, Steam, Glow } from '../scene/Particles';
import { BaseLights, PracticalLights, FxDriver } from '../scene/Lights';
import { placements } from '../sceneLayout';
import { useApp, prefersReducedMotion } from '../state';
import { glowTexture } from '../scene/textures';

const PC_SCALE = placements.pc.fit.size / 2.4; // supplied desk is 2.4 m wide
const LAMP_MODEL_URL = `${import.meta.env.BASE_URL}models/street_lamp.glb`.replace('//', '/');

function ArchStreetLamp() {
  const { scene } = useGLTF(LAMP_MODEL_URL);
  const { root, scale, offset } = useMemo(() => {
    const root = scene.clone(true);
    const box = new THREE.Box3().setFromObject(root);
    const size = box.getSize(new THREE.Vector3());
    const scale = placements.lamp.fit.size / size.y;
    const center = box.getCenter(new THREE.Vector3());
    const offset = new THREE.Vector3(-center.x, -box.min.y, -center.z).multiplyScalar(scale);
    return { root, scale, offset };
  }, [scene]);

  return (
    <group position={[-6.3, 0, -23.8]}>
      <group position={offset} scale={scale}>
        <primitive object={root} />
      </group>
      <pointLight position={[0.55, 5.0, 0]} color="#ffbf66" intensity={14} distance={16} decay={2} />
      <Glow position={[0.55, 5.0, 0]} color="#ffb85a" size={3.8} opacity={0.75} />
    </group>
  );
}

/** Sprite glow that brightens on hover (and, optionally, gently varies). */
function HoverGlow({ id, position, color, size, base = 0.4, hover = 0.9, wobble = 0.03 }) {
  const { state, fx } = useApp();
  const tex = useMemo(() => glowTexture(), []);
  const ref = useRef();
  const h = useRef(0);
  const st = useRef(state);
  st.current = state;
  useFrame(({ clock }, dt) => {
    if (!ref.current) return;
    const s = st.current;
    const target = s.hoverId === id || (s.objectId === id && s.phase !== 'street') ? 1 : 0;
    h.current += (target - h.current) * (1 - Math.exp(-8 * dt));
    const w = prefersReducedMotion() ? 0 : Math.sin(clock.elapsedTime * 1.7 + position[0] * 3) * wobble;
    ref.current.opacity = (base + (hover - base) * h.current + w) * Math.max(fx.current.lamps, fx.current.reveal * 0.5);
  });
  return (
    <sprite position={position} scale={[size, size, 1]}>
      <spriteMaterial ref={ref} map={tex} color={color} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} />
    </sprite>
  );
}

function Objects() {
  return (
    <>
      <StreetObject id="auto">
        <HoverGlow id="auto" position={[0, 0.88, 1.5]} color="#ffe9b0" size={1.5} base={0.22} hover={0.9} />
      </StreetObject>

      <StreetObject id="stall">
        {/* steam over the stove / kettle (model-space coordinates) */}
        <Steam position={[-0.9, 1.9, 0]} />
        <HoverGlow id="stall" position={[-0.9, 1.5, 0.1]} color="#ff9a3c" size={1.2} base={0.25} hover={0.5} />
      </StreetObject>

      <StreetObject id="pc">
        <PcCounter height={0.8 / PC_SCALE - 0.01} />
        <Stool position={[-0.85, -(0.8 + 0.06 * PC_SCALE) / PC_SCALE, 1.55]} />
        <HoverGlow id="pc" position={[0, 0.6, 0.6]} color="#7dffc0" size={1.6} base={0.2} hover={0.38} wobble={0.05} />
      </StreetObject>

      <StreetObject id="lamp">
        <HoverGlow id="lamp" position={[1.1, 5.1, 0]} color="#ffb85a" size={4.2} base={0.7} hover={1.0} wobble={0.04} />
      </StreetObject>

      <ArchStreetLamp />
      <StreetObject id="table" />
    </>
  );
}

export function StreetEnvironment() {
  const sky = useSkyTexture();
  return (
    <>
      <primitive object={sky} attach="background" />
      <fog attach="fog" args={['#2c2f55', 16, 64]} />
      <FxDriver />
      <BaseLights />
      <PracticalLights />

      <Ground />
      <Buildings />
      <FarEnd />
      <Signs />
      <StreetProps />
      <Wires />
      <HangingBulb position={placements.stall.light.pos} />
      <Dust />

      <Suspense fallback={null}>
        <Objects />
      </Suspense>
    </>
  );
}
