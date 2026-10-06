// eslint-disable-next-line max-classes-per-file
import { Type, Text, Tag, Dom, ajax as Ajax, Loc, Runtime, Reflection, type JsonObject } from 'main.core';
import { MemoryCache } from 'main.core.cache';
import { EventEmitter, BaseEvent } from 'main.core.events';
import { Popup, type PopupOptions } from 'main.popup';
import { Loader } from 'main.loader';
import { FocusNavigator, FocusMonitor, InteractivityChecker, type FocusTrap } from 'ui.a11y';

import { Item } from '../item/item';
import { Tab } from './tabs/tab';
import { Entity } from '../entity/entity';
import { EntityErrorCollection } from '../entity/entity-error-collection';
import { TagSelector } from '../tag-selector/tag-selector';
import { Navigation } from './navigation';
import { SliderIntegration } from './integration/slider-integration';
import { Animation } from '../common/animation';
import { BaseHeader } from './header/base-header';
import { DefaultHeader } from './header/default-header';
import { BaseFooter } from './footer/base-footer';
import { DefaultFooter } from './footer/default-footer';

import { RecentTab } from './tabs/recent-tab';
import { SearchTab } from './tabs/search-tab';

import { type ItemNode } from '../item/item-node';
import { type TabOptions } from './tabs/tab-options';
import { type DialogOptions } from './dialog-options';
import { type ItemOptions, type ItemSelectOptions } from '../item/item-options';
import { type EntityOptions } from '../entity/entity-options';
import { type ItemId } from '../item/item-id';
import { type EntityErrorOptions } from '../entity/entity-error-options';
import { type HeaderOptions, type HeaderContent } from './header/header-content';
import { type FooterOptions, type FooterContent } from './footer/footer-content';
import { type ItemNodeOptions } from '../item/item-node-options';
import { type TagItemOptions } from '../tag-selector/tag-item-options';
import { type SearchOptions } from './search-options';

class LoadState
{
	static UNSENT: string = 'UNSENT';
	static LOADING: string = 'LOADING';
	static DONE: string = 'DONE';
}

class TagSelectorMode
{
	static INSIDE: string = 'INSIDE';
	static OUTSIDE: string = 'OUTSIDE';
}

const instances = new Map();

/**
 * @memberof BX.UI.EntitySelector
 */
export class Dialog extends EventEmitter
{
	id: string;
	items: Map<string, Map<string, Item>> = new Map();
	tabs: Map<string, Tab> = new Map();
	entities: Map<string, Entity> = new Map();
	targetNode: HTMLElement | { left: number; top: number } | MouseEvent | null = null;
	popup: Popup | null = null;
	cache = new MemoryCache<HTMLElement>();
	multiple: boolean = true;
	hideOnSelect: boolean | null = null;
	hideOnDeselect: boolean | null = null;
	addTagOnSelect: boolean | null = null;
	clearSearchOnSelect: boolean = true;
	context: string | null = null;
	selectedItems: Set<Item> = new Set();
	preselectedItems: ItemId[] = [];
	undeselectedItems: ItemId[] = [];
	dropdownMode: boolean = false;

	frozen: boolean = false;
	frozenProps: { [propName: string]: any } = {};

	hideByEsc: boolean = true;
	autoHide: boolean = true;
	autoHideHandler: ((event: MouseEvent, dialog: Dialog) => boolean) | null = null;
	offsetTop: number = 5;
	offsetLeft: number = 0;
	cacheable: boolean = true;

	width: number = 565;
	height: number = 420;

	maxLabelWidth: number = 160;
	minLabelWidth: number = 38;
	alwaysShowLabels: boolean = false;

	showAvatars: boolean = true;
	compactView: boolean = false;

	activeTab: Tab | null = null;
	recentTab: RecentTab;
	searchTab: SearchTab;

	rendered: boolean = false;

	loadState: string = LoadState.UNSENT;
	loader: Loader | null = null;
	ariaLabel: string | null = null;

	tagSelector: TagSelector | null = null;
	tagSelectorMode: TagSelectorMode | null = null;
	tagSelectorHeight: number | null = null;

	saveRecentItemsWithDebounce: Function = Runtime.debounce(this.saveRecentItems, 2000, this);
	recentItemsToSave: Item[] = [];
	recentItemsLimit: number | null = null;

	navigation: Navigation;
	header: BaseHeader | null = null;
	footer: BaseFooter | null = null;
	popupOptions: PopupOptions = {};

	focusOnFirst: boolean = true;
	focusedNode: ItemNode | null = null;

	clearUnavailableItems: boolean = false;
	overlappingObserver: MutationObserver | null = null;
	offsetAnimation: boolean = true;
	customData: JsonObject = Object.create(null);
	destroyed: boolean = false;

	static getById(id: string): Dialog | null
	{
		return instances.get(id) || null;
	}

	static getInstances(): Dialog[]
	{
		return [...instances.values()];
	}

	constructor(dialogOptions: DialogOptions)
	{
		super();
		this.setEventNamespace('BX.UI.EntitySelector.Dialog');

		const options: Partial<DialogOptions> = Type.isPlainObject(dialogOptions) ? dialogOptions : {};
		this.id = Type.isStringFilled(options.id) ? options.id : `ui-selector-${Text.getRandom().toLowerCase()}`;
		this.multiple = Type.isBoolean(options.multiple) ? options.multiple : true;
		this.context = Type.isStringFilled(options.context) ? options.context : null;
		this.clearUnavailableItems = options.clearUnavailableItems === true;
		this.compactView = options.compactView === true;
		this.dropdownMode = Type.isBoolean(options.dropdownMode) ? options.dropdownMode : false;
		this.alwaysShowLabels = Type.isBoolean(options.alwaysShowLabels) ? options.alwaysShowLabels : false;
		this.ariaLabel = Type.isStringFilled(options.ariaLabel) ? options.ariaLabel : null;

		if (Type.isArray(options.entities))
		{
			for (const entity of options.entities)
			{
				this.addEntity(entity);
			}
		}

		if (options.tagSelector instanceof TagSelector)
		{
			this.tagSelectorMode = TagSelectorMode.OUTSIDE;
			this.setTagSelector(options.tagSelector);
		}
		else if (options.enableSearch === true)
		{
			const defaultOptions = {
				placeholder: Loc.getMessage('UI_TAG_SELECTOR_SEARCH_PLACEHOLDER'),
				maxHeight: 102, // three lines
				textBoxWidth: 105,
			};
			const customOptions = Type.isPlainObject(options.tagSelectorOptions) ? options.tagSelectorOptions : {};
			const mandatoryOptions = {
				dialogOptions: null,
				showTextBox: true,
				showAddButton: false,
				showCreateButton: false,
				multiple: this.isMultiple(),
			};

			const tagSelectorOptions = Object.assign(defaultOptions, customOptions, mandatoryOptions);
			const tagSelector = new TagSelector(tagSelectorOptions);
			this.tagSelectorMode = TagSelectorMode.INSIDE;
			this.setTagSelector(tagSelector);
		}

		this.setTargetNode(options.targetNode);
		this.setHideOnSelect(options.hideOnSelect);
		this.setHideOnDeselect(options.hideOnDeselect);
		this.setAddTagOnSelect(options.addTagOnSelect);
		this.setClearSearchOnSelect(options.clearSearchOnSelect);
		this.setWidth(options.width);
		void this.setHeight(options.height);
		this.setAutoHide(options.autoHide);
		this.setAutoHideHandler(options.autoHideHandler);
		this.setHideByEsc(options.hideByEsc);
		this.setOffsetLeft(options.offsetLeft);
		this.setOffsetTop(options.offsetTop);
		this.setCacheable(options.cacheable);
		this.setFocusOnFirst(options.focusOnFirst);
		this.setShowAvatars(options.showAvatars);
		this.setRecentItemsLimit(options.recentItemsLimit);
		this.setOffsetAnimation(options.offsetAnimation);

		this.recentTab = new RecentTab(this, options.recentTabOptions as TabOptions);
		this.searchTab = new SearchTab(
			this,
			options.searchTabOptions as TabOptions,
			options.searchOptions as SearchOptions,
		);

		this.addTab(this.recentTab);
		this.addTab(this.searchTab);

		this.setPreselectedItems(options.preselectedItems);
		this.setUndeselectedItems(options.undeselectedItems);

		this.setOptions(options);

		const preload = options.preload === true || this.getPreselectedItems().length > 0;
		if (preload)
		{
			this.load();
		}

		if (Type.isPlainObject(options.popupOptions))
		{
			const allowedOptions = new Set([
				'overlay',
				'bindOptions',
				'targetContainer',
				'zIndexOptions',
				'events',
				'animation',
				'className',
				'focusTrap',
				'ariaLabel',
				'ariaLabelledBy',
				'role',
			]);

			const sourcePopupOptions: Record<string, unknown> = options.popupOptions;
			const popupOptions: Record<string, unknown> = {};

			for (const option of Object.keys(sourcePopupOptions))
			{
				if (allowedOptions.has(option))
				{
					popupOptions[option] = sourcePopupOptions[option];
				}
			}

			this.popupOptions = popupOptions;
		}

		this.navigation = new Navigation(this);

		new SliderIntegration(this);

		this.subscribe('ItemNode:onFocus', this.handleItemNodeFocus.bind(this));
		this.subscribe('ItemNode:onUnfocus', this.handleItemNodeUnfocus.bind(this));

		this.subscribeFromOptions(options.events ?? {});

		instances.set(this.id, this);
	}

