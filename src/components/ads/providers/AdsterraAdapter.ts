import type { AdSlotId } from '@/types';
import type { AdProviderAdapter } from '../types';

export interface AdsterraConfig {
  key: string;
  enabled: boolean;
}

let scriptLoaded = false;
let scriptLoading = false;

async function loadAdsterraScript(key: string): Promise<void> {
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
    script.src = `//www.highperformanceformat.com/${key}/invoke.js`;
    script.async = true;

    script.onload = () => {
      scriptLoaded = true;
      scriptLoading = false;
      resolve();
    };

    script.onerror = () => {
      scriptLoading = false;
      reject(new Error('Failed to load Adsterra script'));
    };

    document.head.appendChild(script);
  });
}

export function createAdsterraAdapter(config: AdsterraConfig): AdProviderAdapter {
  return {
    name: 'adsterra',

    isAvailable: () => {
      return config.enabled && !!config.key;
    },

    load: async (slotId: AdSlotId, container: HTMLElement): Promise<boolean> => {
      if (!config.enabled || !config.key) {
        return false;
      }

      try {
        await loadAdsterraScript(config.key);

        // Create Adsterra ad container
        const adDiv = document.createElement('div');
        adDiv.id = `adsterra-${slotId}`;
        adDiv.setAttribute('data-adsterra-slot', slotId);
        
        container.appendChild(adDiv);

        return true;
      } catch (error) {
        console.warn('Adsterra load failed:', error);
        return false;
      }
    },
  };
}

export default createAdsterraAdapter;
