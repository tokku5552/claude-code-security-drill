// Smoke tests over the static build output. Run `pnpm build` first.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { URL } from 'node:url';

const DIST = new URL('../dist/', import.meta.url);
const SITE_PREFIX = 'https://tokku5552.github.io/claude-code-security-drill/';
const BASE_PATH = '/claude-code-security-drill/';
const GA_ID = 'G-HHSP83ZXQF';
const SHARE_PAGES = [...Array.from({ length: 11 }, (_, i) => `${i}`), 'top'];

function readDist(path) {
  const url = new URL(path, DIST);
  assert.ok(existsSync(url), `dist/${path} is missing (run \`pnpm build\`)`);
  return readFileSync(url, 'utf8');
}

function ogImagePath(html) {
  const match = html.match(/<meta property="og:image" content="([^"]+)"/);
  assert.ok(match, 'og:image meta is missing');
  assert.ok(
    match[1].startsWith(SITE_PREFIX),
    `og:image points outside the site: ${match[1]}`,
  );
  return match[1].slice(SITE_PREFIX.length);
}

test('index.html renders all quiz screens', () => {
  const html = readDist('index.html');
  for (const id of ['intro-screen', 'quiz-screen', 'result-screen']) {
    assert.ok(html.includes(`id="${id}"`), `#${id} is missing`);
  }
});

test('index.html references assets that exist', () => {
  const html = readDist('index.html');
  const srcs = localScripts(html);
  assert.ok(srcs.length > 0, 'no local module script found');
  for (const src of srcs) {
    readDist(src.slice(BASE_PATH.length));
  }
  readDist(ogImagePath(html));
});

function localScripts(html) {
  return [...html.matchAll(/<script[^>]*src="([^"]+)"/g)]
    .map((m) => m[1])
    .filter((src) => src.startsWith(BASE_PATH));
}

test('og:url and twitter:image use site + base', () => {
  const html = readDist('index.html');
  assert.match(html, /<meta property="og:url" content="([^"]+)"/);
  const ogUrl = html.match(/<meta property="og:url" content="([^"]+)"/)[1];
  assert.equal(ogUrl, SITE_PREFIX);
  const twitterImage = html.match(
    /<meta name="twitter:image" content="([^"]+)"/,
  );
  assert.ok(twitterImage, 'twitter:image meta is missing');
  assert.equal(twitterImage[1], `${SITE_PREFIX}og/cover.png`);
});

test('client script and CSS are bundled under assets/', () => {
  const html = readDist('index.html');
  const srcs = localScripts(html);
  for (const src of srcs) {
    assert.ok(
      src.startsWith(`${BASE_PATH}assets/`),
      `script outside assets/: ${src}`,
    );
  }

  // Astro may inline small stylesheets or emit a linked file, so accept both.
  const inlineCss = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)]
    .map((m) => m[1])
    .join('\n');
  const linkedCss = [...html.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)]
    .map((m) => m[1])
    .filter((href) => href.startsWith(BASE_PATH))
    .map((href) => {
      assert.ok(
        href.startsWith(`${BASE_PATH}assets/`),
        `stylesheet outside assets/: ${href}`,
      );
      return readDist(href.slice(BASE_PATH.length));
    })
    .join('\n');
  const css = `${inlineCss}\n${linkedCss}`;
  // Tokens from src/styles/tokens.css and a selector from quiz.css.
  assert.ok(css.includes('--ink-faint'), 'tokens.css is not in the bundle');
  assert.ok(css.includes('.quiz-screen'), 'quiz.css is not in the bundle');
});

test('GA4 snippet is emitted with the measurement ID', () => {
  const html = readDist('index.html');
  assert.ok(
    html.includes(`googletagmanager.com/gtag/js?id=${GA_ID}`),
    'gtag.js loader is missing',
  );
  const inline = [
    ...html.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g),
  ]
    .map((m) => m[1])
    .find((body) => body.includes('dataLayer'));
  assert.ok(inline, 'inline gtag bootstrap is missing');
  assert.ok(inline.includes(GA_ID), 'define:vars did not inject the GA ID');
  assert.ok(inline.includes("'config'"), 'gtag config call is missing');
});

test('client bundle has the site URL baked in from import.meta.env', () => {
  const html = readDist('index.html');
  const bundle = localScripts(html)
    .map((src) => readDist(src.slice(BASE_PATH.length)))
    .join('\n');
  assert.ok(
    bundle.includes(SITE_PREFIX.replace(/\/$/, '')),
    'SITE_URL is not inlined into the client bundle',
  );
  assert.ok(!bundle.includes('import.meta.env'), 'import.meta.env left as-is');
});

for (const lang of ['ja', 'en']) {
  const dir = lang === 'en' ? 'share/en/' : 'share/';
  for (const page of SHARE_PAGES) {
    test(`${dir}${page}.html points og:image at an existing PNG`, () => {
      const html = readDist(`${dir}${page}.html`);
      readDist(ogImagePath(html));
    });
  }
}