	show(): void
	{
		this.load();
		this.getPopup().show();
	}

	hide(): void
	{
		this.getPopup().close();
	}

	destroy(): void
	{
		if (this.destroyed)
		{
			return;
		}

		this.destroyed = true;

		this.emit('onDestroy');

		this.disconnectTabOverlapping();
		instances.delete(this.getId());
		if (this.isRendered())
		{
			this.getPopup().destroy();
		}

		for (const property in this)
		{
			if (this.hasOwnProperty(property))
			{
				delete this[property];
			}
		}

		Object.setPrototypeOf(this, null);

		this.destroyed = true;
	}

	isOpen(): boolean
	{
		return this.popup !== null && this.popup.isShown();
	}

	adjustPosition(): void
	{
		if (this.isRendered())
		{
			this.getPopup().adjustPosition();
		}
	}

	search(queryString: string): void
	{
		const query = Type.isStringFilled(queryString) ? queryString.trim() : '';

		const event = new BaseEvent({ data: { query } });
		this.emit('onBeforeSearch', event);
		if (event.isDefaultPrevented())
		{
			return;
		}

		if (!Type.isStringFilled(query))
		{
			this.selectFirstTab();
			if (this.getSearchTab())
			{
				this.getSearchTab().clearResults();
			}
		}
		else if (this.getSearchTab())
		{
			this.selectTab(this.getSearchTab().getId());
			this.getSearchTab().search(query);
		}

		this.emit('onSearch', { query });
	}

	addItem(options: ItemOptions): Item
	{
		if (!Type.isPlainObject(options))
		{
			throw new TypeError('EntitySelector.addItem: wrong item options.');
		}

		let item = this.getItem(options);
		if (!item)
		{
			item = new Item(options);

			const undeselectable = this.getUndeselectedItems().some((itemId: ItemId) => {
				return itemId[0] === item!.getEntityId() && String(itemId[1]) === String(item!.getId());
			});

			if (undeselectable)
			{
				item.setDeselectable(false);
			}

			item.setDialog(this);

			const entity = this.getEntity(item.getEntityId());
			if (entity === null)
			{
				this.addEntity({ id: item.getEntityId() });
			}

			let entityItems = this.items.get(item.getEntityId());
			if (!entityItems)
			{
				entityItems = new Map();
				this.items.set(item.getEntityId(), entityItems);
			}

			entityItems.set(String(item.getId()), item);

			if (item.isSelected())
			{
				this.handleItemSelect(item);
			}
		}

		let tabs: string[] = [];
		if (Type.isArray(options.tabs))
		{
			tabs = options.tabs;
		}
		else if (Type.isStringFilled(options.tabs))
		{
			tabs = [options.tabs];
		}

		const children = Type.isArray(options.children) ? options.children : [];

		tabs.forEach((tabId) => {
			const tab = this.getTab(tabId);
			if (tab)
			{
				const itemNode = tab.getRootNode().addItem(item, options.nodeOptions);
				itemNode.addChildren(children);
			}
		});

		return item;
	}

	removeItem(itemToRemove: Item | ItemOptions | null | undefined): Item | null
	{
		const item = this.getItem(itemToRemove);
		if (item)
		{
			this.handleItemDeselect(item);

			for (const node of item.getNodes())
			{
				node.getParentNode()!.removeChild(node);
			}

			const entityItems = this.getEntityItemsInternal(item.getEntityId());
			if (entityItems)
			{
				entityItems.delete(String(item.getId()));
				if (entityItems.size === 0)
				{
					this.items.delete(item.getEntityId());
				}
			}
		}

		return item;
	}

	removeItems(): void
	{
		this.getItemsInternal().forEach((items: Map<string, Item>) => {
			items.forEach((item: Item) => {
				this.removeItem(item);
			});
		});
	}

	getItem(item: ItemId | Item | ItemOptions | null | undefined): Item | null
	{
		let id: string | number | null = null;
		let entityId: string | null = null;

		if (Type.isArray(item) && item.length === 2)
		{
			[entityId, id] = item;
		}
		else if (item instanceof Item)
		{
			id = item.getId();
			entityId = item.getEntityId();
		}
		else if (Type.isObjectLike(item))
		{
			({ id, entityId } = item);
		}

		const entityItems = this.getEntityItemsInternal(entityId);
		if (entityItems)
		{
			return entityItems.get(String(id)) || null;
		}

		return null;
	}

	getSelectedItems(): Item[]
	{
		return [...this.selectedItems];
	}

	getItems(): Item[]
	{
		const items: Item[] = [];
		this.getItemsInternal().forEach((entityItems: Map<string, Item>) => {
			Array.prototype.push.apply(items, [...entityItems.values()]);
		});

		return items;
	}

	/**
	 * @internal
	 */
	getItemsInternal(): Map<string, Map<string, Item>>
	{
		return this.items;
	}

	getEntityItems(entityId: string): Item[]
	{
		const items = this.getEntityItemsInternal(entityId);

		return items === null ? [] : [...items.values()];
	}

	/**
	 * @internal
	 */
	getEntityItemsInternal(entityId: string | null): Map<string, Item> | null
	{
		return this.items.get(entityId as string) || null;
	}

	/**
	 * @private
	 */
	validateItemIds(itemIds?: ItemId[]): ItemId[]
	{
		if (!Type.isArrayFilled(itemIds))
		{
			return [];
		}

		const result: ItemId[] = [];
		for (const itemId of itemIds)
		{
			if (!Type.isArray(itemId) || itemId.length !== 2)
			{
				continue;
			}

			const [entityId, id] = itemId;

			if (Type.isStringFilled(entityId) && (Type.isStringFilled(id) || Type.isNumber(id)))
			{
				result.push(itemId);
			}
		}

		return result;
	}

	addTab(newTab: Tab | TabOptions): Tab
	{
		const tab = Type.isPlainObject(newTab) ? new Tab(this, newTab) : newTab;

		if (!(tab instanceof Tab))
		{
			throw new TypeError('EntitySelector: a tab must be an instance of EntitySelector.Tab.');
		}

		if (this.getTab(tab.getId()))
		{
			console.error(`EntitySelector: the "${tab.getId()}" tab is already existed.`);

			return tab;
		}

		tab.setDialog(this);
		this.tabs.set(tab.getId(), tab);

		if (this.isRendered())
		{
			this.insertTab(tab);
		}

		return tab;
	}

