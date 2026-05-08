import '../styles/tokens.css';
import '../styles/chrome.css';
import '../styles/intro.css';
import '../styles/quiz.css';
import '../styles/result.css';

import { initI18n, setLang, getLang } from './i18n';
import type { Lang } from './types';
import { initQuiz } from './quiz';

function bindLangToggle(): void {
  document
    .querySelectorAll<HTMLButtonElement>('[data-lang-btn]')
    .forEach((btn) => {
      const target = btn.getAttribute('data-lang-btn') as Lang | null;
      if (!target) return;
      btn.addEventListener('click', () => {
        if (target !== getLang()) setLang(target);
      });
    });
}

function start(): void {
  initI18n();
  initQuiz();
  bindLangToggle();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start);
} else {
  start();
}
