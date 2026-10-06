/* eslint-disable */
type PopupOptions = {
	id?: string;
	bindElement?: PopupTarget;
	bindOptions?: PopupTargetOptions;
	offsetTop?: number;
	offsetLeft?: number;
	content?: string | Element | Node;
	closeByEsc?: boolean;
	buttons?: PopupButton[];
	className?: string;
	width?: number;
	height?: number;
	minWidth?: number;
	minHeight?: number;
	maxWidth?: number;
	maxHeight?: number;
	resizable?: boolean;
	padding?: number;
	contentPadding?: number;
	borderRadius?: string;
	contentBorderRadius?: string;
	background?: string;
	cacheable?: boolean;
	contentBackground?: string;
	animation?: PopupAnimationOptions;
	closeIcon?: boolean | Record<string, string | number>;
	closeIconSize?: (typeof BX.Main.CloseIconSize)[keyof typeof BX.Main.CloseIconSize];
	autoHide?: boolean;
	autoHideHandler?: (event: MouseEvent) => boolean;
	zIndexOptions?: BX.ZIndexComponentOptions;
	toFrontOnShow?: boolean;
	events?: {
		[eventName: string]: (event: BX.Event.BaseEvent) => void;
	};
	titleBar?: PopupTitleBar;
	angle?: boolean | {
		offset: number;
		position?: 'top' | 'bottom' | 'left' | 'right';
	};
	overlay?: boolean | PopupOverlay;
	contentColor?: string;
	draggable?: boolean | PopupDraggable;
	darkMode?: boolean;
	fixed?: boolean;
	designSystemContext?: string;
	compatibleMode?: boolean;
	bindOnResize?: boolean;
	targetContainer?: HTMLElement;
	disableScroll?: boolean;
	isScrollBlock?: boolean;
	focusTrap?: boolean | BX.UI.Accessibility.FocusTrapOptions;
	ariaLabel?: string;
	ariaLabelledBy?: string;
	ariaDescribedBy?: string;
	role?: string;
	noAllPaddings?: boolean;
	contentNoPaddings?: boolean;
};

type PopupTarget = Element | {
	left: number;
	top: number;
} | null | MouseEvent;

type PopupTargetOptions = {
	forceBindPosition?: boolean;
	forceLeft?: boolean;
	forceTop?: boolean;
	position?: 'top' | 'bottom';
};

type PopupButton = BX.Main.Button | BX.UI.Button;

type ButtonOptions = {
	id?: string;
	text?: string;
	className?: string;
	events?: ButtonEvents;
};

type ButtonEvents = {
	[event: string]: (event: Event) => void;
};

type PopupAnimationOptions = string | boolean | {
	showClassName?: string;
	closeClassName?: string;
	closeAnimationType: string | null | undefined;
};

type PopupTitleBar = string | Node | {
	content: string | Node;
};

type PopupOverlay = {
	backgroundColor?: string;
	opacity?: number;
	blur?: string;
};

type PopupDraggable = {
	restrict?: boolean;
	element?: HTMLElement;
};

type PopupLegacyOptions = PopupOptions & Record<string, unknown>;

type PopupAngleOptions = {
	offset?: number;
	position?: 'top' | 'bottom' | 'left' | 'right' | 'hide';
};

type MenuOptions = PopupOptions & {
	items?: MenuItemOptions[];
	subMenuOptions?: PopupOptions;
	navigationOptions?: MenuNavigationOptions;
	menuShowDelay?: number;
};

type MenuItemOptions = {
	id?: string;
	text?: string;
	html?: string | HTMLElement;
	title?: string;
	disabled?: boolean;
	focusable?: boolean;
	href?: string;
	target?: string;
	className?: string;
	attrs?: {
		[key: string]: string;
	};
	delimiter?: boolean;
	menuShowDelay?: number;
	subMenuOffsetX?: number;
	events?: {
		[event: string]: (event: Event) => void;
	};
	dataset?: {
		[key: string]: string;
	};
	onclick?: MenuItemOnClick | string;
	cacheable?: boolean;
	items?: MenuItemOptions[];
};

type MenuItemOnClick = (event: MouseEvent, item: BX.Main.MenuItem) => unknown;

