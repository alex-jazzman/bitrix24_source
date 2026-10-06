import { Dom, Event, Tag, Text, Type } from 'main.core';
import { SplitButton, SplitSubButtonType, type SplitButtonOptions } from 'ui.buttons';
import { Icon } from 'ui.icon-set.api.core';
import { Menu, MenuItemDesign, type MenuItemOptions, type MenuOptions } from 'ui.system.menu';
import 'ui.icon-set.outline';

import { applyDataset, MENU_CLASS_NAME } from './menu-dataset';

export type ActionPanelItemClickHandler = (event: MouseEvent | null, item: ActionPanelItem) => void;

// The e2e hook of an item: the constant part belongs to the component, the variable one is the id
// of the action given by the host. The visible text is localized and cannot name anything.
const TEST_ID_PREFIX: string = 'ui-action-panel-item';

export type ActionPanelItemOptions = {
	id?: string;
	/** Plain text: it goes in as a text node, so markup given here is shown literally. */
	text?: string;
	title?: string;
	/** Icon name from the `ui.icon-set.api.core` sets; an unknown name is ignored. */
	icon?: string;
	iconOnly?: boolean;
	href?: string;
	/**
	 * Only a function is accepted: the legacy string handler (a code string turned into an
	 * `onclick` attribute) stays in the `ui.actionpanel` adapter.
	 */
	onclick?: ActionPanelItemClickHandler;
	menuItems?: MenuItemOptions[];
	/**
	 * Whether a click on a menu item closes the menu of this item. `false` leaves it open, the way
	 * the legacy panel did for the items its host marked so. The item keeps the same behaviour when
	 * it is represented inside the "more" menu.
	 */
	closeOnItemClick?: boolean;
	disabled?: boolean;
	hidden?: boolean;
	className?: string;
	dataset?: { [key: string]: string };
	/** `data-*` attributes for the popups this item opens; the panel passes its own set down. */
	popupDataset?: { [key: string]: string };
	attributes?: { [key: string]: string };
	useAirDesign?: boolean;
};

export default class ActionPanelItem
{
	#id: string | null;
	#text: string | null;
	#title: string | null;
	#icon: string | null;
	#iconOnly: boolean;
	#href: string | null;
	#onclick: ActionPanelItemClickHandler | null;
	#menuItems: MenuItemOptions[];
	#closeOnItemClick: boolean;
	#disabled: boolean;
	#hidden: boolean;
	#overflowHidden: boolean = false;
	#className: string | null;
	#dataset: { [key: string]: string };
	#popupDataset: { [key: string]: string };
	#attributes: { [key: string]: string };
	#useAirDesign: boolean;

	#container: HTMLElement | null = null;
	#splitButton: SplitButton | null = null;
	#menu: Menu | null = null;
	// Unique per instance: the legacy panel shared one menu id between every submenu.
	#menuId: string = `ui-air-action-panel-item-menu-${Text.getRandom(12)}`;

	constructor(options: ActionPanelItemOptions)
	{
		this.#id = Type.isStringFilled(options.id) ? (options.id as string) : null;
		this.#text = Type.isStringFilled(options.text) ? (options.text as string) : null;
		this.#title = Type.isStringFilled(options.title) ? (options.title as string) : null;
		this.#icon = Type.isStringFilled(options.icon) ? (options.icon as string) : null;
		this.#iconOnly = options.iconOnly === true;
		this.#href = Type.isStringFilled(options.href) ? (options.href as string) : null;
		this.#onclick = Type.isFunction(options.onclick) ? (options.onclick as ActionPanelItemClickHandler) : null;
		this.#menuItems = Type.isArrayFilled(options.menuItems) ? (options.menuItems as MenuItemOptions[]) : [];
		this.#closeOnItemClick = options.closeOnItemClick !== false;
		this.#disabled = options.disabled === true;
		this.#hidden = options.hidden === true;
		this.#className = Type.isStringFilled(options.className) ? (options.className as string) : null;
		this.#dataset = Type.isPlainObject(options.dataset) ? (options.dataset as { [key: string]: string }) : {};
		this.#popupDataset = Type.isPlainObject(options.popupDataset)
			? (options.popupDataset as { [key: string]: string })
			: {};
		this.#attributes = Type.isPlainObject(options.attributes)
			? (options.attributes as { [key: string]: string })
			: {};
		this.#useAirDesign = options.useAirDesign === true;

		this.#dropNamelessIconOnly();
	}

