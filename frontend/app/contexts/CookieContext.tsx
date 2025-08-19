"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
}

interface CookieContextType {
  preferences: CookiePreferences;
  hasConsented: boolean;
  setPreferences: (prefs: CookiePreferences) => void;
  acceptAll: () => void;
  declineAll: () => void;
  loadScripts: (scripts: ScriptConfig[]) => void;
}

interface ScriptConfig {
  id: string;
  src: string;
  type: 'analytics' | 'marketing' | 'necessary';
  async?: boolean;
  defer?: boolean;
}

const CookieContext = createContext<CookieContextType | undefined>(undefined);

export function CookieProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    analytics: false,
    marketing: false
  });
  const [hasConsented, setHasConsented] = useState(false);
  const [loadedScripts, setLoadedScripts] = useState<Set<string>>(new Set());

  // Load saved preferences on mount
  useEffect(() => {
    const savedConsent = localStorage.getItem('labubu_cookie_consent');
    if (savedConsent) {
      try {
        const consent = JSON.parse(savedConsent);
        setPreferences(consent.preferences || preferences);
        setHasConsented(true);
      } catch (error) {
        console.error('Error parsing saved cookie consent:', error);
      }
    }
  }, []);

  const acceptAll = () => {
    const newPreferences = {
      necessary: true,
      analytics: true,
      marketing: true
    };
    setPreferences(newPreferences);
    setHasConsented(true);
    localStorage.setItem('labubu_cookie_consent', JSON.stringify({
      preferences: newPreferences,
      timestamp: new Date().toISOString()
    }));
  };

  const declineAll = () => {
    const newPreferences = {
      necessary: true,
      analytics: false,
      marketing: false
    };
    setPreferences(newPreferences);
    setHasConsented(true);
    localStorage.setItem('labubu_cookie_consent', JSON.stringify({
      preferences: newPreferences,
      timestamp: new Date().toISOString()
    }));
  };

  const updatePreferences = (newPreferences: CookiePreferences) => {
    setPreferences(newPreferences);
    setHasConsented(true);
    localStorage.setItem('labubu_cookie_consent', JSON.stringify({
      preferences: newPreferences,
      timestamp: new Date().toISOString()
    }));
  };

  const loadScripts = (scripts: ScriptConfig[]) => {
    scripts.forEach(script => {
      // Check if script should be loaded based on preferences
      const shouldLoad = 
        (script.type === 'necessary') ||
        (script.type === 'analytics' && preferences.analytics) ||
        (script.type === 'marketing' && preferences.marketing);

      if (shouldLoad && !loadedScripts.has(script.id)) {
        const scriptElement = document.createElement('script');
        scriptElement.id = script.id;
        scriptElement.src = script.src;
        scriptElement.async = script.async || false;
        scriptElement.defer = script.defer || false;
        
        document.head.appendChild(scriptElement);
        setLoadedScripts(prev => new Set(prev).add(script.id));
      }
    });
  };

  return (
    <CookieContext.Provider value={{
      preferences,
      hasConsented,
      setPreferences: updatePreferences,
      acceptAll,
      declineAll,
      loadScripts
    }}>
      {children}
    </CookieContext.Provider>
  );
}

export function useCookieConsent() {
  const context = useContext(CookieContext);
  if (context === undefined) {
    throw new Error('useCookieConsent must be used within a CookieProvider');
  }
  return context;
} 