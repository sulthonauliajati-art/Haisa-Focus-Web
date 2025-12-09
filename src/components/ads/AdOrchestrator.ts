import type { AdProvider, AdSlotId, AdSlotConfig } from '@/types';
import type { AdConfig, AdSlotState, AdProviderAdapter } from './types';
import { DEFAULT_AD_CONFIG } from './types';

type SlotStateMap = Map<AdSlotId, AdSlotState>;
type LoadCallback = (slotId: AdSlotId, state: AdSlotState) => void;

export class AdOrchestrator {
  private config: AdConfig;
  private slotStates: SlotStateMap = new Map();
  private observers: Map<AdSlotId, IntersectionObserver> = new Map();
  private adapters: Map<AdProvider, AdProviderAdapter> = new Map();
  private loadCallbacks: Set<LoadCallback> = new Set();
  private adsenseActive: boolean = false;
  private loadedSlots: Set<AdSlotId> = new Set();
  private mobileSlotCount: number = 0;

  constructor(config: Partial<AdConfig> = {}) {
    this.config = { ...DEFAULT_AD_CONFIG, ...config };
    this.initializeSlotStates();
  }

  private initializeSlotStates(): void {
    for (const slot of this.config.slots) {
      this.slotStates.set(slot.id, {
        loaded: false,
        filled: false,
        currentProvider: null,
        error: null,
      });
    }
  }

  // Register ad provider adapter
  registerAdapter(adapter: AdProviderAdapter): void {
    this.adapters.set(adapter.name, adapter);
  }

  // Subscribe to slot state changes
  onSlotStateChange(callback: LoadCallback): () => void {
    this.loadCallbacks.add(callback);
    return () => this.loadCallbacks.delete(callback);
  }

  private notifyStateChange(slotId: AdSlotId, state: AdSlotState): void {
    Array.from(this.loadCallbacks).forEach(callback => {
      callback(slotId, state);
    });
  }

  // Check if device is mobile
  private isMobile(): boolean {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 1024;
  }

  // Get slot configuration
  getSlotConfig(slotId: AdSlotId): AdSlotConfig | undefined {
    return this.config.slots.find(s => s.id === slotId);
  }

  // Check if slot should be enabled for current device
  isSlotEnabledForDevice(slotId: AdSlotId): boolean {
    const slot = this.getSlotConfig(slotId);
    if (!slot) return false;

    const device = this.isMobile() ? 'mobile' : 'desktop';
    return slot.enabledDevices.includes(device);
  }


  // Check mobile slot limit
  canLoadMobileSlot(): boolean {
    if (!this.isMobile()) return true;
    return this.mobileSlotCount < this.config.mobileSlotLimit;
  }

  // Get slot sizes for current device
  getSlotSizes(slotId: AdSlotId): [number, number][] {
    const slot = this.getSlotConfig(slotId);
    if (!slot) return [];

    return this.isMobile() ? slot.sizes.mobile : slot.sizes.desktop;
  }

  // Register slot for visibility-based loading
  registerSlot(slotId: AdSlotId, element: HTMLElement): void {
    const slot = this.getSlotConfig(slotId);
    if (!slot || !slot.lazy) {
      // Non-lazy slots load immediately
      this.triggerLoad(slotId, element);
      return;
    }

    // Use IntersectionObserver for lazy loading
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !this.loadedSlots.has(slotId)) {
            this.triggerLoad(slotId, element);
            observer.disconnect();
          }
        }
      },
      { rootMargin: '100px', threshold: 0 }
    );

    observer.observe(element);
    this.observers.set(slotId, observer);
  }

  // Unregister slot
  unregisterSlot(slotId: AdSlotId): void {
    const observer = this.observers.get(slotId);
    if (observer) {
      observer.disconnect();
      this.observers.delete(slotId);
    }
  }

  // Trigger ad loading with waterfall fallback
  async triggerLoad(slotId: AdSlotId, container: HTMLElement): Promise<void> {
    if (this.loadedSlots.has(slotId)) return;
    if (!this.isSlotEnabledForDevice(slotId)) return;
    if (!this.canLoadMobileSlot()) return;

    const slot = this.getSlotConfig(slotId);
    if (!slot) return;

    this.loadedSlots.add(slotId);
    if (this.isMobile()) {
      this.mobileSlotCount++;
    }

    // Update state to loading
    const loadingState: AdSlotState = {
      loaded: false,
      filled: false,
      currentProvider: null,
      error: null,
    };
    this.slotStates.set(slotId, loadingState);
    this.notifyStateChange(slotId, loadingState);

    // Try providers in waterfall order
    const providers = this.getAvailableProviders(slot.providers);
    
    for (const provider of providers) {
      const adapter = this.adapters.get(provider);
      if (!adapter || !adapter.isAvailable()) continue;

      // Check AdSense policy compliance
      if (this.adsenseActive && (provider === 'adsterra' || provider === 'monetag')) {
        // Skip popunder/onClick formats when AdSense is active
        continue;
      }

      try {
        const filled = await this.loadWithTimeout(adapter, slotId, container, 5000);
        
        if (filled) {
          if (provider === 'adsense') {
            this.adsenseActive = true;
          }

          const successState: AdSlotState = {
            loaded: true,
            filled: true,
            currentProvider: provider,
            error: null,
          };
          this.slotStates.set(slotId, successState);
          this.notifyStateChange(slotId, successState);
          return;
        }
      } catch (error) {
        console.warn(`Ad provider ${provider} failed for slot ${slotId}:`, error);
        // Continue to next provider
      }
    }

    // All providers failed
    const failedState: AdSlotState = {
      loaded: true,
      filled: false,
      currentProvider: null,
      error: 'All providers failed to fill',
    };
    this.slotStates.set(slotId, failedState);
    this.notifyStateChange(slotId, failedState);
  }

  // Load with timeout
  private async loadWithTimeout(
    adapter: AdProviderAdapter,
    slotId: AdSlotId,
    container: HTMLElement,
    timeoutMs: number
  ): Promise<boolean> {
    return Promise.race([
      adapter.load(slotId, container),
      new Promise<boolean>((_, reject) =>
        setTimeout(() => reject(new Error('Ad load timeout')), timeoutMs)
      ),
    ]);
  }

  // Get available providers (filter disabled ones)
  private getAvailableProviders(providers: AdProvider[]): AdProvider[] {
    return providers.filter(p => {
      const providerConfig = this.config.providers[p];
      return providerConfig?.enabled;
    });
  }

  // Get slot state
  getSlotState(slotId: AdSlotId): AdSlotState | undefined {
    return this.slotStates.get(slotId);
  }

  // Check if AdSense is active on page
  isAdSenseActive(): boolean {
    return this.adsenseActive;
  }

  // Get mobile slot count
  getMobileSlotCount(): number {
    return this.mobileSlotCount;
  }

  // Cleanup
  destroy(): void {
    Array.from(this.observers.values()).forEach(observer => {
      observer.disconnect();
    });
    this.observers.clear();
    this.loadCallbacks.clear();
    this.loadedSlots.clear();
  }
}

// Singleton instance
let orchestratorInstance: AdOrchestrator | null = null;

export function getAdOrchestrator(config?: Partial<AdConfig>): AdOrchestrator {
  if (!orchestratorInstance) {
    orchestratorInstance = new AdOrchestrator(config);
  }
  return orchestratorInstance;
}

export function resetAdOrchestrator(): void {
  if (orchestratorInstance) {
    orchestratorInstance.destroy();
    orchestratorInstance = null;
  }
}

export default AdOrchestrator;
