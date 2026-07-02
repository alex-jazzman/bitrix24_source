import { test, expect } from 'ui.test.e2e.sandbox';

test.describe('ui.a11y / FocusNavigator', () => {
	test.beforeEach(async ({ page, sandbox }) => {
		await sandbox.loadExtension('ui.a11y');
		await page.waitForLoadState('domcontentloaded');
	});

	test.afterEach(async ({ sandbox }) => {
		await sandbox.page.evaluate(() => {
			document.getElementById('a11y-e2e-root')?.remove();
		});
	});

	test('focusFirst / focusLast focus the edge tabbables of the scope', async ({ sandbox }) => {
		const result = await sandbox.page.evaluate(() => {
			const root = document.createElement('div');
			root.id = 'a11y-e2e-root';

			const container = document.createElement('div');
			container.id = 'scope';
			for (const id of ['btn-1', 'btn-2', 'btn-3'])
			{
				const btn = document.createElement('button');
				btn.id = id;
				btn.type = 'button';
				btn.textContent = id;
				container.appendChild(btn);
			}
			root.appendChild(container);
			document.body.appendChild(root);

			const first = BX.UI.Accessibility.FocusNavigator.focusFirst(container);
			const firstId = document.activeElement?.id ?? '';
			const last = BX.UI.Accessibility.FocusNavigator.focusLast(container);
			const lastId = document.activeElement?.id ?? '';

			return {
				firstReturnedId: first?.id ?? null,
				firstActiveId: firstId,
				lastReturnedId: last?.id ?? null,
				lastActiveId: lastId,
			};
		});

		expect(result.firstReturnedId).toBe('btn-1');
		expect(result.firstActiveId).toBe('btn-1');
		expect(result.lastReturnedId).toBe('btn-3');
		expect(result.lastActiveId).toBe('btn-3');
	});

	test('focusNext / focusPrevious walk the scope in document order', async ({ sandbox }) => {
		const sequence = await sandbox.page.evaluate(() => {
			const root = document.createElement('div');
			root.id = 'a11y-e2e-root';

			const container = document.createElement('div');
			container.id = 'scope';
			for (const id of ['a', 'b', 'c'])
			{
				const btn = document.createElement('button');
				btn.id = id;
				btn.type = 'button';
				btn.textContent = id;
				container.appendChild(btn);
			}
			root.appendChild(container);
			document.body.appendChild(root);

			(document.getElementById('a') as HTMLElement).focus();

			const afterNext = BX.UI.Accessibility.FocusNavigator.focusNext(container);
			const next1 = document.activeElement?.id ?? '';

			const afterNext2 = BX.UI.Accessibility.FocusNavigator.focusNext(container);
			const next2 = document.activeElement?.id ?? '';

			const afterPrev = BX.UI.Accessibility.FocusNavigator.focusPrevious(container);
			const prev1 = document.activeElement?.id ?? '';

			return {
				next1: { returned: afterNext?.id ?? null, active: next1 },
				next2: { returned: afterNext2?.id ?? null, active: next2 },
				prev1: { returned: afterPrev?.id ?? null, active: prev1 },
			};
		});

		expect(sequence.next1.returned).toBe('b');
		expect(sequence.next1.active).toBe('b');
		expect(sequence.next2.returned).toBe('c');
		expect(sequence.next2.active).toBe('c');
		expect(sequence.prev1.returned).toBe('b');
		expect(sequence.prev1.active).toBe('b');
	});

	test('wrap: true cycles through the scope in both directions', async ({ sandbox }) => {
		const result = await sandbox.page.evaluate(() => {
			const root = document.createElement('div');
			root.id = 'a11y-e2e-root';

			const container = document.createElement('div');
			container.id = 'scope';
			for (const id of ['one', 'two', 'three'])
			{
				const btn = document.createElement('button');
				btn.id = id;
				btn.type = 'button';
				btn.textContent = id;
				container.appendChild(btn);
			}
			root.appendChild(container);
			document.body.appendChild(root);

			(document.getElementById('three') as HTMLElement).focus();
			const wrapNext = BX.UI.Accessibility.FocusNavigator.focusNext(container, { wrap: true });
			const afterNextId = document.activeElement?.id ?? '';

			(document.getElementById('one') as HTMLElement).focus();
			const wrapPrev = BX.UI.Accessibility.FocusNavigator.focusPrevious(container, { wrap: true });
			const afterPrevId = document.activeElement?.id ?? '';

			return {
				wrapNextReturned: wrapNext?.id ?? null,
				afterNextId,
				wrapPrevReturned: wrapPrev?.id ?? null,
				afterPrevId,
			};
		});

		expect(result.wrapNextReturned).toBe('one');
		expect(result.afterNextId).toBe('one');
		expect(result.wrapPrevReturned).toBe('three');
		expect(result.afterPrevId).toBe('three');
	});

	test('without wrap, focusNext past the last element returns null and keeps the current focus', async ({ sandbox }) => {
		const result = await sandbox.page.evaluate(() => {
			const root = document.createElement('div');
			root.id = 'a11y-e2e-root';

			const container = document.createElement('div');
			container.id = 'scope';
			for (const id of ['one', 'two'])
			{
				const btn = document.createElement('button');
				btn.id = id;
				btn.type = 'button';
				btn.textContent = id;
				container.appendChild(btn);
			}
			root.appendChild(container);
			document.body.appendChild(root);

			(document.getElementById('two') as HTMLElement).focus();
			const returned = BX.UI.Accessibility.FocusNavigator.focusNext(container);

			return {
				returnedId: returned?.id ?? null,
				activeId: document.activeElement?.id ?? '',
			};
		});

		expect(result.returnedId).toBeNull();
		expect(result.activeId).toBe('two');
	});

	test('tabbableOnly: true skips elements with tabindex="-1"', async ({ sandbox }) => {
		const result = await sandbox.page.evaluate(() => {
			const root = document.createElement('div');
			root.id = 'a11y-e2e-root';

			const container = document.createElement('div');
			container.id = 'scope';

			const btn1 = document.createElement('button');
			btn1.id = 'tabbable-1';
			btn1.type = 'button';
			btn1.textContent = '1';
			container.appendChild(btn1);

			const untabbable = document.createElement('button');
			untabbable.id = 'not-tabbable';
			untabbable.type = 'button';
			untabbable.tabIndex = -1;
			untabbable.textContent = 'skip';
			container.appendChild(untabbable);

			const btn3 = document.createElement('button');
			btn3.id = 'tabbable-2';
			btn3.type = 'button';
			btn3.textContent = '2';
			container.appendChild(btn3);

			root.appendChild(container);
			document.body.appendChild(root);

			(btn1).focus();

			const tabbableJump = BX.UI.Accessibility.FocusNavigator.focusNext(container, { tabbableOnly: true });
			const tabbableActive = document.activeElement?.id ?? '';

			(btn1).focus();

			const anyJump = BX.UI.Accessibility.FocusNavigator.focusNext(container, { tabbableOnly: false });
			const anyActive = document.activeElement?.id ?? '';

			return {
				tabbableReturnedId: tabbableJump?.id ?? null,
				tabbableActive,
				anyReturnedId: anyJump?.id ?? null,
				anyActive,
			};
		});

		expect(result.tabbableReturnedId).toBe('tabbable-2');
		expect(result.tabbableActive).toBe('tabbable-2');
		expect(result.anyReturnedId).toBe('not-tabbable');
		expect(result.anyActive).toBe('not-tabbable');
	});

	test('focusBySelector focuses the first match in the scope when nothing is focused yet', async ({ sandbox }) => {
		const firstMatch = await sandbox.page.evaluate(() => {
			const root = document.createElement('div');
			root.id = 'a11y-e2e-root';

			const container = document.createElement('div');
			container.id = 'scope';

			const btn = document.createElement('button');
			btn.type = 'button';
			btn.textContent = 'start';
			container.appendChild(btn);

			const input1 = document.createElement('input');
			input1.id = 'first-input';
			input1.type = 'text';
			container.appendChild(input1);

			const link = document.createElement('a');
			link.id = 'a-link';
			link.href = '#';
			link.textContent = 'link';
			container.appendChild(link);

			const input2 = document.createElement('input');
			input2.id = 'second-input';
			input2.type = 'text';
			container.appendChild(input2);

			root.appendChild(container);
			document.body.appendChild(root);

			(document.activeElement as HTMLElement | null)?.blur();

			const matched = BX.UI.Accessibility.FocusNavigator.focusBySelector(container, 'input');

			return {
				returnedId: matched?.id ?? null,
				activeId: document.activeElement?.id ?? '',
			};
		});

		expect(firstMatch.returnedId).toBe('first-input');
		expect(firstMatch.activeId).toBe('first-input');
	});

	test('focusBySelector with an already-focused match jumps to the next match', async ({ sandbox }) => {
		const nextMatch = await sandbox.page.evaluate(() => {
			const root = document.createElement('div');
			root.id = 'a11y-e2e-root';

			const container = document.createElement('div');
			container.id = 'scope';

			const input1 = document.createElement('input');
			input1.id = 'first-input';
			input1.type = 'text';
			container.appendChild(input1);

			const link = document.createElement('a');
			link.id = 'a-link';
			link.href = '#';
			link.textContent = 'link';
			container.appendChild(link);

			const input2 = document.createElement('input');
			input2.id = 'second-input';
			input2.type = 'text';
			container.appendChild(input2);

			root.appendChild(container);
			document.body.appendChild(root);

			input1.focus();
			const matched = BX.UI.Accessibility.FocusNavigator.focusBySelector(container, 'input');

			return {
				returnedId: matched?.id ?? null,
				activeId: document.activeElement?.id ?? '',
			};
		});

		expect(nextMatch.returnedId).toBe('second-input');
		expect(nextMatch.activeId).toBe('second-input');
	});

	test('traversal descends into same-origin iframes (srcdoc)', async ({ sandbox }) => {
		await sandbox.page.evaluate(() => {
			const root = document.createElement('div');
			root.id = 'a11y-e2e-root';

			const container = document.createElement('div');
			container.id = 'scope';

			const btnBefore = document.createElement('button');
			btnBefore.id = 'before';
			btnBefore.type = 'button';
			btnBefore.textContent = 'before';
			container.appendChild(btnBefore);

			const iframe = document.createElement('iframe');
			iframe.id = 'test-iframe';
			iframe.srcdoc = '<button id="iframe-btn" type="button">inside</button>';
			container.appendChild(iframe);

			const btnAfter = document.createElement('button');
			btnAfter.id = 'after';
			btnAfter.type = 'button';
			btnAfter.textContent = 'after';
			container.appendChild(btnAfter);

			root.appendChild(container);
			document.body.appendChild(root);
		});

		// Wait for the iframe srcdoc to actually render its body.
		await sandbox.page.waitForFunction(() => {
			const iframe = document.getElementById('test-iframe') as HTMLIFrameElement | null;

			return Boolean(iframe?.contentDocument?.getElementById('iframe-btn'));
		});

		const traversal = await sandbox.page.evaluate(() => {
			const container = document.getElementById('scope') as HTMLElement;

			(document.getElementById('before') as HTMLElement).focus();
			const next1 = BX.UI.Accessibility.FocusNavigator.focusNext(container);

			// Pass `from` explicitly — Firefox does not always reflect cross-document
			// focus in document.activeElement synchronously after a programmatic
			// element.focus() call, so resolving the current element via the active-
			// element heuristic is racy for iframe content.
			const next2 = BX.UI.Accessibility.FocusNavigator.focusNext(container, {
				from: next1 ?? undefined,
			});

			return {
				firstReturnedId: next1?.id ?? null,
				firstReturnedInIframe: next1 ? next1.ownerDocument !== document : false,
				secondReturnedId: next2?.id ?? null,
			};
		});

		expect(traversal.firstReturnedId).toBe('iframe-btn');
		expect(traversal.firstReturnedInIframe).toBe(true);
		expect(traversal.secondReturnedId).toBe('after');
	});

	test('restoreFocus dispatches a cancellable a11y:restore-focus event and can be vetoed', async ({ sandbox }) => {
		const result = await sandbox.page.evaluate(() => {
			const root = document.createElement('div');
			root.id = 'a11y-e2e-root';

			const caller = document.createElement('button');
			caller.id = 'caller';
			caller.type = 'button';
			caller.textContent = 'caller';

			const target = document.createElement('button');
			target.id = 'restore-target';
			target.type = 'button';
			target.textContent = 'target';
			target.addEventListener('a11y:restore-focus', (event) => {
				event.preventDefault();
			});

			root.appendChild(caller);
			root.appendChild(target);
			document.body.appendChild(root);

			caller.focus();

			const returned = BX.UI.Accessibility.FocusNavigator.restoreFocus(target, { preventScroll: true });

			return {
				returned: returned?.id ?? null,
				activeId: document.activeElement?.id ?? '',
			};
		});

		expect(result.returned).toBeNull();
		expect(result.activeId).toBe('caller');
	});
});
