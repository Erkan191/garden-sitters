const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const origin = process.env.DIRECTORY_ORIGIN || 'https://www.watchmyplot.com';
    if (process.env.DIRECTORY_SHARE_URL) await page.goto(process.env.DIRECTORY_SHARE_URL);
    await page.goto(`${origin}/sitters`);
    await page.getByText(/Showing \d+ of \d+ sitters?/).waitFor({ timeout: 30000 });
    const count = await page.getByText(/Showing \d+ of \d+ sitters?/).innerText();
    const names = await page.locator('h3').allTextContents();
    const ids = await page.locator('a[href^="/users/"]').evaluateAll(links => links.map(link => link.getAttribute('href').split('/').pop()));
    console.log(JSON.stringify({ count, names, ids, errors }, null, 2));
    if (process.env.EXPECTED_SITTERS && names.length !== Number(process.env.EXPECTED_SITTERS)) throw new Error('Unexpected sitter count');
    if (errors.length) throw new Error('Browser errors found');
    if (names.length) {
      await page.locator('a[href^="/users/"]').first().click();
      await page.getByRole('heading', { name: names[0], exact: true }).waitFor();
      console.log('Public profile navigation passed');
    }
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
