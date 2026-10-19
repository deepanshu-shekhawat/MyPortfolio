import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useApp, prefersReducedMotion } from '../state';
import { getObject, streetObjects, getVisiblePlanets } from '../portfolioData';

/** Hero copy: appears during the intro, stays small in the street view. */
export function HeroOverlay() {
  const { state, fx, dispatch } = useApp();
  const reduced = prefersReducedMotion();
  const show = state.phase === 'intro' || state.phase === 'street';
  const intro = state.phase === 'intro';

  const skip = () => { fx.current.skipIntro = true; };
  useEffect(() => {
    if (!intro) return;
    const onKey = () => skip();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [intro]);

  return (
    <AnimatePresence>
      {show && (
        <motion.header
          key="hero"
          className={`hero${intro ? ' is-intro' : ''}`}
          initial={false}
          exit={{ opacity: 0, y: -14, transition: { duration: 0.35 } }}
        >
          <motion.p
            className="hero-eyebrow mono"
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            JAIPUR · BLUE HOUR · एक चाय हो जाए?
          </motion.p>
          <motion.h1
            initial={reduced ? false : { opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.75, ease: [0.22, 0.8, 0.3, 1] }}
          >
            BUILT ON CHAI.<br /><span>POWERED BY CODE.</span>
          </motion.h1>
          <motion.p
            className="hero-sub"
            initial={reduced ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.6, duration: 0.6 }}
          >
            Computer Science student. AI/ML explorer. Developer by curiosity. Creator by instinct.
          </motion.p>
          <motion.p
            className="hero-prompt"
            initial={reduced ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.3, duration: 0.6 }}
          >
            <span className="arrow" aria-hidden="true">➜</span> Explore the street. Click an object.
          </motion.p>
          {intro && (
            <button type="button" className="btn skip mono" onClick={skip}>SKIP INTRO</button>
          )}
        </motion.header>
      )}
    </AnimatePresence>
  );
}

/** Back buttons, selected-object title, scroll hint, street index and Escape handling. */
export function PortfolioNavigation({ onBackToStreet, onBackToOrbit }) {
  const { state, dispatch } = useApp();
  const { phase, objectId } = state;
  const obj = objectId ? getObject(objectId) : null;
  const inside = phase === 'zooming' || phase === 'orbit' || phase === 'content' || phase === 'returning';
  const canLeave = phase === 'orbit' || phase === 'content';

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      if (phase === 'content') onBackToOrbit();
      else if (phase === 'orbit') onBackToStreet();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, onBackToOrbit, onBackToStreet]);

  const planetsCount = obj ? getVisiblePlanets(obj).length : 0;

  return (
    <>
      {/* persistent back button while inside an object */}
      <AnimatePresence>
        {inside && (
          <motion.button
            key="back"
            type="button"
            className="btn back-street"
            disabled={!canLeave}
            onClick={onBackToStreet}
            initial={{ opacity: 0, x: -14 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -14 }}
            transition={{ duration: 0.35 }}
          >
            <span aria-hidden="true">←</span> Back to Street
          </motion.button>
        )}
      </AnimatePresence>

      {/* selected object title + hint */}
      <AnimatePresence>
        {obj && phase === 'orbit' && (
          <motion.div
            key={`title-${objectId}`}
            className="object-title"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <p className="mono eyebrow">{obj.role.toUpperCase()}</p>
            <h2>{obj.title}<span lang="hi">{obj.hindi}</span></h2>
            <p className="hint">{planetsCount > 0 ? obj.orbitHint : obj.emptyNote}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {obj && phase === 'orbit' && planetsCount > 0 && (
          <motion.div
            key="scroll-hint"
            className="scroll-hint mono"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.8 }}
          >
            <span className="mouse" aria-hidden="true"><i /></span>
            <span className="hint-desktop">SCROLL TO ROTATE · CLICK A PLANET · ← → · ENTER · ESC</span>
            <span className="hint-touch">SWIPE TO ROTATE · TAP A PLANET</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* street index: keyboard / touch friendly list of the five objects */}
      <AnimatePresence>
        {phase === 'street' && (
          <motion.nav
            key="index"
            className="street-index"
            aria-label="Street objects"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {streetObjects.map((o, i) => (
              <button
                key={o.id}
                type="button"
                className="index-chip"
                onMouseEnter={() => dispatch({ type: 'HOVER', id: o.id })}
                onMouseLeave={() => dispatch({ type: 'HOVER', id: null })}
                onFocus={() => dispatch({ type: 'HOVER', id: o.id })}
                onBlur={() => dispatch({ type: 'HOVER', id: null })}
                onClick={() => dispatch({ type: 'SELECT', id: o.id })}
              >
                <span className="mono no">{String(i + 1).padStart(2, '0')}</span>
                <span className="nm">{o.pinLabel}</span>
                <span className="rl">{o.role}</span>
              </button>
            ))}
          </motion.nav>
        )}
      </AnimatePresence>
    </>
  );
}

/** Brief terminal boot while the camera approaches the old PC. */
export function BootOverlay() {
  const { state } = useApp();
  const show = state.objectId === 'pc' && state.phase === 'zooming' && !prefersReducedMotion();
  const lines = ['JKLU-BIOS 1.0  (c) cyber café', 'memory test ........ OK', 'mounting /skills ..... OK', 'starting orbit.sys ...', 'C:\\> READY_'];
  return (
    <AnimatePresence>
      {show && (
        <motion.pre
          className="boot mono"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.3 } }}
          aria-hidden="true"
        >
          {lines.map((l, i) => (
            <motion.span key={l} style={{ display: 'block' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.12 + i * 0.2, duration: 0.05 }}>
              {l}
            </motion.span>
          ))}
        </motion.pre>
      )}
    </AnimatePresence>
  );
}
