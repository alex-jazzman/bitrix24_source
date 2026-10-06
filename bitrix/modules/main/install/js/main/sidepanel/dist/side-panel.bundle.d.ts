/* eslint-disable */
type SliderOptions = {
	contentCallback?: Function;
	width?: number;
	title?: string;
	cacheable?: boolean;
	autoFocus?: boolean;
	printable?: boolean;
	allowCrossOrigin?: boolean;
	allowChangeHistory?: boolean;
	allowChangeTitle?: boolean;
	hideControls?: boolean;
	requestMethod?: 'get' | 'post';
	requestParams?: BX.JsonObject;
	skeleton?: string;
	loader?: string | HTMLElement;
	contentClassName?: string;
	containerClassName?: string;
	overlayClassName?: string;
	overlayOpacity?: number;
	overlayBgColor?: string;
	overlayBgCallback?: (state: {
		opacity: number;
		progress: number;
		intensity: number;
	}) => string;
	typeLoader?: string;
	data?: BX.JsonObject;
	minimizeOptions?: MinimizeOptions;
	hideToolbarOnOpen?: boolean;
	animationDuration?: number;
	startPosition?: 'right' | 'bottom' | 'top';
	customLeftBoundary?: number;
	customRightBoundary?: number;
	customTopBoundary?: number;
	outerBoundary?: OuterBoundary;
	autoOffset?: boolean;
	label?: {
		text?: string;
		color?: string;
		bgColor?: string;
		opacity?: number;
	};
	newWindowLabel?: boolean;
	newWindowUrl?: string;
	copyLinkLabel?: boolean;
	minimizeLabel?: boolean;
	designSystemContext?: string;
	events?: SliderEvents | SliderEvents[];
	useGlobalOptions?: boolean;
	focusTrap?: boolean | BX.UI.Accessibility.FocusTrapOptions;
	ariaLabel?: string;
	ariaLabelledBy?: string;
	targetContainer?: string | HTMLElement;
};

type MinimizeOptions = {
	entityType: string;
	entityId: string | number;
	entityName: string;
	url: string;
};

type OuterBoundary = {
	right?: number;
	top?: number;
	bottom?: number;
};

type SliderEvents = {
	[eventName: string]: (event: BX.SidePanel.SliderEvent) => void;
};

type LabelOptions = {
	bgColor?: string | [string, number];
	color?: string;
	text?: string;
	className?: string;
	iconClass?: string;
	iconTitle?: string;
	hidden?: boolean;
	visible?: boolean;
	testId?: string;
	onclick?: (label: BX.SidePanel.Label, slider: BX.SidePanel.Slider) => void;
};

type ToolbarOptions = {
	context: string;
	position?: {
		top?: string;
		left?: string;
		right?: string;
		bottom?: string;
	};
	shiftedPosition?: {
		top?: string;
		left?: string;
		right?: string;
		bottom?: string;
	};
	collapsed?: boolean;
	maxVisibleItems?: number;
	items?: ToolbarItemOptions[];
};

type ToolbarItemOptions = {
	id?: string;
	title?: string;
	url?: string;
	entityType?: string;
	entityId?: string | number;
};

type ToolbarPosition = {
	top?: string;
	left?: string;
	right?: string;
	bottom?: string;
};

type RuleOptions = {
	condition: string[] | RegExp[];
	stopParameters?: string[];
	handler?: (event: MouseEvent, link: LinkOptions) => boolean;
	validate?: Function;
	allowCrossDomain?: boolean;
	mobileFriendly?: boolean;
	loader?: string;
	options?: SliderOptions | ((link: LinkOptions) => SliderOptions);
	minimizeOptions?: (link: LinkOptions) => MinimizeOptions;
	forceAnchorBinding?: boolean;
};

type LinkOptions = {
	url: string;
	target: string | null;
	anchor: HTMLElement | null;
	matches?: RegExpMatchArray;
};

type MessageEventOptions = {
	sender: BX.SidePanel.Slider;
	slider?: BX.SidePanel.Slider | null;
	data?: BX.JsonObject;
	eventId?: string;
};

declare namespace BX.SidePanel {
	const SidePanel: {
		readonly Instance: SliderManager;
	};

