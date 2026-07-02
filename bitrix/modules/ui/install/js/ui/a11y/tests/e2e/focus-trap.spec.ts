import { test, expect } from 'ui.test.e2e.sandbox';

declare global {
	interface Window {
		focusTrap?: BX.UI.Accessibility.FocusTrap;
	}
}

test.describe('ui.a11y / FocusTrap', () => {
	test.beforeEach(async ({ page, sandbox }) => {
		await sandbox.loadExtension('ui.buttons');
		await page.waitForLoadState('domcontentloaded');
	});

	test.afterEach(async ({ sandbox }) => {
		await sandbox.page.evaluate(() => {
			window.focusTrap?.destroy();
			delete window.focusTrap;
			document.getElementById('a11y-e2e-root')?.remove();
		});
	});

	test('Tab at the last tabbable element loops focus back to the first (looped=true)', async ({ sandbox }) => {
		await sandbox.page.evaluate(() => {
			const root = document.createElement('div');
			root.id = 'a11y-e2e-root';

			const before = document.createElement('button');
			before.id = 'before';
			before.textContent = 'Before';
			root.appendChild(before);

			const trap = document.createElement('div');
			trap.id = 'trap';
			for (const id of ['btn-1', 'btn-2', 'btn-3'])
			{
				const btn = document.createElement('button');
				btn.id = id;
				btn.textContent = id;
				trap.appendChild(btn);
			}
			root.appendChild(trap);
			document.body.appendChild(root);

			const instance = new BX.UI.Accessibility.FocusTrap(trap, { looped: true });
			instance.activate({ initialFocus: false });

			window.focusTrap = instance;

			(document.getElementById('btn-3') as HTMLElement).focus();
		});

		await sandbox.page.keyboard.press('Tab');

		const activeId = await sandbox.page.evaluate(() => document.activeElement?.id ?? '');
		expect(activeId).toBe('btn-1');
	});

	test('Shift+Tab at the first tabbable element loops focus to the last (looped=true)', async ({ sandbox }) => {
		await sandbox.page.evaluate(() => {
			const root = document.createElement('div');
			root.id = 'a11y-e2e-root';

			const trap = document.createElement('div');
			trap.id = 'trap';
			for (const id of ['btn-a', 'btn-b', 'btn-c'])
			{
				const btn = document.createElement('button');
				btn.id = id;
				btn.textContent = id;
				trap.appendChild(btn);
			}
			root.appendChild(trap);
			document.body.appendChild(root);

			const instance = new BX.UI.Accessibility.FocusTrap(trap, { looped: true });
			instance.activate({ initialFocus: false });
			window.focusTrap = instance;

			(document.getElementById('btn-a') as HTMLElement).focus();
		});

		await sandbox.page.keyboard.press('Shift+Tab');

		const activeId = await sandbox.page.evaluate(() => document.activeElement?.id ?? '');
		expect(activeId).toBe('btn-c');
	});

	test('deactivate() restores focus to the element that was active before activate()', async ({ sandbox }) => {
		const activeId = await sandbox.page.evaluate(() => {
			const root = document.createElement('div');
			root.id = 'a11y-e2e-root';

			const trigger = document.createElement('button');
			trigger.id = 'trigger';
			trigger.textContent = 'Open';
			root.appendChild(trigger);

			const trap = document.createElement('div');
			trap.id = 'trap';
			const inside = document.createElement('button');
			inside.id = 'inside';
			inside.textContent = 'Inside';
			trap.appendChild(inside);
			root.appendChild(trap);

			document.body.appendChild(root);

			trigger.focus();

			const instance = new BX.UI.Accessibility.FocusTrap(trap);
			instance.activate();
			instance.deactivate();

			window.focusTrap = instance;

			return document.activeElement?.id ?? '';
		});

		expect(activeId).toBe('trigger');
	});

	test('restoreFocus with an invalid selector does not throw — falls back to the last captured element', async ({ sandbox }) => {
		const result = await sandbox.page.evaluate(() => {
			const root = document.createElement('div');
			root.id = 'a11y-e2e-root';

			const caller = document.createElement('button');
			caller.id = 'caller';
			caller.textContent = 'Caller';
			root.appendChild(caller);

			const trap = document.createElement('div');
			trap.id = 'trap';
			const inside = document.createElement('button');
			inside.id = 'inside';
			inside.textContent = 'Inside';
			trap.appendChild(inside);
			root.appendChild(trap);

			document.body.appendChild(root);

			caller.focus();

			const instance = new BX.UI.Accessibility.FocusTrap(trap, {
				restoreFocus: '#does-not-exist:::invalid',
			});
			instance.activate();

			window.focusTrap = instance;

			let errorMessage: string | null = null;
			try
			{
				instance.deactivate();
			}
			catch (error: any)
			{
				errorMessage = error?.message ?? String(error);
			}

			return { error: errorMessage, activeId: document.activeElement?.id ?? '' };
		});

		expect(result.error).toBeNull();
		expect(result.activeId).toBe('caller');
	});
});
