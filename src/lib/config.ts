/**
 * Site-level configuration. siteUrl is taken from astro.config.mjs (Astro injects
 * the full canonical URL via import.meta.env.SITE + the page's base).
 */
export const SITE_URL =
  `${import.meta.env.SITE ?? ''}${import.meta.env.BASE_URL ?? '/'}`.replace(
    /\/$/,
    '',
  );

export const REPO_URL =
  'https://github.com/tokku5552/claude-code-security-drill';
export const HASHTAGS = 'CCSecDrill';
export const EVENT_TAG = '';

// GA4 Measurement ID. Public by design (it ships in every page's HTML and is
// visible to every visitor in the browser network tab), so there's no value
// in hiding it via a GitHub Secret. If you fork this repo, change this to
// your own ID — otherwise your traffic gets reported to the upstream property.
export const GA_MEASUREMENT_ID = 'G-HHSP83ZXQF';