	/**
	 * @namespace BX.SidePanel
	 * @alias Manager
	 */
	class SliderManager {
		private anchorRules;
		private anchorBinding;
		private openSliders;
		private lastOpenSlider;
		private opened;
		private hidden;
		private hacksApplied;
		private pageUrl;
		private pageTitle;
		private titleChanged;
		private toolbar;
		private fullScreenSlider;
		private pageScrollTop;
		constructor();
		static registerSliderClass(className: string, defaultOptions?: SliderOptions | null, priorityOptions?: SliderOptions | null): void;
		static getSliderClass(): typeof Slider;
		static getSliderDefaultOptions(): SliderOptions;
		static getSliderPriorityOptions(): SliderOptions;
		open(url: string, options?: SliderOptions): boolean;
		getMinimizeOptions(url: string): MinimizeOptions | null;
		maximize(url: string, options: SliderOptions): boolean;
		tryApplyHacks(slider: Slider, cb: () => boolean): boolean;
		isOpen(): boolean;
		close(immediately?: boolean, callback?: Function): void;
		closeAll(immediately: boolean): void;
		minimize(immediately: boolean, callback: Function): void;
		hide(): boolean;
		unhide(): boolean;
		isHidden(): boolean;
		destroy(sliderUrl: string): void;
		reload(): void;
		getTopSlider(): Slider | null;
		getPreviousSlider(fromSlider?: Slider | null): Slider | null;
		getSlider(sliderUrl: string): Slider | null;
		getSliderByWindow(window: Window): Slider | null;
		getOpenSliders(): Slider[];
		getOpenSlidersCount(): number;
		getLastOpenSlider(): Slider | null;
		adjustLayout(): void;
		createToolbar(options: ToolbarOptions): Toolbar;
		getToolbar(): Toolbar | null;
		refineUrl(url: string): string;
		getPageUrl(): string;
		getCurrentUrl(): string;
		getPageTitle(): string;
		getCurrentTitle(): string;
		enterFullScreen(): void;
		exitFullScreen(): void;
		getFullScreenElement(): Element | null;
		getFullScreenSlider(): Slider | null;
		postMessage(source: string | Window | Slider, eventId: string, data: BX.JsonObject): void;
		postMessageAll(source: string | Window | Slider, eventId: string, data: BX.JsonObject): void;
		postMessageTop(source: string | Window | Slider, eventId: string, data: BX.JsonObject): void;
		bindAnchors(parameters: {
			rules: RuleOptions[];
		}): void;
		isAnchorBinding(): boolean;
		enableAnchorBinding(): void;
		disableAnchorBinding(): void;
		registerAnchorListener(targetDocument: Document): void;
		unregisterAnchorListener(targetDocument: Document): void;
		/**
		 * @private
		 */
		cleanUpClosedSlider(slider: Slider): void;
		/**
		 * @private
		 */
		getSliderFromSource(source: string | Window | Slider): Slider | null;
		/**
		 * @private
		 */
		applyHacks(slider: Slider | null): boolean;
		/**
		 * @private
		 */
		resetHacks(slider: Slider | null): boolean;
		/**
		 * @private
		 */
		bindEvents(): void;
		/**
		 * @private
		 */
		unbindEvents(): void;
		/**
		 * @private
		 */
		disablePageScrollbar(): void;
		/**
		 * @private
		 */
		enablePageScrollbar(): void;
		/**
		 * @private
		 */
		losePageFocus(): void;
		/**
		 * @private
		 */
		isOnTop(slider: Slider): boolean;
		/**
		 * @private
		 */
		extractLinkFromEvent(event: MouseEvent): LinkOptions | null;
		private handleAnchorClick;
		/**
		 * @public
		 * @param {string} url
		 */
		emulateAnchorClick(url: string): void;
		/**
		 * @private
		 */
		getUrlRule(href: string, link?: LinkOptions): RuleOptions | null;
		/**
		 * @private
		 */
		isValidLink(rule: RuleOptions | null, link: LinkOptions): boolean;
		/**
		 * @private
		 * @param {BX.SidePanel.Slider} slider
		 */
		setBrowserHistory(slider: Slider | null): void;
		/**
		 * @private
		 */
		resetBrowserHistory(): void;
		/**
		 * @public
		 */
		updateBrowserTitle(): void;
		/**
		 * @private
		 */
		getBrowserTitle(slider: Slider): string | null;
		/**
		 * @private
		 */
		hasStopParams(url: string, params?: string[]): boolean;
		/**
		 * @deprecated use getLastOpenSlider method
		 */
		getLastOpenPage(): Slider | null;
		/**
		 * @deprecated use getTopSlider method
		 */
		getCurrentPage(): Slider | null;
	}

