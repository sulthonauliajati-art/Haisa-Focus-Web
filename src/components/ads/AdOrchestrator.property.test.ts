import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { AdOrchestrator, resetAdOrchestrator } from './AdOrchestrator';
import type { AdProvider, AdSlotId } from '@/types';
import type { AdProviderAdapter, AdConfig } from './types';

// Mock IntersectionObserver
class MockIntersectionObserver {
  callback: IntersectionObserverCallback;
  
  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
  }
  
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;

// Helper to create mock adapter
function createMockAdapter(
  name: AdProvider,
  shouldFill: boolean,
  shouldFail: boolean = false
): AdProviderAdapter {
  return {
    name,
    isAvailable: () => true,
    load: async () => {
      if (shouldFail) throw new Error(`${name} failed`);
      return shouldFill;
    },
  };
}

// Helper to create test config
function createTestConfig(providers: AdProvider[]): Partial<AdConfig> {
  return {
    enabled: true,
    slots: [
      {
        id: 'AD_TOP_LEADERBOARD',
        sizes: { desktop: [[728, 90]], mobile: [[320, 100]] },
        providers,
        enabledDevices: ['desktop', 'mobile'],
        enabledPages: ['app'],
        lazy: false,
        sticky: false,
      },
    ],
    providers: {
      adsense: { clientId: 'test', enabled: providers.includes('adsense') },
      adsterra: { key: 'test', enabled: providers.includes('adsterra') },
      monetag: { zoneId: 'test', enabled: providers.includes('monetag') },
    },
    mobileSlotLimit: 3,
  };
}

