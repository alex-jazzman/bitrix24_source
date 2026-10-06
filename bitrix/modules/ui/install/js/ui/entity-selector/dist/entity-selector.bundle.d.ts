/* eslint-disable */
type TextNodeOptions = {
	text: string;
	type?: BX.UI.EntitySelector.TextNodeType;
};

type AvatarOptions = {
	bgSize?: string;
	bgColor?: string;
	bgImage?: string;
	border?: string;
	borderRadius?: string;
	outline?: string;
	outlineOffset?: string;
	icon?: string;
	iconColor?: string;
};

type ItemBadgeOptions = {
	title: string | TextNodeOptions;
	textColor?: string;
	bgColor?: string;
	border?: string;
};

type TabLabelStates = {
	default?: string;
	selected?: string;
	hovered?: string;
	selectedHovered?: string;
};

type HeaderOptions = {
	[option: string]: any;
};

type FooterOptions = {
	[option: string]: any;
};

type TabOptions = {
	id: string;
	title?: string | TextNodeOptions;
	visible?: boolean;
	itemMaxDepth?: number;
	itemOrder?: ItemNodeOrder;
	icon?: TabLabelStates | string;
	textColor?: TabLabelStates | string;
	bgColor?: TabLabelStates | string;
	stub?: boolean | string | Function;
	stubOptions?: {
		[option: string]: any;
	};
	header?: HeaderContent;
	headerOptions?: HeaderOptions;
	showDefaultHeader?: boolean;
	footer?: FooterContent;
	footerOptions?: FooterOptions;
	showDefaultFooter?: boolean;
	showAvatars?: boolean;
};

type ItemNodeOrder = {
	[key: string]: 'asc' | 'desc' | 'asc nulls first' | 'asc nulls last' | 'desc nulls first' | 'desc nulls last';
} | ((a: BX.UI.EntitySelector.ItemNode, b: BX.UI.EntitySelector.ItemNode) => number);

type HeaderContent = string | HTMLElement | HTMLElement[] | Function;

type FooterContent = string | HTMLElement | HTMLElement[] | Function;

type TabLabelState = 'default' | 'selected' | 'hovered' | 'selectedHovered';

type SearchFieldOptions = {
	name: string;
	type?: 'string' | 'email';
	searchable?: boolean;
	system?: boolean;
	sort?: number;
};

type ItemNodeOptions = {
	itemOrder?: ItemNodeOrder;
	open?: boolean;
	dynamic?: boolean;
	title?: string | TextNodeOptions;
	subtitle?: string | TextNodeOptions;
	supertitle?: string | TextNodeOptions;
	caption?: string | TextNodeOptions;
	captionOptions?: CaptionOptions;
	avatar?: string;
	avatarOptions?: AvatarOptions;
	textColor?: string;
	link?: string;
	linkTitle?: string | TextNodeOptions;
	badges?: ItemBadgeOptions[];
	badgesOptions?: BadgesOptions;
	renderMode?: BX.UI.EntitySelector.RenderMode;
};

type CaptionOptions = {
	fitContent?: boolean;
	maxWidth?: number | string;
	justifyContent?: 'left' | 'right' | 'center';
};

type BadgesOptions = {
	fitContent: boolean;
	maxWidth: number | string;
	justifyContent: 'left' | 'right' | 'center';
};

type ItemOptions = {
	id: number | string;
	entityId: string;
	entityType?: string;
	title?: string | TextNodeOptions;
	subtitle?: string | TextNodeOptions;
	supertitle?: string | TextNodeOptions;
	caption?: string | TextNodeOptions;
	captionOptions?: CaptionOptions;
	avatar?: string;
	avatarOptions?: AvatarOptions;
	textColor?: string;
	link?: string;
	linkTitle?: string | TextNodeOptions;
	badges?: ItemBadgeOptions[];
	badgesOptions?: BadgesOptions;
	tagOptions?: {
		[key: string]: any;
	};
	tabs?: string | string[];
	searchable?: boolean;
	saveable?: boolean;
	deselectable?: boolean;
	selected?: boolean;
	hidden?: boolean;
	locked?: boolean;
	children?: ItemOptions[];
	nodeOptions?: ItemNodeOptions;
	customData?: {
		[key: string]: any;
	};
	contextSort?: number;
	globalSort?: number;
	sort?: number;
};

type EntityFilterOptions = {
	id: string;
	options?: {
		[key: string]: any;
	};
};

type EntityOptions = {
	id: string;
	options?: {
		[key: string]: any;
	};
	itemOptions?: {
		[key: string]: ItemOptions;
	};
	tagOptions?: {
		[key: string]: any;
	};
	badgeOptions?: EntityBadgeOptions[];
	filters?: EntityFilterOptions[];
	searchable?: boolean;
	searchFields?: SearchFieldOptions[];
	searchCacheLimits?: string[];
	dynamicLoad?: boolean;
	dynamicSearch?: boolean;
	dynamicSearchMatchMode?: 'all' | 'exact';
	substituteEntityId?: string;
	fillRecentItems?: boolean;
};

type EntityBadgeOptions = ItemBadgeOptions & {
	conditions?: {
		[key: string]: any;
	};
};

type ItemSelectOptions = {
	emitEvents?: boolean;
	animate?: boolean;
	node?: BX.UI.EntitySelector.ItemNode;
};

type ItemId = [string, string | number];

type SearchOptions = {
	allowCreateItem?: boolean;
	footerOptions?: FooterOptions;
};

type TagItemOptions = {
	id: string | number;
	entityId: number | string;
	entityType?: string;
	title?: string | TextNodeOptions;
	avatar?: string;
	avatarOptions?: AvatarOptions;
	textColor?: string;
	bgColor?: string;
	fontWeight?: string;
	link?: string;
	onclick?: Function;
	clickable?: boolean;
	maxWidth?: number;
	deselectable?: boolean;
	animate?: boolean;
	customData?: {
		[key: string]: any;
	};
};

