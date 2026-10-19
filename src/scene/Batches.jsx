import { forwardRef, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

/** Collects many small boxes so they can be drawn as a handful of instanced meshes. */
export class BoxCollector {
  constructor() { this.groups = {}; }
  box(group, [x, y, z], [sx, sy, sz], color = '#ffffff', rotY = 0) {
    (this.groups[group] ||= []).push({ p: [x, y, z], s: [sx, sy, sz], c: color, r: rotY });
    return this;
  }
}

const tmpM = new THREE.Matrix4();
const tmpQ = new THREE.Quaternion();
const tmpP = new THREE.Vector3();
const tmpS = new THREE.Vector3();
const tmpC = new THREE.Color();
const UP = new THREE.Vector3(0, 1, 0);

export const BoxBatch = forwardRef(function BoxBatch({ items, children }, ref) {
  const mesh = useRef();
  const geo = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  useLayoutEffect(() => {
    const m = mesh.current;
    if (!m) return;
    items.forEach((it, i) => {
      tmpQ.setFromAxisAngle(UP, it.r);
      tmpP.set(...it.p); tmpS.set(...it.s);
      tmpM.compose(tmpP, tmpQ, tmpS);
      m.setMatrixAt(i, tmpM);
      m.setColorAt(i, tmpC.set(it.c));
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    m.computeBoundingSphere();
  }, [items]);
  return (
    <instancedMesh
      ref={(n) => { mesh.current = n; if (typeof ref === 'function') ref(n); else if (ref) ref.current = n; }}
      args={[geo, undefined, items.length]}
      frustumCulled={false}
    >
      {children}
    </instancedMesh>
  );
});
