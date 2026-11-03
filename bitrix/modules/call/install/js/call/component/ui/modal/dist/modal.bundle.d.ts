/* eslint-disable */
type CallModalOptions = Record<string, unknown>;

type PopupOptions = {
	id?: string;
	bindElement?: PopupTarget;
	bindOptions?: PopupTargetOptions;
	offsetTop?: number;
	offsetLeft?: number;
	content?: string | Element | Node;
	closeByEsc?: boolean;
	blockBackgroundEsc?: boolean;
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
	closeIconSize?: (typeof BX.Call.Component.UI.CloseIconSize)[keyof typeof BX.Call.Component.UI.CloseIconSize];
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

type PopupButton = BX.Call.Component.UI.Button | BX.UI.Button;

type PopupLegacyOptions = PopupOptions & Record<string, unknown>;

type PopupAngleOptions = {
	offset?: number;
	position?: 'top' | 'bottom' | 'left' | 'right' | 'hide';
};

type PopupTitleBar = string | Node | {
	content: string | Node;
};

type PopupDraggable = {
	restrict?: boolean;
	element?: HTMLElement;
};

type PopupOverlay = {
	backgroundColor?: string;
	opacity?: number;
	blur?: string;
};

type PopupAnimationOptions = string | boolean | {
	showClassName?: string;
	closeClassName?: string;
	closeAnimationType: string | null | undefined;
};

type ButtonOptions = {
	id?: string;
	text?: string;
	className?: string;
	events?: ButtonEvents;
};

type ButtonEvents = {
	[event: string]: (event: Event) => void;
};

declare namespace BX.Call.Component.UI {
	const CallModal: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
		id: {
			type: StringConstructor;
			default: () => string;
		};
		visible: {
			type: BooleanConstructor;
			default: boolean;
		};
		title: {
			type: StringConstructor;
			default: null;
		};
		width: {
			type: NumberConstructor;
			default: number;
		};
		maxWidth: {
			type: NumberConstructor;
			default: number;
		};
		closeByEsc: {
			type: BooleanConstructor;
			default: boolean;
		};
		closable: {
			type: BooleanConstructor;
			default: boolean;
		};
		dismissableMask: {
			type: BooleanConstructor;
			default: boolean;
		};
		targetContainer: {
			type: (StringConstructor | {
				new (): HTMLElement;
				prototype: HTMLElement;
			})[];
			default: null;
		};
		className: {
			type: StringConstructor;
			default: null;
		};
		options: {
			type: ObjectConstructor;
			default: null;
		};
	}>, {}, {
		internalVisible: boolean;
	}, {
		popupOptions(): CallModalOptions;
	}, {
		show(): void;
		hide(): void;
		toggle(): void;
		close(): void;
		setVisible(value: boolean): void;
		onClose(): void;
	}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, ("close" | "update:visible")[], "close" | "update:visible", BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
		id: {
			type: StringConstructor;
			default: () => string;
		};
		visible: {
			type: BooleanConstructor;
			default: boolean;
		};
		title: {
			type: StringConstructor;
			default: null;
		};
		width: {
			type: NumberConstructor;
			default: number;
		};
		maxWidth: {
			type: NumberConstructor;
			default: number;
		};
		closeByEsc: {
			type: BooleanConstructor;
			default: boolean;
		};
		closable: {
			type: BooleanConstructor;
			default: boolean;
		};
		dismissableMask: {
			type: BooleanConstructor;
			default: boolean;
		};
		targetContainer: {
			type: (StringConstructor | {
				new (): HTMLElement;
				prototype: HTMLElement;
			})[];
			default: null;
		};
		className: {
			type: StringConstructor;
			default: null;
		};
		options: {
			type: ObjectConstructor;
			default: null;
		};
	}>> & Readonly<{
		onClose?: ((...args: any[]) => any) | undefined;
		"onUpdate:visible"?: ((...args: any[]) => any) | undefined;
	}>, {
		className: string;
		title: string;
		id: string;
		options: Record<string, any>;
		width: number;
		visible: boolean;
		maxWidth: number;
		closeByEsc: boolean;
		targetContainer: string | HTMLElement;
		closable: boolean;
		dismissableMask: boolean;
	}, {}, {
		UiPopup: {
			props: {
				id: {
					type: StringConstructor;
					default: () => string;
				};
				options: {
					type: PopupOptions;
					default: null;
				};
			};
			emits: string[];
			computed: {
				popupContainer(): string;
				container(): HTMLElement;
				popupOptions(): PopupOptions;
				defaultOptions(): PopupOptions;
			};
			created(): void;
			beforeMount(): void;
			mounted(): void;
			beforeUnmount(): void;
			unmounted(): void;
			methods: {
				contains(element: HTMLElement): boolean;
				adjustPosition(): void;
				freeze(): void;
				unfreeze(): void;
				getPopupInstance(): BX.Call.Component.UI.Popup;
				autoHideHandler({ target }: {
					target: any;
				}): boolean;
				closePopup(): void;
			};
			template: string;
		};
		CallIcon: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
			icon: {
				type: StringConstructor;
				required: true;
				validator: (value: string) => boolean;
			};
			color: {
				type: StringConstructor;
				default: string;
				validator: (value: string) => boolean;
			};
			size: {
				type: NumberConstructor;
				default: number;
				validator: (value: number) => boolean;
			};
		}>, {}, {}, {
			additionalClasses(): string[];
			additionalStyles(): Record<string, string>;
		}, {}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
			icon: {
				type: StringConstructor;
				required: true;
				validator: (value: string) => boolean;
			};
			color: {
				type: StringConstructor;
				default: string;
				validator: (value: string) => boolean;
			};
			size: {
				type: NumberConstructor;
				default: number;
				validator: (value: number) => boolean;
			};
		}>> & Readonly<{}>, {
			size: number;
			color: string;
		}, {}, {}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
	}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;

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
		private blockBackgroundEsc;
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
		shouldBlockBackgroundEsc(): boolean;
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
	 * @namespace {BX.Main.Popup}
	 */
	const CloseIconSize: Readonly<{
		LARGE: "large";
		SMALL: "small";
	}>;
}
