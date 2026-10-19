import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useApp, prefersReducedMotion } from '../state';
import { homePose, objectPose, INTRO_START } from '../sceneLayout';

const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2); // easeInOutCubic

/**
 * Owns the camera. Flies between poses whenever `state.goal` changes and reports back with ARRIVE.
 * - Saves the camera pose when an object is selected and restores it on "Back to Street".
 * - A tiny pointer-driven drift in the street view adds depth without any shaking.
 */
export function CameraController() {
  const { camera, size, gl } = useThree();
  const { state, dispatch, fx } = useApp();
  const stateRef = useRef(state);
  stateRef.current = state;
  const look = useRef(new THREE.Vector3());
  const anim = useRef(null);
  const pointer = useRef({ x: 0, y: 0, sx: 0, sy: 0 });
  const aspect = size.width / size.height;
  const aspectRef = useRef(aspect);
  aspectRef.current = aspect;
  const debugCam = useRef(null);

  // Optional ?cam=x,y,z,lx,ly,lz override for development/QA.
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const q = new URLSearchParams(window.location.search).get('cam');
    if (q) debugCam.current = q.split(',').map(Number);
  }, []);

  useEffect(() => {
    const onMove = (e) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  // Initial pose
  useEffect(() => {
    camera.position.copy(INTRO_START.pos);
    look.current.copy(INTRO_START.look);
    camera.lookAt(look.current);
  }, [camera]);

  const startFlight = (to, duration, onDone) => {
    anim.current = {
      fromPos: camera.position.clone(),
      fromLook: look.current.clone(),
      to,
      t: 0,
      duration: prefersReducedMotion() ? Math.min(0.01, duration) : duration,
      onDone,
    };
  };

  // React to goal changes
  useEffect(() => {
    const { goal, phase, objectId } = state;
    const a = aspectRef.current;
    if (debugCam.current && goal.kind === 'intro') return;
    if (goal.kind === 'intro') {
      // handled by the intro effect below
      return;
    }
    if (goal.kind === 'home') {
      const to = fx.current.savedPose && phase === 'returning' ? fx.current.savedPose : homePose(a);
      const seq = goal.seq;
      startFlight(to, 1.1, () => { fx.current.savedPose = null; dispatch({ type: 'ARRIVE', seq }); });
      return;
    }
    if (goal.kind === 'object' || goal.kind === 'content') {
      if (phase === 'zooming' && !fx.current.savedPose) {
        fx.current.savedPose = { pos: camera.position.clone(), look: look.current.clone() };
      }
      const to = objectPose(objectId, a, goal.kind === 'content');
      const seq = goal.seq;
      startFlight(to, goal.kind === 'content' ? 0.85 : 1.1, () => dispatch({ type: 'ARRIVE', seq }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.goal]);

  // Cinematic intro (skippable)
  const introRef = useRef({ t: 0, started: false });
  useEffect(() => {
    if (state.phase !== 'intro' || introRef.current.started) return;
    introRef.current.started = true;
    const dur = prefersReducedMotion() ? 0.01 : 4.2;
    introRef.current.dur = dur;
  }, [state.phase]);

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const st = stateRef.current;

    if (debugCam.current) {
      const c = debugCam.current;
      camera.position.set(c[0], c[1], c[2]);
      look.current.set(c[3], c[4], c[5]);
      camera.lookAt(look.current);
      fx.current.introT = 1;
      return;
    }

    if (st.phase === 'intro') {
      const it = introRef.current;
      if (!it.started) { fx.current.introT = 0; return; }
      if (fx.current.skipIntro) it.t = it.dur;
      it.t = Math.min(it.dur, it.t + dt);
      const p = it.t / it.dur;
      fx.current.introT = p;
      const e = ease(Math.min(1, p));
      const home = homePose(aspectRef.current);
      camera.position.lerpVectors(INTRO_START.pos, home.pos, e);
      look.current.lerpVectors(INTRO_START.look, home.look, e);
      camera.lookAt(look.current);
      if (p >= 1) dispatch({ type: 'INTRO_DONE' });
      return;
    }

    const a = anim.current;
    if (a) {
      a.t += dt / a.duration;
      const e = ease(Math.min(1, a.t));
      camera.position.lerpVectors(a.fromPos, a.to.pos, e);
      look.current.lerpVectors(a.fromLook, a.to.look, e);
      camera.lookAt(look.current);
      if (a.t >= 1) {
        anim.current = null;
        a.onDone?.();
      }
      return;
    }

    // Idle: tiny parallax drift in the street view only.
    if (st.phase === 'street' && !prefersReducedMotion()) {
      const home = homePose(aspectRef.current);
      const p = pointer.current;
      p.sx += (p.x - p.sx) * (1 - Math.exp(-2.5 * dt));
      p.sy += (p.y - p.sy) * (1 - Math.exp(-2.5 * dt));
      camera.position.set(home.pos.x + p.sx * 0.35, home.pos.y - p.sy * 0.12, home.pos.z);
      look.current.copy(home.look);
      camera.lookAt(look.current);
    } else if (st.phase === 'street') {
      const home = homePose(aspectRef.current);
      camera.position.copy(home.pos);
      look.current.copy(home.look);
      camera.lookAt(look.current);
    }
  });

  // Keep home framing right when the window is resized in street view.
  useEffect(() => {
    if (stateRef.current.phase === 'street' && !anim.current) {
      const home = homePose(aspect);
      camera.position.copy(home.pos);
    }
  }, [aspect, camera]);

  useEffect(() => { gl.domElement.style.touchAction = 'none'; }, [gl]);

  return null;
}
