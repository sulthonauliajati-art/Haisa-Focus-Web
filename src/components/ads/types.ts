import type { AdProvider, AdSlotId, AdSlotConfig } from '@/types';

export interface AdProviderConfig {
  adsense: { clientId: string; enabled: boolean };
  adsterra: { key: string; enabled: boolean };
  monetag: { zoneId: string; enabled: boolean };
}

export interface AdConfig {
  enabled: boolean;
  slots: AdSlotConfig[];
  providers: AdProviderConfig;
  mobileSlotLimit: number;
}

export interface AdSlotState {
  loaded: boolean;
  filled: boolean;
  currentProvider: AdProvider | null;
  error: string | null;
}

export interface AdProviderAdapter {
  name: AdProvider;
  load: (slotId: AdSlotId, container: HTMLElement) => Promise<boolean>;
  isAvailable: () => boolean;
}

export const DEFAULT_AD_CONFIG: AdConfig = {
  enabled: true,
  slots: [
    {
      id: 'AD_TOP_LEADERBOARD',
      sizes: {
        desktop: [[728, 90], [970, 90]],
        mobile: [[320, 100], [320, 50]],
      },
      providers: ['adsense', 'adsterra', 'monetag'],
      enabledDevices: ['desktop', 'mobile'],
      enabledPages: ['app', 'landing'],
      lazy: true,
      sticky: false,
    },
    {
      id: 'AD_SIDE_RAIL_1',
      sizes: {
        desktop: [[160, 600], [300, 600]],
        mobile: [],
      },
      providers: ['adsense', 'adsterra'],
      enabledDevices: ['desktop'],
      enabledPages: ['app'],
      lazy: true,
      sticky: true,
    },
    {
      id: 'AD_SIDE_RAIL_2',
      sizes: {
        desktop: [[160, 600], [300, 600]],
        mobile: [],
      },
      providers: ['adsense', 'adsterra'],
      enabledDevices: ['desktop'],
      enabledPages: ['app'],
      lazy: true,
      sticky: true,
    },
    {
      id: 'AD_BOTTOM',
      sizes: {
        desktop: [[728, 90]],
        mobile: [[320, 100], [300, 250]],
      },
      providers: ['adsense', 'adsterra', 'monetag'],
      enabledDevices: ['desktop', 'mobile'],
      enabledPages: ['app', 'landing'],
      lazy: true,
      sticky: false,
    },
  ],
  providers: {
    adsense: { clientId: '', enabled: false },
    adsterra: { key: '', enabled: false },
    monetag: { zoneId: '', enabled: false },
  },
  mobileSlotLimit: 3,
};
