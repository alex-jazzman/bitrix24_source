import { test as base } from '@playwright/test';

export const test = base.extend({
	page: async ({ browser }, use) => {
		const { BASE_URL = '', LOGIN = '', PASSWORD = '' } = process.env

		if (!BASE_URL || !LOGIN || !PASSWORD)
		{
			throw new Error(
				'Missing login credentials. ' +
				'Create a .env.test file in the project root and define BASE_URL, LOGIN, ' +
				'and PASSWORD for authentication.' +
			'');
		}

		const context = await browser.newContext();
		const page = await context.newPage();

		await page.goto('/auth/');
		await page.waitForSelector('form[name="form_auth"]');
		await page.fill('input[name="USER_LOGIN"]', LOGIN);
		await page.fill('input[name="USER_PASSWORD"]', PASSWORD);
		await page.click('button[type="submit"]');
		await page.waitForSelector('form[name="form_auth"]', { state: 'hidden' });

		await use(page);
		await context.close();
	},
});

export { expect } from '@playwright/test';
