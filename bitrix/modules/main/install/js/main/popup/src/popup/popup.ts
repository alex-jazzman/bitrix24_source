/* eslint-disable @bitrix24/bitrix24-rules/no-style, @bitrix24/bitrix24-rules/no-native-dom-methods */

import { Type, Text, Tag, Event, Dom, Reflection } from 'main.core';
import { FocusTrap, FocusNavigator, type FocusTrapOptions, AccessibilitySettings } from 'ui.a11y';
import { EventEmitter, BaseEvent } from 'main.core.events';
import { ZIndexManager, type ZIndexComponent } from 'main.core.z-index-manager';

import { PositionEvent } from './position-event';
import { CloseIconSize } from './popup-close-icon-size';
import { Button } from '../compatibility/button';

import {
	type PopupOptions,
	type PopupLegacyOptions,
	type PopupTarget,
	type PopupTargetOptions,
	type PopupAnimationOptions,
	type PopupOverlay,
	type PopupDraggable,
	type PopupTitleBar,
	type PopupButton,
} from './popup-types';

type TargetPosition = {
	left: number;
	top: number;
	bottom: number;
	width?: number;
	height?: number;
	windowSize?: { innerWidth: number; innerHeight: number };
	windowScroll?: { scrollLeft: number; scrollTop: number };
	popupWidth?: number;
	popupHeight?: number;
};

type PopupAngle = {
	element: HTMLElement;
	position: string;
	offset: number;
	defaultOffset: number;
};

type PopupAngleOptions = {
	offset?: number;
	position?: 'top' | 'bottom' | 'left' | 'right' | 'hide';
};

type PopupDragOptions = {
	cursor: string;
	callback: (offsetX: number, offsetY: number, pageX: number, pageY: number) => void;
	eventName: string;
};

type ResizeContentPos = DOMRect & { offsetX: number; offsetY: number };

const aliases = {
	onPopupWindowInit: { namespace: 'BX.Main.Popup', eventName: 'onInit' },
	onPopupWindowIsInitialized: { namespace: 'BX.Main.Popup', eventName: 'onAfterInit' },
	onPopupFirstShow: { namespace: 'BX.Main.Popup', eventName: 'onFirstShow' },
	onPopupShow: { namespace: 'BX.Main.Popup', eventName: 'onShow' },
	onAfterPopupShow: { namespace: 'BX.Main.Popup', eventName: 'onAfterShow' },
	onPopupClose: { namespace: 'BX.Main.Popup', eventName: 'onClose' },
	onPopupAfterClose: { namespace: 'BX.Main.Popup', eventName: 'onAfterClose' },
	onPopupDestroy: { namespace: 'BX.Main.Popup', eventName: 'onDestroy' },
	onPopupFullscreenLeave: { namespace: 'BX.Main.Popup', eventName: 'onFullscreenLeave' },
	onPopupFullscreenEnter: { namespace: 'BX.Main.Popup', eventName: 'onFullscreenEnter' },
	onPopupDragStart: { namespace: 'BX.Main.Popup', eventName: 'onDragStart' },
	onPopupDrag: { namespace: 'BX.Main.Popup', eventName: 'onDrag' },
	onPopupDragEnd: { namespace: 'BX.Main.Popup', eventName: 'onDragEnd' },
	onPopupResizeStart: { namespace: 'BX.Main.Popup', eventName: 'onResizeStart' },
	onPopupResize: { namespace: 'BX.Main.Popup', eventName: 'onResize' },
	onPopupResizeEnd: { namespace: 'BX.Main.Popup', eventName: 'onResizeEnd' },
};

EventEmitter.registerAliases(aliases);

const disabledScrolls: WeakMap<HTMLElement, Set<Popup>> = new WeakMap();

type ResolvedConstructorOptions = {
	popupId: string;
	bindElement: PopupTarget | undefined;
	params: PopupLegacyOptions;
	compatibleMode: boolean;
};

function resolveConstructorOptions(
	options?: PopupOptions | string | null,
	compatBindElement?: PopupTarget,
	compatParams?: PopupLegacyOptions,
): ResolvedConstructorOptions
{
	let popupId: string | undefined = Type.isString(options) ? options : undefined;
	let bindElement: PopupTarget | undefined = compatBindElement;
	let params: PopupLegacyOptions | undefined = compatParams;
	let compatibleMode = params && Type.isBoolean(params.compatibleMode) ? params.compatibleMode : true;

	if (Type.isPlainObject(options) && !bindElement && !params)
	{
		params = options;
		popupId = options.id;
		bindElement = options.bindElement;
		compatibleMode = false;
	}

	params ||= {};
	if (!Type.isStringFilled(popupId))
	{
		popupId = `popup-window-${Text.getRandom().toLowerCase()}`;
	}

	return { popupId, bindElement, params, compatibleMode };
}

// aria-modal is only valid on these roles
const ariaModalRoles: Set<string> = new Set(['alertdialog', 'dialog', 'window']);

/**
 * @memberof BX.Main
 */
export class Popup extends EventEmitter
{
	private static options: Record<string, string | number> = {};
	declare private static fullscreenStatus: boolean;
	private static defaultOptions: Record<string, number> = {
		// left offset for popup about target
		angleLeftOffset: 40,

		// when popup position is 'top' offset distance between popup body and target node
		positionTopXOffset: -11,

		// offset distance between popup body and target node if use angle, sum with positionTopXOffset
		angleTopOffset: 10,

		popupZindex: 1000,
		popupOverlayZindex: 1100,

		angleMinLeft: 10,
		angleMaxLeft: 30,

		angleMinRight: 10,
		angleMaxRight: 30,

		angleMinBottom: 23,
		angleMaxBottom: 25,

		angleMinTop: 23,
		angleMaxTop: 25,

		offsetLeft: 0,
		offsetTop: 0,
	};

	static setOptions(options: Record<string, string | number>): void
	{
		if (!Type.isPlainObject(options))
		{
			return;
		}

		for (const [option, value] of Object.entries(options))
		{
			this.options[option] = value;
		}
	}

	static getOption(option: string, defaultValue?: string | number | null): string | number | null | undefined
	{
		if (!Type.isUndefined(this.options[option]))
		{
			return this.options[option];
		}

		if (!Type.isUndefined(defaultValue))
		{
			return defaultValue;
		}

		return this.defaultOptions[option];
	}

	#focusTrap: FocusTrap | null = null;

	// `declare` below: the field is assigned unconditionally while constructing, so
	// emitting a slot for it only adds a redundant write to the bundle.
	declare private readonly compatibleMode: boolean;
	declare private params: PopupLegacyOptions;
	declare private uniquePopupId: string;

	declare private buttons: PopupButton[];
	declare private offsetTop: number;
	declare private offsetLeft: number;
	private firstShow: boolean = false;
	private bordersWidth: number = 20;
	private bindElementPos: TargetPosition | null = null;
	declare private bindElement: PopupTarget | { left: number; top: number; bottom: number };
	private closeIcon: HTMLElement | null = null;
	private resizeIcon: HTMLElement | null = null;
	private angle: PopupAngle | null = null;
	private angleArrowElement: HTMLElement | null = null;
	private overlay: { element: HTMLElement | null } | null = null;
	private overlayTimeout: number | null = null;
	private titleBar: HTMLElement | null = null;
	declare private bindOptions: PopupTargetOptions;
	declare private autoHide: boolean;
	declare private disableScroll: boolean;

	declare private autoHideHandler: ((event: MouseEvent) => boolean) | null;
	private isAutoHideBound: boolean = false;
	declare private closeByEsc: boolean;

	private isCloseByEscBound: boolean = false;
	private toFrontOnShow: boolean = true;
	private cacheable: boolean = true;
	private destroyed: boolean = false;
	private fixed: boolean = false;

	private width: number | null = null;
	private height: number | null = null;
	private minWidth: number | null = null;
	private minHeight: number | null = null;
	private maxWidth: number | null = null;
	private maxHeight: number | null = null;

	private padding: number | null = null;
	private contentPadding: number | null = null;
	private background: string | null = null;
	private contentBackground: string | null = null;
	private borderRadius: string | null = null;
	private contentBorderRadius: string | null = null;
	private targetContainer: HTMLElement = document.body;

	private dragOptions: PopupDragOptions = { cursor: '', callback() {}, eventName: '' };
	private dragged: boolean = false;
	private dragPageX: number = 0;
	private dragPageY: number = 0;

	private animationShowClassName: string | null = null;
	private animationCloseClassName: string | null = null;
	private animationCloseEventType: string | null = null;

	declare private designSystemContext: string;
	declare private contentContainer: HTMLElement | null;
	declare private popupContainer: HTMLElement | null;
	declare private zIndexComponent: ZIndexComponent | null;
	private buttonsContainer: HTMLElement | null = null;
	declare private resizeContentPos: ResizeContentPos;
	private resizeContentOffset: number = 0;

