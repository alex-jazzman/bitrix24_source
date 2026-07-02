import { describe, it, beforeEach, afterEach } from 'mocha';
import { assert } from 'chai';

type NotificationEvent = {
	setBalloon(balloon: unknown): void;
	getBalloon(): unknown;
	setName(name: string): void;
	getName(): string | null;
	getFullName(): string;
};

type NotificationEventStatic = {
	new (): NotificationEvent;
	getFullName(eventName: string): string;
};

type Action = {
	getBalloon(): Balloon;
	getId(): string;
	getTitle(): string | null;
	getHref(): string | null;
	getContainer(): HTMLElement;
	getWindow(): Window;
};

type ActionStatic = new (balloon: Balloon, options?: Record<string, unknown>) => Action;

type Stack = {
	getId(): string;
	getPosition(): string;
	getSpacing(): number;
	getOffsetX(): number;
	getOffsetY(): number;
	isNewestOnTop(): boolean;
	getBalloons(): Balloon[];
	getQueue(): Balloon[];
	getBalloonType(name?: string | Function): Function;
	setBalloonType(type: string | Function): void;
	setOptions(options: Record<string, unknown>): void;
	add(balloon: Balloon): void;
	push(balloon: Balloon): void;
	queue(balloon: Balloon): void;
	clear(): void;
	handleBalloonClose(event: NotificationEvent): void;
};

type StackStatic = {
	new (options?: Record<string, unknown>): Stack;
	getPositionCode(position: unknown): string | null;
};

type Balloon = {
	getId(): string;
	getStack(): Stack;
	getState(): number;
	getStateCode(state: number): string | null;
	setState(state: number): void;
	getContent(): string | Element | null;
	getWidth(): number | 'auto';
	getAutoHide(): boolean;
	getAutoHideDelay(): number;
	getData(): Record<string, unknown>;
	getCategory(): string | null;
	setCategory(category: string | null): void;
	getActions(): Action[];
	setActions(actions: unknown): void;
	getAction(id: string): Action | null;
	isCloseButtonVisible(): boolean;
	getContainer(): HTMLElement;
	fireEvent(eventName: string): NotificationEvent;
	close(): void;
};

type BalloonStatic = new (options: Record<string, unknown>) => Balloon;

type Manager = {
	balloons: Record<string, Balloon>;
	stacks: Record<string, Stack>;
	notify(options: Record<string, unknown>): Balloon | undefined;
	getBalloonById(id: string): Balloon | null;
	getBalloonByCategory(category: string): Balloon | null;
	getStack(id: string): Stack | null;
	addStack(stack: Stack): void;
	setBalloonDefaults(options: Record<string, unknown>): void;
	setStackDefaults(position: unknown, options?: Record<string, unknown>): void;
	getDefaultPosition(): string;
	setDefaultPosition(position: string): void;
};

declare global {
	interface Window {
		BX: {
			UI: {
				Notification: {
					Center: Manager;
					Manager: new () => Manager;
					Balloon: BalloonStatic;
					Stack: StackStatic;
					Event: NotificationEventStatic;
					Action: ActionStatic;
					Position: Record<string, string>;
					State: Record<string, number>;
				};
			};
			addCustomEvent(name: string, handler: Function): void;
			removeCustomEvent(name: string, handler: Function): void;
		};
	}
}

const BX = (globalThis as unknown as Window).BX;
const Notification = BX.UI.Notification;

