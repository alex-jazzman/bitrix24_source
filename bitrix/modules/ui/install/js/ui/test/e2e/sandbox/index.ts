import { test as base } from '@playwright/test';

type Sandbox = {
	page: import('@playwright/test').Page;
	setLang: (lang: string) => void;
	loadExtension: (extension: string | string[]) => Promise<void>;
	mount: (callback: (selector: string) => void) => Promise<void>;
};

const CONTAINER_SELECTOR = '#sandbox';

export const test = base.extend<{ sandbox: Sandbox }>({
	sandbox: async ({ page }, use) => {
		let lang: string | undefined;

		await use({
			page,
			setLang: (value: string) => {
				lang = value;
			},
			loadExtension: async (extension: string | string[]) => {
				const names = Array.isArray(extension) ? extension.join(',') : extension;
				const url = new URL('/dev/ui/cli/component-wrapper.php', 'http://localhost');
				url.searchParams.set('extension', names);

				if (lang)
				{
					url.searchParams.set('lang', lang);
				}

				await page.goto(url.pathname + url.search);
				await page.waitForLoadState('domcontentloaded');
			},
			mount: (callback: (selector: string) => void) => {
				return page.evaluate(callback, CONTAINER_SELECTOR);
			},
		});
	},
});

export { expect } from '@playwright/test';
