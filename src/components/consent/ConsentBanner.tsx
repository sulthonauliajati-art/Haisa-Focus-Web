'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const CONSENT_STORAGE_KEY = 'haisa_ad_consent';

export type ConsentType = 'personalized' | 'non-personalized' | null;

interface ConsentState {
  consent: ConsentType;
  timestamp: number;
}

function getStoredConsent(): ConsentState | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!stored) return null;
    
    const parsed = JSON.parse(stored) as ConsentState;
    // Consent expires after 365 days
    const expiryMs = 365 * 24 * 60 * 60 * 1000;
    if (Date.now() - parsed.timestamp > expiryMs) {
      localStorage.removeItem(CONSENT_STORAGE_KEY);
      return null;
    }
    
    return parsed;
  } catch {
    return null;
  }
}

function saveConsent(consent: ConsentType): void {
  if (typeof window === 'undefined') return;
  
  try {
    const state: ConsentState = {
      consent,
      timestamp: Date.now(),
    };
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(state));
  } catch {
    console.warn('Failed to save consent preference');
  }
}

export function useConsent() {
  const [consent, setConsent] = useState<ConsentType>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = getStoredConsent();
    if (stored) {
      setConsent(stored.consent);
    }
    setIsLoaded(true);
  }, []);

  const updateConsent = (newConsent: ConsentType) => {
    setConsent(newConsent);
    saveConsent(newConsent);
  };

  return { consent, isLoaded, updateConsent };
}


export function ConsentBanner() {
  const { consent, isLoaded, updateConsent } = useConsent();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show banner if no consent has been given
    if (isLoaded && consent === null) {
      setIsVisible(true);
    }
  }, [isLoaded, consent]);

  const handleAcceptAll = () => {
    updateConsent('personalized');
    setIsVisible(false);
  };

  const handleAcceptNonPersonalized = () => {
    updateConsent('non-personalized');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white border-t shadow-lg">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-1">Cookie & Ad Preferences</h3>
            <p className="text-sm text-gray-600">
              We use cookies and show ads to support our free service. You can choose to see
              personalized ads based on your interests, or non-personalized ads.{' '}
              <Link href="/privacy" className="text-blue-600 hover:underline">
                Learn more
              </Link>
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <button
              onClick={handleAcceptNonPersonalized}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Non-personalized ads
            </button>
            <button
              onClick={handleAcceptAll}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Accept personalized ads
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConsentBanner;
