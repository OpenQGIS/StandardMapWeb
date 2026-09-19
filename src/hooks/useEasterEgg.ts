import { useState, useEffect, useCallback } from 'react';
import { THEME_PACKS, type ThemeTexts } from '../data/i18nTheme';

const _K_EGG = atob('ZWdn');
const _K_THEME = atob('dGhlbWU=');
const _K_MODE = atob('bW9kZQ==');
const _V_WUXIA = atob('d3V4aWE=');
const _V_HEFU = atob('aGVmdQ==');
const _V_MODERN = atob('bW9kZXJu');

const _STORAGE_KEY_PREF = '_sgdb_pref';
const _STORAGE_KEY_MODAL = '_sgdb_modal';

export function useEasterEgg() {
  const [isWuxia, setIsWuxia] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;

    // 1. URL parameters check (Base64 decoded)
    const urlParams = new URLSearchParams(window.location.search);
    const tp = (urlParams.get(_K_THEME) || urlParams.get(_K_MODE) || '').toLowerCase();
    const ep = (urlParams.get(_K_EGG) || '').toLowerCase();

    if (tp === _V_WUXIA || tp === _V_HEFU || ep === '1' || ep === _V_WUXIA || ep === _V_HEFU) {
      try {
        sessionStorage.setItem(_STORAGE_KEY_PREF, '1');
      } catch {
        // Ignore
      }
      return true;
    }

    if (tp === _V_MODERN || ep === '0' || ep === _V_MODERN) {
      try {
        sessionStorage.setItem(_STORAGE_KEY_PREF, '0');
        sessionStorage.removeItem(_STORAGE_KEY_MODAL);
      } catch {
        // Ignore
      }
      return false;
    }

    // Default visit: Always strictly standard modern website by default!
    // Never trigger randomly, and clear any legacy accidental session flag
    try {
      const existing = sessionStorage.getItem(_STORAGE_KEY_PREF);
      if (existing === '1') {
        sessionStorage.removeItem(_STORAGE_KEY_PREF);
        sessionStorage.removeItem(_STORAGE_KEY_MODAL);
      }
    } catch {
      // Ignore
    }
    return false;
  });

  const [showRitualModal, setShowRitualModal] = useState<boolean>(false);
  const [showToast, setShowToast] = useState<boolean>(false);

  // Sync theme classes, title, and manage single-session ritual modal
  useEffect(() => {
    if (isWuxia) {
      document.documentElement.classList.add('theme-wuxia');
      document.title = '九域合符 · 山河对勘工坊';

      // Check session-level non-intrusive status for modal
      let modalSeen = false;
      try {
        modalSeen = sessionStorage.getItem(_STORAGE_KEY_MODAL) === '1';
      } catch {
        // Ignore
      }

      if (!modalSeen) {
        const timer = setTimeout(() => {
          setShowRitualModal(true);
        }, 300);
        return () => clearTimeout(timer);
      }
    } else {
      document.documentElement.classList.remove('theme-wuxia');
      document.title = '勘准图 KanZhun · 标准底图与自绘复刻比较';
      setShowRitualModal(false);
      setShowToast(false);
    }
  }, [isWuxia]);

  const closeRitualModal = useCallback(() => {
    setShowRitualModal(false);
    try {
      sessionStorage.setItem(_STORAGE_KEY_MODAL, '1');
    } catch {
      // Ignore
    }
  }, []);

  const toggleWuxia = useCallback(() => {
    setIsWuxia((prev) => {
      const next = !prev;
      try {
        sessionStorage.setItem(_STORAGE_KEY_PREF, next ? '1' : '0');
      } catch {
        // Ignore
      }
      return next;
    });
  }, []);

  const dismissToast = useCallback(() => {
    setShowToast(false);
  }, []);

  const texts: ThemeTexts = isWuxia ? THEME_PACKS.wuxia : THEME_PACKS.modern;

  return {
    isWuxia,
    texts,
    toggleWuxia,
    showRitualModal,
    closeRitualModal,
    showToast,
    dismissToast,
  };
}