type MenuNavigationOptions = {
	onTab?: (event: KeyboardEvent) => void;
	initialFocusPosition?: 'first' | 'last';
};

type MenuLegacyOptions = MenuOptions & Record<string, unknown>;

type MenuLayout = {
	menuContainer: HTMLElement | null;
	itemsContainer: HTMLElement | null;
};

declare namespace BX.Main {
	/**
	 * @memberof BX.Main
	 */
	class Popup extends BX.Event.EventEmitter {
		private static options;
		private static fullscreenStatus;
		private static defaultOptions;
		static setOptions(options: Record<string, string | number>): void;
		static getOption(option: string, defaultValue?: string | number | null): string | number | null | undefined;
		private readonly compatibleMode;
		private params;
		private uniquePopupId;
		private buttons;
		private offsetTop;
		private offsetLeft;
		private firstShow;
		private bordersWidth;
		private bindElementPos;
		private bindElement;
		private closeIcon;
		private resizeIcon;
		private angle;
		private angleArrowElement;
		private overlay;
		private overlayTimeout;
		private titleBar;
		private bindOptions;
		private autoHide;
		private disableScroll;
		private autoHideHandler;
		private isAutoHideBound;
		private closeByEsc;
		private isCloseByEscBound;
		private toFrontOnShow;
		private cacheable;
		private destroyed;
		private fixed;
		private width;
		private height;
		private minWidth;
		private minHeight;
		private maxWidth;
		private maxHeight;
		private padding;
		private contentPadding;
		private background;
		private contentBackground;
		private borderRadius;
		private contentBorderRadius;
		private targetContainer;
		private dragOptions;
		private dragged;
		private dragPageX;
		private dragPageY;
		private animationShowClassName;
		private animationCloseClassName;
		private animationCloseEventType;
		private designSystemContext;
		private contentContainer;
		private popupContainer;
		private zIndexComponent;
		private buttonsContainer;
		private resizeContentPos;
		private resizeContentOffset;
		/**
		 * Modern signature: a single options object.
		 */
		constructor(options?: PopupOptions);
		/**
		 * Legacy positional signature `(id, bindElement, params)`. Kept for backward
		 * compatibility: enables compatible mode unless `params.compatibleMode === false`.
		 * `params` is an extensible options bag and may carry legacy keys that are not
		 * part of {@link PopupOptions}.
		 */
		constructor(id: string | null, bindElement?: PopupTarget, params?: PopupLegacyOptions);
		private initializeState;
		subscribeFromOptions(events: {
			[eventName: string]: Function;
		}): void;
		getId(): string;
		isCompatibleMode(): boolean;
		setContent(content: string | Element | Node | undefined): void;
		setButtons(buttons: PopupButton[] | undefined): void;
		getButtons(): PopupButton[];
		getButton(id: string): PopupButton | null;
		setBindElement(bindElement: PopupTarget | undefined): void;
		private getBindElementPos;
		/**
		 * @internal
		 */
		getPositionRelativeToTarget(element: HTMLElement): DOMRect;
		getWindowSize(): {
			innerWidth: number;
			innerHeight: number;
		};
		getWindowScroll(): {
			scrollLeft: number;
			scrollTop: number;
		};
		setAngle(params: PopupAngleOptions | boolean): void;
		private removeAngle;
		private createAngle;
		private setAnglePosition;
		private setAngleOffset;
		private setVerticalAngleOffset;
		private setSideAngleOffset;
		private calculateAngleOffset;
		getWidth(): number | null;
		setWidth(width: number | null | false | undefined): void;
		getHeight(): number | null;
		setHeight(height: number | null | false | undefined): void;
		getMinWidth(): number | null;
		setMinWidth(width: number | null | false | undefined): void;
		getMinHeight(): number | null;
		setMinHeight(height: number | null | false | undefined): void;
		getMaxWidth(): number | null;
		setMaxWidth(width: number | null | false | undefined): void;
		getMaxHeight(): number | null;
		setMaxHeight(height: number | null | false | undefined): void;
		private setWidthProperty;
		private setHeightProperty;
		setPadding(padding: number | null | undefined): void;
		getPadding(): number | null;
		setContentPadding(padding: number | null | undefined): void;
		getContentPadding(): number | null;
		setBorderRadius(radius: string | null | undefined): void;
		getBorderRadius(): string | null;
		setContentBorderRadius(radius: string | null | undefined): void;
		getContentBorderRadius(): string | null;
		setContentColor(color: string | null): void;
		setBackground(background: string | null | undefined): void;
		getBackground(): string | null;
		setContentBackground(background: string | null | undefined): void;
		getContentBackground(): string | null;
		isDestroyed(): boolean;
		setCacheable(cacheable: boolean | undefined): void;
		isCacheable(): boolean;
		static shouldUseFocusTrapByDefault(): boolean;
		getFocusTrap(): BX.UI.Accessibility.FocusTrap | null;
		setToFrontOnShow(flag: boolean | undefined): void;
		shouldFrontOnShow(): boolean;
		setFixed(flag: boolean | undefined): void;
		isFixed(): boolean;
		setResizeMode(mode: boolean | {
			minWidth?: number;
			minHeight?: number;
		} | undefined): void;
		getDesignSystemContext(): string;
		setDesignSystemContext(context: string | undefined): void;
		setTargetContainer(targetContainer: HTMLElement | undefined): void;
		getTargetContainer(): HTMLElement;
		isTargetDocumentBody(): boolean;
		getPopupContainer(): HTMLElement;
		getContentContainer(): HTMLElement;
		getResizableContainer(): HTMLElement;
		getTitleContainer(): HTMLElement;
		private onTitleMouseDown;
		private handleResizeMouseDown;
		private handleResize;
		isTopAngle(): boolean;
		isBottomAngle(): boolean;
		isTopOrBottomAngle(): boolean;
		private getAngleHeight;
		setOffset(params: {
			offsetTop?: number;
			offsetLeft?: number;
		}): void;
		setTitleBar(params: PopupTitleBar | undefined): void;
		setDraggable(draggable: PopupDraggable | boolean | undefined): void;
		setClosingByEsc(enable: boolean): void;
		private bindClosingByEsc;
		private unbindClosingByEsc;
		setAutoHide(enable: boolean): void;
		private bindAutoHide;
		private unbindAutoHide;
		private handleAutoHide;
		/** CRM consumers replace it at runtime. */
		private _tryCloseByEvent;
		private tryCloseByEvent;
		private handleOverlayClick;
		setOverlay(params: PopupOverlay | boolean | undefined): void;
		isModal(): boolean;
		hasOverlay(): boolean;
		removeOverlay(): void;
		hideOverlay(): void;
		showOverlay(): void;
		resizeOverlay(): void;
		getZindex(): number;
		getZIndexComponent(): BX.ZIndexComponent;
		setDisableScroll(flag: boolean): void;
		show(): void;
		close(): void;
		bringToFront(): void;
		toggle(): void;
		private bindAnimationEnd;
		private animateOpening;
		private animateClosing;
		setAnimation(options: PopupAnimationOptions | undefined): void;
		isShown(): boolean;
		destroy(): void;
		adjustPosition(bindOptions?: PopupTargetOptions): void;
		private hasUnchangedBindPosition;
		private updateBindElementPosition;
		private calculatePopupLeft;
		private calculatePopupTop;
		private calculatePopupTopFromAbove;
		private calculatePopupTopFromBelow;
		enterFullScreen(): void;
		private handleFullScreen;
		private handleCloseIconClick;
		private handleContainerClick;
		private handleDocumentKeyUp;
		private handleResizeWindow;
		private handleMove;
		private handleDocumentMouseMove;
		private handleDocumentMouseUp;
	}

