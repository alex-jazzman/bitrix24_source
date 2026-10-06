import { Dom, Event, Type } from 'main.core';
import { FocusZone, FocusKeys, FocusNavigator, InputModalityTracker, InteractivityChecker } from 'ui.a11y';

import { activateByKey } from './activation';

const ITEM_SELECTOR = '[role="menuitem"], [role="menuitemcheckbox"]';
const NAVIGATION_KEYS = new Set(['ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown']);
const POINTER_FOCUS_CLASS = '--pointer-focus';
const TYPEAHEAD_RESET_DELAY = 500;
const SCROLL_HOVER_MUTE_DELAY = 100;
// Diacritics do not have to be typed: "e" matches "Éditer", as in the legacy menu.
const collator = new Intl.Collator(undefined, { sensitivity: 'base' });

// The single source of truth for the item set: the FocusZone, the initial focus
// target and the typeahead all walk the same filter, so a natively disabled or
// hidden item never falls out of one set while staying in another.
const isMenuItem = (element: HTMLElement): boolean => element.matches(ITEM_SELECTOR);

export type MenuKeyboardOptions = {
	itemsContainer: HTMLElement,
	eventContainer: HTMLElement,
	isSubMenu: boolean,
	richHeader: HTMLElement | null,
	onClose: () => void,
	onCloseAll: () => void,
	onOpenSubMenu: (itemAction: HTMLElement) => void,
	onItemFocusMoved: () => void,
	isFocusInsideMenu: () => boolean,
};

/**
 * Keyboard support for one level of a `ui.system.menu` popup: arrows, Home / End
 * and PageUp / PageDown come from the `FocusZone`, the rest is here.
 *
 * Escape is left to `main.popup`: its keyup queue closes only the top-most popup.
 */
export class MenuKeyboard
{
	#itemsContainer: HTMLElement;
	#eventContainer: HTMLElement;
	#isSubMenu: boolean;
	#richHeader: HTMLElement | null;
	#onClose: () => void;
	#onCloseAll: () => void;
	#onOpenSubMenu: (itemAction: HTMLElement) => void;
	#onItemFocusMoved: () => void;
	#isFocusInsideMenu: () => boolean;
	#focusZone: FocusZone;

	#lastPointerPosition: { left: number, top: number } | null = null;
	#scrolledUntil: number = 0;
	#typeaheadBuffer: string = '';
	#typeaheadTimer: number = 0;

