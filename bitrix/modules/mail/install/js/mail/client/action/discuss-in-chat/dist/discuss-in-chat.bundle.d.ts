/* eslint-disable */
type SelectorDialogEvents = {
	'BX.Mail.Client.Action.Item:onSelect': (event: {
		getData(): {
			item?: SelectorDialogItem | null;
		};
	}) => void;
	onHide: () => void;
};

type SelectorDialogItem = DialogItem;

type AjaxResponseWithErrors = {
	errors?: AjaxErrorItem[];
};

type DialogWindow = Window & {
	BX: RootBX;
};

type HeaderContent = string | Function | HTMLElement | HTMLElement[];

type HeaderOptions = {
	[option: string]: any;
};

type FooterContent = string | Function | HTMLElement | HTMLElement[];

type FooterOptions = {
	[option: string]: any;
};

type DialogOptions = {
	targetNode: HTMLElement;
	id?: string | undefined;
	context?: string | undefined;
	items?: ItemOptions[] | undefined;
	selectedItems?: ItemOptions[] | undefined;
	preselectedItems?: ItemId[] | undefined;
	undeselectedItems?: ItemId[] | undefined;
	tabs?: TabOptions[] | undefined;
	entities?: EntityOptions[] | undefined;
	popupOptions?: PopupOptions | undefined;
	multiple?: boolean | undefined;
	preload?: boolean | undefined;
	dropdownMode?: boolean | undefined;
	enableSearch?: boolean | undefined;
	searchOptions?: SearchOptions | undefined;
	searchTabOptions?: TabOptions | undefined;
	recentTabOptions?: TabOptions | undefined;
	tagSelector?: BX.Mail.Client.Action.TagSelector | undefined;
	tagSelectorOptions?: TagSelectorOptions | undefined;
	events?: {
		[eventName: string]: (event: BX.Mail.Client.Action.BaseEvent<any>) => void;
	} | undefined;
	hideOnSelect?: boolean | undefined;
	hideOnDeselect?: boolean | undefined;
	addTagOnSelect?: boolean | undefined;
	clearSearchOnSelect?: boolean | undefined;
	width?: number | undefined;
	height?: number | undefined;
	autoHide?: boolean | undefined;
	autoHideHandler?: ((event: MouseEvent, dialog: BX.Mail.Client.Action.Dialog) => boolean) | undefined;
	hideByEsc?: boolean | undefined;
	offsetTop?: number | undefined;
	offsetLeft?: number | undefined;
	cacheable?: boolean | undefined;
	focusOnFirst?: boolean | undefined;
	header?: HeaderContent | undefined;
	headerOptions?: HeaderOptions | undefined;
	footer?: FooterContent | undefined;
	footerOptions?: FooterOptions | undefined;
	clearUnavailableItems?: boolean | undefined;
	showAvatars?: boolean | undefined;
	compactView?: boolean | undefined;
	recentItemsLimit?: number | undefined;
	offsetAnimation?: boolean | undefined;
	alwaysShowLabels?: boolean | undefined;
	customData?: JsonObject | undefined;
};

type ItemId = [string, string | number];

type PopupOptions = {
	id?: string | undefined;
	bindElement?: PopupTarget | undefined;
	bindOptions?: PopupTargetOptions | undefined;
	content?: string | Node | Element | undefined;
	closeByEsc?: boolean | undefined;
	buttons?: [] | undefined;
	className?: string | undefined;
	width?: number | undefined;
	height?: number | undefined;
	minWidth?: number | undefined;
	minHeight?: number | undefined;
	maxWidth?: number | undefined;
	maxHeight?: number | undefined;
	resizable?: boolean | undefined;
	padding?: number | undefined;
	contentPadding?: number | undefined;
	borderRadius?: string | undefined;
	contentBorderRadius?: string | undefined;
	background?: string | undefined;
	cacheable?: boolean | undefined;
	contentBackground?: string | undefined;
	animation?: PopupAnimationOptions | undefined;
	closeIcon?: boolean | undefined;
	closeIconSize?: any;
	autoHide?: boolean | undefined;
	autoHideHandler?: ((event: MouseEvent) => boolean) | undefined;
	zIndexOptions?: ZIndexComponentOptions | undefined;
	toFrontOnShow?: boolean | undefined;
	events?: {
		[eventName: string]: (event: BX.Mail.Client.Action.BaseEvent<any>) => void;
	} | undefined;
	titleBar?: string | {
		content: string;
	} | undefined;
	angle?: boolean | {
		offset: number;
		position?: "bottom" | "top" | "left" | "right" | undefined;
	} | undefined;
	overlay?: boolean | PopupOverlay | undefined;
	contentColor?: "white" | "gray" | undefined;
	draggable?: boolean | PopupDraggable | undefined;
	darkMode?: boolean | undefined;
	fixed?: boolean | undefined;
	designSystemContext?: string | undefined;
	compatibleMode?: boolean | undefined;
	bindOnResize?: boolean | undefined;
	targetContainer?: HTMLElement | undefined;
	disableScroll?: boolean | undefined;
	focusTrap?: boolean | FocusTrapOptions | undefined;
	ariaLabel?: string | undefined;
	ariaLabelledBy?: string | undefined;
	ariaDescribedBy?: string | undefined;
	role?: string | undefined;
	noAllPaddings?: boolean | undefined;
	contentNoPaddings?: boolean | undefined;
};

type JsonObject = Record<string, JsonValue>;

type ItemOptions = {
	id: string | number;
	entityId: string;
	entityType?: string | undefined;
	title?: string | TextNodeOptions | undefined;
	subtitle?: string | TextNodeOptions | undefined;
	supertitle?: string | TextNodeOptions | undefined;
	caption?: string | TextNodeOptions | undefined;
	captionOptions?: CaptionOptions | undefined;
	avatar?: string | undefined;
	avatarOptions?: AvatarOptions | undefined;
	textColor?: string | undefined;
	link?: string | undefined;
	linkTitle?: string | TextNodeOptions | undefined;
	badges?: ItemBadgeOptions[] | undefined;
	badgesOptions?: BadgesOptions | undefined;
	tagOptions?: {
		[key: string]: any;
	} | undefined;
	tabs?: string | string[] | undefined;
	searchable?: boolean | undefined;
	saveable?: boolean | undefined;
	deselectable?: boolean | undefined;
	selected?: boolean | undefined;
	hidden?: boolean | undefined;
	locked?: boolean | undefined;
	children?: ItemOptions[] | undefined;
	nodeOptions?: ItemNodeOptions | undefined;
	customData?: {
		[key: string]: any;
	} | undefined;
	contextSort?: number | undefined;
	globalSort?: number | undefined;
	sort?: number | undefined;
};

type TabOptions = {
	id: string;
	title?: string | TextNodeOptions | undefined;
	visible?: boolean | undefined;
	itemMaxDepth?: number | undefined;
	itemOrder?: ItemNodeOrder | undefined;
	icon?: string | TabLabelStates | undefined;
	textColor?: string | TabLabelStates | undefined;
	bgColor?: string | TabLabelStates | undefined;
	stub?: string | boolean | Function | undefined;
	stubOptions?: {
		[option: string]: any;
	} | undefined;
	header?: HeaderContent | undefined;
	headerOptions?: HeaderOptions | undefined;
	showDefaultHeader?: boolean | undefined;
	footer?: FooterContent | undefined;
	footerOptions?: FooterOptions | undefined;
	showDefaultFooter?: boolean | undefined;
	showAvatars?: boolean | undefined;
};

type EntityOptions = {
	id: string;
	options?: {
		[key: string]: any;
	} | undefined;
	itemOptions?: {
		[key: string]: ItemOptions;
	} | undefined;
	tagOptions?: {
		[key: string]: any;
	} | undefined;
	badgeOptions?: EntityBadgeOptions[] | undefined;
	filters?: EntityFilterOptions[] | undefined;
	searchable?: boolean | undefined;
	searchFields?: SearchFieldOptions[] | undefined;
	searchCacheLimits?: string[] | undefined;
	dynamicLoad?: boolean | undefined;
	dynamicSearch?: boolean | undefined;
	dynamicSearchMatchMode?: "all" | "exact" | undefined;
	substituteEntityId?: string | undefined;
	fillRecentItems?: boolean | undefined;
};

type EntityErrorOptions = {
	entityId: string;
	code?: any;
	message?: string | undefined;
	customData?: [] | undefined;
};

type AjaxErrorItem = {
	message: string;
};

type RootBX = {
	BX.Mail.Client.Action.Runtime: {
		loadExtension(extensions: readonly string[]): Promise<unknown[]>;
	};
	ajax: {
		runAction(action: string, options: {
			data: SendToChatData;
		}): Promise<AjaxResponseWithErrors>;
	};
	addCustomEvent(eventName: string, handler: () => void): void;
	UI: {
		EntitySelector: {
			BX.Mail.Client.Action.Dialog: SelectorDialogClass;
		};
		Dialogs: {
			MessageBox: {
				show(options: MessageBoxOptions): void;
			};
			MessageBoxButtons: {
				OK_CANCEL: unknown;
			};
		};
		Notification: {
			Center: {
				notify(options: {
					content: string;
				}): void;
			};
		};
	};
	Messenger: {
		Public: {
			openChat(dialogId: string): void;
		};
	};
	SidePanel: {
		Instance: {
			getSliderByWindow(targetWindow: Window): SliderInstance | null;
		};
	};
};

type TabLabelStates = {
	default?: string | undefined;
	selected?: string | undefined;
	hovered?: string | undefined;
	selectedHovered?: string | undefined;
};

type TextNodeOptions = {
	text: string;
	type?: BX.Mail.Client.Action.TextNodeType | undefined;
};

type TabLabelState = "default" | "selected" | "hovered" | "selectedHovered";

type SearchOptions = {
	allowCreateItem?: boolean | undefined;
	footerOptions?: FooterOptions | undefined;
};

type TagSelectorOptions = {
	id?: string | undefined;
	items?: TagItemOptions[] | undefined;
	dialogOptions?: DialogOptions | undefined;
	multiple?: boolean | undefined;
	readonly?: boolean | undefined;
	locked?: boolean | undefined;
	deselectable?: boolean | undefined;
	events?: {
		[eventName: string]: (event: BX.Mail.Client.Action.BaseEvent<any>) => void;
	} | undefined;
	showAddButton?: boolean | undefined;
	showCreateButton?: boolean | undefined;
	showTextBox?: boolean | undefined;
	addButtonCaption?: string | undefined;
	addButtonCaptionMore?: string | undefined;
	createButtonCaption?: string | undefined;
	placeholder?: string | undefined;
	maxHeight?: number | undefined;
	textBoxAutoHide?: boolean | undefined;
	textBoxWidth?: string | number | undefined;
	tagAvatar?: string | undefined;
	tagAvatarOptions?: AvatarOptions | undefined;
	tagMaxWidth?: number | undefined;
	tagTextColor?: string | undefined;
	tagBgColor?: string | undefined;
	tagFontWeight?: string | undefined;
	tagClickable?: boolean | undefined;
};

type CaptionOptions = {
	fitContent: boolean;
	maxWidth: string | number;
	justifyContent: "center" | "left" | "right";
};

type AvatarOptions = {
	bgSize?: string | undefined;
	bgColor?: string | undefined;
	bgImage?: string | undefined;
	border?: string | undefined;
	borderRadius?: string | undefined;
	outline?: string | undefined;
	outlineOffset?: string | undefined;
	icon?: string | undefined;
	iconColor?: string | undefined;
};

type ItemBadgeOptions = {
	title: string | TextNodeOptions;
	textColor?: string | undefined;
	bgColor?: string | undefined;
	border?: string | undefined;
};

type BadgesOptions = {
	fitContent: boolean;
	maxWidth: string | number;
	justifyContent: "center" | "left" | "right";
};

type ItemNodeOptions = {
	itemOrder?: ItemNodeOrder | undefined;
	open?: boolean | undefined;
	dynamic?: boolean | undefined;
	title?: string | TextNodeOptions | undefined;
	subtitle?: string | TextNodeOptions | undefined;
	supertitle?: string | TextNodeOptions | undefined;
	caption?: string | TextNodeOptions | undefined;
	captionOptions?: CaptionOptions | undefined;
	avatar?: string | undefined;
	avatarOptions?: AvatarOptions | undefined;
	textColor?: string | undefined;
	link?: string | undefined;
	linkTitle?: string | TextNodeOptions | undefined;
	badges?: ItemBadgeOptions[] | undefined;
	badgesOptions?: BadgesOptions | undefined;
	renderMode?: BX.Mail.Client.Action.RenderMode | undefined;
};

type ItemSelectOptions = {
	emitEvents?: boolean | undefined;
	animate?: boolean | undefined;
	node?: BX.Mail.Client.Action.ItemNode | undefined;
};

type TagItemOptions = {
	id: string;
	entityId: string | number;
	entityType?: string | undefined;
	title?: string | TextNodeOptions | undefined;
	avatar?: string | undefined;
	avatarOptions?: AvatarOptions | undefined;
	textColor?: string | undefined;
	bgColor?: string | undefined;
	fontWeight?: string | undefined;
	link?: string | undefined;
	onclick?: Function | undefined;
	clickable?: boolean | undefined;
	maxWidth?: number | undefined;
	deselectable?: boolean | undefined;
	animate?: boolean | undefined;
	customData?: {
		[key: string]: any;
	} | undefined;
};

type EntityBadgeOptions = ItemBadgeOptions & {
	conditions?: {
		[key: string]: any;
	} | undefined;
};

type SearchFieldOptions = {
	name: string;
	type?: "string" | "email" | undefined;
	searchable?: boolean | undefined;
	system?: boolean | undefined;
	sort?: number | undefined;
};

type EntityFilterOptions = {
	id: string;
	options?: {
		[key: string]: any;
	} | undefined;
};

type PopupDraggable = {
	restrict: boolean;
	element: HTMLElement;
};

type PopupOverlay = {
	backgroundColor: string;
	opacity: number;
	blur: string;
};

type PopupAnimationOptions = string | boolean | {
	showClassName?: string | undefined;
	closeClassName?: string | undefined;
	closeAnimationType: string | null;
};

type PopupTarget = Element | MouseEvent | {
	left: number;
	top: number;
} | null;

type PopupTargetOptions = {
	forceBindPosition?: boolean | undefined;
	forceLeft?: boolean | undefined;
	forceTop?: boolean | undefined;
	position?: "top" | "bootom" | undefined;
};

type ZIndexComponentOptions = {
	alwaysOnTop?: boolean | number;
	overlay?: HTMLElement;
	overlayGap?: number;
	events?: {
		[eventName: string]: (event: BX.Mail.Client.Action.BaseEvent) => void;
	};
};

