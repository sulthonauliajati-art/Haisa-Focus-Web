'use client';

import { useEffect, useRef } from 'react';

export function MonetagInPagePush() {
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;

    const script = document.createElement('script');
    script.dataset.zone = '10302350';
    script.src = 'https://nap5k.com/tag.min.js';
    document.body.appendChild(script);

    return () => {
      // Cleanup not needed as Monetag manages its own lifecycle
    };
  }, []);

  return null;
}

export default MonetagInPagePush;