	// Overloads have no body; setEventNamespace() is called in the implementation.
	/* eslint-disable @bitrix24/bitrix24-rules/no-eventemitter-without-namespace */

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

	/* eslint-enable @bitrix24/bitrix24-rules/no-eventemitter-without-namespace */

	constructor(
		options?: PopupOptions | string | null,
		compatBindElement?: PopupTarget,
		compatParams?: PopupLegacyOptions,
	)
	{
		super();
		this.setEventNamespace('BX.Main.Popup');

		const { popupId, bindElement, params, compatibleMode } = resolveConstructorOptions(
			options,
			compatBindElement,
			compatParams,
		);
		this.compatibleMode = compatibleMode;
		this.params = params;

		this.emit('onInit', new BaseEvent({ compatData: [popupId, bindElement, params] }));

		this.initializeState(popupId, params);
		this.#bindHandlers();
		this.subscribeFromOptions(params.events || {});
		this.#createLayout(popupId, params);
		this.#applyOptions(bindElement, params);

		this.#initFocusTrap(params.focusTrap);

		this.emit('onAfterInit', new BaseEvent({ compatData: [popupId, this] }));
	}

	private initializeState(popupId: string, params: PopupOptions): void
	{
		this.uniquePopupId = popupId;
		this.buttons = params.buttons && Type.isArray(params.buttons) ? params.buttons as PopupButton[] : [];
		this.offsetTop = Popup.getOption('offsetTop') as number;
		this.offsetLeft = Popup.getOption('offsetLeft') as number;

		this.bindOptions = Type.isObject(params.bindOptions) ? params.bindOptions : {};
		this.autoHide = params.autoHide === true;
		this.disableScroll = params.disableScroll === true || params.isScrollBlock === true;
		this.autoHideHandler = Type.isFunction(params.autoHideHandler) ? params.autoHideHandler : null;
		this.closeByEsc = params.closeByEsc === true;
		this.designSystemContext = params.darkMode ? '--ui-context-content-dark' : '--ui-context-content-light';

		this.setTargetContainer(params.targetContainer);
	}

	#bindHandlers(): void
	{
		this.handleDocumentMouseMove = this.handleDocumentMouseMove.bind(this);
		this.handleDocumentMouseUp = this.handleDocumentMouseUp.bind(this);
		this.handleResizeWindow = this.handleResizeWindow.bind(this);
		this.handleResize = this.handleResize.bind(this);
		this.handleMove = this.handleMove.bind(this);
		this.onTitleMouseDown = this.onTitleMouseDown.bind(this);
		this.handleFullScreen = this.handleFullScreen.bind(this);
	}

	#getPopupClassName(params: PopupOptions): string
	{
		let popupClassName = 'popup-window';
		if (params.titleBar)
		{
			popupClassName += ' popup-window-with-titlebar';
		}

		if (Type.isStringFilled(params.className))
		{
			popupClassName += ` ${params.className}`;
		}

		if (params.darkMode)
		{
			popupClassName += ' popup-window-dark';
		}

		return `${popupClassName} ${this.designSystemContext}`;
	}

	#createCloseIcon(params: PopupOptions): HTMLElement | null
	{
		if (!params.closeIcon)
		{
			return null;
		}

		let className = `popup-window-close-icon${params.titleBar ? ' popup-window-titlebar-close-icon' : ''}`;
		if (
			params.closeIconSize
			&& Object.values(CloseIconSize).includes(params.closeIconSize)
			&& params.closeIconSize !== CloseIconSize.SMALL
		)
		{
			className += ` --${params.closeIconSize}`;
		}

		const closeIcon = Tag.render`
			<button
				tabindex="0"
				type="button"
				aria-label="Close"
				class="${className}"
				onclick="${this.handleCloseIconClick.bind(this)}"
			>
				<span class="ui-icon-set --cross-l --hoverable-default" style="--ui-icon-set__icon-size: 24px;"></span>
			</button>
		`;

		if (Type.isPlainObject(params.closeIcon))
		{
			Dom.style(closeIcon, params.closeIcon as Record<string, string | number>);
		}

		return closeIcon;
	}

	#createLayout(popupId: string, params: PopupOptions): void
	{
		const popupClassName = this.#getPopupClassName(params);
		const titleBarId = `popup-window-titlebar-${popupId}`;
		if (params.titleBar)
		{
			this.titleBar = Tag.render`<div class="popup-window-titlebar" id="${titleBarId}"></div>`;
		}

		this.closeIcon = this.#createCloseIcon(params);

		this.contentContainer = Tag.render`
			<div id="popup-window-content-${popupId}" role="presentation" class="popup-window-content"></div>
		`;

		this.popupContainer = Tag.render`
			<div
				class="${popupClassName}"
				id="${popupId}"
				style="display: none; position: absolute; left: 0; top: 0;"
				tabindex="-1"
				role="${Type.isStringFilled(params.role) ? params.role : 'dialog'}"
			>${[this.titleBar, this.contentContainer, this.closeIcon]}</div>
		`;

		if (Type.isStringFilled(params.ariaLabel))
		{
			Dom.attr(this.popupContainer, 'aria-label', params.ariaLabel);
		}

		if (Type.isStringFilled(params.ariaLabelledBy))
		{
			Dom.attr(this.popupContainer, 'aria-labelledby', params.ariaLabelledBy);
		}

		if (Type.isStringFilled(params.ariaDescribedBy))
		{
			Dom.attr(this.popupContainer, 'aria-describedby', params.ariaDescribedBy);
		}

		this.getTargetContainer().append(this.popupContainer!);
		this.zIndexComponent = ZIndexManager.register(this.popupContainer!, params.zIndexOptions)!;

		if (Type.isStringFilled(params.contentColor))
		{
			this.setContentColor(params.contentColor);
		}

		if (params.angle)
		{
			this.setAngle(params.angle);
		}

		if (params.overlay)
		{
			this.setOverlay(params.overlay);
		}
	}

	#applyOptions(bindElement: PopupTarget | undefined, params: PopupOptions): void
	{
		this.setOffset({ offsetTop: params.offsetTop, offsetLeft: params.offsetLeft });
		this.setBindElement(bindElement);
		this.setTitleBar(params.titleBar);
		this.setDraggable(params.draggable);
		this.setContent(params.content);
		this.setButtons(params.buttons);
		this.setWidth(params.width);
		this.setHeight(params.height);
		this.setMinWidth(params.minWidth);
		this.setMinHeight(params.minHeight);
		this.setMaxWidth(params.maxWidth);
		this.setMaxHeight(params.maxHeight);
		this.setResizeMode(params.resizable);
		this.setPadding(params.padding);
		this.setContentPadding(params.contentPadding);
		this.setBorderRadius(params.borderRadius);
		this.setContentBorderRadius(params.contentBorderRadius);
		this.setBackground(params.background);
		this.setContentBackground(params.contentBackground);
		this.setAnimation(params.animation);
		this.setCacheable(params.cacheable);
		this.setToFrontOnShow(params.toFrontOnShow);
		this.setFixed(params.fixed);
		this.setDesignSystemContext(params.designSystemContext);

		if (params.contentNoPaddings)
		{
			this.setContentPadding(0);
		}

		if (params.noAllPaddings)
		{
			this.setPadding(0);
			this.setContentPadding(0);
		}

		if (params.bindOnResize !== false)
		{
			Event.bind(window, 'resize', this.handleResizeWindow);
		}
	}

	subscribeFromOptions(events: { [eventName: string]: Function }): void
	{
		super.subscribeFromOptions(events, aliases);
	}

	getId(): string
	{
		return this.uniquePopupId;
	}

	isCompatibleMode(): boolean
	{
		return this.compatibleMode;
	}

	setContent(content: string | Element | Node | undefined): void
	{
		if (!this.contentContainer || !content)
		{
			return;
		}

		if (Type.isElementNode(content))
		{
			Dom.clean(this.contentContainer);

			const contentElement = content;
			const hasParent = Type.isDomNode(contentElement.parentNode);
			Dom.append(contentElement, this.contentContainer);
			if (this.isCompatibleMode() || hasParent)
			{
				contentElement.style.display = 'block';
			}
		}
		else if (Type.isString(content))
		{
			this.contentContainer.innerHTML = content;
		}
		else
		{
			this.contentContainer.innerHTML = '&nbsp;';
		}
	}