	class SliderEvent {
		protected slider: Slider | null;
		private action;
		private name;
		constructor();
		allowAction(): void;
		denyAction(): void;
		isActionAllowed(): boolean;
		/**
		 * @deprecated use getSlider method
		 */
		getSliderPage(): Slider | null;
		getSlider(): Slider | null;
		setSlider(slider: Slider): void;
		getName(): string | null;
		setName(name: string): void;
		getFullName(): string;
	}

	class Slider {
		private url;
		private offset;
		private width;
		private title;
		private data;
		private contentCallback;
		private contentCallbackInvoved;
		private contentClassName;
		private containerClassName;
		private overlayClassName;
		private hideControls;
		private cacheable;
		private autoFocus;
		private printable;
		private allowChangeHistory;
		private allowChangeTitle;
		private allowCrossOrigin;
		private customLeftBoundary;
		private customRightBoundary;
		private iframe;
		private iframeSrc;
		private iframeId;
		private requestMethod;
		private requestParams;
		private opened;
		private hidden;
		private destroyed;
		private loaded;
		private loadedCnt;
		private minimizing;
		private maximizing;
		private layout;
		private skeleton;
		private loader;
		private animation;
		private animationDuration;
		private animationName;
		private animationOptions;
		private overlayBgColor;
		private overlayOpacity;
		private overlayBgCallback;
		private overlayAnimation;
		private minimizeOptions;
		private label;
		private minimizeLabel;
		private newWindowLabel;
		private copyLinkLabel;
		private printLabel;
		constructor(url: string, sliderOptions: SliderOptions);
		static getEventFullName(eventName: string): string;
		open(): boolean;
		close(immediately?: boolean, callback?: Function): boolean;
		minimize(immediately?: boolean, callback?: Function): boolean;
		isMinimizing(): boolean;
		maximize(): boolean;
		isMaximizing(): boolean;
		setAnimation(type: string, options?: {
			origin?: string;
		}): void;
		setMinimizeOptions(minimizeOptions: MinimizeOptions | null): void;
		areMinimizeOptionsValid(minimizeOptions: MinimizeOptions | null | undefined): boolean;
		getMinimizeOptions(): MinimizeOptions | null;
		setToolbarOnOpen(flag?: boolean): void;
		shouldHideToolbarOnOpen(): boolean;
		getDesignSystemContext(): string;
		setDesignSystemContext(context?: string): void;
		getUrl(): string;
		setUrl(url: string): void;
		focus(): void;
		isOpen(): boolean;
		getStartPosition(): 'right' | 'bottom' | 'top';
		/**
		 * @deprecated
		 */
		setZindex(zIndex: number): void;
		/**
		 * @public
		 * @returns {number}
		 */
		getZindex(): number;
		getZIndexComponent(): BX.ZIndexComponent | null;
		setOffset(offset: number | null): void;
		getOffset(): number | null;
		setAutoOffset(autoOffset?: boolean): void;
		shouldUseAutoOffset(): boolean;
		setWidth(width: number): void;
		getWidth(): number | null;
		setTitle(title?: string): void;
		getTitle(): string | null;
		getData(): Dictionary;
		isSelfContained(): boolean;
		isCrossOriginAllowed(): boolean;
		isPostMethod(): boolean;
		getRequestParams(): BX.JsonObject;
		/**
		 * @public
		 * @returns {string}
		 */
		getFrameId(): string;
		getWindow(): Window;
		getFrameWindow(): Window | null;
		isHidden(): boolean;
		isCacheable(): boolean;
		isFocusable(): boolean;
		isPrintable(): boolean;
		isDestroyed(): boolean;
		isLoaded(): boolean;
		canChangeHistory(): boolean;
		canChangeTitle(): boolean;
		setCacheable(cacheable?: boolean): void;
		setAutoFocus(autoFocus?: boolean): void;
		/**
		 * @public
		 * @param {boolean} printable
		 */
		setPrintable(printable?: boolean): void;
		getLoader(): string | HTMLElement;
		showLoader(): void;
		closeLoader(): void;
		showCloseBtn(): void;
		hideCloseBtn(): void;
		showOrLightenCloseBtn(): void;
		hideOrDarkenCloseBtn(): void;
		showPrintBtn(): void;
		hidePrintBtn(): void;
		showExtraLabels(): void;
		hideExtraLabels(): void;
		setContentClass(className: string): void;
		removeContentClass(): void;
		setContainerClass(className: string): void;
		removeContainerClass(): void;
		setOverlayClass(className: string): void;
		removeOverlayClass(): void;
		applyHacks(): void;
		applyPostHacks(): void;
		resetHacks(): void;
		resetPostHacks(): void;
		getTopBoundary(): number;
		/**
		 * @protected
		 */
		calculateLeftBoundary(): number;
		getLeftBoundary(): number;
		getMinLeftBoundary(): number;
		/**
		 * @internal
		 */
		getLeftBoundaryOffset(): number;
		setCustomLeftBoundary(boundary?: number | null): void;
		getCustomLeftBoundary(): number | null;
		setCustomRightBoundary(boundary?: number | null): void;
		getCustomRightBoundary(): number | null;
		/**
		 * @protected
		 */
		calculateRightBoundary(): number;
		getRightBoundary(): number;
		getOuterBoundary(): OuterBoundary;
		calculateOuterBoundary(): OuterBoundary | undefined;
		destroy(): boolean;
		/**
		 * @internal
		 */
		hide(): void;
		/**
		 * @internal
		 */
		unhide(): void;
		/**
		 * @public
		 */
		reload(): void;
		/**
		 * @public
		 */
		adjustLayout(): void;
		private createLayout;
		getTargetContainer(): HTMLElement;
		getFrame(): HTMLIFrameElement;
		getOverlay(): HTMLElement;
		unhideOverlay(): void;
		hideOverlay(): void;
		hideShadow(): void;
		showShadow(): void;
		setOverlayBackground(): void;
		setOverlayAnimation(animate: boolean): void;
		getOverlayAnimation(): boolean;
		getOverlayBgColor(): string;
		getOverlayOpacity(): number;
		getContainer(): HTMLElement;
		getContentContainer(): HTMLElement;
		getLabelsContainer(): HTMLElement;
		getExtraLabelsContainer(): HTMLElement;
		getCloseBtn(): HTMLElement;
		getLabel(): Label;
		getNewWindowLabel(): Label | null;
		getCopyLinkLabel(): Label | null;
		getMinimizeLabel(): Label;
		getPrintLabel(): Label | null;
		private setContent;
		private setFrameSrc;
		private createLoader;
		createSvgLoader(svg: string): HTMLElement;
		createDefaultLoader(): HTMLElement;
		private createOldLoader;
		private createHTMLLoader;
		loaderExists(loader: string): boolean;
		private removeLoader;
		getFocusTrap(): BX.UI.Accessibility.FocusTrap;
		/**
		 * @internal
		 */
		firePageEvent(eventName: string | SliderEvent): SliderEvent;
		/**
		 * @internal
		 */
		fireFrameEvent(eventName: string | SliderEvent): SliderEvent | null;
		fireEvent(eventName: string): void;
		private getEvent;
		canOpen(): boolean;
		canClose(): boolean;
		canCloseByEsc(): boolean;
		canAction(action: string): boolean;
		private handleFrameLoad;
		isOnTopOfPopup(popup: BX.Main.Popup): boolean;
		refineUrl(url: string): string;
	}

