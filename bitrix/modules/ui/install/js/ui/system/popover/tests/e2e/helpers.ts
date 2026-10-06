export type Rect = { left: number; top: number; right: number; bottom: number; width: number; height: number };

// Mirror of PopoverState: the specs read the public state of the popover, so the shape is repeated here
// rather than imported - page.evaluate cannot close over module scope.
export type State = {
	shown: boolean;
	positioned: boolean;
	position: string | null;
	alignment: string;
	flipped: boolean;
	slide: { x: number; y: number };
	anchorHidden: boolean;
	pointerHidden: boolean;
	constrained: { maxWidth: number; maxHeight: number } | null;
	rect: Rect | null;
};

export type PopHelpers = {
	anchor: (style?: string) => HTMLElement;
	create: (options: Record<string, any>) => any;
	openMenu: (bindElement: HTMLElement, options?: Record<string, any>) => any;
	openPopup: (options?: Record<string, any>) => any;
	settle: () => Promise<void>;
	reset: () => void;
	rect: () => Rect | null;
	container: () => HTMLElement | null;
	bubble: () => HTMLElement | null;
	state: () => State | null;
	shown: () => boolean;
	popoverCount: () => number;
	popupCount: () => number;
};

declare global {
	interface Window {
		BX: any;
		__pop: PopHelpers;
		__popover?: any;
		// The node the last created popover was given as content - that node is its bubble.
		__bubble?: HTMLElement;
		// The second instance of a spec that keeps two popovers alive at once.
		__otherPopover?: any;
		__escReachedDocument?: boolean;
	}
}