type TagSelectorOptions = {
	id?: string;
	items?: TagItemOptions[];
	dialogOptions?: DialogOptions;
	multiple?: boolean;
	readonly?: boolean;
	locked?: boolean;
	deselectable?: boolean;
	events?: {
		[eventName: string]: (event: BX.Event.BaseEvent) => void;
	};
	showAddButton?: boolean;
	showCreateButton?: boolean;
	showTextBox?: boolean;
	addButtonCaption?: string;
	addButtonCaptionMore?: string;
	createButtonCaption?: string;
	placeholder?: string;
	maxHeight?: number;
	textBoxAutoHide?: boolean;
	textBoxWidth?: string | number;
	tagAvatar?: string;
	tagAvatarOptions?: AvatarOptions;
	tagMaxWidth?: number;
	tagTextColor?: string;
	tagBgColor?: string;
	tagFontWeight?: string;
	tagClickable?: boolean;
	focusZoneOptions?: Partial<BX.UI.Accessibility.FocusZoneOptions>;
};

type DialogOptions = {
	targetNode: HTMLElement;
	id?: string;
	context?: string;
	items?: ItemOptions[];
	selectedItems?: ItemOptions[];
	preselectedItems?: ItemId[];
	undeselectedItems?: ItemId[];
	tabs?: TabOptions[];
	entities?: EntityOptions[];
	popupOptions?: BX.Main.PopupOptions;
	multiple?: boolean;
	preload?: boolean;
	dropdownMode?: boolean;
	enableSearch?: boolean;
	searchOptions?: SearchOptions;
	searchTabOptions?: TabOptions;
	recentTabOptions?: TabOptions;
	tagSelector?: BX.UI.EntitySelector.TagSelector;
	tagSelectorOptions?: TagSelectorOptions;
	events?: {
		[eventName: string]: (event: BX.Event.BaseEvent) => void;
	};
	hideOnSelect?: boolean;
	hideOnDeselect?: boolean;
	addTagOnSelect?: boolean;
	clearSearchOnSelect?: boolean;
	width?: number;
	height?: number;
	autoHide?: boolean;
	autoHideHandler?: (event: MouseEvent, dialog: BX.UI.EntitySelector.Dialog) => boolean;
	hideByEsc?: boolean;
	offsetTop?: number;
	offsetLeft?: number;
	cacheable?: boolean;
	focusOnFirst?: boolean;
	header?: HeaderContent;
	headerOptions?: HeaderOptions;
	footer?: FooterContent;
	footerOptions?: FooterOptions;
	clearUnavailableItems?: boolean;
	showAvatars?: boolean;
	compactView?: boolean;
	recentItemsLimit?: number;
	offsetAnimation?: boolean;
	alwaysShowLabels?: boolean;
	ariaLabel?: string;
	customData?: BX.JsonObject;
};

type EntityErrorOptions = {
	entityId: string;
	code?: any;
	message?: string;
	customData?: [];
};

declare namespace BX.UI.EntitySelector {
	const EntitySelector: {
		Dialog: typeof Dialog;
		Item: typeof Item;
		Tab: typeof Tab;
		Entity: typeof Entity;
		TagSelector: typeof TagSelector;
		TagItem: typeof TagItem;
		BaseHeader: typeof BaseHeader;
		DefaultHeader: typeof DefaultHeader;
		BaseFooter: typeof BaseFooter;
		DefaultFooter: typeof DefaultFooter;
		BaseStub: typeof BaseStub;
		DefaultStub: typeof DefaultStub;
		EntityError: typeof EntityError;
	};