type FocusTrapOptions = {
	initialFocus?: InitialFocus | InitialFocus[];
	forceInitialFocus?: boolean;
	restoreFocus?: RestoreFocus;
	preventScroll?: boolean;
	suppressFocusOnRestore?: boolean;
	isolateOutside?: boolean;
	outsideExceptionSelectors?: string[];
	looped?: boolean;
	startBoundary?: FocusBoundaryTarget;
	endBoundary?: FocusBoundaryTarget;
};

type JsonValue = string | number | boolean | {
	[x: string]: JsonValue;
} | Array<JsonValue>;

type ItemNodeOrder = {
	[key: string]: "asc" | "desc" | "asc nulls first" | "asc nulls last" | "desc nulls first" | "desc nulls last";
} | ((a: T, b: T) => number);

type SendToChatData = {
	dialogId: string;
	activityId?: number;
	messageId?: number;
};

type SelectorDialogClass = {
	new (dialogOptions: SelectorDialogOptions): BX.Mail.Client.Action.Dialog;
	getById(id: string): BX.Mail.Client.Action.Dialog | null;
};

type MessageBoxOptions = {
	title: string;
	message: string;
	buttons: unknown;
	okCaption: string;
	cancelCaption: string;
	useAirDesign: boolean;
	popupOptions: {
		closeByEsc: boolean;
		focusTrap: boolean;
	};
	onOk: (messageBoxInstance: MessageBoxInstance) => void;
	onCancel: (messageBoxInstance: MessageBoxInstance) => void;
};

type SliderInstance = {
	getFrameWindow(): Window;
};

type FocusNavigatorOptions = {
	from?: HTMLElement;
	tabbableOnly?: boolean;
	wrap?: boolean;
	accept?: (el: HTMLElement) => boolean;
	preventScroll?: boolean;
	focusVisible?: boolean;
};

type RestoreFocus = boolean | string | HTMLElement | (() => HTMLElement | null);

type InitialFocus = 'first-tabbable' | 'container' | string | boolean | (() => HTMLElement | null);

type FocusBoundaryTarget = string | HTMLElement | (() => HTMLElement | null);

type SelectorDialogOptions = {
	targetNode: HTMLElement | null;
	events?: SelectorDialogEvents;
	popupOptions?: {
		overlay?: boolean;
		targetContainer?: HTMLElement;
		className?: string;
	};
	[key: string]: unknown;
};

type MessageBoxInstance = {
	close(): void;
};

declare namespace BX.Mail.Client.Action {
	const DiscussInChat: {
		dialog: Dialog | null;
		activeDialogId: string | null;
		triggerButton: HTMLElement | null;
		currentSource: string | null;
		sidePanelListenerBound: boolean;
		preload(): void;
		open(messageId: number, triggerButton: HTMLElement | null | undefined, source: string | null | undefined): void;
		confirmSend(messageId: number, dialogId: string): void;
		sendToChat(messageId: number, dialogId: string): void;
		closeDialog(): void;
		openMessenger(dialogId: string): void;
		createSelectorDialog(messageId: number): Dialog;
		getDialogId(messageId: number): string;
		getDialogEvents(messageId: number): SelectorDialogEvents;
		getDialogOptions(dialogId: string, header: HTMLElement, events: SelectorDialogEvents): {
			id: string;
			context: string;
			targetNode: null;
			multiple: boolean;
			cacheable: boolean;
			enableSearch: boolean;
			addTagOnSelect: boolean;
			hideOnSelect: boolean;
			clearSearchOnSelect: boolean;
			dropdownMode: boolean;
			compactView: boolean;
			showAvatars: boolean;
			autoHide: boolean;
			width: number;
			height: number;
			header: HTMLElement;
			footer: null;
			recentTabOptions: {
				itemOrder: {
					sort: string;
				};
			};
			popupOptions: {
				overlay: boolean;
				targetContainer: HTMLElement;
				className: string;
			};
			entities: {
				id: string;
				dynamicLoad: boolean;
				dynamicSearch: boolean;
				fillRecentItems: boolean;
				options: {
					searchChatTypes: string[];
					fillDialogByRecent: boolean;
				};
				filters: {
					id: string;
				}[];
			}[];
			events: SelectorDialogEvents;
		};
		getPopupOptions(): {
			overlay: boolean;
			targetContainer: HTMLElement;
			className: string;
		};
		getDialogEntities(): {
			id: string;
			dynamicLoad: boolean;
			dynamicSearch: boolean;
			fillRecentItems: boolean;
			options: {
				searchChatTypes: string[];
				fillDialogByRecent: boolean;
			};
			filters: {
				id: string;
			}[];
		}[];
		getRecentEntityOptions(): {
			id: string;
			dynamicLoad: boolean;
			dynamicSearch: boolean;
			fillRecentItems: boolean;
			options: {
				searchChatTypes: string[];
				fillDialogByRecent: boolean;
			};
			filters: {
				id: string;
			}[];
		};
		buildSelectorHeader(): HTMLElement;
		bindSelectorHeader(header: HTMLElement): void;
		getDialogIdByItem(item: SelectorDialogItem | null | undefined): string | null;
		focusTriggerButton(): void;
		showError(message: string): void;
		getErrorMessages(source: AjaxResponseWithErrors | unknown): string[];
		getRootWindow(): DialogWindow;
		ensureExtensions(): Promise<void>;
		bindSidePanelCloseHandler(): void;
	};

	/**
	 * @memberof BX.UI.EntitySelector
	 */
	class Dialog extends EventEmitter {
		static getById(id: string): Dialog | null;
		static getInstances(): Dialog[];
		/**
		 * @internal
		 */
		static createHeader(context: Dialog | Tab, headerContent: HeaderContent, headerOptions?: HeaderOptions): BaseHeader | null;
		/**
		 * @internal
		 */
		static createFooter(context: Dialog | Tab, footerContent: FooterContent, footerOptions?: FooterOptions): BaseFooter | null;
		constructor(dialogOptions: DialogOptions);
		id: string;
		items: Map<string, Map<string, Item>>;
		tabs: Map<string, Entity>;
		entities: Map<string, Entity>;
		targetNode: HTMLElement;
		popup: Popup;
		cache: import("../../../../../../../main/install/js/main/core/src/lib/cache/memory-cache").default<any>;
		multiple: boolean;
		hideOnSelect: boolean;
		hideOnDeselect: boolean;
		addTagOnSelect: boolean;
		clearSearchOnSelect: boolean;
		context: string;
		selectedItems: Set<Item>;
		preselectedItems: ItemId[];
		undeselectedItems: ItemId[];
		dropdownMode: boolean;
		frozen: boolean;
		frozenProps: {
			[propName: string]: any;
		};
		hideByEsc: boolean;
		autoHide: boolean;
		autoHideHandler: Function;
		offsetTop: number;
		offsetLeft: number;
		cacheable: boolean;
		width: number;
		height: number;
		maxLabelWidth: number;
		minLabelWidth: number;
		alwaysShowLabels: boolean;
		showAvatars: boolean;
		compactView: boolean;
		activeTab: Tab;
		recentTab: Tab;
		searchTab: Tab;
		rendered: boolean;
		loadState: LoadState;
		loader: Loader | null;
		tagSelector: TagSelector | null;
		tagSelectorMode: TagSelectorMode | null;
		tagSelectorHeight: number | null;
		saveRecentItemsWithDebounce: Function;
		recentItemsToSave: any[];
		recentItemsLimit: number | null;
		navigation: Navigation;
		header: BaseHeader;
		footer: BaseFooter;
		popupOptions: PopupOptions;
		focusOnFirst: boolean;
		focusedNode: ItemNode;
		clearUnavailableItems: boolean;
		overlappingObserver: MutationObserver;
		offsetAnimation: boolean;
		customData: JsonObject;
		show(): void;
		hide(): void;
		destroy(): void;
		destroyed: boolean | undefined;
		isOpen(): boolean;
		adjustPosition(): void;
		search(queryString: string): void;
		addItem(options: ItemOptions): Item;
		removeItem(item: Item | ItemOptions): Item | null;
		removeItems(): void;
		getItem(item: ItemId | Item | ItemOptions): Item | null;
		getSelectedItems(): Item[];
		getItems(): Item[];
		/**
		 * @internal
		 */
		getItemsInternal(): Map<string, Map<string, Item>>;
		getEntityItems(entityId: string): Item[];
		/**
		 * @internal
		 */
		getEntityItemsInternal(entityId: string): Map<string, Item> | null;
		/**
		 * @private
		 */
		private validateItemIds;
		addTab(tab: Tab | TabOptions): Tab;
		getTabs(): Tab[];
		getTab(id: string): Tab | null;
		getRecentTab(): RecentTab;
		getSearchTab(): SearchTab;
		selectTab(id: string): Tab | null;
		/**
		 * @private
		 */
		private insertTab;
		selectFirstTab(onlyVisible?: boolean): Tab | null;
		selectLastTab(onlyVisible?: boolean): Tab | null;
		getActiveTab(): Tab | null;
		getNextTab(onlyVisible?: boolean): Tab | null;
		getPreviousTab(onlyVisible?: boolean): Tab | null;
		removeTab(id: string): void;
		addEntity(entity: Entity | EntityOptions): Entity;
		getEntity(id: string): Entity | null;
		hasEntity(id: string): boolean;
		getEntities(): Entity[];
		removeEntity(id: string): void;
		removeEntityItems(id: string): void;
		getHeader(): BaseHeader | null;
		getActiveHeader(): BaseHeader | null;
		/**
		 * @internal
		 */
		adjustHeader(): void;
		setHeader(headerContent: HeaderContent | null, headerOptions?: HeaderOptions): BaseHeader | null;
		/**
		 * @internal
		 */
		appendHeader(header: BaseHeader): void;
		getFooter(): BaseFooter | null;
		getActiveFooter(): BaseFooter | null;
		/**
		 * @internal
		 */
		adjustFooter(): void;
		setFooter(footerContent: FooterContent | null, footerOptions?: FooterOptions): BaseFooter | null;
		/**
		 * @internal
		 */
		appendFooter(footer: BaseFooter): void;
		getId(): string;
		getContext(): string | null;
		getNavigation(): Navigation;
		deselectAll(): void;
		isMultiple(): boolean;
		setTargetNode(node: HTMLElement | {
			left: number;
			top: number;
		} | null | MouseEvent): void;
		getTargetNode(): HTMLElement | null;
		setHideOnSelect(flag: boolean): void;
		shouldHideOnSelect(): boolean;
		setHideOnDeselect(flag: boolean): void;
		shouldHideOnDeselect(): boolean;
		setClearSearchOnSelect(flag: boolean): void;
		shouldClearSearchOnSelect(): boolean;
		setAddTagOnSelect(flag: boolean): void;
		shouldAddTagOnSelect(): boolean;
		setShowAvatars(flag: boolean): void;
		shouldShowAvatars(): boolean;
		setRecentItemsLimit(recentItemsLimit: number): void;
		getRecentItemsLimit(): number | null;
		setOffsetAnimation(flag: boolean): any;
		isCompactView(): boolean;
		setAutoHide(enable: boolean): void;
		isAutoHide(): boolean;
		setAutoHideHandler(handler?: (event: MouseEvent, dialog: Dialog) => boolean): void;
		setHideByEsc(enable: boolean): void;
		shouldHideByEsc(): boolean;
		getWidth(): number;
		setWidth(width: number): void;
		getHeight(): number;
		setHeight(height: number): Promise<any>;
		getOffsetLeft(): number;
		setOffsetLeft(offset: number): void;
		getOffsetTop(): number;
		setOffsetTop(offset: number): void;
		getZindex(): number;
		isCacheable(): boolean;
		setCacheable(cacheable: boolean): void;
		shouldFocusOnFirst(): boolean;
		setFocusOnFirst(flag: boolean): void;
		focusOnFirstNode(): ItemNode | null;
		getFocusedNode(): ItemNode | null;
		clearNodeFocus(): void;
		isDropdownMode(): boolean;
		setPreselectedItems(itemIds: ItemId[]): void;
		getPreselectedItems(): ItemId[];
		setUndeselectedItems(itemIds: ItemId[]): void;
		getUndeselectedItems(): ItemId[];
		setCustomData(property: (string | {
			[key: string]: any;
		}) | null, value?: any): void;
		getCustomData(property?: string): any;
		/**
		 * @private
		 */
		private setOptions;
		getMaxLabelWidth(): number;
		getMinLabelWidth(): number;
		expandLabels(animate?: boolean): void;
		collapseLabels(animate?: boolean): void;
		getTagSelector(): TagSelector | null;
		getTagSelectorMode(): TagSelectorMode | null;
		isTagSelectorInside(): boolean;
		isTagSelectorOutside(): boolean;
		getTagSelectorQuery(): string;
		/**
		 * @private
		 */
		private setTagSelector;
		focusSearch(): void;
		clearSearch(): void;
		getLoader(): Loader;
		showLoader(): void;
		hideLoader(): void;
		destroyLoader(): void;
		getPopup(): Popup;
		isRendered(): boolean;
		getContainer(): HTMLElement;
		getTabsContainer(): HTMLElement;
		getTabContentsContainer(): HTMLElement;
		getLabelsContainer(): HTMLElement;
		getHeaderContainer(): HTMLElement;
		getFooterContainer(): HTMLElement;
		freeze(): void;
		unfreeze(): void;
		isFrozen(): boolean;
		hasRecentItems(): Promise<any>;
		load(): void;
		isLoaded(): boolean;
		isLoading(): boolean;
		hasDynamicLoad(): boolean;
		hasDynamicSearch(): boolean;
		saveRecentItem(item: Item): void;
		/**
		 * @private
		 */
		private saveRecentItems;
		shouldClearUnavailableItems(): boolean;
		/**
		 * @private
		 */
		private handleTagSelectorInput;
		/**
		 * @private
		 */
		private handleTagSelectorAddButtonClick;
		/**
		 * @private
		 */
		private handleTagSelectorTagRemove;
		/**
		 * @private
		 */
		private handleTagSelectorAfterTagRemove;
		/**
		 * @private
		 */
		private handleTagSelectorAfterTagAdd;
		/**
		 * @private
		 */
		private adjustByTagSelector;
		/**
		 * @private
		 */
		private handleTagSelectorClick;
		/**
		 * @internal
		 */
		handleItemSelect(item: Item, animate?: boolean): void;
		/**
		 * @internal
		 */
		handleItemDeselect(item: Item, animate?: boolean): void;
		/**
		 * @private
		 */
		private handlePopupAfterShow;
		/**
		 * @private
		 */
		private handlePopupFirstShow;
		/**
		 * @private
		 */
		private handlePopupShow;
		/**
		 * @private
		 */
		private handleAutoHide;
		/**
		 * @private
		 */
		private observeTabOverlapping;
		/**
		 * @private
		 */
		private disconnectTabOverlapping;
		/**
		 * @private
		 */
		private handlePopupAfterClose;
		/**
		 * @private
		 */
		private handlePopupDestroy;
		/**
		 * @private
		 */
		private handleLabelsMouseEnter;
		/**
		 * @private
		 */
		private handleLabelsMouseLeave;
		/**
		 * @private
		 */
		private handleItemNodeFocus;
		/**
		 * @private
		 */
		private handleItemNodeUnfocus;
		getAjaxJson(): {
			[key: string]: any;
		};
		/** @internal */
		emitEntityErrors(errorOptions: EntityErrorOptions[]): void;
	}

