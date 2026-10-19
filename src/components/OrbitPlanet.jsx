import { forwardRef } from 'react';
import { Html } from '@react-three/drei';
import { PALETTE } from '../sceneLayout';

export const PLANET_COLORS = [PALETTE.marigold, PALETTE.dustyPink, PALETTE.turquoise, '#4aa37f', PALETTE.cream];
export const PLANET_RADIUS = 0.3;

/**
 * One planet: sphere + thin ring + HTML label. Position/scale/brightness are driven by OrbitMenu each frame
 * through the forwarded group ref and the exposed material refs.
 */
export const OrbitPlanet = forwardRef(function OrbitPlanet(
  { index, planet, focused, selected, dimmed, onChoose, onHover, matRef, ringRef },
  ref,
) {
  const color = PLANET_COLORS[index % PLANET_COLORS.length];
  return (
    <group ref={ref}>
      <mesh
        onPointerOver={(e) => { e.stopPropagation(); onHover(index); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { onHover(null); document.body.style.cursor = ''; }}
        onClick={(e) => { e.stopPropagation(); onChoose(index); }}
      >
        <sphereGeometry args={[PLANET_RADIUS, 32, 24]} />
        <meshStandardMaterial ref={matRef} color={color} emissive={color} emissiveIntensity={0.3} roughness={0.55} metalness={0.05} transparent />
      </mesh>
      <mesh rotation={[1.25, 0.2, 0.3]}>
        <torusGeometry args={[PLANET_RADIUS * 1.55, 0.012, 6, 48]} />
        <meshBasicMaterial ref={ringRef} color={PALETTE.cream} transparent opacity={0.5} />
      </mesh>
      <Html position={[0, -PLANET_RADIUS - 0.2, 0]} center zIndexRange={[40, 0]}>
        <button
          type="button"
          className={`planet-label${focused ? ' is-focus' : ''}${selected ? ' is-selected' : ''}${dimmed ? ' is-dim' : ''}`}
          style={{ '--planet': color }}
          onClick={() => onChoose(index)}
          onMouseEnter={() => onHover(index)}
          onMouseLeave={() => onHover(null)}
          aria-label={`${planet.title} — ${planet.blurb ?? ''}`}
        >
          <span className="planet-no">{String(index + 1).padStart(2, '0')}</span>
          <span className="planet-title">{focused ? planet.title : planet.short ?? planet.title}</span>
          {focused && planet.hindi && <span className="planet-hi">{planet.hindi}</span>}
        </button>
      </Html>
    </group>
  );
});
