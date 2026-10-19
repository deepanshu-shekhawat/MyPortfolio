import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { streetObjects, getVisiblePlanets, getContactLinks } from '../portfolioData';
import { ContentPanel } from './ContentPanel';

/** Lightweight, fully accessible version for devices that cannot run WebGL. */
export function Fallback({ reason }) {
  const [sel, setSel] = useState(null); // { object, planet }
  return (
    <main className="fallback">
      <header className="fallback-head">
        <p className="hero-eyebrow mono">JAIPUR · एक चाय हो जाए?</p>
        <h1>BUILT ON CHAI.<br /><span>POWERED BY CODE.</span></h1>
        <p className="hero-sub">Computer Science student. AI/ML explorer. Developer by curiosity. Creator by instinct.</p>
        <p className="note">{reason ?? 'The 3D street needs WebGL, which is not available here. This is the same portfolio as a simple list.'}</p>
      </header>
      <div className="fallback-grid">
        {streetObjects.map((o, i) => (
          <section key={o.id} className="fallback-card">
            <p className="mono eyebrow">{String(i + 1).padStart(2, '0')} · {o.role.toUpperCase()}</p>
            <h2>{o.title} <span lang="hi">{o.hindi}</span></h2>
            <ul>
              {getVisiblePlanets(o).map((p) => {
                if (p.contactKey) {
                  const link = getContactLinks([p.contactKey])[0];
                  return (
                    <li key={p.id}>
                      <a className="btn ghost" href={link.href} {...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{p.title} ↗</a>
                    </li>
                  );
                }
                return (
                  <li key={p.id}>
                    <button type="button" className="btn ghost" onClick={() => setSel({ object: o, planet: p })}>{p.title}</button>
                  </li>
                );
              })}
              {getVisiblePlanets(o).length === 0 && <li className="note">{o.emptyNote}</li>}
            </ul>
          </section>
        ))}
      </div>
      <AnimatePresence>
        {sel && (
          <div className="fallback-modal" onClick={(e) => e.target === e.currentTarget && setSel(null)}>
            <ContentPanel object={sel.object} planet={sel.planet} variant="page" onBack={() => setSel(null)} onStreet={() => setSel(null)} />
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
