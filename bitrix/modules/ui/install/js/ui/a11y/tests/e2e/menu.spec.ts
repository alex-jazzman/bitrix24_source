import { test, expect } from 'ui.test.e2e.sandbox';

declare global {
	interface Window {
		menuInstance?: { close?: () => void; destroy?: () => void; isShown?: () => boolean };
	}
}

type SandboxArg = Parameters<Parameters<typeof test>[1]>[0]['sandbox'];

async function setupMenu(sandbox: SandboxArg): Promise<void>
{
	await sandbox.mount((selector) => {
		const container = document.querySelector(selector);
		if (!container)
		{
			throw new Error(`Container not found ${selector}`);
		}

		const button = document.createElement('button');
		button.id = 'menu-trigger';
		button.className = 'ui-btn --air ui-btn-no-caps';
		button.textContent = 'Open menu';
		container.appendChild(button);
	});

	await sandbox.page.evaluate(({ items }) => {
		const button = document.getElementById('menu-trigger');
		if (!button)
		{
			throw new Error('Menu trigger not found');
		}

		const menu = new BX.Main.Menu({
			bindElement: button,
			focusTrap: true,
			items,
		});

		button.addEventListener('click', () => menu.show());
		window.menuInstance = menu;
	}, { items: createMenuItems() });
}

async function openMenuByKeyboard(sandbox: SandboxArg): Promise<void>
{
	// Tab from body — focuses the trigger AND registers keyboard modality in FocusMonitor
	// (Tab is in the NAV_KEYS set of InputModalityTracker).
	await sandbox.page.keyboard.press('Tab');
	await sandbox.page.keyboard.press('Enter');
	await sandbox.page.waitForSelector('.menu-popup', { state: 'visible' });
	// focusFirst() runs via onShow handlers — wait until focus really entered the menu.
	await sandbox.page.waitForFunction(() => {
		const active = document.activeElement;

		return Boolean(active?.closest('.menu-popup'));
	});
}

async function waitForActiveInsideSubmenu(sandbox: SandboxArg): Promise<void>
{
	await sandbox.page.waitForFunction(() => {
		const popups = document.querySelectorAll('.menu-popup');
		if (popups.length < 2)
		{
			return false;
		}

		const active = document.activeElement;
		const lastPopup = popups[popups.length - 1];

		return Boolean(active && lastPopup.contains(active));
	});
}

async function openMenuByMouse(sandbox: SandboxArg): Promise<void>
{
	await sandbox.page.locator('#menu-trigger').click();
	await sandbox.page.waitForSelector('.menu-popup', { state: 'visible' });
}

async function getActiveItemText(sandbox: SandboxArg): Promise<string>
{
	return sandbox.page.evaluate(() => {
		const active = document.activeElement;
		if (!active)
		{
			return '';
		}

		const label = active.querySelector('.menu-popup-item-text');

		return (label?.textContent ?? active.textContent ?? '').trim();
	});
}