	class EventEmitter {
		[key: symbol]: any;
		static GLOBAL_TARGET: {
			GLOBAL_TARGET: string;
		};
		static DEFAULT_MAX_LISTENERS: number;
		/** @private */
		static sequenceValue: number;
		constructor(...args: any[]);
		/**
		 * Makes a target observable
		 * @param {object} target
		 * @param {string} namespace
		 */
		static makeObservable(target: any, namespace: string): void;
		setEventNamespace(namespace: any): void;
		getEventNamespace(): string | null;
		/**
		 * Subscribes listener on specified global event
		 * @param {object} target
		 * @param {string} eventName
		 * @param {Function<BaseEvent>} listener
		 * @param {object} options
		 */
		static subscribe(target: any, eventName: any, listener?: any, options?: any): void;
		/**
		 * Subscribes a listener on a specified event
		 * @param {string} eventName
		 * @param {Function<BaseEvent>} listener
		 * @return {this}
		 */
		subscribe(eventName: string, listener: (event: BaseEvent) => void): this;
		/**
		 *
		 * @param {object} options
		 * @param {object} [aliases]
		 * @param {boolean} [compatMode=false]
		 */
		subscribeFromOptions(options: {
			[eventName: string]: Function;
		} | Array<{
			[eventName: string]: Function;
		}>, aliases?: {
			[alias: string]: {
				eventName: string;
				namespace: string;
			};
		}, compatMode?: boolean): void;
		/**
		 * Subscribes a listener that is called at
		 * most once for a specified event.
		 * @param {object} target
		 * @param {string} eventName
		 * @param {Function<BaseEvent>} listener
		 */
		static subscribeOnce(target: any, eventName: any, listener?: any): void;
		/**
		 * Subscribes a listener that is called at most once for a specified event.
		 * @param {string} eventName
		 * @param {Function<BaseEvent>} listener
		 * @return {this}
		 */
		subscribeOnce(eventName: string, listener: (event: BaseEvent) => void): this;
		/**
		 * Unsubscribes an event listener
		 * @param {object} target
		 * @param {string} eventName
		 * @param {Function<BaseEvent>} listener
		 * @param options
		 */
		static unsubscribe(target: any, eventName: any, listener?: any, options?: any): void;
		/**
		 * Unsubscribes an event listener
		 * @param {string} eventName
		 * @param {Function<BaseEvent>} listener
		 * @return {this}
		 */
		unsubscribe(eventName: string, listener: (event: BaseEvent) => void): this;
		/**
		 * Unsubscribes all event listeners
		 * @param {object} target
		 * @param {string} eventName
		 * @param options
		 */
		static unsubscribeAll(target: any, eventName?: any, options?: any): void;
		/**
		 * Unsubscribes all event listeners
		 * @param {string} [eventName]
		 */
		unsubscribeAll(eventName?: string): void;
		/**
		 *
		 * @param {object} target
		 * @param {string} eventName
		 * @param {BaseEvent | any} event
		 * @param {object} options
		 * @returns {Array}
		 */
		static emit(target: any, eventName?: any, event?: any, options?: any): Array<any>;
		/**
		 * Emits specified event with specified event object
		 * @param {string} eventName
		 * @param {BaseEvent | any} event
		 * @return {this}
		 */
		emit(eventName: string, event?: BaseEvent | {
			[key: string]: any;
		}): this;
		/**
		 * Emits global event and returns a promise that is resolved when
		 * all promise returned from event handlers are resolved,
		 * or rejected when at least one of the returned promise is rejected.
		 * Importantly. You can return any value from synchronous handlers, not just promise
		 * @param {object} target
		 * @param {string} eventName
		 * @param {BaseEvent | any} event
		 * @return {Promise<Array>}
		 */
		static emitAsync(target: any, eventName?: any, event?: any): Promise<Array<any>>;
		/**
		 * Emits event and returns a promise that is resolved when
		 * all promise returned from event handlers are resolved,
		 * or rejected when at least one of the returned promise is rejected.
		 * Importantly. You can return any value from synchronous handlers, not just promise
		 * @param {string} eventName
		 * @param {BaseEvent|any} event
		 * @return {Promise<Array>}
		 */
		emitAsync(eventName: string, event?: BaseEvent | {
			[key: string]: any;
		}): Promise<Array<any>>;
		/**
		 * @private
		 * @param {object} target
		 * @param {string} eventName
		 * @param {BaseEvent|any} event
		 * @returns {BaseEvent}
		 */
		static prepareEvent(target: any, eventName: string, event?: BaseEvent | {
			[key: string]: any;
		}): BaseEvent;
		/**
		 * @private
		 * @returns {number}
		 */
		static getNextSequenceValue(): number;
		/**
		 * Sets max global events listeners count
		 * Event.EventEmitter.setMaxListeners(10) - sets the default value for all events (global target)
		 * Event.EventEmitter.setMaxListeners("onClose", 10) - sets the value for onClose event (global target)
		 * Event.EventEmitter.setMaxListeners(obj, 10) - sets the default value for all events (obj target)
		 * Event.EventEmitter.setMaxListeners(obj, "onClose", 10); - sets the value for onClose event (obj target)
		 * @return {void}
		 * @param args
		 */
		static setMaxListeners(...args: any[]): void;
		/**
		 * Sets max events listeners count
		 * this.setMaxListeners(10) - sets the default value for all events
		 * this.setMaxListeners("onClose", 10) sets the value for onClose event
		 * @return {this}
		 * @param args
		 */
		setMaxListeners(...args: any[]): this;
		/**
		 * Returns max event listeners count
		 * @param {object} target
		 * @param {string} [eventName]
		 * @returns {number}
		 */
		static getMaxListeners(target: any, eventName?: string): number;
		/**
		 * Returns max event listeners count
		 * @param {string} [eventName]
		 * @returns {number}
		 */
		getMaxListeners(eventName?: string): number;
		/**
		 * Adds or subtracts max listeners count
		 * Event.EventEmitter.addMaxListeners() - adds one max listener for all events of global target
		 * Event.EventEmitter.addMaxListeners(3) - adds three max listeners for all events of global target
		 * Event.EventEmitter.addMaxListeners(-1) - subtracts one max listener for all events of global target
		 * Event.EventEmitter.addMaxListeners('onClose') - adds one max listener for onClose event of global target
		 * Event.EventEmitter.addMaxListeners('onClose', 2) - adds two max listeners for onClose event of global target
		 * Event.EventEmitter.addMaxListeners('onClose', -1) - subtracts one max listener for onClose event of global target
		 *
		 * Event.EventEmitter.addMaxListeners(obj) - adds one max listener for all events of 'obj' target
		 * Event.EventEmitter.addMaxListeners(obj, 3) - adds three max listeners for all events of 'obj' target
		 * Event.EventEmitter.addMaxListeners(obj, -1) - subtracts one max listener for all events of 'obj' target
		 * Event.EventEmitter.addMaxListeners(obj, 'onClose') - adds one max listener for onClose event of 'obj' target
		 * Event.EventEmitter.addMaxListeners(obj, 'onClose', 2) - adds two max listeners for onClose event of 'obj' target
		 * Event.EventEmitter.addMaxListeners(obj, 'onClose', -1) - subtracts one max listener
		 *   for onClose event of 'obj' target
		 * @param args
		 * @returns {number}
		 */
		static addMaxListeners(...args: any[]): number;
		/**
		 * Increases max listeners count
		 *
		 * Event.EventEmitter.incrementMaxListeners() - adds one max listener for all events of global target
		 * Event.EventEmitter.incrementMaxListeners(3) - adds three max listeners for all events of global target
		 * Event.EventEmitter.incrementMaxListeners('onClose') - adds one max listener for onClose event of global target
		 * Event.EventEmitter.incrementMaxListeners('onClose', 2) - adds two max listeners for onClose event of global target
		 *
		 * Event.EventEmitter.incrementMaxListeners(obj) - adds one max listener for all events of 'obj' target
		 * Event.EventEmitter.incrementMaxListeners(obj, 3) - adds three max listeners for all events of 'obj' target
		 * Event.EventEmitter.incrementMaxListeners(obj, 'onClose') - adds one max listener for onClose event of 'obj' target
		 * Event.EventEmitter.incrementMaxListeners(obj, 'onClose', 2) - adds two max listeners
		 *   for onClose event of 'obj' target
		 */
		static incrementMaxListeners(...args: any[]): number;
		/**
		 * Increases max listeners count
		 * this.incrementMaxListeners() - adds one max listener for all events
		 * this.incrementMaxListeners(3) - adds three max listeners for all events
		 * this.incrementMaxListeners('onClose') - adds one max listener for onClose event
		 * this.incrementMaxListeners('onClose', 2) - adds two max listeners for onClose event
		 */
		incrementMaxListeners(...args: any[]): number;
		/**
		 * Decreases max listeners count
		 *
		 * Event.EventEmitter.decrementMaxListeners() - subtracts one max listener for all events of global target
		 * Event.EventEmitter.decrementMaxListeners(3) - subtracts three max listeners for all events of global target
		 * Event.EventEmitter.decrementMaxListeners('onClose') - subtracts one max listener for onClose event of global target
		 * Event.EventEmitter.decrementMaxListeners('onClose', 2) - subtracts two max listeners
		 *   for onClose event of global target
		 *
		 * Event.EventEmitter.decrementMaxListeners(obj) - subtracts one max listener
		 *   for all events of 'obj' target
		 * Event.EventEmitter.decrementMaxListeners(obj, 3) - subtracts three max listeners
		 *   for all events of 'obj' target
		 * Event.EventEmitter.decrementMaxListeners(obj, 'onClose') - subtracts one max listener
		 *   for onClose event of 'obj' target
		 * Event.EventEmitter.decrementMaxListeners(obj, 'onClose', 2) - subtracts two max listeners
		 *   for onClose event of 'obj' target
		 */
		static decrementMaxListeners(...args: any[]): number;
		/**
		 * Increases max listeners count
		 * this.decrementMaxListeners() - subtracts one max listener for all events
		 * this.decrementMaxListeners(3) - subtracts three max listeners for all events
		 * this.decrementMaxListeners('onClose') - subtracts one max listener for onClose event
		 * this.decrementMaxListeners('onClose', 2) - subtracts two max listeners for onClose event
		 */
		decrementMaxListeners(...args: any[]): number;
		/**
		 * @private
		 * @param {Array} args
		 * @returns Array
		 */
		static destructMaxListenersArgs(...args: any[]): any[];
		/**
		 * Gets listeners list for a specified event
		 * @param {object} target
		 * @param {string} eventName
		 */
		static getListeners(target: any, eventName?: any): Map<any, any>;
		/**
		 * Gets listeners list for specified event
		 * @param {string} eventName
		 */
		getListeners(eventName: string): Map<any, any>;
		/**
		 * Returns a full event name with namespace
		 * @param {string} eventName
		 * @returns {string}
		 */
		getFullEventName(eventName: string): string;
		/**
		 * Registers aliases (old event names for BX.onCustomEvent)
		 * @param aliases
		 */
		static registerAliases(aliases: any): void;
		/**
		 * @private
		 * @param aliases
		 */
		static normalizeAliases(aliases: any): Record<string, any>;
		/**
		 * @private
		 */
		static mergeEventAliases(aliases: Record<string, any>): void;
		/**
		 * Returns true if the target is an instance of Event.EventEmitter
		 * @param {object} target
		 * @returns {boolean}
		 */
		static isEventEmitter(target: any): boolean;
		/**
		 * @private
		 * @param {string} eventName
		 * @returns {string}
		 */
		static normalizeEventName(eventName: string): string;
		/**
		 * @private
		 */
		static normalizeListener(listener: any): Function;
		/**
		 * @private
		 * @param eventName
		 * @param target
		 * @param useGlobalNaming
		 * @returns {string}
		 */
		static resolveEventName(eventName: string, target: any, useGlobalNaming?: boolean): string;
		/**
		 * @private
		 * @param {string} namespace
		 * @param {string} eventName
		 * @returns {string}
		 */
		static makeFullEventName(namespace: string | null, eventName: string): string;
	}

	/**
	 * @memberof BX.UI.EntitySelector
	 */
	class Tab {
		constructor(dialog: Dialog, tabOptions: TabOptions);
		id: string;
		title: TextNode | null;
		rootNode: ItemNode;
		dialog: Dialog;
		stub: BaseStub;
		visible: boolean;
		rendered: boolean;
		locked: boolean;
		selected: boolean;
		hovered: boolean;
		icon: TabLabelStates;
		textColor: TabLabelStates;
		bgColor: TabLabelStates;
		itemMaxDepth: number;
		header: BaseHeader;
		showDefaultHeader: boolean;
		footer: BaseFooter;
		showDefaultFooter: boolean;
		showAvatars: boolean | null;
		cache: import("../../../../../../../../main/install/js/main/core/src/lib/cache/memory-cache").default<any>;
		getId(): string;
		/**
		 * @internal
		 */
		setDialog(dialog: Dialog): void;
		getDialog(): Dialog;
		getStub(): BaseStub | null;
		setStub(stub?: boolean | string | Function, stubOptions?: {
			[option: string]: any;
		}): void;
		getHeader(): BaseHeader | null;
		setHeader(headerContent: HeaderContent | null, headerOptions?: HeaderOptions): void;
		canShowDefaultHeader(): boolean;
		enableDefaultHeader(): void;
		disableDefaultHeader(): void;
		getFooter(): BaseFooter | null;
		setFooter(footerContent: FooterContent | null, footerOptions?: FooterOptions): void;
		canShowDefaultFooter(): boolean;
		enableDefaultFooter(): void;
		disableDefaultFooter(): void;
		setShowAvatars(flag: boolean | null): void;
		shouldShowAvatars(): boolean;
		getRootNode(): ItemNode;
		setTitle(title: (string | TextNodeOptions) | null): void;
		getTitle(): string;
		getTitleNode(): TextNode | null;
		setIcon(icon: TabLabelStates | string): void;
		getIcon(state?: TabLabelState): string | null;
		setBgColor(bgColor: TabLabelStates | string): void;
		getBgColor(state?: TabLabelState): string | null;
		setTextColor(textColor: TabLabelStates | string): void;
		getTextColor(state?: TabLabelState): string | null;
		/**
		 * @private
		 */
		private setProperty;
		/**
		 * @private
		 */
		private getPropertyByState;
		/**
		 * @private
		 */
		private getPropertyByCurrentState;
		setItemMaxDepth(depth: number): void;
		getItemMaxDepth(): number;
		getContainer(): HTMLElement;
		getLabelContainer(): HTMLElement;
		getIconContainer(): HTMLElement;
		getTitleContainer(): HTMLElement;
		getItemsContainer(): HTMLElement;
		render(): void;
		/** @internal **/
		renderLabel(): void;
		/** @internal **/
		renderContainer(): void;
		isVisible(): boolean;
		setVisible(flag: boolean): void;
		isRendered(): boolean;
		/**
		 * @internal
		 */
		select(): void;
		/**
		 * @internal
		 */
		deselect(): void;
		hover(): void;
		unhover(): void;
		isSelected(): boolean;
		isHovered(): boolean;
		lock(): void;
		unlock(): void;
		isLocked(): boolean;
		handleLabelClick(): void;
		handleLabelMouseEnter(): void;
		handleLabelMouseLeave(): void;
	}

