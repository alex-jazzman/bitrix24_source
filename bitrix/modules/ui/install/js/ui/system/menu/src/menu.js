import { Dom, Event, Tag, Text, Type } from 'main.core';
import { Popup } from 'main.popup';
import { Main } from 'ui.icon-set.api.core';
import 'ui.icon-set.main';
import { FocusMonitor, FocusNavigator, InteractivityChecker, type InputModality } from 'ui.a11y';

import { MenuItem } from './menu-item';
import { activateByKey } from './activation';
import { MenuKeyboard } from './keyboard';
import { MenuSectionDesign, MenuRichHeaderDesign } from './const';
import type { MenuOptions, MenuItemOptions, MenuSectionOptions } from './types';
import './menu.css';

const BASE_SECTION_CODE = 'base';

// Module level on purpose: a deferred restore must outlive its menu without
// keeping the instance (items and popup included) alive through the closure.
const restoreStampedTabIndex = (trigger: HTMLElement, value: string | null): void => {
	if (trigger.getAttribute('aria-expanded') === 'true')
	{
		// Another menu is open on the same trigger and owns the stamp now: dropping
		// tabindex would leave that menu unable to give the focus back.
		return;
	}

	if (Type.isString(value))
	{
		trigger.setAttribute('tabindex', value);
	}
	else
	{
		trigger.removeAttribute('tabindex');
	}
};

export class Menu
{
	#options: MenuOptions;
	#items: MenuItem[];
	#popup: Popup;
	#container: HTMLElement;
	#itemsContainer: HTMLElement;
	#richHeader: HTMLElement | null = null;
	#bindElement: HTMLElement;
	#keyboard: MenuKeyboard;
	#triggerWithGeneratedId: HTMLElement | null = null;
	// The consumer's own attribute values, remembered on the first overwrite: a key is
	// present exactly for what the menu has stamped, so the node returns to its prior
	// state on destroy.
	#stampedTrigger: { trigger: HTMLElement, saved: Map<string, string | null> } | null = null;

	#openedViaKeyboard: boolean = false;
	#focusOrigin: HTMLElement | null = null;
	#destroyed: boolean = false;

	constructor(options: MenuOptions)
	{
		const defaultOptions: MenuOptions = {
			noAllPaddings: true,
			autoHide: true,
			closeByEsc: true,
			autoHideHandler: this.#shouldHide,
			closeOnItemClick: true,
		};

		this.#options = { ...defaultOptions, ...options };
	}

	getOptions(): MenuOptions
	{
		return this.#options;
	}

	getPopup(): Popup
	{
		return this.#popup;
	}

	getPopupContainer(): HTMLElement
	{
		return this.#popup.getPopupContainer();
	}

	show(bindElement: HTMLElement, options: { viaKeyboard?: boolean } = {}): void
	{
		if (this.#destroyed || this.#popup?.isDestroyed())
		{
			// Popup.show() would silently no-op, so the trigger must not be marked
			// expanded for a menu that can no longer appear.
			return;
		}

		// A submenu passes its opening source explicitly: a hover open would keep
		// reporting the stale modality of the last keydown / pointerdown.
		this.#openedViaKeyboard = options.viaKeyboard ?? (this.#getInputModality() === 'keyboard');

		this.#items ??= this.#prepareItems(this.#options.items);

		this.#popup ??= new Popup({
			...this.#options,
			// The popup container is the menu itself: role="menu" belongs to it, so the
			// tree has no dialog wrapper around the items and no second nested menu.
			role: this.#options.role ?? 'menu',
			content: this.#render(),
			focusTrap: this.#resolveFocusTrapOptions(),
			// Both sets go to Popup as they are, the menu's own first: a consumer handler
			// keeps the Popup contract — a string listener, the BaseEvent argument and
			// every event, the menu intercepts included.
			events: [
				{
					onShow: this.#onPopupShow,
					onClose: this.#onPopupClose,
					onDestroy: this.#onPopupDestroy,
					onBeforeAdjustPosition: this.#onBeforeAdjustPosition,
				},
				this.#options.events ?? {},
			],
		});

		this.#keyboard ??= this.#createKeyboard();

		const nextBindElement = Menu.#resolveTrigger(bindElement ?? this.#options.bindElement);
		if (
			!this.#options.parentItem
			&& Type.isDomNode(this.#bindElement)
			&& this.#bindElement !== nextBindElement
		)
		{
			// The ARIA attributes and the generated id stamped on the previous
			// trigger belong to this menu and must not survive a re-bind.
			this.#clearTriggerAria(this.#bindElement);
		}

		this.#bindElement = nextBindElement;
		this.#popup.setBindElement(this.#bindElement);
		this.#syncMenuName();
		// Where the focus came from, before the menu takes it (see #getRestoreTarget).
		this.#rememberFocusOrigin();
		// The expanded state and the opening focus belong to #onPopupShow: Popup.show()
		// no-ops while the popup is still shown (a closing animation, a repeated show),
		// and the trigger must not report a menu that never appeared.
		this.#popup.show();
	}