	#keyDownHandler = this.#handleKeyDown.bind(this);
	#mouseOverHandler = this.#handleMouseOver.bind(this);
	#mouseLeaveHandler = (): void => {
		// The pointer no longer points at anything here: the focused item must stop
		// looking hovered and get its keyboard outline back.
		this.#setPointerFocus(false);
		this.#lastPointerPosition = null;
	};

	#scrollHandler = (): void => {
		this.#scrolledUntil = Date.now() + SCROLL_HOVER_MUTE_DELAY;
	};

	constructor(options: MenuKeyboardOptions)
	{
		this.#itemsContainer = options.itemsContainer;
		this.#eventContainer = options.eventContainer;
		this.#isSubMenu = options.isSubMenu;
		this.#richHeader = options.richHeader;
		this.#onClose = options.onClose;
		this.#onCloseAll = options.onCloseAll;
		this.#onOpenSubMenu = options.onOpenSubMenu;
		this.#onItemFocusMoved = options.onItemFocusMoved;
		this.#isFocusInsideMenu = options.isFocusInsideMenu;

		this.#focusZone = new FocusZone(this.#itemsContainer, {
			bindKeys: FocusKeys.ArrowVertical | FocusKeys.HomeAndEnd | FocusKeys.PageUpDown,
			focusOutBehavior: 'wrap',
			focusableElementFilter: isMenuItem,
		});
	}

	activate(): void
	{
		// The FocusZone holds the activity state for the whole controller.
		if (this.#focusZone.isActive())
		{
			return;
		}

		this.#focusZone.activate();
		Event.bind(this.#eventContainer, 'keydown', this.#keyDownHandler);
		Event.bind(this.#itemsContainer, 'mouseover', this.#mouseOverHandler);
		Event.bind(this.#itemsContainer, 'mouseleave', this.#mouseLeaveHandler);
		// Scroll does not bubble, hence the capture phase.
		Event.bind(this.#eventContainer, 'scroll', this.#scrollHandler, true);
	}

	isActive(): boolean
	{
		return this.#focusZone.isActive();
	}

	deactivate(): void
	{
		if (!this.#focusZone.isActive())
		{
			return;
		}

		this.#focusZone.deactivate();
		Event.unbind(this.#eventContainer, 'keydown', this.#keyDownHandler);
		Event.unbind(this.#itemsContainer, 'mouseover', this.#mouseOverHandler);
		Event.unbind(this.#itemsContainer, 'mouseleave', this.#mouseLeaveHandler);
		Event.unbind(this.#eventContainer, 'scroll', this.#scrollHandler, true);
		this.#setPointerFocus(false);
		this.#scrolledUntil = 0;
		this.#lastPointerPosition = null;
		this.#clearTypeahead();
	}

	/**
	 * Re-reads the item set after the menu re-rendered its items into the same
	 * container: the roving tabindex and the navigation order follow the new set.
	 */
	refresh(): void
	{
		this.#focusZone.refreshElements();
	}

	destroy(): void
	{
		this.deactivate();
	}

	getInitialFocusTarget(): HTMLElement | null
	{
		return this.#getFirstItem();
	}

	/**
	 * Where the focus sits within the item set, so an update that drops the focused
	 * item can put the focus back at the same place instead of the top.
	 */
	getFocusedPosition(): number
	{
		return this.#getItems().indexOf(FocusNavigator.getActiveElement(this.#itemsContainer));
	}

	getItemAtPosition(position: number): HTMLElement | null
	{
		if (position < 0)
		{
			return null;
		}

		const items = this.#getItems();

		return items[Math.min(position, items.length - 1)] ?? null;
	}

	#getItems(): HTMLElement[]
	{
		const walker = FocusNavigator.createWalker(this.#itemsContainer, { accept: isMenuItem });
		const items: HTMLElement[] = [];
		for (let node = walker.nextNode(); node !== null; node = walker.nextNode())
		{
			items.push(node);
		}

		return items;
	}

	#getFirstItem(): HTMLElement | null
	{
		// tabbableOnly defaults to true in FocusNavigator, but under a roving tabindex
		// every item but the current one is tabindex="-1".
		return FocusNavigator.getFirst(this.#itemsContainer, { accept: isMenuItem, tabbableOnly: false });
	}

	#getLastItem(): HTMLElement | null
	{
		return FocusNavigator.getLast(this.#itemsContainer, { accept: isMenuItem, tabbableOnly: false });
	}

	#handleKeyDown(event: KeyboardEvent): void
	{
		if (!InputModalityTracker.isBareModifier(event.key))
		{
			// Any real key means the user is back on the keyboard: the focused item
			// must read as focused again, not as merely hovered.
			this.#setPointerFocus(false);
		}

		if (event.defaultPrevented)
		{
			// The FocusZone already handled this key (focus is on a menu item).
			if (NAVIGATION_KEYS.has(event.key))
			{
				this.#onItemFocusMoved();
			}

			return;
		}

		const { key, target } = event;
		if (this.#isOutsideItems(target) && !this.#spansWholePopup(key, target))
		{
			// Focus sits on a control of the popup itself (a rich header, a title bar
			// field), not on a menu item: menu keys must not hijack its input.
			return;
		}

		if (NAVIGATION_KEYS.has(key))
		{
			this.#handleNavigationBootstrap(event);

			return;
		}

		switch (key)
		{
			case 'Enter':
			case ' ':
				this.#activateCurrent(event);
				break;

			case 'ArrowRight':
				this.#openSubMenu(event);
				break;

			case 'ArrowLeft':
				this.#closeLevel(event);
				break;

			case 'Tab':
				this.#handleTab(event);
				break;

			default:
				this.#handleTypeahead(event);
		}
	}

	#isOutsideItems(target: EventTarget): boolean
	{
		return (
			Type.isElementNode(target)
			&& target !== this.#eventContainer
			&& !this.#itemsContainer.contains(target)
		);
	}

	#spansWholePopup(key: string, target: HTMLElement): boolean
	{
		// Tab spans the popup wherever focus sits, and so does menu navigation — unless
		// the focused control consumes those keys itself: a field moves its caret, a
		// <select> walks its own options.
		return key === 'Tab' || (NAVIGATION_KEYS.has(key) && !InteractivityChecker.isEditable(target));
	}

	#handleNavigationBootstrap(event: KeyboardEvent): void
	{
		// Reached only when the FocusZone did not act, i.e. focus is not on a
		// managed item yet (popup container after a pointer open, rich header).
		if (this.#itemsContainer.contains(FocusNavigator.getActiveElement(this.#itemsContainer)))
		{
			return;
		}

		// The key belongs to the menu either way: an empty menu must not scroll the
		// page (and the popup along with the bind element) behind itself.
		event.preventDefault();

		const target = (event.key === 'ArrowUp' || event.key === 'End' || event.key === 'PageDown')
			? this.#getLastItem()
			: this.#getFirstItem();

		if (target)
		{
			target.focus({ preventScroll: true });
			this.#onItemFocusMoved();
		}
	}

	#handleMouseOver(event: MouseEvent): void
	{
		// A scroll re-fires mouseover for whatever slid under a still cursor, so a
		// hover right after one is not the user pointing at an item: arrow navigation
		// scrolls the list itself, and the focus must stay where the keyboard put it.
		if (Date.now() < this.#scrolledUntil)
		{
			return;
		}

		const pointerMoved = (
			this.#lastPointerPosition === null
			|| this.#lastPointerPosition.left !== event.clientX
			|| this.#lastPointerPosition.top !== event.clientY
		);

		this.#lastPointerPosition = { left: event.clientX, top: event.clientY };

		const action = this.#getEventItem(event);
		if (!pointerMoved || !action || !this.#canSyncHoverFocus())
		{
			return;
		}

		// Hover is pointer input: the item under the mouse must read as hovered,
		// without the keyboard outline, even right after arrow navigation.
		this.#setPointerFocus(true);

		if (action !== FocusNavigator.getActiveElement(action))
		{
			action.focus({ preventScroll: true });
		}
	}

	#canSyncHoverFocus(): boolean
	{
		// Hover must not steal focus from an interactive control of the popup, nor from
		// anything outside this menu's own tree (another open menu included). The popup
		// container itself holds no control: it is where a pointer-opened menu starts.
		return FocusNavigator.getActiveElement(this.#eventContainer) === this.#eventContainer
			|| this.#isFocusInsideMenu();
	}

	#setPointerFocus(enabled: boolean): void
	{
		// A local marker instead of the global input modality: hover is not a document
		// -wide input event, and other widgets must not read it as one.
		if (enabled)
		{
			Dom.addClass(this.#itemsContainer, POINTER_FOCUS_CLASS);
		}
		else
		{
			Dom.removeClass(this.#itemsContainer, POINTER_FOCUS_CLASS);
		}
	}

	#activateCurrent(event: KeyboardEvent): void
	{
		const action = this.#getEventItem(event);
		if (!action)
		{
			// Space with focus on the popup container itself (a pointer-opened menu
			// before the first navigation) must not scroll the page behind the menu.
			if (event.key === ' ' && event.target === this.#eventContainer)
			{
				event.preventDefault();
			}

			return;
		}

		// The same reach as a mouse click, whatever the item carries: a click handler,
		// a submenu, or both (a parent item may run an action and open its submenu).
		activateByKey(event, action);

		if (action.getAttribute('aria-haspopup') === 'menu')
		{
			this.#onOpenSubMenu(action);
		}
	}

	#handleTab(event: KeyboardEvent): void
	{
		if (this.#richHeader)
		{
			// An interactive rich header turns Tab / Shift+Tab into a closed cycle
			// over the header, the current menu item and the rest of the focusable
			// other popup controls; the menu never closes.
			this.#cycleRichHeaderFocus(event);

			return;
		}

		const from = this.#getTabOrigin(event);
		if (from && this.#getTabNeighbour(from, event.shiftKey, false))
		{
			// Focus moves between the items and the other focusable popup controls (a rich
			// header, title bar controls, the close icon): the trap handles it.
			return;
		}

		// Tab would cross the outer popup boundary (a looped trap would wrap it) or
		// focus sits outside any tabbable: close every menu level (APG).
		event.preventDefault();
		this.#onCloseAll();
	}

	#cycleRichHeaderFocus(event: KeyboardEvent): void
	{
		event.preventDefault();

		const from = this.#getTabOrigin(event);
		if (!from)
		{
			// From the popup container (a pointer-opened menu): step onto the header.
			this.#richHeader.focus({ preventScroll: true });

			return;
		}

		const target = this.#getTabNeighbour(from, event.shiftKey, true);
		if (!target || target === from)
		{
			// Nothing but the header (an empty menu, no other controls): the header must not
			// become an endless Tab cycle, so close every menu level.
			this.#onCloseAll();

			return;
		}

		target.focus({ preventScroll: true });
	}

	#getTabNeighbour(from: HTMLElement, reversed: boolean, wrap: boolean): HTMLElement | null
	{
		// The same tabbable set the FocusTrap walks, so the predicted boundary cannot
		// drift apart from where the trap actually wraps focus.
		const options = { from, tabbableOnly: true, wrap };

		return reversed
			? FocusNavigator.getPrevious(this.#eventContainer, options)
			: FocusNavigator.getNext(this.#eventContainer, options);
	}

	#getTabOrigin(event: KeyboardEvent): HTMLElement | null
	{
		// The popup container is not a tabbable itself: Tab from it has no neighbour
		// to step to, it either enters the popup controls or leaves the menu.
		const { target } = event;
		const isInside = (
			Type.isElementNode(target)
			&& target !== this.#eventContainer
			&& this.#eventContainer.contains(target)
		);

		return isInside ? target : null;
	}

	#openSubMenu(event: KeyboardEvent): void
	{
		const action = this.#getEventItem(event);
		if (!action || action.getAttribute('aria-haspopup') !== 'menu')
		{
			return;
		}

		event.preventDefault();
		this.#onOpenSubMenu(action);
	}

	#closeLevel(event: KeyboardEvent): void
	{
		if (!this.#isSubMenu)
		{
			return;
		}

		event.preventDefault();
		event.stopPropagation();
		this.#onClose();
	}

	#getEventItem(event: KeyboardEvent | MouseEvent): HTMLElement | null
	{
		const { target } = event;

		return Type.isElementNode(target) ? this.#getOwnItem(target) : null;
	}

	#getOwnItem(node: HTMLElement): HTMLElement | null
	{
		const action = node.closest(ITEM_SELECTOR);

		return action && this.#itemsContainer.contains(action) ? action : null;
	}

	#handleTypeahead(event: KeyboardEvent): void
	{
		// 229 flags a composition keystroke (IME) in engines that do not set isComposing.
		if (event.isComposing || event.keyCode === 229)
		{
			return;
		}

		// AltGr types a third-level character and reports itself as Ctrl+Alt on Windows,
		// so such a keystroke is input, not a shortcut.
		const altGraph = event.getModifierState('AltGraph') || (event.ctrlKey && event.altKey);
		if (!altGraph && (event.ctrlKey || event.metaKey || event.altKey))
		{
			return;
		}

		const char = event.key;
		if (char.length !== 1 || char === ' ')
		{
			return;
		}

		event.preventDefault();

		this.#typeaheadBuffer += char;
		this.#restartTypeaheadTimer();

		const match = this.#findTypeaheadMatch();
		if (match)
		{
			// The modality tracker treats any non-modifier key as keyboard input,
			// so the matched item gets the visible keyboard outline on focus.
			match.focus({ preventScroll: true });
			this.#onItemFocusMoved();
		}
	}

	#findTypeaheadMatch(): HTMLElement | null
	{
		const items = this.#getItems();

		// A buffer of one repeated character means the user is cycling through the
		// items that start with it (APG), so it collapses to that single character.
		const buffer = this.#typeaheadBuffer;
		const query = new Set(buffer).size === 1 ? buffer[0] : buffer;

		// A single character cycles, so the search starts after the focused item and
		// wraps around onto it. A longer prefix is a refinement (APG): the focused
		// item is checked first and keeps focus while it still matches.
		const currentIndex = items.indexOf(FocusNavigator.getActiveElement(this.#itemsContainer));
		const startIndex = this.#getTypeaheadStartIndex(currentIndex, query.length);
		const candidates = [...items.slice(startIndex), ...items.slice(0, startIndex)];

		return candidates.find((element: HTMLElement): boolean => {
			const label = this.#getItemLabel(element).slice(0, query.length);

			return collator.compare(query, label) === 0;
		}) ?? null;
	}

	#getTypeaheadStartIndex(currentIndex: number, queryLength: number): number
	{
		if (currentIndex === -1)
		{
			return 0;
		}

		return queryLength === 1 ? currentIndex + 1 : currentIndex;
	}

	#getItemLabel(action: HTMLElement): string
	{
		const titleNode = action.querySelector('.ui-popup-menu-item-title-text');
		const text = titleNode ? titleNode.textContent : action.textContent;

		return (text ?? '').trim();
	}

	#restartTypeaheadTimer(): void
	{
		clearTimeout(this.#typeaheadTimer);
		this.#typeaheadTimer = setTimeout((): void => {
			this.#typeaheadBuffer = '';
		}, TYPEAHEAD_RESET_DELAY);
	}

	#clearTypeahead(): void
	{
		clearTimeout(this.#typeaheadTimer);
		this.#typeaheadBuffer = '';
	}
}
