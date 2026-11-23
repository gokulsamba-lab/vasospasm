import React, { useState } from 'react';
import { Download01, Phone01, XClose } from '@untitledui/icons';
import { useOnlineStatus, usePWAInstall } from '../hooks/usePWAInstall';
import { Button } from './ui/button';

interface PWAInstallButtonProps {
  variant?: 'compact' | 'full';
}

export function PWAInstallButton({ variant = 'compact' }: PWAInstallButtonProps) {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) {
    if (variant === 'full') {
      return (
        <div className="glass-well rounded-2xl p-3.5 text-xs flex items-center justify-between gap-2 text-emerald-700 dark:text-emerald-300">
          <span className="font-medium">Running as Installed Mobile App</span>
          <span className="font-mono text-[11px] font-semibold">Standalone</span>
        </div>
      );
    }
    return null;
  }

  const handleAction = async () => {
    if (isInstallable) {
      await install();
      return;
    }
    setShowGuide(true);
  };

  // In compact header mode, show directly if installable or on iOS; in full menu/settings mode, always offer install/guide
  if (variant === 'compact' && !isInstallable && !isIOS) {
    return null;
  }

  return (
    <>
      {variant === 'full' ? (
        <Button
          type="button"
          onClick={() => void handleAction()}
          className="w-full min-h-[44px] justify-center"
        >
          <Download01 className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>
            {isInstallable
              ? 'Install VasoSense Mobile App'
              : isIOS
              ? 'Install on iPhone / iPad'
              : 'Add to Home Screen'}
          </span>
        </Button>
      ) : (
        <Button
          type="button"
          size="sm"
          onClick={() => void handleAction()}
          className="min-h-[36px] px-2.5 text-xs whitespace-nowrap shrink-0"
        >
          <Download01 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span className="hidden sm:inline">{isIOS ? 'Install iOS App' : 'Install App'}</span>
          <span className="sm:hidden">Install</span>
        </Button>
      )}

      {showGuide && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-slate-950/60 backdrop-blur-sm p-0 sm:p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="pwa-install-guide-title"
            className="glass-surface w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))]"
          >
            <div className="w-10 h-1.5 bg-slate-300 dark:bg-slate-600 rounded-full mx-auto sm:hidden" aria-hidden="true" />

            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-400/30 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                  <Phone01 className="w-4 h-4" aria-hidden="true" />
                </span>
                <div>
                  <h3 id="pwa-install-guide-title" className="text-base font-semibold text-slate-900 dark:text-white">
                    {isIOS ? 'Install on iPhone / iPad' : 'Install VasoSense App'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Launch full-screen with offline caching
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                aria-label="Close installation guide"
                className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/10"
              >
                <XClose className="w-4 h-4" />
              </button>
            </div>

            {isIOS ? (
              <ol className="space-y-2.5 text-xs text-slate-700 dark:text-slate-200 glass-well rounded-2xl p-4">
                <li>1. Tap the <strong>Share</strong> button in Safari&apos;s bottom or top toolbar.</li>
                <li>2. Scroll down and select <strong>Add to Home Screen</strong>.</li>
                <li>3. Tap <strong>Add</strong> to launch VasoSense Clinical as a standalone mobile app.</li>
              </ol>
            ) : (
              <ol className="space-y-2.5 text-xs text-slate-700 dark:text-slate-200 glass-well rounded-2xl p-4">
                <li>1. Open this app in Chrome, Edge, or Android browser (outside an embedded preview frame).</li>
                <li>2. Tap the browser menu (<strong>⋮</strong>) and choose <strong>Install app</strong> or <strong>Add to Home screen</strong>.</li>
                <li>3. Launch VasoSense from your home screen with Web Bluetooth BLE support.</li>
              </ol>
            )}

            <Button
              type="button"
              variant="outline"
              onClick={() => setShowGuide(false)}
              className="w-full min-h-[44px]"
            >
              Done
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="no-print mx-3 sm:mx-6 mt-2 px-3.5 py-2 rounded-xl bg-amber-500/90 text-white text-xs font-medium flex items-center justify-between gap-2 shadow-sm"
    >
      <span>Offline Mode — Cached app shell and local telemetry active</span>
    </div>
  );
}
