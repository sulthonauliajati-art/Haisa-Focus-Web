'use client';

import { useEffect, useRef } from 'react';

interface AdsterraNativeBannerProps {
  className?: string;
}

export function AdsterraNativeBanner({ className = '' }: AdsterraNativeBannerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptLoaded = useRef(false);

  useEffect(() => {
    if (scriptLoaded.current || !containerRef.current) return;

    // Create the container div
    const adContainer = document.createElement('div');
    adContainer.id = 'container-8c75886c3a795ab2d1a7e6629fed5f80';
    containerRef.current.appendChild(adContainer);

    // Create and load the script
    const script = document.createElement('script');
    script.async = true;
    script.setAttribute('data-cfasync', 'false');
    script.src = '//pl28226768.effectivegatecpm.com/8c75886c3a795ab2d1a7e6629fed5f80/invoke.js';
    
    containerRef.current.appendChild(script);
    scriptLoaded.current = true;

    return () => {
      // Cleanup on unmount
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
      scriptLoaded.current = false;
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className={`adsterra-native-banner ${className}`}
    />
  );
}

export default AdsterraNativeBanner;