	class BaseHeader {
		constructor(context: Dialog | Tab, options: HeaderOptions);
		dialog: Dialog;
		tab: Tab;
		container: HTMLElement | null;
		cache: import("../../../../../../../../main/install/js/main/core/src/lib/cache/memory-cache").default<any>;
		options: Record<string, unknown>;
		getDialog(): Dialog;
		getTab(): Tab | null;
		show(): void;
		hide(): void;
		getOptions(): HeaderOptions;
		getOption(option: string, defaultValue?: any): any;
		getContainer(): HTMLElement;
		/**
		 * @abstract
		 */
		render(): HTMLElement;
	}

	class BaseFooter {
		constructor(context: Dialog | Tab, options: FooterOptions);
		dialog: Dialog;
		tab: Tab;
		container: HTMLElement | null;
		cache: import("../../../../../../../../main/install/js/main/core/src/lib/cache/memory-cache").default<any>;
		options: Record<string, unknown>;
		getDialog(): Dialog;
		getTab(): Tab | null;
		show(): void;
		hide(): void;
		getOptions(): FooterOptions;
		getOption(option: string, defaultValue?: any): any;
		getContainer(): HTMLElement;
		/**
		 * @abstract
		 */
		render(): HTMLElement;
	}

	/**
	 * @memberof BX.UI.EntitySelector
	 * @package ui.entity-selector
	 */
	class Item {
		constructor(itemOptions: ItemOptions);
		id: string | number;
		entityId: string;
		entityType: string;
		title: TextNode | null;
		subtitle: TextNode | null;
		supertitle: TextNode | null;
		caption: TextNode | null;
		captionOptions: CaptionOptions;
		avatar: string | null;
		avatarOptions: AvatarOptions | null;
		textColor: string | null;
		link: string | null;
		linkTitle: TextNode | null;
		tagOptions: Map<string, any>;
		badges: ItemBadgeOptions[];
		badgesOptions: BadgesOptions;
		dialog: Dialog;
		nodes: Set<ItemNode>;
		selected: boolean;
		searchable: boolean;
		saveable: boolean;
		deselectable: boolean;
		hidden: boolean;
		locked: boolean;
		searchIndex: {
			[key: string]: string[];
		};
		customData: Map<string, any>;
		sort: number;
		contextSort: number;
		globalSort: number;
		getId(): string | number;
		getEntityId(): string;
		getEntity(): Entity;
		getEntityType(): string;
		getTitle(): string;
		getTitleNode(): TextNode | null;
		setTitle(title: (string | TextNodeOptions) | null): void;
		getSubtitle(): string | null;
		getSubtitleNode(): TextNode | null;
		setSubtitle(subtitle: (string | TextNodeOptions) | null): void;
		getSupertitle(): string | null;
		getSupertitleNode(): TextNode | null;
		setSupertitle(supertitle: (string | TextNodeOptions) | null): void;
		getCaption(): string | null;
		getCaptionNode(): TextNode | null;
		setCaption(caption: (string | TextNodeOptions) | null): void;
		getCaptionOption(option: string): string | boolean | number | null;
		setCaptionOption(option: string, value: string | boolean | number | null): void;
		setCaptionOptions(options: {
			[key: string]: any;
		}): void;
		getAvatar(): string | null;
		setAvatar(avatar: string | null): void;
		getAvatarOption(option: $Keys<AvatarOptions>): string | boolean | number | null;
		setAvatarOption(option: $Keys<AvatarOptions>, value: string | boolean | number | null): void;
		setAvatarOptions(options: AvatarOptions): void;
		getTextColor(): string | null;
		setTextColor(textColor: string | null): void;
		getLink(): string | null;
		setLink(link: string | null): void;
		getLinkTitle(): string | null;
		getLinkTitleNode(): TextNode | null;
		setLinkTitle(linkTitle: (string | TextNodeOptions) | null): void;
		getBadges(): ItemBadge[];
		setBadges(badges: ItemBadgeOptions[] | null): void;
		getBadgesOption(option: string): string | boolean | number | null;
		setBadgesOption(option: string, value: string | boolean | number | null): void;
		setBadgesOptions(options: {
			[key: string]: any;
		}): void;
		/**
		 * @internal
		 */
		setDialog(dialog: Dialog): void;
		getDialog(): Dialog;
		createNode(nodeOptions: ItemNodeOptions): ItemNode;
		removeNode(node: ItemNode): void;
		getNodes(): Set<ItemNode>;
		select(selectOptions?: ItemSelectOptions): void;
		deselect(deselectOptions?: ItemSelectOptions): void;
		isSelected(): boolean;
		setSearchable(flag: boolean): void;
		isSearchable(): boolean;
		setSaveable(flag: boolean): void;
		isSaveable(): boolean;
		setDeselectable(flag: boolean): void;
		isDeselectable(): boolean;
		setHidden(flag: boolean): void;
		isHidden(): boolean;
		lock(): void;
		unlock(): void;
		isLocked(): boolean;
		setContextSort(sort: number | null): void;
		getContextSort(): number | null;
		setGlobalSort(sort: number | null): void;
		getGlobalSort(): number | null;
		setSort(sort: number | null): void;
		getSort(): number | null;
		getSearchIndex(): SearchIndex;
		resetSearchIndex(): void;
		getCustomData(): Map<string, any>;
		setCustomData(property: (string | {
			[key: string]: any;
		}) | null, value?: any): void;
		isRendered(): boolean;
		getEntityItemOption(option: any): any;
		getEntityTagOption(option: any): any;
		getEntityTextNode(option: any): any;
		getTagOptions(): Map<string, any>;
		getTagOption(option: string): any;
		getTagGlobalOption(option: string, useItemOptions?: boolean): any;
		getTagBgColor(): string | null;
		getTagTextColor(): string | null;
		getTagMaxWidth(): number | null;
		getTagFontWeight(): string | null;
		getTagAvatar(): string | null;
		getTagAvatarOptions(): AvatarOptions | null;
		getTagLink(): string | null;
		/**
		 * @internal
		 */
		replaceMacros(str: string): string;
		/**
		 * @internal
		 */
		createTag(): TagItemOptions;
		getAjaxJson(): {
			[key: string]: any;
		};
		toJSON(): {
			[key: string]: any;
		};
	}

	/**
	 * @memberof BX.UI.EntitySelector
	 */
	class Entity {
		static extensions: string[];
		static defaultOptions: {
			[entityId: string]: {
				[key: string]: any;
			};
		};
		static getDefaultOptions(): {
			[entityId: string]: {
				[key: string]: any;
			};
		};
		static getExtensions(): string[];
		static getEntityDefaultOptions(entityId: string): {
			[key: string]: any;
		};
		static getItemOptions(entityId: string, entityType: string): any;
		static getTagOptions(entityId: string, entityType?: string): any;
		static getItemOption(entityId: string, option: string, entityType?: string): any;
		static getTagOption(entityId: string, option: string, entityType?: string): any;
		static getOptionInternal(options: any, option: string, type?: string): any;
		constructor(entityOptions: EntityOptions);
		id: string;
		options: {
			[key: string]: any;
		};
		searchable: boolean;
		searchFields: OrderedArray<SearchField>;
		dynamicLoad: boolean;
		dynamicSearch: boolean;
		dynamicSearchMatchMode: "all" | "exact";
		substituteEntityId: string;
		fillRecentItems: boolean;
		searchCacheLimits: RegExp[];
		filters: Map<string, EntityFilter>;
		itemOptions: {
			[key: string]: any;
		};
		tagOptions: {
			[key: string]: any;
		};
		badgeOptions: ItemBadgeOptions[];
		textNodes: Map<string, Map<string, TextNode>>;
		getId(): string;
		getOptions(): {
			[key: string]: any;
		};
		getItemOptions(): {
			[key: string]: any;
		};
		getItemOption(option: string, entityType?: string): any;
		getTagOptions(): {
			[key: string]: any;
		};
		getTagOption(option: string, entityType?: string): any;
		getBadges(item: Item): EntityBadgeOptions[];
		getOptionTextNode(option: string, entityType?: string): TextNode | null;
		isSearchable(): boolean;
		setSearchable(flag: boolean): void;
		getSearchFields(): OrderedArray<SearchField>;
		setSearchFields(searchFields: SearchFieldOptions[]): void;
		setSearchCacheLimits(limits: string[]): void;
		getSearchCacheLimits(): RegExp[];
		hasDynamicLoad(): boolean;
		setDynamicLoad(flag: boolean): void;
		hasDynamicSearch(): boolean;
		setDynamicSearch(flag: boolean): void;
		setDynamicSearchMatchMode(mode: "all" | "exact"): void;
		getDynamicSearchMatchMode(): "all" | "exact";
		getFilters(): EntityFilter[];
		addFilters(filters: EntityFilterOptions[]): void;
		addFilter(filterOptions: EntityFilterOptions): void;
		getFilter(id: string): Filter | null;
		getSubstituteEntityId(): string | null;
		shouldFillRecentItems(): boolean;
		toJSON(): {
			id: string;
			options: {
				[key: string]: any;
			};
			searchable: boolean;
			dynamicLoad: boolean;
			dynamicSearch: boolean;
			filters: EntityFilter[];
			substituteEntityId: string | null;
			fillRecentItems: boolean;
		};
	}

	/**
	 * @memberof BX.Main
	 */
	class Popup extends EventEmitter {
		/**
		 * @private
		 */
		private static options;
		/**
		 * @private
		 */
		private static defaultOptions;
		static setOptions(options: {
			[name: string]: any;
		}): void;
		static getOption(option: string, defaultValue?: any): string | number | undefined;
		static shouldUseFocusTrapByDefault(): boolean;
		constructor(options?: PopupOptions, ...args: any[]);
		compatibleMode: any;
		params: any;
		/**
		 * @private
		 */
		private uniquePopupId;
		buttons: any;
		offsetTop: string | number | undefined;
		offsetLeft: string | number | undefined;
		firstShow: boolean;
		bordersWidth: number;
		bindElementPos: any;
		closeIcon: any;
		resizeIcon: any;
		angle: {
			element: any;
			position: string;
			offset: number;
			defaultOffset: number;
		} | null;
		angleArrowElement: any;
		overlay: {
			element: any;
		} | null;
		titleBar: any;
		bindOptions: any;
		autoHide: boolean;
		disableScroll: boolean;
		autoHideHandler: any;
		isAutoHideBinded: boolean;
		closeByEsc: boolean;
		isCloseByEscBinded: boolean;
		toFrontOnShow: boolean;
		cacheable: boolean;
		destroyed: boolean;
		fixed: boolean;
		width: any;
		height: any;
		minWidth: any;
		minHeight: any;
		maxWidth: any;
		maxHeight: any;
		padding: number | null;
		contentPadding: number | null;
		background: string | null;
		contentBackground: string | null;
		borderRadius: string | null;
		contentBorderRadius: string | null;
		dragOptions: {
			cursor: string;
			callback: () => void;
			eventName: string;
		};
		dragged: boolean;
		dragPageX: number;
		dragPageY: number;
		animationShowClassName: string | null;
		animationCloseClassName: string | null;
		animationCloseEventType: string | null;
		/**
		 * @private
		 */
		private handleDocumentMouseMove;
		/**
		 * @private
		 */
		private handleDocumentMouseUp;
		/**
		 * @private
		 */
		private handleResizeWindow;
		/**
		 * @private
		 */
		private handleResize;
		/**
		 * @private
		 */
		private handleMove;
		/**
		 * @private
		 */
		private onTitleMouseDown;
		/**
		 * @private
		 */
		private handleFullScreen;
		designSystemContext: string;
		/**
		 * @private
		 */
		private contentContainer;
		/**
		 * @private
		 */
		private popupContainer;
		zIndexComponent: ZIndexComponent | null | undefined;
		buttonsContainer: any;
		/**
		 * @private
		 */
		private subscribeFromOptions;
		getId(): string;
		isCompatibleMode(): boolean;
		setContent(content: string | Element | Node): void;
		setButtons(buttons: []): void;
		getButtons(): [];
		getButton(id: string): any;
		setBindElement(bindElement: Element | {
			left: number;
			top: number;
		} | null | MouseEvent): void;
		bindElement: Element | MouseEvent | {
			left: number;
			top: number;
		} | {
			left: any;
			top: any;
			bottom: any;
		} | null | undefined;
		/**
		 * @private
		 */
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
		setAngle(params: {
			offset: number;
			position?: "top" | "bottom" | "left" | "right";
		}): void;
		getWidth(): number;
		setWidth(width: number): void;
		getHeight(): number;
		setHeight(height: number): void;
		getMinWidth(): number;
		setMinWidth(width: number): void;
		getMinHeight(): number;
		setMinHeight(height: number): void;
		getMaxWidth(): number;
		setMaxWidth(width: number): void;
		getMaxHeight(): number;
		setMaxHeight(height: number): void;
		/**
		 * @private
		 */
		private setWidthProperty;
		/**
		 * @private
		 */
		private setHeightProperty;
		setPadding(padding: number): void;
		getPadding(): number;
		setContentPadding(padding: number): void;
		getContentPadding(): number;
		setBorderRadius(radius: any): void;
		setContentBorderRadius(radius: any): void;
		setContentColor(color: string | null): void;
		setBackground(background: string | null): void;
		getBackground(): string | null;
		setContentBackground(background: string | null): void;
		getContentBackground(): string | null;
		isDestroyed(): boolean;
		setCacheable(cacheable: boolean): void;
		isCacheable(): boolean;
		getFocusTrap(): FocusTrap | null;
		setToFrontOnShow(flag: boolean): void;
		shouldFrontOnShow(): boolean;
		setFixed(flag: boolean): void;
		isFixed(): boolean;
		setResizeMode(mode: boolean): void;
		getDesignSystemContext(): string;
		setDesignSystemContext(context: string): void;
		setTargetContainer(targetContainer: HTMLElement): void;
		targetContainer: any;
		getTargetContainer(): HTMLElement;
		isTargetDocumentBody(): boolean;
		getPopupContainer(): HTMLElement;
		getContentContainer(): HTMLElement;
		getResizableContainer(): HTMLElement;
		getTitleContainer(): HTMLElement;
		/**
		 * @private
		 */
		private handleResizeMouseDown;
		resizeContentPos: DOMRect | undefined;
		resizeContentOffset: number | undefined;
		isTopAngle(): boolean;
		isBottomAngle(): boolean;
		isTopOrBottomAngle(): boolean;
		/**
		 * @private
		 */
		private getAngleHeight;
		setOffset(params: {
			offsetTop: number;
			offsetLeft: number;
		}): void;
		setTitleBar(params: string | {
			content: string;
		}): void;
		setDraggable(draggable: PopupDraggable): void;
		setClosingByEsc(enable: boolean): void;
		/**
		 * @private
		 */
		private bindClosingByEsc;
		/**
		 * @private
		 */
		private unbindClosingByEsc;
		setAutoHide(enable: boolean): void;
		/**
		 * @private
		 */
		private bindAutoHide;
		/**
		 * @private
		 */
		private unbindAutoHide;
		/**
		 * @private
		 */
		private handleAutoHide;
		/**
		 * @private
		 */
		private _tryCloseByEvent;
		/**
		 * @private
		 */
		private tryCloseByEvent;
		/**
		 * @private
		 */
		private handleOverlayClick;
		setOverlay(params: PopupOverlay): void;
		isModal(): boolean;
		hasOverlay(): boolean;
		removeOverlay(): void;
		overlayTimeout: number | null | undefined;
		hideOverlay(): void;
		showOverlay(): void;
		resizeOverlay(): void;
		getZindex(): number;
		getZIndexComponent(): ZIndexComponent;
		setDisableScroll(flag: boolean): void;
		show(): void;
		close(): void;
		bringToFront(): void;
		toggle(): void;
		/**
		 *
		 * @private
		 */
		private animateOpening;
		/**
		 * @private
		 */
		private animateClosing;
		setAnimation(options: PopupAnimationOptions): void;
		isShown(): boolean;
		destroy(): void;
		adjustPosition(bindOptions: {
			forceBindPosition?: boolean;
			forceLeft?: boolean;
			forceTop?: boolean;
			position?: "top" | "bootom";
		}): void;
		enterFullScreen(): void;
		/**
		 * @private
		 */
		private handleCloseIconClick;
		/**
		 * @private
		 */
		private handleContainerClick;
		/**
		 * @private
		 */
		private handleDocumentKeyUp;
	}

