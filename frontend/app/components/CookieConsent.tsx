"use client";

import { useState } from 'react';
import CookieConsent from 'react-cookie-consent';

interface CookieConsentProps {
  onAccept: () => void;
  onDecline: () => void;
}

export default function CookieConsentBanner({ onAccept, onDecline }: CookieConsentProps) {
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState({
    necessary: true, // Always true, can't be disabled
    analytics: false,
    marketing: false
  });

  const handleAcceptAll = () => {
    setPreferences({
      necessary: true,
      analytics: true,
      marketing: true
    });
    onAccept();
  };

  const handleAcceptSelected = () => {
    onAccept();
    setShowPreferences(false);
  };

  const handleDecline = () => {
    setPreferences({
      necessary: true,
      analytics: false,
      marketing: false
    });
    onDecline();
  };

  return (
    <>
      <CookieConsent
        location="bottom"
        buttonText="Accept All"
        declineButtonText="Decline"
        cookieName="labubu_cookie_consent"
        style={{
          background: "white",
          borderTop: "1px solid #e5e7eb",
          boxShadow: "0 -4px 6px -1px rgba(0, 0, 0, 0.1)",
          padding: "1rem",
          zIndex: 9999
        }}
        buttonStyle={{
          background: "#2563eb",
          color: "white",
          fontSize: "14px",
          padding: "8px 16px",
          borderRadius: "8px",
          border: "none",
          marginLeft: "8px"
        }}
        declineButtonStyle={{
          background: "transparent",
          color: "#6b7280",
          fontSize: "14px",
          padding: "8px 16px",
          borderRadius: "8px",
          border: "1px solid #d1d5db",
          marginLeft: "8px"
        }}
        onAccept={handleAcceptAll}
        onDecline={handleDecline}
        enableDeclineButton
        expires={365}
      >
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                We use cookies to enhance your experience
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                We use cookies to analyze site traffic, personalize content, and provide social media features. 
                By clicking "Accept All", you consent to our use of cookies. 
                <a 
                  href="/legal" 
                  className="text-blue-600 hover:text-blue-800 underline ml-1"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Learn more
                </a>
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => setShowPreferences(true)}
                className="text-sm text-gray-600 hover:text-gray-800 underline"
              >
                Customize
              </button>
            </div>
          </div>
        </div>
      </CookieConsent>

      {/* Cookie Preferences Modal */}
      {showPreferences && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[10000]">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Cookie Preferences
            </h3>
            
            <div className="space-y-4 mb-6">
              {/* Necessary Cookies */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">Necessary Cookies</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Essential for the website to function properly. Cannot be disabled.
                  </p>
                </div>
                <div className="ml-4">
                  <input
                    type="checkbox"
                    checked={preferences.necessary}
                    disabled
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Analytics Cookies */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">Analytics Cookies</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Help us understand how visitors interact with our website.
                  </p>
                </div>
                <div className="ml-4">
                  <input
                    type="checkbox"
                    checked={preferences.analytics}
                    onChange={(e) => setPreferences(prev => ({ ...prev, analytics: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Marketing Cookies */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">Marketing Cookies</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Used to deliver personalized advertisements and content.
                  </p>
                </div>
                <div className="ml-4">
                  <input
                    type="checkbox"
                    checked={preferences.marketing}
                    onChange={(e) => setPreferences(prev => ({ ...prev, marketing: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowPreferences(false)}
                className="flex-1 py-2 px-4 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAcceptSelected}
                className="flex-1 py-2 px-4 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
              >
                Accept Selected
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 