	static #resolveTrigger(bindElement: any): any
	{
		// A Vue ref holds the component instance, not its root node, and the trigger
		// is expected to be a node: it carries the menu's ARIA and takes the focus back.
		return (Type.isObject(bindElement) && Type.isDomNode(bindElement.$el)) ? bindElement.$el : bindElement;
	}

	#resolveFocusTrapOptions(): boolean | Object
	{
		const { focusTrap } = this.#options;
		if (focusTrap === false)
		{
			return false;
		}

		// An open menu always holds the focus, so the trap is not left to the dialog
		// default: it is always there to isolate and loop Tab. Moving focus stays the
		// menu's own job (#applyOpeningFocus / #restoreFocusOnClose), and a consumer
		// object still overrides any of it per key.
		const menuOwnedFocus = { initialFocus: false, restoreFocus: false, looped: true };

		return Type.isPlainObject(focusTrap) ? { ...menuOwnedFocus, ...focusTrap } : menuOwnedFocus;
	}

	#restoreFocusOnClose(): void
	{
		if (this.#options.focusTrap === false || this.#isTrapOptionOverridden('restoreFocus'))
		{
			return;
		}

		// Focus the user has moved to another control stays put; lost focus (a consumer
		// onClick opened a native dialog) counts as still inside and comes back.
		const active = FocusNavigator.getActiveElement();
		if (!FocusNavigator.isFocusLost() && !this.#treeContainsNode(active))
		{
			return;
		}

		FocusNavigator.restoreFocus(this.#options.parentItem ?? this.#getRestoreTarget(), { preventScroll: true });
	}

	#getRestoreTarget(): HTMLElement | null
	{
		// The trigger owns the menu, so focus goes back to it — unless the menu took
		// focus from a control the trigger wraps (a field inside a BInput): then the
		// caret returns exactly where it was.
		const origin = this.#focusOrigin;
		const insideTrigger = (
			Type.isDomNode(origin)
			&& Type.isDomNode(this.#bindElement)
			&& this.#bindElement.contains(origin)
		);

		if (insideTrigger && InteractivityChecker.isFocusable(origin))
		{
			return origin;
		}

		// A context menu is bound to coordinates or to a MouseEvent, so there is no
		// trigger to focus: the focus goes back where the menu took it from.
		return Type.isDomNode(this.#bindElement) ? this.#bindElement : origin;
	}

	#rememberFocusOrigin(): void
	{
		const active = FocusNavigator.getActiveElement();
		if (Type.isElementNode(active) && !this.#treeContainsNode(active))
		{
			this.#focusOrigin = active;
		}
	}

	#applyOpeningFocus(): void
	{
		if (this.#options.focusTrap === false || this.#isTrapOptionOverridden('initialFocus'))
		{
			return;
		}

		// A hover-opened submenu must not move focus at all; a keyboard open — including
		// a repeated one (APG: ArrowRight on an expanded parent) — focuses the item.
		if (!this.#openedViaKeyboard)
		{
			if (!this.#options.parentItem)
			{
				this.getPopupContainer().focus({ preventScroll: true });
			}

			return;
		}

		// The container is the fallback entry point: without focus inside the popup no
		// menu key ever reaches it.
		(this.#keyboard?.getInitialFocusTarget() ?? this.getPopupContainer()).focus({ preventScroll: true });
	}

	#isTrapOptionOverridden(key: string): boolean
	{
		return Type.isPlainObject(this.#options.focusTrap) && key in this.#options.focusTrap;
	}

	#createKeyboard(): MenuKeyboard
	{
		return new MenuKeyboard({
			itemsContainer: this.#itemsContainer,
			eventContainer: this.getPopupContainer(),
			isSubMenu: Boolean(this.#options.parentItem),
			richHeader: this.#richHeader,
			onClose: (): void => this.close(),
			onCloseAll: (): void => this.#closeAllLevels(),
			onOpenSubMenu: this.#openSubMenuByKeyboard,
			onItemFocusMoved: this.#closeSubMenusExceptFocused,
			// Hover may take focus only from within this menu's own tree — never from
			// another popup that happens to be open with focus inside it.
			isFocusInsideMenu: (): boolean => this.#hasTreeFocus(),
		});
	}

	#hasTreeFocus(): boolean
	{
		// Every level asks the root, so a level sees the focus on a sibling item of an
		// upper level too, not only on itself and below.
		return this.#options.hasTreeFocus?.() ?? this.#hasMenuOwnedFocus();
	}

	#hasMenuOwnedFocus(): boolean
	{
		// Focus on a part of the tree the menu itself moves focus across: an item of
		// any level, or the parent item this level hangs from. The popup's own controls
		// (a rich header, a title bar field) are deliberately left out — the menu never
		// takes focus away from them.
		const parentItem = this.#options.parentItem;
		const active = FocusNavigator.getActiveElement();
		if (Type.isDomNode(parentItem) && parentItem.contains(active))
		{
			return true;
		}

		if (this.#itemsContainer?.contains(active))
		{
			return true;
		}

		return Boolean(this.#items?.some((item: MenuItem): boolean => {
			return item.getSubMenu()?.#hasMenuOwnedFocus() === true;
		}));
	}

	/**
	 * The keyboard has moved the roving focus to another item: a level opened from the
	 * item the focus just left has no owner on screen anymore, so it goes with it.
	 *
	 * Hover never reaches here — its own grace period for a diagonal trip towards the
	 * open submenu (`closeSubMenuWithTimeout`) stays as it is.
	 */
	#closeSubMenusExceptFocused = (): void => {
		const focused = this.#getFocusedItem();
		this.#items?.forEach((item: ?MenuItem): void => {
			if (item && item !== focused)
			{
				item.closeSubMenu();
			}
		});
	};

	#openSubMenuByKeyboard = (action: HTMLElement): void => {
		const item = this.#items.find((it: MenuItem): boolean => it.getActionElement() === action);
		if (!item)
		{
			return;
		}

		// A submenu opened by hover leaves the focus on its parent item, and Popup.show()
		// no-ops on a shown popup: #onPopupShow — the opening focus with it — never runs
		// again, so the level the user just asked for takes the focus here (APG). The
		// keyboard state, not the popup one, tells an open level from one in its closing
		// animation: the latter is still "shown" while no longer navigable.
		const openLevel = item.getSubMenu();
		const wasNavigable = openLevel?.#keyboard?.isActive() === true;

		item.showSubMenu({ viaKeyboard: true });

		if (wasNavigable)
		{
			openLevel.#applyOpeningFocus();
		}
	};

	#getInputModality(): InputModality
	{
		return FocusMonitor.Instance.getModalityTracker().getLastModality();
	}

	#syncTriggerExpanded(expanded: boolean): void
	{
		// A submenu is anchored to its parent item's action for positioning, but
		// the trigger that owns aria-expanded is that action itself, not the popup
		// bind element. A top-level menu is anchored to its own trigger.
		const trigger = this.#options.parentItem ?? this.#bindElement;
		if (!Type.isDomNode(trigger))
		{
			return;
		}

		if (this.#options.parentItem)
		{
			// A submenu's parent item carries its permanent ARIA from MenuItem; only the
			// transient state belongs to this level.
			trigger.setAttribute('aria-haspopup', 'menu');
			trigger.setAttribute('aria-expanded', expanded ? 'true' : 'false');

			return;
		}

		if (this.#stampedTrigger?.trigger !== trigger)
		{
			this.#stampedTrigger = { trigger, saved: new Map() };
		}

		this.#stampTrigger('aria-haspopup', 'menu');
		this.#stampTrigger('aria-expanded', expanded ? 'true' : 'false');

		if (!InteractivityChecker.isFocusable(trigger))
		{
			// The public contract accepts any HTMLElement as trigger: tabindex="-1"
			// lets the close-restore focus it without joining the tab order. Only a
			// tabindex the menu wrote is restored later — the attribute may otherwise
			// belong to a roving FocusZone that owns the trigger.
			this.#stampTrigger('tabindex', '-1');
		}
	}

	#stampTrigger(name: string, value: string): void
	{
		const { trigger, saved } = this.#stampedTrigger;
		if (!saved.has(name))
		{
			saved.set(name, trigger.getAttribute(name));
		}

		trigger.setAttribute(name, value);
	}

	#syncMenuName(): void
	{
		const menu = this.#popup?.getPopupContainer();
		if (!menu)
		{
			return;
		}

		menu.setAttribute('aria-orientation', 'vertical');

		// The name computed for the previous trigger must not survive a re-show:
		// a stale aria-labelledby may point to a removed id.
		menu.removeAttribute('aria-labelledby');
		menu.removeAttribute('aria-label');

		// An explicit consumer label wins over the trigger (Popup applies it too, but
		// only once, at creation time).
		if (Type.isStringFilled(this.#options.ariaLabel))
		{
			menu.setAttribute('aria-label', this.#options.ariaLabel);

			return;
		}

		const trigger = this.#options.parentItem ?? this.#bindElement;
		if (Type.isDomNode(trigger) && this.#applyTriggerName(trigger, menu))
		{
			return;
		}

		// No named trigger: fall back to the rich header title; without one the
		// menu legitimately stays unnamed.
		const { title } = this.#options.richHeader ?? {};
		if (Type.isStringFilled(title))
		{
			menu.setAttribute('aria-label', title);
		}
	}

	#applyTriggerName(trigger: HTMLElement, menu: HTMLElement): boolean
	{
		// Trigger name sources in the accessible-name precedence order.
		const labelledBy = trigger.getAttribute('aria-labelledby');
		if (Type.isStringFilled(labelledBy))
		{
			menu.setAttribute('aria-labelledby', labelledBy);

			return true;
		}

		const ariaLabel = trigger.getAttribute('aria-label');
		if (Type.isStringFilled(ariaLabel))
		{
			menu.setAttribute('aria-label', ariaLabel);

			return true;
		}

		if (Type.isStringFilled(trigger.textContent?.trim()))
		{
			menu.setAttribute('aria-labelledby', this.#ensureTriggerId(trigger));

			return true;
		}

		const title = trigger.getAttribute('title');
		if (Type.isStringFilled(title))
		{
			menu.setAttribute('aria-label', title);

			return true;
		}

		return false;
	}

	#ensureTriggerId(trigger: HTMLElement): string
	{
		if (Type.isStringFilled(trigger.id))
		{
			return trigger.id;
		}

		const id = `ui-popup-menu-trigger-${Text.getRandom(8).toLowerCase()}`;
		trigger.setAttribute('id', id);
		this.#triggerWithGeneratedId = trigger;

		return id;
	}

	#clearTriggerAria(trigger: HTMLElement = this.#options.parentItem ?? this.#bindElement): void
	{
		if (Type.isDomNode(trigger))
		{
			if (this.#options.parentItem)
			{
				// A submenu's parent item structurally owns the popup, so aria-haspopup="menu"
				// is part of its permanent markup (set in MenuItem) and must stay. Only the
				// transient expanded state is reset here. A top-level trigger, whose ARIA the
				// menu added on show, gets a full cleanup below.
				trigger.setAttribute('aria-expanded', 'false');
			}
			else
			{
				this.#restoreTriggerAria(trigger);
			}
		}

		// The bind element is consumer-owned and outlives the menu, so an id the
		// menu stamped on it is removed too, returning the node to its prior state.
		if (this.#triggerWithGeneratedId === trigger)
		{
			this.#triggerWithGeneratedId.removeAttribute('id');
			this.#triggerWithGeneratedId = null;
		}
	}

	#restoreTriggerAria(trigger: HTMLElement): void
	{
		const saved = this.#stampedTrigger?.trigger === trigger
			? this.#stampedTrigger.saved
			: new Map([['aria-haspopup', null], ['aria-expanded', null]]);

		saved.forEach((value: string | null, name: string): void => {
			if (name === 'tabindex')
			{
				this.#restoreStampedTabIndex(trigger, value);

				return;
			}

			this.#restoreAttribute(trigger, name, value);
		});

		this.#stampedTrigger = null;
	}

	#restoreStampedTabIndex(trigger: HTMLElement, value: string | null): void
	{
		if (FocusNavigator.getActiveElement(trigger) !== trigger)
		{
			restoreStampedTabIndex(trigger, value);

			return;
		}

		// Dropping tabindex from the focused node blurs it in Chromium — the focus the
		// menu has just restored would be lost. The node returns to its prior state as
		// soon as the focus leaves it on its own.
		Event.bindOnce(trigger, 'blur', () => restoreStampedTabIndex(trigger, value));
	}

	#restoreAttribute(element: HTMLElement, name: string, value: string | null): void
	{
		if (Type.isString(value))
		{
			element.setAttribute(name, value);
		}
		else
		{
			element.removeAttribute(name);
		}
	}

	updateItems(itemsOptions: MenuItemOptions[]): void
	{
		if (this.#destroyed)
		{
			// Otherwise the update builds fresh items for a menu nothing points at any
			// more and renders them into a detached container.
			return;
		}

		const focusedItem = this.#getFocusedItem();
		const focusedPosition = this.#keyboard?.getFocusedPosition() ?? -1;
		const hadFocusInside = Boolean(this.#popup?.isShown())
			&& this.#treeContainsNode(FocusNavigator.getActiveElement());
		const openedSubMenuIndex = this.#getOpenedSubMenuIndex();
		const openedSubMenu = this.#getSubMenuAt(openedSubMenuIndex);
		const focusedSubItemKey = this.#getFocusedSubItemKey(openedSubMenu);

		this.#reconcileItems(itemsOptions);
		this.#render();
		this.#syncMenuName();
		// The containers and the rich header survive a re-render, so the keyboard
		// controller keeps its FocusZone and only re-reads the item set.
		this.#keyboard?.refresh();
		this.#reopenSubMenuAt(openedSubMenuIndex);

		// A level rebuilt from scratch has to take the focus back itself: the item it
		// stood on is a level below, so the checks for the surviving tree never see it.
		const levelRebuilt = hadFocusInside && this.#getSubMenuAt(openedSubMenuIndex) !== openedSubMenu;
		if (levelRebuilt && this.#restoreFocusInReopenedSubMenu(openedSubMenuIndex, focusedSubItemKey))
		{
			return;
		}

		// Re-appending the focused node drops focus to <body>; a preserved submenu
		// restores its own focus though, so the whole open tree is checked first.
		if (hadFocusInside && !this.#treeContainsNode(FocusNavigator.getActiveElement()))
		{
			this.#restoreFocusAfterUpdate(focusedItem, focusedPosition);
		}
	}

	#getSubMenuAt(index: number): Menu | null
	{
		return (index < 0 ? null : this.#items?.[index]?.getSubMenu()) ?? null;
	}

	#getFocusedSubItemKey(subMenu: Menu | null): string | null
	{
		const focused = subMenu?.#getFocusedItem();

		return focused ? subMenu.#getItemKey(focused.getOptions()) : null;
	}

	#restoreFocusInReopenedSubMenu(index: number, itemKey: string | null): boolean
	{
		const subMenu = this.#getSubMenuAt(index);
		if (Type.isNil(itemKey) || !subMenu?.getPopup()?.isShown())
		{
			return false;
		}

		const target = subMenu.#items?.find((item: MenuItem): boolean => {
			return subMenu.#getItemKey(item.getOptions()) === itemKey;
		});

		if (!target)
		{
			return false;
		}

		target.getActionElement().focus({ preventScroll: true });

		return true;
	}

	#getOpenedSubMenuIndex(): number
	{
		return this.#items?.findIndex((item: MenuItem): boolean => {
			return Boolean(item.getSubMenu()?.getPopup()?.isShown());
		}) ?? -1;
	}

	#reopenSubMenuAt(index: number): void
	{
		// An item carrying an open submenu may not survive the update (a recreated
		// UiButton item, a changed key), and its submenu dies with it. The item at the
		// same place is the same one for the user, so its level opens back up.
		if (index < 0 || this.#getOpenedSubMenuIndex() === index)
		{
			return;
		}

		const item = this.#items[index];
		if (item?.getOptions().subMenu)
		{
			item.showSubMenu();
		}
	}

	#reconcileItems(itemsOptions: MenuItemOptions[]): void
	{
		const oldItems: MenuItem[] = this.#items ?? [];

		// A key takes part in matching only when it is unambiguous on both sides:
		// reusing the first of several equal-key items could pick the wrong one.
		const oldByKey: Map<string, MenuItem | null> = new Map();
		oldItems.forEach((item: MenuItem): void => {
			const key = this.#getItemKey(item.getOptions());
			if (!Type.isNil(key))
			{
				oldByKey.set(key, oldByKey.has(key) ? null : item);
			}
		});

		const newKeyCounts: Map<string, number> = new Map();
		itemsOptions.forEach((itemOptions: ?MenuItemOptions): void => {
			const key = this.#getItemKey(itemOptions);
			if (!Type.isNil(key))
			{
				newKeyCounts.set(key, (newKeyCounts.get(key) ?? 0) + 1);
			}
		});

		const reused: Set<MenuItem> = new Set();
		this.#items = itemsOptions.map((itemOptions: ?MenuItemOptions): MenuItem | null => {
			if (!itemOptions)
			{
				return null;
			}

			const key = this.#getItemKey(itemOptions);
			const matched = (!Type.isNil(key) && newKeyCounts.get(key) === 1) ? oldByKey.get(key) : null;
			// A UiButton action cannot refresh in place (its node is owned by
			// ui.buttons), so such items are recreated.
			if (matched && !matched.getOptions().uiButtonOptions && !itemOptions.uiButtonOptions)
			{
				reused.add(matched);
				matched.update({
					...itemOptions,
					onClick: (): void => this.#onItemClick(itemOptions),
				});

				return matched;
			}

			return this.#createItem(itemOptions);
		}).filter((it) => it);

		oldItems.forEach((item: MenuItem): void => {
			if (!reused.has(item))
			{
				item.destroy();
			}
		});
	}

	#getFocusedItem(): MenuItem | null
	{
		return this.#items?.find((item: MenuItem): boolean => {
			const action = item.getActionElement();
			if (Type.isDomNode(action) && action.contains(FocusNavigator.getActiveElement(action)))
			{
				return true;
			}

			// Focus deep inside the item's submenu tree maps to this item: after an
			// update the closest surviving anchor is the root-level parent.
			const subMenu = item.getSubMenu();

			return subMenu ? subMenu.#treeContainsNode(FocusNavigator.getActiveElement()) : false;
		}) ?? null;
	}

	#getItemKey(options: ?MenuItemOptions): string | null
	{
		if (!options)
		{
			return null;
		}

		if (!Type.isNil(options.id))
		{
			return `id:${options.id}`;
		}

		// An id-less item is identified by its title within the section: it survives
		// an update of the same logical item (e.g. a checkbox toggle).
		if (Type.isStringFilled(options.title))
		{
			return `title:${options.sectionCode ?? ''}:${options.title}`;
		}

		return null;
	}

	#getLiveContainer(): HTMLElement | null
	{
		// Popup.destroy() drops its container: a submenu popup is destroyed on every
		// close when cacheable is false (the BMenu default).
		return this.#popup?.getPopupContainer() ?? null;
	}

	#restoreFocusAfterUpdate(focusedItem: MenuItem | null, focusedPosition: number): void
	{
		const container = this.#getLiveContainer();

		// An item that held the focus and survived the update keeps it, whatever the
		// modality reads now: a pointerdown on the item's own extra icon (the click that
		// asked for the update) must not cost the keyboard its position.
		if (focusedItem && this.#items.includes(focusedItem))
		{
			focusedItem.getActionElement().focus({ preventScroll: true });

			return;
		}

		if (this.#getInputModality() !== 'keyboard')
		{
			// Same contract as the initial focus for a pointer interaction: the popup
			// container keeps focus so no item looks spuriously active.
			container?.focus({ preventScroll: true });

			return;
		}

		// The item is gone (a toggle whose title is its identity, an ambiguous key), yet
		// the place in the list still means something to the keyboard: the focus stays at
		// that position instead of jumping back to the top.
		const target = (
			this.#keyboard?.getItemAtPosition(focusedPosition)
			?? this.#keyboard?.getInitialFocusTarget()
		);

		(target ?? container)?.focus({ preventScroll: true });
	}

	close(): void
	{
		if (this.#destroyed)
		{
			return;
		}

		this.#popup?.close();
	}

	#closeAllLevels(): void
	{
		// A submenu delegates upward: closing the root cascades to every level.
		if (this.#options.onCloseAll)
		{
			this.#options.onCloseAll();
		}
		else
		{
			this.close();
		}
	}

	destroy(): void
	{
		if (this.#destroyed)
		{
			// Popup.destroy() emits onDestroy which re-enters this method; a second
			// pass would wipe the trigger attributes just restored from the snapshot.
			return;
		}

		this.#destroyed = true;
		// Popup.destroy() does not emit onClose, so the focus restore belongs here as
		// well — before the trigger loses the tabindex that makes it focusable. Only for
		// a menu that is still open: a plain cleanup of a long-closed menu must not pull
		// the focus back onto a trigger the user left behind.
		if (this.#popup?.isShown())
		{
			this.#restoreFocusOnClose();
		}
		this.#keyboard?.destroy();
		this.#items?.forEach((item) => item.destroy());
		// The trigger keeps the menu's attributes until the popup is gone: a consumer
		// trap restores focus from inside destroy() and needs a focusable target.
		this.#popup?.destroy();
		this.#clearTriggerAria();
		this.#releaseLayout();
	}

	#releaseLayout(): void
	{
		if (this.#richHeader)
		{
			// The click and keydown handlers of the header are the only bindings the menu
			// owns on a node of its own; the item nodes go away with the items.
			Event.unbindAll(this.#richHeader, 'click');
			Event.unbindAll(this.#richHeader, 'keydown');
		}

		// Nothing points at the detached subtree any more.
		this.#container = null;
		this.#itemsContainer = null;
		this.#richHeader = null;
		this.#items = null;
		this.#keyboard = null;
		this.#focusOrigin = null;
	}

	#shouldHide = (event: MouseEvent): boolean => {
		return !this.#treeContainsNode(event.target);
	};

	#treeContainsNode(node: Node): boolean
	{
		// Every level of the open tree is its own popup, nested submenus included, so
		// the node may sit outside this popup container and still belong to the menu.
		if (this.#getLiveContainer()?.contains(node))
		{
			return true;
		}

		return Boolean(this.#items?.some((item: MenuItem): boolean => {
			return item.getSubMenu()?.#treeContainsNode(node) === true;
		}));
	}

	#onPopupShow = (): void => {
		this.#keyboard?.activate();
		this.#syncTriggerExpanded(true);
		this.#applyOpeningFocus();
	};

	#onPopupClose = (): void => {
		this.#restoreFocusOnClose();
		this.#keyboard?.deactivate();
		this.#items.forEach((item: MenuItem): void => item.closeSubMenu());
		this.#syncTriggerExpanded(false);
	};

	#onPopupDestroy = (): void => {
		this.destroy();
	};

	#onBeforeAdjustPosition = (): void => {
		this.#items.forEach((item: MenuItem): void => item.adjustSubMenu());
	};

	#prepareItems(itemsOptions: MenuItemOptions[]): MenuItem[]
	{
		return itemsOptions
			.map((itemOptions: ?MenuItemOptions): MenuItem | null => (itemOptions ? this.#createItem(itemOptions) : null))
			.filter((it) => it);
	}

	#createItem(itemOptions: MenuItemOptions): MenuItem
	{
		const item: MenuItem = new MenuItem(
			{
				...itemOptions,
				onClick: (): void => this.#onItemClick(itemOptions),
			},
			{
				getTargetContainer: () => this.getPopup().getTargetContainer(),
				// The callback reads the live #items list: an item instance outlives
				// one updateItems generation.
				onMouseEnter: () => this.#items.filter((it) => it !== item).forEach((it) => it.closeSubMenuWithTimeout()),
				onSubMenuItemClick: this.#onSubMenuItemClick,
				onCloseAll: (): void => this.#closeAllLevels(),
				hasTreeFocus: (): boolean => this.#hasTreeFocus(),
			},
		);

		return item;
	}

	#onItemClick = (itemOptions: MenuItemOptions): void => {
		itemOptions.onClick?.();

		if (!itemOptions.subMenu && this.#options.closeOnItemClick)
		{
			this.close();
		}
	};

	#onSubMenuItemClick = (): void => {
		if (this.#options.closeOnItemClick)
		{
			this.close();
		}
	};

	#render(): HTMLElement
	{
		// Both containers and the rich header outlive a re-render: an updateItems must
		// not tear down the FocusZone, the focused header or the bound handlers.
		this.#container ??= Tag.render`
			<div class="ui-popup-menu-container"></div>
		`;

		if (!this.#itemsContainer)
		{
			// The rich header stays out of the items container so it never joins the
			// FocusZone roving set.
			this.#appendRichHeader();
			this.#itemsContainer = this.#renderItemsContainer();
			Dom.append(this.#itemsContainer, this.#container);
		}

		this.#syncItemNodes(this.#renderItems());

		return this.#container;
	}

	#syncItemNodes(nodes: HTMLElement[]): void
	{
		// Re-appending a node that already sits in the right place would drop the focus
		// it holds, so only the nodes that actually moved are touched.
		nodes.forEach((node: HTMLElement, index: number): void => {
			const current = this.#itemsContainer.children[index];
			if (current === node)
			{
				return;
			}

			if (current)
			{
				Dom.insertBefore(node, current);
			}
			else
			{
				Dom.append(node, this.#itemsContainer);
			}
		});

		while (this.#itemsContainer.children.length > nodes.length)
		{
			Dom.remove(this.#itemsContainer.lastElementChild);
		}
	}

	#renderItemsContainer(): HTMLElement
	{
		// role="none" keeps the items owned by the role="menu" popup container instead
		// of declaring a second menu inside it.
		return Tag.render`
			<div class="ui-popup-menu-items" role="none"></div>
		`;
	}

	#appendRichHeader(): void
	{
		const richHeader = this.#renderRichHeader();
		if (richHeader)
		{
			Dom.append(richHeader, this.#container);
		}
	}

	#renderRichHeader(): HTMLElement
	{
		if (!this.#options.richHeader)
		{
			return '';
		}

		const design = this.#options.richHeader.design ?? MenuRichHeaderDesign.Default;
		const richHeader = Tag.render`
			<div class="ui-popup-menu-rich-header --${design}" role="none">
				<div class="ui-popup-menu-rich-header-image">
					<div class="ui-icon-set --${this.#getRichHeaderIcon(design)}"></div>
				</div>
				<div class="ui-popup-menu-rich-header-header">
					${this.#renderRichHeaderSubtitle()}
					<div class="ui-popup-menu-rich-header-title">
						${Text.encode(this.#options.richHeader.title)}
					</div>
				</div>
				<div class="ui-popup-menu-rich-header-buttons">
					${this.#renderRichHeaderIcon()}
				</div>
			</div>
		`;

		const { onClick } = this.#options.richHeader;
		if (onClick)
		{
			richHeader.setAttribute('role', 'button');
			richHeader.setAttribute('tabindex', '0');
			Event.bind(richHeader, 'click', onClick);
			Event.bind(richHeader, 'keydown', (event: KeyboardEvent): void => {
				activateByKey(event, richHeader);
			});

			// Only an interactive header is a Tab target; MenuKeyboard toggles focus
			// between it and the menu items.
			this.#richHeader = richHeader;
		}

		return richHeader;
	}

	#getRichHeaderIcon(design: string): string
	{
		return {
			[MenuRichHeaderDesign.Default]: Main.DIAMOND,
			[MenuRichHeaderDesign.Copilot]: Main.COPILOT_AI,
		}[design] ?? Main.DIAMOND;
	}

	#renderRichHeaderSubtitle(): HTMLElement
	{
		if (!this.#options.richHeader.subtitle)
		{
			return '';
		}

		return Tag.render`
			<div class="ui-popup-menu-rich-header-subtitle">
				${Text.encode(this.#options.richHeader.subtitle)}
			</div>
		`;
	}

	#renderRichHeaderIcon(): HTMLElement
	{
		if (!this.#options.richHeader.icon)
		{
			return '';
		}

		return Tag.render`
			<div class="ui-popup-menu-rich-header-icon">
				<div class="ui-icon-set --${this.#options.richHeader.icon}"></div>
			</div>
		`;
	}

	#renderItems(): HTMLElement[]
	{
		const itemsBySection = this.#groupItemsBySection();
		const sections: MenuSectionOptions[] = this.#options.sections ?? [];

		const nodes: HTMLElement[] = (itemsBySection.get(BASE_SECTION_CODE) ?? [])
			.map((item: MenuItem) => item.render());

		sections.forEach((options: MenuSectionOptions): void => {
			const items = itemsBySection.get(options.code);
			if (!items)
			{
				return;
			}

			const renderedItems = items.map((item: MenuItem) => item.render());
			if (Type.isStringFilled(options.title))
			{
				nodes.push(this.#renderSectionGroup(options, renderedItems));

				return;
			}

			// A separator separates: it is rendered only between rendered items, whatever
			// the index of the section that owns it (preceding sections may be empty).
			if (nodes.length > 0)
			{
				nodes.push(this.#renderSectionSeparator(options));
			}

			nodes.push(...renderedItems);
		});

		return nodes;
	}

	#groupItemsBySection(): Map<string, MenuItem[]>
	{
		const knownCodes: Set<string> = new Set([
			BASE_SECTION_CODE,
			...(this.#options.sections ?? []).map((section: MenuSectionOptions) => section.code),
		]);

		const itemsBySection: Map<string, MenuItem[]> = new Map();
		this.#items.forEach((item: MenuItem): void => {
			const sectionCode = item.getOptions().sectionCode ?? BASE_SECTION_CODE;
			if (!knownCodes.has(sectionCode))
			{
				// A dropped item is a consumer bug: make it visible instead of silent.
				console.error(
					`UI.System.Menu: item "${item.getOptions().title ?? ''}" has unknown`
					+ ` sectionCode "${sectionCode}" and is not rendered`,
				);

				return;
			}

			const sectionItems = itemsBySection.get(sectionCode) ?? [];
			sectionItems.push(item);
			itemsBySection.set(sectionCode, sectionItems);
		});

		return itemsBySection;
	}

	#renderSectionGroup(options: MenuSectionOptions, items: HTMLElement[]): HTMLElement
	{
		// The labelled group wraps its items so a screen reader associates every item
		// with the section title. The header row only repeats that title visually, so
		// it is hidden from the a11y tree instead of being announced a second time.
		const header = this.#renderSectionHeader(options);

		const group = Tag.render`
			<div class="ui-popup-menu-section-group" role="group">
				${header}
				${items}
			</div>
		`;
		group.setAttribute('aria-label', options.title);

		return group;
	}

	#renderSectionHeader(options: MenuSectionOptions): HTMLElement
	{
		return Tag.render`
			<div
				class="ui-popup-menu-section --${options.design ?? MenuSectionDesign.Default}"
				role="none"
				aria-hidden="true"
			>
				<div class="ui-popup-menu-section-title">${Text.encode(options.title)}</div>
				<div class="ui-popup-menu-section-divider" aria-hidden="true"></div>
			</div>
		`;
	}

	#renderSectionSeparator(options: MenuSectionOptions): HTMLElement
	{
		// A titleless section is just a rule between groups of items.
		return Tag.render`
			<div
				class="ui-popup-menu-section --${options.design ?? MenuSectionDesign.Default}"
				role="separator"
			>
				<div class="ui-popup-menu-section-divider" aria-hidden="true"></div>
			</div>
		`;
	}
}
