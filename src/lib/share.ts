import { HASHTAGS, SITE_URL } from './config';
import type { Lang } from './types';

export function buildShareUrl(score: number, lang: Lang): string {
  const langSeg = lang === 'en' ? '/en' : '';
  return `${SITE_URL}/share${langSeg}/${score}.html`;
}

export function buildXIntentUrl(
  score: number,
  lang: Lang,
  tweetText: string,
): string {
  const xUrl = new URL('https://twitter.com/intent/tweet');
  xUrl.searchParams.set('text', tweetText);
  xUrl.searchParams.set('url', buildShareUrl(score, lang));
  if (HASHTAGS) xUrl.searchParams.set('hashtags', HASHTAGS);
  return xUrl.toString();
}

export async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }
}