describe('ui.notification', () => {
	describe('Namespace', () => {
		it('exposes the BX.UI.Notification namespace', () => {
			assert.isObject(Notification);
		});

		it('exposes Balloon, Stack, Manager, Event, Action constructors', () => {
			assert.isFunction(Notification.Balloon);
			assert.isFunction(Notification.Stack);
			assert.isFunction(Notification.Manager);
			assert.isFunction(Notification.Event);
			assert.isFunction(Notification.Action);
		});

		it('exposes the State and Position enums', () => {
			assert.isObject(Notification.State);
			assert.isObject(Notification.Position);
		});
	});

	describe('Position', () => {
		const expectedPositions: Record<string, string> = {
			TOP_LEFT: 'top-left',
			TOP_CENTER: 'top-center',
			TOP_RIGHT: 'top-right',
			BOTTOM_LEFT: 'bottom-left',
			BOTTOM_CENTER: 'bottom-center',
			BOTTOM_RIGHT: 'bottom-right',
		};

		Object.entries(expectedPositions).forEach(([code, value]) => {
			it(`has ${code} = "${value}"`, () => {
				assert.equal(Notification.Position[code], value);
			});
		});
	});

	describe('State', () => {
		const expectedStates: Record<string, number> = {
			INIT: 0,
			OPENING: 1,
			OPEN: 2,
			CLOSING: 3,
			CLOSED: 4,
			PAUSED: 5,
			QUEUED: 6,
		};

		Object.entries(expectedStates).forEach(([code, value]) => {
			it(`has ${code} = ${value}`, () => {
				assert.equal(Notification.State[code], value);
			});
		});
	});

	describe('Stack.getPositionCode (static)', () => {
		it('returns the code for each known position', () => {
			assert.equal(Notification.Stack.getPositionCode('top-left'), 'TOP_LEFT');
			assert.equal(Notification.Stack.getPositionCode('top-center'), 'TOP_CENTER');
			assert.equal(Notification.Stack.getPositionCode('top-right'), 'TOP_RIGHT');
			assert.equal(Notification.Stack.getPositionCode('bottom-left'), 'BOTTOM_LEFT');
			assert.equal(Notification.Stack.getPositionCode('bottom-center'), 'BOTTOM_CENTER');
			assert.equal(Notification.Stack.getPositionCode('bottom-right'), 'BOTTOM_RIGHT');
		});

		it('returns null for an unknown position', () => {
			assert.isNull(Notification.Stack.getPositionCode('top-middle'));
		});

		it('returns null for non-string input', () => {
			assert.isNull(Notification.Stack.getPositionCode(null));
			assert.isNull(Notification.Stack.getPositionCode(undefined));
			assert.isNull(Notification.Stack.getPositionCode(123));
		});
	});

	describe('Stack', () => {
		describe('construction', () => {
			it('creates an instance with default values', () => {
				const stack = new Notification.Stack();

				assert.isString(stack.getId());
				assert.equal(stack.getPosition(), 'top-right');
				assert.equal(stack.getSpacing(), 20);
				assert.equal(stack.getOffsetX(), 25);
				assert.equal(stack.getOffsetY(), 25);
				assert.isFalse(stack.isNewestOnTop());
				assert.isArray(stack.getBalloons());
				assert.lengthOf(stack.getBalloons(), 0);
			});

			it('uses the provided id', () => {
				const stack = new Notification.Stack({ id: 'my-stack' });
				assert.equal(stack.getId(), 'my-stack');
			});

			it('uses the provided position when valid', () => {
				const stack = new Notification.Stack({ position: 'bottom-left' });
				assert.equal(stack.getPosition(), 'bottom-left');
			});

			it('falls back to top-right when the position is invalid', () => {
				const stack = new Notification.Stack({ position: 'somewhere' });
				assert.equal(stack.getPosition(), 'top-right');
			});

			it('accepts options through setOptions', () => {
				const stack = new Notification.Stack({
					spacing: 10,
					offsetX: 5,
					offsetY: 7,
					newestOnTop: true,
				});

				assert.equal(stack.getSpacing(), 10);
				assert.equal(stack.getOffsetX(), 5);
				assert.equal(stack.getOffsetY(), 7);
				assert.isTrue(stack.isNewestOnTop());
			});
		});

		describe('setOptions validation', () => {
			it('ignores a non-number spacing', () => {
				const stack = new Notification.Stack({ spacing: 'big' });
				assert.equal(stack.getSpacing(), 20);
			});

			it('ignores a non-number offsetX', () => {
				const stack = new Notification.Stack({ offsetX: 'wide' });
				assert.equal(stack.getOffsetX(), 25);
			});

			it('ignores a non-number offsetY', () => {
				const stack = new Notification.Stack({ offsetY: 'tall' });
				assert.equal(stack.getOffsetY(), 25);
			});

			it('ignores a non-boolean newestOnTop', () => {
				const stack = new Notification.Stack({ newestOnTop: 'yes' });
				assert.isFalse(stack.isNewestOnTop());
			});
		});

		describe('balloonType', () => {
			it('defaults to BX.UI.Notification.Balloon', () => {
				const stack = new Notification.Stack();
				assert.equal(stack.getBalloonType(), Notification.Balloon);
			});

			it('returns the provided constructor when passed a function', () => {
				const stack = new Notification.Stack();
				class CustomBalloon {}
				assert.equal(stack.getBalloonType(CustomBalloon), CustomBalloon);
			});

			it('accepts a constructor through setBalloonType', () => {
				const stack = new Notification.Stack();
				class CustomBalloon {}
				stack.setBalloonType(CustomBalloon);
				assert.equal(stack.getBalloonType(), CustomBalloon);
			});

			it('ignores a non-function, non-string value', () => {
				const stack = new Notification.Stack();
				stack.setBalloonType(123 as unknown as Function);
				assert.equal(stack.getBalloonType(), Notification.Balloon);
			});

			it('resolves a class name string through BX.getClass', () => {
				class GlobalBalloon {}
				(globalThis as unknown as { GlobalBalloon: typeof GlobalBalloon }).GlobalBalloon = GlobalBalloon;

				try
				{
					const stack = new Notification.Stack();
					stack.setBalloonType('GlobalBalloon');
					assert.equal(stack.getBalloonType(), GlobalBalloon);
				}
				finally
				{
					delete (globalThis as unknown as { GlobalBalloon?: unknown }).GlobalBalloon;
				}
			});

			it('keeps the default balloon type when the string is unresolvable', () => {
				const stack = new Notification.Stack();
				stack.setBalloonType('Definitely.Not.A.Class');
				assert.equal(stack.getBalloonType(), Notification.Balloon);
			});

			it('resolves a class name string passed to getBalloonType()', () => {
				class GlobalBalloon2 {}
				(globalThis as unknown as { GlobalBalloon2: typeof GlobalBalloon2 }).GlobalBalloon2 = GlobalBalloon2;

				try
				{
					const stack = new Notification.Stack();
					assert.equal(stack.getBalloonType('GlobalBalloon2'), GlobalBalloon2);
				}
				finally
				{
					delete (globalThis as unknown as { GlobalBalloon2?: unknown }).GlobalBalloon2;
				}
			});
		});

		describe('push/queue/add', () => {
			it('push throws when the argument is not a Balloon', () => {
				const stack = new Notification.Stack();
				assert.throws(() => stack.push({} as unknown as Balloon), Error);
			});

			it('queue throws when the argument is not a Balloon', () => {
				const stack = new Notification.Stack();
				assert.throws(() => stack.queue({} as unknown as Balloon), Error);
			});

			it('push appends a balloon by default', () => {
				const stack = new Notification.Stack();
				const balloon1 = new Notification.Balloon({ stack });
				const balloon2 = new Notification.Balloon({ stack });

				stack.push(balloon1);
				stack.push(balloon2);

				assert.deepEqual(stack.getBalloons(), [balloon1, balloon2]);
			});

			it('push prepends a balloon when newestOnTop is true', () => {
				const stack = new Notification.Stack({ newestOnTop: true });
				const balloon1 = new Notification.Balloon({ stack });
				const balloon2 = new Notification.Balloon({ stack });

				stack.push(balloon1);
				stack.push(balloon2);

				assert.deepEqual(stack.getBalloons(), [balloon2, balloon1]);
			});

			it('push deduplicates the same balloon', () => {
				const stack = new Notification.Stack();
				const balloon = new Notification.Balloon({ stack });

				stack.push(balloon);
				stack.push(balloon);

				assert.lengthOf(stack.getBalloons(), 1);
			});

			it('queue moves a balloon to QUEUED state', () => {
				const stack = new Notification.Stack();
				const balloon = new Notification.Balloon({ stack });

				stack.queue(balloon);

				assert.equal(balloon.getState(), Notification.State.QUEUED);
				assert.include(stack.getQueue(), balloon);
			});

			it('add pushes the first balloon directly into balloons', () => {
				const stack = new Notification.Stack();
				const balloon = new Notification.Balloon({ stack });

				stack.add(balloon);

				assert.include(stack.getBalloons(), balloon);
				assert.notInclude(stack.getQueue(), balloon);
			});
		});

		describe('clear', () => {
			it('closes balloons from both the active list and the queue', () => {
				const stack = new Notification.Stack();
				const active = new Notification.Balloon({ stack });
				const queued = new Notification.Balloon({ stack });

				stack.push(active);
				stack.queue(queued);

				let activeClosed = false;
				let queuedClosed = false;
				active.close = () => { activeClosed = true; };
				queued.close = () => { queuedClosed = true; };

				stack.clear();

				assert.isTrue(activeClosed);
				assert.isTrue(queuedClosed);
				assert.lengthOf(stack.getBalloons(), 0);
				assert.lengthOf(stack.getQueue(), 0);
			});
		});

		describe('handleBalloonClose', () => {
			it('removes the balloon from its own stack', () => {
				const stack = new Notification.Stack();
				const balloon = new Notification.Balloon({ stack });
				stack.push(balloon);

				const event = new Notification.Event();
				event.setBalloon(balloon);
				event.setName('onClose');
				stack.handleBalloonClose(event);

				assert.notInclude(stack.getBalloons(), balloon);
			});

			it('ignores balloons that belong to a different stack', () => {
				const ownStack = new Notification.Stack({ id: 'own' });
				const foreignStack = new Notification.Stack({ id: 'foreign' });

				const ownBalloon = new Notification.Balloon({ stack: ownStack });
				const foreignBalloon = new Notification.Balloon({ stack: foreignStack });

				ownStack.push(ownBalloon);

				const event = new Notification.Event();
				event.setBalloon(foreignBalloon);
				event.setName('onClose');
				ownStack.handleBalloonClose(event);

				assert.include(ownStack.getBalloons(), ownBalloon);
			});
		});
	});

	describe('Balloon', () => {
		let stack: Stack;

		beforeEach(() => {
			stack = new Notification.Stack({ id: 'test-stack' });
		});

		it('throws without a Stack instance', () => {
			assert.throws(() => new Notification.Balloon({}), Error);
		});

		it('creates an instance with the given stack', () => {
			const balloon = new Notification.Balloon({ stack });
			assert.equal(balloon.getStack(), stack);
		});

		it('generates an id when none is provided', () => {
			const balloon = new Notification.Balloon({ stack });
			assert.isString(balloon.getId());
			assert.isAbove(balloon.getId().length, 0);
		});

		it('uses the provided id', () => {
			const balloon = new Notification.Balloon({ stack, id: 'b1' });
			assert.equal(balloon.getId(), 'b1');
		});

		it('starts in the INIT state', () => {
			const balloon = new Notification.Balloon({ stack });
			assert.equal(balloon.getState(), Notification.State.INIT);
		});

		describe('options', () => {
			it('stores string content', () => {
				const balloon = new Notification.Balloon({ stack, content: 'hello' });
				assert.equal(balloon.getContent(), 'hello');
			});

			it('stores element content', () => {
				const node = document.createElement('span');
				const balloon = new Notification.Balloon({ stack, content: node });
				assert.equal(balloon.getContent(), node);
			});

			it('defaults width to 400', () => {
				const balloon = new Notification.Balloon({ stack });
				assert.equal(balloon.getWidth(), 400);
			});

			it('uses 339 as the default width when useAirDesign is true', () => {
				const balloon = new Notification.Balloon({ stack, useAirDesign: true });
				assert.equal(balloon.getWidth(), 339);
			});

			it('accepts a numeric width', () => {
				const balloon = new Notification.Balloon({ stack, width: 600 });
				assert.equal(balloon.getWidth(), 600);
			});

			it('accepts "auto" as a width', () => {
				const balloon = new Notification.Balloon({ stack, width: 'auto' });
				assert.equal(balloon.getWidth(), 'auto');
			});

			it('ignores invalid width values', () => {
				const balloon = new Notification.Balloon({ stack, width: 'wide' });
				assert.equal(balloon.getWidth(), 400);
			});

			it('defaults autoHide to true', () => {
				const balloon = new Notification.Balloon({ stack });
				assert.isTrue(balloon.getAutoHide());
			});

			it('disables autoHide when autoHide is false', () => {
				const balloon = new Notification.Balloon({ stack, autoHide: false });
				assert.isFalse(balloon.getAutoHide());
			});

			it('defaults autoHideDelay to 8000', () => {
				const balloon = new Notification.Balloon({ stack });
				assert.equal(balloon.getAutoHideDelay(), 8000);
			});

			it('accepts a positive autoHideDelay', () => {
				const balloon = new Notification.Balloon({ stack, autoHideDelay: 1234 });
				assert.equal(balloon.getAutoHideDelay(), 1234);
			});

			it('ignores a non-positive autoHideDelay', () => {
				const balloon = new Notification.Balloon({ stack, autoHideDelay: -5 });
				assert.equal(balloon.getAutoHideDelay(), 8000);
			});

			it('defaults closeButton visibility to true', () => {
				const balloon = new Notification.Balloon({ stack });
				assert.isTrue(balloon.isCloseButtonVisible());
			});

			it('hides the close button when closeButton is false', () => {
				const balloon = new Notification.Balloon({ stack, closeButton: false });
				assert.isFalse(balloon.isCloseButtonVisible());
			});

			it('stores plain object data', () => {
				const balloon = new Notification.Balloon({ stack, data: { foo: 'bar' } });
				assert.deepEqual(balloon.getData(), { foo: 'bar' });
			});

			it('ignores non-plain-object data', () => {
				const balloon = new Notification.Balloon({ stack, data: 'invalid' });
				assert.deepEqual(balloon.getData(), {});
			});

			it('defaults category to null', () => {
				const balloon = new Notification.Balloon({ stack });
				assert.isNull(balloon.getCategory());
			});

			it('stores a non-empty category', () => {
				const balloon = new Notification.Balloon({ stack, category: 'errors' });
				assert.equal(balloon.getCategory(), 'errors');
			});

			it('resets the category back to null', () => {
				const balloon = new Notification.Balloon({ stack, category: 'errors' });
				balloon.setCategory(null);
				assert.isNull(balloon.getCategory());
			});

			it('ignores empty string passed to setCategory', () => {
				const balloon = new Notification.Balloon({ stack, category: 'errors' });
				balloon.setCategory('');
				assert.equal(balloon.getCategory(), 'errors');
			});
		});

		describe('actions', () => {
			it('starts with an empty actions array', () => {
				const balloon = new Notification.Balloon({ stack });
				assert.deepEqual(balloon.getActions(), []);
			});

			it('creates Action instances for each provided action', () => {
				const balloon = new Notification.Balloon({
					stack,
					actions: [
						{ id: 'a1', title: 'Yes' },
						{ id: 'a2', title: 'No' },
					],
				});

				assert.lengthOf(balloon.getActions(), 2);
				assert.instanceOf(balloon.getActions()[0], Notification.Action);
				assert.equal(balloon.getAction('a1')!.getId(), 'a1');
				assert.equal(balloon.getAction('a2')!.getTitle(), 'No');
			});

			it('clears actions when setActions(null) is called', () => {
				const balloon = new Notification.Balloon({
					stack,
					actions: [{ id: 'a1', title: 'Yes' }],
				});

				balloon.setActions(null);
				assert.deepEqual(balloon.getActions(), []);
			});

			it('ignores non-array, non-null values passed to setActions', () => {
				const balloon = new Notification.Balloon({
					stack,
					actions: [{ id: 'a1', title: 'Yes' }],
				});

				balloon.setActions('invalid');
				assert.lengthOf(balloon.getActions(), 1);
			});

			it('returns null for an unknown action id', () => {
				const balloon = new Notification.Balloon({ stack });
				assert.isNull(balloon.getAction('nope'));
			});
		});

		describe('state', () => {
			it('accepts a valid state', () => {
				const balloon = new Notification.Balloon({ stack });
				balloon.setState(Notification.State.OPEN);
				assert.equal(balloon.getState(), Notification.State.OPEN);
			});

			it('ignores an invalid state', () => {
				const balloon = new Notification.Balloon({ stack });
				balloon.setState(999);
				assert.equal(balloon.getState(), Notification.State.INIT);
			});

			it('resolves a state code', () => {
				const balloon = new Notification.Balloon({ stack });
				assert.equal(balloon.getStateCode(Notification.State.OPEN), 'OPEN');
				assert.equal(balloon.getStateCode(Notification.State.QUEUED), 'QUEUED');
				assert.isNull(balloon.getStateCode(999));
			});
		});

		describe('render', () => {
			it('returns the same container element on repeated calls', () => {
				const balloon = new Notification.Balloon({ stack });
				const first = balloon.getContainer();
				const second = balloon.getContainer();
				assert.strictEqual(first, second);
			});

			it('renders a container with the ui-notification-balloon class', () => {
				const balloon = new Notification.Balloon({ stack });
				assert.isTrue(balloon.getContainer().classList.contains('ui-notification-balloon'));
			});

			it('renders the content inside .ui-notification-balloon-message', () => {
				const balloon = new Notification.Balloon({ stack, content: 'hello world' });
				const message = balloon.getContainer().querySelector('.ui-notification-balloon-message');
				assert.isNotNull(message);
				assert.equal(message!.textContent, 'hello world');
			});

			it('renders the close button when visible', () => {
				const balloon = new Notification.Balloon({ stack });
				assert.isNotNull(balloon.getContainer().querySelector('.ui-notification-balloon-close-btn'));
			});

			it('omits the close button when closeButton is false', () => {
				const balloon = new Notification.Balloon({ stack, closeButton: false });
				assert.isNull(balloon.getContainer().querySelector('.ui-notification-balloon-close-btn'));
			});

			it('uses a custom render function when provided', () => {
				const customNode = document.createElement('div');
				customNode.className = 'custom-rendered';

				const balloon = new Notification.Balloon({
					stack,
					render: () => customNode,
				});

				assert.equal(balloon.getContainer().firstChild, customNode);
			});

			it('renders action containers inside .ui-notification-balloon-actions', () => {
				const balloon = new Notification.Balloon({
					stack,
					actions: [{ id: 'a1', title: 'OK' }],
				});

				const actionsRow = balloon.getContainer().querySelector('.ui-notification-balloon-actions');
				assert.isNotNull(actionsRow);
				assert.lengthOf(actionsRow!.children, 1);
			});
		});

		// Legacy subclasses (ui.notification-manager/BrowserNotification, intranet/PushInvitations)
		// write to inherited fields directly — `this.container`, `this.actions`,
		// `this.animationClassName` — and read other balloons' `.category` field.
		// Locking these as public fields guards against accidentally re-privatising them.
		describe('inheritance / legacy field access', () => {
			it('subclasses can override getContainer() by assigning this.container', () => {
				const customNode = document.createElement('div');
				customNode.id = 'subclass-container';

				class SubBalloon extends Notification.Balloon
				{
					getContainer(): HTMLElement
					{
						if (this.container === null)
						{
							this.container = customNode;
						}

						return this.container;
					}
				}

				const subStack = new Notification.Stack();
				const balloon = new SubBalloon({ stack: subStack });
				assert.strictEqual(balloon.getContainer(), customNode);
			});

			it('subclasses can replace this.actions with their own collection', () => {
				class SubBalloon extends Notification.Balloon
				{
					setActions(_actions: unknown): void
					{
						this.actions = [{ id: 'custom' } as never];
					}
				}

				const subStack = new Notification.Stack();
				const balloon = new SubBalloon({ stack: subStack, actions: [{ id: 'orig' }] });
				assert.lengthOf(balloon.getActions(), 1);
				assert.equal((balloon.getActions()[0] as unknown as { id: string }).id, 'custom');
			});

			it('subclasses can override the animation class via this.animationClassName', () => {
				class SubBalloon extends Notification.Balloon
				{
					render(): HTMLElement
					{
						this.animationClassName = 'sub-balloon-animate';
						const wrapper = document.createElement('div');

						return wrapper;
					}
				}

				const subStack = new Notification.Stack();
				const balloon = new SubBalloon({ stack: subStack });
				balloon.getContainer();
				assert.equal(balloon.animationClassName, 'sub-balloon-animate');
			});

			it('external code can read balloon.category directly (PushInvitations pattern)', () => {
				const subStack = new Notification.Stack();
				const balloon = new Notification.Balloon({ stack: subStack, category: 'push' });
				assert.equal((balloon as unknown as { category: string }).category, 'push');
			});
		});
	});

	describe('Event', () => {
		it('builds a fully-qualified event name', () => {
			assert.equal(
				Notification.Event.getFullName('onOpen'),
				'UI.Notification.Balloon:onOpen',
			);
		});

		it('returns the assigned balloon and name', () => {
			const stack = new Notification.Stack();
			const balloon = new Notification.Balloon({ stack });
			const event = new Notification.Event();

			event.setBalloon(balloon);
			event.setName('onClose');

			assert.equal(event.getBalloon(), balloon);
			assert.equal(event.getName(), 'onClose');
			assert.equal(event.getFullName(), 'UI.Notification.Balloon:onClose');
		});

		it('ignores a non-balloon argument in setBalloon', () => {
			const event = new Notification.Event();
			event.setBalloon('not a balloon');
			assert.isNull(event.getBalloon());
		});

		it('ignores an empty name in setName', () => {
			const event = new Notification.Event();
			event.setName('');
			assert.isNull(event.getName());
		});
	});

	describe('Action', () => {
		let stack: Stack;
		let balloon: Balloon;

		beforeEach(() => {
			stack = new Notification.Stack();
			balloon = new Notification.Balloon({ stack });
		});

		it('returns the parent balloon', () => {
			const action = new Notification.Action(balloon, { title: 'OK' });
			assert.equal(action.getBalloon(), balloon);
		});

		it('uses the provided id', () => {
			const action = new Notification.Action(balloon, { id: 'a1', title: 'OK' });
			assert.equal(action.getId(), 'a1');
		});

		it('generates an id when none is provided', () => {
			const action = new Notification.Action(balloon, { title: 'OK' });
			assert.isString(action.getId());
			assert.isAbove(action.getId().length, 0);
		});

		it('exposes a window reference', () => {
			const action = new Notification.Action(balloon, { title: 'OK' });
			assert.equal(action.getWindow(), window);
		});

		it('returns null when title is missing', () => {
			const action = new Notification.Action(balloon, { id: 'a1' });
			assert.isNull(action.getTitle());
		});

		it('returns null when href is missing', () => {
			const action = new Notification.Action(balloon, { title: 'OK' });
			assert.isNull(action.getHref());
		});

		it('renders an anchor when href is provided', () => {
			const action = new Notification.Action(balloon, {
				title: 'Go',
				href: 'https://example.com',
			});
			const container = action.getContainer();
			assert.equal(container.tagName, 'A');
			assert.equal(container.getAttribute('href'), 'https://example.com');
			assert.equal(container.textContent, 'Go');
		});

		it('renders a span when no href is provided', () => {
			const action = new Notification.Action(balloon, { title: 'OK' });
			const container = action.getContainer();
			assert.equal(container.tagName, 'SPAN');
			assert.equal(container.textContent, 'OK');
		});

		it('returns the same container on repeated calls', () => {
			const action = new Notification.Action(balloon, { title: 'OK' });
			assert.strictEqual(action.getContainer(), action.getContainer());
		});

		it('invokes a click handler with (event, balloon, action) arguments', () => {
			let received: { balloonArg: unknown; actionArg: unknown } | null = null;
			const action = new Notification.Action(balloon, {
				title: 'Click',
				events: {
					click: (_event: Event, balloonArg: Balloon, actionArg: Action) => {
						received = { balloonArg, actionArg };
					},
				},
			});

			action.getContainer().click();

			assert.isNotNull(received);
			assert.equal(received!.balloonArg, balloon);
			assert.equal(received!.actionArg, action);
		});

		it('attaches non-click handlers as well', () => {
			let entered = false;
			const action = new Notification.Action(balloon, {
				title: 'Hover',
				events: {
					mouseenter: () => { entered = true; },
				},
			});

			action.getContainer().dispatchEvent(new MouseEvent('mouseenter'));
			assert.isTrue(entered);
		});

		it('ignores non-function values in events', () => {
			assert.doesNotThrow(() => {
				new Notification.Action(balloon, {
					title: 'Bad',
					events: { click: 'not-a-fn' as unknown as Function },
				});
			});
		});

		// ui.notification-manager/BrowserNotificationAction reads `this.events.click`
		// directly to forward it to a custom Button instance — these fields must remain
		// publicly accessible (not `#private`) for the override to keep working.
		it('exposes the events map publicly for subclasses', () => {
			let received: unknown = null;
			const action = new Notification.Action(balloon, {
				title: 'OK',
				events: {
					click: (event: Event) => { received = event; },
				},
			});

			const publicEvents = (action as unknown as { events: Record<string, (event: Event) => void> }).events;
			assert.isFunction(publicEvents.click);

			const synthetic = new MouseEvent('click');
			publicEvents.click(synthetic);
			assert.equal(received, synthetic);
		});

		it('exposes the container field publicly so subclasses can override getContainer()', () => {
			const action = new Notification.Action(balloon, { title: 'OK' });
			const replacement = document.createElement('div');
			replacement.className = 'sub-action-container';

			(action as unknown as { container: HTMLElement | null }).container = replacement;
			assert.strictEqual(action.getContainer(), replacement);
		});
	});

	describe('Manager (Center singleton)', () => {
		afterEach(() => {
			Object.values(Notification.Center.balloons).forEach((balloon) => balloon.close());
			Object.values(Notification.Center.stacks).forEach((stack) => stack.clear());
		});

		it('exposes Center as a lazy singleton', () => {
			const first = Notification.Center;
			const second = Notification.Center;
			assert.equal(first, second);
			assert.instanceOf(first, Notification.Manager);
		});

		it('returns a Balloon from notify()', () => {
			const balloon = Notification.Center.notify({ content: 'first' });
			assert.instanceOf(balloon, Notification.Balloon);
		});

		it('stores the balloon under its id', () => {
			const balloon = Notification.Center.notify({ id: 'unique-1', content: 'a' });
			assert.equal(Notification.Center.getBalloonById('unique-1'), balloon);
		});

		it('deduplicates by id — repeated notify keeps the same balloon', () => {
			Notification.Center.notify({ id: 'dedup-id', content: 'first' });
			const second = Notification.Center.notify({ id: 'dedup-id', content: 'second' });

			assert.isUndefined(second);
			assert.equal(Notification.Center.getBalloonById('dedup-id')!.getContent(), 'second');
		});

		it('deduplicates by category', () => {
			Notification.Center.notify({ category: 'errors', content: 'first' });
			Notification.Center.notify({ category: 'errors', content: 'second' });

			const matching = Object.values(Notification.Center.balloons)
				.filter((balloon) => balloon.getCategory() === 'errors');

			assert.lengthOf(matching, 1);
			assert.equal(matching[0].getContent(), 'second');
		});

		it('returns null for an unknown id', () => {
			assert.isNull(Notification.Center.getBalloonById('does-not-exist'));
		});

		it('returns null for an unknown category', () => {
			assert.isNull(Notification.Center.getBalloonByCategory('does-not-exist'));
		});

		it('uses top-right as the default position', () => {
			assert.equal(Notification.Center.getDefaultPosition(), 'top-right');
		});

		it('changes the default position when given a valid value', () => {
			const previous = Notification.Center.getDefaultPosition();
			Notification.Center.setDefaultPosition('bottom-left');
			assert.equal(Notification.Center.getDefaultPosition(), 'bottom-left');
			Notification.Center.setDefaultPosition(previous);
		});

		it('ignores an invalid default position', () => {
			const previous = Notification.Center.getDefaultPosition();
			Notification.Center.setDefaultPosition('top-middle');
			assert.equal(Notification.Center.getDefaultPosition(), previous);
		});

		it('reuses the per-position stack on subsequent notify calls', () => {
			const first = Notification.Center.notify({ position: 'bottom-left', content: 'a' });
			const second = Notification.Center.notify({ position: 'bottom-left', content: 'b' });

			assert.equal(first!.getStack(), second!.getStack());
		});

		it('merges balloon defaults into new balloons', () => {
			Notification.Center.setBalloonDefaults({ width: 555 });
			const balloon = Notification.Center.notify({ content: 'with default width' });

			assert.equal(balloon!.getWidth(), 555);

			Notification.Center.setBalloonDefaults({ width: 400 });
		});

		it('combines balloon defaults across repeated setBalloonDefaults calls', () => {
			// Matches the sandbox button: setBalloonDefaults({autoHideDelay: 9999, width: 600})
			Notification.Center.setBalloonDefaults({ width: 600 });
			Notification.Center.setBalloonDefaults({ autoHideDelay: 9999 });

			const balloon = Notification.Center.notify({ content: 'merged defaults' });

			assert.equal(balloon!.getWidth(), 600);
			assert.equal(balloon!.getAutoHideDelay(), 9999);

			Notification.Center.setBalloonDefaults({ width: 400, autoHideDelay: 8000 });
		});

		it('lets explicit notify options override balloon defaults', () => {
			Notification.Center.setBalloonDefaults({ width: 600, autoHideDelay: 9999 });
			const balloon = Notification.Center.notify({ content: 'override', width: 200 });

			assert.equal(balloon!.getWidth(), 200);
			assert.equal(balloon!.getAutoHideDelay(), 9999);

			Notification.Center.setBalloonDefaults({ width: 400, autoHideDelay: 8000 });
		});

		describe('setStackDefaults', () => {
			it('updates options of the stack at the given position', () => {
				Notification.Center.setStackDefaults('top-left', { spacing: 33 });
				const balloon = Notification.Center.notify({ position: 'top-left', content: 'a' });
				assert.equal(balloon!.getStack().getSpacing(), 33);
			});

			it('updates options for all positions when called with an object', () => {
				Notification.Center.setStackDefaults({ offsetX: 99 });

				const a = Notification.Center.notify({ position: 'bottom-left', content: 'a' });
				const b = Notification.Center.notify({ position: 'top-center', content: 'b' });

				assert.equal(a!.getStack().getOffsetX(), 99);
				assert.equal(b!.getStack().getOffsetX(), 99);
			});

			it('ignores the position key inside the options object', () => {
				// Matches the sandbox usage: setStackDefaults({ position: 'bottom-left', ... })
				// where `position` is just a stray key — the Stack's own position must not change.
				Notification.Center.setStackDefaults({
					position: 'bottom-left',
					spacing: 12,
					offsetX: 13,
					offsetY: 14,
				});

				const balloon = Notification.Center.notify({ position: 'top-right', content: 'a' });

				assert.equal(balloon!.getStack().getPosition(), 'top-right');
				assert.equal(balloon!.getStack().getSpacing(), 12);
				assert.equal(balloon!.getStack().getOffsetX(), 13);
				assert.equal(balloon!.getStack().getOffsetY(), 14);
			});

			it('resolves a balloonType class name through BX.getClass for every position', () => {
				class SandboxBalloon extends Notification.Balloon {}
				(globalThis as unknown as { SandboxBalloon: typeof SandboxBalloon }).SandboxBalloon = SandboxBalloon;

				try
				{
					Notification.Center.setStackDefaults({ balloonType: 'SandboxBalloon' });

					const balloon = Notification.Center.notify({ position: 'top-left', content: 'a' });
					assert.instanceOf(balloon, SandboxBalloon);
				}
				finally
				{
					delete (globalThis as unknown as { SandboxBalloon?: unknown }).SandboxBalloon;
				}
			});
		});

		describe('addStack', () => {
			it('registers a Stack instance under its id', () => {
				const customStack = new Notification.Stack({ id: 'custom-stack' });
				Notification.Center.addStack(customStack);

				assert.equal(Notification.Center.getStack('custom-stack'), customStack);
			});

			it('does not overwrite a stack that is already registered', () => {
				const first = new Notification.Stack({ id: 'same-id' });
				const second = new Notification.Stack({ id: 'same-id' });

				Notification.Center.addStack(first);
				Notification.Center.addStack(second);

				assert.equal(Notification.Center.getStack('same-id'), first);
			});

			it('ignores non-Stack values', () => {
				assert.doesNotThrow(() => {
					Notification.Center.addStack({} as unknown as Stack);
				});
			});
		});
	});

	describe('Custom events (BX.addCustomEvent contract)', () => {
		const EVENT_NAME = Notification.Event.getFullName('onTestEvent');

		afterEach(() => {
			Object.values(Notification.Center.balloons).forEach((balloon) => balloon.close());
		});

		it('fires events through the global BX.addCustomEvent bus', () => {
			let received: NotificationEvent | null = null;
			const handler = (event: NotificationEvent) => {
				received = event;
			};

			BX.addCustomEvent(EVENT_NAME, handler);

			const stack = new Notification.Stack();
			const balloon = new Notification.Balloon({ stack });
			balloon.fireEvent('onTestEvent');

			BX.removeCustomEvent(EVENT_NAME, handler);

			assert.isNotNull(received);
			assert.instanceOf(received, Notification.Event);
			assert.equal(received!.getBalloon(), balloon);
			assert.equal(received!.getName(), 'onTestEvent');
		});

		it('removes handlers via BX.removeCustomEvent', () => {
			let callCount = 0;
			const handler = () => {
				callCount += 1;
			};

			BX.addCustomEvent(EVENT_NAME, handler);

			const stack = new Notification.Stack();
			const balloon = new Notification.Balloon({ stack });
			balloon.fireEvent('onTestEvent');

			BX.removeCustomEvent(EVENT_NAME, handler);
			balloon.fireEvent('onTestEvent');

			assert.equal(callCount, 1);
		});

		it('delivers events to options.events listeners', () => {
			let received: NotificationEvent | null = null;
			const stack = new Notification.Stack();
			const balloon = new Notification.Balloon({
				stack,
				events: {
					onTestEvent: (event: NotificationEvent) => {
						received = event;
					},
				},
			});

			balloon.fireEvent('onTestEvent');

			assert.isNotNull(received);
			assert.equal(received!.getBalloon(), balloon);
		});

		it('fireEvent returns the dispatched Event instance', () => {
			const stack = new Notification.Stack();
			const balloon = new Notification.Balloon({ stack });

			const event = balloon.fireEvent('onTestEvent');

			assert.instanceOf(event, Notification.Event);
			assert.equal(event.getBalloon(), balloon);
			assert.equal(event.getName(), 'onTestEvent');
		});
	});
});
