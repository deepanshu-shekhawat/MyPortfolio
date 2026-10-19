import { createContext, useContext, useMemo, useReducer, useRef } from 'react';

/**
 * Phases:
 *  loading → intro → street → zooming → orbit ⇄ content → returning → street
 *
 * `goal` tells the CameraController where to fly; it reports back with ARRIVE(seq).
 * Selection is ignored while a transition is running (zooming / returning).
 */
const initial = {
  phase: 'loading',
  objectId: null,
  planetId: null,
  hoverId: null,
  goal: { kind: 'intro', seq: 0 },
  seq: 0,
};

function reducer(state, action) {
  switch (action.type) {
    case 'LOADED':
      return state.phase === 'loading' ? { ...state, phase: 'intro' } : state;
    case 'INTRO_DONE':
      return state.phase === 'intro' ? { ...state, phase: 'street', goal: { kind: 'home', seq: state.seq } } : state;
    case 'HOVER':
      return state.hoverId === action.id ? state : { ...state, hoverId: action.id };
    case 'SELECT': {
      if (state.phase !== 'street') return state;
      const seq = state.seq + 1;
      return { ...state, phase: 'zooming', objectId: action.id, planetId: null, hoverId: null, seq, goal: { kind: 'object', seq } };
    }
    case 'ARRIVE': {
      if (action.seq !== state.goal.seq) return state;
      if (state.phase === 'zooming') return { ...state, phase: 'orbit' };
      if (state.phase === 'returning') return { ...state, phase: 'street', objectId: null, planetId: null };
      return state;
    }
    case 'OPEN_PLANET': {
      if (state.phase === 'content') return state.planetId === action.id ? state : { ...state, planetId: action.id };
      if (state.phase !== 'orbit') return state;
      const seq = state.seq + 1;
      return { ...state, phase: 'content', planetId: action.id, seq, goal: { kind: 'content', seq } };
    }
    case 'BACK_TO_ORBIT': {
      if (state.phase !== 'content') return state;
      const seq = state.seq + 1;
      return { ...state, phase: 'orbit', planetId: null, seq, goal: { kind: 'object', seq } };
    }
    case 'BACK_TO_STREET': {
      if (state.phase !== 'orbit' && state.phase !== 'content') return state;
      const seq = state.seq + 1;
      return { ...state, phase: 'returning', planetId: null, seq, goal: { kind: 'home', seq } };
    }
    default:
      return state;
  }
}

export const AppCtx = createContext(null);
const Ctx = AppCtx;

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initial);
  // Mutable values shared with the render loop without triggering React renders.
  const fx = useRef({ reveal: 0, lamps: 0, dim: 0, savedPose: null, skipIntro: false });
  const value = useMemo(() => ({ state, dispatch, fx }), [state]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useApp = () => useContext(Ctx);

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export function detectWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}
