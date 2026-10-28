import { expect, test } from '@playwright/test';

const SITE_URL = 'https://tokku5552.github.io/claude-code-security-drill';
const TOTAL = 10;
const TITLES = {
  ja: 'Claude Code セキュリティ理解度チェック',
  en: 'Claude Code Security Quiz',
} as const;

test.beforeEach(async ({ page }) => {
  // Keep third-party requests out of the test. Fulfill rather than abort so
  // blocked requests do not show up as console errors.
  await page.route(
    /googletagmanager\.com|fonts\.googleapis\.com|fonts\.gstatic\.com/,
    (route) =>
      route.fulfill({ status: 200, contentType: 'text/plain', body: '' }),
  );
});

for (const lang of ['ja', 'en'] as const) {
  test(`quiz runs end to end in ${lang}`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('./');
    await page.locator(`[data-lang-btn="${lang}"]`).click();

    const shareDir = lang === 'en' ? '/share/en' : '/share';
    await expect(page.locator('html')).toHaveAttribute('lang', lang);
    await expect(page).toHaveTitle(TITLES[lang]);
    await expect(page.locator(`[data-lang-btn="${lang}"]`)).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    const introHref = await page.locator('#intro-share-x').getAttribute('href');
    expect(new URL(introHref!).searchParams.get('url')).toBe(
      `${SITE_URL}${shareDir}/top.html`,
    );

    await page.locator('#start-btn').click();
    await expect(page.locator('#quiz-screen')).toHaveClass(/active/);

    for (let i = 0; i < TOTAL; i++) {
      await expect(page.locator('#q-number')).toContainText(
        String(i + 1).padStart(2, '0'),
      );
      await page.locator('#options .option').first().click();
      await expect(page.locator('#explanation')).toHaveClass(/show/);
      await page.locator('#next-btn').click();
    }

    await expect(page.locator('#result-screen')).toHaveClass(/active/);
    await expect(page.locator('#breakdown-list .breakdown-item')).toHaveCount(
      TOTAL,
    );
    const score = Number(await page.locator('#final-score').textContent()) / 10;
    expect(Number.isInteger(score) && score >= 0 && score <= TOTAL).toBe(true);
    await expect(page.locator('#rank-name')).not.toHaveText('—');

    const shareHref = await page.locator('#share-x').getAttribute('href');
    expect(shareHref).not.toBeNull();
    const shareUrl = new URL(shareHref!);
    expect(shareUrl.origin + shareUrl.pathname).toBe(
      'https://twitter.com/intent/tweet',
    );
    expect(shareUrl.searchParams.get('url')).toBe(
      `${SITE_URL}${shareDir}/${score}.html`,
    );

    expect(errors).toEqual([]);
  });
}