	declare class LoadState {
		static UNSENT: string;
		static LOADING: string;
		static DONE: string;
	}

	class Loader {
		constructor(options?: {});
		data: {
			container: any;
			circle: any;
		};
		state: string;
		currentTarget: null;
		get layout(): any;
		get circle(): any;
		createLayout(): any;
		show(target?: null): Promise<any>;
		hide(): Promise<any>;
		isShown(): boolean;
		destroy(): void;
		setOptions({ target, size, color, offset, mode, strokeWidth }: {
			target: any;
			size: any;
			color: any;
			offset: any;
			mode: any;
			strokeWidth: any;
		}): void;
	}

	/**
	 * @memberof BX.UI.EntitySelector
	 */
	class TagSelector extends EventEmitter {
		constructor(selectorOptions: TagSelectorOptions);
		tags: TagItem[];
		cache: import("../../../../../../../main/install/js/main/core/src/lib/cache/memory-cache").default<any>;
		rendered: false;
		multiple: boolean;
		readonly: boolean;
		locked: boolean;
		deselectable: boolean;
		addButtonCaption: string | null;
		addButtonCaptionMore: string | null;
		createButtonCaption: string | null;
		addButtonVisible: boolean;
		createButtonVisible: boolean;
		textBoxVisible: boolean;
		textBoxWidth: string | number | null;
		maxHeight: number | null;
		placeholder: string;
		textBoxAutoHide: boolean;
		textBoxOldValue: string;
		tagAvatar: string | null;
		tagAvatarOptions: AvatarOptions | null;
		tagTextColor: string | null;
		tagBgColor: string | null;
		tagFontWeight: string | null;
		tagMaxWidth: number | null;
		tagClickable: boolean;
		dialog: Dialog | null;
		id: string;
		getDialog(): Dialog | null;
		/**
		 * @internal
		 * @param dialog
		 */
		setDialog(dialog: Dialog | null): void;
		setReadonly(flag: boolean): void;
		isReadonly(): boolean;
		setLocked(flag: boolean): void;
		lock(): void;
		unlock(): void;
		isLocked(): boolean;
		isMultiple(): boolean;
		setDeselectable(flag: boolean): void;
		isDeselectable(): boolean;
		getTag(tagItem: TagItem | ItemOptions): TagItem | null;
		addTag(tagOptions: TagItemOptions): TagItem | null;
		removeTag(item: TagItem | ItemOptions, animate?: boolean): void;
		removeTags(): void;
		getTags(): TagItem[];
		renderTo(node: HTMLElement): void;
		isRendered(): boolean;
		/**
		 * @private
		 */
		private updateTags;
		getOuterContainer(): HTMLElement;
		getContainer(): HTMLElement;
		getItemsContainer(): HTMLElement;
		getTextBox(): HTMLInputElement;
		getItemsHeight(): number;
		calcHeight(): number;
		getTextBoxValue(): string;
		clearTextBox(): void;
		showTextBox(): void;
		hideTextBox(): void;
		focusTextBox(): void;
		setTextBoxAutoHide(autoHide: boolean): void;
		getTextBoxWidth(): string | number | null;
		setTextBoxWidth(width: string | number | null): void;
		getTagMaxWidth(): number | null;
		setTagMaxWidth(width: number | null): void;
		getTagAvatar(): string | null;
		setTagAvatar(tagAvatar: string | null): void;
		getTagClickable(): boolean | null;
		setTagClickable(flag: boolean | null): void;
		getTagAvatarOptions(): AvatarOptions | null;
		getTagAvatarOption(option: $Keys<AvatarOptions>): string | boolean | number | null;
		setTagAvatarOption(option: $Keys<AvatarOptions>, value: string | boolean | number | null): void;
		setTagAvatarOptions(options: AvatarOptions): void;
		getTagTextColor(): string | null;
		setTagTextColor(textColor: string | null): void;
		getTagBgColor(): string | null;
		setTagBgColor(bgColor: string | null): void;
		getTagFontWeight(): string | null;
		setTagFontWeight(fontWeight: string | null): void;
		getPlaceholder(): string;
		setPlaceholder(placeholder: string): void;
		getMaxHeight(): number | null;
		getMinHeight(): number;
		setMaxHeight(height: number | null): void;
		getAddButton(): HTMLElement;
		getAddButtonLink(): HTMLElement;
		getAddButtonCaption(): string;
		setAddButtonCaption(caption: string): void;
		getAddButtonCaptionMore(): string | null;
		setAddButtonCaptionMore(caption: string): void;
		toggleAddButtonCaption(): void;
		getActualButtonCaption(): string;
		showAddButton(): void;
		hideAddButton(): void;
		getCreateButton(): HTMLElement;
		showCreateButton(): void;
		hideCreateButton(): void;
		getCreateButtonCaption(): string;
		setCreateButtonCaption(caption: string): void;
		handleContainerClick(event: MouseEvent): void;
		handleTextBoxInput(event: InputEvent): void;
		handleTextBoxBlur(event: FocusEvent): void;
		handleTextBoxKeyUp(event: KeyboardEvent): void;
		handleTextBoxKeyDown(event: KeyboardEvent): void;
		handleAddButtonClick(event: MouseEvent): void;
		handleCreateButtonClick(event: MouseEvent): void;
	}

	declare class TagSelectorMode {
		static INSIDE: string;
		static OUTSIDE: string;
	}

	class Navigation {
		static keyMap: {
			[x: string]: string;
		};
		constructor(dialog: Dialog);
		dialog: Dialog;
		lockedTab: Tab;
		enabled: boolean;
		handleDocumentKeyDown(event: KeyboardEvent): void;
		handleDocumentMouseMove(): void;
		getDialog(): Dialog;
		enable(): void;
		disable(): void;
		isEnabled(): boolean;
		bindEvents(): void;
		unbindEvents(): void;
		getNextNode(): ItemNode | null;
		getPreviousNode(): ItemNode | null;
		getFirstNode(): ItemNode | null;
		getLastNode(): ItemNode | null;
		getActiveNode(): ItemNode | null;
		focusOnNode(node: ItemNode): void;
		lockTab(): void;
		unlockTab(): void;
		handleDialogShow(): void;
		handleDialogHide(): void;
		handleDialogDestroy(): void;
		handleArrowDownPress(): void;
		handleArrowUpPress(): void;
		handleArrowRightPress(): void;
		handleArrowLeftPress(): void;
		handleEnterPress(): void;
		handleTabPress(event: KeyboardEvent): void;
	}

	class ItemNode {
		static "__#private@#isEllipsisActive"(element: HTMLElement): boolean;
		static "__#private@#sanitizeTitle"(text: string): string;
		constructor(item: Item, nodeOptions: ItemNodeOptions);
		item: Item;
		tab: Tab;
		cache: import("../../../../../../../main/install/js/main/core/src/lib/cache/memory-cache").default<any>;
		parentNode: ItemNode;
		children: OrderedArray<ItemNode>;
		childItems: WeakMap<Item, ItemNode>;
		loaded: boolean;
		dynamic: boolean;
		dynamicPromise: Promise | null;
		loader: Loader;
		open: boolean;
		autoOpen: boolean;
		focused: boolean;
		renderMode: RenderMode;
		title: TextNode | null;
		subtitle: TextNode | null;
		supertitle: TextNode | null;
		caption: TextNode | null;
		captionOptions: CaptionOptions;
		avatar: string | null;
		avatarOptions: AvatarOptions | null;
		link: string | null;
		linkTitle: TextNode | null;
		textColor: string | null;
		badges: ItemBadgeOptions[];
		badgesOptions: BadgesOptions;
		hidden: boolean;
		highlights: MatchField[];
		rendered: false;
		renderWithDebounce: Function;
		getItem(): Item;
		isRoot(): boolean;
		getDialog(): Dialog;
		setTab(tab: Tab): void;
		getTab(): Tab;
		getParentNode(): ItemNode | null;
		setParentNode(parentNode: ItemNode): void;
		getNextSibling(): ItemNode | null;
		getPreviousSibling(): ItemNode | null;
		addChildren(children: ItemOptions[]): void;
		addChild(child: ItemNode): ItemNode;
		getDepthLevel(): number;
		addItem(item: Item, nodeOptions: ItemNodeOptions): ItemNode;
		addItems(items: Item[] | Array<[Item, ItemNodeOptions]>): void;
		hasItem(item: Item): boolean;
		removeChild(child: ItemNode): boolean;
		removeChildren(): void;
		hasChild(child: ItemNode): boolean;
		isChildOf(parent: ItemNode): boolean;
		getFirstChild(): ItemNode | null;
		getLastChild(): ItemNode | null;
		getChildren(): OrderedArray<ItemNode>;
		hasChildren(): boolean;
		loadChildren(): Promise<any>;
		setOpen(open: boolean): void;
		isOpen(): boolean;
		isAutoOpen(): boolean;
		setAutoOpen(autoOpen: boolean): void;
		setDynamic(dynamic: boolean): void;
		isDynamic(): boolean;
		isLoaded(): boolean;
		getLoader(): Loader;
		showLoader(): void;
		hideLoader(): void;
		destroyLoader(): void;
		expand(): void;
		collapse(): void;
		render(appendChildren?: boolean): void;
		/**
		 * @private
		 */
		private renderRoot;
		/**
		 * @private
		 */
		private renderChildren;
		isRendered(): boolean;
		enableRender(): void;
		disableRender(): void;
		getRenderMode(): RenderMode;
		isHidden(): boolean;
		setHidden(flag: boolean): void;
		toggleVisibility(): boolean;
		lock(): void;
		unlock(): void;
		getTitle(): string;
		getTitleNode(): TextNode | null;
		setTitle(title: string | TextNodeOptions): void;
		getSubtitle(): string | null;
		getSubtitleNode(): TextNode | null;
		setSubtitle(subtitle: string | TextNodeOptions): void;
		getSupertitle(): string | null;
		getSupertitleNode(): TextNode | null;
		setSupertitle(supertitle: string | TextNodeOptions): void;
		getCaption(): string | null;
		getCaptionNode(): TextNode | null;
		setCaption(caption: string | TextNodeOptions): void;
		getCaptionOption(option: string): string | boolean | number | null;
		setCaptionOption(option: string, value: string | boolean | number | null): void;
		setCaptionOptions(options: {
			[key: string]: any;
		} | null): void;
		getAvatar(): string | null;
		setAvatar(avatar: string | null): void;
		getAvatarOption(option: $Keys<AvatarOptions>): string | boolean | number | null;
		setAvatarOption(option: $Keys<AvatarOptions>, value: string | boolean | number | null): void;
		setAvatarOptions(avatarOptions: AvatarOptions): void;
		getTextColor(): string | null;
		setTextColor(textColor: string | null): void;
		getLink(): string | null;
		setLink(link: string): void;
		getLinkTitle(): string | null;
		getLinkTitleNode(): TextNode | null;
		setLinkTitle(title: string | TextNodeOptions): void;
		getBadges(): ItemBadge[];
		setBadges(badges: ItemBadgeOptions[] | null): void;
		getBadgesOption(option: string): string | boolean | number | null;
		setBadgesOption(option: string, value: string | boolean | number | null): void;
		setBadgesOptions(options: {
			[key: string]: any;
		} | null): void;
		getOuterContainer(): HTMLElement;
		getChildrenContainer(): HTMLElement;
		getContainer(): HTMLElement;
		getAvatarContainer(): HTMLElement;
		getTitlesContainer(): HTMLElement;
		getTitleBoxContainer(): HTMLElement;
		getTitleContainer(): HTMLElement;
		getSubtitleContainer(): HTMLElement;
		getSupertitleContainer(): HTMLElement;
		getCaptionContainer(): HTMLElement;
		getIndicatorContainer(): HTMLElement;
		getBadgeContainer(): HTMLElement;
		getLinkContainer(): HTMLElement;
		getLinkTextContainer(): HTMLElement;
		showLink(): void;
		hideLink(): void;
		setHighlights(highlights: MatchField[]): void;
		getHighlights(): MatchField[];
		highlight(): void;
		select(): void;
		deselect(): void;
		focus(): void;
		unfocus(): void;
		isFocused(): boolean;
		click(): void;
		scrollIntoView(): void;
		handleClick(): void;
		handleLinkClick(event: MouseEvent): void;
		handleMouseEnter(): void;
		handleMouseLeave(): void;
	}

