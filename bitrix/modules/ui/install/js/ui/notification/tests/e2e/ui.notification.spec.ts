import { test, expect } from 'ui.test.e2e.sandbox';

type NotifyArgs = Record<string, unknown>;

declare global {
	interface Window {
		BX: {
			UI: {
				Notification: {
					Center: {
						notify(options: NotifyArgs): unknown;
						balloons: Record<string, { close(): void }>;
						stacks: Record<string, { clear(): void }>;
						setStackDefaults(position: unknown, options?: Record<string, unknown>): void;
						setBalloonDefaults(options: Record<string, unknown>): void;
					};
					Event: { getFullName(name: string): string };
					Balloon: new (options: Record<string, unknown>) => { render(): HTMLElement; getContent(): unknown };
				};
			};
			addCustomEvent(name: string, handler: (event: unknown) => void): void;
		};
		__actionFired?: string | null;
		__legacyEventReceived?: { name: string; hasBalloon: boolean } | null;
		__openEventFired?: boolean;
		__customRenderCalled?: boolean;
		CircleBalloon?: unknown;
	}
}

test.describe('ui.notification', () => {
	test.beforeEach(async ({ page, sandbox }) => {
		await sandbox.loadExtension('ui.notification');
		await page.waitForLoadState('domcontentloaded');
	});

	test.afterEach(async ({ sandbox }) => {
		await sandbox.page.evaluate(() => {
			const center = window.BX.UI.Notification.Center;
			Object.values(center.balloons).forEach((balloon) => balloon.close());
			Object.values(center.stacks).forEach((stack) => stack.clear());
		});
	});

	test('renders a balloon with the given content', async ({ sandbox }) => {
		await sandbox.page.evaluate(() => {
			window.BX.UI.Notification.Center.notify({
				id: 'render-basic',
				content: 'Hello, world',
				autoHide: false,
			});
		});

		const balloon = sandbox.page.locator('.ui-notification-balloon').first();
		await expect(balloon).toBeVisible();
		await expect(balloon).toContainText('Hello, world');
	});

	test('hides the balloon automatically after autoHideDelay', async ({ sandbox }) => {
		await sandbox.page.evaluate(() => {
			window.BX.UI.Notification.Center.notify({
				id: 'autohide',
				content: 'gone soon',
				autoHide: true,
				autoHideDelay: 400,
			});
		});

		const balloon = sandbox.page.locator('.ui-notification-balloon');
		await expect(balloon).toBeVisible();
		await expect(balloon).toHaveCount(0, { timeout: 3000 });
	});

	test('closes the balloon when the close button is clicked', async ({ sandbox }) => {
		await sandbox.page.evaluate(() => {
			window.BX.UI.Notification.Center.notify({
				id: 'close-button',
				content: 'closable',
				autoHide: false,
			});
		});

		const balloon = sandbox.page.locator('.ui-notification-balloon');
		await expect(balloon).toBeVisible();

		await sandbox.page.locator('.ui-notification-balloon-close-btn').first().click();
		await expect(balloon).toHaveCount(0, { timeout: 2000 });
	});

	test('hides the close button when closeButton is false', async ({ sandbox }) => {
		await sandbox.page.evaluate(() => {
			window.BX.UI.Notification.Center.notify({
				id: 'no-close-btn',
				content: 'no button',
				autoHide: false,
				closeButton: false,
			});
		});

		await expect(sandbox.page.locator('.ui-notification-balloon')).toBeVisible();
		await expect(sandbox.page.locator('.ui-notification-balloon-close-btn')).toHaveCount(0);
	});

	test.describe('positioning', () => {
		const cases: Array<{
			position: string;
			expectedStyles: Array<'top' | 'right' | 'bottom' | 'left'>;
		}> = [
			{ position: 'top-left', expectedStyles: ['top', 'left'] },
			{ position: 'top-center', expectedStyles: ['top', 'left'] },
			{ position: 'top-right', expectedStyles: ['top', 'right'] },
			{ position: 'bottom-left', expectedStyles: ['bottom', 'left'] },
			{ position: 'bottom-center', expectedStyles: ['bottom', 'left'] },
			{ position: 'bottom-right', expectedStyles: ['bottom', 'right'] },
		];

		for (const { position, expectedStyles } of cases)
		{
			test(`positions a balloon at ${position}`, async ({ sandbox }) => {
				await sandbox.page.evaluate((pos) => {
					window.BX.UI.Notification.Center.notify({
						id: `pos-${pos}`,
						content: pos,
						autoHide: false,
						position: pos,
					});
				}, position);

				const styles = await sandbox.page.locator('.ui-notification-balloon').first().evaluate(
					(node: HTMLElement) => ({
						top: node.style.top,
						right: node.style.right,
						bottom: node.style.bottom,
						left: node.style.left,
					}),
				);

				for (const key of expectedStyles)
				{
					expect(styles[key], `expected ${key} to be set for ${position}`).not.toBe('');
				}
			});
		}
	});

	test('stacks multiple balloons in the same position', async ({ sandbox }) => {
		await sandbox.page.evaluate(() => {
			const center = window.BX.UI.Notification.Center;
			center.notify({ id: 'stack-1', content: 'first', autoHide: false });
			center.notify({ id: 'stack-2', content: 'second', autoHide: false });
			center.notify({ id: 'stack-3', content: 'third', autoHide: false });
		});

		await expect(sandbox.page.locator('.ui-notification-balloon')).toHaveCount(3);
	});

	test('queues balloons that do not fit in the viewport and releases them on close', async ({ sandbox }) => {
		await sandbox.page.setViewportSize({ width: 800, height: 200 });

		const tallContent = '<div style="height: 140px;">balloon</div>';
		for (let index = 1; index <= 4; index += 1)
		{
			await sandbox.page.evaluate(({ id, content }) => {
				window.BX.UI.Notification.Center.notify({
					id,
					content,
					autoHide: false,
				});
			}, { id: `queued-${index}`, content: `${tallContent} #${index}` });
		}

		const getStackState = () => sandbox.page.evaluate(() => {
			const stacks = Object.values(window.BX.UI.Notification.Center.stacks) as Array<{
				getBalloons(): unknown[];
				getQueue(): unknown[];
			}>;

			return {
				active: stacks.reduce((sum, stack) => sum + stack.getBalloons().length, 0),
				queued: stacks.reduce((sum, stack) => sum + stack.getQueue().length, 0),
			};
		});

		const before = await getStackState();
		expect(before.queued, 'some balloons should land in the queue').toBeGreaterThan(0);
		expect(before.active, 'at least one balloon should be active').toBeGreaterThan(0);

		await sandbox.page.locator('.ui-notification-balloon-close-btn').first().click();

		await expect.poll(getStackState, { timeout: 3000 }).toEqual({
			active: before.active,
			queued: before.queued - 1,
		});
	});

	test('deduplicates balloons by id', async ({ sandbox }) => {
		await sandbox.page.evaluate(() => {
			const center = window.BX.UI.Notification.Center;
			center.notify({ id: 'dedup', content: 'first', autoHide: false });
			center.notify({ id: 'dedup', content: 'updated', autoHide: false, blinkOnUpdate: false });
		});

		await expect(sandbox.page.locator('.ui-notification-balloon')).toHaveCount(1);
		await expect(sandbox.page.locator('.ui-notification-balloon')).toContainText('updated');
	});

	test('deduplicates balloons by category', async ({ sandbox }) => {
		await sandbox.page.evaluate(() => {
			const center = window.BX.UI.Notification.Center;
			center.notify({ category: 'errors', content: 'first error', autoHide: false });
			center.notify({ category: 'errors', content: 'second error', autoHide: false, blinkOnUpdate: false });
		});

		await expect(sandbox.page.locator('.ui-notification-balloon')).toHaveCount(1);
		await expect(sandbox.page.locator('.ui-notification-balloon')).toContainText('second error');
	});

	test('updates the content without blinking when blinkOnUpdate is false', async ({ sandbox }) => {
		await sandbox.page.evaluate(() => {
			window.BX.UI.Notification.Center.notify({
				id: 'no-blink',
				content: 'initial',
				autoHide: false,
			});
		});

		await expect(sandbox.page.locator('.ui-notification-balloon')).toContainText('initial');

		await sandbox.page.evaluate(() => {
			window.BX.UI.Notification.Center.notify({
				id: 'no-blink',
				content: 'updated',
				autoHide: false,
				blinkOnUpdate: false,
			});
		});

		await expect(sandbox.page.locator('.ui-notification-balloon')).toContainText('updated');
		await expect(sandbox.page.locator('.ui-notification-balloon')).toHaveCount(1);
	});

	test('renders custom content through the render option', async ({ sandbox }) => {
		await sandbox.page.evaluate(() => {
			window.__customRenderCalled = false;
			window.BX.UI.Notification.Center.notify({
				id: 'custom-render',
				autoHide: false,
				render: () => {
					window.__customRenderCalled = true;
					const node = document.createElement('div');
					node.className = 'custom-render-marker';
					node.textContent = 'custom content';

					return node;
				},
			});
		});

		await expect(sandbox.page.locator('.custom-render-marker')).toBeVisible();
		await expect(sandbox.page.locator('.custom-render-marker')).toHaveText('custom content');

		const called = await sandbox.page.evaluate(() => window.__customRenderCalled);
		expect(called).toBe(true);
	});

	test('renders action buttons and invokes click callbacks', async ({ sandbox }) => {
		await sandbox.page.evaluate(() => {
			window.__actionFired = null;
			window.BX.UI.Notification.Center.notify({
				id: 'with-action',
				content: 'choose',
				autoHide: false,
				actions: [
					{
						id: 'ok',
						title: 'Confirm',
						events: {
							click: () => {
								window.__actionFired = 'ok';
							},
						},
					},
				],
			});
		});

		const action = sandbox.page.locator('.ui-notification-balloon-action');
		await expect(action).toBeVisible();
		await expect(action).toHaveText('Confirm');

		await action.click();

		const fired = await sandbox.page.evaluate(() => window.__actionFired);
		expect(fired).toBe('ok');
	});

	test('renders an anchor when an action specifies an href', async ({ sandbox }) => {
		await sandbox.page.evaluate(() => {
			window.BX.UI.Notification.Center.notify({
				id: 'action-link',
				content: 'with link',
				autoHide: false,
				actions: [{ id: 'go', title: 'Go', href: 'https://example.com' }],
			});
		});

		const link = sandbox.page.locator('a.ui-notification-balloon-action');
		await expect(link).toBeVisible();
		await expect(link).toHaveText('Go');
		await expect(link).toHaveAttribute('href', 'https://example.com');
	});

	test('applies air design classes when useAirDesign is true', async ({ sandbox }) => {
		await sandbox.page.evaluate(() => {
			window.BX.UI.Notification.Center.notify({
				id: 'air',
				content: 'air design',
				autoHide: false,
				useAirDesign: true,
			});
		});

		const balloon = sandbox.page.locator('.ui-notification-balloon').first();
		await expect(balloon).toBeVisible();

		await sandbox.page.waitForTimeout(50);

		const classes = await balloon.evaluate((node: HTMLElement) => Array.from(node.classList));
		expect(classes).toContain('--air');
	});

	test('delivers the legacy BX.addCustomEvent contract on close', async ({ sandbox }) => {
		await sandbox.page.evaluate(() => {
			window.__legacyEventReceived = null;
			const fullName = window.BX.UI.Notification.Event.getFullName('onClose');
			window.BX.addCustomEvent(fullName, (event: any) => {
				window.__legacyEventReceived = {
					name: event.getName(),
					hasBalloon: Boolean(event.getBalloon()),
				};
			});

			window.BX.UI.Notification.Center.notify({
				id: 'legacy-event',
				content: 'close me',
				autoHide: false,
			});
		});

		await sandbox.page.locator('.ui-notification-balloon-close-btn').first().click();
		await expect(sandbox.page.locator('.ui-notification-balloon')).toHaveCount(0, { timeout: 2000 });

		const received = await sandbox.page.evaluate(() => window.__legacyEventReceived);
		expect(received).not.toBeNull();
		expect(received!.name).toBe('onClose');
		expect(received!.hasBalloon).toBe(true);
	});

	test('delivers per-balloon events through options.events', async ({ sandbox }) => {
		await sandbox.page.evaluate(() => {
			window.__openEventFired = false;
			window.BX.UI.Notification.Center.notify({
				id: 'open-event',
				content: 'opening',
				autoHide: false,
				events: {
					onOpen: () => {
						window.__openEventFired = true;
					},
				},
			});
		});

		await expect(sandbox.page.locator('.ui-notification-balloon')).toBeVisible();

		await expect.poll(
			async () => sandbox.page.evaluate(() => window.__openEventFired),
			{ timeout: 3000 },
		).toBe(true);
	});

	test.describe('Sandbox parity', () => {
		test.afterEach(async ({ sandbox }) => {
			// Reset balloon defaults so tests stay isolated.
			await sandbox.page.evaluate(() => {
				window.BX.UI.Notification.Center.setBalloonDefaults({ width: 400, autoHideDelay: 8000 });
			});
		});

		test('"Stack Defaults" button applies a custom balloon type and offsets to subsequent notifications', async ({ sandbox }) => {
			await sandbox.page.evaluate(() => {
				const BaseBalloon: any = window.BX.UI.Notification.Balloon;
				class CircleBalloon extends BaseBalloon
				{
					render(): HTMLElement
					{
						const wrapper = document.createElement('div');
						wrapper.className = 'circle-balloon';
						wrapper.textContent = String(this.getContent() ?? '');

						return wrapper;
					}
				}
				window.CircleBalloon = CircleBalloon;

				window.BX.UI.Notification.Center.setStackDefaults({
					position: 'bottom-left',
					spacing: 20,
					offsetX: 20,
					offsetY: 20,
					balloonType: 'CircleBalloon',
				});

				window.BX.UI.Notification.Center.notify({
					id: 'sandbox-stack-defaults',
					content: 'Round',
					autoHide: false,
				});
			});

			// The new default balloonType is the custom CircleBalloon class — the rendered
			// element must use the custom marker class, not the stock balloon-content layout.
			await expect(sandbox.page.locator('.circle-balloon')).toBeVisible();
			await expect(sandbox.page.locator('.circle-balloon')).toHaveText('Round');
			await expect(sandbox.page.locator('.ui-notification-balloon-content')).toHaveCount(0);
		});

		test('"Balloon Defaults" button sets default width and autoHideDelay for subsequent notifications', async ({ sandbox }) => {
			await sandbox.page.evaluate(() => {
				window.BX.UI.Notification.Center.setBalloonDefaults({
					autoHideDelay: 9999,
					width: 600,
				});

				window.BX.UI.Notification.Center.notify({
					id: 'sandbox-balloon-defaults',
					content: 'With defaults',
					// Intentionally do not pass width/autoHideDelay — the defaults must kick in.
				});
			});

			const content = sandbox.page.locator('.ui-notification-balloon-content').first();
			await expect(content).toBeVisible();

			const width = await content.evaluate(
				(node: HTMLElement) => window.getComputedStyle(node).width,
			);
			expect(width).toBe('600px');

			// Confirm the balloon is still around after the original 5s default delay would have fired.
			await sandbox.page.waitForTimeout(2500);
			await expect(sandbox.page.locator('.ui-notification-balloon')).toBeVisible();
		});
	});

	test('global EventEmitter.subscribe receives UI.Notification.Balloon:onClose', async ({ sandbox }) => {
		// Mirrors real consumers (tasks/check-list-notifier, catalog/product-model,
		// crm.entity.product.list) that subscribe through the modern EventEmitter
		// rather than the legacy BX.addCustomEvent helper. Both paths must keep
		// receiving the same global event from `Balloon.fireEvent('onClose')`.
		const received = await sandbox.page.evaluate(async () => {
			let fired = false;
			const win = window as any;

			win.BX.Event.EventEmitter.subscribe('UI.Notification.Balloon:onClose', () => {
				fired = true;
			});

			const balloon = win.BX.UI.Notification.Center.notify({
				content: 'will close',
				autoHide: false,
			});
			balloon.close();

			await new Promise((resolve) => setTimeout(resolve, 100));

			return fired;
		});

		expect(received).toBe(true);
	});

	test.describe('Legacy subclass compatibility', () => {
		// Reproduces the inheritance pattern produced by older Babel (used in
		// intranet.push-invitations and similar prebuilt bundles): the parent
		// constructor is invoked through `getPrototypeOf(Child).call(this, opts)`
		// rather than `super(opts)`. Native ES class would throw here — so Balloon
		// and Action must keep being transpiled to prototype-based constructors.
		test('Babel-loose-mode subclass can still extend Balloon and Action', async ({ sandbox }) => {
			const result = await sandbox.page.evaluate(() => {
				const Balloon = (window as any).BX.UI.Notification.Balloon;
				const Action = (window as any).BX.UI.Notification.Action;
				const Stack = (window as any).BX.UI.Notification.Stack;
				const stack = new Stack();

				const tryExtend = function(Parent: any, makeArgs: () => any[]): { ok: boolean; error: string | null }
				{
					try
					{
						const LegacyChild: any = function(this: any, ...args: any[])
						{
							const proto = Object.getPrototypeOf(LegacyChild);
							const ret = proto.call(this, ...args);

							return ret || this;
						};
						LegacyChild.prototype = Object.create(Parent.prototype);
						LegacyChild.prototype.constructor = LegacyChild;
						Object.setPrototypeOf(LegacyChild, Parent);

						const instance = new LegacyChild(...makeArgs());

						return { ok: instance instanceof Parent, error: null };
					}
					catch (e: any)
					{
						return { ok: false, error: e.message };
					}
				};

				return {
					balloon: tryExtend(Balloon, () => [{ stack }]),
					action: tryExtend(Action, () => [new Balloon({ stack }), { title: 'OK' }]),
				};
			});

			expect(result.balloon.error, 'Balloon babel-style extend must succeed').toBeNull();
			expect(result.balloon.ok).toBe(true);

			expect(result.action.error, 'Action babel-style extend must succeed').toBeNull();
			expect(result.action.ok).toBe(true);
		});
	});
});