test.describe('ui.a11y / Menu', () => {
	test.beforeEach(async ({ page, sandbox }) => {
		await sandbox.loadExtension(['main.popup', 'ui.buttons']);
		await page.waitForLoadState('domcontentloaded');
	});

	test.afterEach(async ({ sandbox }) => {
		await sandbox.page.evaluate(() => {
			window.menuInstance?.destroy?.();
			delete window.menuInstance;
		});
	});

	test('opens with mouse: focus stays outside the menu (pointer modality)', async ({ sandbox }) => {
		await setupMenu(sandbox);
		await openMenuByMouse(sandbox);

		// Chromium/Firefox focus the button on mousedown, WebKit on macOS does not.
		// The contract we verify here is only: the menu opens and focus does NOT
		// move into the menu (that is what keyboard-open does).
		const state = await sandbox.page.evaluate(() => {
			const active = document.activeElement;

			return {
				menuVisible: Boolean(document.querySelector('.menu-popup')),
				activeIsInMenu: active ? Boolean(active.closest('.menu-popup')) : false,
			};
		});

		expect(state.menuVisible).toBe(true);
		expect(state.activeIsInMenu).toBe(false);
	});

	test('opens with keyboard (Enter): focus moves to the first item', async ({ sandbox }) => {
		await setupMenu(sandbox);
		await openMenuByKeyboard(sandbox);

		const activeText = await getActiveItemText(sandbox);
		expect(activeText).toBe('Копировать');
	});

	test('ArrowDown / ArrowUp walk through items and wrap around at the edges', async ({ sandbox }) => {
		await setupMenu(sandbox);
		await openMenuByKeyboard(sandbox);

		await sandbox.page.keyboard.press('ArrowDown');
		expect(await getActiveItemText(sandbox)).toBe('Вырезать');

		await sandbox.page.keyboard.press('ArrowDown');
		expect(await getActiveItemText(sandbox)).toBe('Вставить');

		// Skip the delimiter — MenuNavigation filters non-focusable items.
		await sandbox.page.keyboard.press('ArrowDown');
		expect(await getActiveItemText(sandbox)).toBe('Дополнительно');

		await sandbox.page.keyboard.press('ArrowUp');
		expect(await getActiveItemText(sandbox)).toBe('Вставить');

		// Wrap to the last item when stepping past the first.
		await sandbox.page.keyboard.press('Home');
		await sandbox.page.keyboard.press('ArrowUp');
		expect(await getActiveItemText(sandbox)).toBe('Ежик');

		// And wrap to the first when stepping past the last.
		await sandbox.page.keyboard.press('ArrowDown');
		expect(await getActiveItemText(sandbox)).toBe('Копировать');
	});

	test('Home / End / PageUp / PageDown jump to the edges of the list', async ({ sandbox }) => {
		await setupMenu(sandbox);
		await openMenuByKeyboard(sandbox);

		await sandbox.page.keyboard.press('End');
		expect(await getActiveItemText(sandbox)).toBe('Ежик');

		await sandbox.page.keyboard.press('Home');
		expect(await getActiveItemText(sandbox)).toBe('Копировать');

		await sandbox.page.keyboard.press('PageDown');
		expect(await getActiveItemText(sandbox)).toBe('Ежик');

		await sandbox.page.keyboard.press('PageUp');
		expect(await getActiveItemText(sandbox)).toBe('Копировать');
	});

	test('type-ahead: pressing a letter focuses the next item whose label starts with it', async ({ sandbox }) => {
		await setupMenu(sandbox);
		await openMenuByKeyboard(sandbox);

		// Playwright's keyboard.type() cannot dispatch a real `keydown` for characters
		// that aren't on the US keyboard layout — for Cyrillic letters it only emits
		// an `input` event. MenuNavigation listens for `keydown`, so we dispatch the
		// KeyboardEvent manually against the currently focused menu item.
		const dispatchKey = async (key: string) => sandbox.page.evaluate((k) => {
			const target = document.activeElement ?? document.body;
			target.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
		}, key);

		// From 'Копировать' the first item starting with 'п' is 'Привет'.
		await dispatchKey('п');
		expect(await getActiveItemText(sandbox)).toBe('Привет');

		// The typeahead buffer resets after ~200ms of inactivity; wait it out so the
		// next press starts a fresh search.
		await sandbox.page.waitForTimeout(250);
		await dispatchKey('п');
		expect(await getActiveItemText(sandbox)).toBe('Привидение');

		// Collator uses base sensitivity — 'е' matches items starting with 'Ё'.
		await sandbox.page.waitForTimeout(250);
		await dispatchKey('е');
		expect(await getActiveItemText(sandbox)).toBe('Ёлка');
	});

	test('ArrowRight opens a submenu and focuses its first item', async ({ sandbox }) => {
		await setupMenu(sandbox);
		await openMenuByKeyboard(sandbox);

		// Navigate to "Дополнительно" — the 4th focusable item (Копировать, Вырезать, Вставить, Дополнительно).
		for (let i = 0; i < 3; i++)
		{
			await sandbox.page.keyboard.press('ArrowDown');
		}
		expect(await getActiveItemText(sandbox)).toBe('Дополнительно');

		await sandbox.page.keyboard.press('ArrowRight');

		// `expect.poll` retries until the assertion passes (or the test times out) —
		// this is race-free across Chromium / Firefox / WebKit.
		await expect.poll(() => getActiveItemText(sandbox)).toBe('Подпункт 1');

		const openSubmenus = await sandbox.page.evaluate(() => document.querySelectorAll('.menu-popup').length);
		expect(openSubmenus).toBeGreaterThanOrEqual(2);
	});

	test('ArrowLeft closes the current submenu and returns focus to its parent item', async ({ sandbox }) => {
		await setupMenu(sandbox);
		await openMenuByKeyboard(sandbox);

		for (let i = 0; i < 3; i++)
		{
			await sandbox.page.keyboard.press('ArrowDown');
		}
		expect(await getActiveItemText(sandbox)).toBe('Дополнительно');

		await sandbox.page.keyboard.press('ArrowRight');
		await waitForActiveInsideSubmenu(sandbox);

		await sandbox.page.keyboard.press('ArrowLeft');
		await sandbox.page.waitForFunction(() => document.querySelectorAll('.menu-popup').length === 1);

		expect(await getActiveItemText(sandbox)).toBe('Дополнительно');
	});

	test('Escape closes the submenu and keeps the parent menu open', async ({ sandbox }) => {
		await setupMenu(sandbox);
		await openMenuByKeyboard(sandbox);

		for (let i = 0; i < 3; i++)
		{
			await sandbox.page.keyboard.press('ArrowDown');
		}
		await sandbox.page.keyboard.press('ArrowRight');
		await waitForActiveInsideSubmenu(sandbox);

		await sandbox.page.keyboard.press('Escape');
		// Popup.close() hides via display:none but keeps the element in the DOM,
		// so filter by real visibility to see that exactly one menu remains open.
		await sandbox.page.waitForFunction(() => {
			return [...document.querySelectorAll('.menu-popup')]
				.filter((el) => BX.UI.Accessibility.InteractivityChecker.isVisible(el as HTMLElement))
				.length === 1;
		});

		const state = await sandbox.page.evaluate(() => {
			const visibleMenus = [...document.querySelectorAll('.menu-popup')]
				.filter((el) => BX.UI.Accessibility.InteractivityChecker.isVisible(el as HTMLElement));
			const visiblePopupWindows = [...document.querySelectorAll('.popup-window')]
				.filter((el) => (el as HTMLElement).style.display !== 'none');
			const active = document.activeElement as HTMLElement | null;

			return {
				visibleMenuCount: visibleMenus.length,
				// After Escape the focus must stay within the (still-visible) parent
				// menu popup chain. Different browsers land the focus either on the
				// parent item, on its menu container, or on the outer popup root —
				// any of those are acceptable as long as it's inside the parent menu.
				focusInParentPopup: active
					? visiblePopupWindows.some((pw) => pw === active || pw.contains(active))
					: false,
			};
		});

		expect(state.visibleMenuCount).toBe(1);
		expect(state.focusInParentPopup).toBe(true);
	});
});

