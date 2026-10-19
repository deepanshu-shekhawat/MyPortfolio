import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useProgress } from '@react-three/drei';
import { useApp } from '../state';
import { useFontsReady } from '../scene/useFonts';

export function Loader() {
  const { state, dispatch } = useApp();
  const { progress, active } = useProgress();
  const fonts = useFontsReady();
  const done = useRef(false);
  const t0 = useRef(performance.now());

  useEffect(() => {
    if (done.current || state.phase !== 'loading') return;
    if (progress >= 100 && !active && fonts) {
      done.current = true;
      const wait = Math.max(0, 700 - (performance.now() - t0.current));
      setTimeout(() => dispatch({ type: 'LOADED' }), wait);
    }
  }, [progress, active, fonts, state.phase, dispatch]);

  return (
    <AnimatePresence>
      {state.phase === 'loading' && (
        <motion.div key="loader" className="loader" exit={{ opacity: 0, transition: { duration: 0.7 } }} role="status" aria-live="polite">
          <div className="loader-card">
            <p className="loader-hi" lang="hi">चाय बन रही है…</p>
            <p className="loader-en">Brewing the street</p>
            <div className="loader-bar"><i style={{ width: `${Math.max(6, progress)}%` }} /></div>
            <p className="mono loader-pct">{Math.round(progress)}%</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
