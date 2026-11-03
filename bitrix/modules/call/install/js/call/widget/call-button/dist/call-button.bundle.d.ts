/* eslint-disable */
type LimitHintContent = {
	text: string;
	popupOptions: {
		bindOptions: {
			position: string;
		};
		angle: {
			position: string;
		};
		targetContainer: HTMLElement;
		offsetLeft: number;
		offsetTop: number;
	};
};

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
	closeIconSize?: (typeof BX.Call.Widget.CloseIconSize)[keyof typeof BX.Call.Widget.CloseIconSize];
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

type PopupButton = BX.Call.Widget.Button | BX.UI.Button;

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

declare namespace BX.Call.Widget {
	const CallButton: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
		dialog: {
			type: BX.Vue3.PropType<BX.Messenger.v2.Model.ImModelChat>;
			required: true;
		};
		compactMode: {
			type: BooleanConstructor;
			default: boolean;
		};
	}>, {}, {
		lastCallType: string;
		isMenuOpen: boolean;
		copilotMinUserLimit: number;
		isCopilotActive: boolean;
		isMarketSubscriptionActive: boolean;
		isTariffAvailable: boolean;
		showPromo: boolean;
		showPromoTimer: ReturnType<typeof setTimeout> | null;
		promoId: string;
		callMenu: CallMenu | null;
	}, {
		dialogId(): string;
		chatId(): number;
		userCount(): number;
		isConference(): boolean;
		callButtonText(): string;
		hasActiveCurrentCall(): boolean;
		hasActiveAnotherCall(): boolean;
		isActive(): boolean;
		userLimit(): number;
		isChatUserLimitExceeded(): boolean;
		shouldShowMenu(): boolean;
		limitHintText(): string;
		limitHintId(): string;
		hintContent(): LimitHintContent | null;
		isCopilotCall(): boolean;
		isAirDesignEnabled(): boolean;
		callButtonContainerClasses(): string[];
		canShowPromo(): boolean;
	}, {
		startVideoCall(): void;
		subscribeToMenuEvents(): void;
		onShowCallView(): void;
		onButtonClick(): void;
		onMenuClick(): void;
		onStartConferenceClick(): void;
		getLastCallChoice(): string;
		saveLastCallChoice(callTypeId: string): void;
		getCallMenu(): CallMenu;
		loc(phraseCode: string, replacements?: {
			[p: string]: string;
		}): string;
		onClosePromo(): void;
		clearShowPromoTimer(): void;
	}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
		dialog: {
			type: BX.Vue3.PropType<BX.Messenger.v2.Model.ImModelChat>;
			required: true;
		};
		compactMode: {
			type: BooleanConstructor;
			default: boolean;
		};
	}>> & Readonly<{}>, {
		compactMode: boolean;
	}, {}, {
		CallButtonTitle: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
			text: {
				type: StringConstructor;
				required: true;
			};
			compactMode: {
				type: BooleanConstructor;
				default: boolean;
			};
			copilotMode: {
				type: BooleanConstructor;
				default: boolean;
			};
			showIcon: {
				type: BooleanConstructor;
				default: boolean;
			};
		}>, {}, {}, {
			callButtonIconClasses(): string[];
		}, {}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
			text: {
				type: StringConstructor;
				required: true;
			};
			compactMode: {
				type: BooleanConstructor;
				default: boolean;
			};
			copilotMode: {
				type: BooleanConstructor;
				default: boolean;
			};
			showIcon: {
				type: BooleanConstructor;
				default: boolean;
			};
		}>> & Readonly<{}>, {
			compactMode: boolean;
			copilotMode: boolean;
			showIcon: boolean;
		}, {}, {}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
		CallButtonPromo: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
			bindElement: {
				type: BX.Vue3.PropType<HTMLElement>;
				required: true;
			};
		}>, {}, {
			isAIConsentAccepted: boolean;
		}, {
			getId(): "call-ai-user-list-popup";
			config(): {
				width: number;
				padding: number;
				overlay: boolean;
				autoHide: boolean;
				closeByEsc: boolean;
				angle: {
					offset: number;
					position: string;
				};
				closeIcon: boolean;
				bindElement: HTMLElement;
				offsetTop: number;
			};
			callButtonPromoText(): string;
		}, {
			loc(phraseCode: string, replacements?: {
				[p: string]: string;
			}): string;
		}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, "close"[], "close", BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
			bindElement: {
				type: BX.Vue3.PropType<HTMLElement>;
				required: true;
			};
		}>> & Readonly<{
			onClose?: ((...args: any[]) => any) | undefined;
		}>, {}, {}, {
			CallPopupContainer: {
				name: string;
				props: {
					id: {
						type: StringConstructor;
						required: boolean;
					};
					config: {
						type: ObjectConstructor;
						required: boolean;
						default(): {};
					};
				};
				emits: string[];
				data(): import("main.core").JsonObject;
				computed: {
					popupContainer(): string;
				};
				created(): void;
				mounted(): void;
				beforeUnmount(): void;
				methods: {
					getPopupInstance(): BX.Call.Widget.Popup;
					getDefaultConfig(): any;
					getPopupConfig(): Object;
					closePopup(): void;
					enableAutoHide(): void;
					disableAutoHide(): void;
					adjustPosition(): void;
				};
				template: string;
			};
		}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
		PulseAnimation: BX.Vue3.DefineComponent<BX.Vue3.ExtractPropTypes<{
			showPulse: {
				type: BooleanConstructor;
				default: boolean;
			};
			isConference: {
				type: BooleanConstructor;
				default: boolean;
			};
		}>, {}, {}, {
			rings(): number[];
		}, {}, BX.Vue3.ComponentOptionsMixin, BX.Vue3.ComponentOptionsMixin, {}, string, BX.Vue3.PublicProps, Readonly<BX.Vue3.ExtractPropTypes<{
			showPulse: {
				type: BooleanConstructor;
				default: boolean;
			};
			isConference: {
				type: BooleanConstructor;
				default: boolean;
			};
		}>> & Readonly<{}>, {
			showPulse: boolean;
			isConference: boolean;
		}, {}, {}, {}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;
	}, {
		hint: {
			mounted(element: HTMLElement, { value }: {
				value: import("ui.vue3.directives.hint").HintParams | Function;
			}): void;
			updated(element: HTMLElement, { value }: {
				value: import("ui.vue3.directives.hint").HintParams | Function;
			}): void;
			beforeUnmount(element: HTMLElement): void;
		};
	}, string, BX.Vue3.ComponentProvideOptions, true, {}, any>;

	class CallMenu extends BX.Messenger.v2.Lib.BaseMenu {
		context: BX.Messenger.v2.Model.ImModelChat;
		static events: {
			onMenuItemClick: string;
			close: string;
		};
		constructor();
		getMenuOptions(): BX.UI.System.MenuOptions;
		getMenuClassName(): string;
		getMenuItems(): BX.UI.System.MenuItemOptions[];
		getMenuGroups(): BX.UI.System.MenuSectionOptions[];
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
}
