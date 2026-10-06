import { test, expect } from 'ui.test.e2e.auth';
import { test as sandboxTest, expect as sandboxExpect } from 'ui.test.e2e.sandbox';

test('Has top menu', async ({ page }) => {
	await page.goto('/online');

	await expect(page.locator('.app__header')).toBeVisible();
});

test('Check online page', async ({ page }) => {
	await page.goto('/online');

	await expect(page.locator('#messenger-embedded-application')).toBeVisible();
});

// ---------------------------------------------------------------------------
// Sandbox: tab-chip rendering (does not require a backend)
// ---------------------------------------------------------------------------

sandboxTest.describe('vibecodeconnector.catalog — tab chips via Catalog.show()', () => {
	sandboxTest('renders vibecode-catalog-tab-my chip when my tab present', async ({ sandbox }) => {
		await sandbox.loadExtension('vibecodeconnector.catalog');

		await sandbox.mount((selector) => {
			const { Catalog } = BX.Vibecodeconnector;
			const catalog = new Catalog({
				tabs: [
					{
						id: 'my',
						title: 'Вайбкод',
						action: 'vibecodeconnector.Catalog.myList',
						paginated: false,
					},
				],
			});
			const bindBtn = document.createElement('button');
			document.querySelector(selector).appendChild(bindBtn);
			catalog.show(bindBtn);
		});

		await sandboxExpect(sandbox.page.getByTestId('vibecode-catalog-tab-my')).toBeVisible();
	});

	sandboxTest('does NOT render vibecode-catalog-tab-market when market tab is filtered (navigateUrl=null)', async ({ sandbox }) => {
		await sandbox.loadExtension('vibecodeconnector.catalog');

		await sandbox.mount((selector) => {
			const { Catalog } = BX.Vibecodeconnector;
			// market tab with navigateUrl=null gets filtered by baseTabs filter
			const catalog = new Catalog({
				tabs: [
					{
						id: 'my',
						title: 'Вайбкод',
						action: 'vibecodeconnector.Catalog.myList',
						paginated: false,
					},
					{
						id: 'market',
						title: 'Маркет',
						action: null,
						navigateUrl: null,
					},
				],
			});
			const bindBtn = document.createElement('button');
			document.querySelector(selector).appendChild(bindBtn);
			catalog.show(bindBtn);
		});

		await sandboxExpect(sandbox.page.getByTestId('vibecode-catalog-tab-my')).toBeVisible();
		await sandboxExpect(sandbox.page.getByTestId('vibecode-catalog-tab-market')).not.toBeAttached();
	});

	sandboxTest('renders vibecode-catalog-tab-market chip when navigateUrl is set', async ({ sandbox }) => {
		await sandbox.loadExtension('vibecodeconnector.catalog');

		await sandbox.mount((selector) => {
			const { Catalog } = BX.Vibecodeconnector;
			const catalog = new Catalog({
				tabs: [
					{
						id: 'my',
						title: 'Вайбкод',
						action: 'vibecodeconnector.Catalog.myList',
						paginated: false,
					},
					{
						id: 'market',
						title: 'Маркет',
						action: null,
						icon: 'market',
						navigateUrl: '/marketplace/',
					},
				],
			});
			const bindBtn = document.createElement('button');
			document.querySelector(selector).appendChild(bindBtn);
			catalog.show(bindBtn);
		});

		await sandboxExpect(sandbox.page.getByTestId('vibecode-catalog-tab-my')).toBeVisible();
		await sandboxExpect(sandbox.page.getByTestId('vibecode-catalog-tab-market')).toBeVisible();
	});

	sandboxTest('my tab is first in tab list', async ({ sandbox }) => {
		await sandbox.loadExtension('vibecodeconnector.catalog');

		await sandbox.mount((selector) => {
			const { Catalog } = BX.Vibecodeconnector;
			const catalog = new Catalog({
				tabs: [
					{ id: 'my', title: 'Вайбкод', action: 'vibecodeconnector.Catalog.myList', paginated: false },
					{ id: 'market', title: 'Маркет', action: null, navigateUrl: '/marketplace/' },
				],
			});
			const bindBtn = document.createElement('button');
			document.querySelector(selector).appendChild(bindBtn);
			catalog.show(bindBtn);
		});

		const firstTab = sandbox.page.locator('[role="tab"]').first();
		await sandboxExpect(firstTab).toHaveAttribute('data-testid', 'vibecode-catalog-tab-my');
	});
});

