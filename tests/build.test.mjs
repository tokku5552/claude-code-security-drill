// Smoke tests over the static build output. Run `pnpm build` first.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { URL } from 'node:url';

const DIST = new URL('../dist/', import.meta.url);
const SITE_PREFIX = 'https://tokku5552.github.io/claude-code-security-drill/';
const BASE_PATH = '/claude-code-security-drill/';
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
  const srcs = [...html.matchAll(/<script[^>]*src="([^"]+)"/g)]
    .map((m) => m[1])
    .filter((src) => src.startsWith(BASE_PATH));
  assert.ok(srcs.length > 0, 'no local module script found');
  for (const src of srcs) {
    readDist(src.slice(BASE_PATH.length));
  }
  readDist(ogImagePath(html));
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