function createMenuItems()
{
	const subMenuItems = [
		{
			id: 3,
			text: 'Нажми, чтобы изменить название',
			className: 'menu-popup-item-complete',
		},
		{
			id: 'mouse-events',
			text: 'События мыши',
		},
		{
			id: 'submenu',
			text: 'Подменю',
			items: [
				{
					id: 'submenu-1',
					text: 'Нажми на пункт, удалится подменю',
				},
			],
		},
		{
			id: 'ajax',
			text: 'Ajax-подгрузка',
			cacheable: true,
			items: [
				{
					id: 'loading',
					text: 'Загрузка меню...',
				},
			],
		},
		{
			id: 'ajax2',
			text: 'Ajax-подгрузка 2...',
			cacheable: true,
		},

		{
			id: 1,
			text: 'Добавить новый пункт',
		},
	];

	return [
		{ text: 'Копировать' },
		{ text: 'Вырезать' },
		{ text: 'Вставить', disabled: true },
		{ delimiter: true },
		{
			text: 'Дополнительно',
			items: [
				{
					text: 'Подпункт 1',
					items: [
						{ delimiter: true, text: 'Секция' },
						{ text: 'Красный' },
						{ text: 'Желтый' },
						{ text: 'Синий', disabled: true },
						{ text: 'Апельсин' },
						{ text: 'Привет' },
						{ text: 'Банан' },
						{ delimiter: true },
						{ text: 'Привидение' },
						{ text: 'Проект' },
						{ delimiter: true },
					],
				},
				{
					text: 'Подпункт 2',
					items: [
						{ delimiter: true, text: 'Секция' },
						{ text: 'Раз' },
						{ text: 'Два' },
						{ text: 'Три', disabled: true },
						{ delimiter: true },
					],
				},
				{ text: 'Подпункт 3' },
				{ text: 'Подпункт 4' },
				{ text: 'Подпункт 5' },
				{ text: 'Подпункт 6' },
				{ text: 'Подпункт 7' },
				{ text: 'Подпункт 8' },
				{ text: 'Подпункт 9' },
			],
		},
		{ text: 'Еще пункт', items: subMenuItems },
		{ delimiter: true, text: 'Секция с больщим названием, которое не влезает' },
		{ text: 'Привет' },
		{ text: 'Привидение' },
		{ text: 'Проект' },
		{ text: 'Пример' },
		{ text: 'Ёлка' },
		{ text: 'Ежик' },
	];
}
