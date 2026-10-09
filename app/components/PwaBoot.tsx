"use client";

import { useEffect } from 'react';

/**
 * Installed-PWA-only ivory launch screen with the owner's actual ZESHU logo.
 * Regular browser visits do not display the overlay. Do not wait forever:
 * a CSS fallback and JS timer always release the storefront.
 */
export default function PwaBoot() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      void navigator.serviceWorker.register('/sw.js').catch(() => {
        // Install support is best-effort; never block the storefront.
      });
    }

    const overlay = document.getElementById('zeshu-installed-app-splash');
    if (!overlay) return;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
      ('standalone' in navigator && (navigator as Navigator & { standalone?: boolean }).standalone === true);
    if (!isStandalone) {
      overlay.remove();
      return;
    }

    const startedAt = performance.now();
    let fadeTimer = 0;
    let removalTimer = 0;
    const dismiss = () => {
      const remaining = Math.max(0, 850 - (performance.now() - startedAt));
      fadeTimer = window.setTimeout(() => {
        overlay.classList.add('is-leaving');
        removalTimer = window.setTimeout(() => overlay.remove(), 350);
      }, remaining);
    };

    if (document.readyState === 'complete') {
      dismiss();
    } else {
      window.addEventListener('load', dismiss, { once: true });
    }

    const failsafe = window.setTimeout(() => overlay.remove(), 5500);
    return () => {
      window.clearTimeout(failsafe);
      window.clearTimeout(fadeTimer);
      window.clearTimeout(removalTimer);
      window.removeEventListener('load', dismiss);
    };
  }, []);

  return <div id="zeshu-installed-app-splash" className="zeshu-installed-app-splash"
    role="status" aria-label="Opening Zeshu">
    <img src="/zeshu-glossy-icon.png" alt="Zeshu" width={256} height={256} decoding="async" />
  </div>;
}