// Installed in the sandbox page context. The sandbox is a bare page, so the cross-layer arbitration is not
// polluted by the service layers of a real portal.
export const installHelpers = (): void => {
	const NS = window.BX.UI.System.Popover;
	const created: any[] = [];
	const menus: any[] = [];
	const popups: any[] = [];

	// The bubble radius the arrow geometry cases rely on. The popover no longer takes it as an option, so the
	// sandbox declares it the way a consumer would: plain CSS on the bubble, which is the node handed over as
	// content. No selector of the extension takes part; the class is asked for by the bubbleClass option of
	// create() below. The class name is repeated literally in the specs - page.evaluate cannot close over
	// module scope.
	const radiusStyle = document.createElement('style');
	radiusStyle.textContent = '.pop-radius-16 { border-radius: 16px; }';
	document.head.appendChild(radiusStyle);

	// How many frames in a row the page has to look the same before it counts as settled, and how long the
	// wait may last at most.
	const SETTLE_STABLE_FRAMES = 3;
	const SETTLE_DEADLINE = 3000;

	// What "nothing is moving any more" is read off: the published state of every popover the sandbox created,
	// plus the box and the visibility of every layer on the page - the popover roots, their arrows, and the
	// popups of main.popup the layering specs open next to a popover.
	const settleSignature = (): string => {
		const states = created.map((popover) => JSON.stringify(popover.getState()));
		const boxes: string[] = [];

		document
			.querySelectorAll<HTMLElement>('.ui-system-popover, .ui-system-popover__pointer, .popup-window')
			.forEach((element) => {
				const { left, top, width, height } = element.getBoundingClientRect();
				const { display, visibility } = getComputedStyle(element);
				boxes.push(`${left}|${top}|${width}|${height}|${display}|${visibility}`);
			});

		return JSON.stringify({ states, boxes });
	};

	// A popover that is shown and not yet positioned is a cycle still running, whatever the geometry says: the
	// very first frames of a show look perfectly still because nothing has been written yet.
	const settlePending = (): boolean => {
		return created.some((popover) => {
			const state = popover.getState();

			return state.shown === true && state.positioned === false;
		});
	};

	// The bubble of the popover is the node given as content, and the extension puts no class on it: a spec
	// that paints or rounds the bubble hands its own class through bubbleClass.
	const toBubble = (content: unknown): HTMLElement => {
		if (content instanceof HTMLElement)
		{
			return content;
		}

		const template = document.createElement('template');
		template.innerHTML = typeof content === 'string'
			? content
			: '<div style="width: 160px; height: 60px;">content</div>';

		return template.content.firstElementChild as HTMLElement;
	};

	window.__pop = {
		anchor: (style = 'left: 400px; top: 260px; width: 120px; height: 40px;'): HTMLElement => {
			const node = document.createElement('button');
			node.textContent = 'anchor';
			node.style.cssText = `position: absolute; ${style}`;
			document.body.appendChild(node);

			return node;
		},
		create: (options: Record<string, any>): any => {
			const { bubbleClass, content, ...rest } = options;
			const bubble = toBubble(content);
			if (typeof bubbleClass === 'string')
			{
				bubble.classList.add(bubbleClass);
			}

			const popover = new NS.Popover({ content: bubble, ...rest });
			created.push(popover);
			window.__popover = popover;
			window.__bubble = bubble;
			popover.show();

			return popover;
		},
		openMenu: (bindElement: HTMLElement, options: Record<string, any> = {}): any => {
			const menu = new window.BX.UI.System.Menu({
				closeByEsc: true,
				items: [{ text: 'One' }, { text: 'Two' }],
				...options,
			});
			menu.show(bindElement);
			menus.push(menu);

			return menu;
		},
		openPopup: (options: Record<string, any> = {}): any => {
			const popup = new window.BX.Main.Popup({
				content: '<div style="width: 180px; height: 60px;">popup</div>',
				...options,
			});
			popup.show();
			popups.push(popup);

			return popup;
		},
		// Positioning is async - the vendor computation plus the microtasks around it - so a fixed number of
		// frames is a bet on how loaded the machine is, and a lost bet reads as "the popover is positioned
		// wrong" instead of "we did not wait long enough". What is waited for here is the condition itself:
		// every popover the sandbox created has a position applied, and the geometry of the layers on the page
		// repeats itself frame after frame. The deadline only keeps a page that never comes to rest from
		// hanging the evaluate - the check after it is what then fails, and it names the real problem.
		settle: (): Promise<void> => {
			return new Promise((resolve) => {
				const deadline = performance.now() + SETTLE_DEADLINE;
				let previous: string | null = null;
				let stable = 0;

				const step = (): void => {
					const current = settleSignature();
					stable = current === previous && !settlePending() ? stable + 1 : 0;
					previous = current;

					if (stable >= SETTLE_STABLE_FRAMES || performance.now() >= deadline)
					{
						// One macrotask on the way out: whatever the last frame queued runs before the check.
						setTimeout(resolve, 0);

						return;
					}

					requestAnimationFrame(step);
				};

				requestAnimationFrame(step);
			});
		},
		reset: (): void => {
			created.forEach((popover) => { try { popover.destroy(); } catch (error) { /* noop */ } });
			created.length = 0;
			menus.forEach((menu) => { try { menu.getPopup() && menu.getPopup().destroy(); } catch (error) { /* noop */ } });
			menus.length = 0;
			popups.forEach((popup) => { try { popup.destroy(); } catch (error) { /* noop */ } });
			popups.length = 0;
			window.__escReachedDocument = false;
		},
		rect: (): Rect | null => {
			const element = window.__pop.container();
			if (element === null)
			{
				return null;
			}

			const { left, top, right, bottom, width, height } = element.getBoundingClientRect();

			return { left, top, right, bottom, width, height };
		},
		container: (): HTMLElement | null => document.querySelector('.ui-system-popover:not(.--hidden)'),
		bubble: (): HTMLElement | null => window.__bubble ?? null,
		// null only while no popover has been created: an existing one always answers with a state.
		state: (): State | null => (window.__popover ? window.__popover.getState() : null),
		shown: (): boolean => Boolean(window.__popover && window.__popover.isShown()),
		popoverCount: (): number => document.querySelectorAll('.ui-system-popover:not(.--hidden)').length,
		// Visible popups only: a closed cacheable main.popup stays in the DOM as display: none.
		popupCount: (): number => {
			return Array.from(document.querySelectorAll<HTMLElement>('.popup-window'))
				.filter((element) => getComputedStyle(element).display !== 'none')
				.length;
		},
	};

	// Witness that we did not swallow the closing event: this bubble listener only fires if it reached
	// document.
	document.addEventListener('keyup', (event: KeyboardEvent) => {
		if (event.key === 'Escape')
		{
			window.__escReachedDocument = true;
		}
	});
};