	class Dictionary {
		constructor(data: BX.JsonObject);
		set(key: string, value: BX.JsonValue): void;
		get(key: string): BX.JsonValue | undefined;
		delete(key: string): void;
		has(key: string): boolean;
		clear(): void;
		entries(): BX.JsonObject;
	}

	class Label {
		private static MIN_LEFT_OFFSET;
		private static MIN_TOP_OFFSET;
		private static INTERVAL_TOP_OFFSET;
		private slider;
		private color;
		private bgColor;
		private className;
		private iconClass;
		private iconTitle;
		private onclick;
		private text;
		private hidden;
		private visible;
		private testId;
		private cache;
		constructor(slider: Slider, labelOptions: LabelOptions);
		getContainer(): HTMLElement;
		adjustLayout(): void;
		getIconBox(): HTMLElement;
		getIconContainer(): HTMLElement;
		showIcon(): void;
		hideIcon(): void;
		darkenIcon(): void;
		lightenIcon(): void;
		hideText(): void;
		showText(): void;
		isTextHidden(): boolean;
		getTextContainer(): HTMLElement;
		setColor(color: string | null | undefined): void;
		getColor(): string | null;
		setBgColor(color: string | [string, number] | undefined, opacity?: number): void;
		getBgColor(): string | null;
		setText(text: string | null | undefined): void;
		getText(): string | null;
		setClassName(className: string | null | undefined): void;
		getClassName(): string;
		setIconClass(iconClass: string | null | undefined): void;
		getIconClass(): string;
		setIconTitle(iconTitle: string | null | undefined): void;
		getIconTitle(): string | null;
		isHidden(): boolean;
		hide(): void;
		show(): void;
		isVisible(): boolean;
		setVisible(isVisible?: boolean): void;
		setOnclick(fn: Function | null | undefined): void;
		getOnclick(): Function | null;
		getTestId(): string | null;
		getSlider(): Slider;
		moveAt(position: number): void;
	}

