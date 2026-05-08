import type { Lang, Translations, UiStrings } from '../types';
import ja from './ja';
import en from './en';

const STORAGE_KEY = 'ccsd:lang';
const tables: Record<Lang, Translations> = { ja, en };

let currentLang: Lang = 'ja';
const listeners = new Set<(lang: Lang) => void>();

function detectInitialLang(): Lang {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'ja' || stored === 'en') return stored;
  } catch {
    /* localStorage may be unavailable */
  }
  if (typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('en')) {
    return 'en';
  }
  return 'ja';
}

export function initI18n(): Lang {
  currentLang = detectInitialLang();
  applyStaticTranslations();
  return currentLang;
}

export function getLang(): Lang {
  return currentLang;
}

export function getTranslations(): Translations {
  return tables[currentLang];
}

export function setLang(lang: Lang): void {
  if (lang === currentLang) return;
  currentLang = lang;
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    /* ignore */
  }
  applyStaticTranslations();
  listeners.forEach((cb) => cb(lang));
}

export function onLangChange(cb: (lang: Lang) => void): void {
  listeners.add(cb);
}

function readKey(ui: UiStrings, key: string): string | undefined {
  const parts = key.split('.');
  let cur: unknown = ui;
  for (const p of parts) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  return typeof cur === 'string' ? cur : undefined;
}

function applyStaticTranslations(): void {
  const t = tables[currentLang];
  document.documentElement.lang = currentLang;
  document.title = t.ui.htmlTitle;

  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (!key) return;
    const v = readKey(t.ui, key);
    if (typeof v === 'string') el.textContent = v;
  });
  document.querySelectorAll<HTMLElement>('[data-i18n-html]').forEach((el) => {
    const key = el.getAttribute('data-i18n-html');
    if (!key) return;
    const v = readKey(t.ui, key);
    if (typeof v === 'string') el.innerHTML = v;
  });

  document.querySelectorAll<HTMLButtonElement>('[data-lang-btn]').forEach((btn) => {
    btn.setAttribute(
      'aria-pressed',
      String(btn.getAttribute('data-lang-btn') === currentLang),
    );
  });
}