	class RecentTab extends Tab {
	}

	class SearchTab extends Tab {
		constructor(dialog: Dialog, tabOptions: TabOptions, searchOptions: SearchOptions);
		lastSearchQuery: SearchQuery | null;
		queryCache: Set<any>;
		queryXhr: null;
		searchLoader: SearchLoader;
		allowCreateItem: boolean;
		loadWithDebounce: Function;
		search(query: string): void;
		getLastSearchQuery(): SearchQuery | null;
		setAllowCreateItem(flag: boolean, options?: {
			[option: string]: any;
		}): void;
		canCreateItem(): boolean;
		appendResults(matchResults: MatchResult[]): void;
		getDynamicEntities(searchQuery: SearchQuery): string[];
		isQueryCacheable(searchQuery: SearchQuery): boolean;
		isQueryLoaded(searchQuery: SearchQuery): boolean;
		addCacheQuery(searchQuery: SearchQuery): void;
		removeCacheQuery(searchQuery: SearchQuery): void;
		shouldLoad(searchQuery: SearchQuery): boolean;
		load(searchQuery: SearchQuery): void;
		getSearchLoader(): SearchLoader;
		clearResults(): void;
		isEmptyResult(): boolean;
		toggleEmptyResult(): void;
	}

	/**
	 * Implements base event object interface
	 */
	class BaseEvent<DataType = any> {
		type: string;
		data: DataType | null;
		target: any;
		compatData: Array<any> | null;
		defaultPrevented: boolean;
		immediatePropagationStopped: boolean;
		errors: Array<BaseError>;
		constructor(options?: {
			data?: any;
			compatData?: Array<any>;
		});
		static create(options: any): BaseEvent;
		/**
		 * Returns the name of the event
		 * @returns {string}
		 */
		getType(): string;
		/**
		 *
		 * @param {string} type
		 */
		setType(type: string): this;
		/**
		 * Returns an event data
		 */
		getData(): DataType | null;
		/**
		 * Sets an event data
		 * @param data
		 */
		setData(data: any): this;
		/**
		 * Returns arguments for BX.addCustomEvent handlers (deprecated).
		 * @returns {array | null}
		 */
		getCompatData(): Array<any> | null;
		/**
		 * Sets arguments for BX.addCustomEvent handlers (deprecated)
		 * @param data
		 */
		setCompatData(data: any): this;
		/**
		 * Sets a event target
		 * @param target
		 */
		setTarget(target: any): this;
		/**
		 * Returns a event target
		 */
		getTarget(): any;
		/**
		 * Returns an array of event errors
		 * @returns {[]}
		 */
		getErrors(): Array<BaseError>;
		/**
		 * Adds an error of the event.
		 * Event listeners can prevent emitter's default action and set the reason of this behavior.
		 * @param error
		 */
		setError(error: BaseError): void;
		/**
		 * Prevents default action
		 */
		preventDefault(): void;
		/**
		 * Checks that is default action prevented
		 * @return {boolean}
		 */
		isDefaultPrevented(): boolean;
		/**
		 * Stops event immediate propagation
		 */
		stopImmediatePropagation(): void;
		/**
		 * Checks that is immediate propagation stopped
		 * @return {boolean}
		 */
		isImmediatePropagationStopped(): boolean;
	}

	class TextNode {
		constructor(options: TextNodeOptions | string);
		text: string | null;
		type: TextNodeType | null;
		getText(): string | null;
		getType(): TextNodeType | null;
		isNullable(): boolean;
		renderTo(element: HTMLElement): void;
		toString(): string;
		toJSON(): string | {
			text: string | null;
			type: TextNodeType | null;
		} | null;
	}

	class BaseStub {
		constructor(tab: Tab, options: {
			[option: string]: any;
		});
		tab: Tab;
		autoShow: boolean;
		cache: import("../../../../../../../../main/install/js/main/core/src/lib/cache/memory-cache").default<any>;
		content: HTMLElement;
		options: Record<string, unknown>;
		/**
		 * @abstract
		 */
		render(): HTMLElement;
		getTab(): Tab;
		getOuterContainer(): any;
		isAutoShow(): boolean;
		show(): void;
		hide(): void;
		getOptions(): {
			[option: string]: any;
		};
		getOption(option: string, defaultValue?: any): any;
	}

	class ItemBadge {
		constructor(badgeOptions: ItemBadgeOptions);
		title: TextNode | null;
		textColor: string | null;
		bgColor: string | null;
		border: string | null;
		containers: WeakMap<HTMLElement, HTMLElement>;
		getTitle(): string;
		getTitleNode(): TextNode | null;
		setTitle(title: (string | TextNodeOptions) | null): void;
		getTextColor(): string | null;
		setTextColor(textColor: string | null): void;
		getBgColor(): string | null;
		setBgColor(bgColor: string | null): void;
		getBorder(): string | null;
		setBorder(border: string | null): void;
		getContainer(target: HTMLElement): HTMLElement;
		renderTo(target: HTMLElement): void;
		toJSON(): {
			title: TextNode | null;
			textColor: string | null;
			bgColor: string | null;
			border: string | null;
		};
	}

	class SearchIndex {
		static create(item: Item): SearchIndex;
		static createIndex(field: SearchField, text: string, stripTags?: boolean): SearchFieldIndex;
		static splitText(text: string): WordIndex[];
		static splitUnicodeText(text: string): WordIndex[];
		static splitAsciiText(text: string): WordIndex[];
		static hasUnicodeWord(text: string): boolean;
		static splitTextInternal(text: string, regExp: RegExp): WordIndex[];
		/**
		 *  @private
		 */
		private static fillComplexWords;
		/**
		 *  @private
		 */
		private static fillNonCharWords;
		indexes: SearchFieldIndex[];
		addIndex(fieldIndex: SearchFieldIndex): void;
		getIndexes(): SearchFieldIndex[];
	}

	class OrderedArray<T> {
		comparator: Function | null;
		items: Array<T>;
		constructor(comparator?: Function | null);
		add(item: T): number;
		has(item: T): boolean;
		getIndex(item: T): number;
		getByIndex(index: number): T | null | undefined;
		getFirst(): T | null | undefined;
		getLast(): T | null | undefined;
		count(): number;
		delete(item: T): boolean;
		clear(): void;
		[Symbol.iterator](): ArrayIterator<T>;
		forEach(callbackfn: (value: T, index: number, array: T[]) => void, thisArg?: any): void;
		getAll(): Array<T>;
		getComparator(): Function | null;
		sort(): void;
	}

	class SearchField {
		constructor(fieldOptions: SearchFieldOptions);
		name: string;
		type: string;
		searchable: boolean;
		system: boolean;
		sort: number | null;
		getName(): string;
		getType(): string;
		setType(type: string): void;
		getSort(): number | null;
		setSort(sort: number | null): void;
		setSearchable(flag: boolean): void;
		isSearchable(): boolean;
		setSystem(flag: boolean): void;
		isCustom(): boolean;
		isSystem(): boolean;
	}

	class EntityFilter {
		constructor(filterOptions: EntityFilterOptions);
		id: string;
		options: {
			[key: string]: any;
		};
		getId(): string;
		getOptions(): {
			[key: string]: any;
		};
		toJSON(): {
			id: string;
			options: {
				[key: string]: any;
			};
		};
	}