	setButtons(buttons: PopupButton[] | undefined): void
	{
		this.buttons = buttons && Type.isArray(buttons) ? buttons : [];

		if (this.buttonsContainer)
		{
			Dom.remove(this.buttonsContainer);
		}

		const ButtonClass = Reflection.getClass('BX.UI.Button');
		if (this.buttons.length > 0 && this.contentContainer)
		{
			const newButtons = [];
			for (let i = 0; i < this.buttons.length; i++)
			{
				const button = this.buttons[i];
				if (button instanceof Button)
				{
					button.popupWindow = this;
					newButtons.push(button.render());
				}
				else if (ButtonClass && (button as any) instanceof ButtonClass)
				{
					(button as any).setContext(this);
					newButtons.push((button as any).render());
				}
			}

			this.buttonsContainer = Tag.render`<div class="popup-window-buttons">${newButtons}</div>`;
			this.contentContainer.insertAdjacentElement('afterend', this.buttonsContainer!);
		}
	}

	getButtons(): PopupButton[]
	{
		return this.buttons;
	}

	getButton(id: string): PopupButton | null
	{
		for (let i = 0; i < this.buttons.length; i++)
		{
			const button = this.buttons[i];
			if (button.getId() === id)
			{
				return button;
			}
		}

		return null;
	}

	setBindElement(bindElement: PopupTarget | undefined): void
	{
		if (bindElement === null)
		{
			this.bindElement = null;
		}
		else if (Type.isObject(bindElement))
		{
			if (
				Type.isDomNode(bindElement)
				|| (Type.isNumber((bindElement as { left: number; top: number }).top)
					&& Type.isNumber((bindElement as { left: number; top: number }).left))
			)
			{
				this.bindElement = bindElement as PopupTarget;
			}
			else if (
				Type.isNumber((bindElement as MouseEvent).clientX)
				&& Type.isNumber((bindElement as MouseEvent).clientY)
			)
			{
				this.bindElement = {
					left: (bindElement as MouseEvent).pageX,
					top: (bindElement as MouseEvent).pageY,
					bottom: (bindElement as MouseEvent).pageY,
				};
			}
		}
	}

	private getBindElementPos(bindElement: HTMLElement | any): TargetPosition
	{
		if (Type.isDomNode(bindElement))
		{
			if (this.isTargetDocumentBody())
			{
				return this.isFixed()
					? (bindElement as HTMLElement).getBoundingClientRect()
					: Dom.getPosition(bindElement as HTMLElement);
			}

			return this.getPositionRelativeToTarget(bindElement as HTMLElement);
		}

		if (bindElement && Type.isObject(bindElement))
		{
			const targetPosition = bindElement as TargetPosition;
			if (!Type.isNumber(targetPosition.bottom))
			{
				targetPosition.bottom = targetPosition.top;
			}

			return targetPosition;
		}

		const windowSize = this.getWindowSize();
		const windowScroll = this.getWindowScroll();

		const popupWidth = this.getPopupContainer().offsetWidth;
		const popupHeight = this.getPopupContainer().offsetHeight;

		this.bindOptions.forceTop = true;

		return {
			left: windowSize.innerWidth / 2 - popupWidth / 2 + windowScroll.scrollLeft,
			top: windowSize.innerHeight / 2 - popupHeight / 2 + (this.isFixed() ? 0 : windowScroll.scrollTop),
			bottom: windowSize.innerHeight / 2 - popupHeight / 2 + (this.isFixed() ? 0 : windowScroll.scrollTop),

			// for optimisation purposes
			windowSize,
			windowScroll,
			popupWidth,
			popupHeight,
		};
	}

	/**
	 * @internal
	 */
	getPositionRelativeToTarget(element: HTMLElement): DOMRect
	{
		let offsetLeft = element.offsetLeft;
		let offsetTop = element.offsetTop;
		let offsetElement = element.offsetParent as HTMLElement | null;

		while (offsetElement && offsetElement !== this.getTargetContainer())
		{
			offsetLeft += offsetElement.offsetLeft;
			offsetTop += offsetElement.offsetTop;
			offsetElement = offsetElement.offsetParent as HTMLElement | null;
		}

		const elementRect = element.getBoundingClientRect();

		return new DOMRect(offsetLeft, offsetTop, elementRect.width, elementRect.height);
	}

	// private
	getWindowSize(): { innerWidth: number; innerHeight: number }
	{
		if (this.isTargetDocumentBody())
		{
			return {
				innerWidth: window.innerWidth,
				innerHeight: window.innerHeight,
			};
		}

		return {
			innerWidth: this.getTargetContainer().offsetWidth,
			innerHeight: this.getTargetContainer().offsetHeight,
		};
	}

	// private
	getWindowScroll(): { scrollLeft: number; scrollTop: number }
	{
		if (this.isTargetDocumentBody())
		{
			return {
				scrollLeft: window.pageXOffset,
				scrollTop: window.pageYOffset,
			};
		}

		return {
			scrollLeft: this.getTargetContainer().scrollLeft,
			scrollTop: this.getTargetContainer().scrollTop,
		};
	}

	setAngle(params: PopupAngleOptions | boolean): void
	{
		if (params === false)
		{
			this.removeAngle();

			return;
		}

		const angleOptions = Type.isObject(params) ? params : {};
		if (this.angle === null)
		{
			this.createAngle(angleOptions);
		}

		this.setAnglePosition(angleOptions.position);
		if (Type.isNumber(angleOptions.offset))
		{
			this.setAngleOffset(angleOptions.offset);
		}
	}

	private removeAngle(): void
	{
		if (this.angle !== null)
		{
			Dom.remove(this.angle.element);
		}

		this.angle = null;
		this.angleArrowElement = null;
	}

	private createAngle(params: PopupAngleOptions): void
	{
		const className = 'popup-window-angly';
		const position = this.bindOptions.position === 'top' ? 'bottom' : 'top';
		const angleMinLeft = Popup.getOption(position === 'top' ? 'angleMinTop' : 'angleMinBottom') as number;
		let defaultOffset = Type.isNumber(params.offset) ? params.offset : 0;
		const angleLeftOffset = Popup.getOption('angleLeftOffset', null);

		if (defaultOffset > 0 && Type.isNumber(angleLeftOffset))
		{
			defaultOffset += angleLeftOffset - Popup.defaultOptions.angleLeftOffset;
		}

		this.angleArrowElement = Tag.render`<div class="popup-window-angly--arrow"></div>`;
		if (this.background)
		{
			this.angleArrowElement!.style.background = this.background;
		}

		this.angle = {
			element: Tag.render`
				<div class="${className} ${className}-${position}">
					${this.angleArrowElement}
				</div>
			`,
			position,
			offset: 0,
			defaultOffset: Math.max(defaultOffset, angleMinLeft),
		};

		this.getPopupContainer().appendChild(this.angle.element);
	}

	private setAnglePosition(position?: PopupAngleOptions['position']): void
	{
		if (!position || !['top', 'right', 'bottom', 'left', 'hide'].includes(position))
		{
			return;
		}

		const className = 'popup-window-angly';
		Dom.removeClass(this.angle!.element, `${className}-${this.angle!.position}`);
		Dom.addClass(this.angle!.element, `${className}-${position}`);
		this.angle!.position = position;
	}

	private setAngleOffset(offset: number): void
	{
		switch (this.angle!.position)
		{
			case 'top':
				this.setVerticalAngleOffset(offset, 'angleMinTop', 'angleMaxTop', 'left');
				break;

			case 'bottom':
				this.setVerticalAngleOffset(offset, 'angleMinBottom', 'angleMaxBottom', 'marginLeft');
				break;

			case 'right':
				this.setSideAngleOffset(offset, 'angleMinRight', 'angleMaxRight');
				break;

			case 'left':
				this.setSideAngleOffset(offset, 'angleMinLeft', 'angleMaxLeft');
				break;

			default:
				// No default
		}
	}

	private setVerticalAngleOffset(
		offset: number,
		minOption: string,
		maxOption: string,
		offsetProperty: 'left' | 'marginLeft',
	): void
	{
		this.angle!.offset = this.calculateAngleOffset(
			offset,
			minOption,
			maxOption,
			this.getPopupContainer().offsetWidth,
		);

		const style = this.angle!.element.style;
		style.left = offsetProperty === 'left' ? `${this.angle!.offset}px` : '0px';
		style.marginLeft = offsetProperty === 'marginLeft' ? `${this.angle!.offset}px` : '0px';
		style.removeProperty('top');
	}

	private setSideAngleOffset(offset: number, minOption: string, maxOption: string): void
	{
		this.angle!.offset = this.calculateAngleOffset(
			offset,
			minOption,
			maxOption,
			this.getPopupContainer().offsetHeight,
		);
		this.angle!.element.style.top = `${this.angle!.offset}px`;
		this.angle!.element.style.removeProperty('left');
		this.angle!.element.style.removeProperty('margin-left');
	}

	private calculateAngleOffset(offset: number, minOption: string, maxOption: string, size: number): number
	{
		const minOffset = Popup.getOption(minOption) as number;
		const availableMaxOffset = size - (Popup.getOption(maxOption) as number);
		const maxOffset = availableMaxOffset < minOffset ? Math.max(minOffset, offset) : availableMaxOffset;

		return Math.min(Math.max(minOffset, offset), maxOffset);
	}

