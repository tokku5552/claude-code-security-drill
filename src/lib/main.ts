import '../styles/tokens.css';
import '../styles/chrome.css';
import '../styles/intro.css';
import '../styles/quiz.css';
import '../styles/result.css';

import { initI18n, setLang, getLang, getTranslations, onLangChange } from './i18n';
import type { Lang } from './types';
import { initQuiz } from './quiz';
import { trackEvent } from './analytics';
import { buildTopXIntentUrl } from './share';

function bindLangToggle(): void {
  document
    .querySelectorAll<HTMLButtonElement>('[data-lang-btn]')
    .forEach((btn) => {
      const target = btn.getAttribute('data-lang-btn') as Lang | null;
      if (!target) return;
      btn.addEventListener('click', () => {
        const from = getLang();
        if (target === from) return;
        trackEvent('lang_change', { from, to: target });
        setLang(target);
      });
    });
}

function bindIntroShare(): void {
  const btn = document.getElementById(
    'intro-share-x',
  ) as HTMLAnchorElement | null;
  if (!btn) return;

  const update = (): void => {
    const t = getTranslations();
    btn.href = buildTopXIntentUrl(getLang(), t.ui.shareTopTweetText);
  };
  update();
  onLangChange(update);

  btn.addEventListener('click', () => {
    trackEvent('share_click', {
      method: 'twitter',
      surface: 'intro',
      lang: getLang(),
    });
  });
}

function start(): void {
  initI18n();
  initQuiz();
  bindLangToggle();
  bindIntroShare();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start);
} else {
  start();
}