	/**
	 * @memberOf BX.Main.Popup
	 * @deprecated use BX.UI.Button
	 */
	class Button {
		popupWindow: Popup | null;
		params: ButtonOptions;
		text: string;
		id: string;
		className: string;
		events: ButtonEvents;
		contextEvents: ButtonEvents;
		buttonNode: HTMLElement;
		constructor(params: ButtonOptions);
		render(): Element;
		getId(): string;
		getContainer(): Element;
		getName(): string;
		setName(name: string): void;
		setClassName(className: string): void;
		addClassName(className: string): void;
		removeClassName(className: string): void;
	}

	/**
	 * @namespace {BX.Main.Popup}
	 */
	const CloseIconSize: Readonly<{
		LARGE: "large";
		SMALL: "small";
	}>;

	/**
	 * @memberof BX.Main
	 */
	class Menu extends BX.Event.EventEmitter {
		private id;
		private bindElement;
		private menuItems;
		private itemsContainer;
		private params;
		private parentMenuWindow;
		private parentMenuItem;
		private layout;
		private popupWindow;
		/**
		 * Modern signature: a single options object.
		 */
		constructor(options?: MenuOptions);
		/**
		 * Legacy positional signature `(id, bindElement, items, params)`. Kept for
		 * backward compatibility. `params` is an extensible options bag and may carry
		 * legacy keys that are not part of {@link MenuOptions}.
		 */
		constructor(id: string | null, bindElement?: PopupTarget, menuItems?: MenuItemOptions[], params?: MenuLegacyOptions);
		getPopupWindow(): Popup;
		show(): void;
		close(): void;
		destroy(): void;
		toggle(): void;
		isShown(): boolean;
		getId(): string;
		getParams(): MenuLegacyOptions;
		getLayout(): MenuLayout;
		getNavigation(): MenuNavigation;
		getFocusTrap(): BX.UI.Accessibility.FocusTrap | null;
		setLastInputModality(modality: BX.UI.Accessibility.InputModality | null): void;
		getLastInputModal(): BX.UI.Accessibility.InputModality | null;
		shouldIgnoreMouseEnter(): boolean;
		private containsTarget;
		setParentMenuWindow(parentMenu: Menu): void;
		getParentMenuWindow(): Menu | null;
		isRootMenu(): boolean;
		getRootMenuWindow(): Menu | null;
		setParentMenuItem(parentItem: MenuItem): void;
		getParentMenuItem(): MenuItem | null;
		addMenuItem(menuItemJson: any, targetItemId: string | null): MenuItem | null;
		private addMenuItemInternal;
		removeMenuItem(itemId: string, options?: {
			destroyEmptyPopup: boolean;
		}): void;
		getMenuItem(itemId: string | null): MenuItem | null;
		getMenuItems(): MenuItem[];
		getMenuItemPosition(itemId: string | null): number;
		getMenuContainer(): HTMLElement;
		getFocusedItem(): MenuItem | null;
		clearFocus(): void;
	}

