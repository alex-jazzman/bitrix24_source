import { Dom, Event, Tag, Text, Type } from 'main.core';
import { Button as UiButton } from 'ui.buttons';
import { Counter, CounterColor } from 'ui.cnt';
import { Outline } from 'ui.icon-set.api.core';
import 'ui.icon-set.outline';

import { Menu } from './menu';
import { mouse } from './mouse';
import { MenuItemDesign } from './const';
import type { MenuItemOptions, MenuItemCallbacks } from './types';

import './menu-item.css';

const defaultItemOptions: MenuItemOptions = {
	closeOnSubItemClick: true,
};

export class MenuItem
{
	#options: MenuItemOptions;
	#callbacks: MenuItemCallbacks;

	#subMenu: Menu;
	#element: HTMLElement;
	#action: HTMLElement;
	#showTimeout: number;
	#closeTimeout: number;
	#subMenuHovered: boolean;
	#subMenuOutdated: boolean = false;

	constructor(options: MenuItemOptions, callbacks: MenuItemCallbacks)
	{
		this.#options = { ...defaultItemOptions, ...options };
		this.#callbacks = callbacks;
	}

	update(options: MenuItemOptions): void
	{
		this.#options = { ...defaultItemOptions, ...options };
		this.#syncSubMenu();

		if (this.#element)
		{
			this.#refreshElement();
		}
	}

	getOptions(): MenuItemOptions
	{
		return this.#options;
	}

	getSubMenu(): Menu
	{
		return this.#subMenu;
	}

	getActionElement(): HTMLElement
	{
		return this.#action;
	}

	render(): HTMLElement
	{
		if (this.#element)
		{
			return this.#element;
		}

		const uiButtonOptions = this.#options.uiButtonOptions;

		this.#action = uiButtonOptions
			? new UiButton(uiButtonOptions).render()
			: Tag.render`
				<button
					class="ui-popup-menu-item-action"
					title="${Text.encode(this.#options.title ?? '')}"
					onclick="${this.#handleClick}"
					onmouseenter="${this.#onMouseEnter}"
					onmouseleave="${this.#onMouseLeave}"
				>${this.#renderHeader()}${this.#renderButtons()}</button>
			`;

		this.#element = Tag.render`
			<div class="${this.#getClassName()}" role="none">
				${this.#action}
			</div>
		`;

		this.#applyAccessibilityAttributes();

		return this.#element;
	}

	isDisabled(): boolean
	{
		return this.#options.disabled === true || this.#options.design === MenuItemDesign.Disabled;
	}

	#getClassName(): string
	{
		const isUiButton = this.#options.uiButtonOptions ? ' --is-ui-button' : '';
		const design = this.#options.design ? ` --${this.#options.design}` : '';
		// An item may be unavailable without carrying the visual design (an explicit
		// `disabled` option), and it still has to look and read as unavailable.
		const disabled = (this.isDisabled() && this.#options.design !== MenuItemDesign.Disabled)
			? ` --${MenuItemDesign.Disabled}`
			: '';

		return `ui-popup-menu-item${isUiButton}${design}${disabled}`;
	}

	#applyAccessibilityAttributes(): void
	{
		const action = this.#action;
		const isCheckbox = Type.isBoolean(this.#options.isSelected);

		action.setAttribute('role', isCheckbox ? 'menuitemcheckbox' : 'menuitem');

		if (isCheckbox)
		{
			action.setAttribute('aria-checked', this.#options.isSelected ? 'true' : 'false');
		}

		if (this.#options.subMenu)
		{
			action.setAttribute('aria-haspopup', 'menu');
			action.setAttribute('aria-expanded', 'false');
		}

		if (this.isDisabled())
		{
			// APG keeps an unavailable item reachable: it is announced as disabled but
			// stays focusable, and whatever the consumer bound to it still runs (a
			// tariff hint, a "why is this off" popup).
			action.setAttribute('aria-disabled', 'true');
		}
	}

	#handleClick = (): void => {
		this.#options.onClick?.();
	};

	#syncSubMenu(): void
	{
		if (!this.#options.subMenu)
		{
			// A pending hover timer would build a submenu out of options that the
			// update has just taken away.
			clearTimeout(this.#showTimeout);
			clearTimeout(this.#closeTimeout);
		}

		if (!this.#subMenu)
		{
			return;
		}

		const shown = Boolean(this.#subMenu.getPopup()?.isShown());
		if (shown && this.#options.subMenu && this.#subMenu.getOptions().closeOnItemClick === false)
		{
			// A submenu that survives its own item clicks survives the parent's
			// update too: its items refresh in place, it stays open (nested levels
			// and focus included). The rest of its options belongs to the instance,
			// so it is rebuilt from the new ones once it closes.
			this.#subMenu.updateItems(this.#prepareSubMenuItemsOptions());
			this.#subMenuOutdated = true;

			return;
		}

		// A closed instance carries the previous generation's options: drop it,
		// the next showSubMenu builds a fresh one.
		clearTimeout(this.#showTimeout);
		clearTimeout(this.#closeTimeout);
		this.#subMenu.destroy();
		this.#subMenu = null;
	}

	#refreshElement(): void
	{
		// The element and action nodes are kept so focus, bound handlers and an open
		// submenu's parentItem reference survive; only content and attributes refresh.
		const hovered = Dom.hasClass(this.#element, '--hovered') ? ' --hovered' : '';
		this.#element.className = `${this.#getClassName()}${hovered}`;

		this.#action.setAttribute('title', this.#options.title ?? '');
		Dom.clean(this.#action);
		Dom.append(this.#renderHeader(), this.#action);
		Dom.append(this.#renderButtons(), this.#action);

		// The previous generation's states must not leak through. tabindex is left
		// alone: it belongs to the roving FocusZone, not to the item.
		['aria-checked', 'aria-haspopup', 'aria-expanded', 'aria-disabled']
			.forEach((name: string): void => this.#action.removeAttribute(name));
		this.#applyAccessibilityAttributes();

		if (this.#subMenu?.getPopup()?.isShown())
		{
			this.#action.setAttribute('aria-expanded', 'true');
		}
	}

	showSubMenu = (options: { viaKeyboard?: boolean } = {}): void => {
		if (this.isDisabled())
		{
			// An unavailable item is perceivable but not operable: its own onClick still
			// runs (that is how a consumer explains why it is off), but the level below
			// does not open — on any path, keyboard and hover alike.
			return;
		}

		if (this.#subMenuOutdated && !this.#subMenu?.getPopup()?.isShown())
		{
			// It stayed open through the parent's update carrying the options of its own
			// generation, and now that it is closed it is rebuilt from the current ones.
			this.#subMenuOutdated = false;
			this.#subMenu.destroy();
			this.#subMenu = null;
		}

		clearTimeout(this.#showTimeout);
		clearTimeout(this.#closeTimeout);
		this.#subMenuHovered = false;
		this.#subMenu ??= new Menu({
			...this.#options.subMenu,
			parentItem: this.#action,
			onCloseAll: this.#callbacks.onCloseAll,
			hasTreeFocus: this.#callbacks.hasTreeFocus,
			targetContainer: this.#callbacks.getTargetContainer(),
			autoHide: false,
			items: this.#prepareSubMenuItemsOptions(),
			offsetLeft: this.#element.offsetWidth,
			offsetTop: -this.#element.offsetHeight,
			bindOptions: {
				forceBindPosition: true,
				forceTop: true,
				forceLeft: true,
			},
			events: {
				onFirstShow: this.#onFirstShow,
				onShow: this.#onShow,
				onClose: this.#onClose,
				onDestroy: this.#onSubMenuDestroy,
			},
		});

		// The opening source travels down explicitly: a hover open (no arguments)
		// must not move focus, a keyboard open focuses the first submenu item.
		this.#subMenu.show(this.#element, { viaKeyboard: options.viaKeyboard === true });
	};

	#prepareSubMenuItemsOptions(): MenuItemOptions[]
	{
		return this.#options.subMenu.items.map((itemOptions: MenuItemOptions): MenuItemOptions => {
			if (!itemOptions)
			{
				return null;
			}

			return {
				...itemOptions,
				onClick: () => this.#onSubMenuItemClick(itemOptions),
			};
		});
	}

	adjustSubMenu = (): void => {
		// A hidden popup has nothing to reposition, and a self-destroyed one has no
		// container left to measure.
		if (!this.#subMenu?.getPopup()?.isShown())
		{
			return;
		}

		let offsetLeft = this.#element.offsetWidth;
		let offsetTop = -this.#element.offsetHeight;
		this.#subMenu.getPopup().setOffset({ offsetLeft, offsetTop });
		this.#subMenu.getPopup().adjustPosition();

		const targetContainer = this.#callbacks.getTargetContainer();
		const targetIsBody = targetContainer === document.body;
		const targetRect = {
			...targetContainer.getBoundingClientRect().toJSON(),
			...(targetIsBody ? { top: 0 } : null),
			...(targetIsBody ? { right: window.innerWidth } : null),
			...(targetIsBody ? { bottom: window.innerHeight } : null),
			...(targetIsBody ? { left: 0 } : null),
		};

		let popupRect = this.#subMenu.getPopupContainer().getBoundingClientRect();
		if (popupRect.right >= targetRect.right)
		{
			offsetLeft = -popupRect.width;
		}

		if (popupRect.bottom >= targetRect.bottom)
		{
			offsetTop = -popupRect.height;
		}

		this.#subMenu.getPopup().setOffset({ offsetLeft, offsetTop });
		this.#subMenu.getPopup().adjustPosition();

		popupRect = this.#subMenu.getPopupContainer().getBoundingClientRect();
		if (popupRect.left <= targetRect.left)
		{
			offsetLeft = this.#element.offsetWidth;
		}

		if (popupRect.top <= targetRect.top)
		{
			offsetTop = -this.#element.offsetHeight;
		}

		this.#subMenu.getPopup().setOffset({ offsetLeft, offsetTop });
		this.#subMenu.getPopup().adjustPosition();
	};

	closeSubMenu = (): void => {
		clearTimeout(this.#showTimeout);
		this.#subMenu?.close();
	};

	closeSubMenuWithTimeout(): void
	{
		clearTimeout(this.#closeTimeout);
		this.#closeTimeout = setTimeout(this.closeSubMenu, 200);
	}

	destroy(): void
	{
		// A pending hover timer would resurrect the submenu of a destroyed item.
		clearTimeout(this.#showTimeout);
		clearTimeout(this.#closeTimeout);
		this.#subMenu?.destroy();
	}

	#onMouseEnter = (): void => {
		if (this.isDisabled())
		{
			return;
		}

		this.#subMenuHovered = false;
		this.#callbacks.onMouseEnter?.();
		if (this.#options.subMenu)
		{
			clearTimeout(this.#closeTimeout);
			this.#showTimeout = setTimeout(this.showSubMenu, 200);
		}
	};

	#onMouseLeave = (event: MouseEvent): void => {
		clearTimeout(this.#showTimeout);

		const subMenuContainer = this.#subMenu?.getPopupContainer();
		if (!this.#subMenuHovered && subMenuContainer && !subMenuContainer.contains(event.relatedTarget))
		{
			const subMenuLeft = subMenuContainer.getBoundingClientRect().left + window.scrollX;
			const distance = mouse.getPosition().left - subMenuLeft;
			const distanceDelta = Math.abs(distance) - Math.abs(distance + mouse.getDelta().left);
			if (distanceDelta <= 1)
			{
				this.closeSubMenu();
			}
			else
			{
				this.closeSubMenuWithTimeout();
			}
		}
	};

	#onSubMenuItemClick(item: MenuItemOptions): void
	{
		item.onClick?.();

		if (!item.subMenu && this.#options.closeOnSubItemClick)
		{
			this.#callbacks.onSubMenuItemClick?.();
		}
	}

	#onFirstShow = (): void => {
		Event.bind(this.#subMenu.getPopupContainer(), 'mouseenter', (): void => {
			clearTimeout(this.#closeTimeout);
			this.#subMenuHovered = true;
		});
	};

	#onShow = (): void => {
		this.adjustSubMenu();
		Dom.addClass(this.#element, '--hovered');
		mouse.need(this);
	};

	#onClose = (): void => {
		Dom.removeClass(this.#element, '--hovered');
		mouse.notNeed(this);
	};

	#onSubMenuDestroy = (): void => {
		this.#onClose();

		// A popup with cacheable: false destroys itself on close, so the reference
		// would keep a dead instance that showSubMenu can never reopen.
		this.#subMenu = null;
	};

	#renderHeader(): HTMLElement
	{
		return Tag.render`
			<div class="ui-popup-menu-item-header">
				${this.#renderTitle()}
				${this.#renderSubtitle()}
			</div>
		`;
	}

	#renderTitle(): HTMLElement
	{
		return Tag.render`
			<div class="ui-popup-menu-item-title">
				${this.#renderLock()}
				<div class="ui-popup-menu-item-title-text">${Text.encode(this.#options.title)}</div>
				${this.#renderBadgeText()}
			</div>
		`;
	}

	#renderLock(): HTMLElement
	{
		if (!this.#options.isLocked)
		{
			return '';
		}

		return Tag.render`
			<div class="ui-popup-menu-item-lock" aria-hidden="true">
				<div class="ui-icon-set --${Outline.LOCK_L}"></div>
			</div>
		`;
	}

	#renderBadgeText(): HTMLElement
	{
		if (!Type.isStringFilled(this.#options.badgeText?.title))
		{
			return '';
		}

		const badge = Tag.render`
			<div class="ui-popup-menu-item-badge-text">
				${Text.encode(this.#options.badgeText.title)}
			</div>
		`;

		const { color } = this.#options.badgeText;
		if (Type.isStringFilled(color))
		{
			// setProperty, not a style string: a colour coming straight from consumer data
			// must not be able to bring a second declaration along with it.
			Dom.style(badge, '--badge-color', color);
		}

		return badge;
	}

	#renderSubtitle(): HTMLElement
	{
		if (!Type.isStringFilled(this.#options.subtitle))
		{
			return '';
		}

		return Tag.render`
			<div class="ui-popup-menu-item-subtitle">${Text.encode(this.#options.subtitle)}</div>
		`;
	}

	#renderButtons(): HTMLElement
	{
		return Tag.render`
			<div class="ui-popup-menu-item-buttons">
				${this.#renderCheck()}
				${this.#renderExtra()}
				${this.#renderCounter()}
				${this.#renderIcon()}
				${this.#renderArrow()}
			</div>
		`;
	}

	#renderCheck(): HTMLElement
	{
		if (!Type.isBoolean(this.#options.isSelected))
		{
			return '';
		}

		if (!this.#options.isSelected)
		{
			return Tag.render`
				<div class="ui-popup-menu-item-check" aria-hidden="true"></div>
			`;
		}

		return Tag.render`
			<div class="ui-popup-menu-item-check" aria-hidden="true">
				<div class="ui-icon-set --${Outline.CHECK_L}"></div>
			</div>
		`;
	}

	#renderExtra(): HTMLElement
	{
		if (!this.#options.extraIcon)
		{
			return '';
		}

		const extra = Tag.render`
			<div class="ui-popup-menu-item-extra ${this.#options.extraIcon.isSelected ? '--selected' : ''}">
				<div class="ui-icon-set --${this.#options.extraIcon.icon}"></div>
			</div>
		`;

		Event.bind(extra, 'click', (event: MouseEvent): void => {
			this.#options.extraIcon.onClick();
			event.stopPropagation();
		}, true);

		return extra;
	}

	#renderCounter(): HTMLElement
	{
		if (!this.#options.counter)
		{
			return '';
		}

		if (!this.#options.counter.value)
		{
			return Tag.render`
				<div class="ui-popup-menu-item-counter" aria-hidden="true"></div>
			`;
		}

		// A non-empty counter carries meaning (e.g. an unread count) and joins the
		// item's accessible name, so it is not hidden from the a11y tree.
		return Tag.render`
			<div class="ui-popup-menu-item-counter">
				${new Counter({ color: CounterColor.DANGER, ...this.#options.counter }).render()}
			</div>
		`;
	}

	#renderIcon(): HTMLElement
	{
		if (this.#options.icon)
		{
			return Tag.render`
				<div class="ui-popup-menu-item-icon" aria-hidden="true">
					<div class="ui-icon-set --${this.#options.icon}"></div>
				</div>
			`;
		}

		if (this.#options.svg)
		{
			return Tag.render`
				<div class="ui-popup-menu-item-svg" aria-hidden="true">
					${this.#options.svg}
				</div>
			`;
		}

		return '';
	}

	#renderArrow(): HTMLElement
	{
		if (!this.#options.subMenu)
		{
			return '';
		}

		return Tag.render`
			<div class="ui-popup-menu-item-arrow" aria-hidden="true">
				<div class="ui-icon-set --${Outline.CHEVRON_RIGHT_L}"></div>
			</div>
		`;
	}
}
