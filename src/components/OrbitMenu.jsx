import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useApp, prefersReducedMotion } from '../state';
import { placements, PALETTE } from '../sceneLayout';
import { getObject, getVisiblePlanets, getContactLinks } from '../portfolioData';
import { OrbitPlanet } from './OrbitPlanet';

const TAU = Math.PI * 2;
const HALF_PI = Math.PI / 2;
const REV_SECONDS = 42; // one full revolution while idle (35–50 s)
const easeOutBack = (t) => { const c1 = 1.4, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
const mod = (n, m) => ((n % m) + m) % m;

/**
 * Five planets on a tilted ellipse around the selected object, positioned in real 3D space.
 * Scroll / drag / arrow keys rotate it (damped); the planet nearest the viewer is "focused".
 */
export function OrbitMenu({ objectId }) {
  const { state, dispatch } = useApp();
  const obj = getObject(objectId);
  const place = placements[objectId];
  const planets = useMemo(() => getVisiblePlanets(obj), [obj]);
  const n = planets.length;
  const step = n ? TAU / n : TAU;

  const stateRef = useRef(state);
  stateRef.current = state;
  const viewport = useThree((t) => t.size);
  const fit = THREE.MathUtils.clamp(viewport.width / viewport.height / 1.2, 0.58, 1);

  const groupRef = useRef();
  const planetRefs = useRef([]);
  const matRefs = useRef([]);
  const ringRefs = useRef([]);
  const orbitLine = useRef();
  const lineMat = useRef();

  const angle = useRef(HALF_PI); // current
  const target = useRef(HALF_PI); // where we are easing to
  const lastInput = useRef(-1e9);
  const reveal = useRef(0);
  const radiusScale = useRef(1);
  const hoverIdx = useRef(null);
  const snapPending = useRef(false);
  const focusRef = useRef(0);
  const [focus, setFocus] = useState(0);

  const azimuth = useMemo(() => Math.atan2(place.cam.offset[0], place.cam.offset[2]), [place]);
  const center = useMemo(() => [
    place.focus[0] + (place.orbit.offset?.[0] ?? 0),
    place.focus[1] + place.orbit.cy + (place.orbit.offset?.[1] ?? 0),
    place.focus[2] + (place.orbit.offset?.[2] ?? 0),
  ], [place]);

  const ellipse = useMemo(() => {
    const pts = [];
    for (let i = 0; i <= 96; i++) {
      const t = (i / 96) * TAU;
      pts.push(new THREE.Vector3(Math.cos(t), 0, Math.sin(t)));
    }
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, []);

  const snap = (v) => HALF_PI + Math.round((v - HALF_PI) / step) * step;

  /** Rotate so planet i sits at the front (nearest turn). */
  const bringToFront = useCallback((i) => {
    const want = HALF_PI - i * step;
    const k = Math.round((target.current - want) / TAU);
    target.current = want + k * TAU;
    lastInput.current = performance.now();
  }, [step]);

  const choose = useCallback((i) => {
    const st = stateRef.current;
    if (st.phase !== 'orbit' && st.phase !== 'content') return;
    const planet = planets[i];
    bringToFront(i);
    // Contact planets are real links: open them instead of a content panel.
    if (planet.contactKey) {
      const link = getContactLinks([planet.contactKey])[0];
      if (!link) return;
      if (link.external) window.open(link.href, '_blank', 'noopener,noreferrer');
      else window.location.href = link.href;
      return;
    }
    dispatch({ type: 'OPEN_PLANET', id: planet.id });
  }, [bringToFront, dispatch, planets]);

  // When content opens for a planet (e.g. from keyboard), make sure it is at the front.
  useEffect(() => {
    if (state.phase === 'content' && state.planetId) {
      const i = planets.findIndex((p) => p.id === state.planetId);
      if (i >= 0) bringToFront(i);
    }
  }, [state.phase, state.planetId, planets, bringToFront]);

  /* ───────────── input: wheel, drag, keyboard ───────────── */
  useEffect(() => {
    if (!n) return;
    const active = () => stateRef.current.phase === 'orbit';
    const bump = () => { lastInput.current = performance.now(); snapPending.current = true; };

    const onWheel = (e) => {
      const st = stateRef.current;
      if (st.phase !== 'orbit' && st.phase !== 'zooming') return;
      if (e.target.closest?.('[data-scroll]')) return;
      e.preventDefault();
      if (!active()) return;
      const dy = e.deltaMode === 1 ? e.deltaY * 32 : e.deltaY;
      target.current -= THREE.MathUtils.clamp(dy, -160, 160) * 0.0022;
      bump();
    };

    let drag = null;
    const onDown = (e) => {
      if (!active()) return;
      if (e.target.tagName !== 'CANVAS') return;
      drag = { x: e.clientX, y: e.clientY };
    };
    const onMove = (e) => {
      if (!drag || !active()) return;
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      drag.x = e.clientX; drag.y = e.clientY;
      if (Math.abs(dy) > Math.abs(dx)) target.current += dy * 0.006; // finger up = next
      else target.current -= dx * 0.006;
      bump();
    };
    const onUp = () => { drag = null; };

    const onKey = (e) => {
      if (!active()) return;
      const tag = document.activeElement?.tagName;
      const onControl = tag === 'BUTTON' || tag === 'A' || tag === 'INPUT';
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); target.current = snap(target.current) - step; bump(); }
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); target.current = snap(target.current) + step; bump(); }
      else if ((e.key === 'Enter' || e.key === ' ') && !onControl) { e.preventDefault(); choose(focusRef.current); }
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      window.removeEventListener('keydown', onKey);
    };
  }, [n, step, choose]);

  /* ───────────── per-frame layout ───────────── */
  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const st = stateRef.current;
    const reduced = prefersReducedMotion();

    // reveal in/out
    const showing = st.phase === 'orbit' || st.phase === 'content';
    const revealTarget = showing ? 1 : 0;
    reveal.current += (revealTarget - reveal.current) * (reduced ? 1 : 1 - Math.exp(-(showing ? 2.6 : 7) * dt));
    if (showing && !reduced) reveal.current = Math.min(1, reveal.current + 0); // asymptotic
    const rv = reveal.current;

    // content mode: tighter orbit, planets slow
    const rsTarget = st.phase === 'content' ? 0.8 : 1;
    radiusScale.current += (rsTarget - radiusScale.current) * (1 - Math.exp(-4 * dt));

    // idle auto-rotation (paused while hovering a planet, after input, or while reading)
    const idle = performance.now() - lastInput.current > 6000;
    if (st.phase === 'orbit' && rv > 0.9 && idle && hoverIdx.current === null && !reduced) {
      target.current -= (TAU / REV_SECONDS) * dt;
    }
    // settle onto the nearest planet shortly after the user stops scrolling
    if (snapPending.current && st.phase === 'orbit' && performance.now() - lastInput.current > 650 && hoverIdx.current === null) {
      target.current = snap(target.current);
      snapPending.current = false;
    }
    angle.current += (target.current - angle.current) * (reduced ? 1 : 1 - Math.exp(-7 * dt));

    const a = place.orbit.a * radiusScale.current * fit;
    const b = place.orbit.b * radiusScale.current;
    let best = 0, bestV = -2;
    for (let i = 0; i < n; i++) {
      const th = angle.current + i * step;
      const s = Math.sin(th);
      if (s > bestV) { bestV = s; best = i; }
      const g = planetRefs.current[i];
      if (!g) continue;
      g.position.set(Math.cos(th) * a, 0, s * b);
      // staggered reveal
      const local = THREE.MathUtils.clamp((rv - i * 0.1) / 0.55, 0, 1);
      const isFocus = i === best; // refined below after loop
      const depth = 0.9 + 0.1 * s;
      g.userData.depth = depth;
      g.userData.local = local;
    }
    if (best !== focusRef.current) { focusRef.current = best; setFocus(best); }

    const contentIdx = st.phase === 'content' ? planets.findIndex((p) => p.id === st.planetId) : -1;
    for (let i = 0; i < n; i++) {
      const g = planetRefs.current[i];
      if (!g) continue;
      const focused = i === best;
      const hovering = hoverIdx.current === i;
      const local = g.userData.local ?? 0;
      const sc = (reduced ? local : easeOutBack(local)) * g.userData.depth * (focused ? 1.16 : hovering ? 1.08 : 1);
      g.scale.setScalar(Math.max(0.0001, sc));
      g.visible = local > 0.001;
      const m = matRefs.current[i];
      if (m) {
        const dim = contentIdx >= 0 && contentIdx !== i ? 0.45 : 1;
        m.opacity = local * dim;
        m.emissiveIntensity += ((focused || hovering ? 1.0 : 0.28) - m.emissiveIntensity) * (1 - Math.exp(-8 * dt));
      }
      const r = ringRefs.current[i];
      if (r) r.opacity = 0.5 * local * (focused ? 1.3 : 0.7);
      g.rotation.y += dt * 0.4;
    }
    if (lineMat.current) lineMat.current.opacity = 0.32 * rv;
    if (orbitLine.current) orbitLine.current.scale.set(a, 1, b);
    if (groupRef.current) groupRef.current.visible = rv > 0.002;
  });

  if (!obj) return null;
  const contentIdx = state.phase === 'content' ? planets.findIndex((p) => p.id === state.planetId) : -1;
  const hiddenLabels = state.phase !== 'orbit' && state.phase !== 'content';

  return (
    <group ref={groupRef} position={center} rotation={[place.orbit.tilt, azimuth, 0, 'YXZ']}>
      <line ref={orbitLine} geometry={ellipse}>
        <lineBasicMaterial ref={lineMat} color={PALETTE.marigold} transparent opacity={0} depthWrite={false} />
      </line>
      {planets.map((p, i) => (
        <OrbitPlanet
          key={p.id}
          ref={(g) => (planetRefs.current[i] = g)}
          matRef={(m) => (matRefs.current[i] = m)}
          ringRef={(m) => (ringRefs.current[i] = m)}
          index={i}
          planet={p}
          focused={!hiddenLabels && (contentIdx >= 0 ? contentIdx === i : focus === i)}
          selected={contentIdx === i}
          dimmed={contentIdx >= 0 && contentIdx !== i}
          onChoose={choose}
          onHover={(idx) => { hoverIdx.current = idx; }}
        />
      ))}
      {n === 0 && (
        <Html center>
          <p className="orbit-empty">{obj.emptyNote ?? 'Nothing to show here yet.'}</p>
        </Html>
      )}
    </group>
  );
}
