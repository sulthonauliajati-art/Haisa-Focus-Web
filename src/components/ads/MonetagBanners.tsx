'use client';

import { useEffect, useRef } from 'react';

// Banner 728x90 - Desktop Leaderboard
export function MonetagBanner728x90({ className = '' }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current || !containerRef.current) return;
    loaded.current = true;

    const optionsScript = document.createElement('script');
    optionsScript.type = 'text/javascript';
    optionsScript.text = `
      atOptions = {
        'key' : 'cbb634bf57073c7f85e821adbb66b015',
        'format' : 'iframe',
        'height' : 90,
        'width' : 728,
        'params' : {}
      };
    `;
    containerRef.current.appendChild(optionsScript);

    const invokeScript = document.createElement('script');
    invokeScript.type = 'text/javascript';
    invokeScript.src = 'https://www.highperformanceformat.com/cbb634bf57073c7f85e821adbb66b015/invoke.js';
    containerRef.current.appendChild(invokeScript);
  }, []);

  return (
    <div ref={containerRef} className={`flex justify-center ${className}`} style={{ minHeight: '90px' }} />
  );
}

// Banner 320x50 - Mobile Banner
export function MonetagBanner320x50({ className = '' }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current || !containerRef.current) return;
    loaded.current = true;

    const optionsScript = document.createElement('script');
    optionsScript.type = 'text/javascript';
    optionsScript.text = `
      atOptions = {
        'key' : 'c2fda93a8fa0129d6b355b1c75cede15',
        'format' : 'iframe',
        'height' : 50,
        'width' : 320,
        'params' : {}
      };
    `;
    containerRef.current.appendChild(optionsScript);

    const invokeScript = document.createElement('script');
    invokeScript.type = 'text/javascript';
    invokeScript.src = 'https://www.highperformanceformat.com/c2fda93a8fa0129d6b355b1c75cede15/invoke.js';
    containerRef.current.appendChild(invokeScript);
  }, []);

  return (
    <div ref={containerRef} className={`flex justify-center ${className}`} style={{ minHeight: '50px' }} />
  );
}


// Banner 468x60 - Medium Banner
export function MonetagBanner468x60({ className = '' }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current || !containerRef.current) return;
    loaded.current = true;

    const optionsScript = document.createElement('script');
    optionsScript.type = 'text/javascript';
    optionsScript.text = `
      atOptions = {
        'key' : '02aff8809191d819a2f89484cffbe6c0',
        'format' : 'iframe',
        'height' : 60,
        'width' : 468,
        'params' : {}
      };
    `;
    containerRef.current.appendChild(optionsScript);

    const invokeScript = document.createElement('script');
    invokeScript.type = 'text/javascript';
    invokeScript.src = 'https://www.highperformanceformat.com/02aff8809191d819a2f89484cffbe6c0/invoke.js';
    containerRef.current.appendChild(invokeScript);
  }, []);

  return (
    <div ref={containerRef} className={`flex justify-center ${className}`} style={{ minHeight: '60px' }} />
  );
}

// Vignette Banner - Full screen overlay ad
export function MonetagVignette() {
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;

    const script = document.createElement('script');
    script.dataset.zone = '10315220';
    script.src = 'https://gizokraijaw.net/vignette.min.js';
    document.body.appendChild(script);
  }, []);

  return null;
}

// Banner 160x600 - Wide Skyscraper (Sidebar)
export function MonetagBanner160x600({ className = '' }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current || !containerRef.current) return;
    loaded.current = true;

    const optionsScript = document.createElement('script');
    optionsScript.type = 'text/javascript';
    optionsScript.text = `
      atOptions = {
        'key' : 'b160abe33499019d62924f0de459787d',
        'format' : 'iframe',
        'height' : 600,
        'width' : 160,
        'params' : {}
      };
    `;
    containerRef.current.appendChild(optionsScript);

    const invokeScript = document.createElement('script');
    invokeScript.type = 'text/javascript';
    invokeScript.src = 'https://www.highperformanceformat.com/b160abe33499019d62924f0de459787d/invoke.js';
    containerRef.current.appendChild(invokeScript);
  }, []);

  return (
    <div ref={containerRef} className={`flex justify-center ${className}`} style={{ minHeight: '600px', width: '160px' }} />
  );
}

// Banner 160x300 - Half Skyscraper (Sidebar)
export function MonetagBanner160x300({ className = '' }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current || !containerRef.current) return;
    loaded.current = true;

    const optionsScript = document.createElement('script');
    optionsScript.type = 'text/javascript';
    optionsScript.text = `
      atOptions = {
        'key' : '6217819c7b1d9f8495cea98271f46e99',
        'format' : 'iframe',
        'height' : 300,
        'width' : 160,
        'params' : {}
      };
    `;
    containerRef.current.appendChild(optionsScript);

    const invokeScript = document.createElement('script');
    invokeScript.type = 'text/javascript';
    invokeScript.src = 'https://www.highperformanceformat.com/6217819c7b1d9f8495cea98271f46e99/invoke.js';
    containerRef.current.appendChild(invokeScript);
  }, []);

  return (
    <div ref={containerRef} className={`flex justify-center ${className}`} style={{ minHeight: '300px', width: '160px' }} />
  );
}

// Banner 300x250 - Medium Rectangle
export function MonetagBanner300x250({ className = '' }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current || !containerRef.current) return;
    loaded.current = true;

    const optionsScript = document.createElement('script');
    optionsScript.type = 'text/javascript';
    optionsScript.text = `
      atOptions = {
        'key' : 'a490d7f22edbd4191396e225b05ad5a9',
        'format' : 'iframe',
        'height' : 250,
        'width' : 300,
        'params' : {}
      };
    `;
    containerRef.current.appendChild(optionsScript);

    const invokeScript = document.createElement('script');
    invokeScript.type = 'text/javascript';
    invokeScript.src = 'https://www.highperformanceformat.com/a490d7f22edbd4191396e225b05ad5a9/invoke.js';
    containerRef.current.appendChild(invokeScript);
  }, []);

  return (
    <div ref={containerRef} className={`flex justify-center ${className}`} style={{ minHeight: '250px' }} />
  );
}