	/**
	 * @memberof BX.UI.EntitySelector
	 */
	class Dialog extends BX.Event.EventEmitter {
		id: string;
		items: Map<string, Map<string, Item>>;
		tabs: Map<string, Tab>;
		entities: Map<string, Entity>;
		targetNode: HTMLElement | {
			left: number;
			top: number;
		} | MouseEvent | null;
		popup: BX.Main.Popup | null;
		cache: BX.Cache.MemoryCache<HTMLElement>;
		multiple: boolean;
		hideOnSelect: boolean | null;
		hideOnDeselect: boolean | null;
		addTagOnSelect: boolean | null;
		clearSearchOnSelect: boolean;
		context: string | null;
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
		autoHideHandler: ((event: MouseEvent, dialog: Dialog) => boolean) | null;
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
		activeTab: Tab | null;
		recentTab: RecentTab;
		searchTab: SearchTab;
		rendered: boolean;
		loadState: string;
		loader: BX.Loader | null;
		ariaLabel: string | null;
		tagSelector: TagSelector | null;
		tagSelectorMode: TagSelectorMode | null;
		tagSelectorHeight: number | null;
		saveRecentItemsWithDebounce: Function;
		recentItemsToSave: Item[];
		recentItemsLimit: number | null;
		navigation: Navigation;
		header: BaseHeader | null;
		footer: BaseFooter | null;
		popupOptions: BX.Main.PopupOptions;
		focusOnFirst: boolean;
		focusedNode: ItemNode | null;
		clearUnavailableItems: boolean;
		overlappingObserver: MutationObserver | null;
		offsetAnimation: boolean;
		customData: BX.JsonObject;
		destroyed: boolean;
		static getById(id: string): Dialog | null;
		static getInstances(): Dialog[];
		constructor(dialogOptions: DialogOptions);
		show(): void;
		hide(): void;
		destroy(): void;
		isOpen(): boolean;
		adjustPosition(): void;
		search(queryString: string): void;
		addItem(options: ItemOptions): Item;
		removeItem(itemToRemove: Item | ItemOptions | null | undefined): Item | null;
		removeItems(): void;
		getItem(item: ItemId | Item | ItemOptions | null | undefined): Item | null;
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
		getEntityItemsInternal(entityId: string | null): Map<string, Item> | null;
		/**
		 * @private
		 */
		validateItemIds(itemIds?: ItemId[]): ItemId[];
		addTab(newTab: Tab | TabOptions): Tab;
		getTabs(): Tab[];
		getTab(id: string): Tab | null;
		getRecentTab(): RecentTab;
		getSearchTab(): SearchTab;
		selectTab(id: string): Tab | null;
		/**
		 * @private
		 */
		insertTab(tab: Tab): void;
		selectFirstTab(onlyVisible?: boolean): Tab | null;
		selectLastTab(onlyVisible?: boolean): Tab | null;
		getActiveTab(): Tab | null;
		getNextTab(onlyVisible?: boolean): Tab | null;
		getPreviousTab(onlyVisible?: boolean): Tab | null;
		removeTab(id: string): void;
		addEntity(newEntity: Entity | EntityOptions): Entity;
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
		setHeader(headerContent: HeaderContent | null | undefined, headerOptions?: HeaderOptions): BaseHeader | null;
		/**
		 * @internal
		 */
		appendHeader(header: BaseHeader | null | undefined): void;
		/**
		 * @internal
		 */
		static createHeader(context: Dialog | Tab, headerContent: HeaderContent | null | undefined, headerOptions?: HeaderOptions): BaseHeader | null;
		createHeader(context: Dialog | Tab, headerContent: HeaderContent | null | undefined, headerOptions?: HeaderOptions): BaseHeader | null;
		getFooter(): BaseFooter | null;
		getActiveFooter(): BaseFooter | null;
		/**
		 * @internal
		 */
		adjustFooter(): void;
		setFooter(footerContent: FooterContent | null | undefined, footerOptions?: FooterOptions): BaseFooter | null;
		/**
		 * @internal
		 */
		appendFooter(footer: BaseFooter | null | undefined): void;
		/**
		 * @internal
		 */
		static createFooter(context: Dialog | Tab, footerContent: FooterContent | null | undefined, footerOptions?: FooterOptions): BaseFooter | null;
		createFooter(context: Dialog | Tab, footerContent: FooterContent | null | undefined, footerOptions?: FooterOptions): BaseFooter | null;
		getId(): string;
		getContext(): string | null;
		getNavigation(): Navigation;
		deselectAll(): void;
		isMultiple(): boolean;
		setTargetNode(node?: HTMLElement | {
			left: number;
			top: number;
		} | null | MouseEvent): void;
		getTargetNode(): HTMLElement | {
			left: number;
			top: number;
		} | MouseEvent | null;
		setHideOnSelect(flag?: boolean): void;
		shouldHideOnSelect(): boolean;
		setHideOnDeselect(flag?: boolean): void;
		shouldHideOnDeselect(): boolean;
		setClearSearchOnSelect(flag?: boolean): void;
		shouldClearSearchOnSelect(): boolean;
		setAddTagOnSelect(flag?: boolean): void;
		shouldAddTagOnSelect(): boolean;
		setShowAvatars(flag?: boolean): void;
		shouldShowAvatars(): boolean;
		setRecentItemsLimit(recentItemsLimit?: number): void;
		getRecentItemsLimit(): number | null;
		setOffsetAnimation(flag?: boolean): any;
		isCompactView(): boolean;
		setAutoHide(enable?: boolean): void;
		isAutoHide(): boolean;
		setAutoHideHandler(handler?: (event: MouseEvent, dialog: Dialog) => boolean): void;
		setHideByEsc(enable?: boolean): void;
		shouldHideByEsc(): boolean;
		getWidth(): number;
		setWidth(width?: number): void;
		getHeight(): number;
		setHeight(height?: number): Promise<TransitionEvent | null | void>;
		getOffsetLeft(): number;
		setOffsetLeft(offset?: number): void;
		getOffsetTop(): number;
		setOffsetTop(offset?: number): void;
		getZindex(): number;
		isCacheable(): boolean;
		setCacheable(cacheable?: boolean): void;
		shouldFocusOnFirst(): boolean;
		setFocusOnFirst(flag?: boolean): void;
		focusOnFirstNode(): ItemNode | null;
		getFocusedNode(): ItemNode | null;
		clearNodeFocus(): void;
		getActiveDescendantControl(itemNode: ItemNode): HTMLElement | null;
		getFocusTrap(): BX.UI.Accessibility.FocusTrap | null;
		isDropdownMode(): boolean;
		setPreselectedItems(itemIds?: ItemId[]): void;
		getPreselectedItems(): ItemId[];
		setUndeselectedItems(itemIds?: ItemId[]): void;
		getUndeselectedItems(): ItemId[];
		setCustomData(property: (string | null | undefined) | {
			[key: string]: any;
		}, value?: any): void;
		getCustomData(property?: string): any;
		/**
		 * @private
		 */
		setOptions(dialogOptions: Partial<DialogOptions>): void;
		getMaxLabelWidth(): number;
		getMinLabelWidth(): number;
		expandLabels(animate?: boolean): void;
		collapseLabels(animate?: boolean): void;
		getTagSelector(): TagSelector | null;
		getTagSelectorMode(): TagSelectorMode | null;
		isTagSelectorInside(): boolean;
		isTagSelectorOutside(): boolean;
		hasTagSelector(): boolean;
		getTagSelectorQuery(): string;
		/**
		 * @private
		 */
		setTagSelector(tagSelector: TagSelector): void;
		focusSearch(): void;
		clearSearch(): void;
		getLoader(): BX.Loader;
		showLoader(): void;
		hideLoader(): void;
		destroyLoader(): void;
		getPopup(): BX.Main.Popup;
		getAriaLabel(): string;
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
		load(): void;
		isLoaded(): boolean;
		isLoading(): boolean;
		hasDynamicLoad(): boolean;
		hasDynamicSearch(): boolean;
		saveRecentItem(item: Item): void;
		/**
		 * @private
		 */
		saveRecentItems(): void;
		shouldClearUnavailableItems(): boolean;
		/**
		 * @private
		 */
		handleTagSelectorInput(): void;
		/**
		 * @private
		 */
		handleTagSelectorAddButtonClick(): void;
		/**
		 * @private
		 */
		handleTagSelectorTagRemove(event: BX.Event.BaseEvent): void;
		/**
		 * @private
		 */
		handleTagSelectorAfterTagRemove(): void;
		/**
		 * @private
		 */
		handleTagSelectorAfterTagAdd(): void;
		/**
		 * @private
		 */
		adjustByTagSelector(): void;
		/**
		 * @private
		 */
		handleTagSelectorClick(): void;
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
		handlePopupAfterShow(): void;
		/**
		 * @private
		 */
		handlePopupFirstShow(): void;
		/**
		 * @private
		 */
		handlePopupShow(): void;
		/**
		 * @private
		 */
		handleAutoHide(event: MouseEvent): boolean;
		/**
		 * @private
		 */
		observeTabOverlapping(): void;
		/**
		 * @private
		 */
		disconnectTabOverlapping(): void;
		/**
		 * @private
		 */
		handlePopupAfterClose(): void;
		/**
		 * @private
		 */
		handlePopupDestroy(): void;
		/**
		 * @private
		 */
		handleLabelsMouseEnter(): void;
		/**
		 * @private
		 */
		handleLabelsMouseLeave(): void;
		/**
		 * @private
		 */
		handleItemNodeFocus(event: BX.Event.BaseEvent): void;
		/**
		 * @private
		 */
		handleItemNodeUnfocus(): void;
		getAjaxJson(): {
			[key: string]: any;
		};
		/** @internal */
		emitEntityErrors(errorOptions: EntityErrorOptions[]): void;
	}

