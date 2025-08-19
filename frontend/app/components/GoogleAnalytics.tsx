"use client";

import { useEffect } from 'react';
import { useCookieConsent } from '../contexts/CookieContext';

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

export default function GoogleAnalytics() {
  const { preferences } = useCookieConsent();
  const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID || 'G-XXXXXXXXXX';

  useEffect(() => {
    // Only load analytics if user has consented
    if (!preferences.analytics) return;

    // Load Google Analytics script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`;
    document.head.appendChild(script);

    // Initialize gtag
    window.dataLayer = window.dataLayer || [];
    function gtag(...args: any[]) {
      window.dataLayer?.push(args);
    }
    window.gtag = gtag;

    gtag('js', new Date());
    gtag('config', GA_TRACKING_ID, {
      page_title: document.title,
      page_location: window.location.href,
    });

    // Cleanup function
    return () => {
      const existingScript = document.querySelector(`script[src*="${GA_TRACKING_ID}"]`);
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, [preferences.analytics, GA_TRACKING_ID]);

  // Track page views when route changes
  useEffect(() => {
    if (!preferences.analytics || !window.gtag) return;

    const handleRouteChange = () => {
      window.gtag?.('config', GA_TRACKING_ID, {
        page_title: document.title,
        page_location: window.location.href,
      });
    };

    // Listen for route changes
    window.addEventListener('popstate', handleRouteChange);
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, [preferences.analytics, GA_TRACKING_ID]);

  return null;
} 