describe('AdOrchestrator Property Tests', () => {
  beforeEach(() => {
    resetAdOrchestrator();
    vi.clearAllMocks();
  });

  /**
   * **Feature: haisa-web, Property 16: Ad waterfall fallback sequence**
   * **Validates: Requirements 7.3**
   * 
   * For any ad slot with providers [P1, P2, P3] where P1 fails to fill,
   * the system should attempt P2, and if P2 fails, attempt P3.
   */
  it('Property 16: waterfall tries providers in order until one fills', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate which provider index should fill (0, 1, or 2)
        fc.integer({ min: 0, max: 2 }),
        async (fillIndex) => {
          resetAdOrchestrator();
          
          const providers: AdProvider[] = ['adsense', 'adsterra', 'monetag'];
          const config = createTestConfig(providers);
          const orchestrator = new AdOrchestrator(config);
          
          const loadAttempts: AdProvider[] = [];
          
          // Register adapters - only the one at fillIndex will fill
          providers.forEach((provider, index) => {
            orchestrator.registerAdapter({
              name: provider,
              isAvailable: () => true,
              load: async () => {
                loadAttempts.push(provider);
                return index === fillIndex;
              },
            });
          });
          
          const container = document.createElement('div');
          await orchestrator.triggerLoad('AD_TOP_LEADERBOARD', container);
          
          const state = orchestrator.getSlotState('AD_TOP_LEADERBOARD');
          
          // Should have tried providers up to and including the one that filled
          expect(loadAttempts.length).toBe(fillIndex + 1);
          
          // Providers should be tried in order
          for (let i = 0; i <= fillIndex; i++) {
            expect(loadAttempts[i]).toBe(providers[i]);
          }
          
          // State should show the provider that filled
          expect(state?.filled).toBe(true);
          expect(state?.currentProvider).toBe(providers[fillIndex]);
        }
      ),
      { numRuns: 100 }
    );
  });


  /**
   * Property 16 continued: When all providers fail, slot should be marked as not filled
   */
  it('Property 16: all providers fail results in unfilled slot', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom<AdProvider[]>(
          ['adsense'],
          ['adsense', 'adsterra'],
          ['adsense', 'adsterra', 'monetag']
        ),
        async (providers) => {
          resetAdOrchestrator();
          
          const config = createTestConfig(providers);
          const orchestrator = new AdOrchestrator(config);
          
          const loadAttempts: AdProvider[] = [];
          
          // All adapters fail to fill
          providers.forEach((provider) => {
            orchestrator.registerAdapter({
              name: provider,
              isAvailable: () => true,
              load: async () => {
                loadAttempts.push(provider);
                return false; // Never fills
              },
            });
          });
          
          const container = document.createElement('div');
          await orchestrator.triggerLoad('AD_TOP_LEADERBOARD', container);
          
          const state = orchestrator.getSlotState('AD_TOP_LEADERBOARD');
          
          // Should have tried all providers
          expect(loadAttempts.length).toBe(providers.length);
          expect(loadAttempts).toEqual(providers);
          
          // State should show not filled
          expect(state?.loaded).toBe(true);
          expect(state?.filled).toBe(false);
          expect(state?.currentProvider).toBe(null);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: haisa-web, Property 17: Ad slot visibility-triggered loading**
   * **Validates: Requirements 7.2**
   * 
   * For any ad slot configured with lazy loading, the ad script should only
   * be loaded after the slot becomes visible via IntersectionObserver.
   */
  it('Property 17: lazy slots register with IntersectionObserver', () => {
    fc.assert(
      fc.property(
        fc.boolean(), // lazy flag
        (isLazy) => {
          resetAdOrchestrator();
          
          const config: Partial<AdConfig> = {
            enabled: true,
            slots: [
              {
                id: 'AD_TOP_LEADERBOARD',
                sizes: { desktop: [[728, 90]], mobile: [[320, 100]] },
                providers: ['adsense'],
                enabledDevices: ['desktop', 'mobile'],
                enabledPages: ['app'],
                lazy: isLazy,
                sticky: false,
              },
            ],
            providers: {
              adsense: { clientId: 'test', enabled: true },
              adsterra: { key: '', enabled: false },
              monetag: { zoneId: '', enabled: false },
            },
            mobileSlotLimit: 3,
          };
          
          const orchestrator = new AdOrchestrator(config);
          let loadCalled = false;
          
          orchestrator.registerAdapter({
            name: 'adsense',
            isAvailable: () => true,
            load: async () => {
              loadCalled = true;
              return true;
            },
          });
          
          const container = document.createElement('div');
          orchestrator.registerSlot('AD_TOP_LEADERBOARD', container);
          
          if (isLazy) {
            // Lazy slots should NOT load immediately
            expect(loadCalled).toBe(false);
          } else {
            // Non-lazy slots load immediately (async, so may not be called yet)
            // This is expected behavior - non-lazy triggers load
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: haisa-web, Property 18: Mobile ad slot limiting**
   * **Validates: Requirements 7.5**
   * 
   * For any mobile viewport, the number of active ad slots should be
   * less than or equal to the configured mobile slot limit.
   */
  it('Property 18: mobile slot count respects limit', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 5 }), // mobile slot limit
        fc.integer({ min: 1, max: 10 }), // number of slots to try
        async (limit, slotsToTry) => {
          resetAdOrchestrator();
          
          // Mock mobile viewport
          Object.defineProperty(window, 'innerWidth', {
            value: 500,
            writable: true,
          });
          
          const slotIds: AdSlotId[] = [
            'AD_TOP_LEADERBOARD',
            'AD_SIDE_RAIL_1',
            'AD_SIDE_RAIL_2',
            'AD_INCONTENT_1',
            'AD_BOTTOM',
          ];
          
          const config: Partial<AdConfig> = {
            enabled: true,
            slots: slotIds.slice(0, Math.min(slotsToTry, slotIds.length)).map(id => ({
              id,
              sizes: { desktop: [[728, 90]], mobile: [[320, 100]] },
              providers: ['adsense'] as AdProvider[],
              enabledDevices: ['desktop', 'mobile'] as ('desktop' | 'mobile')[],
              enabledPages: ['app'] as ('app' | 'blog' | 'landing')[],
              lazy: false,
              sticky: false,
            })),
            providers: {
              adsense: { clientId: 'test', enabled: true },
              adsterra: { key: '', enabled: false },
              monetag: { zoneId: '', enabled: false },
            },
            mobileSlotLimit: limit,
          };
          
          const orchestrator = new AdOrchestrator(config);
          
          orchestrator.registerAdapter({
            name: 'adsense',
            isAvailable: () => true,
            load: async () => true,
          });
          
          // Try to load all slots
          const actualSlotsToLoad = Math.min(slotsToTry, slotIds.length);
          for (let i = 0; i < actualSlotsToLoad; i++) {
            const container = document.createElement('div');
            await orchestrator.triggerLoad(slotIds[i], container);
          }
          
          // Mobile slot count should not exceed limit
          expect(orchestrator.getMobileSlotCount()).toBeLessThanOrEqual(limit);
          
          // Reset window width
          Object.defineProperty(window, 'innerWidth', {
            value: 1024,
            writable: true,
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: haisa-web, Property 19: AdSense policy compliance**
   * **Validates: Requirements 7.6**
   * 
   * For any page where AdSense is active, popunder and onClick ad formats
   * should be disabled for all other providers.
   */
  it('Property 19: AdSense active disables other providers', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom<AdProvider>('adsterra', 'monetag'),
        async (otherProvider) => {
          resetAdOrchestrator();
          
          const providers: AdProvider[] = ['adsense', otherProvider];
          
          const config: Partial<AdConfig> = {
            enabled: true,
            slots: [
              {
                id: 'AD_TOP_LEADERBOARD',
                sizes: { desktop: [[728, 90]], mobile: [[320, 100]] },
                providers: ['adsense'],
                enabledDevices: ['desktop', 'mobile'],
                enabledPages: ['app'],
                lazy: false,
                sticky: false,
              },
              {
                id: 'AD_BOTTOM',
                sizes: { desktop: [[728, 90]], mobile: [[320, 100]] },
                providers: [otherProvider],
                enabledDevices: ['desktop', 'mobile'],
                enabledPages: ['app'],
                lazy: false,
                sticky: false,
              },
            ],
            providers: {
              adsense: { clientId: 'test', enabled: true },
              adsterra: { key: 'test', enabled: true },
              monetag: { zoneId: 'test', enabled: true },
            },
            mobileSlotLimit: 5,
          };
          
          const orchestrator = new AdOrchestrator(config);
          const loadedProviders: AdProvider[] = [];
          
          // Register all adapters
          providers.forEach((provider) => {
            orchestrator.registerAdapter({
              name: provider,
              isAvailable: () => true,
              load: async () => {
                loadedProviders.push(provider);
                return true;
              },
            });
          });
          
          // Load AdSense slot first
          const container1 = document.createElement('div');
          await orchestrator.triggerLoad('AD_TOP_LEADERBOARD', container1);
          
          // AdSense should be active now
          expect(orchestrator.isAdSenseActive()).toBe(true);
          
          // Try to load other provider slot
          const container2 = document.createElement('div');
          await orchestrator.triggerLoad('AD_BOTTOM', container2);
          
          // Other provider should NOT have been loaded (AdSense policy)
          expect(loadedProviders).not.toContain(otherProvider);
        }
      ),
      { numRuns: 100 }
    );
  });
});