	/**
	 * @memberof BX.UI.EntitySelector
	 * @package ui.entity-selector
	 */
	class Item {
		id: string | number;
		entityId: string;
		entityType: string;
		title: TextNode | null;
		subtitle: TextNode | null;
		supertitle: TextNode | null;
		caption: TextNode | null;
		captionOptions: {
			[key: string]: any;
		};
		avatar: string | null;
		avatarOptions: AvatarOptions | null;
		textColor: string | null;
		link: string | null;
		linkTitle: TextNode | null;
		tagOptions: Map<string, any>;
		badges: ItemBadge[] | null;
		badgesOptions: {
			[key: string]: any;
		};
		dialog: Dialog;
		nodes: Set<ItemNode>;
		selected: boolean;
		searchable: boolean;
		saveable: boolean;
		deselectable: boolean;
		hidden: boolean;
		locked: boolean;
		searchIndex: SearchIndex | null;
		customData: Map<string, any>;
		sort: number | null;
		contextSort: number | null;
		globalSort: number | null;
		constructor(itemOptions: ItemOptions);
		getId(): string | number;
		getEntityId(): string;
		getEntity(): Entity;
		getEntityType(): string;
		getTitle(): string;
		getTitleNode(): TextNode | null;
		setTitle(title: string | null | undefined | TextNodeOptions): void;
		getSubtitle(): string | null;
		getSubtitleNode(): TextNode | null;
		setSubtitle(subtitle: string | null | undefined | TextNodeOptions): void;
		getSupertitle(): string | null;
		getSupertitleNode(): TextNode | null;
		setSupertitle(supertitle: string | null | undefined | TextNodeOptions): void;
		getCaption(): string | null;
		getCaptionNode(): TextNode | null;
		setCaption(caption: string | null | undefined | TextNodeOptions): void;
		getCaptionOption(option: string): string | boolean | number | null;
		setCaptionOption(option: string, value: string | boolean | number | null): void;
		setCaptionOptions(options: {
			[key: string]: any;
		} | undefined): void;
		getAvatar(): string | null;
		setAvatar(avatar: string | null | undefined): void;
		getAvatarOption(option: keyof AvatarOptions): string | boolean | number | null;
		setAvatarOption(option: keyof AvatarOptions, value: string | boolean | number | null): void;
		setAvatarOptions(options: AvatarOptions | undefined): void;
		getTextColor(): string | null;
		setTextColor(textColor: string | null | undefined): void;
		getLink(): string | null;
		setLink(link: string | null | undefined): void;
		getLinkTitle(): string | null;
		getLinkTitleNode(): TextNode | null;
		setLinkTitle(linkTitle: string | null | TextNodeOptions | undefined): void;
		getBadges(): ItemBadge[];
		setBadges(badges: ItemBadgeOptions[] | null | void): void;
		getBadgesOption(option: string): string | boolean | number | null;
		setBadgesOption(option: string, value: string | boolean | number | null): void;
		setBadgesOptions(options: {
			[key: string]: any;
		} | undefined): void;
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
		setSearchable(flag: boolean | undefined): void;
		isSearchable(): boolean;
		setSaveable(flag: boolean | undefined): void;
		isSaveable(): boolean;
		setDeselectable(flag: boolean | undefined): void;
		isDeselectable(): boolean;
		setHidden(flag: boolean | undefined): void;
		isHidden(): boolean;
		lock(): void;
		unlock(): void;
		isLocked(): boolean;
		setContextSort(sort: number | null | undefined): void;
		getContextSort(): number | null;
		setGlobalSort(sort: number | null | undefined): void;
		getGlobalSort(): number | null;
		setSort(sort: number | null | undefined): void;
		getSort(): number | null;
		getSearchIndex(): SearchIndex;
		resetSearchIndex(): void;
		getCustomData(): Map<string, any>;
		setCustomData(property: string | null | undefined | {
			[key: string]: any;
		}, value?: any): void;
		isRendered(): boolean;
		getEntityItemOption(option: string): any;
		getEntityTagOption(option: string): any;
		getEntityTextNode(option: string): TextNode | null;
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
		createTag(): Record<string, any>;
		getAjaxJson(): {
			[key: string]: any;
		};
		toJSON(): {
			[key: string]: any;
		};
	}

	class TextNode {
		text: string | null;
		type: TextNodeType | null;
		constructor(options: TextNodeOptions | string);
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

	class TextNodeType {
		static TEXT: string;
		static HTML: string;
		static isValid(type: unknown): type is TextNodeType;
	}

	class ItemBadge {
		title: TextNode | null;
		textColor: string | null;
		bgColor: string | null;
		border: string | null;
		containers: WeakMap<HTMLElement, HTMLElement>;
		constructor(badgeOptions: ItemBadgeOptions);
		getTitle(): string;
		getTitleNode(): TextNode | null;
		setTitle(title: string | null | undefined | TextNodeOptions): void;
		getTextColor(): string | null;
		setTextColor(textColor: string | null | undefined): void;
		getBgColor(): string | null;
		setBgColor(bgColor: string | null | undefined): void;
		getBorder(): string | null;
		setBorder(border: string | null | undefined): void;
		getContainer(target: HTMLElement): HTMLElement;
		renderTo(target: HTMLElement): void;
		toJSON(): {
			title: TextNode | null;
			textColor: string | null;
			bgColor: string | null;
			border: string | null;
		};
	}