	getTabs(): Tab[]
	{
		return [...this.tabs.values()];
	}

	getTab(id: string): Tab | null
	{
		return this.tabs.get(id) || null;
	}

	getRecentTab(): RecentTab
	{
		return this.recentTab;
	}

	getSearchTab(): SearchTab
	{
		return this.searchTab;
	}

	selectTab(id: string): Tab | null
	{
		const newActiveTab = this.getTab(id);
		if (!newActiveTab || newActiveTab === this.getActiveTab())
		{
			return newActiveTab;
		}

		const currentActiveTab = this.getActiveTab();
		currentActiveTab?.deselect();

		this.activeTab = newActiveTab;
		newActiveTab.select();

		if (newActiveTab.isVisible())
		{
			Dom.attr(newActiveTab.getLabelContainer(), 'tabindex', '0');
			if (currentActiveTab)
			{
				Dom.attr(currentActiveTab.getLabelContainer(), 'tabindex', '-1');
			}
		}

		if (!newActiveTab.isRendered())
		{
			newActiveTab.render();
		}

		requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				if (this.destroyed)
				{
					return;
				}

				this.focusSearch();
			});
		});

		this.clearNodeFocus();
		if (this.shouldFocusOnFirst())
		{
			this.focusOnFirstNode();
		}

		this.adjustHeader();
		this.adjustFooter();

		return newActiveTab;
	}

	/**
	 * @private
	 */
	insertTab(tab: Tab): void
	{
		tab.renderLabel();
		tab.renderContainer();

		Dom.append(tab.getLabelContainer(), this.getLabelsContainer());
		Dom.append(tab.getContainer(), this.getTabContentsContainer());

		if (tab.getHeader())
		{
			Dom.append(tab.getHeader()!.getContainer(), this.getHeaderContainer());
		}

		if (tab.getFooter())
		{
			Dom.append(tab.getFooter()!.getContainer(), this.getFooterContainer());
		}
	}

	selectFirstTab(onlyVisible = true): Tab | null
	{
		const tabs = this.getTabs();
		for (const tab of tabs)
		{
			if (!onlyVisible || tab.isVisible())
			{
				return this.selectTab(tab.getId());
			}
		}

		if (this.isDropdownMode())
		{
			return this.selectTab(this.getRecentTab().getId());
		}

		return null;
	}

	selectLastTab(onlyVisible = true): Tab | null
	{
		const tabs = this.getTabs();
		for (let i = tabs.length - 1; i >= 0; i--)
		{
			const tab = tabs[i];
			if (!onlyVisible || tab.isVisible())
			{
				return this.selectTab(tab.getId());
			}
		}

		if (this.isDropdownMode())
		{
			return this.selectTab(this.getRecentTab().getId());
		}

		return null;
	}

	getActiveTab(): Tab | null
	{
		return this.activeTab;
	}

	getNextTab(onlyVisible = true): Tab | null
	{
		let nextTab = null;
		let activeFound = false;
		const tabs = this.getTabs();
		for (const tab of tabs)
		{
			if (onlyVisible && !tab.isVisible())
			{
				continue;
			}

			if (tab === this.getActiveTab())
			{
				activeFound = true;
			}
			else if (activeFound)
			{
				nextTab = tab;
				break;
			}
		}

		return nextTab;
	}

	getPreviousTab(onlyVisible = true): Tab | null
	{
		let previousTab = null;
		let activeFound = false;
		const tabs = this.getTabs();
		for (let i = tabs.length - 1; i >= 0; i--)
		{
			const tab = tabs[i];
			if (onlyVisible && !tab.isVisible())
			{
				continue;
			}

			if (tab === this.getActiveTab())
			{
				activeFound = true;
			}
			else if (activeFound)
			{
				previousTab = tab;
				break;
			}
		}

		return previousTab;
	}

	removeTab(id: string): void
	{
		const tab = this.getTab(id);
		if (!tab)
		{
			return;
		}

		tab.getRootNode().removeChildren();

		this.tabs.delete(id);

		Dom.remove(tab.getLabelContainer());
		Dom.remove(tab.getContainer());
		Dom.remove(tab.getHeader()?.getContainer());
		Dom.remove(tab.getFooter()?.getContainer());

		this.selectFirstTab();
	}

	addEntity(newEntity: Entity | EntityOptions): Entity
	{
		const entity = Type.isPlainObject(newEntity) ? new Entity(newEntity) : newEntity;

		if (!(entity instanceof Entity))
		{
			throw new TypeError('EntitySelector: an entity must be an instance of EntitySelector.Entity.');
		}

		if (this.hasEntity(entity.getId()))
		{
			console.error(`EntitySelector: the "${entity.getId()}" entity is already existed.`);

			return entity;
		}

		this.entities.set(entity.getId(), entity);

		return entity;
	}

	getEntity(id: string): Entity | null
	{
		return this.entities.get(id) || null;
	}

	hasEntity(id: string): boolean
	{
		return this.entities.has(id);
	}

	getEntities(): Entity[]
	{
		return [...this.entities.values()];
	}

	removeEntity(id: string): void
	{
		this.removeEntityItems(id);
		this.entities.delete(id);
	}

	removeEntityItems(id: string): void
	{
		const items = this.getEntityItemsInternal(id);
		if (items)
		{
			items.forEach((item: Item) => {
				this.removeItem(item);
			});
		}
	}

	getHeader(): BaseHeader | null
	{
		return this.header;
	}

	getActiveHeader(): BaseHeader | null
	{
		const activeTab = this.getActiveTab();
		if (!activeTab)
		{
			return null;
		}

		if (activeTab.getHeader())
		{
			return activeTab.getHeader();
		}

		return this.getHeader() && activeTab.canShowDefaultHeader() ? this.getHeader() : null;
	}

	/**
	 * @internal
	 */
	adjustHeader(): void
	{
		if (!this.getActiveTab())
		{
			return;
		}

		if (this.getActiveTab()!.getHeader())
		{
			if (this.getHeader())
			{
				this.getHeader()!.hide();
			}

			this.getActiveTab()!.getHeader()!.show();
		}
		else if (this.getHeader())
		{
			if (this.getActiveTab()!.canShowDefaultHeader())
			{
				this.getHeader()!.show();
			}
			else
			{
				this.getHeader()!.hide();
			}
		}
	}

	setHeader(headerContent: HeaderContent | null | undefined, headerOptions?: HeaderOptions): BaseHeader | null
	{
		/** @var {BaseHeader} */
		let header: BaseHeader | null = null;
		if (headerContent !== null)
		{
			header = Dialog.createHeader(this, headerContent, headerOptions);
			if (header === null)
			{
				return null;
			}
		}

		if (this.isRendered() && this.getHeader() !== null)
		{
			Dom.remove(this.getHeader()?.getContainer());
			this.adjustHeader();
		}

		this.header = header;

		if (this.isRendered())
		{
			this.appendHeader(header);
			this.adjustHeader();
		}

		return header;
	}

	/**
	 * @internal
	 */
	appendHeader(header: BaseHeader | null | undefined): void
	{
		if (header instanceof BaseHeader)
		{
			Dom.append(header.getContainer(), this.getHeaderContainer());
		}
	}

	/**
	 * @internal
	 */
	static createHeader(
		context: Dialog | Tab,
		headerContent: HeaderContent | null | undefined,
		headerOptions?: HeaderOptions,
	): BaseHeader | null
	{
		if (
			!Type.isStringFilled(headerContent)
			&& !Type.isArrayFilled(headerContent)
			&& !Type.isDomNode(headerContent)
			&& !Type.isFunction(headerContent)
		)
		{
			return null;
		}

		/** @var {BaseHeader} */
		let header: BaseHeader | null = null;
		const options: HeaderOptions = Type.isPlainObject(headerOptions) ? headerOptions : {};

		if (Type.isFunction(headerContent) || Type.isString(headerContent))
		{
			const className = Type.isString(headerContent) ? Reflection.getClass(headerContent) : headerContent;
			if (Type.isFunction(className))
			{
				const HeaderClass = className as new (context: Dialog | Tab, options: HeaderOptions) => BaseHeader;
				header = new HeaderClass(context, options);
				if (!(header instanceof BaseHeader))
				{
					console.error('EntitySelector: header is not an instance of BaseHeader.');
					header = null;
				}
			}
		}

		if (headerContent !== null && !header)
		{
			header = new DefaultHeader(context, ({ ...options, content: headerContent }));
		}

		return header;
	}

	createHeader(
		context: Dialog | Tab,
		headerContent: HeaderContent | null | undefined,
		headerOptions?: HeaderOptions,
	): BaseHeader | null
	{
		return Dialog.createHeader(context, headerContent, headerOptions);
	}

	getFooter(): BaseFooter | null
	{
		return this.footer;
	}

	getActiveFooter(): BaseFooter | null
	{
		const activeTab = this.getActiveTab();
		if (!activeTab)
		{
			return null;
		}

		if (activeTab.getFooter())
		{
			return activeTab.getFooter();
		}

		return this.getFooter() && activeTab.canShowDefaultFooter() ? this.getFooter() : null;
	}

	/**
	 * @internal
	 */
	adjustFooter(): void
	{
		const activeTab = this.getActiveTab();

		if (!activeTab)
		{
			return;
		}

		if (activeTab.getFooter())
		{
			if (this.getFooter())
			{
				this.getFooter()!.hide();
			}

			activeTab.getFooter()!.show();
		}
		else if (this.getFooter())
		{
			if (activeTab.canShowDefaultFooter())
			{
				this.getFooter()!.show();
			}
			else
			{
				this.getFooter()!.hide();
			}
		}
	}

	setFooter(footerContent: FooterContent | null | undefined, footerOptions?: FooterOptions): BaseFooter | null
	{
		/** @var {BaseFooter} */
		let footer: BaseFooter | null = null;
		if (footerContent !== null)
		{
			footer = Dialog.createFooter(this, footerContent, footerOptions);
			if (footer === null)
			{
				return null;
			}
		}

		if (this.isRendered() && this.getFooter() !== null)
		{
			Dom.remove(this.getFooter()!.getContainer());
			this.adjustFooter();
		}

		this.footer = footer;

		if (this.isRendered())
		{
			this.appendFooter(footer);
			this.adjustFooter();
		}

		return footer;
	}

	/**
	 * @internal
	 */
	appendFooter(footer: BaseFooter | null | undefined): void
	{
		if (footer instanceof BaseFooter)
		{
			Dom.append(footer.getContainer(), this.getFooterContainer());
		}
	}

	/**
	 * @internal
	 */
	static createFooter(
		context: Dialog | Tab,
		footerContent: FooterContent | null | undefined,
		footerOptions?: FooterOptions,
	): BaseFooter | null
	{
		if (
			!Type.isStringFilled(footerContent)
			&& !Type.isArrayFilled(footerContent)
			&& !Type.isDomNode(footerContent)
			&& !Type.isFunction(footerContent)
		)
		{
			return null;
		}

		/** @var {BaseFooter} */
		let footer: BaseFooter | null = null;
		const options: FooterOptions = Type.isPlainObject(footerOptions) ? footerOptions : {};

		if (Type.isFunction(footerContent) || Type.isString(footerContent))
		{
			const className = Type.isString(footerContent) ? Reflection.getClass(footerContent) : footerContent;
			if (Type.isFunction(className))
			{
				const FooterClass = className as new (context: Dialog | Tab, options: FooterOptions) => BaseFooter;
				footer = new FooterClass(context, options);
				if (!(footer instanceof BaseFooter))
				{
					console.error('EntitySelector: footer is not an instance of BaseFooter.');
					footer = null;
				}
			}
		}

		if (footerContent !== null && !footer)
		{
			footer = new DefaultFooter(context, ({ ...options, content: footerContent }));
		}

		return footer;
	}

	createFooter(
		context: Dialog | Tab,
		footerContent: FooterContent | null | undefined,
		footerOptions?: FooterOptions,
	): BaseFooter | null
	{
		return Dialog.createFooter(context, footerContent, footerOptions);
	}

	getId(): string
	{
		return this.id;
	}

	getContext(): string | null
	{
		return this.context;
	}

	getNavigation(): Navigation
	{
		return this.navigation;
	}

	deselectAll(): void
	{
		this.getSelectedItems().forEach((item: Item) => {
			item.deselect();
		});
	}

	isMultiple(): boolean
	{
		return this.multiple;
	}

	setTargetNode(node?: HTMLElement | { left: number; top: number } | null | MouseEvent): void
	{
		if (!Type.isDomNode(node) && !Type.isNull(node) && !Type.isObject(node))
		{
			return;
		}

		this.targetNode = node;

		if (this.isRendered())
		{
			this.getPopup().setBindElement(this.targetNode);
			this.getPopup().adjustPosition();
		}
	}

	getTargetNode(): HTMLElement | { left: number; top: number } | MouseEvent | null
	{
		if (this.targetNode === null && this.getTagSelectorMode() === TagSelectorMode.OUTSIDE)
		{
			return this.getTagSelector()!.getOuterContainer();
		}

		return this.targetNode;
	}

	setHideOnSelect(flag?: boolean): void
	{
		if (Type.isBoolean(flag))
		{
			this.hideOnSelect = flag;
		}
	}

	shouldHideOnSelect(): boolean
	{
		if (this.hideOnSelect !== null)
		{
			return this.hideOnSelect;
		}

		return !this.isMultiple();
	}

	setHideOnDeselect(flag?: boolean): void
	{
		if (Type.isBoolean(flag))
		{
			this.hideOnDeselect = flag;
		}
	}

	shouldHideOnDeselect(): boolean
	{
		if (this.hideOnDeselect !== null)
		{
			return this.hideOnDeselect;
		}

		return false;
	}

	setClearSearchOnSelect(flag?: boolean): void
	{
		if (Type.isBoolean(flag))
		{
			this.clearSearchOnSelect = flag;
		}
	}

	shouldClearSearchOnSelect(): boolean
	{
		return this.clearSearchOnSelect;
	}

	setAddTagOnSelect(flag?: boolean): void
	{
		if (Type.isBoolean(flag))
		{
			this.addTagOnSelect = flag;
		}
	}

	shouldAddTagOnSelect(): boolean
	{
		if (this.addTagOnSelect !== null)
		{
			return this.addTagOnSelect;
		}

		return this.isMultiple() || this.isTagSelectorOutside();
	}

	setShowAvatars(flag?: boolean): void
	{
		if (Type.isBoolean(flag))
		{
			this.showAvatars = flag;

			if (this.isRendered())
			{
				this.getTabs().forEach((tab: Tab) => {
					tab.renderContainer();
				});
			}
		}
	}

	shouldShowAvatars(): boolean
	{
		return this.showAvatars;
	}

	setRecentItemsLimit(recentItemsLimit?: number): void
	{
		if (Type.isNumber(recentItemsLimit) && recentItemsLimit > 0)
		{
			this.recentItemsLimit = recentItemsLimit;
		}
	}

	getRecentItemsLimit(): number | null
	{
		return this.recentItemsLimit;
	}

	setOffsetAnimation(flag?: boolean): any
	{
		if (Type.isBoolean(flag))
		{
			this.offsetAnimation = flag;

			if (this.isRendered() && !this.offsetAnimation)
			{
				Dom.removeClass(this.getPopup().getPopupContainer(), 'ui-selector-popup-offset-animation');
			}
		}
	}

	isCompactView(): boolean
	{
		return this.compactView;
	}

	setAutoHide(enable?: boolean): void
	{
		if (Type.isBoolean(enable))
		{
			this.autoHide = enable;
			if (this.isRendered())
			{
				this.getPopup().setAutoHide(enable);
			}
		}
	}

	isAutoHide(): boolean
	{
		return this.autoHide;
	}

	setAutoHideHandler(handler?: (event: MouseEvent, dialog: Dialog) => boolean): void
	{
		if (Type.isFunction(handler) || handler === null)
		{
			this.autoHideHandler = handler;
		}
	}

	setHideByEsc(enable?: boolean): void
	{
		if (Type.isBoolean(enable))
		{
			this.hideByEsc = enable;
			if (this.isRendered())
			{
				this.getPopup().setClosingByEsc(enable);
			}
		}
	}

	shouldHideByEsc(): boolean
	{
		return this.hideByEsc;
	}

	getWidth(): number
	{
		return this.width;
	}

	setWidth(width?: number): void
	{
		if (Type.isNumber(width) && width > 0)
		{
			this.width = width;
			if (this.isRendered())
			{
				Dom.style(this.getContainer(), 'width', `${width}px`);
			}
		}
	}

	getHeight(): number
	{
		return this.height;
	}

	setHeight(height?: number): Promise<TransitionEvent | null | void>
	{
		if (Type.isNumber(height) && height > 0)
		{
			this.height = height;
			if (this.isRendered())
			{
				Dom.style(this.getContainer(), 'height', `${height}px`);

				return Animation.handleTransitionEnd(this.getContainer(), 'height');
			}
			else
			{
				return Promise.resolve();
			}
		}

		return Promise.resolve();
	}

	getOffsetLeft(): number
	{
		return this.offsetLeft;
	}

	setOffsetLeft(offset?: number): void
	{
		if (Type.isNumber(offset) && offset >= 0)
		{
			this.offsetLeft = offset;
			if (this.isRendered())
			{
				this.getPopup().setOffset({ offsetLeft: offset } as { offsetTop: number; offsetLeft: number });
				this.adjustPosition();
			}
		}
	}

	getOffsetTop(): number
	{
		return this.offsetTop;
	}

	setOffsetTop(offset?: number): void
	{
		if (Type.isNumber(offset) && offset >= 0)
		{
			this.offsetTop = offset;
			if (this.isRendered())
			{
				this.getPopup().setOffset({ offsetTop: offset } as { offsetTop: number; offsetLeft: number });
				this.adjustPosition();
			}
		}
	}

	getZindex(): number
	{
		return this.getPopup().getZindex();
	}

	isCacheable(): boolean
	{
		return this.cacheable;
	}

	setCacheable(cacheable?: boolean): void
	{
		if (Type.isBoolean(cacheable))
		{
			this.cacheable = cacheable;
			if (this.isRendered())
			{
				this.getPopup().setCacheable(cacheable);
			}
		}
	}

	shouldFocusOnFirst(): boolean
	{
		return this.focusOnFirst;
	}

	setFocusOnFirst(flag?: boolean): void
	{
		if (Type.isBoolean(flag))
		{
			this.focusOnFirst = flag;
		}
	}

	focusOnFirstNode(): ItemNode | null
	{
		if (this.getActiveTab())
		{
			const itemNode = this.getActiveTab()!.getRootNode().getFirstChild();
			if (itemNode)
			{
				itemNode.focus(FocusMonitor.Instance.getLastInputModality() === 'keyboard');

				return itemNode;
			}
		}

		return null;
	}

	getFocusedNode(): ItemNode | null
	{
		return this.focusedNode;
	}

	clearNodeFocus(): void
	{
		if (this.focusedNode)
		{
			if (this.hasTagSelector())
			{
				Dom.attr(this.getActiveDescendantControl(this.focusedNode), 'aria-activedescendant', null);
			}

			this.focusedNode.unfocus();
			this.focusedNode = null;
		}
	}

	getActiveDescendantControl(itemNode: ItemNode): HTMLElement | null
	{
		if (this.hasTagSelector())
		{
			return this.getTagSelector()?.getTextBox() || null;
		}

		return itemNode.getTab().getListBoxContainer();
	}

	getFocusTrap(): FocusTrap | null
	{
		return this.getPopup().getFocusTrap();
	}

	isDropdownMode(): boolean
	{
		return this.dropdownMode;
	}

	setPreselectedItems(itemIds?: ItemId[]): void
	{
		this.preselectedItems = this.validateItemIds(itemIds);
	}

	getPreselectedItems(): ItemId[]
	{
		return this.preselectedItems;
	}

	setUndeselectedItems(itemIds?: ItemId[]): void
	{
		this.undeselectedItems = this.validateItemIds(itemIds);
	}

	getUndeselectedItems()
	{
		return this.undeselectedItems;
	}

	setCustomData(property: (string | null | undefined) | { [key: string]: any }, value?: any): void
	{
		if (Type.isNull(property))
		{
			this.customData = Object.create(null);
		}
		else if (Type.isPlainObject(property))
		{
			Object.entries(property).forEach((item) => {
				const [currentKey, currentValue] = item;
				this.setCustomData(currentKey, currentValue);
			});
		}
		else if (Type.isString(property))
		{
			if (Type.isNull(value))
			{
				delete this.customData[property];
			}
			else if (!Type.isUndefined(value))
			{
				this.customData[property] = value;
			}
		}
	}

	getCustomData(property?: string): any
	{
		if (Type.isUndefined(property))
		{
			return this.customData;
		}

		if (Type.isStringFilled(property))
		{
			return this.customData[property];
		}

		return undefined;
	}

	/**
	 * @private
	 */
	setOptions(dialogOptions: Partial<DialogOptions>): void
	{
		const options: Partial<DialogOptions> = Type.isPlainObject(dialogOptions) ? dialogOptions : {};

		this.setCustomData(options.customData);

		if (Type.isArray(options.tabs))
		{
			options.tabs.forEach((tab) => {
				this.addTab(tab);
			});
		}

		if (Type.isArray(options.selectedItems))
		{
			options.selectedItems.forEach((itemOptions: ItemOptions) => {
				const options: ItemOptions = Object.assign(
					{} as ItemOptions,
					Type.isPlainObject(itemOptions) ? itemOptions : {},
				);
				options.selected = true;
				this.addItem(options);
			});
		}

		if (Type.isArray(options.items))
		{
			options.items.forEach((itemOptions: ItemOptions) => {
				this.addItem(itemOptions);
			});
		}

		this.setHeader(options.header, options.headerOptions);
		this.setFooter(options.footer, options.footerOptions);
	}

	getMaxLabelWidth(): number
	{
		return this.maxLabelWidth;
	}

	getMinLabelWidth(): number
	{
		return this.minLabelWidth;
	}

	expandLabels(animate: boolean = true): void
	{
		const freeSpace = parseInt(this.getPopup().getPopupContainer().style.left, 10);
		if (freeSpace > this.getMinLabelWidth())
		{
			Dom.removeClass(this.getLabelsContainer(), 'ui-selector-tab-labels--animate-hide');
			if (animate)
			{
				Dom.addClass(this.getLabelsContainer(), 'ui-selector-tab-labels--animate-show');
				Dom.style(this.getLabelsContainer(), 'max-width', `${Math.min(freeSpace, this.getMaxLabelWidth())}px`);
				Animation.handleTransitionEnd(this.getLabelsContainer(), 'max-width')
					.then(() => {
						Dom.removeClass(this.getLabelsContainer(), 'ui-selector-tab-labels--animate-show');
						Dom.addClass(this.getLabelsContainer(), 'ui-selector-tab-labels--active');
					})
					.catch(() => {
						// fail silently
					});
			}
			else
			{
				Dom.style(this.getLabelsContainer(), 'max-width', `${Math.min(freeSpace, this.getMaxLabelWidth())}px`);
			}
		}
		else
		{
			Dom.addClass(this.getLabelsContainer(), 'ui-selector-tab-labels--active');
		}
	}

	collapseLabels(animate: boolean = true): void
	{
		Dom.removeClass(this.getLabelsContainer(), 'ui-selector-tab-labels--animate-show');
		Dom.removeClass(this.getLabelsContainer(), 'ui-selector-tab-labels--active');
		if (animate)
		{
			Dom.addClass(this.getLabelsContainer(), 'ui-selector-tab-labels--animate-hide');
			Animation.handleTransitionEnd(this.getLabelsContainer(), 'max-width')
				.then(() => {
					Dom.removeClass(this.getLabelsContainer(), 'ui-selector-tab-labels--animate-hide');
				})
				.catch(() => {
					// fail silently
				});
		}

		Dom.style(this.getLabelsContainer(), 'max-width', null);
	}

	getTagSelector(): TagSelector | null
	{
		return this.tagSelector;
	}

	getTagSelectorMode(): TagSelectorMode | null
	{
		return this.tagSelectorMode;
	}

	isTagSelectorInside(): boolean
	{
		return this.getTagSelector() !== null && this.getTagSelectorMode() === TagSelectorMode.INSIDE;
	}

	isTagSelectorOutside(): boolean
	{
		return this.getTagSelector() !== null && this.getTagSelectorMode() === TagSelectorMode.OUTSIDE;
	}

	hasTagSelector(): boolean
	{
		return this.getTagSelector() !== null;
	}

	getTagSelectorQuery(): string
	{
		return this.getTagSelector() ? this.getTagSelector()!.getTextBoxValue() : '';
	}

	/**
	 * @private
	 */
	setTagSelector(tagSelector: TagSelector): void
	{
		this.tagSelector = tagSelector;

		this.tagSelector.subscribe(
			'onInput',
			Runtime.debounce(this.handleTagSelectorInput, 200, this) as (event: BaseEvent) => void,
		);
		this.tagSelector.subscribe('onAddButtonClick', this.handleTagSelectorAddButtonClick.bind(this));
		this.tagSelector.subscribe('onTagRemove', this.handleTagSelectorTagRemove.bind(this));
		this.tagSelector.subscribe('onAfterTagRemove', this.handleTagSelectorAfterTagRemove.bind(this));
		this.tagSelector.subscribe('onAfterTagAdd', this.handleTagSelectorAfterTagAdd.bind(this));
		this.tagSelector.subscribe('onContainerClick', this.handleTagSelectorClick.bind(this));

		Dom.attr(this.tagSelector.getTextBox(), 'role', 'combobox');

		this.tagSelector.setDialog(this);
	}

	focusSearch(): void
	{
		if (this.getTagSelector())
		{
			if (this.getActiveTab() !== this.getSearchTab())
			{
				this.getTagSelector()!.clearTextBox();
			}

			this.getTagSelector()!.focusTextBox();
		}
	}

	clearSearch(): void
	{
		if (this.getTagSelector())
		{
			this.getTagSelector()!.clearTextBox();

			if (this.getActiveTab() === this.getSearchTab())
			{
				this.selectFirstTab();
			}
		}
	}

	getLoader(): Loader
	{
		if (this.loader === null)
		{
			this.loader = new Loader({
				target: this.getTabsContainer(),
				size: 100,
			});
		}

		return this.loader;
	}

	showLoader(): void
	{
		void this.getLoader().show();
		Dom.attr(this.getTabsContainer(), 'aria-busy', 'true');
	}

	hideLoader(): void
	{
		if (this.loader !== null)
		{
			void this.getLoader().hide();
			Dom.attr(this.getTabsContainer(), 'aria-busy', 'false');
		}
	}

	destroyLoader(): void
	{
		if (this.loader !== null)
		{
			this.getLoader().destroy();
		}

		this.loader = null;
	}

	getPopup(): Popup
	{
		if (this.popup !== null)
		{
			return this.popup;
		}

		this.getTabs().forEach((tab: Tab) => {
			this.insertTab(tab);
		});

		const popupOptions = { ...this.popupOptions };
		const userEvents = popupOptions.events;
		delete popupOptions.events;

		this.popup = new Popup({
			contentPadding: 0,
			padding: 0,
			offsetTop: this.getOffsetTop(),
			offsetLeft: this.getOffsetLeft(),
			animation: {
				showClassName: 'ui-selector-popup-animation-show',
				closeClassName: 'ui-selector-popup-animation-close',
				closeAnimationType: 'animation',
			},
			bindElement: this.getTargetNode(),
			bindOptions: {
				forceBindPosition: true,
			},
			focusTrap: this.#getFocusTrapOptions(),
			autoHide: this.isAutoHide(),
			autoHideHandler: this.handleAutoHide.bind(this),
			closeByEsc: this.shouldHideByEsc(),
			cacheable: this.isCacheable(),
			events: {
				onFirstShow: this.handlePopupFirstShow.bind(this),
				onShow: this.handlePopupShow.bind(this),
				onAfterShow: this.handlePopupAfterShow.bind(this),
				onAfterClose: this.handlePopupAfterClose.bind(this),
				onDestroy: this.handlePopupDestroy.bind(this),
			},
			content: this.getContainer(),
			ariaLabel: this.getAriaLabel(),
			...popupOptions,
		} as PopupOptions);

		(this.popup as unknown as EventEmitter).subscribeFromOptions(userEvents ?? {});

		this.rendered = true;

		this.selectFirstTab();

		return this.popup;
	}

	getAriaLabel(): string
	{
		if (this.ariaLabel !== null)
		{
			return this.ariaLabel;
		}

		const knownEntities = ['USER', 'PROJECT', 'DEPARTMENT'];
		const entityIds = [...new Set(
			this.getEntities()
				.map((entity: Entity) => entity.getId().toUpperCase())
				// Meta entities (e.g. meta-user) never affect the label.
				.filter((id: string) => !id.startsWith('META-')),
		)];
		if (entityIds.length > 0 && entityIds.every((id: string) => knownEntities.includes(id)))
		{
			const phraseId = `UI_SELECTOR_DIALOG_ARIA_LABEL_${knownEntities.filter((id: string) => entityIds.includes(id)).join('_')}`;
			const label = Loc.getMessage(phraseId);
			if (Type.isStringFilled(label))
			{
				return label;
			}
		}

		return Loc.getMessage('UI_SELECTOR_DIALOG_ARIA_LABEL_DEFAULT') ?? '';
	}

	isRendered(): boolean
	{
		return this.rendered;
	}

	getContainer(): HTMLElement
	{
		return this.cache.remember('container', () => {
			let searchContainer: string | HTMLElement = '';
			if (this.getTagSelectorMode() === TagSelectorMode.INSIDE)
			{
				searchContainer = Tag.render`<div class="ui-selector-search"></div>`;

				this.getTagSelector()!.renderTo(searchContainer as HTMLElement);
			}

			const className = this.isCompactView() ? ' ui-selector-dialog--compact-view' : '';

			return Tag.render`
				<div
					class="ui-selector-dialog${className}"
					data-testid="ui-selector-dialog"
					style="width:${this.getWidth()}px; height:${this.getHeight()}px;"
				>
					${this.getHeaderContainer()}
					${searchContainer}
					${this.getTabsContainer()}
					${this.getFooterContainer()}
				</div>
			`;
		});
	}

	getTabsContainer(): HTMLElement
	{
		return this.cache.remember('tabs-container', () => {
			return Tag.render`
				<div class="ui-selector-tabs">
					${this.getTabContentsContainer()}
					${this.getLabelsContainer()}
				</div>
			`;
		});
	}

	getTabContentsContainer(): HTMLElement
	{
		return this.cache.remember('tab-contents', () => {
			return Tag.render`<div class="ui-selector-tab-contents"></div>`;
		});
	}

	getLabelsContainer(): HTMLElement
	{
		return this.cache.remember('labels-container', () => {
			return Tag.render`
				<div
					role="tablist"
					aria-orientation="vertical"
					class="ui-selector-tab-labels"
					onmouseenter="${this.alwaysShowLabels ? null : this.handleLabelsMouseEnter.bind(this)}"
					onmouseleave="${this.alwaysShowLabels ? null : this.handleLabelsMouseLeave.bind(this)}"
				></div>
			`;
		});
	}

	getHeaderContainer(): HTMLElement
	{
		return this.cache.remember('header', () => {
			const header = this.getHeader() && this.getHeader()!.getContainer();

			return Tag.render`
				<div class="ui-selector-header-container">${header || ''}</div>
			`;
		});
	}

	getFooterContainer(): HTMLElement
	{
		return this.cache.remember('footer', () => {
			const footer = this.getFooter() && this.getFooter()!.getContainer();

			return Tag.render`
				<div class="ui-selector-footer-container">${footer || ''}</div>
			`;
		});
	}

	freeze(): void
	{
		if (this.isFrozen())
		{
			return;
		}

		this.frozenProps = {
			autoHide: this.isAutoHide(),
			hideByEsc: this.shouldHideByEsc(),
		};

		this.setAutoHide(false);
		this.setHideByEsc(false);

		this.getNavigation().disable();
		Dom.addClass(this.getContainer(), 'ui-selector-dialog--freeze');

		this.frozen = true;
	}

	unfreeze(): void
	{
		if (!this.isFrozen())
		{
			return;
		}

		this.setAutoHide(this.frozenProps.autoHide !== false);
		this.setHideByEsc(this.frozenProps.hideByEsc !== false);

		this.getNavigation().enable();
		Dom.removeClass(this.getContainer(), 'ui-selector-dialog--freeze');

		this.frozen = false;
	}

	isFrozen(): boolean
	{
		return this.frozen;
	}

	load(): void
	{
		if (this.loadState !== LoadState.UNSENT || !this.hasDynamicLoad())
		{
			return;
		}

		if (this.getTagSelector())
		{
			this.getTagSelector()!.lock();
		}

		setTimeout(() => {
			if (this.destroyed)
			{
				return;
			}

			if (this.isLoading())
			{
				this.showLoader();
			}
		}, 400);

		this.loadState = LoadState.LOADING;

		Ajax.runAction('ui.entityselector.load', {
			json: {
				dialog: this.getAjaxJson(),
			},
			getParameters: {
				context: this.getContext(),
			},
		})
			.then((response: {
				data?: {
					dialog?: {
						entities?: EntityOptions[];
						recentItems?: ItemId[];
						items?: ItemOptions[];
						errors?: EntityErrorOptions[];
					};
				};
			}) => {
				if (this.destroyed)
				{
					return;
				}

				if (response && response.data && Type.isPlainObject(response.data.dialog))
				{
					this.loadState = LoadState.DONE;

					const entities = Type.isArrayFilled(response.data.dialog.entities) ? response.data.dialog.entities : [];

					entities.forEach((entityOptions: EntityOptions) => {
						const entity = this.getEntity(entityOptions.id);
						if (entity)
						{
							entity.setDynamicSearch(entityOptions.dynamicSearch);
						}
					});

					this.setOptions(response.data.dialog);

					this.getPreselectedItems().forEach((preselectedItem: ItemId) => {
						const item = this.getItem(preselectedItem);
						if (item)
						{
							item.select(true as unknown as ItemSelectOptions);
						}
					});

					const recentItems = response.data.dialog.recentItems;
					if (Type.isArray(recentItems))
					{
						const nodeOptionsMap: Map<Item, ItemNodeOptions> = new Map();
						const itemsOptions: ItemOptions[] | undefined = response.data.dialog.items;
						if (Type.isArray(itemsOptions))
						{
							itemsOptions.forEach((itemOptions: ItemOptions) => {
								if (itemOptions.nodeOptions)
								{
									const item = this.getItem(itemOptions);
									if (item)
									{
										const nodeOptions: ItemNodeOptions = { ...itemOptions.nodeOptions };
										delete nodeOptions.dynamic;
										delete nodeOptions.open;
										delete nodeOptions.itemOrder;

										nodeOptionsMap.set(item, nodeOptions);
									}
								}
							});
						}

						const items = (recentItems as ItemId[]).map((recentItem: ItemId) => {
							const item = this.getItem(recentItem);

							return [item, nodeOptionsMap.get(item as Item)];
						});

						this.getRecentTab().getRootNode().addItems(items as unknown as Array<[Item, ItemNodeOptions]>);
					}

					if (!this.getRecentTab().getRootNode().hasChildren() && this.getRecentTab().getStub())
					{
						this.getRecentTab().getStub()!.show();
					}

					if (this.getTagSelector())
					{
						this.getTagSelector()!.unlock();
					}

					if (this.isRendered())
					{
						if (this.isDropdownMode() && this.getActiveTab() === this.getRecentTab())
						{
							this.selectFirstTab();
						}
						else if (!this.getActiveTab())
						{
							this.selectFirstTab();
						}
					}

					this.focusSearch();
					this.destroyLoader();

					if (this.shouldFocusOnFirst())
					{
						this.focusOnFirstNode();
					}

					if (Type.isArrayFilled(response.data.dialog.errors))
					{
						this.emitEntityErrors(response.data.dialog.errors);
					}

					this.emit('onLoad');
				}
			})
			.catch((error: unknown) => {
				this.loadState = LoadState.UNSENT;

				if (this.getTagSelector())
				{
					this.getTagSelector()!.unlock();
				}

				this.focusSearch();
				this.destroyLoader();

				this.emit('onLoadError', { error });

				console.error(error);
			});
	}

	isLoaded(): boolean
	{
		return this.loadState === LoadState.DONE;
	}

	isLoading(): boolean
	{
		return this.loadState === LoadState.LOADING;
	}

	hasDynamicLoad(): boolean
	{
		let hasDynamicLoad = false;
		this.entities.forEach((entity: Entity) => {
			hasDynamicLoad = hasDynamicLoad || entity.hasDynamicLoad();
		});

		return hasDynamicLoad;
	}

	hasDynamicSearch(): boolean
	{
		let hasDynamicSearch = false;
		this.entities.forEach((entity: Entity) => {
			hasDynamicSearch = hasDynamicSearch || (entity.isSearchable() && entity.hasDynamicSearch());
		});

		return hasDynamicSearch;
	}

	saveRecentItem(item: Item): void
	{
		if (this.getContext() === null || !item.isSaveable())
		{
			return;
		}

		this.recentItemsToSave.push(item);
		this.saveRecentItemsWithDebounce();
	}

	/**
	 * @private
	 */
	saveRecentItems(): void
	{
		if (!Type.isArrayFilled(this.recentItemsToSave))
		{
			return;
		}

		Ajax.runAction('ui.entityselector.saveRecentItems', {
			json: {
				dialog: this.getAjaxJson(),
				recentItems: this.recentItemsToSave.map((item: Item) => item.getAjaxJson()),
			},
			getParameters: {
				context: this.getContext(),
			},
		})
			.then((response: unknown) => {})
			.catch((error: unknown) => {
				console.error(error);
			})
		;

		this.recentItemsToSave = [];
	}

	shouldClearUnavailableItems(): boolean
	{
		return this.clearUnavailableItems;
	}

	/**
	 * @private
	 */
	handleTagSelectorInput(): void
	{
		if (this.getTagSelectorMode() === TagSelectorMode.OUTSIDE && !this.isOpen())
		{
			this.show();
		}

		const query = this.getTagSelector()!.getTextBoxValue();
		this.search(query);

		this.adjustByTagSelector();
	}

	/**
	 * @private
	 */
	handleTagSelectorAddButtonClick(): void
	{
		this.show();
	}

	/**
	 * @private
	 */
	handleTagSelectorTagRemove(event: BaseEvent): void
	{
		const { tag } = event.getData();

		const item = this.getItem({ id: tag.getId(), entityId: tag.getEntityId() });
		if (item)
		{
			item.deselect();
		}

		this.focusSearch();
	}

	/**
	 * @private
	 */
	handleTagSelectorAfterTagRemove(): void
	{
		this.adjustByTagSelector();
	}

	/**
	 * @private
	 */
	handleTagSelectorAfterTagAdd(): void
	{
		this.adjustByTagSelector();
	}

	/**
	 * @private
	 */
	adjustByTagSelector(): void
	{
		if (this.getTagSelectorMode() === TagSelectorMode.OUTSIDE)
		{
			this.adjustPosition();
		}
		else if (this.getTagSelectorMode() === TagSelectorMode.INSIDE)
		{
			const newTagSelectorHeight = this.getTagSelector()!.calcHeight();
			if (newTagSelectorHeight > 0)
			{
				const offset = newTagSelectorHeight - (this.tagSelectorHeight || this.getTagSelector()!.getMinHeight());
				this.tagSelectorHeight = newTagSelectorHeight;
				if (offset !== 0)
				{
					const height = this.getHeight();
					this.setHeight(height + offset)
						.then(() => {
							this.adjustPosition();
						}).catch(() => {
							// fail silently
						})
					;
				}
			}
		}
	}

	/**
	 * @private
	 */
	handleTagSelectorClick(): void
	{
		this.focusSearch();
	}

	/**
	 * @internal
	 */
	handleItemSelect(item: Item, animate: boolean = true): void
	{
		const shouldAnimate: boolean = this.isMultiple() ? animate : this.getSelectedItems().length === 0;

		if (!this.isMultiple())
		{
			this.deselectAll();

			if (this.getSelectedItems().length > 0)
			{
				console.error('EntitySelector: some items are still selected.', this.getSelectedItems());
			}
		}

		if (this.getTagSelector() && this.shouldAddTagOnSelect())
		{
			const tag = item.createTag() as TagItemOptions;
			tag.animate = shouldAnimate;
			this.getTagSelector()!.addTag(tag);
		}

		this.selectedItems.add(item);
	}

	/**
	 * @internal
	 */
	handleItemDeselect(item: Item, animate: boolean = true): void
	{
		const shouldAnimate: boolean = animate && this.isMultiple();

		this.selectedItems.delete(item);

		this.getTagSelector()?.removeTag(
			{
				id: item.getId(),
				entityId: item.getEntityId(),
			},
			shouldAnimate,
		);
	}

	/**
	 * @private
	 */
	handlePopupAfterShow(): void
	{
		this.focusSearch();
		this.adjustByTagSelector();

		this.emit('onShow');
	}

	/**
	 * @private
	 */
	handlePopupFirstShow(): void
	{
		this.emit('onFirstShow');

		this.observeTabOverlapping();
	}

	/**
	 * @private
	 */
	handlePopupShow(): void
	{
		if (this.offsetAnimation)
		{
			requestAnimationFrame(() => {
				requestAnimationFrame(() => {
					if (this.destroyed)
					{
						return;
					}

					Dom.addClass(this.getPopup().getPopupContainer(), 'ui-selector-popup-offset-animation');
				});
			});
		}

		if (this.alwaysShowLabels)
		{
			setTimeout(() => {
				if (this.destroyed)
				{
					return;
				}

				// We have to call the method after adjustPosition()
				this.expandLabels(false);
			}, 0);
		}
	}

	/**
	 * @private
	 */
	handleAutoHide(event: MouseEvent): boolean
	{
		const target = event.target;
		const el = this.getPopup().getPopupContainer();
		if (target === el || el.contains(target as Node | null))
		{
			return false;
		}

		if (
			this.isTagSelectorOutside()
			&& target === this.getTagSelector()!.getTextBox()
			&& Type.isStringFilled(this.getTagSelector()!.getTextBoxValue())
		)
		{
			return false;
		}

		if (this.autoHideHandler !== null)
		{
			const result = this.autoHideHandler(event, this);
			if (Type.isBoolean(result))
			{
				return result;
			}
		}

		return true;
	}

	/**
	 * @private
	 */
	observeTabOverlapping(): void
	{
		this.disconnectTabOverlapping();

		this.overlappingObserver = new MutationObserver(() => {
			if (this.getLabelsContainer().offsetWidth > 0)
			{
				const left = parseInt(this.getPopup().getPopupContainer().style.left, 10);
				if (left < this.getMinLabelWidth())
				{
					Dom.style(this.getPopup().getPopupContainer(), 'left', `${this.getMinLabelWidth()}px`);
					this.collapseLabels(false);
				}
				else if (this.alwaysShowLabels)
				{
					this.expandLabels(false);
				}
			}
		});

		this.overlappingObserver.observe(this.getPopup().getPopupContainer(), {
			attributes: true,
			attributeFilter: ['style'],
		});
	}

	/**
	 * @private
	 */
	disconnectTabOverlapping(): void
	{
		if (this.overlappingObserver)
		{
			this.overlappingObserver.disconnect();
		}
	}

	/**
	 * @private
	 */
	handlePopupAfterClose(): void
	{
		if (this.isTagSelectorOutside())
		{
			if (this.getActiveTab() && this.getActiveTab() === this.getSearchTab())
			{
				this.selectFirstTab();
			}

			this.getTagSelector()!.clearTextBox();
			this.getTagSelector()!.showAddButton();
			this.getTagSelector()!.hideTextBox();

			FocusNavigator.focusTarget(this.getTagSelector()!.getAddButtonLink());
		}

		if (this.offsetAnimation)
		{
			Dom.removeClass(this.getPopup().getPopupContainer(), 'ui-selector-popup-offset-animation');
		}

		this.emit('onHide');
	}

	/**
	 * @private
	 */
	handlePopupDestroy(): void
	{
		this.destroy();
	}

	/**
	 * @private
	 */
	handleLabelsMouseEnter(): void
	{
		this.expandLabels();
	}

	/**
	 * @private
	 */
	handleLabelsMouseLeave(): void
	{
		this.collapseLabels();
	}

	/**
	 * @private
	 */
	handleItemNodeFocus(event: BaseEvent): void
	{
		const { node } = event.getData();
		if (this.focusedNode === node)
		{
			return;
		}

		this.clearNodeFocus();

		this.focusedNode = node;

		if (this.hasTagSelector())
		{
			Dom.attr(this.getActiveDescendantControl(node), 'aria-activedescendant', node.getId());
		}
	}

	/**
	 * @private
	 */
	handleItemNodeUnfocus(): void
	{
		this.clearNodeFocus();
	}

	getAjaxJson(): { [key: string]: any }
	{
		return {
			id: this.getId(),
			context: this.getContext(),
			entities: this.getEntities(),
			preselectedItems: this.getPreselectedItems(),
			recentItemsLimit: this.getRecentItemsLimit(),
			clearUnavailableItems: this.shouldClearUnavailableItems(),
		};
	}

	/** @internal */
	emitEntityErrors(errorOptions: EntityErrorOptions[]): void
	{
		const errorCollection = EntityErrorCollection.create(errorOptions);

		this.emit('Entity:onError', { errors: [...errorCollection] });

		this.getEntities().forEach((entity: Entity) => {
			const entityId = entity.getId();
			this.emit(`Entity:${entityId}:onError`, { errors: errorCollection.getByEntityId(entityId) });
		});
	}

	#getFocusTrapOptions(): PopupOptions['focusTrap']
	{
		if (this.isTagSelectorOutside())
		{
			return {
				initialFocus: false,
				restoreFocus: false, // manual focus in handlePopupAfterClose
				startBoundary: this.getTagSelector()!.getTextBox(),
				endBoundary: this.getTagSelector()!.getTextBox(),
			};
		}

		if (!this.hasTagSelector() && InteractivityChecker.isTextInput(FocusNavigator.getActiveElement()))
		{
			return false;
		}

		return true;
	}
}