	const Main: Readonly<{
		readonly PERSON_LOCATION: "person-location";
		readonly PERSONS_HAND: "persons-hand";
		readonly PERSON_ARROW_DOWN: "person-arrow-down";
		readonly PERSON: "person";
		readonly PERSON_CAMERA: "person-camera";
		readonly PERSON_PLUS: "person-plus";
		readonly PERSONS_DENY: "persons-deny";
		readonly PERSON_CLOCK: "person-clock";
		readonly PERSON_CLOCK_2: "person-clock-2";
		readonly PERSONS_2: "persons-2";
		readonly PERSONS_3: "persons-3";
		readonly PERSON_LETTER: "person-letter";
		readonly PERSON_MESSAGE: "person-message";
		readonly PERSON_ARROW_LEFT_1: "person-arrow-left-1";
		readonly PERSON_ARROW_RIGHT: "person-arrow-right";
		readonly PERSON_ARROW_LEFT_2: "person-arrow-left-2";
		readonly PERSON_FLAG: "person-flag";
		readonly PERSON_HANDSET: "person-handset";
		readonly PERSON_MESSAGE_ARROW_1: "person-message-arrow-1";
		readonly PERSON_CHECK: "person-check";
		readonly PERSON_MESSAGE_ARROW_2: "person-message-arrow-2";
		readonly PERSONS_STORAGE: "persons-storage";
		readonly PERSON_CALL: "person-call";
		readonly PERSON_PHONE: "person-phone";
		readonly PERSON_DESCENDING: "person-descending";
		readonly PERSON_3_STICKS: "person-3-sticks";
		readonly PERSON_2_CHECKS: "person-2-checks";
		readonly PERSON_PLUS_3: "person-plus-3";
		readonly CLOUD_SYNC: "cloud-sync";
		readonly CLOUD_TRANSFER_DATA: "cloud-transfer-data";
		readonly CLOUD_PAUSE: "cloud-pause";
		readonly CLOUD_ERROR: "cloud-error";
		readonly CLOUD_CLOCK: "cloud-clock";
		readonly CLOUD_EMPTY: "cloud-empty";
		readonly CLOUD_CLOUD: "cloud-cloud";
		readonly CLOUD_LETTER_POST: "cloud-letter-post";
		readonly CLOUD_SSO: "cloud-sso";
		readonly TELEPHONY_HANDSET_1: "telephony-handset-1";
		readonly TELEPHONY_HANDSET_2: "telephony-handset-2";
		readonly TELEPHONY_HANDSET_3: "telephony-handset-3";
		readonly TELEPHONY_HANDSET_4: "telephony-handset-4";
		readonly TELEPHONY_HANDSET_5: "telephony-handset-5";
		readonly TELEPHONY_HANDSET_6: "telephony-handset-6";
		readonly OUTGOING_CALL: "outgoing-call";
		readonly INCOMING_CALL: "incoming-call";
		readonly TELEPHONY_PHONEBOOK: "telephony-phonebook";
		readonly telephony_phonebook_2: "telephony-phonebook-2";
		readonly CALL_CHAT: "call-chat";
		readonly CHATS_1: "chats-1";
		readonly CHATS_2: "chats-2";
		readonly CHAT_MESSAGE: "chat-message";
		readonly CHATS_WITH_CHECK: "chats-with-check";
		readonly CHATS_3: "chats-3";
		readonly MESSAGE_CHAT_WITH_POINT: "message-chat-with-point";
		readonly MESSAGE_CHAT_WITH_ARROW: "message-chat-with-arrow";
		readonly CHAT_BUTTON: "chat-button";
		readonly FEEDBACK: "feedback";
		readonly ADD_CHAT: "add-chat";
		readonly BOOKMARK_1: "bookmark-1";
		readonly FOLDER_CURVED_ARROW: "folder-curved-arrow";
		readonly FOLDER_24: "folder-24";
		readonly FOLDER_PLUS: "folder-plus";
		readonly FOLDER_EMPTY: "folder-empty";
		readonly FOLDER_LEFT_ARROW: "folder-left-arrow";
		readonly FOLDER_INFO: "folder-info";
		readonly FOLDER_RIGHT_ARROW: "folder-right-arrow";
		readonly NOTE_CIRCLE: "note-circle";
		readonly WARNING_CIRCLE: "warning-circle";
		readonly INFO_CIRCLE: "info-circle";
		readonly WARNING: "warning";
		readonly WARNING_ALARM: "warning-alarm";
		readonly INFO: "info";
		readonly HELP: "help";
		readonly SMS: "sms";
		readonly FILE: "file";
		readonly LIST: "list";
		readonly BLACK_LIST: "black-list";
		readonly SHIELD_2_PLAIN: "shield-2-plain";
		readonly SHIELD_2_CONTOUR: "shield-2-contour";
		readonly SHIELD_2_CHECKED: "shield-2-checked";
		readonly SHIELD_2_ATTENTION: "shield-2-attention";
		readonly SHIELD_2_MENU: "shield-2-menu";
		readonly SHIELD_2_TIME: "shield-2-time";
		readonly SHIELD_2_DEFENDED: "shield-2-defended";
		readonly SHIELD_2_UPDATE: "shield-2-update";
		readonly SHIELD_2_CORE_PROBLEM: "shield-2-core-problem";
		readonly FILE_UPLOAD: "file-upload";
		readonly FILE_SYNC: "file-sync";
		readonly FILE_ARROW_TOP: "file-arrow-top";
		readonly FILE_DELETE: "file-delete";
		readonly FILE_CHECK: "file-check";
		readonly FILE_2: "file-2";
		readonly FILE_DOWNLOAD: "file-download";
		readonly FILE_ARROW_DOWN: "file-arrow-down";
		readonly FILE_3: "file-3";
		readonly HOURGLASS_SANDGLASS: "hourglass-sandglass";
		readonly CLOCK_1: "clock-1";
		readonly CLOCK_2: "clock-2";
		readonly CLOCK_WITH_ARROW: "clock-with-arrow";
		readonly STOPWATCH: "stopwatch";
		readonly ALARM: "alarm";
		readonly BLACK_CLOCK: "black-clock";
		readonly SPEED_METER: "speed-meter";
		readonly WATCH: "watch";
		readonly SMART_PROCESS: "smart-process";
		readonly SEARCH_1: "search-1";
		readonly SEARCH_2: "search-2";
		readonly RESTORE_PASSWORD: "restore-password";
		readonly TASKS: "tasks";
		readonly WINDOW_ARROW: "window-arrow";
		readonly WINDOW_DOUBLE_CHECK_1: "window-double-check-1";
		readonly WINDOW_RING: "window-ring";
		readonly WINDOW_DOUBLE_CHECK_2: "window-double-check-2";
		readonly WINDOW_CHECK_PENCIL: "window-check-pencil";
		readonly WINDOW_CHECK_LINK: "window-check-link";
		readonly WINDOW_FLAG: "window-flag";
		readonly WINDOW_CHECK_WITH_FOLDER: "window-check-with-folder";
		readonly WINDOW_WITH_POINT: "window-with-point";
		readonly WINDOW_CHECK_ARROW: "window-check-arrow";
		readonly VIDEO_1: "video-1";
		readonly VIDEO_3: "video-3";
		readonly VIDEO_AND_CHAT: "video-and-chat";
		readonly NO_VIDEO: "no-video";
		readonly PICTURE: "picture";
		readonly MICROPHONE_ON: "microphone-on";
		readonly CAMERA: "camera";
		readonly ATTACH_PICTURE: "attach-picture";
		readonly SOUND_ON: "sound-on";
		readonly SOUND_OFF: "sound-off";
		readonly SOUND_2: "sound-2";
		readonly VIDEO_2: "video-2";
		readonly SPEAKERPHONE: "speakerphone";
		readonly HEADSET: "headset";
		readonly MICROPHONE_OFF: "microphone-off";
		readonly MUSIC_NOTE_2: "music-note-2";
		readonly MUSIC_NOTE_3: "music-note-3";
		readonly MUSIC_NOTE_1: "music-note-1";
		readonly MARKET_1: "market-1";
		readonly COPILOT_AI: "copilot-ai";
		readonly COPILOT_AI_1: "copilot-ai-1";
		readonly COPILOT_AI_2: "copilot-ai-2";
		readonly LIST_AI: "list-ai";
		readonly INFO_CIRCLE_PLUS: "info-circle-plus";
		readonly SCREEN_BLACK_WHITE: "screen-black-white";
		readonly BELL_1: "bell-1";
		readonly HEART: "heart";
		readonly SYNC_CIRCLE: "sync-circle";
		readonly LIKE: "like";
		readonly DISLIKE: "dislike";
		readonly RULER_AND_PENCIL: "ruler-and-pencil";
		readonly KEY: "key";
		readonly MOBILE_2: "mobile-2";
		readonly LOCK: "lock";
		readonly PULSE: "pulse";
		readonly ATTACH: "attach";
		readonly FLAG_2: "flag-2";
		readonly FAVORITE_0: "favorite-0";
		readonly FAVORITE_1: "favorite-1";
		readonly PULSE_CIRCLE: "pulse-circle";
		readonly CROWN_2: "crown-2";
		readonly CROWN_1: "crown-1";
		readonly HOME: "home";
		readonly SEND: "send";
		readonly SUITCASE: "suitcase";
		readonly SPANNER: "spanner";
		readonly IDEA_LAMP: "idea-lamp";
		readonly BOOK_CLOSED: "book-closed";
		readonly EDIT_PENCIL: "edit-pencil";
		readonly COMPASS: "compass";
		readonly CHECK: "check";
		readonly FUNNEL: "funnel";
		readonly BRIGHTNESS: "brightness";
		readonly EARTH_LANGUAGE: "earth-language";
		readonly OBSERVER: "observer";
		readonly OBSERVER_CLOSED: "observer-closed";
		readonly BARCODE_1: "barcode-1";
		readonly DOOR_OPENED: "door-opened";
		readonly SHIELD: "shield";
		readonly TRASH_BIN: "trash-bin";
		readonly SUNGLASSES: "sunglasses";
		readonly DEVICE_ROTATE: "device-rotate";
		readonly PLAY_CIRCLE: "play-circle";
		readonly CUT: "cut";
		readonly CIRCLE_MINUS: "circle-minus";
		readonly CIRCLE_CHECK: "circle-check";
		readonly CIRCLE_PLUS: "circle-plus";
		readonly UNAVAILABLE: "unavailable";
		readonly CALENDAR_2: "calendar-2";
		readonly LOCATION_1: "location-1";
		readonly LOCATION_2: "location-2";
		readonly LOCATION_PLUS: "location-plus";
		readonly TIME_PICKER: "time-picker";
		readonly MAP: "map";
		readonly PIN_2: "pin-2";
		readonly DOUBLE_RHOMBUS: "double-rhombus";
		readonly FIRE: "fire";
		readonly LIGHT_BOLD_SPARKLE: "light-bold-sparkle";
		readonly LIGHT_BOLD: "light-bold";
		readonly BOX: "box";
		readonly DELIVERY_1: "delivery-1";
		readonly DELIVERY_2: "delivery-2";
		readonly CUBES_3: "cubes-3";
		readonly DRAWER: "drawer";
		readonly CUBE_PLUS: "cube-plus";
		readonly CALENDAR_SLOTS: "calendar-slots";
		readonly PAYMENT_TERMINAL: "payment-terminal";
		readonly CALENDAR_SHARING: "calendar-sharing";
		readonly TARGET_TIMER: "target-timer";
		readonly TARGET: "target";
		readonly MARKET_2: "market-2";
		readonly BELL: "bell";
		readonly SALE_TAG: "sale-tag";
		readonly OPEN_LINES: "open-lines";
		readonly CHEMISTRY: "chemistry";
		readonly GRADUATION_CAP: "graduation-cap";
		readonly PAINT_1: "paint-1";
		readonly PAINT_2: "paint-2";
		readonly FLAG_1: "flag-1";
		readonly CREDIT_DEBIT_CARD: "credit-debit-card";
		readonly LIGHTNING_PLUS: "lightning-plus";
		readonly DONATION: "donation";
		readonly B_24: "b-24";
		readonly TAG: "tag";
		readonly SPEAKER_MOUTHPIECE: "speaker-mouthpiece";
		readonly SPEAKER_MOUTHPIECE_PLUS: "speaker-mouthpiece-plus";
		readonly OPENED_EYE: "opened-eye";
		readonly CROSSED_EYE: "crossed-eye";
		readonly LINKS_3: "links-3";
		readonly IMPLEMENTATION_REQUEST: "implementation-request";
		readonly GROUP: "group";
		readonly DOCUMENT_STREAM: "document-stream";
		readonly BOOK_OPEN_1: "book-open-1";
		readonly FOLDERS: "folders";
		readonly QR_CODE_1: "qr-code-1";
		readonly QR_CODE_2: "qr-code-2";
		readonly DESCENDING_SORT: "descending-sort";
		readonly ASCENDING_SORT: "ascending-sort";
		readonly CHATS_PERSONS: "chats-persons";
		readonly MARKETING: "marketing";
		readonly SIGMA_SUMM_A: "sigma-summ-a";
		readonly SIGMA_SUMM: "sigma-summ";
		readonly SMILE: "smile";
		readonly GANTT_GRAPHS: "gantt-graphs";
		readonly FILTER_PLUS: "filter-plus";
		readonly BACKSPACE: "backspace";
		readonly ELEMENTS: "elements";
		readonly BOOK_OPENED_WITH_ARROW: "book-opened-with-arrow";
		readonly DOUBLE_ARROW_COUNTER_CLOCKWISE_SCRUM: "double-arrow-counter-clockwise-scrum";
		readonly BARCODE: "barcode";
		readonly SAD_BOLD_EMOJI: "sad-bold-emoji";
		readonly BRIGHTNESS_BOLD_EMOJI: "brightness-bold-emoji";
		readonly SUN: "sun";
		readonly FILIAL_NETWORK: "filial-network";
		readonly ARROW_LINE: "arrow-line";
		readonly IP: "ip";
		readonly FILTER_1: "filter-1";
		readonly FILTER_2: "filter-2";
		readonly SCREEN_1: "screen-1";
		readonly SCREEN_2: "screen-2";
		readonly PRINT_1: "print-1";
		readonly PRINT_2: "print-2";
		readonly DISK: "disk";
		readonly SHINING: "shining";
		readonly SHINING_2: "shining-2";
		readonly PLUG: "plug";
		readonly PASTE: "paste";
		readonly CROSSED_EYE_2: "crossed-eye-2";
		readonly FILTER_BY_NAME: "filter-by-name";
		readonly DESCENDING_SORT_NAMES: "descending-sort-names";
		readonly TABLE: "table";
		readonly FEED: "feed";
		readonly MOBILE_WITH_STAR: "mobile-with-star";
		readonly ROCKET: "rocket";
		readonly CITY: "city";
		readonly MAGIC_WAND: "magic-wand";
		readonly MAGIC_IMAGE: "magic-image";
		readonly AI: "ai";
		readonly EARTH: "earth";
		readonly SHARE_1: "share-1";
		readonly SHARE_2: "share-2";
		readonly MAIL: "mail";
		readonly ERASER: "eraser";
		readonly DEMONSTRATION_ON_1: "demonstration-on-1";
		readonly DEMONSTRATION_OFF: "demonstration-off";
		readonly FILE_CHECK_1: "file-check-1";
		readonly DELETE_HYPERLINK: "delete-hyperlink";
		readonly INSERT_HYPERLINK: "insert-hyperlink";
		readonly LINK_3: "link-3";
		readonly SCREEN_ARROW: "screen-arrow";
		readonly OPENED_LETTER_MAIL: "opened-letter-mail";
		readonly SITEMAP: "sitemap";
		readonly NOTIFICATIONS_ON: "notifications-on";
		readonly NOTIFICATIONS_OFF: "notifications-off";
		readonly A_LETTER: "a-letter";
		readonly TOPIC: "topic";
		readonly FULL_BATTERY: "full-battery";
		readonly BATTERY_2_STICKS: "battery-2-sticks";
		readonly BATTERY_1_STICK: "battery-1-stick";
		readonly LOW_BATTERY: "low-battery";
		readonly DEAD_BATTERY: "dead-battery";
		readonly DOCUMENT_PLUS: "document-plus";
		readonly DEMONSTRATION_ON_2: "demonstration-on-2";
		readonly RECEIPT_1: "receipt-1";
		readonly RECEIPT_2: "receipt-2";
		readonly CART_WITH_CURSOR: "cart-with-cursor";
		readonly EXPAND: "expand";
		readonly GIFT: "gift";
		readonly MORE_POINTS: "more-points";
		readonly PIN_1: "pin-1";
		readonly MORE_INFORMATION: "more-information";
		readonly MARKERS: "markers";
		readonly FEED_BOLD: "feed-bold";
		readonly STOP_HAND: "stop-hand";
		readonly TARGET_1: "target-1";
		readonly MAIL_OUT: "mail-out";
		readonly MAIL_IN: "mail-in";
		readonly MAIL_MONEY: "mail-money";
		readonly UNPIN: "unpin";
		readonly ATTENTION_I_CIRCLE: "attention-i-circle";
		readonly INFO_1: "info-1";
		readonly ATTENTION_I_BLACK: "attention-i-black";
		readonly MENU: "menu";
		readonly WAVES: "waves";
		readonly MAIL_REPLY: "mail-reply";
		readonly MAIL_2: "mail-2";
		readonly MAIL_READ: "mail-read";
		readonly QUOTE: "quote";
		readonly NEW_MESSAGE_MAIL: "new-message-mail";
		readonly INDENT: "indent";
		readonly OUTDENT: "outdent";
		readonly DISTRIBUTION: "distribution";
		readonly MENU_POINT: "menu-point";
		readonly LINES_TEXT: "lines-text";
		readonly DIAMOND: "diamond";
		readonly BOTTOM: "bottom";
		readonly NUMBERS_123: "numbers-123";
		readonly CURSOR_CLICK: "cursor-click";
		readonly FLAG_WITH_CROSS: "flag-with-cross";
		readonly TEMP_1: "temp-1";
		readonly TEMP_2: "temp-2";
		readonly CALENDAR_1: "calendar-1";
		readonly CALENDAR_24: "calendar-24";
		readonly WINDOW: "window";
		readonly PLANNING: "planning";
		readonly SORT_CALENDAR: "sort-calendar";
		readonly CALENDAR_DEADLINE: "calendar-deadline";
		readonly SORT_ACTIVITY: "sort-activity";
		readonly PLANNING_2: "planning-2";
		readonly MY_PLAN: "my-plan";
		readonly CALENDAR_OFF: "calendar-off";
		readonly SIGNAL_WIFI: "signal-wifi";
		readonly SIGNAL_WIFI_OFF: "signal-wifi-off";
		readonly IMG_FORMAT: "img-format";
		readonly ATTACH_2: "attach-2";
		readonly CRM: "crm";
		readonly APPS: "apps";
		readonly TEMPLATES: "templates";
		readonly HR_AUTOMATION: "hr-automation";
		readonly SITES_STORES: "sites-stores";
		readonly C1: "1c";
		readonly REFRESH: "refresh";
		readonly SUBSCRIPTION: "subscription";
		readonly SETTINGS: "settings";
		readonly SERVICES: "services";
		readonly GRAPHS_DIAGRAM: "graphs-diagram";
		readonly OPEN_BOOK: "open-book";
		readonly ROBOT: "robot";
		readonly DEVELOPER_RESOURCES: "developer-resources";
		readonly CASH_TERMINAL: "cash-terminal";
		readonly CLOCK_BLACK_WHITE: "clock-black-white";
		readonly INVENTORY_MANAGEMENT: "inventory-management";
		readonly COLLABORATION: "collaboration";
		readonly DOCUMENT: "document";
		readonly CHECK_RECEIPT: "check-receipt";
		readonly CALCULATOR: "calculator";
		readonly SWITCH: "switch";
		readonly SEQUENTIAL_QUEUE: "sequential-queue";
		readonly PARALLEL_QUEUE: "parallel-queue";
		readonly CONDITION: "condition";
		readonly COMPLETE: "complete";
		readonly TRANSLATION: "translation";
		readonly TORRENT: "torrent";
		readonly ACTIVITY: "activity";
		readonly ADD_TO_CHECKLIST: "add-to-checklist";
		readonly BP: "bp";
		readonly CLOSE_CHAT: "close-chat";
		readonly CREATE_PROMPT: "create-prompt";
		readonly DEVICES: "devices";
		readonly DOCUMENT_SIGN: "document-sign";
		readonly FAVOURITE_PROMPT: "favourite-prompt";
		readonly LINES_VERTICAL: "lines-vertical";
		readonly MAIN: "main";
		readonly MOVE_TO_CHECKLIST: "move-to-checklist";
		readonly OPEN_CHAT: "open-chat";
		readonly PROMPT: "prompt";
		readonly PROMPT_VAR: "prompt-var";
		readonly PROMPTS_LIBRARY: "prompts-library";
		readonly RECORD_VIDEO: "record-video";
		readonly ROLES_LIBRARY: "roles-library";
		readonly SAVE_PROMPT: "save-prompt";
		readonly SCREEN_SHARE: "screen-share";
		readonly SUB_POINT: "sub-point";
		readonly UNSUB_POINT: "unsub-point";
		readonly SUB_TASK: "subtask";
		readonly COLLAB: "collab";
		readonly NO_PICTURE: "no-picture";
		readonly THREAD: "thread";
		readonly THREAD_SINGLE: "thread-single";
		readonly BUSINESS_PROCESS_1: "business-process-1";
		readonly WAITING_POINTS: "waiting-points";
		readonly WAITING_LIST: "waiting-list";
		readonly LINK_BOLD: "link-bold";
		readonly NOTE: "note";
		readonly EDIT_MENU: "edit-menu";
		readonly DEMONSTRATION_GRAPHICS: "demonstration-graphics";
		readonly CALENDAR_CHECK: "calendar-check";
		readonly SIGN: "sign";
		readonly FLIPCHART: "flipchart";
		readonly NUMBERS_05: "numbers-05";
		readonly DEMONSTRATION_GRAPHICS_2: "demonstration-graphics-2";
		readonly EARTH_TIME: "earth-time";
	}>;

