/**
 * Site-level configuration. siteUrl is taken from astro.config.mjs (Astro injects
 * the full canonical URL via import.meta.env.SITE + the page's base).
 */
export const SITE_URL = `${import.meta.env.SITE ?? ''}${import.meta.env.BASE_URL ?? '/'}`.replace(
  /\/$/,
  '',
);

export const REPO_URL = 'https://github.com/tokku5552/claude-code-security-drill';
export const HASHTAGS = 'ClaudeCode,セキュリティ';
export const EVENT_TAG = '';