// ---------------------------------------------------------------------------
// Sandbox: popup-item rendering — author states, escaping, data-testid
// Requires ajax stub in browser context to inject fixture items.
// ---------------------------------------------------------------------------

sandboxTest.describe('vibecodeconnector.catalog — popup-item author rendering', () => {
	/**
	 * Mounts a Catalog with stubbed ajax that returns the given items array,
	 * then waits for at least one catalog item to appear.
	 */
	async function mountWithItems(sandbox, items) {
		await sandbox.loadExtension('vibecodeconnector.catalog');

		await sandbox.mount((selector, itemsJson) => {
			// Stub ajax.runAction so loadNext() gets controlled fixture data
			const origRunAction = BX.ajax.runAction.bind(BX.ajax);
			BX.ajax.runAction = (action) => {
				if (action === 'vibecodeconnector.Catalog.myList') {
					return Promise.resolve({ data: { items: JSON.parse(itemsJson) } });
				}

				return origRunAction(action);
			};

			const { Catalog } = BX.Vibecodeconnector;
			const catalog = new Catalog({
				tabs: [
					{ id: 'my', title: 'Вайбкод', action: 'vibecodeconnector.Catalog.myList', paginated: false },
				],
			});
			const bindBtn = document.createElement('button');
			document.querySelector(selector).appendChild(bindBtn);
			catalog.show(bindBtn);
		}, JSON.stringify(items));

		// Wait until at least one item is visible
		await sandbox.page.getByTestId('vibecode-catalog-item').first().waitFor({ state: 'visible' });
	}

	sandboxTest('isMine=true renders author as "Вы"', async ({ sandbox }) => {
		await mountWithItems(sandbox, [
			{ id: 1, title: 'My Vibeapp', isMine: true, ownerName: '', kind: '', isPinned: false, isPublished: true },
		]);

		const author = sandbox.page.getByTestId('vibecode-catalog-item-author').first();
		await sandboxExpect(author).toBeVisible();
		await sandboxExpect(author).toContainText('Вы');
	});

	sandboxTest('isMine=false with ownerName renders the owner name', async ({ sandbox }) => {
		await mountWithItems(sandbox, [
			{ id: 2, title: 'Alice App', isMine: false, ownerName: 'Alice Wonderland', kind: '', isPinned: false, isPublished: true },
		]);

		const author = sandbox.page.getByTestId('vibecode-catalog-item-author').first();
		await sandboxExpect(author).toContainText('Alice Wonderland');
	});

	sandboxTest('isMine=false with null ownerName renders a placeholder', async ({ sandbox }) => {
		await mountWithItems(sandbox, [
			{ id: 3, title: 'Unknown App', isMine: false, ownerName: null, kind: '', isPinned: false, isPublished: true },
		]);

		const author = sandbox.page.getByTestId('vibecode-catalog-item-author').first();
		await sandboxExpect(author).toBeVisible();
		// Placeholder text must be non-empty (localised fallback)
		const text = await author.textContent();
		sandboxExpect(text?.trim().length ?? 0).toBeGreaterThan(0);
	});

	sandboxTest('ownerName with HTML special chars is escaped (no XSS)', async ({ sandbox }) => {
		const malicious = '<script>window.__xss=1</script>';
		await mountWithItems(sandbox, [
			{ id: 4, title: 'Xss App', isMine: false, ownerName: malicious, kind: '', isPinned: false, isPublished: true },
		]);

		// The script must NOT execute
		const xssFlag = await sandbox.page.evaluate(() => window.__xss);
		sandboxExpect(xssFlag).toBeUndefined();

		// The raw chars must appear as visible text, not as HTML
		const author = sandbox.page.getByTestId('vibecode-catalog-item-author').first();
		await sandboxExpect(author).toContainText('<script>');
	});

	sandboxTest('catalog item title is also escaped (no XSS in title)', async ({ sandbox }) => {
		const malicious = '"><img src=x onerror=window.__xss2=1>';
		await mountWithItems(sandbox, [
			{ id: 5, title: malicious, isMine: false, ownerName: null, kind: '', isPinned: false, isPublished: true },
		]);

		const xssFlag = await sandbox.page.evaluate(() => window.__xss2);
		sandboxExpect(xssFlag).toBeUndefined();
	});

	sandboxTest('popup items have vibecode-catalog-item data-testid', async ({ sandbox }) => {
		await mountWithItems(sandbox, [
			{ id: 10, title: 'App A', isMine: false, ownerName: 'Bob', kind: '', isPinned: false, isPublished: true },
			{ id: 11, title: 'App B', isMine: true, ownerName: '', kind: '', isPinned: false, isPublished: true },
		]);

		await sandboxExpect(sandbox.page.getByTestId('vibecode-catalog-item')).toHaveCount(2);
		await sandboxExpect(sandbox.page.getByTestId('vibecode-catalog-item-title').first()).toBeVisible();
		await sandboxExpect(sandbox.page.getByTestId('vibecode-catalog-item-author').first()).toBeVisible();
	});
});

