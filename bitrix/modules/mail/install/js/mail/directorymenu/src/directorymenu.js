import { Tag, Dom, Event, Loc, Runtime, Text, Type } from 'main.core';
import { EventEmitter, BaseEvent } from 'main.core.events';
import 'ui.design-tokens';
import 'ui.fonts.opensans';
import 'ui.icon-set.outline';
import 'ui.notification';

import { Item } from './item.js';
import { SectionRegistry } from './section-registry.js';
import { FAVORITES_SECTION } from 'mail.favorites-filter-state';

import './css/style.css';
import './css/ui-wrappermenu.css';

// Visually hidden live region for screen-reader announcements.
const renderLiveRegion = (politeness) => Tag.render`<div aria-live="${politeness}" aria-atomic="true" style="position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0, 0, 0, 0);white-space:nowrap;border:0;"></div>`;

export class DirectoryMenu
{
	#activeDir = '';
	#menu = Tag.render`<div class="mail-left-directory-menu-wrapper"></div>`;
	#folderMenu = Tag.render`<ul role="list" aria-label="${Loc.getMessage('MAIL_DIRECTORY_MENU_ARIA_SYSTEM_LIST')}" class="ui-mail-left-directory-menu" data-test-id="mail_directory-menu__folder-list"></ul>`;
	#directoryCounters = [];
	#items = new Map();
	#itemByContainer = new Map();
	#dragCollapsedItem = null;
	#systemDirs = [];
	#sortMode = 'default';
	#collapsedFolders = {};
	#folderCustomOrder = [];
	#folderDefaultOrder = [];
	#mailboxId = 0;
	#manualSortingAvailable = false;
	#saveTimer = null;
	#onDirectorySelect = null;
	#orderSaveTimer = null;
	#orderSaveBaseline = [];
	#orderSentOnPageLeave = [];
	#favoritesEnabled = false;
	#favoritesLabel = '';
	#favoritesActive = false;
	#favoritesNode = null;
	#favoritesItem = null;
	#sections = new SectionRegistry(() => this.#disableFolderItems());
	#draggables = [];
	#dragAndDropToken = 0;
	// Polite region for move announcements; assertive region for save errors so
	// they interrupt other output (WCAG 4.1.3).
	#liveRegion = renderLiveRegion('polite');
	#liveRegionAssertive = renderLiveRegion('assertive');

	getActiveDir()
	{
		return this.#activeDir;
	}

	setActiveDir(path)
	{
		this.#activeDir = path;
	}

	hasDirectorySelectHandler()
	{
		return typeof this.#onDirectorySelect === 'function';
	}

	// The single point that drops every section highlight of the left menu: folders,
	// favorites and the sections registered from outside this bundle.
	clearActiveMenuButtons()
	{
		this.#sections.deactivateAll();
	}

