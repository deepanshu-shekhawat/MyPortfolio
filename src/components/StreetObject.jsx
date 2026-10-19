import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useApp, prefersReducedMotion } from '../state';
import { placements } from '../sceneLayout';
import { getObject, streetObjects } from '../portfolioData';
import { ContactBlob } from '../scene/Particles';

const MODEL_URL = (name) => `${import.meta.env.BASE_URL}models/${name}.glb`.replace('//', '/');

/** Per-model emissive "life" — only for materials that really exist in the supplied files. */
const EMISSIVE = {
  auto: { lamp: { color: '#fff0c0', base: 0.9, hover: 2.4 } },
  stall: { flame: { color: '#ff8a2a', base: 1.4, hover: 2.2 } },
  pc: {
    crt_glow: { color: '#6dffb0', base: 0.55, hover: 0.95 },
    crt_glass: { color: '#0e3a28', base: 0.5, hover: 0.9 },
    led_green: { color: '#34ff6a', base: 1.6, hover: 2.4 },
    led_red: { color: '#ff3a2a', base: 1.2, hover: 1.8 },
  },
  lamp: {
    bulb: { color: '#ffe3a3', base: 2.4, hover: 3.6 },
    glass: { color: '#ffcf80', base: 1.3, hover: 2.0 },
  },
  table: {},
};

const HOVER_TINT = new THREE.Color('#ffb25a');
const _c = new THREE.Color();

useGLTF.preload(MODEL_URL('auto_rickshaw'));

export function preloadModels() {
  streetObjects.forEach((o) => useGLTF.preload(MODEL_URL(o.model)));
}

/**
 * Loads a GLB, measures it, scales/grounds it to the layout config and wires hover/click.
 * `children` are placed in the model's own (normalised) coordinate space.
 */
export function StreetObject({ id, children }) {
  const place = placements[id];
  const obj = getObject(id);
  const { state, dispatch } = useApp();
  const { scene } = useGLTF(MODEL_URL(obj.model));
  const stateRef = useRef(state);
  stateRef.current = state;
  const hover = useRef(0);

  // Clone so each use has its own materials; measure for scale + grounding.
  const { root, scale, offset, size, mats, box } = useMemo(() => {
    const root = scene.clone(true);
    const mats = [];
    root.traverse((n) => {
      if (!n.isMesh) return;
      n.material = n.material.clone();
      const cfg = EMISSIVE[id]?.[n.material.name];
      const m = n.material;
      m.userData.baseEmissive = m.emissive ? m.emissive.clone() : new THREE.Color(0);
      m.userData.baseIntensity = m.emissiveIntensity ?? 1;
      if (cfg) { m.emissive = new THREE.Color(cfg.color); m.emissiveIntensity = cfg.base; }
      m.userData.cfg = cfg;
      mats.push(m);
    });
    const box = new THREE.Box3().setFromObject(root);
    const size = box.getSize(new THREE.Vector3());
    const { axis, size: target } = place.fit;
    const ref = axis === 'x' ? size.x : axis === 'y' ? size.y : axis === 'z' ? size.z : Math.max(size.x, size.z);
    const scale = target / ref;
    const center = box.getCenter(new THREE.Vector3());
    const offset = new THREE.Vector3(-center.x, -box.min.y, -center.z).multiplyScalar(scale);
    return { root, scale, offset, size: size.clone().multiplyScalar(scale), mats, box };
  }, [scene, id, place]);

  useEffect(() => () => mats.forEach((m) => m.dispose()), [mats]);

  useFrame((_, dt) => {
    const st = stateRef.current;
    const target = st.hoverId === id || (st.objectId === id && st.phase !== 'street') ? 1 : 0;
    const k = prefersReducedMotion() ? 1 : 1 - Math.exp(-9 * dt);
    hover.current += (target - hover.current) * k;
    const h = hover.current;
    for (const m of mats) {
      const cfg = m.userData.cfg;
      if (cfg) {
        m.emissiveIntensity = cfg.base + (cfg.hover - cfg.base) * h;
      } else if (m.emissive) {
        _c.copy(m.userData.baseEmissive).lerp(HOVER_TINT, h * 0.2);
        m.emissive.copy(_c);
        m.emissiveIntensity = m.userData.baseIntensity;
      }
    }
  });

  const enabled = state.phase === 'street';
  const over = (e) => {
    if (!enabled) return;
    e.stopPropagation();
    dispatch({ type: 'HOVER', id });
    document.body.style.cursor = 'pointer';
  };
  const out = () => {
    dispatch({ type: 'HOVER', id: null });
    document.body.style.cursor = '';
  };
  const click = (e) => {
    if (!enabled) return;
    e.stopPropagation();
    document.body.style.cursor = '';
    dispatch({ type: 'SELECT', id });
  };
  useEffect(() => { if (!enabled) document.body.style.cursor = ''; }, [enabled]);

  const hitCenter = box.getCenter(new THREE.Vector3());
  const hitSize = box.getSize(new THREE.Vector3());

  return (
    <group position={place.pos} rotation-y={place.rotY} name={`street-object-${id}`}>
      <ContactBlob position={[0, 0, 0]} size={place.footprint.map((v) => v * 1.5)} opacity={0.75} />
      <group position={offset} scale={scale}>
        <primitive object={root} />
        {/* generous invisible hit volume so thin things (the lamp) are easy to click */}
        <mesh position={hitCenter} onPointerOver={over} onPointerOut={out} onClick={click}>
          <boxGeometry args={[hitSize.x * 1.04, hitSize.y * 1.02, hitSize.z * 1.04]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
        </mesh>
        {children}
      </group>
      <Pin id={id} height={size.y} />
    </group>
  );
}

/** Small numbered enamel pin that floats above each object: touch / keyboard friendly. */
function Pin({ id, height }) {
  const { state, dispatch } = useApp();
  const obj = getObject(id);
  const index = streetObjects.findIndex((o) => o.id === id) + 1;
  const visible = state.phase === 'street';
  const hovered = state.hoverId === id;
  return (
    <Html
      position={[0, height + 0.45, 0]}
      center
      zIndexRange={[30, 0]}
      style={{ pointerEvents: visible ? 'auto' : 'none' }}
    >
      <button
        type="button"
        className={`pin${hovered ? ' is-hover' : ''}${visible ? '' : ' is-hidden'}`}
        aria-label={`Open ${obj.title}: ${obj.role}`}
        tabIndex={visible ? 0 : -1}
        onMouseEnter={() => visible && dispatch({ type: 'HOVER', id })}
        onMouseLeave={() => dispatch({ type: 'HOVER', id: null })}
        onFocus={() => visible && dispatch({ type: 'HOVER', id })}
        onBlur={() => dispatch({ type: 'HOVER', id: null })}
        onClick={() => dispatch({ type: 'SELECT', id })}
      >
        <span className="pin-num">{String(index).padStart(2, '0')}</span>
        <span className="pin-label">
          <span className="pin-hover">{obj.hoverLabel}</span>
          <span className="pin-role">{obj.hindi} · {obj.role}</span>
        </span>
      </button>
    </Html>
  );
}