// ---------------------------------------------------------------------------
// Sandbox: recordOpen is called on item click (#openTarget)
// Requires item with a viewUrl so the item is clickable.
// ---------------------------------------------------------------------------

sandboxTest.describe('vibecodeconnector.catalog — recordOpen on item open', () => {
	sandboxTest('recordOpen action is fired when clicking a clickable item', async ({ sandbox }) => {
		await sandbox.loadExtension('vibecodeconnector.catalog');

		await sandbox.mount((selector) => {
			BX.ajax.runAction = (action) => {
				if (action === 'vibecodeconnector.Catalog.myList') {
					return Promise.resolve({
						data: {
							items: [
								{
									id: 42,
									title: 'Clickable App',
									isMine: false,
									ownerName: 'Bob',
									kind: 'application',
									viewUrl: '/vibe/app/42/',
									editUrl: null,
									isPinned: false,
									isPublished: true,
									externalId: 'ext-42',
								},
							],
						},
					});
				}

				if (action === 'vibecodeconnector.Catalog.recordOpen') {
					window.__recordOpenCalled = true;

					return Promise.resolve({ data: {} });
				}

				return Promise.resolve({ data: {} });
			};

			const { Catalog } = BX.Vibecodeconnector;
			const catalog = new Catalog({
				tabs: [
					{ id: 'my', title: 'Вайбкод', action: 'vibecodeconnector.Catalog.myList', paginated: false },
				],
			});
			const bindBtn = document.createElement('button');
			document.querySelector(selector).appendChild(bindBtn);
			catalog.show(bindBtn);
		});

		await sandbox.page.getByTestId('vibecode-catalog-item').first().waitFor({ state: 'visible' });

		// Click the item (it is clickable because viewUrl is set and kind=application)
		await sandbox.page.getByTestId('vibecode-catalog-item').first().click();

		// recordOpen must have been called
		const called = await sandbox.page.evaluate(() => window.__recordOpenCalled);
		sandboxExpect(called).toBe(true);
	});

	sandboxTest('recordOpen action is fired via action-button menu "Открыть в Вайбкод"', async ({ sandbox }) => {
		await sandbox.loadExtension('vibecodeconnector.catalog');

		await sandbox.mount((selector) => {
			BX.ajax.runAction = (action) => {
				if (action === 'vibecodeconnector.Catalog.myList') {
					return Promise.resolve({
						data: {
							items: [
								{
									id: 43,
									title: 'Menu App',
									isMine: true,
									ownerName: '',
									kind: 'application',
									viewUrl: '/vibe/app/43/',
									editUrl: '/vibe/edit/43/',
									isPinned: false,
									isPublished: true,
									externalId: 'ext-43',
								},
							],
						},
					});
				}

				if (action === 'vibecodeconnector.Catalog.recordOpen') {
					window.__menuRecordOpenCalled = true;

					return Promise.resolve({ data: {} });
				}

				return Promise.resolve({ data: {} });
			};

			const { Catalog } = BX.Vibecodeconnector;
			const catalog = new Catalog({
				tabs: [
					{ id: 'my', title: 'Вайбкод', action: 'vibecodeconnector.Catalog.myList', paginated: false },
				],
			});
			const bindBtn = document.createElement('button');
			document.querySelector(selector).appendChild(bindBtn);
			catalog.show(bindBtn);
		});

		await sandbox.page.getByTestId('vibecode-catalog-item').first().waitFor({ state: 'visible' });

		// Open the action-button menu
		await sandbox.page.getByTestId('vibecode-catalog-item-action-btn').first().click();

		// Click "Открыть в Вайбкод" menu item — text from VIBECODECONNECTOR_CATALOG_MENU_OPEN_IN_VIBE
		await sandbox.page.getByRole('menuitem').filter({ hasText: 'Вайбкод' }).click();

		const called = await sandbox.page.evaluate(() => window.__menuRecordOpenCalled);
		sandboxExpect(called).toBe(true);
	});
});
