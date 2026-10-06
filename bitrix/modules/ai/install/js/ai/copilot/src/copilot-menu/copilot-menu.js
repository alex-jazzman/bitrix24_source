import type { Role } from 'ai.engine';
import { Tag, Type, Text, Dom, bind, Loc, Extension } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { Menu, MenuItem, Popup } from 'main.popup';
import type { MenuItemOptions } from 'main.popup';
import { Icon, Main, Outline } from 'ui.icon-set.api.core';
import { KeyboardMenu, KeyboardMenuEvents } from './keyboard-menu';
import { CopilotMenuCommand } from './index';
import 'ui.icon-set.actions';
import 'ui.icon-set.main';
import 'ui.icon-set.editor';
import 'ui.icon-set.crm';
import 'ui.icon-set.outline';
import { Label, LabelColor, LabelSize } from 'ui.label';
import { Loader } from 'main.loader';

import './copilot-menu.css';

export type CopilotMenuOptions = {
	items: CopilotMenuItem[];
	bindElement: Element,
	offsetTop?: number;
	offsetLeft?: number;
	cacheable?: boolean;
	keyboardControlOptions: CopilotMenuKeyboardControlOptions;
	forceTop: boolean;
	autoHide: boolean;
	angle: boolean | {offset: number, position?: ("top" | "bottom" | "left" | "right")},
	bordered: boolean;
	roleInfo: CopilotMenuItemRoleInfo;
}

export type CopilotMenuItemRoleInfo = {
	role: Role;
	onclick: Function;
	subtitle: string;
}

type CopilotMenuKeyboardControlOptions = {
	highlightFirstItemAfterShow: boolean;
	canGoOutFromTop: boolean;
	clearHighlightAfterType: boolean;
}

export const CopilotMenuEvents = Object.freeze({
	select: 'select',
	open: 'open',
	close: 'close',
	clearHighlight: 'clearHighlight',
	highlightMenuItem: 'highlightMenuItem',
});

export type CopilotMenuItem = CopilotMenuItemAbility | CopilotMenuItemDelimiter;

type CopilotMenuItemAbility = {
	id: string;
	code: string;
	text: string;
	icon?: string;
	section?: string;
	children?: CopilotMenuItem[];
	selected?: boolean;
	arrow?: boolean;
	href?: string;
	notHighlight?: boolean;
	highlightText?: boolean;
	disabled?: boolean;
	command?: Function | CopilotMenuCommand;
	labelText?: string;
	isFavourite?: boolean;
	isShowFavouriteIconOnHover?: boolean;
}

type CopilotMenuItemDelimiter = {
	separator: boolean;
	title?: string;
	section?: string;
	isNew?: boolean;
}

export class CopilotMenu extends EventEmitter
{
	#keyboardMenu: KeyboardMenu;
	#menuItems: CopilotMenuItem[];
	#cacheable: boolean;
	#keyboardControlOptions: CopilotMenuKeyboardControlOptions;
	#forceTop: boolean = true;
	#autoHide: boolean = false;
	#angle: boolean | { offset: number, position?: ("top" | "bottom" | "left" | "right") };
	#bordered: boolean = true;
	#roleInfo: CopilotMenuItemRoleInfo;
	#currentRole: Role;
	#roleInfoContainer: HTMLElement;
	#loader: Loader;
	#isBitrixGptV2Available: boolean;