	#disableFolderItems()
	{
		for (const item of this.#items.values())
		{
			item.disableActivity();
		}
	}

	// A section rendered outside this bundle joins the same point by handing over the
	// pair of handlers for its own highlight.
	registerSection(id, { activate, deactivate, claim = null })
	{
		this.#sections.register(id, { activate, deactivate, claim });
	}

	activateSection(id, payload)
	{
		this.#sections.activate(id, payload);
	}

	// For a redraw driven by the filter: see SectionRegistry.sync().
	syncSection(id, payload)
	{
		this.#sections.sync(id, payload);
	}

	releaseSection(id)
	{
		if (!this.#sections.release(id))
		{
			return;
		}

		// nothing took the section over, so the folder behind it lights up again
		this.setDirectory(this.getActiveDir());
	}

	rebuildMenu(dirsWithUnseenMailCounters)
	{
		this.#directoryCounters = dirsWithUnseenMailCounters;
		this.cleanItems();
		this.buildMenu();
		this.#applyCollapsedState();
		this.#applySortMode();
		this.#initDragAndDrop();
		this.setDirectory(this.getActiveDir());
	}

	cleanItems()
	{
		for (const item of this.#items.values())
		{
			Dom.remove(item.getContainer());
		}
		this.#items.clear();
		this.#itemByContainer.clear();
	}

	includeItem(item, directoryPath, directory = {}, nestingLevel = 0)
	{
		this.#items.set(directoryPath, item);
		// Reverse lookup for collapse-on-drag: the drag source is a container element.
		this.#itemByContainer.set(item.getContainer(), item);

		// Nested items are placed by their parent into its own children container.
		if (nestingLevel > 0)
		{
			return;
		}

		Dom.append(item.getContainer(), this.#folderMenu);
	}

	#getBlockContainers()
	{
		return [this.#folderMenu];
	}

	chooseFunction(path)
	{
		this.#activateKeepingFocus(this.#items.get(path)?.getItemElement(), () => {
			this.clearActiveMenuButtons();
			this.setActiveDir(path);
			this.setFilterDir(path);
		});
	}

	/**
	 * Picking an item hands the list over to the filter of the screen, and the filter takes the focus
	 * into its own search field. The item the pick came from keeps it instead, so the place in the
	 * menu is not lost (WCAG 2.4.3). One rule for every item of the menu: folders and the sections
	 * beside them are activated through these two entry points only.
	 */
	#activateKeepingFocus(element, activate)
	{
		const keepsFocus = Type.isDomNode(element) && document.activeElement === element;

		activate();

		if (!keepsFocus || document.activeElement === element || !document.body.contains(element))
		{
			return;
		}

		// the item takes the focus back without scrolling the freshly drawn list away from its top
		element.focus({ preventScroll: true });
	}

	buildMenu(firstBuild = false)
	{
		for (let i = 0; i < this.#directoryCounters.length; i++)
		{
			const directory = this.#directoryCounters[i];
			const path = directory.path;
			if (!Item.checkProperties(directory))
			{
				continue;
			}

			if (this.#systemDirs.inbox === path && firstBuild)
			{
				BX.Mail.Home.FilterToolbar?.setCount?.(directory.count);
			}

			new Item(directory, this, this.#systemDirs);
		}

		this.#updateNestingClass();
	}

	#updateNestingClass()
	{
		const hasNesting = this.#directoryCounters.some(
			(dir) => dir.items?.some((child) => Item.checkProperties(child)),
		);
		const modifierClass = 'mail-left-directory-menu--no-nesting';

		for (const container of this.#getBlockContainers())
		{
			if (hasNesting)
			{
				Dom.removeClass(container, modifierClass);
			}
			else
			{
				Dom.addClass(container, modifierClass);
			}
		}
	}

	// The second argument names the section the menu switches to; a folder has none.
	setFilterDir(name)
	{
		if (this.hasDirectorySelectHandler() && this.#onDirectorySelect(name, null) === false)
		{
			return;
		}

		const event = new BaseEvent({ data: { directory: name } });
		EventEmitter.emit('BX.DirectoryMenu:onChangeFilter', event);

		name = BX.Mail.Home.Counters.getShortcut(name);

		const filter = this.filter;
		if (Boolean(filter) && (filter instanceof BX.Main.Filter))
		{
			const FilterApi = filter.getApi();
			FilterApi.setFields({
				DIR: name,
			});
			FilterApi.apply();
		}
	}

	changeCounter(dirPath, number, mode)
	{
		const item = this.#items.get(dirPath);

		if (item === undefined)

		
    { return;
		}

		if (mode === 'set')
		{
			item.setCount(Number(number));
		}
		else
		{
			item.setCount(item.getCount() + Number(number));
		}
	}

	setCounters(counters)
	{
		for (const path in counters)
		{
			if (counters.hasOwnProperty(path))
			{
				this.changeCounter(path, counters[path], 'set');
			}
		}
	}

	setDirectory(path)
	{
		const item = path === undefined ? undefined : this.#items.get(path);
		if (item)
		{
			this.setActiveDir(path);
		}

		// another section owns the highlight: the folder is remembered for the way
		// back, but a redraw driven by the filter or by a rebuild does not steal it
		if (this.#sections.getActiveId() !== null)
		{
			return;
		}

		this.clearActiveMenuButtons();
		item?.enableActivity();
	}

	constructor(config = {
		dirsWithUnseenMailCounters: {},
		filterId: '',
		systemDirs:
		{
			spam: 'Spam',
			trash: 'Trash',
			outcome: 'Outcome',
			drafts: 'Drafts',
			inbox: 'Inbox',
		},
	})
	{
		Dom.append(this.#folderMenu, this.#menu);
		Dom.append(this.#liveRegion, this.#menu);
		Dom.append(this.#liveRegionAssertive, this.#menu);

		this.filter = BX.Main?.filterManager?.getById?.(config.filterId) ?? null;
		this.#systemDirs = config.systemDirs;
		this.#mailboxId = config.mailboxId || 0;
		this.#onDirectorySelect = config.onDirectorySelect || null;
		this.#manualSortingAvailable = Boolean(config.manualSortingAvailable);
		this.#collapsedFolders = config.collapsedFolders || {};
		this.#folderCustomOrder = Array.isArray(config.folderCustomOrder?.all)
			? config.folderCustomOrder.all
			: [];
		this.#folderDefaultOrder = Array.isArray(config.folderDefaultOrder)
			? config.folderDefaultOrder
			: [];
		this.#favoritesEnabled = Boolean(config.listImprovementsEnabled);
		this.#favoritesLabel = config.favoritesLabel || '';

		this.registerSection(FAVORITES_SECTION, {
			activate: () => this.#applyFavoritesActive(true),
			deactivate: () => this.#applyFavoritesActive(false),
		});

		if (this.#favoritesEnabled && Boolean(config.favoritesActive))
		{
			this.activateSection(FAVORITES_SECTION);
		}

		// the folders keep room for the labels that follow them
		if (config.labelsEnabled)
		{
			Dom.addClass(this.#menu, 'mail-left-directory-menu-wrapper--labels-below');
		}

		EventEmitter.subscribe('BX.Main.Filter:apply', (event) => {
			if (!this.filter)
			{
				return;
			}

			const dir = BX.Mail.Home.Counters.getDirPath(this.filter.getFilterFieldsValues().DIR);

			EventEmitter.emit('BX.DirectoryMenu:onChangeFilter', new BaseEvent({ data: { directory: dir } }));
			this.setDirectory(dir);
		});

		this.#directoryCounters = config.dirsWithUnseenMailCounters;

		this.buildMenu(true);

		this.#applyCollapsedState();

		if (config.sortMode && config.sortMode !== 'default')
		{
			this.#sortMode = config.sortMode;
			this.#applySortMode();
		}
		else
		{
			// #applySortMode() applies the sortable semantics itself; it is not
			// called for the default mode, so apply them here to run exactly once.
			this.#applySortableSemantics();
		}

		EventEmitter.subscribe('BX.Mail.FolderSort:onChange', (event) => {
			const { mode } = event.data;
			this.#sortMode = mode;
			this.#applySortMode();
		});

		Event.bind(window, 'pagehide', this.#handlePageLeave);
		Event.bind(window, 'beforeunload', this.#handlePageLeave);
		Event.bind(window, 'pageshow', this.#handlePageShow);

		this.#initDragAndDrop();
	}

	#applySortMode()
	{
		this.#applySortableSemantics();

		if (this.#sortMode === 'alpha_asc' || this.#sortMode === 'alpha_desc')
		{
			for (const container of this.#getBlockContainers())
			{
				this.#sortContainer(container);
			}

			return;
		}

		if (this.#sortMode === 'manual')
		{
			this.#applyManualOrder();

			this.#seedOrder();

			return;
		}

		if (this.#folderDefaultOrder.length > 0)
		{
			this.#applyBlockManualOrder(this.#folderMenu, this.#folderDefaultOrder);
			return;
		}

		for (const container of this.#getBlockContainers())
		{
			this.#reorderContainer(this.#directoryCounters, container);
		}
	}

	#sortContainer(container)
	{
		const items = [...container.querySelectorAll(':scope > .mail-menu-directory-item-container')];

		items.sort((a, b) => {
			const nameA = (Dom.attr(a, 'title') || '').toLowerCase();
			const nameB = (Dom.attr(b, 'title') || '').toLowerCase();

			return this.#sortMode === 'alpha_asc'
				? nameA.localeCompare(nameB)
				: nameB.localeCompare(nameA);
		});

		for (const item of items)
		{
			Dom.append(item, container);

			const children = item.querySelector('.mail-menu-directory-children');
			if (children)
			{
				this.#sortContainer(children);
			}
		}
	}

	#reorderContainer(directories, container)
	{
		for (const directory of directories)
		{
			const item = this.#items.get(directory.path);
			if (!item || item.getContainer().parentNode !== container)
			{
				continue;
			}

			Dom.append(item.getContainer(), container);

			if (directory.items?.length > 0)
			{
				const children = item.getContainer().querySelector('.mail-menu-directory-children');
				if (children)
				{
					this.#reorderContainer(directory.items, children);
				}
			}
		}
	}

	#applyManualOrder()
	{
		const order = this.#folderCustomOrder;
		if (order.length === 0)
		{
			this.#reorderContainer(this.#directoryCounters, this.#folderMenu);

			return;
		}

		this.#applyBlockManualOrder(this.#folderMenu, order);
	}

	// Listed ids first (in that order), the rest after in current DOM order - mirrors
	// backend applyOrder(). Recurses into each item's children container with the same
	// concatenated order, so nested neighbours are reordered by the same list.
	#applyBlockManualOrder(container, order)
	{
		const items = [...container.querySelectorAll(':scope > .mail-menu-directory-item-container')];
		const listed = new Set(order);
		const byId = new Map(items.map((element) => [Number(Dom.attr(element, 'data-dir-id')), element]));

		const known = order.map((dirId) => byId.get(dirId)).filter(Boolean);
		const unknown = items.filter((element) => !listed.has(Number(Dom.attr(element, 'data-dir-id'))));

		for (const element of [...known, ...unknown])
		{
			Dom.append(element, container);

			const children = element.querySelector(':scope > .mail-menu-directory-children');
			if (children)
			{
				this.#applyBlockManualOrder(children, order);
			}
		}
	}

	moveFocus(currentElement, direction)
	{
		const items = [...this.#menu.querySelectorAll('li[tabindex="0"]')]
			.filter((el) => el.offsetParent !== null);

		const index = items.indexOf(currentElement);
		if (index === -1)
		{
			return;
		}

		const next = items[index + direction];
		if (next)
		{
			next.focus();
		}
	}

	// Keyboard reorder: move an item one step among its direct siblings.
	moveItemInBlock(itemElement, direction)
	{
		if (!this.#manualSortingAvailable)
		{
			return;
		}

		const container = itemElement.closest('.mail-menu-directory-item-container');
		if (!container)
		{
			return;
		}

		this.#prepareOrderForMove();
		const parent = container.parentNode;
		const siblings = [...parent.querySelectorAll(':scope > .mail-menu-directory-item-container')];
		const index = siblings.indexOf(container);
		const targetIndex = index + direction;

		if (index === -1 || targetIndex < 0 || targetIndex >= siblings.length)
		{
			return;
		}

		const neighbour = siblings[targetIndex];
		if (direction > 0)
		{
			Dom.insertAfter(container, neighbour);
		}
		else
		{
			Dom.insertBefore(container, neighbour);
		}

		const committed = this.#commitOrder();

		// Focus after the shared path re-syncs the DOM so it is not lost on reorder.
		itemElement.focus();

		if (committed)
		{
			this.#announceMove(container, targetIndex + 1, siblings.length);
		}
	}

	// Expose real list semantics and the sortable affordance to assistive tech.
	// The <ul role="list"> direct child is the container <div> (the <li> sits a
	// level deeper), so the container carries role="listitem" - structural, kept
	// in every mode. aria-roledescription/aria-keyshortcuts expose the sortable
	// affordance in every mode because a move switches the menu to manual sorting.
	// Both aria-roledescription and aria-keyshortcuts are mirrored onto the
	// focusable <li> so they are announced on focus. Full screen-reader
	// verification (NVDA/VoiceOver) is a QA step.
	#applySortableSemantics()
	{
		const roleDescription = this.#manualSortingAvailable
			? Loc.getMessage('MAIL_DIRECTORY_MENU_ARIA_SORTABLE_ITEM')
			: null;
		const shortcuts = this.#manualSortingAvailable ? 'Alt+ArrowUp Alt+ArrowDown' : null;

		for (const block of this.#getBlockContainers())
		{
			if (this.#manualSortingAvailable)
			{
				Dom.addClass(block, 'mail-left-directory-menu--sortable');
			}
			else
			{
				Dom.removeClass(block, 'mail-left-directory-menu--sortable');
			}

			// Every item container - top-level and nested - carries the list/sortable
			// semantics; nested lists get role="group" so nested listitems stay inside
			// a list or group per ARIA.
			const containers = block.querySelectorAll('.mail-menu-directory-item-container');
			containers.forEach((container) => {
				Dom.attr(container, 'role', 'listitem');
				Dom.attr(container, 'aria-roledescription', roleDescription);
				Dom.attr(container, 'aria-keyshortcuts', shortcuts);

				const item = container.querySelector(':scope > li');
				if (item)
				{
					Dom.attr(item, 'aria-roledescription', roleDescription);
					Dom.attr(item, 'aria-keyshortcuts', shortcuts);
				}
			});

			block.querySelectorAll('.mail-menu-directory-children').forEach((children) => {
				Dom.attr(children, 'role', 'group');
			});
		}
	}

	#announceMove(container, position, total)
	{
		const name = Dom.attr(container, 'title') || '';
		const message = Loc.getMessage('MAIL_DIRECTORY_MENU_FOLDER_MOVED', {
			'#NAME#': name,
			'#POSITION#': position,
			'#TOTAL#': total,
		});

		this.#announce(message);
	}

	#announce(message, assertive = false)
	{
		if (!message)
		{
			return;
		}

		const region = assertive ? this.#liveRegionAssertive : this.#liveRegion;
		region.textContent = '';
		requestAnimationFrame(() => {
			region.textContent = message;
		});
	}

	onToggleFolder(path, isExpanded)
	{
		if (isExpanded)
		{
			delete this.#collapsedFolders[path];
		}
		else
		{
			this.#collapsedFolders[path] = false;
		}

		this.#saveCollapsedState();
	}

	#applyCollapsedState()
	{
		for (const [path, item] of this.#items)
		{
			if (this.#collapsedFolders[path] === false)
			{
				item.collapse();
			}
		}
	}

	#saveCollapsedState()
	{
		if (this.#mailboxId <= 0)
		{
			return;
		}

		clearTimeout(this.#saveTimer);
		this.#saveTimer = setTimeout(() => {
			this.#sendCollapsedState();
		}, 2000);
	}

	#sendCollapsedState()
	{
		this.#saveTimer = null;

		BX.ajax.runAction('mail.mailboxsettings.saveFolderExpandState', {
			data: {
				mailboxId: this.#mailboxId,
				collapsedFolders: JSON.stringify(this.#collapsedFolders),
			},
		});
	}

	// region drag-and-drop

	// One Draggable for the top-level list plus one per nested children container.
	// Folders stay on their hierarchy level, while system and custom top-level
	// folders share one list and can be placed in any order.
	async #initDragAndDrop()
	{
		this.#destroyDragAndDrop();

		if (!this.#manualSortingAvailable)
		{
			return;
		}

		const token = this.#dragAndDropToken;

		let Draggable;
		try
		{
			({ Draggable } = await Runtime.loadExtension('ui.draganddrop.draggable'));
		}
		catch
		{
			return;
		}

		// A later destroy/init (mode switched or menu rebuilt) bumped the token
		// while the extension was loading: drop this stale result to avoid a
		// double init on a container that is no longer the current one.
		if (token !== this.#dragAndDropToken)
		{
			return;
		}

		const topLevelDraggable = this.#getBlockOrder(this.#folderMenu).length > 0
			? this.#createContainerDraggable(this.#folderMenu, Draggable, false)
			: null;

		// One Draggable per nested children container that holds at least two direct
		// children. A per-draggable beforeStart guard keeps a drag within its own
		// parent, so a folder can be reordered only among its same-level neighbours.
		const nestedDraggables = [...this.#menu.querySelectorAll('.mail-menu-directory-children')]
			.filter((children) => children.querySelectorAll(':scope > .mail-menu-directory-item-container').length >= 2)
			.map((children) => this.#createContainerDraggable(children, Draggable, true));

		this.#draggables = [topLevelDraggable, ...nestedDraggables].filter(Boolean);
	}

	// beforeStart fires for every draggable whose sensor matched the grabbed row:
	// MouseSensor.getContainerByChild uses contains(), so a deep row wakes the sensors
	// of all ancestor containers. Keep only the one whose container is the row's direct
	// parent (same-level reorder), and collapse an expanded subtree for the drag.
	#handleDragBeforeStart = (event) => {
		const { source, sourceContainer } = event.data;

		if (source.parentNode !== sourceContainer)
		{
			event.preventDefault();

			return;
		}

		this.#prepareOrderForMove();

		const item = this.#itemByContainer.get(source);
		if (item && item.collapseForDrag())
		{
			this.#dragCollapsedItem = item;
		}
	};

	// Baseline the order from the current DOM once, so the first reorder compares
	// against the order visible in the selected sorting mode.
	#seedOrder()
	{
		if (this.#folderCustomOrder.length === 0)
		{
			this.#folderCustomOrder = this.#getBlockOrder(this.#folderMenu);
		}

		if (this.#orderSaveBaseline.length === 0)
		{
			this.#orderSaveBaseline = [...this.#folderCustomOrder];
		}
	}

	#prepareOrderForMove()
	{
		if (this.#sortMode !== 'manual')
		{
			const currentOrder = this.#getBlockOrder(this.#folderMenu);
			this.#folderCustomOrder = [...currentOrder];
			this.#orderSaveBaseline = [...currentOrder];
		}
		else
		{
			this.#seedOrder();
		}
	}

	#destroyDragAndDrop()
	{
		// Invalidate any in-flight async init so its deferred load cannot resurrect
		// Draggable instances after teardown.
		this.#dragAndDropToken++;

		for (const draggable of this.#draggables)
		{
			draggable.destroy();
		}

		this.#draggables = [];
	}

	#createContainerDraggable(container, Draggable, isNested)
	{
		const draggable = new Draggable({
			container,
			draggable: '.mail-menu-directory-item-container',
			// A nested container must NOT block on .mail-menu-directory-children: the
			// grabbed nested row lives inside one, so Sensor.getDragElementByChild would
			// reject the start. Block containers keep it out so a deep row never starts a
			// block-level drag. The toggle is excluded in both cases; the hold delay keeps
			// a normal click (open folder) from being read as a drag.
			elementsPreventingDrag: isNested
				? ['.mail-menu-directory-toggle']
				: ['.mail-menu-directory-children', '.mail-menu-directory-toggle'],
			delay: 200,
			type: Draggable.DROP_PREVIEW,
		});

		draggable.subscribe('beforeStart', this.#handleDragBeforeStart);
		draggable.subscribe('end', () => {
			this.#onDragEnd();
		});

		return draggable;
	}

	#onDragEnd()
	{
		this.#dragCollapsedItem?.expandAfterDrag();
		this.#dragCollapsedItem = null;

		this.#commitOrder();
	}

	// Persist the unified order (shared by drag-and-drop and keyboard reorder).
	// Optimistic: the DOM and local state already hold the new order; only the
	// network save is deferred. Returns true when the order actually changed.
	#commitOrder()
	{
		const prevOrder = this.#folderCustomOrder;
		const newOrder = this.#getBlockOrder(this.#folderMenu);

		if (this.#ordersEqual(prevOrder, newOrder))
		{
			return false;
		}

		this.#folderCustomOrder = newOrder;

		if (this.#sortMode !== 'manual')
		{
			this.#sortMode = 'manual';
			EventEmitter.emit('BX.Mail.FolderSort:onChange', { mode: 'manual' });
		}

		if (this.#mailboxId <= 0)
		{
			return true;
		}

		// Coalesce rapid reorders into one deferred save. The rollback baseline is
		// not touched here - it advances only when the server confirms a save, so a
		// failure always rolls back to the last order the server actually holds.
		this.#scheduleOrderSave();

		return true;
	}

	// Debounce the save so a burst of keyboard reorders (Alt+Arrow) collapses into
	// a single request instead of one POST per step.
	#scheduleOrderSave()
	{
		clearTimeout(this.#orderSaveTimer);
		this.#orderSaveTimer = setTimeout(() => {
			this.#sendOrder();
		}, 2000);
	}

	#handlePageLeave = () => {
		if (this.#mailboxId <= 0)
		{
			return;
		}

		clearTimeout(this.#orderSaveTimer);
		this.#orderSaveTimer = null;

		if (
			!this.#ordersEqual(this.#orderSaveBaseline, this.#folderCustomOrder)
			&& !this.#ordersEqual(this.#orderSentOnPageLeave, this.#folderCustomOrder)
		)
		{
			this.#sendOrderOnPageLeave(this.#folderCustomOrder);
			this.#orderSentOnPageLeave = [...this.#folderCustomOrder];
		}
	};

	#handlePageShow = () => {
		this.#orderSentOnPageLeave = [];
	};

	#sendOrderOnPageLeave(order)
	{
		const data = new URLSearchParams();
		data.set('mailboxId', String(this.#mailboxId));
		data.set('activateManualMode', this.#sortMode === 'manual' ? '1' : '0');
		order.forEach((dirId, index) => {
			data.set(`order[${index}]`, String(dirId));
		});

		const headers = {
			'Content-Type': 'application/x-www-form-urlencoded',
			'X-Bitrix-CSRF-Token': Loc.getMessage('bitrix_sessid'),
			'BX-Ajax': 'true',
		};
		const siteId = Loc.getMessage('SITE_ID');
		if (siteId)
		{
			headers['X-Bitrix-Site-Id'] = siteId;
		}

		void fetch(
			'/bitrix/services/main/ajax.php?action=mail.mailboxsettings.saveFolderCustomOrder',
			{
				method: 'POST',
				headers,
				body: data.toString(),
				credentials: 'same-origin',
				keepalive: true,
			},
		).catch(() => {});
	}

	#sendOrder()
	{
		this.#orderSaveTimer = null;

		const baseline = this.#orderSaveBaseline;
		const order = this.#folderCustomOrder;

		if (this.#ordersEqual(baseline, order))
		{
			return;
		}

		BX.ajax.runAction('mail.mailboxsettings.saveFolderCustomOrder', {
			data: {
				mailboxId: this.#mailboxId,
				order,
				activateManualMode: this.#sortMode === 'manual',
			},
		}).then(() => {
			// The server now holds this order: advance the rollback baseline so a
			// later failure rolls back here, not to a stale slice.
			this.#orderSaveBaseline = [...order];
		}).catch(() => {
			this.#showSaveErrorNotice();

			// A newer reorder superseded this request while it was in flight: leave
			// the fresher order and its own pending save untouched (the baseline is
			// still the last server-confirmed order).
			if (!this.#ordersEqual(this.#folderCustomOrder, order))
			{
				return;
			}

			// Roll back the in-memory order to what the server still holds; re-render
			// only if the manual order is still on screen (another mode no longer
			// shows it, so the DOM must not be touched).
			this.#folderCustomOrder = [...baseline];

			this.#applyBlockManualOrder(this.#folderMenu, baseline);
		});
	}

	// Depth-first pre-order (parent, then its subtree): the flat list carries every
	// nesting level, so a stored order also fixes the relative order of nested
	// neighbours. :scope > at each level skips the drag mirror (.ui-draggable--draggable).
	#getBlockOrder(container)
	{
		const order = [];

		for (const element of container.querySelectorAll(':scope > .mail-menu-directory-item-container'))
		{
			const dirId = Number(Dom.attr(element, 'data-dir-id'));
			if (dirId > 0)
			{
				order.push(dirId);
			}

			const children = element.querySelector(':scope > .mail-menu-directory-children');
			if (children)
			{
				order.push(...this.#getBlockOrder(children));
			}
		}

		return order;
	}

	#ordersEqual(a, b)
	{
		if (a.length !== b.length)
		{
			return false;
		}

		return a.every((value, index) => value === b[index]);
	}

	#showSaveErrorNotice()
	{
		const message = Loc.getMessage('MAIL_DIRECTORY_MENU_ORDER_SAVE_ERROR');

		this.#announce(message, true);

		const notifier = BX.UI?.Notification?.Center;

		if (notifier)
		{
			notifier.notify({ content: message });

			return;
		}

		console.error(message);
	}

	// endregion

	getFavoritesNode()
	{
		if (!this.#favoritesEnabled)
		{
			return null;
		}

		if (this.#favoritesNode)
		{
			return this.#favoritesNode;
		}

		const item = Tag.render`
			<button type="button" class="ui-sidepanel-menu-item mail-menu-directory-item mail-favorites-menu-item" data-testid="mail-menu-favorites-btn" title="${Text.encode(this.#favoritesLabel)}">
				<span class="ui-sidepanel-menu-link mail-menu-directory-link mail-favorites-menu-link">
					<span class="ui-sidepanel-menu-link-text">
						<span class="ui-icon-set --o-favorite mail-menu-directory-item-icon"></span>
						<span class="ui-sidepanel-menu-link-text-item">${Text.encode(this.#favoritesLabel)}</span>
					</span>
				</span>
			</button>
		`;

		Event.bind(item, 'click', () => {
			this.#selectFavoritesSection();
		});

		Event.bind(item, 'keydown', (event) => {
			if (event.key === 'Enter' || event.key === ' ')
			{
				event.preventDefault();
				this.#selectFavoritesSection();
			}
		});

		this.#favoritesItem = item;
		this.#updateFavoritesActiveState();
		const itemContainer = Tag.render`<div class="mail-menu-directory-item-container">${item}</div>`;
		const separator = Tag.render`<div class="mail-favorites-menu-separator mail-favorites-menu-separator--leading"></div>`;
		this.#favoritesNode = Tag.render`<div class="mail-favorites-menu mail-favorites-menu--leading-separator"></div>`;

		// the block always follows the folders, so the separator is its top border
		Dom.append(separator, this.#favoritesNode);
		Dom.append(itemContainer, this.#favoritesNode);

		return this.#favoritesNode;
	}

	// The section itself is switched by the list screen: the menu only asks for it and
	// reflects the answer, so a repeated pick reaches the screen as well as the first one.
	#selectFavoritesSection()
	{
		this.#activateKeepingFocus(this.#favoritesItem, () => {
			if (this.hasDirectorySelectHandler() && this.#onDirectorySelect(null, FAVORITES_SECTION) === false)
			{
				return;
			}

			this.setFavoritesActive(true);
		});
	}

	setFavoritesActive(active)
	{
		// with the improvements off the menu has no favorites item, and a section without an item of
		// its own would still take the highlight away from the folders and never give it back
		if (!this.#favoritesEnabled)
		{
			return;
		}

		if (active)
		{
			this.activateSection(FAVORITES_SECTION);

			return;
		}

		this.releaseSection(FAVORITES_SECTION);
	}

	#applyFavoritesActive(active)
	{
		if (this.#favoritesActive === active)
		{
			return;
		}

		this.#favoritesActive = active;
		this.#updateFavoritesActiveState();
	}

	#updateFavoritesActiveState()
	{
		if (!this.#favoritesItem)
		{
			return;
		}

		// a section of the list, not a toggle: the state is exposed the same way as
		// on the labels
		if (this.#favoritesActive)
		{
			Dom.addClass(this.#favoritesItem, 'mail-menu-directory-item--active');
			Dom.attr(this.#favoritesItem, 'aria-current', 'page');
		}
		else
		{
			Dom.removeClass(this.#favoritesItem, 'mail-menu-directory-item--active');
			Dom.attr(this.#favoritesItem, 'aria-current', null);
		}
	}

	getNode()
	{
		return this.#menu;
	}
}
