import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Shield, Cookie } from 'lucide-react';

export default function CookieConsent({ enabled = true }) {
  const { t } = useTranslation();
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      setTimeout(() => setShowBanner(true), 800);
    }
  }, [enabled]);

  if (!enabled) return null;

  const handleAcceptAll = () => {
    localStorage.setItem('cookieConsent', JSON.stringify({
      necessary: true, analytics: true, marketing: true,
      timestamp: new Date().toISOString()
    }));
    setShowBanner(false);
    setShowSettings(false);
  };

  const handleAcceptEssential = () => {
    localStorage.setItem('cookieConsent', JSON.stringify({
      necessary: true, analytics: false, marketing: false,
      timestamp: new Date().toISOString()
    }));
    setShowBanner(false);
    setShowSettings(false);
  };

  const handleSavePreferences = () => {
    localStorage.setItem('cookieConsent', JSON.stringify({
      necessary: true, analytics: true, marketing: true,
      timestamp: new Date().toISOString()
    }));
    setShowBanner(false);
    setShowSettings(false);
  };

  if (!showBanner) return null;

  return (
    <>
      {/* ─── Bottom Bar ─── */}
      {!showSettings && (
        <div
          className="fixed bottom-0 left-0 right-0 z-[9999] animate-slide-up"
          style={{
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
            boxShadow: '0 -4px 24px rgba(0,0,0,0.15)',
          }}
        >
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
            {/* Close button */}
            <button
              onClick={handleAcceptEssential}
              className="absolute top-2 right-2 sm:top-3 sm:right-3 w-7 h-7 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-all duration-200 z-10"
              aria-label="Close cookie notice"
            >
              <X size={14} />
            </button>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6">
              {/* Icon + Text */}
              <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                <div className="hidden sm:flex w-10 h-10 rounded-full bg-white/10 flex-shrink-0 items-center justify-center">
                  <Cookie size={20} className="text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-white text-sm sm:text-base font-semibold leading-tight">
                    {t('cookies.title', 'We use cookies')}
                  </p>
                  <p className="text-white/70 text-xs sm:text-sm leading-relaxed mt-0.5">
                    {t('cookies.description', 'We use cookies to improve your experience. By continuing, you agree to our use of cookies.')}
                  </p>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto">
                <button
                  onClick={() => setShowSettings(true)}
                  className="flex-1 sm:flex-none px-3.5 py-2 text-xs sm:text-sm font-medium text-white/80 border border-white/20 rounded-lg hover:bg-white/10 hover:text-white transition-all duration-200"
                >
                  {t('cookies.settings', 'Settings')}
                </button>
                <button
                  onClick={handleAcceptEssential}
                  className="flex-1 sm:flex-none px-3.5 py-2 text-xs sm:text-sm font-medium text-white/80 bg-white/10 rounded-lg hover:bg-white/20 hover:text-white transition-all duration-200"
                >
                  {t('cookies.reject', 'Reject')}
                </button>
                <button
                  onClick={handleAcceptAll}
                  className="flex-1 sm:flex-none px-4 py-2 text-xs sm:text-sm font-bold text-[#1a1a2e] bg-white rounded-lg hover:bg-white/90 transition-all duration-200 shadow-lg"
                >
                  {t('cookies.accept_all', 'Accept')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Settings Modal ─── */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden">
            {/* Header */}
            <div className="p-5 pb-3">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#1a1a2e] rounded-full flex items-center justify-center">
                    <Shield size={20} className="text-white" />
                  </div>
                  <h2 className="font-display text-lg font-bold text-text-primary">
                    {t('cookies.settings_title', 'Cookie Settings')}
                  </h2>
                </div>
                <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-surface rounded-lg transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between py-2.5 px-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{t('cookies.necessary', 'Necessary')}</p>
                    <p className="text-xs text-text-muted mt-0.5">{t('cookies.necessary_desc', 'Required for cart & checkout')}</p>
                  </div>
                  <span className="text-xs text-green-600 font-medium px-2 py-1 bg-green-50 rounded-full">
                    {t('cookies.required', 'Required')}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2.5 px-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-text-primary">{t('cookies.analytics', 'Analytics')}</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#1a1a2e]"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between py-2.5 px-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-text-primary">{t('cookies.marketing', 'Marketing')}</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#1a1a2e]"></div>
                  </label>
                </div>
              </div>
            </div>

            <div className="p-5 pt-3 border-t border-border">
              <button
                onClick={handleSavePreferences}
                className="w-full px-4 py-3 text-sm font-bold text-white bg-[#1a1a2e] rounded-lg hover:bg-[#2a2a4e] transition-colors shadow-lg"
              >
                {t('cookies.save', 'Save Preferences')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slide-up animation keyframes */}
      <style>{`
        @keyframes cookieSlideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up {
          animation: cookieSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </>
  );
}
