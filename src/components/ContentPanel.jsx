import { motion } from 'framer-motion';
import { getContactLinks } from '../portfolioData';
import { prefersReducedMotion } from '../state';

const hasText = (v) => typeof v === 'string' && v.trim().length > 0;

function blockHasContent(block, planet) {
  switch (block.type) {
    case 'text': return hasText(block.text);
    case 'list':
    case 'tags':
    case 'timeline':
    case 'projects': return Array.isArray(block.items) && block.items.length > 0;
    case 'links': return getContactLinks(block.only).length > 0;
    default: return false;
  }
}

function Group({ children, i }) {
  const reduced = prefersReducedMotion();
  return (
    <motion.div
      className="block"
      initial={reduced ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.32 + i * 0.09, ease: [0.22, 0.8, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

function Project({ p }) {
  return (
    <article className="project">
      <header>
        <h4>{p.title}</h4>
        {p.status && <span className="badge">{p.status}</span>}
      </header>
      {p.description && <p>{p.description}</p>}
      {p.stack?.length > 0 && (
        <ul className="chips mono">{p.stack.map((s) => <li key={s}>{s}</li>)}</ul>
      )}
      {p.results?.length > 0 && (
        <ul className="plain-list">{p.results.map((r) => <li key={r}>{r}</li>)}</ul>
      )}
      {p.screenshots?.length > 0 && (
        <div className="shots">{p.screenshots.map((src) => <img key={src} src={src} alt={`${p.title} screenshot`} loading="lazy" />)}</div>
      )}
      {(p.github || p.live) && (
        <div className="project-links mono">
          {p.github && <a href={p.github} target="_blank" rel="noopener noreferrer">GitHub ↗</a>}
          {p.live && <a href={p.live} target="_blank" rel="noopener noreferrer">Live ↗</a>}
        </div>
      )}
    </article>
  );
}

function Block({ block }) {
  const head = block.heading ? <h3 className="block-h">{block.heading}</h3> : null;
  switch (block.type) {
    case 'text':
      return <>{head}<p className="lede">{block.text}</p></>;
    case 'list':
      return <>{head}<ul className="plain-list">{block.items.map((t) => <li key={t}>{t}</li>)}</ul></>;
    case 'tags':
      return <>{head}<ul className="chips mono">{block.items.map((t) => <li key={t}>{t}</li>)}</ul></>;
    case 'timeline':
      return (
        <>
          {head}
          <ol className="timeline">
            {block.items.map((it) => (
              <li key={it.title}>
                <strong>{it.title}</strong>
                {it.meta && <span className="mono meta">{it.meta}</span>}
                {it.text && <p>{it.text}</p>}
              </li>
            ))}
          </ol>
        </>
      );
    case 'projects':
      return <>{head}<div className="projects">{block.items.map((p) => <Project key={p.title} p={p} />)}</div></>;
    case 'links': {
      const links = getContactLinks(block.only);
      return (
        <>
          {head}
          <ul className="link-list">
            {links.map((l) => (
              <li key={l.key}>
                <a href={l.href} {...(l.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
                  <span className="link-label">{l.label}</span>
                  <span className="mono link-val">{l.display}</span>
                  <span aria-hidden="true">↗</span>
                </a>
              </li>
            ))}
          </ul>
        </>
      );
    }
    default:
      return null;
  }
}

/**
 * Readable HTML content for a planet. Heading first, then description, then the details in small groups.
 */
export function ContentPanel({ object, planet, onBack, onStreet, variant = 'panel' }) {
  const reduced = prefersReducedMotion();
  const blocks = (planet.blocks ?? []).filter((b) => blockHasContent(b, planet));
  const empty = blocks.length === 0;
  const idx = object.planets.findIndex((p) => p.id === planet.id) + 1;

  return (
    <motion.section
      className={`content-panel ${variant}`}
      role="dialog"
      aria-modal="false"
      aria-labelledby="panel-title"
      initial={reduced ? false : { opacity: 0, x: variant === 'panel' ? 36 : 0, y: variant === 'panel' ? 0 : 36 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={reduced ? undefined : { opacity: 0, x: variant === 'panel' ? 24 : 0, y: variant === 'panel' ? 0 : 24 }}
      transition={{ duration: 0.5, ease: [0.22, 0.8, 0.3, 1] }}
    >
      <div className="panel-top">
        <button type="button" className="btn ghost" onClick={onBack}>← {variant === 'panel' ? 'Back to orbit' : `Back to ${object.title}`}</button>
        <button type="button" className="btn ghost" onClick={onStreet}>{variant === 'panel' ? 'Back to Street' : 'Back to Street'}</button>
      </div>

      <div className="panel-scroll" data-scroll>
        <motion.p
          className="eyebrow mono"
          initial={reduced ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          {String(idx).padStart(2, '0')} / {object.title.toUpperCase()}
        </motion.p>
        <motion.h2
          id="panel-title"
          className="panel-title"
          initial={reduced ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.16, ease: [0.22, 0.8, 0.3, 1] }}
        >
          {planet.title}
          {planet.hindi && <span className="panel-hi" lang="hi">{planet.hindi}</span>}
        </motion.h2>
        {planet.blurb && (
          <motion.p
            className="panel-blurb"
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {planet.blurb}
          </motion.p>
        )}

        {blocks.map((b, i) => (
          <Group key={i} i={i}>
            <Block block={b} />
          </Group>
        ))}

        {empty && (
          <Group i={0}>
            <p className="note">{planet.emptyNote ?? 'Nothing to show here yet.'}</p>
          </Group>
        )}
      </div>
    </motion.section>
  );
}