	getWidth(): number | null
	{
		return this.width;
	}

	setWidth(width: number | null | false | undefined): void
	{
		this.setWidthProperty('width', width);
	}

	getHeight(): number | null
	{
		return this.height;
	}

	setHeight(height: number | null | false | undefined): void
	{
		this.setHeightProperty('height', height);
	}

	getMinWidth(): number | null
	{
		return this.minWidth;
	}

	setMinWidth(width: number | null | false | undefined): void
	{
		this.setWidthProperty('minWidth', width);
	}

	getMinHeight(): number | null
	{
		return this.minHeight;
	}

	setMinHeight(height: number | null | false | undefined): void
	{
		this.setHeightProperty('minHeight', height);
	}

	getMaxWidth(): number | null
	{
		return this.maxWidth;
	}

	setMaxWidth(width: number | null | false | undefined): void
	{
		this.setWidthProperty('maxWidth', width);
	}

	getMaxHeight(): number | null
	{
		return this.maxHeight;
	}

	setMaxHeight(height: number | null | false | undefined): void
	{
		this.setHeightProperty('maxHeight', height);
	}

	private setWidthProperty(
		property: 'width' | 'minWidth' | 'maxWidth',
		width: number | null | false | undefined,
	): void
	{
		const props = ['width', 'minWidth', 'maxWidth'];
		if (!props.includes(property))
		{
			return;
		}

		if (Type.isNumber(width) && width >= 0)
		{
			this[property] = width;
			this.getResizableContainer().style[property] = `${width}px`;
			this.getContentContainer().style.overflowX = 'auto';
			Dom.addClass(this.getPopupContainer(), 'popup-window-fixed-width');
		}
		else if (width === null || width === false)
		{
			this[property] = null;
			this.getResizableContainer().style.removeProperty(Text.toKebabCase(property));

			const hasOtherProps = props.some((prop) => {
				return this.getResizableContainer().style.getPropertyValue(Text.toKebabCase(prop)) !== '';
			});

			if (!hasOtherProps)
			{
				this.getContentContainer().style.removeProperty('overflow-x');
				Dom.removeClass(this.getPopupContainer(), 'popup-window-fixed-width');
			}
		}
	}

	private setHeightProperty(
		property: 'height' | 'minHeight' | 'maxHeight',
		height: number | null | false | undefined,
	): void
	{
		const props = ['height', 'minHeight', 'maxHeight'];
		if (!props.includes(property))
		{
			return;
		}

		if (Type.isNumber(height) && height >= 0)
		{
			this[property] = height;
			this.getResizableContainer().style[property] = `${height}px`;
			this.getContentContainer().style.overflowY = 'auto';
			Dom.addClass(this.getPopupContainer(), 'popup-window-fixed-height');
		}
		else if (height === null || height === false)
		{
			this[property] = null;
			this.getResizableContainer().style.removeProperty(Text.toKebabCase(property));

			const hasOtherProps = props.some((prop) => {
				return this.getResizableContainer().style.getPropertyValue(Text.toKebabCase(prop)) !== '';
			});

			if (!hasOtherProps)
			{
				this.getContentContainer().style.removeProperty('overflow-y');
				Dom.removeClass(this.getPopupContainer(), 'popup-window-fixed-height');
			}
		}
	}

	setPadding(padding: number | null | undefined): void
	{
		if (Type.isNumber(padding) && padding >= 0)
		{
			this.padding = padding;
			this.getPopupContainer().style.padding = `${padding}px`;
		}
		else if (padding === null)
		{
			this.padding = null;
			this.getPopupContainer().style.removeProperty('padding');
		}
	}

	getPadding(): number | null
	{
		return this.padding;
	}

	setContentPadding(padding: number | null | undefined): void
	{
		if (Type.isNumber(padding) && padding >= 0)
		{
			this.contentPadding = padding;
			this.getContentContainer().style.padding = `${padding}px`;
		}
		else if (padding === null)
		{
			this.contentPadding = null;
			this.getContentContainer().style.removeProperty('padding');
		}
	}

	getContentPadding(): number | null
	{
		return this.contentPadding;
	}

	setBorderRadius(radius: string | null | undefined): void
	{
		if (Type.isStringFilled(radius))
		{
			this.borderRadius = radius;
			this.getPopupContainer().style.setProperty('--popup-window-border-radius', radius);
		}
		else if (radius === null)
		{
			this.borderRadius = null;
			this.getPopupContainer().style.removeProperty('--popup-window-border-radius');
		}
	}

	getBorderRadius(): string | null
	{
		return this.borderRadius;
	}

	setContentBorderRadius(radius: string | null | undefined): void
	{
		if (Type.isStringFilled(radius))
		{
			this.contentBorderRadius = radius;
			this.getContentContainer().style.setProperty('--popup-window-content-border-radius', radius);
		}
		else if (radius === null)
		{
			this.contentBorderRadius = null;
			this.getContentContainer().style.removeProperty('--popup-window-content-border-radius');
		}
	}

	getContentBorderRadius(): string | null
	{
		return this.contentBorderRadius;
	}

	setContentColor(color: string | null): void
	{
		if (Type.isString(color) && this.contentContainer)
		{
			this.contentContainer.style.backgroundColor = color;
		}
		else if (color === null)
		{
			this.contentContainer!.style.removeProperty('background-color');
		}
	}

	setBackground(background: string | null | undefined): void
	{
		if (Type.isStringFilled(background))
		{
			this.background = background;
			this.getPopupContainer().style.background = background;

			if (this.angleArrowElement)
			{
				this.angleArrowElement.style.background = background;
			}
		}
		else if (background === null)
		{
			this.background = null;
			this.getPopupContainer().style.removeProperty('background');

			if (this.angleArrowElement)
			{
				this.angleArrowElement.style.removeProperty('background');
			}
		}
	}

	getBackground(): string | null
	{
		return this.background;
	}

	setContentBackground(background: string | null | undefined): void
	{
		if (Type.isStringFilled(background))
		{
			this.contentBackground = background;
			this.getContentContainer().style.background = background;
		}
		else if (background === null)
		{
			this.contentBackground = null;
			this.getContentContainer().style.removeProperty('background');
		}
	}

	getContentBackground(): string | null
	{
		return this.contentBackground;
	}

	isDestroyed(): boolean
	{
		return this.destroyed;
	}

	setCacheable(cacheable: boolean | undefined): void
	{
		this.cacheable = cacheable !== false;
	}

	isCacheable(): boolean
	{
		return this.cacheable;
	}