	constructor(options: CopilotMenuOptions)
	{
		super(options);

		this.setEventNamespace('AI.Copilot.Menu');

		this.#menuItems = options.items;
		this.#cacheable = options.cacheable ?? true;
		this.#forceTop = options.forceTop === undefined ? this.#forceTop : options.forceTop === true;
		this.#autoHide = options.autoHide === true;
		this.#angle = options.angle;
		this.#bordered = options.bordered ?? this.#bordered;
		this.#isBitrixGptV2Available = Extension.getSettings('ai.copilot').get('isBitrixGptV2Available') === true;

		this.#initRoleInfoFromOptions(options.roleInfo);

		if (options.keyboardControlOptions)
		{
			this.#keyboardControlOptions = options.keyboardControlOptions;
		}
		else
		{
			this.#keyboardControlOptions = {
				canGoOutFromTop: true,
				highlightFirstItemAfterShow: false,
				clearHighlightAfterType: false,
			};
		}
	}

	open(): void
	{
		this.#getMenu().show();
		this.adjustPosition();
		this.emit(CopilotMenuEvents.open);
	}

	show(): void
	{
		Dom.style(this.getPopup()?.getPopupContainer(), 'border', null);
		this.getPopup()?.setMaxWidth(null);
		this.getPopup()?.setMinWidth(258);
		this.adjustPosition();
		this.enableArrowsKey();
	}

	close(): void
	{
		this.#getMenu().close();
		this.#closeAllSubmenus();
		this.emit(CopilotMenuEvents.close);
	}

	hide(): void
	{
		Dom.style(this.getPopup()?.getPopupContainer(), 'border', 'none');
		this.getPopup()?.setMaxWidth(0);
		this.getPopup()?.setMinWidth(0);
		this.adjustPosition();
		this.#closeAllSubmenus();
		this.disableArrowsKey();
	}

	contains(target: HTMLElement): boolean
	{
		for (const menuItem of this.#getMenu().getMenuItems())
		{
			const itemPopup = menuItem.getSubMenu()?.getPopupWindow();
			if (itemPopup?.getPopupContainer()?.contains(target))
			{
				return true;
			}
		}

		return this.getPopup().getPopupContainer().contains(target);
	}

	isShown(): boolean
	{
		return this.#keyboardMenu?.getMenu()?.getPopupWindow()?.isShown();
	}

	setBindElement(bindElement: HTMLElement, offset: { left: number, top: number })
	{
		this.#getMenu().getPopupWindow().setBindElement(bindElement);
		this.#getMenu().getPopupWindow().setOffset({
			offsetLeft: offset?.left,
			offsetTop: offset?.top,
		});
		this.#getMenu().getPopupWindow().adjustPosition();
	}

	getPopup(): Popup
	{
		return this.#getMenu().getPopupWindow();
	}

	adjustPosition()
	{
		this.#getMenu().getPopupWindow().adjustPosition({
			forceBindPosition: true,
			forceTop: this.#forceTop,
		});
	}

	replaceMenuItemSubmenu(newCopilotMenuItem: CopilotMenuItem): void
	{
		const menuItem: MenuItem = this.#getMenu().getMenuItems().find((currentMenuItem: MenuItem) => {
			return newCopilotMenuItem.code === currentMenuItem.getId();
		});

		menuItem.destroySubMenu();
		// eslint-disable-next-line no-underscore-dangle,@bitrix24/bitrix24-rules/no-pseudo-private
		menuItem._items = this.#getMenuItems(newCopilotMenuItem.children, true);
		menuItem.addSubMenu(this.#getMenuItems(newCopilotMenuItem.children, true));
	}

	enableArrowsKey(): void
	{
		this.#keyboardMenu?.enableArrows();
	}

	disableArrowsKey(): void
	{
		this.#keyboardMenu?.disableArrows();
	}

	markMenuItemSelected(menuItemId: string): void
	{
		const menuItem = this.#getMenu().getMenuItem(menuItemId);
		const menuItemInnerContainer = menuItem.getContainer().querySelector('.ai__copilot-menu_item');

		Dom.addClass(menuItemInnerContainer, '--selected');
	}

	unmarkMenuItemSelected(menuItemId: string): void
	{
		const menuItem = this.#getMenu().getMenuItem(menuItemId);

		const menuItemInnerContainer = menuItem.getContainer().querySelector('.ai__copilot-menu_item');
		Dom.removeClass(menuItemInnerContainer, '--selected');
	}

	updateRoleInfo(role: Role): void
	{
		this.#currentRole.avatar = role.avatar;
		this.#currentRole.name = role.name;
	}

	setItemIsFavourite(itemCode: string, isFavourite: boolean): void
	{
		const itemContainer = this.#getMenu().getMenuItem(itemCode)?.getContainer();

		if (!itemContainer)
		{
			return;
		}

		const favouriteLabelWrapper = itemContainer.querySelector('.ai__copilot-menu_item-favourite');

		if (!favouriteLabelWrapper)
		{
			return;
		}

		Dom.replace(favouriteLabelWrapper, this.#renderFavouriteLabel(itemCode, isFavourite));
	}

	insertItemBefore(itemCode: string, insertedItem: CopilotMenuItem): void
	{
		const menuItem = this.#getMenuItem(insertedItem, false);

		this.#getMenu().addMenuItem(menuItem, itemCode);
	}

	insertItemAfterRole(insertedItem: CopilotMenuItem): void
	{
		const roleItemPosition = this.#getMenu().getMenuItemPosition('role-item');
		const menuItemAfterRoleItem = this.#getMenu().getMenuItems()[roleItemPosition + 1];

		this.insertItemBefore(menuItemAfterRoleItem.getId(), insertedItem);
	}

	insertItemAfter(itemCode: string, insertedItem: CopilotMenuItem): void
	{
		const menuItemAfterTarget = this.#getMenu()
			.getMenuItems()[this.#getMenu().getMenuItemPosition(itemCode) + 1];

		this.insertItemBefore(menuItemAfterTarget.getId(), insertedItem);
	}

	removeItem(itemCode: string): void
	{
		this.#getMenu().removeMenuItem(itemCode);
	}

	setLoader(): void
	{
		const popupContainer = this.#getMenu().getPopupWindow()?.getPopupContainer();

		if (!popupContainer)
		{
			return;
		}

		const fade = Tag.render`<div class="ai__copilot-menu-popup_fade"></div>`;

		Dom.append(fade, popupContainer);

		this.#loader = new Loader({
			size: 55,
			target: popupContainer,
			color: getComputedStyle(document.body).getPropertyValue('--ui-color-copilot-primary') || '#8e52ec',
		});

		this.#loader.show();
	}

	removeLoader(): void
	{
		const popupContainer = this.#getMenu().getPopupWindow()?.getPopupContainer();

		if (!popupContainer)
		{
			return;
		}

		const fade = popupContainer.querySelector('.ai__copilot-menu-popup_fade');

		Dom.remove(fade);

		this.#loader.destroy();
		this.#loader = null;
	}

	updateMenuItemsExceptRoleItem(copilotMenuItems: CopilotMenuItem[]): void
	{
		this.#removeMenuItemsExceptRoleItem();
		this.#addMenuItems(copilotMenuItems);
	}

	#removeMenuItemsExceptRoleItem(): void
	{
		const menuItems = this.#getMenu().getMenuItems();

		menuItems.forEach((currentMenuItem) => {
			const id = currentMenuItem.getId();

			if (id === 'role-item')
			{
				return;
			}

			requestAnimationFrame(() => {
				this.#getMenu().removeMenuItem(id);
			});
		});
	}

	#addMenuItems(copilotMenuItems: CopilotMenuItem[]): void
	{
		const newMenuItems = this.#getMenuItems(copilotMenuItems);

		newMenuItems.forEach((newMenuItem) => {
			requestAnimationFrame(() => {
				this.#getMenu().addMenuItem(newMenuItem);
			});
		});
	}

	#closeAllSubmenus(): void
	{
		this.#getMenu().getMenuItems().forEach((menuItem) => {
			menuItem.closeSubMenu();
		});
	}

	#getMenu(): Menu
	{
		if (!this.#keyboardMenu)
		{
			this.#initKeyboardMenu();
		}

		return this.#keyboardMenu.getMenu();
	}

	#initKeyboardMenu(): void
	{
		const menu = new Menu({
			minWidth: 258,
			maxHeight: 372,
			angle: this.#angle,
			closeByEsc: false,
			closeIcon: false,
			items: this.#getMenuItems(this.#menuItems),
			toFrontOnShow: true,
			autoHide: this.#autoHide,
			className: `ai__copilot-scope ai__copilot-menu-popup${this.#isBitrixGptV2Available ? ' --bitrixgpt-redesign' : ''} ${this.#bordered ? '--bordered' : ''}`,
			cacheable: this.#cacheable,
			events: {
				onPopupClose: (popup: Popup) => {
					this.emit(CopilotMenuEvents.close);
					Dom.style(popup.getPopupContainer(), 'border', 'none');
				},
				onPopupAfterClose: (popup: Popup) => {
					Dom.style(popup.getPopupContainer(), 'border', null);
				},
				onPopupShow: () => {
					if (this.#forceTop && this.#isMenuVisible() === false)
					{
						this.#scrollForMenuVisibility();
					}
				},
			},
		});

		const keyBoardMenu = new KeyboardMenu({
			menu,
			...this.#keyboardControlOptions,
		});

		keyBoardMenu.subscribe(KeyboardMenuEvents.clearHighlight, () => {
			this.emit(CopilotMenuEvents.clearHighlight);
		});

		keyBoardMenu.subscribe(KeyboardMenuEvents.highlightMenuItem, () => {
			this.emit(CopilotMenuEvents.highlightMenuItem);
		});

		this.#keyboardMenu = keyBoardMenu;
	}

	#isMenuVisible(): boolean
	{
		const popupContainer: HTMLElement = this.#getMenu().getPopupWindow().getPopupContainer();
		const popupContainerPosition = popupContainer.getBoundingClientRect();

		return popupContainerPosition.bottom < window.innerHeight;
	}

	#scrollForMenuVisibility(): void
	{
		const popupContainer: HTMLElement = this.#getMenu().getPopupWindow().getPopupContainer();
		const popupContainerPosition = Dom.getPosition(popupContainer);

		window.scrollTo({
			top: popupContainerPosition.bottom + 20 - window.innerHeight,
			behavior: 'smooth',
		});

		if (popupContainerPosition.bottom > document.body.scrollHeight)
		{
			Dom.style(document.body, 'min-height', `${popupContainerPosition.bottom}px`);
		}
	}

	#getMenuItems(items?: CopilotMenuItem[], isSubmenu: boolean = false): MenuItemOptions[]
	{
		if (!items)
		{
			return [];
		}

		const menuItems = items.map((item): MenuItemOptions => {
			return this.#getMenuItem(item, isSubmenu);
		});

		if (this.#roleInfo && isSubmenu === false)
		{
			menuItems.unshift(this.#getRoleMenuItem());
		}

		return menuItems;
	}

	#getMenuItem(item: CopilotMenuItem, isSubmenuItem: boolean): MenuItemOptions
	{
		return this.#isSeparatorMenuItem(item)
			? this.#getSectionSeparatorMenuItem(item)
			: this.#getAbilityMenuItem(item, isSubmenuItem);
	}

	#isSeparatorMenuItem(menuItem: CopilotMenuItem): boolean
	{
		return menuItem.separator;
	}

	#getAbilityMenuItem(item: CopilotMenuItemAbility, isSubmenuItem: boolean = false): MenuItemOptions
	{
		const iconElem = this.#renderAbilityMenuItemIcon(item);
		const checkIcon = this.#getCheckIcon();
		const stableItemIdentifier = item.id || item.code;
		const isBitrixGptProviderIcon = this.#isBitrixGptV2Available && item.code === 'provider';
		const menuIcon: HTMLElement | null = item.icon
			? (
				isBitrixGptProviderIcon
					? Tag.render`<div class="ai__copilot-menu_item-icon --bitrixgpt-provider" data-testid="copilot-provider-icon">${iconElem}</div>`
					: Tag.render`<div class="ai__copilot-menu_item-icon">${iconElem}</div>`
			)
			: null
		;

		const label = (item.labelText && this.#isBitrixGptV2Available === false)
			? (new Label({
				text: item.labelText,
				color: LabelColor.PRIMARY,
				fill: true,
				size: LabelSize.SM,
			})).render()
			: null;

		const labelWrapper = label ? Tag.render`<div>${label}</div>` : null;
		const favouriteLabel = Type.isBoolean(item.isFavourite)
			? this.#renderFavouriteLabel(item.code, item.isFavourite)
			: null
		;

		const html = this.#isBitrixGptV2Available
			? Tag.render`
				<div class="${this.#getMenuItemClassname(item, isSubmenuItem, item.selected)}">
					<div class="ai__copilot-menu_item-left">
						<div class="ai__copilot-menu_item-text">${Text.encode(item.text)}</div>
					</div>
					<div class="ai__copilot-menu_item-right">
						${favouriteLabel}
						<div class="ai__copilot-menu_item-check">
							${checkIcon.render()}
						</div>
						${labelWrapper}
						${menuIcon}
					</div>
				</div>
			`
			: Tag.render`
				<div class="${this.#getMenuItemClassname(item, isSubmenuItem, item.selected)}">
					<div class="ai__copilot-menu_item-left">
						${menuIcon}
						<div class="ai__copilot-menu_item-text">${Text.encode(item.text)}</div>
					</div>
					<div class="ai__copilot-menu_item-right">
						${favouriteLabel}
						<div class="ai__copilot-menu_item-check">
							${checkIcon.render()}
						</div>
						${labelWrapper}
					</div>
				</div>
			`;

		return {
			html,
			id: item.id || '',
			...(this.#isBitrixGptV2Available && Type.isStringFilled(stableItemIdentifier)
				? { dataset: { testid: `copilot-menu-item-${stableItemIdentifier}` } }
				: {}),
			text: item.text,
			href: item.href,
			className: `menu-popup-no-icon ${item.arrow ? 'menu-popup-item-submenu' : ''}`,
			onclick: this.#handleMenuItemClick(item.command).bind(this),
			items: this.#getMenuItems(item.children, true),
			cacheable: false,
			disabled: item.disabled,
		};
	}

	#renderFavouriteLabel(promptCode: string, isFavourite: boolean = false): HTMLElement
	{
		// Redesign flag: outline bookmark (Outline.BOOKMARK) for the not-favourite state;
		// keep the filled icon (Main.BOOKMARK_1) for the favourite state.
		const favouriteIconCode = (this.#isBitrixGptV2Available && isFavourite === false)
			? Outline.BOOKMARK
			: Main.BOOKMARK_1
		;

		const favouriteIcon = new Icon({
			icon: favouriteIconCode,
			size: 24,
		});

		const iconWrapperClassname = `ai__copilot-menu_item-favourite ${isFavourite ? '--is-favourite' : ''}`;
		const title = isFavourite
			? Loc.getMessage('AI_COPILOT_REMOVE_PROMPT_FROM_FAVOURITE')
			: Loc.getMessage('AI_COPILOT_ADD_PROMPT_TO_FAVOURITE')
		;

		const wrapper = Tag.render`
			<div title="${title}" class="${iconWrapperClassname}">
				${favouriteIcon.render()}
			</div>
		`;

		bind(wrapper, 'click', (event: PointerEvent) => {
			event.preventDefault();
			event.stopImmediatePropagation();

			const newIsFavourite = !isFavourite;

			this.emit('set-favourite', {
				promptCode,
				isFavourite: newIsFavourite,
			});
		});

		return wrapper;
	}

	#getRoleMenuItem(): MenuItemOptions
	{
		return {
			id: 'role-item',
			html: this.#getRoleMenuItemHtml(),
			className: `menu-popup-no-icon ${this.#roleInfo.onclick ? 'menu-popup-item-submenu' : ''} --role-item`,
			onclick: this.#handleMenuItemClick(this.#roleInfo.onclick).bind(this),
		};
	}

	#getRoleMenuItemHtml(): HTMLElement
	{
		if (this.#roleInfoContainer)
		{
			return this.#roleInfoContainer;
		}

		const { name, avatar } = this.#roleInfo.role;
		const subtitle = this.#roleInfo.subtitle;

		const roleClassName = this.#isBitrixGptV2Available
			? 'ai__copilot-menu_role --bitrixgpt-redesign'
			: 'ai__copilot-menu_role'
		;

		let glow = null;
		if (this.#isBitrixGptV2Available)
		{
			glow = Tag.render`<div class="ai__copilot-menu_role-glow" data-testid="copilot-menu-role-glow"></div>`;
			// Glow backdrop exported from Figma: a conic gradient softly clipped to a pill and
			// blurred (stdDeviation 16). Inline SVG (not a background-image); a CSS radial-gradient
			// fallback in copilot-menu.css covers WebKit/Safari, where this foreignObject is fragile.
			glow.innerHTML = '<svg width="100%" height="100%" viewBox="0 0 314 78" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">'
				+ '<g opacity="0.4" clip-path="url(#ai-copilot-glow-clip)">'
				+ '<g filter="url(#ai-copilot-glow-blur)">'
				+ '<g clip-path="url(#ai-copilot-glow-shape)"><g transform="matrix(-5.79497e-09 -0.0559167 0.157 -2.45592e-09 157 61)">'
				+ '<foreignObject x="-1090.91" y="-1090.91" width="2181.82" height="2181.82">'
				+ '<div xmlns="http://www.w3.org/1999/xhtml" style="background:conic-gradient(from 90deg,rgba(255,255,255,0) 0deg,rgba(255,255,255,0) 0.539121deg,rgba(0,151,233,1) 18deg,rgba(63,104,255,1) 28.8deg,rgba(157,71,255,1) 39.6deg,rgba(239,70,183,1) 57.6deg,rgba(249,98,105,1) 75.6deg,rgba(255,255,255,0) 90.2231deg,rgba(255,255,255,0) 360deg);height:100%;width:100%"></div>'
				+ '</foreignObject></g></g>'
				+ '</g></g>'
				+ '<defs>'
				+ '<filter id="ai-copilot-glow-blur" x="-32" y="-32" width="378" height="186" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">'
				+ '<feGaussianBlur stdDeviation="16" result="effect1_foregroundBlur"/></filter>'
				+ '<clipPath id="ai-copilot-glow-shape"><path d="M314 70.835C313.911 42.7443 291.112 20 263.001 20H51.001C22.8345 20 0.000976562 42.8335 0.000976562 71C0.000976562 99.1665 22.8345 122 51.001 122H0V0H314V70.835ZM314 122H263.001C291.113 122 313.912 99.2551 314 71.1641V122Z"/></clipPath>'
				+ '<clipPath id="ai-copilot-glow-clip"><rect width="314" height="122" fill="white"/></clipPath>'
				+ '</defs></svg>';
		}

		const roleLeftClassName = (this.#isBitrixGptV2Available && this.#isDefaultRoleAvatar(avatar))
			? 'ai__copilot-menu_role-left --bitrixgpt-default-avatar'
			: 'ai__copilot-menu_role-left'
		;
		const roleTitle = Tag.render`
			<span
				class="ai__copilot-menu_role-title"
				title="${name}"
			>
				${name}
			</span>
		`;
		const roleSubtitle = Tag.render`<span class="ai__copilot-menu_role-subtitle">${subtitle}</span>`;
		const roleTextContainer = Tag.render`<div class="ai__copilot-menu_role-right"></div>`;

		if (this.#isBitrixGptV2Available)
		{
			Dom.append(roleSubtitle, roleTextContainer);
			Dom.append(roleTitle, roleTextContainer);
		}
		else
		{
			Dom.append(roleTitle, roleTextContainer);
			Dom.append(roleSubtitle, roleTextContainer);
		}

		this.#roleInfoContainer = Tag.render`
			<div class="ai__copilot-menu_item">
				${glow}
				<div class="${roleClassName}">
					<div class="${roleLeftClassName}">
						<img class="ai__copilot-menu_role-avatar" src="${avatar.small}" alt="">
					</div>
					${roleTextContainer}
				</div>
			</div>
		`;

		return this.#roleInfoContainer;
	}

	#isDefaultRoleAvatar(avatar: { small: string } | null): boolean
	{
		return !avatar?.small || /bitrixgpt-icon/.test(avatar.small);
	}

	// Map of filled icons → outline icons for the isBitrixGptV2Available flag
	static #FILLED_TO_OUTLINE_MAP = {
		'prompts-library': Outline.PROMPT_LIBRARY,
		'cursor-click': Outline.CURSOR_CLICK,
		'quote': Outline.QUOTE,
		'filter-2': Outline.FILTER_2_LINES,
		'pencil-draw': Outline.EDIT_M,
		'magic-wand': Outline.MAGIC_WAND,
		'brightness': Outline.SUN,
		'insert-emoji': Outline.SMILE,
		'idea-lamp': Outline.IDEA_LAMP,
		'bulleted-list': Outline.BULLETED_LIST,
		'list': Outline.BULLETED_LIST,
		'translation': Outline.TRANSLATION,
		'heart': Outline.HEART,
		'suitcase': Outline.SUITCASE,
		'pen': Outline.EDIT_M,
		'gift': Outline.GIFT,
		'distribution': Outline.DISTRIBUTION,
		'notifications-on': Outline.NOTIFICATION,
		'file-2': Outline.FILE,
		'person-plus': Outline.ADD_PERSON,
		'copilot-ai': Outline.BITRIX_GPT,
		'info': Outline.INFO_CIRCLE,
		'feedback': Outline.FEEDBACK,
	};

	#renderAbilityMenuItemIcon(item: CopilotMenuItemAbility): HTMLElement | null
	{
		let iconElem = null;
		if (item.icon)
		{
			try
			{
				let iconCode = item.icon;

				if (this.#isBitrixGptV2Available)
				{
					const outlineCode = CopilotMenu.#FILLED_TO_OUTLINE_MAP[iconCode];
					if (outlineCode !== undefined)
					{
						iconCode = outlineCode;
					}
				}

				const icon = new Icon({
					size: 24,
					icon: iconCode || undefined,
				});

				iconElem = icon.render();
			}
			catch
			{
				iconElem = null;
			}
		}

		return iconElem;
	}

	#getCheckIcon(): Icon
	{
		const checkIconColor = getComputedStyle(document.body).getPropertyValue('--ui-color-link-primary-base');

		return new Icon({
			icon: Main.CHECK,
			size: 18,
			color: checkIconColor,
		});
	}

	#getMenuItemClassname(item: CopilotMenuItemAbility, isSubMenuItem: boolean): string
	{
		let classNames = ['ai__copilot-menu_item'];

		if (isSubMenuItem)
		{
			classNames = [...classNames, '--no-icon'];
		}

		if (item.notHighlight)
		{
			classNames = [...classNames, '--system'];
		}

		if (item.highlightText)
		{
			classNames = [...classNames, '--highlight-text'];
		}

		if (item.selected)
		{
			classNames = [...classNames, '--selected'];
		}

		if (item.isShowFavouriteIconOnHover)
		{
			classNames = [...classNames, '--favourite-icon-on-hover'];
		}

		return classNames.join(' ');
	}

	#handleMenuItemClick(command: CopilotMenuCommand): Function
	{
		return async (event, menuItem: MenuItem) => {
			if (menuItem?.hasSubMenu())
			{
				return;
			}

			menuItem.getMenuWindow()?.getParentMenuItem()?.closeSubMenu();

			if (menuItem.href)
			{
				return;
			}

			this.#showMenuItemLoader(menuItem);

			if (Type.isFunction(command))
			{
				await command(event, menuItem, this);
			}
			else
			{
				await command?.execute();
			}

			this.#destroyMenuItemLoader(menuItem);
		};
	}

	#showMenuItemLoader(menuItem: MenuItem): void
	{
		const loaderSize = 18;
		const loaderColor = getComputedStyle(document.body.querySelector('.ai__copilot-scope')).getPropertyValue('--ai__copilot_color-main');
		const loaderWrapper = Tag.render`<div class="ai__copilot-menu_item-loader"></div>`;
		const menuItemContent = menuItem.getContainer().querySelector('.ai__copilot-menu_item-right');

		Dom.addClass(menuItem.getContainer(), 'menu-popup-item-loading');
		Dom.append(loaderWrapper, menuItemContent);

		const loader = new Loader({
			size: loaderSize,
			target: loaderWrapper,
			color: loaderColor,
		});

		loader.show();
	}

	#destroyMenuItemLoader(menuItem: MenuItem): void
	{
		const loaderWrapper = menuItem.getContainer().querySelector('.ai__copilot-menu_item-loader');

		Dom.removeClass(menuItem.getContainer(), 'menu-popup-item-loading');
		Dom.remove(loaderWrapper);
	}

	#getSectionSeparatorMenuItem(item: CopilotMenuItemDelimiter): MenuItemOptions
	{
		return {
			id: item.code || item.title || '',
			text: item.title,
			title: item.title,
			delimiter: true,
			html: item.title
				? `
					<span>${item.title}</span>
					${(item.isNew && this.#isBitrixGptV2Available === false) ? this.#renderSeparatorMenuItemNewLabel().outerHTML : ''}
				`
				: undefined,
		};
	}

	#renderSeparatorMenuItemNewLabel(): HTMLElement
	{
		return this.#renderSeparatorMenuItemLabel(Loc.getMessage('AI_COPILOT_MENU_ITEM_LABEL_NEW'));
	}

	#renderSeparatorMenuItemLabel(text: string): HTMLElement
	{
		const newLabel = new Label({
			text,
			color: Label.Color.PRIMARY,
			size: Label.Size.SM,
			fill: true,
		});

		return Tag.render`<span class="ai__copilot-menu_delimiter-label">${newLabel.render().outerHTML}</span>`;
	}

	#initRoleInfoFromOptions(roleInfoOption: CopilotMenuItemRoleInfo): void
	{
		if (roleInfoOption)
		{
			this.#roleInfo = roleInfoOption;
			this.#currentRole = new Proxy(roleInfoOption.role, {
				set: (target: Role, p: string, newValue: any): boolean => {
					if (this.#roleInfoContainer && p === 'name')
					{
						const nameContainer = this.#roleInfoContainer.querySelector('.ai__copilot-menu_role-title');

						Dom.attr(nameContainer, 'title', newValue);
						nameContainer.innerText = newValue;
					}

					if (this.#roleInfoContainer && p === 'avatar')
					{
						const avatarImg: HTMLImageElement = this.#roleInfoContainer.querySelector('.ai__copilot-menu_role-avatar');

						avatarImg.src = newValue.small;

						if (this.#isBitrixGptV2Available)
						{
							const roleLeft = this.#roleInfoContainer.querySelector('.ai__copilot-menu_role-left');

							Dom.toggleClass(roleLeft, '--bitrixgpt-default-avatar', this.#isDefaultRoleAvatar(newValue));
						}
					}

					return Reflect.set(target, p, newValue);
				},
			});
		}
	}
}
