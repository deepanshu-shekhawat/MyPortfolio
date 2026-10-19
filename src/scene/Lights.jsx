import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useApp, prefersReducedMotion } from '../state';
import { placements } from '../sceneLayout';

const clamp01 = (v) => Math.min(1, Math.max(0, v));

/**
 * Drives the shared `fx` values each frame (intro reveal, lamp ramp, selection dimming).
 */
export function FxDriver() {
  const { state, fx } = useApp();
  const phaseRef = useRef(state.phase);
  phaseRef.current = state.phase;
  useFrame((_, dt) => {
    const f = fx.current;
    const p = phaseRef.current;
    if (p === 'loading') return;
    // Intro reveal is advanced by CameraController (fx.introT). Afterwards stay at 1.
    const introT = f.introT ?? 1;
    f.reveal = clamp01(introT / 0.55);
    f.lamps = clamp01((introT - 0.35) / 0.55);
    const dimTarget = p === 'zooming' || p === 'orbit' || p === 'content' ? 1 : 0;
    const k = 1 - Math.exp(-(prefersReducedMotion() ? 20 : 3.2) * dt);
    f.dim += (dimTarget - f.dim) * k;
  });
  return null;
}

/** Ambient + moonlight, dimmed when an object is selected. */
export function BaseLights() {
  const { fx } = useApp();
  const amb = useRef(), hemi = useRef(), moon = useRef();
  useFrame(() => {
    const { reveal, dim } = fx.current;
    const d = 1 - 0.58 * dim;
    if (amb.current) amb.current.intensity = 0.42 * reveal * d;
    if (hemi.current) hemi.current.intensity = 0.8 * reveal * d;
    if (moon.current) moon.current.intensity = 0.95 * reveal * d;
  });
  return (
    <>
      <ambientLight ref={amb} color="#4b4f82" intensity={0} />
      <hemisphereLight ref={hemi} args={['#6f7fc4', '#7a4f3d', 0]} />
      <directionalLight ref={moon} color="#8fa2e8" position={[-6, 14, 10]} intensity={0} />
    </>
  );
}

/** One warm practical light per object; the selected one is lifted, the rest are dimmed. */
function Practical({ id, flickerSeed = 0, lampLike = false }) {
  const { state, fx } = useApp();
  const ref = useRef();
  const hov = useRef(0);
  const { light } = placements[id];
  const stateRef = useRef(state);
  stateRef.current = state;
  useFrame(({ clock }, dt) => {
    if (!ref.current) return;
    const f = fx.current;
    const st = stateRef.current;
    const selected = st.objectId === id;
    hov.current += ((st.hoverId === id ? 1 : 0) - hov.current) * (1 - Math.exp(-8 * dt));
    const ramp = lampLike ? f.lamps : f.reveal;
    const t = clock.elapsedTime;
    const flick = prefersReducedMotion() ? 1 : 1 + Math.sin(t * 1.3 + flickerSeed) * 0.025 + Math.sin(t * 3.7 + flickerSeed * 2) * 0.012;
    const dimMul = selected ? 1 + 0.1 * f.dim : 1 - 0.78 * f.dim;
    ref.current.intensity = light.base * ramp * flick * dimMul * (1 + 0.35 * hov.current);
  });
  return <pointLight ref={ref} color={light.color} position={light.pos} distance={16} decay={2} intensity={0} />;
}

/** A soft key light that follows the selected object so it stays the centre of attention. */
function FocusLight() {
  const { state, fx } = useApp();
  const ref = useRef();
  const stateRef = useRef(state);
  stateRef.current = state;
  const target = useRef(new THREE.Vector3());
  useFrame((_, dt) => {
    if (!ref.current) return;
    const id = stateRef.current.objectId;
    if (id) {
      const p = placements[id];
      target.current.set(p.focus[0] + p.cam.offset[0] * 0.5, p.focus[1] + 3.2, p.focus[2] + p.cam.offset[2] * 0.6);
      ref.current.position.lerp(target.current, 1 - Math.exp(-5 * dt));
    }
    ref.current.intensity = 26 * fx.current.dim;
  });
  return <pointLight ref={ref} color="#ffe2b0" distance={22} decay={2} intensity={0} position={[0, 4, 0]} />;
}

export function PracticalLights() {
  return (
    <>
      <Practical id="auto" flickerSeed={1} />
      <Practical id="stall" flickerSeed={2} />
      <Practical id="pc" flickerSeed={3} />
      <Practical id="lamp" flickerSeed={4} lampLike />
      <Practical id="table" flickerSeed={5} />
      <FocusLight />
    </>
  );
}