	class ItemNode {
		item: Item | null;
		tab: Tab | null;
		id: string;
		cache: BX.Cache.MemoryCache<HTMLElement>;
		parentNode: ItemNode | null;
		children: BX.Collections.OrderedArray<ItemNode>;
		childItems: WeakMap<Item, ItemNode>;
		loaded: boolean;
		dynamic: boolean;
		dynamicPromise: Promise<any> | null;
		loader: BX.Loader | null;
		open: boolean;
		autoOpen: boolean;
		focused: boolean;
		renderMode: RenderMode;
		title: TextNode | null;
		subtitle: TextNode | null;
		supertitle: TextNode | null;
		caption: TextNode | null;
		captionOptions: Record<string, string | boolean | number | null>;
		avatar: string | null;
		avatarOptions: Record<string, string | boolean | number | null> | null;
		link: string | null;
		linkTitle: TextNode | null;
		textColor: string | null;
		badges: ItemBadge[] | null;
		badgesOptions: Record<string, string | boolean | number | null>;
		hidden: boolean;
		highlights: MatchField[];
		rendered: boolean;
		renderWithDebounce: Function;
		constructor(item: Item, nodeOptions: ItemNodeOptions);
		getItem(): Item;
		isRoot(): boolean;
		getId(): string;
		getDialog(): Dialog;
		setTab(tab: Tab): void;
		getTab(): Tab;
		getParentNode(): ItemNode | null;
		setParentNode(parentNode: ItemNode | null): void;
		getNextSibling(): ItemNode | null;
		getPreviousSibling(): ItemNode | null;
		addChildren(children: ItemOptions[] | null | undefined): void;
		addChild(child: ItemNode): ItemNode | null;
		getDepthLevel(): number;
		addItem(item: Item, nodeOptions?: ItemNodeOptions): ItemNode;
		addItems(items: Item[] | Array<[Item, ItemNodeOptions]>): void;
		hasItem(item: Item): boolean;
		removeChild(child: ItemNode): boolean;
		removeChildren(): void;
		hasChild(child: ItemNode): boolean;
		isChildOf(parent: ItemNode): boolean;
		getFirstChild(): ItemNode | null;
		getLastChild(): ItemNode | null;
		getChildren(): BX.Collections.OrderedArray<ItemNode>;
		hasChildren(): boolean;
		loadChildren(): Promise<any>;
		setOpen(open: boolean | undefined): void;
		isOpen(): boolean;
		isAutoOpen(): boolean;
		setAutoOpen(autoOpen: boolean | undefined): void;
		setDynamic(dynamic: boolean | undefined): void;
		isDynamic(): boolean;
		isLoaded(): boolean;
		getLoader(): BX.Loader;
		showLoader(): void;
		hideLoader(): void;
		destroyLoader(): void;
		expand(): void;
		collapse(): void;
		render(appendChildren?: boolean): void;
		/**
		 * @private
		 */
		renderRoot(appendChildren?: boolean): void;
		/**
		 * @private
		 */
		renderChildren(appendChildren?: boolean): void;
		isRendered(): boolean;
		enableRender(): void;
		disableRender(): void;
		getRenderMode(): RenderMode;
		isHidden(): boolean;
		setHidden(flag: boolean): void;
		toggleVisibility(): void;
		lock(): void;
		unlock(): void;
		getTitle(): string | null;
		getTitleNode(): TextNode | null;
		setTitle(title: string | TextNodeOptions | null | undefined): void;
		getSubtitle(): string | null;
		getSubtitleNode(): TextNode | null;
		setSubtitle(subtitle: string | TextNodeOptions | null | undefined): void;
		getSupertitle(): string | null;
		getSupertitleNode(): TextNode | null;
		setSupertitle(supertitle: string | TextNodeOptions | null | undefined): void;
		getCaption(): string | null;
		getCaptionNode(): TextNode | null;
		setCaption(caption: string | TextNodeOptions | null | undefined): void;
		getCaptionOption(option: string): string | boolean | number | null;
		setCaptionOption(option: string, value: string | boolean | number | null): void;
		setCaptionOptions(options: {
			[key: string]: any;
		} | null | undefined): void;
		getAvatar(): string | null;
		setAvatar(avatar: string | null | undefined): void;
		getAvatarOption(option: keyof AvatarOptions): string | boolean | number | null;
		setAvatarOption(option: keyof AvatarOptions, value: string | boolean | number | null): void;
		setAvatarOptions(avatarOptions: AvatarOptions | null | undefined): void;
		getTextColor(): string | null;
		setTextColor(textColor: string | null | undefined): void;
		getLink(): string | null;
		setLink(link: string | null | undefined): void;
		getLinkTitle(): string | null;
		getLinkTitleNode(): TextNode | null;
		setLinkTitle(title: string | TextNodeOptions | null | undefined): void;
		getBadges(): ItemBadge[];
		setBadges(badges: ItemBadgeOptions[] | null | void): void;
		getBadgesOption(option: string): string | boolean | number | null;
		setBadgesOption(option: string, value: string | boolean | number | null): void;
		setBadgesOptions(options: {
			[key: string]: any;
		} | null | undefined): void;
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
		focus(focusVisible?: boolean): void;
		unfocus(): void;
		isFocused(): boolean;
		click(): void;
		scrollIntoView(): void;
		handleClick(): void;
		handleLinkClick(event: MouseEvent): void;
		handleMouseEnter(): void;
		handleMouseLeave(): void;
		handleFocusOut(): void;
		handleFocus(): void;
	}

	/**
	 * @memberof BX.UI.EntitySelector
	 */
	class Tab {
		id: string;
		title: TextNode | null;
		rootNode: ItemNode;
		dialog: Dialog;
		stub: BaseStub | null;
		visible: boolean;
		rendered: boolean;
		locked: boolean;
		selected: boolean;
		hovered: boolean;
		icon: TabLabelStates;
		textColor: TabLabelStates;
		bgColor: TabLabelStates;
		itemMaxDepth: number;
		header: BaseHeader | null;
		showDefaultHeader: boolean;
		footer: BaseFooter | null;
		showDefaultFooter: boolean;
		showAvatars: boolean | null;
		cache: BX.Cache.MemoryCache<HTMLElement>;
		constructor(dialog: Dialog, tabOptions: TabOptions);
		getId(): string;
		getTabPanelId(): string;
		getListBoxId(): string;
		getLabelId(): string;
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
		setHeader(headerContent: HeaderContent | null | undefined, headerOptions?: HeaderOptions): void;
		canShowDefaultHeader(): boolean;
		enableDefaultHeader(): void;
		disableDefaultHeader(): void;
		getFooter(): BaseFooter | null;
		setFooter(footerContent: FooterContent | null | undefined, footerOptions?: FooterOptions): void;
		canShowDefaultFooter(): boolean;
		enableDefaultFooter(): void;
		disableDefaultFooter(): void;
		setShowAvatars(flag: boolean | null | undefined): void;
		shouldShowAvatars(): boolean;
		getRootNode(): ItemNode;
		setTitle(title: string | null | undefined | TextNodeOptions): void;
		getTitle(): string;
		getTitleNode(): TextNode | null;
		setIcon(icon: TabLabelStates | string | undefined): void;
		getIcon(state?: TabLabelState): string | null;
		setBgColor(bgColor: TabLabelStates | string | undefined): void;
		getBgColor(state?: TabLabelState): string | null;
		setTextColor(textColor: TabLabelStates | string | undefined): void;
		getTextColor(state?: TabLabelState): string | null;
		/**
		 * @private
		 */
		setProperty(name: 'icon' | 'bgColor' | 'textColor', states: TabLabelStates | string | undefined): void;
		/**
		 * @private
		 */
		getPropertyByState(name: 'icon' | 'bgColor' | 'textColor', state?: TabLabelState): string | null;
		/**
		 * @private
		 */
		getPropertyByCurrentState(name: 'icon' | 'bgColor' | 'textColor'): string | null;
		setItemMaxDepth(depth: number | undefined): void;
		getItemMaxDepth(): number;
		getContainer(): HTMLElement;
		getLabelContainer(): HTMLElement;
		getIconContainer(): HTMLElement;
		getTitleContainer(): HTMLElement;
		getItemsContainer(): HTMLElement;
		getListBoxContainer(): HTMLElement;
		render(): void;
		/** @internal */
		renderLabel(): void;
		/** @internal */
		renderContainer(): void;
		isVisible(): boolean;
		setVisible(flag: boolean | undefined): void;
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