	#initFocusTrap(options: boolean | FocusTrapOptions | undefined): void
	{
		if (options === false || (Type.isNil(options) && !Popup.shouldUseFocusTrapByDefault()))
		{
			return;
		}

		const defaultOptions = {
			initialFocus: ['[data-autofocus]', 'container'],
			isolateOutside: this.isModal(),
		};

		const focusTrapOptions: FocusTrapOptions = Type.isPlainObject(options) ? options : {};
		this.#focusTrap = new FocusTrap(this.popupContainer!, { ...defaultOptions, ...focusTrapOptions });

		if (this.isModal())
		{
			Dom.attr(this.overlay!.element, 'data-focus-trap', this.#focusTrap.getId());
		}
	}

	#updateAriaModal(): void
	{
		if (this.popupContainer === null)
		{
			return;
		}

		const role = Dom.attr(this.popupContainer, 'role');
		const roleAllowsAriaModal = Type.isString(role) && ariaModalRoles.has(role);

		Dom.attr(this.popupContainer, 'aria-modal', roleAllowsAriaModal && this.isModal() ? true : null);
	}

	static shouldUseFocusTrapByDefault(): boolean
	{
		if (!AccessibilitySettings.useFocusTrapInDialogs())
		{
			return false;
		}

		const activeElement = FocusNavigator.getActiveElement();
		const nonTextInputTypes = new Set([
			'checkbox',
			'radio',
			'range',
			'color',
			'file',
			'image',
			'button',
			'submit',
			'reset',
		]);

		if (activeElement === null)
		{
			return true;
		}

		const isTextInput = (
			activeElement.tagName === 'TEXTAREA'
			|| (activeElement.tagName === 'INPUT' && !nonTextInputTypes.has((activeElement as HTMLInputElement).type))
			|| activeElement.isContentEditable
		);

		return !isTextInput;
	}

	getFocusTrap(): FocusTrap | null
	{
		return this.#focusTrap;
	}

	setToFrontOnShow(flag: boolean | undefined): void
	{
		this.toFrontOnShow = flag !== false;
	}

	shouldFrontOnShow(): boolean
	{
		return this.toFrontOnShow;
	}

	setFixed(flag: boolean | undefined): void
	{
		if (Type.isBoolean(flag))
		{
			this.fixed = flag;
			if (flag)
			{
				Dom.addClass(this.getPopupContainer(), '--fixed');
			}
			else
			{
				Dom.removeClass(this.getPopupContainer(), '--fixed');
			}
		}
	}

	isFixed(): boolean
	{
		return this.fixed;
	}

	setResizeMode(mode: boolean | { minWidth?: number; minHeight?: number } | undefined): void
	{
		if (mode === true || Type.isPlainObject(mode))
		{
			if (!this.resizeIcon)
			{
				this.resizeIcon = Tag.render`
					<div class="popup-window-resize" onmousedown="${this.handleResizeMouseDown.bind(this)}"></div>
				`;

				this.getPopupContainer().appendChild(this.resizeIcon!);
			}

			// Compatibility
			this.setMinWidth((mode as { minWidth?: number }).minWidth);
			this.setMinHeight((mode as { minHeight?: number }).minHeight);
		}
		else if (mode === false && this.resizeIcon)
		{
			Dom.remove(this.resizeIcon);
			this.resizeIcon = null;
		}
	}

	getDesignSystemContext(): string
	{
		return this.designSystemContext;
	}

	setDesignSystemContext(context: string | undefined): void
	{
		if (Type.isString(context))
		{
			if (this.popupContainer !== null)
			{
				Dom.removeClass(this.popupContainer, this.designSystemContext);
				Dom.addClass(this.popupContainer, context);
			}

			this.designSystemContext = context;
		}
	}

	setTargetContainer(targetContainer: HTMLElement | undefined): void
	{
		const newTargetContainer = Type.isElementNode(targetContainer) ? targetContainer : document.body;
		if (newTargetContainer === this.targetContainer)
		{
			return;
		}

		this.targetContainer = newTargetContainer;
		if (this.getPopupContainer())
		{
			ZIndexManager.unregister(this.getPopupContainer());
			this.getTargetContainer().append(this.getPopupContainer());
			ZIndexManager.register(this.getPopupContainer());
		}

		if (this.overlay)
		{
			Dom.append(this.overlay.element, this.getTargetContainer());
		}
	}

	getTargetContainer(): HTMLElement
	{
		return this.targetContainer;
	}

	isTargetDocumentBody(): boolean
	{
		return this.getTargetContainer() === document.body;
	}

	getPopupContainer(): HTMLElement
	{
		return this.popupContainer!;
	}

	getContentContainer(): HTMLElement
	{
		return this.contentContainer!;
	}

	getResizableContainer(): HTMLElement
	{
		return this.getPopupContainer();
	}

	getTitleContainer(): HTMLElement
	{
		return this.titleBar!;
	}

	private onTitleMouseDown(event: MouseEvent): void
	{
		this.#startDrag(event, {
			cursor: 'move',
			callback: this.handleMove,
			eventName: 'Drag',
		});
	}

	private handleResizeMouseDown(event: MouseEvent): void
	{
		this.#startDrag(event, {
			cursor: 'nwse-resize',
			eventName: 'Resize',
			callback: this.handleResize,
		});

		if (this.isTargetDocumentBody())
		{
			this.resizeContentPos = Dom.getPosition(this.getResizableContainer()) as ResizeContentPos;
			this.resizeContentOffset = this.resizeContentPos.left - Dom.getPosition(this.getPopupContainer()).left;
		}
		else
		{
			this.resizeContentPos = this.getPositionRelativeToTarget(this.getResizableContainer()) as ResizeContentPos;
			this.resizeContentOffset = (
				this.resizeContentPos.left - this.getPositionRelativeToTarget(this.getPopupContainer()).left
			);
		}

		this.resizeContentPos.offsetX = 0;
		this.resizeContentPos.offsetY = 0;
	}

	private handleResize(offsetX: number, offsetY: number, pageX: number, pageY: number): void
	{
		this.resizeContentPos.offsetX += offsetX;
		this.resizeContentPos.offsetY += offsetY;

		let width = this.resizeContentPos.width + this.resizeContentPos.offsetX;
		let height = this.resizeContentPos.height + this.resizeContentPos.offsetY;

		const scrollWidth = this.isTargetDocumentBody()
			? document.documentElement.scrollWidth
			: this.getTargetContainer().scrollWidth;

		if (this.resizeContentPos.left + width + this.resizeContentOffset >= scrollWidth)
		{
			width = scrollWidth - this.resizeContentPos.left - this.resizeContentOffset;
		}

		width = Math.max(width, this.getMinWidth()!);
		height = Math.max(height, this.getMinHeight()!);

		if (this.getMaxWidth() !== null)
		{
			width = Math.min(width, this.getMaxWidth()!);
		}

		if (this.getMaxHeight() !== null)
		{
			height = Math.min(height, this.getMaxHeight()!);
		}

		this.setWidth(width);
		this.setHeight(height);
	}

	isTopAngle(): boolean
	{
		return this.angle !== null && this.angle.position === 'top';
	}

	isBottomAngle(): boolean
	{
		return this.angle !== null && this.angle.position === 'bottom';
	}

	isTopOrBottomAngle(): boolean
	{
		return this.angle !== null && (this.angle.position === 'top' || this.angle.position === 'bottom');
	}

	private getAngleHeight(): number
	{
		return this.isTopOrBottomAngle() ? Popup.getOption('angleTopOffset') as number : 0;
	}

	setOffset(params: { offsetTop?: number; offsetLeft?: number }): void
	{
		if (!Type.isPlainObject(params))
		{
			return;
		}

		if (Type.isNumber(params.offsetLeft))
		{
			this.offsetLeft = params.offsetLeft + (Popup.getOption('offsetLeft') as number);
		}

		if (Type.isNumber(params.offsetTop))
		{
			this.offsetTop = params.offsetTop + (Popup.getOption('offsetTop') as number);
		}
	}

	setTitleBar(params: PopupTitleBar | undefined): void
	{
		if (!this.titleBar)
		{
			return;
		}

		const content = Type.isObject(params) && !Type.isDomNode(params) ? params.content : params;

		if (Type.isDomNode(content))
		{
			this.titleBar.innerHTML = '';
			this.titleBar.appendChild(content);
		}
		else if (Type.isString(content))
		{
			this.titleBar.innerHTML = '';
			this.titleBar.appendChild(
				Dom.create('span', {
					props: {
						id: `popup-window-titlebar-text-${this.getId()}`,
						className: 'popup-window-titlebar-text',
					},
					text: content,
				}),
			);

			if (!Type.isStringFilled(Dom.attr(this.getPopupContainer(), 'aria-label')))
			{
				Dom.attr(this.getPopupContainer(), 'aria-label', content);
			}
		}
	}

	setDraggable(draggable: PopupDraggable | boolean | undefined): void
	{
		this.params.draggable = draggable;
		const element = Type.isObject(draggable) && draggable.element ? draggable.element : this.titleBar;
		if (!draggable || !element)
		{
			return;
		}

		Dom.style(element, 'cursor', 'move');
		Event.bind(element, 'mousedown', this.onTitleMouseDown);
	}

	setClosingByEsc(enable: boolean): void
	{
		const shouldEnable = Type.isBoolean(enable) ? enable : true;
		if (shouldEnable)
		{
			this.closeByEsc = true;
			this.bindClosingByEsc();
		}
		else
		{
			this.closeByEsc = false;
			this.unbindClosingByEsc();
		}
	}

	private bindClosingByEsc(): void
	{
		if (this.closeByEsc && !this.isCloseByEscBound)
		{
			Event.bind(this.targetContainer.ownerDocument, 'keyup', this.handleDocumentKeyUp, true);
			this.isCloseByEscBound = true;
		}
	}

	private unbindClosingByEsc(): void
	{
		if (this.isCloseByEscBound)
		{
			Event.unbind(this.targetContainer.ownerDocument, 'keyup', this.handleDocumentKeyUp, true);
			this.isCloseByEscBound = false;
		}
	}

	setAutoHide(enable: boolean): void
	{
		const shouldEnable = Type.isBoolean(enable) ? enable : true;
		if (shouldEnable)
		{
			this.autoHide = true;
			this.bindAutoHide();
		}
		else
		{
			this.autoHide = false;
			this.unbindAutoHide();
		}
	}

	private bindAutoHide(): void
	{
		if (this.autoHide && !this.isAutoHideBound && this.isShown())
		{
			this.isAutoHideBound = true;

			if (this.isCompatibleMode())
			{
				Event.bind(this.getPopupContainer(), 'click', this.handleContainerClick);
			}

			if (!this.hasOverlay())
			{
				Event.bind(this.targetContainer.ownerDocument, 'click', this.handleAutoHide, !this.isCompatibleMode());
			}
		}
	}

	private unbindAutoHide(): void
	{
		if (this.isAutoHideBound)
		{
			this.isAutoHideBound = false;

			if (this.isCompatibleMode())
			{
				Event.unbind(this.getPopupContainer(), 'click', this.handleContainerClick);
			}

			if (!this.hasOverlay())
			{
				const doc = this.targetContainer.ownerDocument;
				Event.unbind(doc, 'click', this.handleAutoHide, !this.isCompatibleMode());
			}
		}
	}

	/* eslint-disable no-underscore-dangle -- Public legacy hook replaced by CRM consumers. */
	/* eslint-disable @bitrix24/bitrix24-rules/no-pseudo-private -- Public legacy hook. */
	private handleAutoHide = (event: MouseEvent): void => {
		if (this.isDestroyed())
		{
			return;
		}

		if (this.autoHideHandler !== null)
		{
			if (this.autoHideHandler(event))
			{
				this._tryCloseByEvent(event);
			}
		}
		else if (event.target !== this.getPopupContainer() && !this.getPopupContainer().contains(event.target as Node))
		{
			this._tryCloseByEvent(event);
		}
	};

	/** CRM consumers replace it at runtime. */
	private _tryCloseByEvent(event: MouseEvent): void
	{
		if (this.isCompatibleMode())
		{
			this.tryCloseByEvent(event);
		}
		else
		{
			setTimeout(() => {
				this.tryCloseByEvent(event);
			}, 0);
		}
	}
	/* eslint-enable no-underscore-dangle */
	/* eslint-enable @bitrix24/bitrix24-rules/no-pseudo-private */

	private tryCloseByEvent(event: MouseEvent): void
	{
		if (event.button === 0)
		{
			this.close();
		}
	}

	private handleOverlayClick(event: MouseEvent): void
	{
		if (this.autoHide)
		{
			this.tryCloseByEvent(event);
			event.stopPropagation();
		}
	}

	setOverlay(params: PopupOverlay | boolean | undefined): void
	{
		if (this.overlay === null)
		{
			this.unbindAutoHide();

			this.overlay = {
				element: Tag.render`
					<div
						class="popup-window-overlay"
						id="popup-window-overlay-${this.getId()}"
						onclick="${this.handleOverlayClick.bind(this)}"
						aria-hidden="true"
					></div>
				`,
			};

			this.resizeOverlay();

			Dom.append(this.overlay.element, this.getTargetContainer());
			this.getZIndexComponent().setOverlay(this.overlay.element!);

			if (this.#focusTrap !== null)
			{
				Dom.attr(this.overlay.element, 'data-focus-trap', this.#focusTrap.getId());
			}

			this.#updateAriaModal();
		}

		if (Type.isObject(params) && Type.isNumber(params.opacity) && params.opacity >= 0 && params.opacity <= 100)
		{
			const opacity = (params.opacity / 100).toPrecision(3);
			Dom.style(this.overlay.element, 'opacity', opacity);
		}

		if (Type.isObject(params) && params.backgroundColor)
		{
			Dom.style(this.overlay.element, 'background-color', params.backgroundColor);
		}

		if (Type.isObject(params) && params.blur)
		{
			Dom.style(this.overlay.element, 'backdrop-filter', params.blur);
		}
	}

	isModal(): boolean
	{
		return this.hasOverlay();
	}

	hasOverlay(): boolean
	{
		return this.overlay !== null && this.overlay.element !== null;
	}

	removeOverlay(): void
	{
		if (this.overlay !== null && this.overlay.element !== null)
		{
			Dom.remove(this.overlay.element);
			this.getZIndexComponent().setOverlay(null as unknown as HTMLElement);
		}

		if (this.overlayTimeout)
		{
			clearInterval(this.overlayTimeout);
			this.overlayTimeout = null;
		}

		this.overlay = null;

		this.#updateAriaModal();
	}

	hideOverlay(): void
	{
		if (this.overlay !== null && this.overlay.element !== null)
		{
			if (this.overlayTimeout)
			{
				clearInterval(this.overlayTimeout);
				this.overlayTimeout = null;
			}

			this.overlay.element.style.display = 'none';
		}
	}

	showOverlay(): void
	{
		if (this.overlay !== null && this.overlay.element !== null)
		{
			this.overlay.element.style.display = 'block';

			let popupHeight = this.getPopupContainer().offsetHeight;
			this.overlayTimeout = setInterval(() => {
				if (popupHeight !== this.getPopupContainer().offsetHeight)
				{
					this.resizeOverlay();
					popupHeight = this.getPopupContainer().offsetHeight;
				}
			}, 1000);
		}
	}

	resizeOverlay(): void
	{
		if (this.overlay !== null && this.overlay.element !== null)
		{
			let scrollWidth = 0;
			let scrollHeight = 0;
			if (this.isTargetDocumentBody())
			{
				scrollWidth = document.documentElement.scrollWidth;
				scrollHeight = Math.max(
					document.body.scrollHeight,
					document.documentElement.scrollHeight,
					document.body.offsetHeight,
					document.documentElement.offsetHeight,
					document.body.clientHeight,
					document.documentElement.clientHeight,
				);
			}
			else
			{
				scrollWidth = this.getTargetContainer().scrollWidth;
				scrollHeight = this.getTargetContainer().scrollHeight;
			}

			this.overlay.element.style.width = `${scrollWidth}px`;
			this.overlay.element.style.height = `${scrollHeight}px`;
		}
	}

	getZindex(): number
	{
		return this.getZIndexComponent().getZIndex();
	}

	getZIndexComponent(): ZIndexComponent
	{
		return this.zIndexComponent!;
	}

	setDisableScroll(flag: boolean): void
	{
		const disable = Type.isBoolean(flag) ? flag : true;
		if (disable)
		{
			this.disableScroll = true;
			this.#disableTargetScroll();
		}
		else
		{
			this.disableScroll = false;
			this.#enableTargetScroll();
		}
	}

	#disableTargetScroll(): void
	{
		const target = this.getTargetContainer();
		let popups: Set<Popup> | undefined = disabledScrolls.get(target);
		if (!popups)
		{
			popups = new Set();
			disabledScrolls.set(target, popups);
		}

		popups.add(this);

		Dom.addClass(target, 'popup-window-disable-scroll');
	}

	#enableTargetScroll(): void
	{
		const target = this.getTargetContainer();
		const popups: Set<Popup> | null = disabledScrolls.get(target) || null;
		if (popups)
		{
			popups.delete(this);
		}

		if (popups === null || popups.size === 0)
		{
			Dom.removeClass(target, 'popup-window-disable-scroll');
		}
	}

	show(): void
	{
		if (this.isShown() || this.isDestroyed())
		{
			return;
		}

		this.emit('onBeforeShow');

		this.showOverlay();
		this.getPopupContainer().style.display = 'block';
		Dom.addClass(this.getPopupContainer(), '--open');

		this.#focusTrap?.captureActiveElement();

		if (this.shouldFrontOnShow())
		{
			this.bringToFront();
		}

		if (!this.firstShow)
		{
			this.emit('onFirstShow', new BaseEvent({ compatData: [this] }));
			this.firstShow = true;
		}

		this.emit('onShow', new BaseEvent({ compatData: [this] }));

		if (this.disableScroll)
		{
			this.#disableTargetScroll();
		}

		this.adjustPosition();

		this.animateOpening(() => {
			if (this.isDestroyed())
			{
				return;
			}

			Dom.removeClass(this.getPopupContainer(), this.animationShowClassName as string);
			this.emit('onAfterShow', new BaseEvent({ compatData: [this] }));

			this.#focusTrap?.activate();
		});

		this.bindClosingByEsc();

		if (this.isCompatibleMode())
		{
			setTimeout(() => {
				this.bindAutoHide();
			}, 100);
		}
		else
		{
			this.bindAutoHide();
		}
	}

	close(): void
	{
		if (this.isDestroyed() || !this.isShown())
		{
			return;
		}

		this.emit('onClose', new BaseEvent({ compatData: [this] }));

		if (this.isDestroyed())
		{
			return;
		}

		if (this.disableScroll)
		{
			this.#enableTargetScroll();
		}

		this.#focusTrap?.deactivate();

		this.animateClosing(() => {
			if (this.isDestroyed())
			{
				return;
			}

			this.hideOverlay();

			this.getPopupContainer().style.display = 'none';
			Dom.removeClass(this.getPopupContainer(), '--open');
			Dom.removeClass(this.getPopupContainer(), this.animationCloseClassName as string);

			this.unbindClosingByEsc();

			if (this.isCompatibleMode())
			{
				setTimeout(() => {
					this.unbindAutoHide();
				}, 0);
			}
			else
			{
				this.unbindAutoHide();
			}

			this.emit('onAfterClose', new BaseEvent({ compatData: [this] }));

			if (!this.isCacheable())
			{
				this.destroy();
			}
		});
	}

	bringToFront(): void
	{
		if (this.isShown())
		{
			ZIndexManager.bringToFront(this.getPopupContainer());
		}
	}

	toggle(): void
	{
		if (this.isShown())
		{
			this.close();
		}
		else
		{
			this.show();
		}
	}

	private bindAnimationEnd(className: string, callback: () => void): void
	{
		const eventName = `${this.animationCloseEventType}end`;
		const popupContainer = this.getPopupContainer();
		const handleTransitionEnd = (event: globalThis.Event): void => {
			if (!Dom.hasClass(event.target, className))
			{
				return;
			}

			Event.unbind(popupContainer, eventName, handleTransitionEnd);
			callback();
		};
		Event.bind(popupContainer, eventName, handleTransitionEnd);
	}

	private animateOpening(callback: () => void): void
	{
		Dom.removeClass(this.getPopupContainer(), this.animationCloseClassName as string);

		if (this.animationShowClassName === null)
		{
			callback();
		}
		else
		{
			Dom.addClass(this.getPopupContainer(), this.animationShowClassName);

			if (this.animationCloseEventType === null)
			{
				callback();
			}
			else
			{
				this.bindAnimationEnd(this.animationShowClassName, callback);
			}
		}
	}

	private animateClosing(callback: () => void): void
	{
		Dom.removeClass(this.getPopupContainer(), this.animationShowClassName as string);

		if (this.animationCloseClassName === null)
		{
			callback();
		}
		else
		{
			Dom.addClass(this.getPopupContainer(), this.animationCloseClassName);

			if (this.animationCloseEventType === null)
			{
				callback();
			}
			else
			{
				this.bindAnimationEnd(this.animationCloseClassName, callback);
			}
		}
	}

	setAnimation(options: PopupAnimationOptions | undefined): void
	{
		if (Type.isPlainObject(options))
		{
			this.animationShowClassName = Type.isStringFilled(options.showClassName) ? options.showClassName : null;
			this.animationCloseClassName = Type.isStringFilled(options.closeClassName) ? options.closeClassName : null;
			this.animationCloseEventType = (
				options.closeAnimationType === 'animation' || options.closeAnimationType === 'transition'
					? options.closeAnimationType
					: null
			);
		}
		else if (Type.isStringFilled(options))
		{
			const animationName = options;
			switch (animationName)
			{
				case 'fading':
					this.animationShowClassName = 'popup-window-show-animation-opacity';
					this.animationCloseClassName = 'popup-window-close-animation-opacity';
					this.animationCloseEventType = 'animation';
					break;

				case 'fading-slide':
					this.animationShowClassName = 'popup-window-show-animation-opacity-transform';
					this.animationCloseClassName = 'popup-window-close-animation-opacity';
					this.animationCloseEventType = 'animation';
					break;

				case 'scale':
					this.animationShowClassName = 'popup-window-show-animation-scale';
					this.animationCloseClassName = 'popup-window-close-animation-opacity';
					this.animationCloseEventType = 'animation';
					break;

				default:
					break;
			}
		}
		else if (options === false || options === null)
		{
			this.animationShowClassName = null;
			this.animationCloseClassName = null;
			this.animationCloseEventType = null;
		}
	}

	isShown(): boolean
	{
		return !this.isDestroyed() && this.getPopupContainer()?.style.display === 'block';
	}

	destroy(): void
	{
		if (this.destroyed)
		{
			return;
		}

		if (this.disableScroll)
		{
			this.#enableTargetScroll();
		}

		this.destroyed = true;

		this.emit('onDestroy', new BaseEvent({ compatData: [this] }));

		this.unbindClosingByEsc();

		if (this.isCompatibleMode())
		{
			setTimeout(() => {
				this.unbindAutoHide();
			}, 0);
		}
		else
		{
			this.unbindAutoHide();
		}

		Event.unbindAll(this);
		Event.unbind(document, 'mousemove', this.handleDocumentMouseMove);
		Event.unbind(document, 'mouseup', this.handleDocumentMouseUp);
		Event.unbind(window, 'resize', this.handleResizeWindow);

		this.removeOverlay();

		ZIndexManager.unregister(this.popupContainer!);
		this.zIndexComponent = null;

		this.#focusTrap?.destroy();
		this.#focusTrap = null;

		Dom.remove(this.popupContainer);

		this.popupContainer = null;
		this.contentContainer = null;
		this.closeIcon = null;
		this.titleBar = null;
		this.buttonsContainer = null;
		this.angle = null;
		this.angleArrowElement = null;
		this.resizeIcon = null;
	}

	adjustPosition(bindOptions?: PopupTargetOptions): void
	{
		if (bindOptions && Type.isObject(bindOptions))
		{
			this.bindOptions = bindOptions;
		}

		const bindElementPos = this.getBindElementPos(this.bindElement);
		if (this.hasUnchangedBindPosition(bindElementPos))
		{
			return;
		}

		this.updateBindElementPosition(bindElementPos);

		const windowSize = bindElementPos.windowSize ?? this.getWindowSize();
		const windowScroll = bindElementPos.windowScroll ?? this.getWindowScroll();
		const popupWidth = bindElementPos.popupWidth ?? this.popupContainer!.offsetWidth;
		const popupHeight = bindElementPos.popupHeight ?? this.popupContainer!.offsetHeight;
		const left = this.calculatePopupLeft(popupWidth, windowSize, windowScroll);
		const top = this.calculatePopupTop(popupHeight, windowSize, windowScroll);

		const event = new PositionEvent();
		event.left = left;
		event.top = top;

		this.emit('onBeforeAdjustPosition', event);

		Dom.adjust(this.popupContainer!, {
			style: {
				top: `${event.top}px`,
				left: `${event.left}px`,
			},
		});
	}

	private hasUnchangedBindPosition(bindElementPos: TargetPosition): boolean
	{
		return !this.bindOptions.forceBindPosition
			&& this.bindElementPos !== null
			&& bindElementPos.top === this.bindElementPos.top
			&& bindElementPos.left === this.bindElementPos.left;
	}

	private updateBindElementPosition(bindElementPos: TargetPosition): void
	{
		const bindElementVanished = bindElementPos.top === 0
			&& bindElementPos.left === 0
			&& bindElementPos.width === 0
			&& bindElementPos.height === 0;

		if (!bindElementVanished || this.bindElementPos === null)
		{
			this.bindElementPos = bindElementPos;
		}
	}

	private calculatePopupLeft(
		popupWidth: number,
		windowSize: { innerWidth: number; innerHeight: number },
		windowScroll: { scrollLeft: number; scrollTop: number },
	): number
	{
		let left = this.bindElementPos!.left + this.offsetLeft
			- (this.isTopOrBottomAngle() ? Popup.getOption('angleLeftOffset') as number : 0);

		if (
			!this.bindOptions.forceLeft
			&& left + popupWidth + this.bordersWidth >= windowSize.innerWidth + windowScroll.scrollLeft
			&& windowSize.innerWidth + windowScroll.scrollLeft - popupWidth - this.bordersWidth > 0
		)
		{
			const bindLeft = left;
			left = windowSize.innerWidth + windowScroll.scrollLeft - popupWidth - this.bordersWidth;
			if (this.isTopOrBottomAngle())
			{
				this.setAngle({ offset: bindLeft - left + this.angle!.defaultOffset });
			}
		}
		else if (this.isTopOrBottomAngle())
		{
			this.setAngle({ offset: this.angle!.defaultOffset + (left < 0 ? left : 0) });
		}

		if (left < 0)
		{
			left = 0;
		}

		return left;
	}

	private calculatePopupTop(
		popupHeight: number,
		windowSize: { innerWidth: number; innerHeight: number },
		windowScroll: { scrollLeft: number; scrollTop: number },
	): number
	{
		const angleTopOffset = Popup.getOption('angleTopOffset') as number;

		if (this.bindOptions.position === 'top')
		{
			return this.calculatePopupTopFromAbove(popupHeight, windowScroll, angleTopOffset);
		}

		return this.calculatePopupTopFromBelow(popupHeight, windowSize, windowScroll, angleTopOffset);
	}

	private calculatePopupTopFromAbove(
		popupHeight: number,
		windowScroll: { scrollLeft: number; scrollTop: number },
		angleTopOffset: number,
	): number
	{
		let top = this.bindElementPos!.top
			- popupHeight
			- this.offsetTop
			- (this.isBottomAngle() ? angleTopOffset : 0);

		if (top < 0 || (!this.bindOptions.forceTop && top < windowScroll.scrollTop))
		{
			top = this.bindElementPos!.bottom + this.offsetTop;
			if (this.angle !== null)
			{
				top += angleTopOffset;
				this.setAngle({ position: 'top' });
			}
		}
		else if (this.isTopAngle())
		{
			top = top - angleTopOffset + (Popup.getOption('positionTopXOffset') as number);
			this.setAngle({ position: 'bottom' });
		}
		else
		{
			top += Popup.getOption('positionTopXOffset') as number;
		}

		return top < 0 ? 0 : top;
	}

	private calculatePopupTopFromBelow(
		popupHeight: number,
		windowSize: { innerWidth: number; innerHeight: number },
		windowScroll: { scrollLeft: number; scrollTop: number },
		angleTopOffset: number,
	): number
	{
		let top = this.bindElementPos!.bottom + this.offsetTop + this.getAngleHeight();

		if (
			!this.bindOptions.forceTop
			&& top + popupHeight > windowSize.innerHeight + windowScroll.scrollTop
			// Can we place the PopupWindow above the bindElement?
			&& this.bindElementPos!.top - popupHeight - this.getAngleHeight() >= 0
		)
		{
			// The PopupWindow doesn't place below the bindElement. We should place it above.
			top = this.bindElementPos!.top - popupHeight;

			if (this.isTopOrBottomAngle())
			{
				top -= angleTopOffset;
				this.setAngle({ position: 'bottom' });
			}

			top += Popup.getOption('positionTopXOffset') as number;
		}
		else if (this.isBottomAngle())
		{
			top += angleTopOffset;
			this.setAngle({ position: 'top' });
		}

		return top < 0 ? 0 : top;
	}

	enterFullScreen(): void
	{
		if (Popup.fullscreenStatus)
		{
			if ((document as any).cancelFullScreen)
			{
				(document as any).cancelFullScreen();
			}
			else if ((document as any).mozCancelFullScreen)
			{
				(document as any).mozCancelFullScreen();
			}
			else if ((document as any).webkitCancelFullScreen)
			{
				(document as any).webkitCancelFullScreen();
			}
		}
		else if ((this.contentContainer as any).requestFullScreen)
		{
			(this.contentContainer as any).requestFullScreen();
			Event.bind(window, 'fullscreenchange', this.handleFullScreen);
		}
		else if ((this.contentContainer as any).mozRequestFullScreen)
		{
			(this.contentContainer as any).mozRequestFullScreen();
			Event.bind(window, 'mozfullscreenchange', this.handleFullScreen);
		}
		else if ((this.contentContainer as any).webkitRequestFullScreen)
		{
			(this.contentContainer as any).webkitRequestFullScreen();
			Event.bind(window, 'webkitfullscreenchange', this.handleFullScreen);
		}
		else
		{
			console.error('fullscreen mode is not supported');
		}
	}

	private handleFullScreen(): void
	{
		if (Popup.fullscreenStatus)
		{
			Event.unbind(window, 'fullscreenchange', this.handleFullScreen);
			Event.unbind(window, 'webkitfullscreenchange', this.handleFullScreen);
			Event.unbind(window, 'mozfullscreenchange', this.handleFullScreen);

			Popup.fullscreenStatus = false;

			if (!this.isDestroyed())
			{
				Dom.removeClass(this.contentContainer, 'popup-window-fullscreen');
				this.emit('onFullscreenLeave');
				this.adjustPosition();
			}
		}
		else
		{
			Popup.fullscreenStatus = true;

			if (!this.isDestroyed())
			{
				Dom.addClass(this.contentContainer, 'popup-window-fullscreen');
				this.emit('onFullscreenEnter');
				this.adjustPosition();
			}
		}
	}

	private handleCloseIconClick(event: MouseEvent): void
	{
		this.tryCloseByEvent(event);
		event.stopPropagation();
	}

	private handleContainerClick(event: MouseEvent): void
	{
		event.stopPropagation();
	}

	private handleDocumentKeyUp = (event: KeyboardEvent): void => {
		if (event.keyCode === 27 && !this.isDestroyed())
		{
			checkEscPressed(this.getZindex(), () => {
				this.close();
			});
		}
	};

	private handleResizeWindow(): void
	{
		if (this.isShown())
		{
			this.adjustPosition();
			if (this.overlay !== null)
			{
				this.resizeOverlay();
			}
		}
	}

	private handleMove(offsetX: number, offsetY: number, pageX: number, pageY: number): void
	{
		let left = parseInt(this.popupContainer!.style.left, 10) + offsetX;
		let top = parseInt(this.popupContainer!.style.top, 10) + offsetY;

		if (Type.isObject(this.params.draggable) && (this.params.draggable as PopupDraggable).restrict)
		{
			// Left side
			if (left < 0)
			{
				left = 0;
			}

			let scrollWidth = 0;
			let scrollHeight = 0;
			if (this.isTargetDocumentBody())
			{
				scrollWidth = document.documentElement.scrollWidth;
				scrollHeight = document.documentElement.scrollHeight;
			}
			else
			{
				scrollWidth = this.getTargetContainer().scrollWidth;
				scrollHeight = this.getTargetContainer().scrollHeight;
			}

			// Right side
			const floatWidth = this.popupContainer!.offsetWidth;
			const floatHeight = this.popupContainer!.offsetHeight;

			if (left > scrollWidth - floatWidth)
			{
				left = scrollWidth - floatWidth;
			}

			if (top > scrollHeight - floatHeight)
			{
				top = scrollHeight - floatHeight;
			}

			// Top side
			if (top < 0)
			{
				top = 0;
			}
		}

		this.popupContainer!.style.left = `${left}px`;
		this.popupContainer!.style.top = `${top}px`;
	}

	#startDrag(event: MouseEvent, options: Partial<PopupDragOptions>): void
	{
		const dragOptions = options || {};
		if (Type.isStringFilled(dragOptions.cursor))
		{
			this.dragOptions.cursor = dragOptions.cursor;
		}

		if (Type.isStringFilled(dragOptions.eventName))
		{
			this.dragOptions.eventName = dragOptions.eventName;
		}

		if (Type.isFunction(dragOptions.callback))
		{
			this.dragOptions.callback = dragOptions.callback;
		}

		this.dragPageX = event.pageX;
		this.dragPageY = event.pageY;
		this.dragged = false;

		Event.bind(document, 'mousemove', this.handleDocumentMouseMove);
		Event.bind(document, 'mouseup', this.handleDocumentMouseUp);

		if ((document.body as any).setCapture)
		{
			(document.body as any).setCapture();
		}

		document.body.ondrag = () => false;
		document.body.onselectstart = () => false;
		document.body.style.cursor = this.dragOptions.cursor;
		(document.body.style as any).MozUserSelect = 'none';
		(this.popupContainer!.style as any).MozUserSelect = 'none';

		if (this.shouldFrontOnShow())
		{
			this.bringToFront();
		}

		event.preventDefault();
	}

	private handleDocumentMouseMove(event: MouseEvent): void
	{
		if (this.dragPageX === event.pageX && this.dragPageY === event.pageY)
		{
			return;
		}

		this.dragOptions.callback(event.pageX - this.dragPageX, event.pageY - this.dragPageY, event.pageX, event.pageY);

		this.dragPageX = event.pageX;
		this.dragPageY = event.pageY;

		if (!this.dragged)
		{
			this.emit(`on${this.dragOptions.eventName}Start`, new BaseEvent({ compatData: [this] }));
			this.dragged = true;
		}

		this.emit(`on${this.dragOptions.eventName}`, new BaseEvent({ compatData: [this] }));
	}

	private handleDocumentMouseUp(event: MouseEvent): void
	{
		if ((document.body as any).releaseCapture)
		{
			(document.body as any).releaseCapture();
		}

		Event.unbind(document, 'mousemove', this.handleDocumentMouseMove);
		Event.unbind(document, 'mouseup', this.handleDocumentMouseUp);

		document.body.ondrag = null;
		document.body.onselectstart = null;
		document.body.style.cursor = '';
		(document.body.style as any).MozUserSelect = '';
		(this.popupContainer!.style as any).MozUserSelect = '';

		this.emit(`on${this.dragOptions.eventName}End`, new BaseEvent({ compatData: [this] }));
		this.dragged = false;

		event.preventDefault();
	}
}

let escCallbackIndex = -1;
let escCallback: Array<() => void> | null = null;

function checkEscPressed(zIndex: number | false, callback?: () => void): void
{
	if (zIndex === false)
	{
		if (escCallback && escCallback.length > 0)
		{
			for (const callbackItem of escCallback)
			{
				callbackItem();
			}

			escCallback = null;
			escCallbackIndex = -1;
		}
	}
	else
	{
		if (escCallback === null)
		{
			escCallback = [];
			escCallbackIndex = -1;
			setTimeout(() => {
				checkEscPressed(false);
			}, 10);
		}

		if (zIndex > escCallbackIndex)
		{
			escCallbackIndex = zIndex;
			escCallback = [callback!];
		}
		else if (zIndex === escCallbackIndex)
		{
			escCallback!.push(callback!);
		}
	}
}
