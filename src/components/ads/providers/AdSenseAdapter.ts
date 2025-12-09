import type { AdSlotId } from '@/types';
import type { AdProviderAdapter } from '../types';

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    adsbygoogle?: any[];
  }
}

export interface AdSenseConfig {
  clientId: string;
  enabled: boolean;
}

let scriptLoaded = false;
let scriptLoading = false;

async function loadAdSenseScript(clientId: string): Promise<void> {
  if (scriptLoaded) return;
  if (scriptLoading) {
    // Wait for existing load
    return new Promise((resolve) => {
      const checkLoaded = setInterval(() => {
        if (scriptLoaded) {
          clearInterval(checkLoaded);
          resolve();
        }
      }, 100);
    });
  }

  scriptLoading = true;

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`;
    script.async = true;
    script.crossOrigin = 'anonymous';

    script.onload = () => {
      scriptLoaded = true;
      scriptLoading = false;
      resolve();
    };

    script.onerror = () => {
      scriptLoading = false;
      reject(new Error('Failed to load AdSense script'));
    };

    document.head.appendChild(script);
  });
}

export function createAdSenseAdapter(config: AdSenseConfig): AdProviderAdapter {
  return {
    name: 'adsense',

    isAvailable: () => {
      return config.enabled && !!config.clientId;
    },

    load: async (slotId: AdSlotId, container: HTMLElement): Promise<boolean> => {
      if (!config.enabled || !config.clientId) {
        return false;
      }

      try {
        await loadAdSenseScript(config.clientId);

        // Create ad unit element
        const ins = document.createElement('ins');
        ins.className = 'adsbygoogle';
        ins.style.display = 'block';
        ins.setAttribute('data-ad-client', config.clientId);
        ins.setAttribute('data-ad-slot', slotId);
        ins.setAttribute('data-ad-format', 'auto');
        ins.setAttribute('data-full-width-responsive', 'true');

        container.appendChild(ins);

        // Push ad request
        (window.adsbygoogle = window.adsbygoogle || []).push({});

        return true;
      } catch (error) {
        console.warn('AdSense load failed:', error);
        return false;
      }
    },
  };
}

export default createAdSenseAdapter;
