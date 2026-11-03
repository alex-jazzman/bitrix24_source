import { Reflection, Type } from 'main.core';
import { type BaseEvent, EventEmitter } from 'main.core.events';
import { nextTick } from 'ui.vue3';

import { GridEvent } from '../const';
import { announceFavoritesSection, applySectionFromUrl } from '../feature/favorites-section/favorites-section';
import { hideRows, type HiddenRowsRegistry } from '../feature/hide-rows/hide-rows';
import { loadNextPage, type PageRegistry } from '../feature/load-next-page/load-next-page';
import { type MigrationLockRegistry, rememberLockedMailboxes } from '../feature/migration-lock/migration-lock';
import { showSyncLoader } from '../feature/primary-sync-stub/primary-sync-stub';
import { drainPendingReload, reloadList } from '../feature/reload-list/reload-list';
import { dropRowActionsMenus } from '../feature/row-actions-menu/row-actions-menu';
import {
	announceRestoredSelection,
	announceSelectAll,
	announceSelectionState,
	reapplyStickyAll,
	clearSelection,
	isEverythingSelected,
	rememberSelection,
	resetSelection,
	restoreSelection,
	selectedShownIds,
	type SelectionRegistry,
	toggleRow,
	toggleSelectAll,
} from '../feature/row-selection/row-selection';
import { publishHrefListToSlider } from '../feature/slider-href-list/slider-href-list';
import {
	addProjectionRow,
	dropCancelledProjection,
	type ProjectionRegistry,
	type RealtimeRowOptions,
	type UndoSendCancelledData,
} from '../feature/undo-send-projection/undo-send-projection';
import { emitGridEvent } from '../lib/grid-event/grid-event';
import { registerGrid } from '../lib/grid-manager/grid-manager';
import { type GridRow, type PageSwapperHref } from '../model/grid/types';
import { GridRowsFacade } from './grid-rows-facade';

type FacadeRegistry = PageRegistry
	& SelectionRegistry
	& HiddenRowsRegistry
	& MigrationLockRegistry
	& ProjectionRegistry
	& {
	rows: GridRow[],
	selectedRows: GridRow[],
	pageSwapperHrefList: PageSwapperHref[],
	setListSection(section: string | null): void,
	setFaded(faded: boolean): void,
	setSyncing(syncing: boolean): void,
};

export type GridFacadeOptions = {
	gridId: string,
	container: HTMLElement,
	registry: FacadeRegistry,
};

type ActionPanel = {
	hidePanel(): unknown,
};

type GridActionPanel = {
	getPanel(): ActionPanel,
	getCheckAllNode(): HTMLInputElement | null,
	syncToSelection(rows: GridRow[]): void,
	mountCheckAllCheckbox(): unknown,
	setCheckAllState(checked: boolean, indeterminate: boolean): void,
	setCheckAllEnabled(enabled: boolean): void,
};

type CheckAllCheckbox = {
	getNode(): HTMLInputElement,
};

/**
 * The grid of the screen, as everything around it knows one.
 *
 * Published under the name of the old module wrapper (`BX.Mail.Home.Grid`) and registered in the
 * registry of the platform grid, so neither kind of caller learns the list is drawn by an
 * application now. Load-bearing surface: `getId`, `reloadTable`, `Grid::updated`, the binding
 * placeholders; the rest answers call sites of the screen outside this extension.
 */
export class GridFacade
{
	#gridId: string;
	#container: HTMLElement;
	#registry: FacadeRegistry;
	#panel: ActionPanel | null = null;
	#actionPanel: GridActionPanel | null = null;
	#checkAllCheckbox: HTMLInputElement | null = null;
	#baseUrl: string = '';

	constructor(options: GridFacadeOptions)
	{
		this.#gridId = options.gridId;
		this.#container = options.container;
		this.#registry = options.registry;
	}