	class BaseStub {
		tab: Tab;
		autoShow: boolean;
		cache: BX.Cache.MemoryCache<HTMLElement>;
		content: HTMLElement | null;
		options: Record<string, unknown>;
		constructor(tab: Tab, options: Record<string, unknown>);
		/**
		 * @abstract
		 */
		render(): HTMLElement;
		getTab(): Tab;
		getOuterContainer(): HTMLElement;
		isAutoShow(): boolean;
		show(): void;
		hide(): void;
		getOptions(): Record<string, unknown>;
		getOption<T = unknown>(option: string, defaultValue?: T): T;
	}

	class BaseHeader {
		dialog: Dialog;
		tab: Tab | null;
		container: HTMLElement | null;
		cache: BX.Cache.MemoryCache<HTMLElement>;
		options: HeaderOptions;
		constructor(context: Dialog | Tab, options: HeaderOptions);
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
		dialog: Dialog;
		tab: Tab | null;
		container: HTMLElement | null;
		cache: BX.Cache.MemoryCache<HTMLElement>;
		options: FooterOptions;
		constructor(context: Dialog | Tab, options: FooterOptions);
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

	class RenderMode {
		static PARTIAL: string;
		static OVERRIDE: string;
	}

	class MatchField {
		field: SearchField | null;
		matchIndexes: BX.Collections.OrderedArray<MatchIndex>;
		constructor(field: SearchField, indexes?: MatchIndex[]);
		getField(): SearchField | null;
		getMatches(): BX.Collections.OrderedArray<MatchIndex>;
		addIndex(matchIndex: MatchIndex): void;
		addIndexes(matchIndexes: MatchIndex[]): void;
	}

	class SearchField {
		name: string | null;
		type: string;
		searchable: boolean;
		system: boolean;
		sort: number | null;
		constructor(fieldOptions: SearchFieldOptions);
		getName(): string;
		getType(): string;
		setType(type: string | undefined): void;
		getSort(): number | null;
		setSort(sort: number | null | undefined): void;
		setSearchable(flag: boolean | undefined): void;
		isSearchable(): boolean;
		setSystem(flag: boolean | undefined): void;
		isCustom(): boolean;
		isSystem(): boolean;
	}

	class MatchIndex {
		field: SearchField | null;
		queryWord: string | null;
		startIndex: number | null;
		endIndex: number | null;
		constructor(field: SearchField, queryWord: string, startIndex: number);
		getField(): SearchField | null;
		getQueryWord(): string | null;
		getStartIndex(): number | null;
		getEndIndex(): number | null;
	}

	class SearchIndex {
		indexes: SearchFieldIndex[];
		addIndex(fieldIndex: SearchFieldIndex | null): void;
		getIndexes(): SearchFieldIndex[];
		static create(item: Item): SearchIndex;
		static createIndex(field: SearchField, text: string, stripTags?: boolean): SearchFieldIndex | null;
		static splitText(text: string): WordIndex[];
		static splitUnicodeText(text: string): WordIndex[];
		static splitAsciiText(text: string): WordIndex[];
		static hasUnicodeWord(text: string): boolean;
		static splitTextInternal(text: string, regExp: RegExp): WordIndex[];
		/**
		 *  @private
		 */
		static fillComplexWords(indexes: WordIndex[]): void;
		/**
		 *  @private
		 */
		static fillNonCharWords(indexes: WordIndex[], text: string): void;
	}

	class SearchFieldIndex {
		field: SearchField | null;
		indexes: WordIndex[];
		constructor(field: SearchField, indexes?: WordIndex[]);
		getField(): SearchField | null;
		getIndexes(): WordIndex[];
		addIndex(index: WordIndex): void;
		addIndexes(indexes: WordIndex[]): void;
	}

	class WordIndex {
		word: string;
		startIndex: number;
		constructor(word: string, startIndex: number);
		getWord(): string;
		setWord(word: string): this;
		getStartIndex(): number;
		setStartIndex(index: number): this;
	}