	class ZIndexComponent extends EventEmitter {
		sort: number;
		alwaysOnTop: boolean | number;
		zIndex: number;
		element: HTMLElement | null;
		overlay: HTMLElement | null;
		overlayGap: number;
		stack: ZIndexStack | null;
		constructor(element: HTMLElement, componentOptions?: ZIndexComponentOptions);
		getSort(): number;
		/**
		 * @internal
		 * @param sort
		 */
		setSort(sort: number): void;
		/**
		 * @internal
		 * @param stack
		 */
		setStack(stack: ZIndexStack): void;
		getStack(): ZIndexStack | null | undefined;
		getZIndex(): number;
		/**
		 * @internal
		 */
		setZIndex(zIndex: number): void;
		getAlwaysOnTop(): boolean | number;
		setAlwaysOnTop(value: boolean | number): void;
		getElement(): HTMLElement | null;
		setOverlay(overlay: HTMLElement, gap?: number): void;
		getOverlay(): HTMLElement | null | undefined;
		setOverlayGap(gap: number): void;
		getOverlayGap(): number;
	}

	/**
	 * @memberof BX.UI.Accessibility
	 */
	class FocusTrap {
		constructor(container: HTMLElement, options?: FocusTrapOptions);
		static enableDebug(): void;
		static disableDebug(): void;
		activate(options?: {
			initialFocus?: boolean;
		}): void;
		deactivate(): void;
		destroy(): void;
		setLooped(flag: boolean): void;
		setPreventScroll(flag: boolean): void;
		isLooped(): boolean;
		isActive(): boolean;
		setLastFocusedElement(el: HTMLElement): void;
		captureActiveElement(): HTMLElement | null;
		contains(el: HTMLElement): boolean;
		focusFirst(options?: FocusNavigatorOptions): HTMLElement | null;
		focusLast(options?: FocusNavigatorOptions): HTMLElement | null;
		focusNext(options?: FocusNavigatorOptions): HTMLElement | null;
		focusPrevious(options?: FocusNavigatorOptions): HTMLElement | null;
		focusContainer(options?: FocusNavigatorOptions): HTMLElement;
		focusBySelector(selector: string, options?: FocusNavigatorOptions): HTMLElement | null;
		getId(): string;
		applyInitialFocus(): void;
		setRestoreFocus(restore: RestoreFocus | null): void;
		restoreFocus(): void;
	}

	class TagItem {
		static "__#private@#sanitizeTitle"(text: string): string;
		constructor(itemOptions: TagItemOptions);
		id: string | number;
		entityId: string;
		entityType: string;
		title: TextNode | null;
		avatar: string | null;
		avatarOptions: AvatarOptions | null;
		maxWidth: number | null;
		textColor: string | null;
		bgColor: string | null;
		fontWeight: string | null;
		link: string | null;
		onclick: Function | null;
		clickable: boolean;
		deselectable: boolean | null;
		customData: Map<string, any>;
		cache: import("../../../../../../../main/install/js/main/core/src/lib/cache/memory-cache").default<any>;
		selector: TagSelector;
		rendered: boolean | null;
		getId(): string | number;
		getEntityId(): string;
		getEntityType(): string;
		getSelector(): TagSelector;
		setSelector(selector: TagSelector): void;
		getTitle(): string;
		getTitleNode(): TextNode | null;
		setTitle(title: string | TextNodeOptions): void;
		getAvatar(): string | null;
		setAvatar(avatar: string | null): void;
		getAvatarOption(option: $Keys<AvatarOptions>): string | boolean | number | null;
		setAvatarOption(option: $Keys<AvatarOptions>, value: string | boolean | number | null): void;
		setAvatarOptions(options: AvatarOptions): void;
		getTextColor(): string | null;
		setTextColor(textColor: string | null): void;
		getBgColor(): string | null;
		setBgColor(bgColor: string | null): void;
		getFontWeight(): string | null;
		setFontWeight(fontWeight: string | null): void;
		getMaxWidth(): number | null;
		setMaxWidth(width: number | null): void;
		setDeselectable(flag: boolean): void;
		isDeselectable(): boolean;
		getCustomData(): Map<string, any>;
		getLink(): string | null;
		getOnclick(): Function | null;
		setClickable(flag: boolean): void;
		isClickable(): boolean;
		render(): void;
		getContainer(): HTMLElement;
		getContentContainer(): HTMLElement;
		getAvatarContainer(): HTMLElement;
		getTitleContainer(): HTMLElement;
		getRemoveIcon(): HTMLElement;
		getEntityTagOption(option: string): any;
		getEntityItemOption(option: string): any;
		isRendered(): boolean;
		remove(animate?: boolean): Promise<any>;
		show(): Promise<any>;
		handleContainerClick(): void;
		handleRemoveIconClick(event: MouseEvent): void;
	}

	class RenderMode {
		static PARTIAL: string;
		static OVERRIDE: string;
	}

	class MatchField {
		constructor(field: SearchField, indexes?: MatchIndex[]);
		field: SearchField;
		matchIndexes: OrderedArray<MatchIndex>;
		getField(): SearchField;
		getMatches(): OrderedArray<MatchIndex>;
		addIndex(matchIndex: MatchIndex): void;
		addIndexes(matchIndexes: MatchIndex[]): void;
	}

	class SearchQuery {
		constructor(query: string);
		queryWords: string[];
		query: string;
		cacheable: boolean;
		dynamicSearchEntities: string[];
		resultLimit: number;
		getQueryWords(): string[];
		getQuery(): string;
		isEmpty(): boolean;
		setCacheable(flag: boolean): void;
		isCacheable(): boolean;
		setResultLimit(limit: number): void;
		getResultLimit(): number;
		hasDynamicSearch(): boolean;
		hasDynamicSearchEntity(entityId: string): boolean;
		setDynamicSearchEntities(entities: string[]): void;
		getDynamicSearchEntities(): string[];
		getAjaxJson(): {
			[key: string]: any;
		};
		toJSON(): {
			[key: string]: any;
		};
	}

	class SearchLoader {
		constructor(tab: Tab);
		tab: Tab;
		loader: Loader;
		cache: import("../../../../../../../../main/install/js/main/core/src/lib/cache/memory-cache").default<any>;
		getTab(): Tab;
		getLoader(): Loader;
		getContainer(): HTMLElement;
		getBoxContainer(): HTMLElement;
		getIconContainer(): HTMLElement;
		getTextContainer(): HTMLElement;
		getSpacerContainer(): HTMLElement;
		show(): void;
		hide(): void;
		isShown(): boolean;
	}

	class MatchResult {
		constructor(item: Item, matchIndexes?: MatchIndex[]);
		item: Item;
		matchFields: Map<SearchField, MatchField>;
		sort: number | null;
		getItem(): Item;
		getMatchFields(): Map<SearchField, MatchField>;
		getSort(): number | null;
		addIndex(matchIndex: MatchIndex): void;
		addIndexes(matchIndexes: MatchIndex[]): void;
	}

	class Runtime {
		static debug: typeof debug;
		static loadExtension: typeof loadExtension;
		static registerExtension: typeof registerExtension;
		static clone: typeof clone;
		static debounce(func: Function, wait?: number, context?: any): Function;
		static throttle(func: Function, wait?: number, context?: any): Function;
		static html(node: HTMLElement, html: any, params?: Record<string, any>): Promise<any> | string;
		/**
		 * Merges objects or arrays
		 * @param targets
		 * @return {any}
		 */
		static merge(...targets: any[]): any;
		static orderBy(collection: Array<{
			[key: string]: any;
		}> | {
			[key: string]: {
				[key: string]: any;
			};
		}, fields?: Array<string>, orders?: Array<string>): {
			[key: string]: any;
		}[];
		static destroy(target: any, errorMessage?: string): void;
	}

	/**
	 * @memberOf BX
	 */
	class BaseError {
		[isError]: boolean;
		message: string;
		code: string | null;
		customData: unknown;
		constructor(message?: string, code?: string, customData?: unknown);
		/**
		 * Returns a brief description of the error
		 * @returns {string}
		 */
		getMessage(): string;
		/**
		 * Sets a message of the error
		 * @param {string} message
		 * @returns {this}
		 */
		setMessage(message?: string): this;
		/**
		 * Returns a code of the error
		 * @returns {?string}
		 */
		getCode(): string | null;
		/**
		 * Sets a code of the error
		 * @param {string} code
		 * @returns {this}
		 */
		setCode(code?: string | null): this;
		/**
		 * Returns custom data of the error
		 * @returns {null|*}
		 */
		getCustomData(): unknown;
		/**
		 * Sets custom data of the error
		 * @returns {this}
		 */
		setCustomData(customData: unknown): this;
		toString(): string;
		/**
		 * Returns true if the object is an instance of BaseError
		 * @param error
		 * @returns {boolean}
		 */
		static isError(error: unknown): error is BaseError;
	}

	class TextNodeType {
		static TEXT: string;
		static HTML: string;
		static isValid(type: string): boolean;
	}

	class SearchFieldIndex {
		constructor(field: SearchField, indexes?: WordIndex[]);
		field: SearchField;
		indexes: WordIndex[];
		getField(): SearchField;
		getIndexes(): WordIndex[];
		addIndex(index: WordIndex): void;
		addIndexes(indexes: WordIndex[]): void;
	}

	class WordIndex {
		constructor(word: string, startIndex: number);
		word: string;
		startIndex: number;
		getWord(): string;
		setWord(word: string): this;
		getStartIndex(): number;
		setStartIndex(index: number): this;
	}

	const CRM: Readonly<{
		readonly SEND_CONTACT: "send-contact";
		readonly BOOK_OPEN: "book-open";
		readonly funnel_1: "funnel-1";
		readonly CRM_SEARCH: "crm-search";
		readonly REFRESH_9: "refresh-9";
		readonly CHECK_IN_BOX: "check-in-box";
		readonly ARROWS_MEET: "arrows-meet";
		readonly CHAT_LINE: "chat-line";
		readonly COMMERCIAL_OFFER: "commercial-offer";
		readonly FUNNELS: "funnels";
		readonly ITEM: "item";
		readonly PROPOSAL_SETTINGS: "proposal-settings";
		readonly PROPOSAL_DONE: "proposal-done";
		readonly PROPOSAL: "proposal";
		readonly CRM_GROUP: "crm-group";
		readonly CONTACT: "contact";
		readonly LEAD: "lead";
		readonly INVOICE: "invoice";
		readonly STAGES: "stages";
		readonly EXCLUSION_LIST: "exclusion-list";
		readonly OPEN_CHANNELS: "open-channels";
		readonly APPROVED_LIST: "approved-list crm-checked_1";
		readonly COMPANY: "company";
		readonly COPY_FILE: "copy-file";
		readonly GIRD: "gird";
		readonly FUNNEL_2: "funnel-2";
		readonly STAGE: "stage";
		readonly CUSTOMER_CARD: "customer-card";
		readonly SMART_ACTIVITIES: "smart-activities";
		readonly CHOOSE: "choose";
		readonly ADD_FROM_ADRESSBOOK: "add-from-adressbook";
		readonly ADD_FILE: "add-file";
		readonly RECEIVE_PAYMENT_SETTINGS: "receive-payment-settings";
		readonly TIMELINE: "timeline";
		readonly FORM_SETTINGS: "form-settings";
		readonly CUSTOMER_CARDS: "customer-cards";
		readonly SHOP_LIST: "shop-list";
		readonly SHOP_SEEN: "shop-seen";
		readonly ADD_FROM_CRM: "add-from-crm";
		readonly PAYMENT_AND_DELIVERY: "payment-and-delivery";
		readonly SMART_SORT: "smart-sort";
		readonly CART_TEXT: "cart-text";
		readonly CART: "cart";
		readonly CART_IMAGE: "cart-image";
		readonly COMMENT_PLUS: "comment-plus";
		readonly DEAL_1: "deal-1";
		readonly DEAL_PLUS_1: "deal-plus-1";
		readonly TIMELINE_PLUS: "timeline-plus";
		readonly PLUS_BASED_ON: "plus-based-on";
		readonly DEAL: "deal";
		readonly CUSTOMER_CARD_1: "customer-card-1";
		readonly DEAL_PLUS: "deal-plus";
		readonly PERSON_PLUS_2: "person-plus-2";
		readonly CITY_PLUS: "city-plus";
		readonly CUSTOMER_CARD_PLUS: "customer-card-plus";
		readonly CHAT_1: "chat-1";
		readonly DIALOGUE_1: "dialogue-1";
		readonly BUSINESS_PROCESS: "business-process";
		readonly FORM: "form";
		readonly WALLET: "wallet";
		readonly TAXI: "taxi";
		readonly INTERCONNECTION: "interconnection";
		readonly REDUCE: "reduce";
		readonly DIALOGUE: "dialogue";
		readonly DELIVERY_CAR: "delivery-car";
		readonly CAR: "car";
		readonly CRM_PAYMENT: "crm-payment";
		readonly INSERT: "insert";
		readonly CRM_LETTERS: "crm-letters";
		readonly CRM_MAP: "crm-map";
		readonly SEND_FILE: "send-file";
		readonly BITRIX_1C: "bitrix-1c";
	}>;

	class ZIndexStack {
		container: HTMLElement;
		components: OrderedArray<ZIndexComponent>;
		elements: WeakMap<HTMLElement, ZIndexComponent>;
		baseIndex: number;
		baseStep: number;
		sortCount: number;
		constructor(container: HTMLElement);
		getBaseIndex(): number;
		setBaseIndex(index: number): void;
		setBaseStep(step: number): void;
		getBaseStep(): number;
		register(element: HTMLElement, options?: ZIndexComponentOptions): ZIndexComponent;
		unregister(element: HTMLElement): void;
		getComponent(element: HTMLElement): ZIndexComponent | null | undefined;
		getComponents(): ZIndexComponent[];
		getMaxZIndex(): number;
		sort(): void;
		bringToFront(element: HTMLElement): ZIndexComponent | null | undefined;
	}

	class MatchIndex {
		constructor(field: SearchField, queryWord: string, startIndex: number);
		field: SearchField;
		queryWord: string;
		startIndex: number;
		endIndex: number;
		getField(): SearchField;
		getQueryWord(): string;
		getStartIndex(): number;
		getEndIndex(): number;
	}

	const isError: unique symbol;
}
