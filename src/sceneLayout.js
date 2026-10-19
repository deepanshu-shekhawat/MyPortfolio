import * as THREE from 'three';

export const PALETTE = {
  indigo: '#20243A',
  sandstone: '#D6B995',
  dustyPink: '#B87975',
  marigold: '#E7AD43',
  autoGreen: '#2D775B',
  chaiBrown: '#70452E',
  cream: '#F4E8D1',
  turquoise: '#6A9B97',
};

export const STREET = {
  halfRoad: 4.8, // road is x ∈ [-4.8, 4.8]
  walk: 6.8, // outer edge of the raised pavements / facade line
  zNear: 19,
  zFar: -27,
};

const deg = (d) => (d * Math.PI) / 180;

/**
 * Where each GLB lives. Models are measured at load time and normalised
 * (scaled so `fit.size` metres on `fit.axis`, grounded at y=0, centred on x/z).
 */
export const placements = {
  auto: {
    pos: [-2.5, 0, 5],
    rotY: deg(28),
    fit: { axis: 'z', size: 3.5 },
    focus: [-2.5, 1.0, 5], // centre of attention for camera + orbit
    cam: { offset: [2.6, 1.5, 7.4], lookLift: 0 },
    orbit: { a: 3.0, b: 1.6, cy: 0.7, tilt: 0.42 },
    light: { color: '#ffb35c', pos: [-2.5, 2.4, 6.4], base: 9 },
    footprint: [2.0, 3.8],
  },
  stall: {
    pos: [3.7, 0, 1.4],
    rotY: deg(-28),
    fit: { axis: 'x', size: 3.9 },
    focus: [3.7, 1.7, 1.4],
    cam: { offset: [-3.6, 1.4, 7.4], lookLift: 0 },
    orbit: { a: 2.7, b: 1.5, cy: 0.3, tilt: 0.4, offset: [-0.4, 0, 0] },
    light: { color: '#ff9d3a', pos: [2.9, 3.0, 2.4], base: 14 },
    footprint: [4.4, 3.2],
  },
  pc: {
    pos: [-4.8, 0.8, -4.5],
    rotY: deg(34),
    fit: { axis: 'x', size: 2.7 },
    focus: [-4.8, 1.7, -4.5],
    cam: { offset: [3.0, 0.9, 6.4], lookLift: 0 },
    orbit: { a: 2.5, b: 1.4, cy: 0.1, tilt: 0.4, offset: [0.8, 0, 0] },
    light: { color: '#7dffc0', pos: [-4.3, 1.9, -3.4], base: 4 },
    footprint: [3.0, 1.6],
  },
  lamp: {
    pos: [4.8, 0, -7.5],
    rotY: Math.PI, // arm reaches over the road
    fit: { axis: 'y', size: 5.6 },
    focus: [4.2, 2.9, -7.5],
    cam: { offset: [-3.2, 0.6, 9.0], lookLift: 0 },
    orbit: { a: 2.6, b: 1.4, cy: -0.5, tilt: 0.4, offset: [-0.35, 0, 0] },
    light: { color: '#ffbf66', pos: [3.65, 5.0, -7.5], base: 38 },
    footprint: [1.0, 1.0],
  },
  table: {
    pos: [-4.9, 0, -11.5],
    rotY: deg(90),
    fit: { axis: 'maxXZ', size: 2.6 },
    focus: [-4.9, 0.8, -11.5],
    cam: { offset: [4.4, 1.6, 5.2], lookLift: 0 },
    orbit: { a: 2.4, b: 1.4, cy: 0.5, tilt: 0.4, offset: [0.8, 0, 0] },
    light: { color: '#ffb260', pos: [-7.4, 2.7, -11.6], base: 14 },
    footprint: [2.8, 2.8],
  },
};

export const HOME = {
  pos: new THREE.Vector3(1.4, 3.2, 12.6),
  look: new THREE.Vector3(-0.3, 1.5, -5.5),
};
export const INTRO_START = {
  pos: new THREE.Vector3(0.2, 6.4, 20.5),
  look: new THREE.Vector3(0, 2.6, -8),
};
export const FOV = 46;

/** Home pose adjusted so the whole street still fits on narrow (portrait) screens. */
export function homePose(aspect) {
  const pos = HOME.pos.clone();
  const look = HOME.look.clone();
  if (aspect < 1.2) {
    const k = THREE.MathUtils.clamp(1.2 - aspect, 0, 0.8);
    pos.z += k * 22;
    pos.y += k * 3;
    pos.x *= 1 - k;
  }
  return { pos, look };
}

/** Camera pose for a selected object, with an optional shift to make room for the content panel. */
export function objectPose(id, aspect, contentOpen = false) {
  const p = placements[id];
  const focus = new THREE.Vector3(...p.focus);
  const off = new THREE.Vector3(...p.cam.offset);
  // widen on portrait screens so the orbit still fits
  const k = aspect < 1.1 ? 1 + (1.1 - aspect) * 1.5 : 1;
  off.multiplyScalar(k);
  const pos = focus.clone().add(off);
  const look = focus.clone();
  look.y += p.cam.lookLift;

  if (contentOpen) {
    const dist = pos.distanceTo(look);
    const h = 2 * dist * Math.tan(THREE.MathUtils.degToRad(FOV / 2));
    const w = h * aspect;
    const fwd = look.clone().sub(pos).normalize();
    const right = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0, 1, 0)).normalize();
    const up = new THREE.Vector3().crossVectors(right, fwd).normalize();
    const shift = aspect >= 0.95 ? right.multiplyScalar(w * 0.2) : up.multiplyScalar(-h * 0.2);
    pos.add(shift);
    look.add(shift);
  }
  return { pos, look };
}