	/**
	 * @memberof BX.UI.EntitySelector
	 */
	class Entity {
		static extensions: string[] | null;
		static defaultOptions: {
			[entityId: string]: {
				[key: string]: any;
			};
		} | null;
		id: string;
		options: {
			[key: string]: any;
		};
		searchable: boolean;
		searchFields: BX.Collections.OrderedArray<SearchField>;
		dynamicLoad: boolean;
		dynamicSearch: boolean;
		dynamicSearchMatchMode: 'all' | 'exact';
		substituteEntityId: string | null;
		fillRecentItems: boolean;
		searchCacheLimits: RegExp[];
		filters: Map<string | null, EntityFilter>;
		itemOptions: {
			[key: string]: any;
		};
		tagOptions: {
			[key: string]: any;
		};
		badgeOptions: ItemBadgeOptions[];
		textNodes: Map<string, Map<string, TextNode | null>>;
		constructor(entityOptions: EntityOptions);
		static getDefaultOptions(): {
			[entityId: string]: {
				[key: string]: any;
			};
		};
		static getExtensions(): string[];
		static getEntityDefaultOptions(entityId: string): {
			[key: string]: any;
		};
		static getItemOptions(entityId: string, entityType?: string): any;
		static getTagOptions(entityId: string, entityType?: string): any;
		getId(): string;
		getOptions(): {
			[key: string]: any;
		};
		getItemOptions(): {
			[key: string]: any;
		};
		static getItemOption(entityId: string, option: string, entityType?: string): any;
		getItemOption(option: string, entityType?: string): any;
		getTagOptions(): {
			[key: string]: any;
		};
		static getTagOption(entityId: string, option: string, entityType?: string): any;
		getTagOption(option: string, entityType?: string): any;
		static getOptionInternal(options: Record<string, any> | null, option: string, type?: string): any;
		getBadges(item: Item): EntityBadgeOptions[];
		getOptionTextNode(option: string, entityType?: string): TextNode | null;
		isSearchable(): boolean;
		setSearchable(flag: boolean | undefined): void;
		getSearchFields(): BX.Collections.OrderedArray<SearchField>;
		setSearchFields(searchFields: SearchFieldOptions[] | undefined): void;
		setSearchCacheLimits(limits: string[] | undefined): void;
		getSearchCacheLimits(): RegExp[];
		hasDynamicLoad(): boolean;
		setDynamicLoad(flag: boolean | undefined): void;
		hasDynamicSearch(): boolean;
		setDynamicSearch(flag: boolean | undefined): void;
		setDynamicSearchMatchMode(mode: 'all' | 'exact' | undefined): void;
		getDynamicSearchMatchMode(): 'all' | 'exact';
		getFilters(): EntityFilter[];
		addFilters(filters: EntityFilterOptions[]): void;
		addFilter(filterOptions: EntityFilterOptions): void;
		getFilter(id: string): EntityFilter | null;
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

	class EntityFilter {
		id: string | null;
		options: {
			[key: string]: any;
		};
		constructor(filterOptions: EntityFilterOptions);
		getId(): string | null;
		getOptions(): {
			[key: string]: any;
		};
		toJSON(): {
			id: string | null;
			options: {
				[key: string]: any;
			};
		};
	}

	class RecentTab extends Tab {
		constructor(dialog: Dialog, tabOptions: Omit<TabOptions, 'id'> | undefined);
	}

	class SearchTab extends Tab {
		lastSearchQuery: SearchQuery | null;
		queryCache: Set<string>;
		queryXhr: XMLHttpRequest | null;
		searchLoader: SearchLoader;
		allowCreateItem: boolean;
		loadWithDebounce: () => void;
		resultsAnnouncer: SearchResultsAnnouncer;
		constructor(dialog: Dialog, tabOptions: TabOptions, searchOptions: SearchOptions);
		search(query: string): void;
		getResultsAnnouncer(): SearchResultsAnnouncer;
		getLastSearchQuery(): SearchQuery | null;
		setAllowCreateItem(flag: boolean | null | undefined, options?: FooterOptions): void;
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

	class SearchQuery {
		queryWords: string[];
		query: string;
		cacheable: boolean;
		dynamicSearchEntities: string[];
		resultLimit: number;
		constructor(query: string);
		getQueryWords(): string[];
		getQuery(): string;
		isEmpty(): boolean;
		setCacheable(flag: boolean): void;
		isCacheable(): boolean;
		setResultLimit(limit: number): void;
		getResultLimit(): number;
		hasDynamicSearch(): boolean;
		hasDynamicSearchEntity(entityId: string): boolean;
		setDynamicSearchEntities(entities: string[]): string[];
		getDynamicSearchEntities(): string[];
		getAjaxJson(): {
			[key: string]: any;
		};
		toJSON(): {
			[key: string]: any;
		};
	}

	class SearchLoader {
		tab: Tab;
		loader: BX.Loader | null;
		cache: BX.Cache.MemoryCache<HTMLElement>;
		constructor(tab: Tab);
		getTab(): Tab;
		getLoader(): BX.Loader;
		getContainer(): HTMLElement;
		getBoxContainer(): HTMLElement;
		getIconContainer(): HTMLElement;
		getTextContainer(): HTMLElement;
		getSpacerContainer(): HTMLElement;
		show(): void;
		hide(): void;
		isShown(): boolean;
	}

	/**
	 * Coalesces search-results announcements bound to a single dialog.
	 *
	 * The global {@link LiveAnnouncer} drains its polite queue slowly (up to 4s per
	 * item), while search runs on a short debounce. Announcing every finished search
	 * directly would let the queue outrun its own processing and read out stale
	 * counts after the query changed or the dialog closed. This helper keeps only
	 * the last pending message and hands a single value to the announcer once typing
	 * settles; {@link SearchResultsAnnouncer#cancel} drops the pending announcement
	 * when the dialog is hidden or destroyed.
	 */
	class SearchResultsAnnouncer {
		constructor(delay?: number);
		announce(message: string): void;
		cancel(): void;
	}

	class MatchResult {
		item: Item;
		matchFields: Map<SearchField, MatchField>;
		sort: number | null;
		constructor(item: Item, matchIndexes?: MatchIndex[]);
		getItem(): Item;
		getMatchFields(): Map<SearchField, MatchField>;
		getSort(): number | null;
		addIndex(matchIndex: MatchIndex): void;
		addIndexes(matchIndexes: MatchIndex[]): void;
	}

