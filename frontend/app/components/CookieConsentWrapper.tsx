"use client";

import { useCookieConsent } from '../contexts/CookieContext';
import CookieConsentBanner from './CookieConsent';

// TypeScript declarations for global window properties
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
    fbq?: {
      (...args: any[]): void;
      callMethod?: (...args: any[]) => void;
      push?: (...args: any[]) => void;
      loaded?: boolean;
      version?: string;
      queue?: any[];
    };
  }
}

export default function CookieConsentWrapper() {
  const { acceptAll, declineAll, loadScripts } = useCookieConsent();

  const loadAnalyticsScripts = () => {
    if (typeof window !== 'undefined') {
      // Google Analytics (placeholder - replace with actual tracking ID)
      console.log('Analytics scripts would be loaded here');
      // const analyticsScripts = [
      //   {
      //     id: 'google-analytics',
      //     src: 'https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX',
      //     type: 'analytics' as const,
      //     async: true
      //   }
      // ];
      // loadScripts(analyticsScripts);
    }
  };

  const loadMarketingScripts = () => {
    if (typeof window !== 'undefined') {
      // Facebook Pixel (placeholder - replace with actual pixel ID)
      console.log('Marketing scripts would be loaded here');
      // const marketingScripts = [
      //   {
      //     id: 'facebook-pixel',
      //     src: 'https://connect.facebook.net/en_US/fbevents.js',
      //     type: 'marketing' as const,
      //     async: true
      //   }
      // ];
      // loadScripts(marketingScripts);
    }
  };

  return (
    <CookieConsentBanner 
      onAccept={() => {
        acceptAll();
        loadAnalyticsScripts();
        loadMarketingScripts();
      }}
      onDecline={() => {
        declineAll();
        console.log('Analytics and marketing declined');
      }}
    />
  );
} 