'use client';

import { useEffect, useRef, useState } from 'react';
import type { AdSlotId } from '@/types';
import { getAdOrchestrator } from './AdOrchestrator';
import type { AdSlotState } from './types';

interface AdSlotProps {
  slotId: AdSlotId;
  className?: string;
}

export function AdSlot({ slotId, className = '' }: AdSlotProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [slotState, setSlotState] = useState<AdSlotState | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    const orchestrator = getAdOrchestrator();
    
    // Check if slot is enabled for current device
    if (!orchestrator.isSlotEnabledForDevice(slotId)) {
      return;
    }

    // Get slot sizes for current device
    const sizes = orchestrator.getSlotSizes(slotId);
    if (sizes.length > 0) {
      // Use first size as default dimensions
      setDimensions({ width: sizes[0][0], height: sizes[0][1] });
    }

    // Subscribe to state changes
    const unsubscribe = orchestrator.onSlotStateChange((id, state) => {
      if (id === slotId) {
        setSlotState(state);
      }
    });

    // Register slot for loading
    if (containerRef.current) {
      orchestrator.registerSlot(slotId, containerRef.current);
    }

    return () => {
      unsubscribe();
      orchestrator.unregisterSlot(slotId);
    };
  }, [slotId]);

  // Don't render if no dimensions (slot not enabled for device)
  if (!dimensions) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={`ad-slot ${className}`}
      data-slot-id={slotId}
      style={{
        minWidth: dimensions.width,
        minHeight: dimensions.height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {!slotState?.loaded && (
        <div 
          className="bg-gray-100 rounded animate-pulse"
          style={{ width: dimensions.width, height: dimensions.height }}
        />
      )}
      {slotState?.loaded && !slotState.filled && (
        <div 
          className="bg-gray-50 rounded flex items-center justify-center text-gray-300 text-xs"
          style={{ width: dimensions.width, height: dimensions.height }}
        >
          Ad Space
        </div>
      )}
    </div>
  );
}

export default AdSlot;
