import { test, expect } from '@playwright/test';

test.describe('baseline', () => {
	test('extension is loaded and BX.Baseline is available', async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('domcontentloaded');

		const hasBaseline = await page.evaluate(() => {
			return typeof BX !== 'undefined'
				&& typeof BX.Baseline !== 'undefined'
				&& typeof BX.Baseline.check === 'function';
		});

		expect(hasBaseline).toBe(true);
	});

	test('modern browser — supported, no banner shown', async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('domcontentloaded');

		const result = await page.evaluate(() => {
			return BX.Baseline.check();
		});

		expect(result.status).toBe('supported');
		expect(result.browser).not.toBeNull();
		expect(result.browser?.version).toBeGreaterThan(0);

		const banner = await page.locator('div[style*="sticky"]').first();
		await expect(banner).not.toBeVisible();
	});

	test('outdated browser — banner is shown', async ({ browser }) => {
		const context = await browser.newContext({
			userAgent: 'Mozilla/5.0 (Windows NT 6.1; rv:52.0) Gecko/20100101 Firefox/52.0',
		});
		const page = await context.newPage();

		await page.goto('/');
		await page.waitForLoadState('domcontentloaded');

		const result = await page.evaluate(() => {
			return BX.Baseline.check();
		});

		expect(result.status).toBe('unsupported');
		expect(result.browser?.name).toBe('firefox');
		expect(result.browser?.version).toBe(52);

		const banner = page.locator('div[style*="sticky"]').first();
		await expect(banner).toBeVisible();

		await context.close();
	});

	test('banner contains details link', async ({ browser }) => {
		const context = await browser.newContext({
			userAgent: 'Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.1; Trident/6.0)',
		});
		const page = await context.newPage();

		await page.goto('/');
		await page.waitForLoadState('domcontentloaded');

		const banner = page.locator('div[style*="sticky"]').first();
		await expect(banner).toBeVisible();

		const link = banner.locator('a');
		await expect(link).toBeVisible();
		await expect(link).toHaveAttribute('target', '_blank');

		await context.close();
	});

	test('banner closes on button click', async ({ browser }) => {
		const context = await browser.newContext({
			userAgent: 'Mozilla/5.0 (Windows NT 6.1; rv:52.0) Gecko/20100101 Firefox/52.0',
		});
		const page = await context.newPage();

		await page.goto('/');
		await page.evaluate(() => localStorage.clear());
		await page.reload();
		await page.waitForLoadState('domcontentloaded');

		const banner = page.locator('div[style*="sticky"]').first();
		await expect(banner).toBeVisible();

		const closeBtn = banner.locator('button');
		await closeBtn.click();

		await expect(banner).not.toBeVisible();

		await context.close();
	});

	test('banner does not reappear after dismiss', async ({ browser }) => {
		const context = await browser.newContext({
			userAgent: 'Mozilla/5.0 (Windows NT 6.1; rv:52.0) Gecko/20100101 Firefox/52.0',
		});
		const page = await context.newPage();

		await page.goto('/');
		await page.evaluate(() => localStorage.clear());
		await page.reload();
		await page.waitForLoadState('domcontentloaded');

		const banner = page.locator('div[style*="sticky"]').first();
		await expect(banner).toBeVisible();

		const closeBtn = banner.locator('button');
		await closeBtn.click();
		await expect(banner).not.toBeVisible();

		await page.reload();
		await page.waitForLoadState('domcontentloaded');

		const bannerAfterReload = page.locator('div[style*="sticky"]').first();
		await expect(bannerAfterReload).not.toBeVisible();

		await context.close();
	});
});