	class MenuItem extends BX.Event.EventEmitter {
		private options;
		private readonly id;
		private text;
		private allowHtml;
		private title;
		private delimiter;
		private href;
		private target;
		private dataset;
		private className;
		private menuShowDelay;
		private subMenuOffsetX;
		private disabled;
		private cacheable;
		private focusable;
		private attrs;
		private onclick;
		private menuWindow;
		private subMenuWindow;
		private layout;
		private events;
		private items;
		private focused;
		private subMenuTimeout;
		private popupPadding;
		constructor(itemOptions: MenuItemOptions);
		getLayout(): {
			item: HTMLElement;
			text: HTMLElement;
		};
		getContainer(): HTMLElement;
		removeLayout(): void;
		getTextContainer(): HTMLElement;
		getText(): string | HTMLElement;
		getTextContent(): string;
		setText(text: string | HTMLElement, allowHtml?: boolean): void;
		hasSubMenu(): boolean;
		showSubMenu(trigger?: BX.UI.Accessibility.InputModality | null): void;
		addSubMenu(items: MenuItemOptions[]): Menu | null;
		closeSubMenu(trigger?: BX.UI.Accessibility.InputModality | null): void;
		closeSiblings(trigger?: BX.UI.Accessibility.InputModality | null): void;
		closeChildren(trigger?: BX.UI.Accessibility.InputModality | null): void;
		destroySubMenu(): void;
		destroyChildren(): void;
		adjustSubMenu(): void;
		getBoundingClientRect(): DOMRect;
		getPopupPadding(): number;
		getSubMenu(): Menu | null;
		getId(): string;
		setMenuWindow(menu: Menu): void;
		getMenuWindow(): Menu | null;
		getMenuShowDelay(): number;
		enable(): void;
		disable(): void;
		isDisabled(): boolean;
		isFocusable(): boolean;
		setCacheable(cacheable: boolean): void;
		isCacheable(): boolean;
		isDelimiter(): boolean;
		focus(focusVisible?: boolean): void;
		blur(): void;
		isFocused(): boolean;
		private onItemClick;
	}

