import { Component, Suspense, useCallback, useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerformanceMonitor, useContextBridge } from '@react-three/drei';
import { AnimatePresence } from 'framer-motion';
import { AppCtx, AppProvider, detectWebGL, useApp } from './state';
import { StreetEnvironment } from './components/StreetEnvironment';
import { OrbitMenu } from './components/OrbitMenu';
import { CameraController } from './components/CameraController';
import { ContentPanel } from './components/ContentPanel';
import { HeroOverlay, PortfolioNavigation, BootOverlay } from './components/PortfolioNavigation';
import { Loader } from './components/Loader';
import { Fallback } from './components/Fallback';
import { getObject } from './portfolioData';
import { FOV, INTRO_START } from './sceneLayout';
import { preloadModels } from './components/StreetObject';

preloadModels();

class Boundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(err) { console.error('3D scene failed:', err); }
  render() {
    return this.state.failed
      ? <Fallback reason="The 3D scene could not start on this device, so here is the simple version." />
      : this.props.children;
  }
}

function Scene() {
  const { state } = useApp();
  const Bridge = useContextBridge(AppCtx);
  const [dpr, setDpr] = useState([1, 1.75]);
  return (
    <Canvas
      className="stage"
      dpr={dpr}
      camera={{ fov: FOV, near: 0.1, far: 220, position: INTRO_START.pos.toArray() }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => gl.setClearColor('#20243A')}
    >
      <Bridge>
        <PerformanceMonitor onDecline={() => setDpr([1, 1.25])} onIncline={() => setDpr([1, 1.75])} />
        <CameraController />
        <StreetEnvironment />
        {state.objectId && <OrbitMenu key={state.objectId} objectId={state.objectId} />}
      </Bridge>
    </Canvas>
  );
}

function Shell() {
  const { state, dispatch } = useApp();
  const obj = state.objectId ? getObject(state.objectId) : null;
  const planet = obj && state.planetId ? obj.planets.find((p) => p.id === state.planetId) : null;

  const backToStreet = useCallback(() => dispatch({ type: 'BACK_TO_STREET' }), [dispatch]);
  const backToOrbit = useCallback(() => dispatch({ type: 'BACK_TO_ORBIT' }), [dispatch]);
  const dim = state.phase === 'zooming' || state.phase === 'orbit' || state.phase === 'content';

  return (
    <div className={`app phase-${state.phase}`}>
      <Boundary>
        <Scene />
      </Boundary>
      <div className={`vignette${dim ? ' on' : ''}`} aria-hidden="true" />
      <div className={`fade-in${state.phase === 'loading' ? '' : ' gone'}`} aria-hidden="true" />

      <HeroOverlay />
      <PortfolioNavigation onBackToStreet={backToStreet} onBackToOrbit={backToOrbit} />
      <BootOverlay />

      <AnimatePresence mode="wait">
        {state.phase === 'content' && obj && planet && (
          <ContentPanel key={planet.id} object={obj} planet={planet} onBack={backToOrbit} onStreet={backToStreet} />
        )}
      </AnimatePresence>

      <Loader />
    </div>
  );
}

export default function App() {
  const webgl = useMemo(detectWebGL, []);
  if (!webgl) return <Fallback />;
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