	/**
	 * An icon-only control takes its name from the title or the text. With neither there is nothing
	 * to name it with, and a name must never be invented for the consumer: the item keeps its own
	 * rendering and the caller gets told what to fix.
	 */
	#dropNamelessIconOnly(): void
	{
		if (!this.#iconOnly || !this.isInteractive() || this.#title !== null || this.#text !== null)
		{
			return;
		}

		this.#iconOnly = false;

		console.error(
			`UI.ActionPanel: an icon-only item needs a title or a text to be named, id: ${this.#id ?? 'none'}`,
		);
	}

	getId(): string | null
	{
		return this.#id;
	}

	getText(): string | null
	{
		return this.#text;
	}

	hasMenu(): boolean
	{
		return this.#menuItems.length > 0;
	}

	isSplit(): boolean
	{
		return this.#onclick !== null && this.hasMenu();
	}

	/**
	 * Only an item that reacts to a click deserves a native control: the rest stay plain labels
	 * and therefore never join the roving set of the toolbar.
	 */
	isInteractive(): boolean
	{
		return this.#onclick !== null || this.hasMenu() || this.#href !== null;
	}

	isDisabled(): boolean
	{
		return this.#disabled;
	}

	isHidden(): boolean
	{
		return this.#hidden;
	}

	getContainer(): HTMLElement
	{
		if (!this.#container)
		{
			this.#container = this.isSplit() ? this.#renderSplitButton() : this.#renderSimpleItem();
			this.#applyState(this.#container);
		}

		return this.#container;
	}

	show(): void
	{
		this.#hidden = false;
		this.#applyVisibility();
	}

	hide(): void
	{
		this.#hidden = true;
		this.#applyVisibility();
	}

	/** Set by the panel: the item does not fit the row and is represented by the "more" menu instead. */
	setOverflowHidden(overflowHidden: boolean): void
	{
		if (this.#overflowHidden === overflowHidden)
		{
			return;
		}

		this.#overflowHidden = overflowHidden;
		this.#applyVisibility();
	}

	disable(): void
	{
		this.#setDisabled(true);
	}

	enable(): void
	{
		this.#setDisabled(false);
	}

	openMenu(): void
	{
		if (!this.hasMenu() || this.#disabled)
		{
			return;
		}

		if (this.isSplit())
		{
			this.#splitButton?.getMenuButton().getContainer().click();

			return;
		}

		this.#showMenu();
	}

	closeMenu(): void
	{
		this.#menu?.close();
		(this.#splitButton?.getSystemMenu() as Menu | null)?.close();
	}

	/**
	 * Menu representation of the item. The legacy panel mutated the live item objects right before
	 * showing the popup; here the popup gets an independent mapping.
	 */
	getMenuItemOptions(): MenuItemOptions
	{
		const subMenu = this.hasMenu()
			? { className: MENU_CLASS_NAME, items: this.#menuItems, closeOnItemClick: this.#closeOnItemClick }
			: undefined;

		return {
			id: this.#id ?? undefined,
			title: this.#text ?? this.#title ?? '',
			icon: this.#resolveIcon() ?? undefined,
			design: this.#disabled ? MenuItemDesign.Disabled : undefined,
			subMenu,
			// A click on the level below closes the level above as well, so both ends of the pair
			// follow the same option.
			closeOnSubItemClick: this.#closeOnItemClick,
			onClick: this.#disabled || this.hasMenu() ? undefined : (): void => this.#runClick(null),
			// The menu option types declare every field required, so a partial set needs the cast.
		} as unknown as MenuItemOptions;
	}

	destroy(): void
	{
		this.closeMenu();

		this.#menu?.destroy();
		this.#menu = null;

		// The system menu of a split control is created on its first opening and lives in the body
		// as a popup of its own. Dropping the reference alone would leave it registered forever,
		// and the host rebuilds the whole set on every change of the selection.
		this.#splitButton?.setSystemMenu(false);
		this.#splitButton = null;

		if (this.#container)
		{
			Dom.remove(this.#container);
			this.#container = null;
		}
	}

	#renderSimpleItem(): HTMLElement
	{
		const content: Array<HTMLElement> = [];

		const icon = this.#renderIcon();
		if (icon)
		{
			content.push(icon);
		}

		const text = this.#renderText();
		if (text)
		{
			content.push(text);
		}

		if (this.#href !== null)
		{
			return Tag.render`<a class="ui-air-action-panel__item">${content}</a>`;
		}

		if (this.isInteractive())
		{
			return Tag.render`<button type="button" class="ui-air-action-panel__item">${content}</button>`;
		}

		return Tag.render`<span class="ui-air-action-panel__item --static">${content}</span>`;
	}

	#renderSplitButton(): HTMLElement
	{
		this.#splitButton = new SplitButton({
			useAirDesign: this.#useAirDesign,
			menuTarget: SplitSubButtonType.MENU,
			mainButton: {
				text: this.#text ?? '',
				onclick: (button: unknown, event: MouseEvent): void => this.#runClick(event),
			},
			menuButton: {},
			systemMenu: {
				id: this.#menuId,
				// ui.buttons hands its own options to the menu as they are, so the popup of a split
				// control belongs to the panel just as the popup of a plain item does.
				className: MENU_CLASS_NAME,
				items: this.#menuItems,
				closeOnItemClick: this.#closeOnItemClick,
				events: {
					onShow: (): void => this.#applyMenuTestId(this.#splitButton?.getSystemMenu() as Menu | null),
				},
			},
		} as unknown as SplitButtonOptions);

		// Both halves are clicked separately, so each one gets its own hook.
		Dom.attr(this.#splitButton.getMainButton().getContainer(), 'data-testid', `${this.#getTestId()}-main-btn`);
		Dom.attr(this.#splitButton.getMenuButton()?.getContainer(), 'data-testid', `${this.#getTestId()}-menu-btn`);

		return this.#splitButton.getContainer();
	}

	#getTestId(): string
	{
		return this.#id === null ? TEST_ID_PREFIX : `${TEST_ID_PREFIX}-${this.#id}`;
	}

	/** An unknown name is dropped on every path: the menu would print it as a class and leave a gap. */
	#resolveIcon(): string | null
	{
		return this.#icon !== null && Icon.isValid({ icon: this.#icon }) ? this.#icon : null;
	}

	#renderIcon(): HTMLElement | null
	{
		const icon = this.#resolveIcon();
		if (icon === null)
		{
			return null;
		}

		const wrapper = Tag.render`<span class="ui-air-action-panel__item-icon" aria-hidden="true"></span>`;
		new Icon({ icon }).renderTo(wrapper);

		return wrapper;
	}

	// The text goes in as a text node, never as concatenated markup.
	#renderText(): HTMLElement | null
	{
		if (this.#text === null || this.#iconOnly)
		{
			return null;
		}

		const node = Tag.render`<span class="ui-air-action-panel__item-text"></span>`;
		node.textContent = this.#text;

		return node;
	}

	#applyState(container: HTMLElement): void
	{
		Dom.attr(container, 'data-role', 'action-panel-item');
		// Stamped before the host attributes: an explicit `data-testid` from the host wins.
		Dom.attr(container, 'data-testid', this.#getTestId());

		if (this.#id !== null)
		{
			container.id = this.#id;
		}

		if (this.#className !== null)
		{
			Dom.addClass(container, this.#className);
		}

		// The host attributes go in before the states the item owns: an address, a title and the ARIA
		// of a menu trigger describe what the item does and are kept in sync with it afterwards, so a
		// set given from outside must not decide them.
		Dom.attr(container, this.#attributes);

		if (this.#href !== null)
		{
			Dom.attr(container, 'href', this.#href);
		}

		// The legacy panel titled an item with a link even without an explicit title.
		const title = this.#title ?? (this.#href !== null ? this.#text : null);
		if (title !== null)
		{
			Dom.attr(container, 'title', title);
		}

		// An icon-only control loses its visible label, so the name has to be given explicitly.
		if (this.#iconOnly && this.isInteractive())
		{
			const label = this.#title ?? this.#text;
			if (label !== null)
			{
				Dom.attr(container, 'aria-label', label);
			}
		}

		if (this.hasMenu() && !this.isSplit())
		{
			Dom.attr(container, 'aria-haspopup', 'menu');
			Dom.attr(container, 'aria-expanded', 'false');
		}

		Object.entries(this.#dataset).forEach(([key, value]) => {
			Dom.attr(container, `data-${key}`, value);
		});

		if (this.#disabled)
		{
			this.#setDisabled(true);
		}

		if (this.#hidden)
		{
			this.#applyVisibility();
		}

		if (!this.isSplit() && this.isInteractive())
		{
			Event.bind(container, 'click', this.#handleClick);
		}
	}

	// Two independent reasons to leave the row: the host hid the item, or it did not fit.
	#applyVisibility(): void
	{
		const invisible = this.#hidden || this.#overflowHidden;

		Dom.style(this.getContainer(), 'display', invisible ? 'none' : null);
	}

	#handleClick = (event: MouseEvent): void => {
		if (this.#disabled)
		{
			event.preventDefault();

			return;
		}

		if (this.hasMenu())
		{
			event.preventDefault();
			this.#toggleMenu();

			return;
		}

		this.#runClick(event);
	};

	#runClick(event: MouseEvent | null): void
	{
		if (this.#disabled)
		{
			return;
		}

		this.#onclick?.(event, this);
	}

	/**
	 * A menu button toggles (APG), the same way the "more" trigger of the panel does. The auto-hide of
	 * the popup only schedules its close, so the menu opened by this very control is still reported as
	 * shown while the handler runs.
	 */
	#toggleMenu(): void
	{
		if (this.#menu?.getPopup()?.isShown() === true)
		{
			this.#menu.close();

			return;
		}

		this.#showMenu();
	}

	#showMenu(): void
	{
		const menu = this.#getMenu();

		menu.show(this.getContainer());

		// The levels this popup opens below itself are stamped by the panel as they appear: their
		// options belong to ui.system.menu, and an item alone has nothing to hook them by.
		applyDataset(menu.getPopup()?.getPopupContainer() ?? null, this.#popupDataset);

		this.#applyMenuTestId(menu);
	}

	// ui.system.menu takes no attributes for its own items, so the popup is the hook for the whole submenu.
	#applyMenuTestId(menu: Menu | null): void
	{
		Dom.attr(menu?.getPopup()?.getPopupContainer() ?? null, 'data-testid', `${this.#getTestId()}-menu`);
	}

	#getMenu(): Menu
	{
		if (!this.#menu)
		{
			this.#menu = new Menu({
				id: this.#menuId,
				className: MENU_CLASS_NAME,
				items: this.#menuItems,
				closeOnItemClick: this.#closeOnItemClick,
				events: {
					onShow: (): void => this.#setExpanded(true),
					onClose: (): void => this.#setExpanded(false),
				},
			} as unknown as MenuOptions);
		}

		return this.#menu;
	}

	#setExpanded(expanded: boolean): void
	{
		Dom.attr(this.getContainer(), 'aria-expanded', expanded ? 'true' : 'false');
	}

	#setDisabled(disabled: boolean): void
	{
		this.#disabled = disabled;

		if (!this.#container)
		{
			return;
		}

		if (this.#splitButton)
		{
			this.#splitButton.setDisabled(disabled);

			return;
		}

		const container = this.#container;

		Dom[disabled ? 'addClass' : 'removeClass'](container, '--disabled');
		// Keeps the slider from opening the href of a disabled link.
		Dom.attr(container, 'data-slider-ignore-autobinding', disabled ? 'true' : null);

		if (container instanceof HTMLButtonElement)
		{
			container.disabled = disabled;

			return;
		}

		if (this.isInteractive())
		{
			Dom.attr(container, 'aria-disabled', disabled ? 'true' : null);
			Dom.attr(container, 'tabindex', disabled ? '-1' : null);
		}
	}
}