	/**
	 * The name of the screen grid goes only to the list of messages - the second grid answers by its
	 * identifier. The registry comes first: the panel of mass actions asks it for the container of
	 * the grid the moment it is created, right after the application starts.
	 */
	publish(asScreenGrid: boolean): void
	{
		registerGrid(this.#gridId, this);

		if (asScreenGrid)
		{
			const home = Reflection.namespace('BX.Mail.Home') as Record<string, unknown>;
			home.Grid = this;
		}
	}

	/**
	 * Neither word is answered by saying it again: the screen announces every reset itself, and it
	 * answers a change of folder with the reset (`list.es6.js:568`).
	 */
	listenToScreen(): void
	{
		EventEmitter.subscribe(GridEvent.ResetSelection, (): void => {
			this.clearSelection();
		});

		EventEmitter.subscribe(GridEvent.DirectoryChanged, (): void => {
			this.clearSelection();
		});

		// the screen answers the same word by taking the node out of the document (`list.es6.js:305`),
		// and a record left behind it would draw the letter again
		EventEmitter.subscribe(GridEvent.UndoSendCancelled, (event: BaseEvent): void => {
			dropCancelledProjection(this.#registry, (event.getData() ?? {}) as UndoSendCancelledData);
		});
	}

	/**
	 * The rows the screen adds by itself (`grid.js:2943`); today that is the letter being sent and
	 * still callable back (`list.es6.js:264`).
	 */
	getRealtime(): { addRow(options: RealtimeRowOptions): void }
	{
		return {
			addRow: (options: RealtimeRowOptions): void => {
				addProjectionRow(this.#registry, options);
				this.announceUpdated();
			},
		};
	}

	/**
	 * Says the rows have changed, carrying the grid as compatibility data - the shape both
	 * `BX.addCustomEvent` and `EventEmitter.subscribe` read it in.
	 *
	 * Said after the tick, never before: every listener reads the document (`Binding.initButtons()`
	 * walks it looking for placeholders), and rows appended to the state are only drawn on the next
	 * tick.
	 */
	announceUpdated(): void
	{
		void nextTick((): void => {
			emitGridEvent(GridEvent.Updated, [this]);
		});
	}

	getId(): string
	{
		return this.#gridId;
	}

	getContainer(): HTMLElement
	{
		return this.#container;
	}

	/** Answered by the collection of rows, the way the wrapper of the module answered it. */
	getCountDisplayed(): number
	{
		return this.getRows().getCountDisplayed();
	}

	getMessageHrefList(): PageSwapperHref[]
	{
		return this.#registry.pageSwapperHrefList;
	}

	hasNextPage(): boolean
	{
		return this.#registry.enableNextPage;
	}

	async loadNextPage(): Promise<void>
	{
		await loadNextPage(this.#registry, (): void => {
			reapplyStickyAll(this.#registry);
			this.announceUpdated();
			this.#applyRowsChange();
			announceFavoritesSection(this.#registry);
			// the slider of a message reads the addresses of its neighbours out of its own dictionary
			publishHrefListToSlider(this.#registry);
		});

		// a reload asked for while this page was on its way was kept rather than dropped
		await drainPendingReload(this.#registry, (): void => this.#announceListReloaded());
	}

	/**
	 * The address the list reloads from. It carries the whole of the section: everything else about
	 * the section is built by the server off `list_section`.
	 */
	get baseUrl(): string
	{
		return this.#baseUrl;
	}

	set baseUrl(url: string)
	{
		this.#baseUrl = url;
		applySectionFromUrl(this.#registry, url);
	}

	/**
	 * The list from its first page again; waits for nothing. The transport of the pages is fixed, so
	 * the method and the data of the request are taken and unused.
	 */
	reloadTable(
		method?: string,
		data?: Record<string, unknown>,
		callback?: (() => void) | null,
		url?: string,
	): void
	{
		if (Type.isStringFilled(url))
		{
			this.baseUrl = url;
		}

		// the dimming comes off when the table is asked for and not when it arrives, the way the module
		// wrapper did it (`messagegrid.js:259`): a reload that never comes back would freeze the list
		this.#registry.setFaded(false);

		rememberSelection(this.#registry);

		void reloadList(this.#registry, (): void => {
			this.#announceListReloaded();
			callback?.();
		});
	}

	/** The same reload, in the shape the message of a slider asks for it (`template.php:1678`). */
	reload(url?: string): void
	{
		this.reloadTable('GET', {}, null, url);
	}

	/**
	 * Dims the list and stops it answering the reader. The mark comes off with the reload the screen
	 * answers itself with, both when the action succeeded and when it failed (`list.es6.js:1595`).
	 */
	tableFade(): void
	{
		this.#registry.setFaded(true);
	}

	/**
	 * The old wrapper was handed the wrapper of the table and the stub node to draw a loader into
	 * them (`messagegrid.js:226`); this grid draws both itself, so the nodes are taken and dropped.
	 */
	setGridWrapper(): void
	{}

	setGridStub(): void
	{}

	enableLoadingMessagesStub(): void
	{
		showSyncLoader(this.#registry);
	}

	getSelectedIds(): string[]
	{
		return [...this.#registry.selectedIds];
	}

	/**
	 * Takes the rows out of sight while the screen waits for the server. They come back with the
	 * reload the screen answers itself with.
	 */
	hideRowByIds(ids: string[]): void
	{
		hideRows(this.#registry, ids);
	}

	/**
	 * The panel is rebuilt before the word is said: the screen answers the word by disabling buttons
	 * a move of a mailbox refuses (`list.es6.js:419`), and the rebuild destroys every button standing
	 * (`ui/actionpanel/src/panel.js:321`).
	 */
	toggleRow(rowId: string): void
	{
		toggleRow(this.#registry, rowId);
		this.#applySelectionChange();
		announceSelectionState(this.#registry, this);
	}

	/** The mark of "select all" outlives the page it was set on. Order of the word as in `toggleRow`. */
	toggleSelectAll(on: boolean): void
	{
		toggleSelectAll(this.#registry, on);
		this.#applySelectionChange();
		announceSelectAll(this, on);
	}

	/**
	 * Kept for callers of `BX.Mail.Home.Grid` outside this screen; nothing on the screen answers a
	 * word of its own with it.
	 */
	resetSelection(): void
	{
		resetSelection(this.#registry);
		this.#applySelectionChange();
	}

	/** The same drop under the name callers outside this extension know (`list.es6.js:396`). */
	resetGridSelection(): void
	{
		this.resetSelection();
	}

	/** Silent: every caller has said the word of the reset itself (`list.es6.js:277`, `:1964`). */
	clearSelection(): void
	{
		clearSelection(this.#registry);
		this.#applySelectionChange();
	}

	/**
	 * Whether the reader marked the list rather than its rows: the screen checks marked rows one by
	 * one, and "select all" against every mailbox of the screen instead (`list.es6.js:429`). This is
	 * also the mark rows of a page loaded afterwards are selected from.
	 */
	areAllRowsSelected(): boolean
	{
		return this.#registry.stickyAll;
	}

	/**
	 * The mailboxes being moved right now (`list.es6.js:391`). Being a fact of the list rather than a
	 * mark on the nodes, it survives the rows being drawn again.
	 */
	setMigrationLocked(mailboxIds: Iterable<unknown>): void
	{
		if (rememberLockedMailboxes(this.#registry, mailboxIds))
		{
			// the items of a menu are read as it is built, so one opened before this still offers what the
			// move refuses
			dropRowActionsMenus(this.#gridId);
		}
	}

	setActionPanel(actionPanel: GridActionPanel): void
	{
		this.#actionPanel = actionPanel;
		this.setPanel(actionPanel.getPanel());

		const node = actionPanel.getCheckAllNode();
		if (node)
		{
			this.setCheckboxNodeForCheckAll(node);
		}

		this.#applyRowsChange();
	}

	setPanel(panel: ActionPanel): void
	{
		this.#panel = panel;
	}

	getPanel(): ActionPanel | null
	{
		return this.#panel;
	}

	hidePanel(): void
	{
		this.#panel?.hidePanel();
	}

	setCheckboxNodeForCheckAll(node: HTMLInputElement): void
	{
		this.#checkAllCheckbox = node;
	}

	getRows(): GridRowsFacade
	{
		return new GridRowsFacade(this.#registry, this, this.#container);
	}

	/**
	 * The grid draws no checkbox of "select all" inside its table - the one the screen knows sits in
	 * the container of the panel of mass actions.
	 */
	getCheckAllCheckboxes(): CheckAllCheckbox[]
	{
		const node = this.#checkAllCheckbox;

		return Type.isDomNode(node) ? [{ getNode: (): HTMLInputElement => node }] : [];
	}

	enableCheckAllCheckboxes(): void
	{
		this.#actionPanel?.setCheckAllEnabled(this.getCountDisplayed() > 0);
	}

	bindOnCheckAll(): void
	{
		this.#actionPanel?.mountCheckAllCheckbox();
	}

	adjustCheckAllCheckboxes(): void
	{
		const everything = isEverythingSelected(this.#registry);

		this.#actionPanel?.setCheckAllState(
			everything,
			!everything && selectedShownIds(this.#registry).length > 0,
		);
	}

	#announceListReloaded(): void
	{
		restoreSelection(this.#registry);
		this.announceUpdated();
		this.#applyRowsChange();
		announceRestoredSelection(this.#registry, this);
		announceFavoritesSection(this.#registry);
	}

	#applyRowsChange(): void
	{
		this.enableCheckAllCheckboxes();
		this.#applySelectionChange();
	}

	#applySelectionChange(): void
	{
		this.adjustCheckAllCheckboxes();
		this.#actionPanel?.syncToSelection(this.#registry.selectedRows);
	}
}