	class MenuNavigation {
		constructor(menu: Menu, options?: MenuNavigationOptions);
		getMenu(): Menu;
		enable(): void;
		disable(): void;
		isEnabled(): boolean;
		bindEvents(): void;
		unbindEvents(): void;
		setInitialFocusPosition(focusPosition: 'first' | 'last' | undefined): void;
		focusByText(text: string): MenuItem | null;
		focusNext(looped?: boolean): MenuItem | null;
		focusPrevious(looped?: boolean): MenuItem | null;
		focusFirst(): MenuItem | null;
		focusLast(): MenuItem | null;
		getItems(): MenuItem[];
		getMenuItemPosition(itemId: string): number;
	}

	class PopupManager {
		/** @deprecated Use getPopups(). Public for legacy consumers. */
		private static _popups;
		/** @deprecated Use getCurrentPopup(). Public for legacy consumers. */
		private static _currentPopup;
		constructor();
		static create(options?: PopupOptions): Popup;
		static create(id: string | null, bindElement?: PopupTarget, params?: PopupLegacyOptions): Popup;
		static handleOnAfterInit: (event: BX.Event.BaseEvent) => void;
		static getCurrentPopup(): Popup | null;
		static isPopupExists(id: string): boolean;
		static isAnyPopupShown(): boolean;
		static getPopupById(id: string): Popup | null;
		static getMaxZIndex(): number;
		static getPopups(): Popup[];
	}

	class MenuManager {
		private static Data;
		private static currentItem;
		constructor();
		static show(options?: MenuOptions): void;
		static show(id: string | null, bindElement?: PopupTarget, menuItems?: MenuItemOptions[], params?: MenuLegacyOptions): void;
		/**
		 * Modern signature: a single options object.
		 */
		static create(options?: MenuOptions): Menu;
		/**
		 * Legacy positional signature `(id, bindElement, items, params)`. Kept for
		 * backward compatibility. `params` is an extensible options bag and may carry
		 * legacy keys that are not part of {@link MenuOptions}.
		 */
		static create(id: string | null, bindElement?: PopupTarget, menuItems?: MenuItemOptions[], params?: MenuLegacyOptions): Menu;
		private static resolveMenuId;
		static getCurrentMenu(): Menu | null;
		static getMenuById(id: string): Menu | null;
		static getMenus(): Menu[];
		/**
		 * compatibility
		 */
		private static onPopupDestroy;
		static destroy(id: string): void;
	}

	class PositionEvent extends BX.Event.BaseEvent {
		get left(): number;
		set left(value: number);
		get top(): number;
		set top(value: number);
	}

	/**
	 * @deprecated use Popup class instead: import { Popup } from 'main.popup'
	 */
	class PopupWindow extends Popup {
	}

	/**
	 * @deprecated use Menu class instead: import { Menu } from 'main.popup'
	 */
	class PopupMenuWindow extends Menu {
	}

	/**
	 * @deprecated use Menu.Item class instead: import { MenuItem } from 'main.popup'
	 */
	class PopupMenuItem extends MenuItem {
	}

	/**
	 * @deprecated use BX.UI.Button
	 */
	class PopupWindowButton extends Button {
	}

	/**
	 * @deprecated use BX.UI.Button
	 */
	class PopupWindowButtonLink extends ButtonLink {
	}

	/**
	 * @deprecated use BX.UI.Button
	 */
	class ButtonLink extends Button {
		constructor(params: ButtonOptions);
	}

	/**
	 * @deprecated use BX.UI.Button
	 */
	class PopupWindowCustomButton extends CustomButton {
	}

	/**
	 * @deprecated use BX.UI.Button
	 */
	class CustomButton extends Button {
		constructor(params: ButtonOptions);
	}
}