	/**
	 * @memberof BX.UI.EntitySelector
	 */
	class TagSelector extends BX.Event.EventEmitter {
		id: string;
		tags: TagItem[];
		cache: BX.Cache.MemoryCache<HTMLElement>;
		rendered: boolean;
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
		tagClickable: boolean | null;
		dialog: Dialog | null;
		focusZone: BX.UI.Accessibility.FocusZone | null;
		focusZoneOptions: Partial<BX.UI.Accessibility.FocusZoneOptions>;
		constructor(selectorOptions: TagSelectorOptions);
		getDialog(): Dialog | null;
		/**
		 * @internal
		 * @param dialog
		 */
		setDialog(dialog: Dialog | null): void;
		setReadonly(flag: boolean | undefined): void;
		isReadonly(): boolean;
		setLocked(flag: boolean | undefined): void;
		lock(): void;
		unlock(): void;
		isLocked(): boolean;
		isMultiple(): boolean;
		setDeselectable(flag: boolean | undefined): void;
		isDeselectable(): boolean;
		getTag(tagItem: TagItem | ItemOptions | TagItemOptions): TagItem | null;
		addTag(tagOptions: TagItemOptions): TagItem | null;
		removeTag(item: TagItem | ItemOptions, animate?: boolean): void;
		removeTags(): void;
		getTags(): TagItem[];
		renderTo(node: HTMLElement): void;
		toggleFocusZone(): void;
		isRendered(): boolean;
		/**
		 * @private
		 */
		updateTags(): void;
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
		tryAutoHideTextBox(): void;
		focusTextBox(): void;
		setTextBoxAutoHide(autoHide: boolean | undefined): void;
		getTextBoxWidth(): string | number | null;
		setTextBoxWidth(width: string | number | null | undefined): void;
		getTagMaxWidth(): number | null;
		setTagMaxWidth(width: number | null | undefined): void;
		getTagAvatar(): string | null;
		setTagAvatar(tagAvatar: string | null | undefined): void;
		getTagClickable(): boolean | null;
		setTagClickable(flag: boolean | null | undefined): void;
		getTagAvatarOptions(): AvatarOptions | null;
		getTagAvatarOption(option: keyof AvatarOptions): string | boolean | number | null;
		setTagAvatarOption(option: keyof AvatarOptions, value: string | boolean | number | null | undefined): void;
		setTagAvatarOptions(options: AvatarOptions | undefined): void;
		getTagTextColor(): string | null;
		setTagTextColor(textColor: string | null | undefined): void;
		getTagBgColor(): string | null;
		setTagBgColor(bgColor: string | null | undefined): void;
		getTagFontWeight(): string | null;
		setTagFontWeight(fontWeight: string | null | undefined): void;
		getPlaceholder(): string;
		setPlaceholder(placeholder: string | undefined): void;
		getMaxHeight(): number | null;
		getMinHeight(): number;
		setMaxHeight(height: number | null | undefined): void;
		getAddButton(): HTMLElement;
		getAddButtonLink(): HTMLElement;
		getAddButtonCaption(): string;
		setAddButtonCaption(caption: string | undefined): void;
		getAddButtonCaptionMore(): string | null;
		setAddButtonCaptionMore(caption: string | undefined): void;
		toggleAddButtonCaption(): void;
		getActualButtonCaption(): string;
		showAddButton(): void;
		hideAddButton(): void;
		getCreateButton(): HTMLElement;
		showCreateButton(): void;
		hideCreateButton(): void;
		getCreateButtonCaption(): string;
		setCreateButtonCaption(caption: string | undefined): void;
		handleContainerClick(event: MouseEvent): void;
		handleTextBoxInput(event: InputEvent): void;
		handleTextBoxBlur(event: FocusEvent): void;
		handleTextBoxKeyUp(event: KeyboardEvent): void;
		handleTextBoxKeyDown(event: KeyboardEvent): void;
		handleAddButtonClick(event: MouseEvent): void;
		handleCreateButtonClick(event: MouseEvent): void;
	}

	class TagItem {
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
		clickable: boolean | null;
		deselectable: boolean | null;
		customData: Map<string, any>;
		cache: BX.Cache.MemoryCache<HTMLElement>;
		selector: TagSelector;
		rendered: boolean;
		constructor(selector: TagSelector, itemOptions: TagItemOptions);
		getId(): string | number;
		getEntityId(): string;
		getEntityType(): string;
		getSelector(): TagSelector;
		getTitle(): string;
		getTitleNode(): TextNode | null;
		setTitle(title: string | TextNodeOptions | null | undefined): void;
		getAvatar(): string | null;
		setAvatar(avatar: string | null | undefined): void;
		getAvatarOption(option: keyof AvatarOptions): string | boolean | number | null;
		setAvatarOption(option: keyof AvatarOptions, value: string | boolean | number | null): void;
		setAvatarOptions(options: AvatarOptions | null | undefined): void;
		getTextColor(): string | null;
		setTextColor(textColor: string | null | undefined): void;
		getBgColor(): string | null;
		setBgColor(bgColor: string | null | undefined): void;
		getFontWeight(): string | null;
		setFontWeight(fontWeight: string | null | undefined): void;
		getMaxWidth(): number | null;
		setMaxWidth(width: number | null | undefined): void;
		setDeselectable(flag: boolean | null | undefined): void;
		isDeselectable(): boolean;
		getCustomData(): Map<string, any>;
		getLink(): string | null;
		getOnclick(): Function | null;
		setClickable(flag: boolean | null | undefined): void;
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
		remove(animate?: boolean): Promise<void>;
		show(): Promise<void>;
		handleContainerClick(): void;
		handleRemoveIconClick(event: MouseEvent): void;
		handleKeyDown(event: KeyboardEvent): void;
	}

	class TagSelectorMode {
		static INSIDE: string;
		static OUTSIDE: string;
	}

	class Navigation {
		dialog: Dialog;
		lockedTab: Tab | null;
		enabled: boolean;
		static keyMap: Record<string, string>;
		constructor(dialog: Dialog);
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
		focusOnNode(node: ItemNode | null | undefined): void;
		lockTab(): void;
		unlockTab(): void;
		handleDialogShow(): void;
		handleDialogHide(): void;
		handleDialogDestroy(): void;
		isFocusInLabels(event: KeyboardEvent | MouseEvent): boolean;
		handleArrowDownPress(event: KeyboardEvent): void;
		handleArrowUpPress(event: KeyboardEvent): void;
		handleArrowRightPress(event: KeyboardEvent): void;
		handleArrowLeftPress(event: KeyboardEvent): void;
		handleEnterPress(event: KeyboardEvent): void;
		handleSpacePress(event: KeyboardEvent): void;
		handleTabPress(event: KeyboardEvent): void;
	}

	class DefaultHeader extends BaseHeader {
		content: HTMLElement | HTMLElement[] | string | null;
		constructor(context: Dialog | Tab, options: HeaderOptions);
		render(): HTMLElement;
		getContent(): HTMLElement | HTMLElement[] | string | null;
		setContent(content: string | HTMLElement | HTMLElement[]): void;
	}

	class DefaultFooter extends BaseFooter {
		content: HTMLElement | HTMLElement[] | string | null;
		constructor(context: Dialog | Tab, options: FooterOptions);
		render(): HTMLElement;
		getContent(): HTMLElement | HTMLElement[] | string | null;
		setContent(content: string | HTMLElement | HTMLElement[]): void;
	}

	class DefaultStub extends BaseStub {
		content: HTMLElement | null;
		getContainer(): HTMLElement;
		getDefaultTitle(): string;
		render(): HTMLElement;
	}

	/**
	 * @namespace BX.UI.Uploader
	 */
	class EntityError extends BX.BaseError {
		setEntityId(entityId: string): void;
		getEntityId(): string;
	}
}
