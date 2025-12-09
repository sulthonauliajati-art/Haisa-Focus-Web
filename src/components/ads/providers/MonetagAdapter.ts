import type { AdSlotId } from '@/types';
import type { AdProviderAdapter } from '../types';

export interface MonetagConfig {
  zoneId: string;
  enabled: boolean;
}

let scriptLoaded = false;
let scriptLoading = false;

async function loadMonetagScript(zoneId: string): Promise<void> {
  if (scriptLoaded) return;
  if (scriptLoading) {
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
    script.src = `//thubanoa.com/${zoneId}/invoke.js`;
    script.async = true;
    script.setAttribute('data-cfasync', 'false');

    script.onload = () => {
      scriptLoaded = true;
      scriptLoading = false;
      resolve();
    };

    script.onerror = () => {
      scriptLoading = false;
      reject(new Error('Failed to load Monetag script'));
    };

    document.head.appendChild(script);
  });
}

export function createMonetagAdapter(config: MonetagConfig): AdProviderAdapter {
  return {
    name: 'monetag',

    isAvailable: () => {
      return config.enabled && !!config.zoneId;
    },

    load: async (slotId: AdSlotId, container: HTMLElement): Promise<boolean> => {
      if (!config.enabled || !config.zoneId) {
        return false;
      }

      try {
        await loadMonetagScript(config.zoneId);

        // Create Monetag ad container
        const adDiv = document.createElement('div');
        adDiv.id = `monetag-${slotId}`;
        adDiv.setAttribute('data-monetag-zone', config.zoneId);
        
        container.appendChild(adDiv);

        return true;
      } catch (error) {
        console.warn('Monetag load failed:', error);
        return false;
      }
    },
  };
}

export default createMonetagAdapter;