	class Toolbar extends BX.Event.EventEmitter {
		private context;
		private items;
		private rendered;
		private refs;
		private lsKey;
		private initialPosition;
		private shiftedPosition;
		private collapsed;
		private muted;
		private shifted;
		private maxVisibleItems;
		constructor(toolbarOptions: ToolbarOptions);
		show(): void;
		isShown(): boolean;
		hide(): void;
		mute(): boolean;
		unmute(): boolean;
		isMuted(): boolean;
		toggleMuteness(): boolean;
		shift(): boolean;
		unshift(): boolean;
		isShifted(): boolean;
		toggleShift(): boolean;
		setPosition(container: HTMLElement, position: ToolbarPosition): void;
		collapse(immediately?: boolean): void;
		expand(immediately?: boolean): void;
		toggle(): void;
		isCollapsed(): boolean;
		getItems(): ToolbarItem[];
		getItemsCount(): number;
		addItems(itemsOptions?: ToolbarItemOptions[]): void;
		addItem(itemOptions: ToolbarItemOptions): ToolbarItem | null;
		/**
		 *
		 * @param itemOptions
		 * @returns {ToolbarItem|null}
		 */
		prependItem(itemOptions: ToolbarItemOptions): ToolbarItem | null;
		createItem(itemOptions: ToolbarItemOptions): ToolbarItem | null;
		/**
		 * @private
		 */
		minimizeItem(itemOptions: ToolbarItemOptions): ToolbarItem | null;
		saveItemToLocalStorage(item: ToolbarItem): void;
		restoreItemFromLocalStorage(): BX.JsonObject | null;
		clearLocalStorage(): void;
		getContext(): string;
		request(action: string, item?: ToolbarItem | null, data?: BX.JsonObject): Promise<any>;
		handleItemRemove(event: BX.Event.BaseEvent): void;
		handleMenuItemRemove(event: MouseEvent): void;
		removeItem(itemToRemove: ToolbarItem): void;
		redraw(): void;
		removeAll(): void;
		getItem(entityType: string, entityId: string | number): ToolbarItem | null;
		getItemByUrl(url: string): ToolbarItem | null;
		getItemById(id: string): ToolbarItem | null;
		getContainer(): HTMLElement;
		getToggleButton(): HTMLButtonElement;
		getContentContainer(): HTMLElement;
		getItemsContainer(): HTMLElement;
		getMoreButton(): HTMLElement;
		handleMoreBtnClick(): void;
		canShowOnTop(): boolean;
		getMenu(): BX.Main.Menu | null;
		createMenuItemText(item: ToolbarItem): HTMLElement;
		handleToggleClick(): void;
	}

	class ToolbarItem extends BX.Event.EventEmitter {
		private id;
		private title;
		private url;
		private entityType;
		private entityId;
		private entityName;
		private refs;
		private rendered;
		constructor(itemOptions: ToolbarItemOptions);
		getId(): string;
		getUrl(): string;
		setUrl(url?: string): void;
		getTitle(): string;
		setTitle(title?: string): void;
		getEntityType(): string;
		setEntityType(entityType?: string): void;
		getEntityId(): string | number;
		setEntityId(entityId?: string | number): void;
		getEntityName(): string;
		setEntityName(entityName?: string): void;
		getContainer(): HTMLElement;
		isRendered(): boolean;
		getTitleContainer(): HTMLElement;
		prependTo(node: HTMLElement): void;
		appendTo(node: HTMLElement): void;
		insertBefore(node: HTMLElement): void;
		insertAfter(node: HTMLElement): void;
		remove(): void;
		showTooltip(): void;
		hideTooltip(): void;
		handleMouseEnter(): void;
		handleMouseLeave(): void;
		handleRemoveBtnClick(event: globalThis.Event): void;
		toJSON(): BX.JsonObject;
	}

	const Manager: typeof SliderManager;

	const Event: typeof SliderEvent;

	class MessageEvent extends SliderEvent {
		private sender;
		private data;
		private eventId;
		constructor(eventOptions: MessageEventOptions);
		getSlider(): Slider | null;
		getSender(): Slider;
		getData(): BX.JsonObject | null;
		getEventId(): string | null;
	}
}
