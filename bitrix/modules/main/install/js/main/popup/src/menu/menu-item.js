import { Type, Text, Dom, Event, Tag } from 'main.core';
import { BaseEvent, EventEmitter } from 'main.core.events';
import { FocusMonitor, RESTORE_FOCUS_EVENT, type InputModality } from 'ui.a11y';

import { Menu } from './menu';
import { type MenuItemOptions } from './menu-types';

const aliases = {
	onSubMenuShow: { namespace: 'BX.Main.Menu.Item', eventName: 'SubMenu:onShow' },
	onSubMenuClose: { namespace: 'BX.Main.Menu.Item', eventName: 'SubMenu:onClose' },
};

const reEscape = /["'<>]/g;
const escapeEntities = {
	'<': '&lt;',
	'>': '&gt;',
	"'": '&#39;',
	'"': '&quot;',
};

function encodeSafe(value: string): string
{
	if (Type.isString(value))
	{
		return value.replaceAll(reEscape, (item: string) => escapeEntities[item]);
	}

	return value;
}

EventEmitter.registerAliases(aliases);

export class MenuItem extends EventEmitter
{
	#items: MenuItem[] = [];
	#justFocused = false;

	constructor(itemOptions: MenuItemOptions)
	{
		super();
		this.setEventNamespace('BX.Main.Menu.Item');

		const options = itemOptions || {};
		this.options = options;

		this.id = options.id || Text.getRandom();

		this.text = '';
		this.allowHtml = false;
		if (Type.isStringFilled(options.html) || Type.isElementNode(options.html))
		{
			this.text = options.html;
			this.allowHtml = true;
		}
		else if (Type.isStringFilled(options.text))
		{
			this.text = options.text;
			if (/<[^>]+>/.test(this.text))
			{
				// eslint-disable-next-line no-console
				console.warn('BX.Main.MenuItem: use "html" option for the html item content.', this.getText());
			}
		}

		this.title = Type.isStringFilled(options.title) ? options.title : '';
		this.delimiter = options.delimiter === true;
		this.href = Type.isStringFilled(options.href) ? options.href : null;
		this.target = Type.isStringFilled(options.target) ? options.target : null;
		this.dataset = Type.isPlainObject(options.dataset) ? options.dataset : null;
		this.className = Type.isStringFilled(options.className) ? options.className : null;
		this.menuShowDelay = Type.isNumber(options.menuShowDelay) ? options.menuShowDelay : 300;
		this.subMenuOffsetX = Type.isNumber(options.subMenuOffsetX) ? options.subMenuOffsetX : 4;
		this.#items = Type.isArray(options.items) ? options.items : [];
		this.disabled = options.disabled === true;
		this.cacheable = options.cacheable === true;
		this.focusable = this.delimiter !== true && options.focusable !== false;
		this.attrs = Type.isPlainObject(options.attrs) ? options.attrs : null;

		/**
		 *
		 * @type {function|string}
		 */
		this.onclick = (
			Type.isStringFilled(options.onclick) || Type.isFunction(options.onclick)
				? options.onclick
				: null
		);

		this.subscribeFromOptions(options.events, aliases);

		/**
		 *
		 * @type {Menu}
		 */
		this.menuWindow = null;

		/**
		 *
		 * @type {Menu}
		 */
		this.subMenuWindow = null;

		/**
		 *
		 * @type {{item: HTMLElement, text: HTMLElement}}
		 */
		this.layout = {
			item: null,
			text: null,
		};

		this.getLayout(); // compatibility

		// compatibility
		// now use this.options
		this.events = {};
		this.items = [];
		for (const property of Object.keys(options))
		{
			if (!(property in this))
			{
				this[property] = options[property];
			}
		}
	}

	getLayout(): { item: HTMLElement, text: HTMLElement }
	{
		if (this.layout.item)
		{
			return this.layout;
		}

		if (this.delimiter)
		{
			if (Type.isStringFilled(this.getText()))
			{
				this.layout.item = Dom.create('span', {
					props: {
						className: [
							'popup-window-delimiter-section',
							this.className || '',
						].join(' '),
					},
					attrs: {
						'aria-hidden': 'true',
					},
					children: [
						(this.layout.text = Tag.render`
							<span class="popup-window-delimiter-text">${
								this.allowHtml ? this.getText() : encodeSafe(this.getText())
							}</span>
						`),
					],
				});
			}
			else
			{
				this.layout.item = Tag.render`<span class="popup-window-delimiter" aria-hidden="true"></span>`;
			}
		}
		else
		{
			this.layout.item = Dom.create(this.href ? 'a' : 'span', {
				props: {
					className: [
						'menu-popup-item',
						(this.className || 'menu-popup-no-icon'),
						(this.hasSubMenu() ? 'menu-popup-item-submenu' : ''),
					].join(' '),
				},
				attrs: {
					title: this.title,
					onclick: Type.isString(this.onclick) ? this.onclick : '', // compatibility
					target: this.target || '',
				},

				dataset: this.dataset,
				events: Type.isFunction(this.onclick) ? { click: this.onItemClick.bind(this) } : null,
				children: [
					Dom.create('span', { props: { className: 'menu-popup-item-icon' } }),
					(this.layout.text = Tag.render`
						<span class="menu-popup-item-text">${
							this.allowHtml ? this.getText() : encodeSafe(this.getText())
						}</span>
					`),
				],
			});

			if (Type.isPlainObject(this.attrs))
			{
				Dom.attr(this.layout.item, this.attrs);
			}

			if (this.isFocusable())
			{
				Dom.attr(this.layout.item, 'tabindex', '-1');
				Dom.attr(this.layout.item, 'role', 'menuitem');
			}
			else
			{
				Dom.attr(this.layout.item, 'aria-hidden', 'true');
			}

			if (this.hasSubMenu())
			{
				Dom.attr(this.layout.item, 'aria-haspopup', 'true');
				Dom.attr(this.layout.item, 'aria-expanded', 'false');
			}

			if (this.href)
			{
				this.layout.item.href = this.href;
			}

			if (this.isDisabled())
			{
				this.disable();
			}

			Event.bind(this.layout.item, RESTORE_FOCUS_EVENT, this.#handleItemRestoreFocus.bind(this));
		}

		Event.bind(this.layout.item, 'mouseenter', this.#handleItemMouseEnter.bind(this));
		Event.bind(this.layout.item, 'mouseleave', this.#handleItemMouseLeave.bind(this));
		Event.bind(this.layout.item, 'focusin', this.#handleItemFocus.bind(this));

		return this.layout;
	}

	getContainer(): HTMLElement
	{
		return this.getLayout().item;
	}

	getTextContainer(): HTMLElement
	{
		return this.getLayout().text;
	}

	getText(): string | HTMLElement
	{
		return this.text;
	}

	getTextContent(): string
	{
		if (Type.isString(this.text))
		{
			return this.text;
		}

		if (Type.isElementNode(this.text))
		{
			return this.text.textContent || '';
		}

		return '';
	}

	setText(text: string | HTMLElement, allowHtml = false)
	{
		if (Type.isString(text) || Type.isElementNode(text))
		{
			this.allowHtml = allowHtml;
			this.text = text;

			if (Type.isElementNode(text))
			{
				Dom.clean(this.getTextContainer());
				if (this.allowHtml)
				{
					Dom.append(text, this.getTextContainer());
				}
				else
				{
					this.getTextContainer().innerHTML = encodeSafe(text.outerHTML);
				}
			}
			else
			{
				this.getTextContainer().innerHTML = this.allowHtml ? text : encodeSafe(text);
			}
		}
	}

	hasSubMenu(): boolean
	{
		return this.subMenuWindow !== null || this.#items.length > 0;
	}

	showSubMenu(trigger: InputModality = null): void
	{
		if (!this.getMenuWindow().isShown())
		{
			return;
		}

		this.addSubMenu(this.#items);

		if (this.getSubMenu() !== null)
		{
			this.closeSiblings(trigger);
			this.closeChildren(trigger);

			if (!this.getSubMenu().isShown())
			{
				this.emit('SubMenu:onShow');
				this.getSubMenu().setLastInputModality(trigger);
				this.getSubMenu().show();
			}

			Dom.attr(this.layout.item, 'aria-controls', this.getSubMenu().getId());

			this.adjustSubMenu();
		}
	}

	addSubMenu(items: []): Menu | null
	{
		if (this.subMenuWindow !== null || !Type.isArray(items) || items.length === 0)
		{
			return null;
		}

		const rootMenuWindow = this.getMenuWindow().getRootMenuWindow() || this.getMenuWindow();
		const rootOptions = { ...rootMenuWindow.params };
		delete rootOptions.events;

		const subMenuOptions = (
			Type.isPlainObject(rootMenuWindow.params.subMenuOptions) ? rootMenuWindow.params.subMenuOptions : {}
		);

		const options = { ...rootOptions, ...subMenuOptions };

		// Override root menu options
		options.autoHide = false;
		options.menuShowDelay = this.menuShowDelay;
		options.cacheable = this.isCacheable();
		options.targetContainer = this.getMenuWindow().getPopupWindow().getTargetContainer();
		options.bindOptions = {
			forceTop: true,
			forceLeft: true,
			forceBindPosition: true,
		};

		options.focusTrap = {
			initialFocus: false,
		};

		delete options.angle;
		delete options.overlay;

		this.subMenuWindow = new Menu(`popup-submenu-${this.id}`, this.layout.item, items, options);
		this.subMenuWindow.setParentMenuWindow(this.getMenuWindow());
		this.subMenuWindow.setParentMenuItem(this);

		this.subMenuWindow.subscribe('onShow', this.#handleSubMenuShow.bind(this));
		this.subMenuWindow.subscribe('onClose', this.#handleSubMenuClose.bind(this));
		this.subMenuWindow.subscribe('onDestroy', this.#handleSubMenuDestroy.bind(this));

		Dom.addClass(this.layout.item, 'menu-popup-item-submenu');
		Dom.attr(this.layout.item, 'aria-haspopup', 'true');

		return this.subMenuWindow;
	}

	closeSubMenu(trigger: InputModality = null): void
	{
		this.#clearSubMenuTimeout();

		if (this.getSubMenu() !== null)
		{
			this.closeChildren(trigger);
			if (this.getSubMenu().isShown())
			{
				this.emit('SubMenu:onClose');
			}

			this.getSubMenu().setLastInputModality(trigger);
			this.getSubMenu().close();
		}
	}

	closeSiblings(trigger: InputModality = null): void
	{
		const siblings = this.menuWindow.getMenuItems();
		for (const sibling of siblings)
		{
			if (sibling !== this)
			{
				sibling.closeSubMenu(trigger);
			}
		}
	}

	closeChildren(trigger: InputModality = null): void
	{
		if (this.getSubMenu() !== null)
		{
			const children = this.getSubMenu().getMenuItems();
			for (const child of children)
			{
				child.closeSubMenu(trigger);
			}
		}
	}

	destroySubMenu(): void
	{
		if (this.getSubMenu() !== null)
		{
			Dom.removeClass(this.layout.item, 'menu-popup-item-open menu-popup-item-submenu');
			Dom.attr(this.layout.item, 'aria-haspopup', null);
			this.destroyChildren();
			this.getSubMenu().destroy();

			this.subMenuWindow = null;
			this.#items = [];
		}
	}

	destroyChildren(): void
	{
		if (this.getSubMenu() !== null)
		{
			const children = this.getSubMenu().getMenuItems();
			for (const child of children)
			{
				child.destroySubMenu();
			}
		}
	}

	adjustSubMenu(): void
	{
		if (this.getSubMenu() === null || !this.layout.item)
		{
			return;
		}

		const popupWindow = this.getSubMenu().getPopupWindow();
		const itemRect = this.getBoundingClientRect();

		let offsetLeft = itemRect.width + this.subMenuOffsetX;
		let offsetTop = itemRect.height + this.getPopupPadding();
		let angleOffset = itemRect.height / 2 - this.getPopupPadding();
		let anglePosition = 'left';

		const popupWidth = popupWindow.getPopupContainer().offsetWidth;
		const popupHeight = popupWindow.getPopupContainer().offsetHeight;
		const popupBottom = itemRect.top + popupHeight;

		const targetContainer = this.getMenuWindow().getPopupWindow().getTargetContainer();
		const isGlobalContext = this.getMenuWindow().getPopupWindow().isTargetDocumentBody();
		const clientWidth = isGlobalContext ? document.documentElement.clientWidth : targetContainer.offsetWidth;
		const clientHeight = isGlobalContext ? document.documentElement.clientHeight : targetContainer.offsetHeight;

		// let's try to fit a submenu to the browser viewport
		const exceeded = popupBottom - clientHeight;
		if (exceeded > 0)
		{
			let roundOffset = Math.ceil(exceeded / itemRect.height) * itemRect.height;
			if (roundOffset > itemRect.top)
			{
				// it cannot be higher than the browser viewport.
				roundOffset -= Math.ceil((roundOffset - itemRect.top) / itemRect.height) * itemRect.height;
			}

			if (itemRect.bottom > (popupBottom - roundOffset))
			{
				// let's sync bottom boundaries.
				roundOffset -= itemRect.bottom - (popupBottom - roundOffset) + this.getPopupPadding();
			}

			offsetTop += roundOffset;
			angleOffset += roundOffset;
		}

		if ((itemRect.left + offsetLeft + popupWidth) > clientWidth)
		{
			const left = itemRect.left - popupWidth - this.subMenuOffsetX;
			if (left > 0)
			{
				offsetLeft = -popupWidth - this.subMenuOffsetX;
				anglePosition = 'right';
			}
		}

		popupWindow.setBindElement(this.layout.item);
		popupWindow.setOffset({ offsetLeft, offsetTop: -offsetTop });
		popupWindow.setAngle({ position: anglePosition, offset: angleOffset });
		popupWindow.adjustPosition();
	}

	getBoundingClientRect(): DOMRect
	{
		const popup = this.getMenuWindow().getPopupWindow();
		if (popup.isTargetDocumentBody())
		{
			return this.layout.item.getBoundingClientRect();
		}

		const rect = popup.getPositionRelativeToTarget(this.layout.item);
		const targetContainer = this.getMenuWindow().getPopupWindow().getTargetContainer();

		return new DOMRect(
			rect.left - targetContainer.scrollLeft,
			rect.top - targetContainer.scrollTop,
			rect.width,
			rect.height,
		);
	}

	getPopupPadding(): number
	{
		if (!Type.isNumber(this.popupPadding))
		{
			if (this.subMenuWindow)
			{
				const menuContainer = this.subMenuWindow.layout.menuContainer;
				this.popupPadding = parseInt(Dom.style(menuContainer, 'paddingTop'), 10);
			}
			else
			{
				this.popupPadding = 0;
			}
		}

		return this.popupPadding;
	}

	getSubMenu(): Menu | null
	{
		return this.subMenuWindow;
	}

	getId(): string
	{
		return this.id;
	}

	setMenuWindow(menu: Menu): string
	{
		this.menuWindow = menu;
	}

	getMenuWindow(): Menu | null
	{
		return this.menuWindow;
	}

	getMenuShowDelay(): number
	{
		return this.menuShowDelay;
	}

	enable(): void
	{
		this.disabled = false;
		Dom.removeClass(this.getContainer(), 'menu-popup-item-disabled');
		Dom.attr(this.getContainer(), 'aria-disabled', null);
	}

	disable(): void
	{
		this.disabled = true;
		this.closeSubMenu();
		Dom.addClass(this.getContainer(), 'menu-popup-item-disabled');
		Dom.attr(this.getContainer(), 'aria-disabled', 'true');
	}

	isDisabled(): boolean
	{
		return this.disabled;
	}

	isFocusable(): boolean
	{
		return this.focusable;
	}

	setCacheable(cacheable): void
	{
		this.cacheable = cacheable !== false;
	}

	isCacheable(): boolean
	{
		return this.cacheable;
	}

	isDelimiter(): boolean
	{
		return this.delimiter;
	}

	focus(focusVisible = false): void
	{
		if (this.isFocused() || this.isDelimiter() || !this.isFocusable())
		{
			return;
		}

		this.focused = true;
		Dom.addClass(this.getContainer(), `--focus${focusVisible ? ' --focus-visible' : ''}`);
		Dom.attr(this.getContainer(), 'tabindex', '0');

		if (this.getMenuWindow().getFocusTrap() !== null)
		{
			this.getContainer().focus({ preventScroll: !focusVisible });
		}

		this.getMenuWindow().emit('Item:onFocus', { item: this });
	}

	blur(): void
	{
		if (!this.isFocused() || this.isDelimiter() || !this.isFocusable())
		{
			return;
		}

		this.focused = false;
		Dom.removeClass(this.getContainer(), '--focus --focus-visible');
		Dom.attr(this.getContainer(), 'tabindex', '-1');

		this.getMenuWindow().emit('Item:onBlur', { item: this });
	}

	isFocused(): boolean
	{
		return this.focused;
	}

	/**
	 * @private
	 */
	onItemClick(event): void
	{
		this.onclick.call(this.menuWindow, event, this); // compatibility
	}

	#handleItemFocus(): void
	{
		this.#justFocused = true;
		setTimeout(() => {
			this.#justFocused = false;
		}, 100);
	}

	#handleItemMouseEnter(mouseEvent: MouseEvent): void
	{
		if (this.getMenuWindow()?.shouldIgnoreMouseEnter() || this.#justFocused)
		{
			return;
		}

		const event = new BaseEvent({ data: { mouseEvent } });
		EventEmitter.emit(this, 'onMouseEnter', event, { thisArg: this });
		if (event.isDefaultPrevented())
		{
			return;
		}

		this.focus();

		this.#clearSubMenuTimeout();

		if (this.hasSubMenu())
		{
			this.subMenuTimeout = setTimeout(() => {
				this.showSubMenu('pointer');
			}, this.menuShowDelay);
		}
		else
		{
			this.subMenuTimeout = setTimeout(() => {
				this.closeSiblings('pointer');
			}, this.menuShowDelay);
		}
	}

	#handleItemMouseLeave(mouseEvent: MouseEvent): void
	{
		const event = new BaseEvent({ data: { mouseEvent } });
		EventEmitter.emit(this, 'onMouseLeave', event, { thisArg: this });
		if (event.isDefaultPrevented())
		{
			return;
		}

		this.blur();

		this.#clearSubMenuTimeout();
	}

	#handleItemRestoreFocus(event: typeof(window.Event)): void
	{
		event.preventDefault();

		const hasFocus = this.getMenuWindow().getMenuItems().some((item) => item.isFocused());
		if (!hasFocus)
		{
			this.focus(FocusMonitor.Instance.getLastInputModality() === 'keyboard');
		}
	}

	#clearSubMenuTimeout(): void
	{
		if (this.subMenuTimeout)
		{
			clearTimeout(this.subMenuTimeout);
		}

		this.subMenuTimeout = null;
	}

	#handleSubMenuShow(): void
	{
		Dom.addClass(this.layout.item, 'menu-popup-item-open');
		Dom.attr(this.layout.item, 'aria-expanded', 'true');
	}

	#handleSubMenuClose(): void
	{
		Dom.removeClass(this.layout.item, 'menu-popup-item-open');
		Dom.attr(this.layout.item, 'aria-expanded', 'false');
		Dom.attr(this.layout.item, 'aria-controls', null);
	}

	#handleSubMenuDestroy(): void
	{
		this.#handleSubMenuClose();
		this.subMenuWindow = null;
	}
}
