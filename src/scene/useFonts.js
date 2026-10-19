import { useEffect, useState } from 'react';
import { loadFonts } from './textures';

export function useFontsReady() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let alive = true;
    loadFonts().then(() => alive && setReady(true));
    return () => { alive = false; };
  }, []);
  return ready;
}
