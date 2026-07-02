import { test, expect } from 'ui.test.e2e.sandbox';

declare global {
	interface Window {
		focusZone?: BX.UI.Accessibility.FocusZone;
	}
}

test.describe('ui.a11y / FocusZone', () => {
	test.beforeEach(async ({ page, sandbox }) => {
		await sandbox.loadExtension('ui.a11y');
		await page.waitForLoadState('domcontentloaded');
	});

	test.afterEach(async ({ sandbox }) => {
		await sandbox.page.evaluate(() => {
			window.focusZone?.deactivate();
			delete window.focusZone;
			document.getElementById('a11y-e2e-root')?.remove();
		});
	});

	test('vertical menu: ArrowDown / ArrowUp / Home / End cycle through items (default bindKeys)', async ({ sandbox }) => {
		await sandbox.page.evaluate(() => {
			const root = document.createElement('div');
			root.id = 'a11y-e2e-root';

			const menu = document.createElement('ul');
			menu.id = 'menu';
			for (const label of ['Главная', 'Задачи', 'Календарь', 'CRM', 'Диск'])
			{
				const item = document.createElement('li');
				item.className = 'item';
				item.setAttribute('tabindex', '0');
				item.textContent = label;
				menu.appendChild(item);
			}
			root.appendChild(menu);
			document.body.appendChild(root);

			const instance = new BX.UI.Accessibility.FocusZone(menu);
			instance.activate();
			window.focusZone = instance;

			(menu.children[0] as HTMLElement).focus();
		});

		await sandbox.page.keyboard.press('ArrowDown');
		let activeText = await sandbox.page.evaluate(() => document.activeElement?.textContent ?? '');
		expect(activeText).toBe('Задачи');

		await sandbox.page.keyboard.press('ArrowDown');
		activeText = await sandbox.page.evaluate(() => document.activeElement?.textContent ?? '');
		expect(activeText).toBe('Календарь');

		await sandbox.page.keyboard.press('ArrowUp');
		activeText = await sandbox.page.evaluate(() => document.activeElement?.textContent ?? '');
		expect(activeText).toBe('Задачи');

		await sandbox.page.keyboard.press('End');
		activeText = await sandbox.page.evaluate(() => document.activeElement?.textContent ?? '');
		expect(activeText).toBe('Диск');

		await sandbox.page.keyboard.press('Home');
		activeText = await sandbox.page.evaluate(() => document.activeElement?.textContent ?? '');
		expect(activeText).toBe('Главная');
	});

	test('vertical menu: ArrowLeft / ArrowRight are ignored when only ArrowVertical is bound', async ({ sandbox }) => {
		await sandbox.page.evaluate(() => {
			const root = document.createElement('div');
			root.id = 'a11y-e2e-root';

			const menu = document.createElement('ul');
			menu.id = 'menu';
			for (const label of ['A', 'B', 'C'])
			{
				const item = document.createElement('li');
				item.className = 'item';
				item.setAttribute('tabindex', '0');
				item.textContent = label;
				menu.appendChild(item);
			}
			root.appendChild(menu);
			document.body.appendChild(root);

			const instance = new BX.UI.Accessibility.FocusZone(menu);
			instance.activate();
			window.focusZone = instance;

			(menu.children[0] as HTMLElement).focus();
		});

		await sandbox.page.keyboard.press('ArrowRight');
		const activeText = await sandbox.page.evaluate(() => document.activeElement?.textContent ?? '');
		expect(activeText).toBe('A');
	});

	test('horizontal toolbar with wrap: ArrowRight from last element wraps to first', async ({ sandbox }) => {
		await sandbox.page.evaluate(() => {
			const FocusKeys = BX.UI.Accessibility.FocusKeys;

			const root = document.createElement('div');
			root.id = 'a11y-e2e-root';

			const toolbar = document.createElement('div');
			toolbar.id = 'toolbar';
			toolbar.setAttribute('role', 'toolbar');
			for (const label of ['B', 'I', 'U', 'Link', 'Attach', 'Image'])
			{
				const btn = document.createElement('button');
				btn.type = 'button';
				btn.className = 'item';
				btn.textContent = label;
				toolbar.appendChild(btn);
			}
			root.appendChild(toolbar);
			document.body.appendChild(root);

			const instance = new BX.UI.Accessibility.FocusZone(toolbar, {
				bindKeys: FocusKeys.ArrowHorizontal | FocusKeys.HomeAndEnd,
				focusOutBehavior: 'wrap',
			});
			instance.activate();
			window.focusZone = instance;

			(toolbar.lastElementChild as HTMLElement).focus();
		});

		await sandbox.page.keyboard.press('ArrowRight');
		let activeText = await sandbox.page.evaluate(() => document.activeElement?.textContent ?? '');
		expect(activeText).toBe('B');

		await sandbox.page.keyboard.press('ArrowLeft');
		activeText = await sandbox.page.evaluate(() => document.activeElement?.textContent ?? '');
		expect(activeText).toBe('Image');
	});

	test('roving tabindex: only the focused element keeps tabindex="0" after activate()', async ({ sandbox }) => {
		const tabindexes = await sandbox.page.evaluate(() => {
			const root = document.createElement('div');
			root.id = 'a11y-e2e-root';

			const menu = document.createElement('ul');
			menu.id = 'menu';
			for (const label of ['A', 'B', 'C'])
			{
				const item = document.createElement('li');
				item.className = 'item';
				item.setAttribute('tabindex', '0');
				item.textContent = label;
				menu.appendChild(item);
			}
			root.appendChild(menu);
			document.body.appendChild(root);

			const instance = new BX.UI.Accessibility.FocusZone(menu);
			instance.activate();
			window.focusZone = instance;

			return [...menu.children].map((el) => el.getAttribute('tabindex'));
		});

		expect(tabindexes).toEqual(['0', '-1', '-1']);
	});

	test('deactivate() restores the original tabindex values', async ({ sandbox }) => {
		const tabindexes = await sandbox.page.evaluate(() => {
			const root = document.createElement('div');
			root.id = 'a11y-e2e-root';

			const menu = document.createElement('ul');
			menu.id = 'menu';
			for (const label of ['A', 'B', 'C'])
			{
				const item = document.createElement('li');
				item.className = 'item';
				item.setAttribute('tabindex', '0');
				item.textContent = label;
				menu.appendChild(item);
			}
			root.appendChild(menu);
			document.body.appendChild(root);

			const instance = new BX.UI.Accessibility.FocusZone(menu);
			instance.activate();
			instance.deactivate();
			window.focusZone = instance;

			return [...menu.children].map((el) => el.getAttribute('tabindex'));
		});

		expect(tabindexes).toEqual(['0', '0', '0']);
	});

	test('active-descendant combobox: ArrowDown updates aria-activedescendant while focus stays on the input', async ({ sandbox }) => {
		const result = await sandbox.page.evaluate(() => {
			const FocusKeys = BX.UI.Accessibility.FocusKeys;

			const root = document.createElement('div');
			root.id = 'a11y-e2e-root';

			const input = document.createElement('input');
			input.id = 'combo-input';
			input.type = 'text';
			input.setAttribute('role', 'combobox');
			root.appendChild(input);

			const listbox = document.createElement('ul');
			listbox.id = 'combo-listbox';
			listbox.setAttribute('role', 'listbox');
			for (const label of ['Москва', 'Санкт-Петербург', 'Казань', 'Новосибирск'])
			{
				const item = document.createElement('li');
				item.className = 'item';
				item.setAttribute('role', 'option');
				item.setAttribute('tabindex', '0');
				item.textContent = label;
				listbox.appendChild(item);
			}
			root.appendChild(listbox);
			document.body.appendChild(root);

			const instance = new BX.UI.Accessibility.FocusZone(listbox, {
				activeDescendantControl: input,
				bindKeys: FocusKeys.ArrowVertical | FocusKeys.HomeAndEnd,
				focusInStrategy: 'first',
			});
			instance.activate();
			window.focusZone = instance;

			input.focus();

			return {
				initialActiveId: input.getAttribute('aria-activedescendant'),
				ariaControls: input.getAttribute('aria-controls'),
				listboxId: listbox.id,
			};
		});

		expect(result.ariaControls).toBe(result.listboxId);

		await sandbox.page.keyboard.press('ArrowDown');
		const afterArrow = await sandbox.page.evaluate(() => {
			const input = document.getElementById('combo-input') as HTMLInputElement;
			const activeId = input.getAttribute('aria-activedescendant');
			const highlighted = activeId ? document.getElementById(activeId)?.textContent : null;

			return {
				focusOnInput: document.activeElement === input,
				highlighted,
			};
		});

		expect(afterArrow.focusOnInput).toBe(true);
		expect(afterArrow.highlighted).toBe('Санкт-Петербург');
	});

	test('custom getNextFocusable: grid 2D navigation moves by row and column', async ({ sandbox }) => {
		await sandbox.page.evaluate(() => {
			const FocusKeys = BX.UI.Accessibility.FocusKeys;

			const root = document.createElement('div');
			root.id = 'a11y-e2e-root';

			const grid = document.createElement('div');
			grid.id = 'grid';
			grid.setAttribute('role', 'grid');
			for (let row = 0; row < 3; row++)
			{
				for (let col = 0; col < 4; col++)
				{
					const cell = document.createElement('div');
					cell.className = 'item';
					cell.setAttribute('role', 'gridcell');
					cell.setAttribute('tabindex', '0');
					cell.dataset.row = String(row);
					cell.dataset.col = String(col);
					cell.textContent = `${String.fromCodePoint(65 + col)}${row + 1}`;
					grid.appendChild(cell);
				}
			}
			root.appendChild(grid);
			document.body.appendChild(root);

			const instance = new BX.UI.Accessibility.FocusZone(grid, {
				bindKeys: FocusKeys.ArrowAll | FocusKeys.HomeAndEnd,
				getNextFocusable(_direction, from, event)
				{
					if (!from)
					{
						return null;
					}

					const cell = (from as HTMLElement).closest('[data-row]') as HTMLElement | null;
					if (!cell)
					{
						return null;
					}

					let row = Number(cell.dataset.row);
					let col = Number(cell.dataset.col);

					switch (event.key)
					{
						case 'ArrowRight': col += 1; break;
						case 'ArrowLeft': col -= 1; break;
						case 'ArrowDown': row += 1; break;
						case 'ArrowUp': row -= 1; break;
						default: return null;
					}

					return grid.querySelector<HTMLElement>(`[data-row="${row}"][data-col="${col}"]`) ?? null;
				},
			});
			instance.activate();
			window.focusZone = instance;

			(grid.querySelector('[data-row="0"][data-col="0"]') as HTMLElement).focus();
		});

		await sandbox.page.keyboard.press('ArrowRight');
		let activeText = await sandbox.page.evaluate(() => document.activeElement?.textContent ?? '');
		expect(activeText).toBe('B1');

		await sandbox.page.keyboard.press('ArrowDown');
		activeText = await sandbox.page.evaluate(() => document.activeElement?.textContent ?? '');
		expect(activeText).toBe('B2');

		await sandbox.page.keyboard.press('ArrowLeft');
		activeText = await sandbox.page.evaluate(() => document.activeElement?.textContent ?? '');
		expect(activeText).toBe('A2');
	});

	test('dynamic list: items appended after activate are picked up via MutationObserver', async ({ sandbox }) => {
		await sandbox.page.evaluate(() => {
			const root = document.createElement('div');
			root.id = 'a11y-e2e-root';

			const list = document.createElement('ul');
			list.id = 'dynamic-list';
			for (const label of ['One', 'Two', 'Three'])
			{
				const item = document.createElement('li');
				item.className = 'item';
				item.setAttribute('tabindex', '0');
				item.textContent = label;
				list.appendChild(item);
			}
			root.appendChild(list);
			document.body.appendChild(root);

			const instance = new BX.UI.Accessibility.FocusZone(list);
			instance.activate();
			window.focusZone = instance;

			(list.children[0] as HTMLElement).focus();

			const fresh = document.createElement('li');
			fresh.className = 'item';
			fresh.setAttribute('tabindex', '0');
			fresh.textContent = 'Four';
			list.appendChild(fresh);
		});

		// MutationObserver schedules the sync via requestAnimationFrame — wait a frame
		// plus a small margin so the new item is added to the managed set.
		await sandbox.page.waitForFunction(() => {
			const list = document.getElementById('dynamic-list');
			if (!list)
			{
				return false;
			}

			return [...list.children].every(
				(el, index) => el.getAttribute('tabindex') === (index === 0 ? '0' : '-1'),
			);
		});

		await sandbox.page.keyboard.press('End');
		const activeText = await sandbox.page.evaluate(() => document.activeElement?.textContent ?? '');
		expect(activeText).toBe('Four');
	});
});
