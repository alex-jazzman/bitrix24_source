import { Dom, Event, Loc, Reflection, Tag, Type } from 'main.core';
import { type BaseEvent, EventEmitter } from 'main.core.events';
// the panel of mass actions publishes itself into `BX.UI` and exports nothing of its own
import 'ui.actionpanel';
import { Checkbox, CheckboxSize } from 'ui.system.checkbox';

import { CheckAllAttribute, GridEvent, GridMode, type GridModeValue, type GridPanel, TestId } from '../../const';
import { resolveGlobal } from '../../lib/global/global';
import { type FolderMenuItem, type GridRow, type MessageRow, type RowAction } from '../../model/grid/types';
import { withFolderSubmenus } from '../row-actions-menu/row-actions-menu';

const PanelMaxHeight = 56;
const PanelClassName = 'mail-msg-list-action-panel';

const ActiveCrmBindingSelector = '.mail-binding-crm.mail-ui-active';

/** The class an unread message carries in every cell that shows it as unread (`sender-cell.ts:48`). */
const UnseenCellSelector = '.mail-msg-list-cell-unseen';

/** The one menu every dropdown of the panel opens into (`ui/actionpanel/src/item.js:576`). */
const ItemMenuId = 'ui-action-panel-item-popup-menu';

/** Buttons the state of the selection chooses between; both of a pair are described, one is shown. */
const PanelItem = Object.freeze({
	Read: 'read',
	NotRead: 'notRead',
	Spam: 'spam',
	NotSpam: 'notSpam',
	AddToCrm: 'addToCrm',
	ExcludeFromCrm: 'excludeFromCrm',
} as const);

type ActionPanelItem = {
	hide(): void,
	showAsInlineBlock(): void,
	layout: { container: HTMLElement | null },
};

type ActionPanel = {
	items: ActionPanelItem[],
	getItemById(id: string): ActionPanelItem | undefined,
	getPanelContainer(): HTMLElement,
	buildPanelByItem(item: { getActions(): RowAction[] }): void,
	buildPanelByGroup(): void,
	setTotalSelectedItems(total: number): void,
	showPanel(): void,
	hidePanel(): void,
	fixPanel(): void,
	unfixPanel(): void,
	draw(): void,
};

type ActionPanelConstructor = new (options: Record<string, unknown>) => ActionPanel;

type FilterPreset = {
	getCurrentPresetId(): string,
};

type FilterInstance = {
	getPreset(): FilterPreset,
	getFilterFieldsValues(): Record<string, string>,
};

export type ActionPanelOptions = {
	gridId: string,
	mode: GridModeValue,
	filterId: string,
	panel: GridPanel,
	/** The node the panel returns in front of when it stops being pinned to the top of the window. */
	gridContainer: HTMLElement,
	onSelectAll(on: boolean): void,
	onReset(): void,
	/**
	 * Folder tree of the submenu "move to folder": the panel of one marked row shows the action of
	 * the row itself, and that submenu is filled here rather than by the server.
	 */
	folders: FolderMenuItem[],
};

function resolveFilter(filterId: string): FilterInstance | null
{
	const manager = resolveGlobal<{ getById(id: string): FilterInstance | null }>('BX.Main.filterManager');

	return manager?.getById(filterId) ?? null;
}

/**
 * The panel of mass actions of one grid.
 *
 * The panel is the one of the platform, but the grid leads it by calls: it is built without the
 * identifier of a grid and without hiding on an outer click, so it subscribes neither to the events
 * of a grid nor to clicks past itself. That replaces four of the five substitutions the screen used
 * to make on it. The fifth is the pinning, and only the panel of the messages has it.
 */
export class GridActionPanel
{
	#options: ActionPanelOptions;
	#panel: ActionPanel;
	#panelHolder: HTMLElement;
	#checkAll: Checkbox | null = null;
	#currentFolderIsSpam = false;

	constructor(options: ActionPanelOptions, panel: ActionPanel, panelHolder: HTMLElement)
	{
		this.#options = options;
		this.#panel = panel;
		this.#panelHolder = panelHolder;

		if (this.#options.mode === GridMode.Message)
		{
			this.#leadPinning();
		}

		this.#readCurrentFolder();

		this.#panel.draw();
		this.#takePlace();

		this.mountCheckAllCheckbox();
		this.#bindResetWord();
		this.#listenToScreen();
	}

	getPanel(): ActionPanel
	{
		return this.#panel;
	}

	/** The node of the checkbox of "select all"; the screen looks the same node up by its attribute. */
	getCheckAllNode(): HTMLInputElement | null
	{
		return this.#panel.getPanelContainer().querySelector(`input[${CheckAllAttribute}]`);
	}

	/**
	 * What the panel is built of depends on how many rows are marked: one row gives the actions of
	 * that row, two and more the actions of the group. The platform panel derived this by following
	 * the grid (`ui/actionpanel/src/panel.js:733`).
	 */
	syncToSelection(rows: GridRow[]): void
	{
		if (rows.length === 0)
		{
			this.#panel.hidePanel();

			return;
		}

		this.#panel.setTotalSelectedItems(rows.length);

		if (rows.length === 1)
		{
			// the actions of a row carry the identifier of that row inside their calls, and the screen
			// counts such an action as a group one (`list.es6.js:1707`)
			const actions = withFolderSubmenus(rows[0].actions, this.#options.folders);

			this.#panel.buildPanelByItem({ getActions: (): RowAction[] => actions });
		}
		else
		{
			this.#panel.buildPanelByGroup();
		}

		this.#applyExclusivePairs(rows);
		this.#panel.showPanel();
	}

	mountCheckAllCheckbox(): Checkbox
	{
		if (this.#checkAll)
		{
			return this.#checkAll;
		}

		// The name is given as a label and not by the tooltip alone: the component of the design system
		// wraps its input in a label of its own, and an empty label leaves the box without a name at all.
		const label = Loc.getMessage('INTERFACE_MAIL_CHECK_ALL') ?? '';

		this.#checkAll = new Checkbox({
			size: CheckboxSize.Md,
			disabled: true,
			attributes: {
				[CheckAllAttribute]: this.#options.gridId,
				'data-testid': TestId.CheckAll,
				title: label,
				'aria-label': label,
			},
			onChange: ({ checked }: { checked: boolean }): void => this.#options.onSelectAll(checked),
		});

		const holder: HTMLElement = Tag.render`<span class="mail-msg-list-check-all"></span>`;
		Dom.append(this.#checkAll.render(), holder);
		Dom.prepend(holder, this.#panel.getPanelContainer());

		return this.#checkAll;
	}

	setCheckAllState(checked: boolean, indeterminate: boolean): void
	{
		this.#checkAll?.setIndeterminate(indeterminate);
		this.#checkAll?.setChecked(checked && !indeterminate);
	}

	setCheckAllEnabled(enabled: boolean): void
	{
		this.#checkAll?.setDisabled(!enabled);
	}

	/**
	 * The other half of syncToSelection: the pairs of buttons go back to the state with nothing
	 * marked, and the buttons left standing lose their calls - one pressed meanwhile would act on
	 * rows nobody chose.
	 */
	resetToNoSelection(): void
	{
		this.#dropItemHandlers();

		if (this.#options.mode !== GridMode.Message)
		{
			return;
		}

		this.#showItem(PanelItem.Read);
		this.#hideItem(PanelItem.NotRead);
		this.#showItem(PanelItem.Spam);
		this.#hideItem(PanelItem.NotSpam);
		this.#showItem(PanelItem.AddToCrm);
		this.#hideItem(PanelItem.ExcludeFromCrm);

		this.#announceLayoutChange();
	}

	/**
	 * A button of the panel carries its call as an attribute of its own node, and disabling a button
	 * of the platform leaves that attribute where it is (`ui/actionpanel/src/item.js:226`).
	 */
	#dropItemHandlers(): void
	{
		this.#panel.items.forEach((item: ActionPanelItem): void => {
			item.layout.container?.removeAttribute('onclick');
		});

		const menus = resolveGlobal<{ getMenuById(id: string): { close(): void } | null }>('BX.Main.MenuManager');
		menus?.getMenuById(ItemMenuId)?.close();
	}

	/**
	 * The panel of the platform draws itself into the body of the document (`panel.js:972`), and
	 * neither list leaves it there. The panel of the messages takes its place above its own grid
	 * through the call the screen made, deferred the way the screen deferred it (`template.php:952`);
	 * the panel of the drafts is put into the container the screen keeps for it (`style.css:1444`).
	 */
	#takePlace(): void
	{
		if (this.#options.mode === GridMode.Draft)
		{
			Dom.append(this.#panel.getPanelContainer(), this.#panelHolder);

			return;
		}

		setTimeout((): void => this.#panel.unfixPanel(), 0);
	}

	/**
	 * A pinned panel is taken out to the body of the document, or the scroll of the list would carry it
	 * away; an unpinned one goes back right above its own grid.
	 */
	#leadPinning(): void
	{
		const panel = this.#panel;
		const fixPanel = panel.fixPanel.bind(panel);
		const unfixPanel = panel.unfixPanel.bind(panel);

		panel.fixPanel = (): void => {
			Dom.append(panel.getPanelContainer(), document.body);
			fixPanel();
		};

		panel.unfixPanel = (): void => {
			Dom.insertBefore(panel.getPanelContainer(), this.#options.gridContainer);
			unfixPanel();
		};
	}

	/**
	 * The panel of the platform answers "reset" by asking its grid to drop the selection, and this
	 * panel has no grid to ask. The count is put back to nothing first, the way the screen did it
	 * (`user-interface-manager.js:227`): the panel keeps the number it was last given, and no new
	 * number arrives to overwrite it here.
	 */
	#bindResetWord(): void
	{
		const total = this.#panel.getPanelContainer().querySelector('[data-role="action-panel-total"]');
		if (Type.isDomNode(total))
		{
			Event.bind(total, 'click', (): void => {
				this.#panel.setTotalSelectedItems(0);
				this.#options.onReset();
			});
		}
	}

	#listenToScreen(): void
	{
		EventEmitter.subscribe(GridEvent.PanelHidden, (event: BaseEvent): void => {
			const [panel] = event.getCompatData() ?? [];
			// Two panels share the screen, and each answers only for itself.
			if (panel === this.#panel)
			{
				this.resetToNoSelection();
			}
		});

		EventEmitter.subscribe(GridEvent.FilterApplied, (event: BaseEvent): void => {
			const [filterId] = event.getCompatData() ?? [];
			if (filterId !== this.#options.filterId)
			{
				return;
			}

			this.#readCurrentFolder();
			this.resetToNoSelection();
		});
	}

	/**
	 * The folder is read from the filter of the screen rather than from the page: applying a filter
	 * changes the folder without the screen being drawn again.
	 */
	#readCurrentFolder(): void
	{
		const spamDir = this.#options.panel.spamDir;
		const filter = resolveFilter(this.#options.filterId);

		this.#currentFolderIsSpam = spamDir !== '' && filter !== null && (
			filter.getPreset().getCurrentPresetId() === 'spam'
			|| filter.getFilterFieldsValues().DIR === spamDir
		);
	}

	/**
	 * Of every pair of buttons the panel shows the one the marked rows call for: read and unread go by
	 * the rows, spam by the folder, and the pair of CRM by the one row if the selection is one row.
	 */
	#applyExclusivePairs(rows: GridRow[]): void
	{
		if (this.#options.mode !== GridMode.Message)
		{
			return;
		}

		const messages = rows as MessageRow[];

		if (messages.every((row: MessageRow): boolean => row.isOld))
		{
			this.#hideItem(PanelItem.Read);
			this.#hideItem(PanelItem.NotRead);
		}
		else if (messages.some((row: MessageRow): boolean => this.#isUnseen(row)))
		{
			this.#showItem(PanelItem.Read);
			this.#hideItem(PanelItem.NotRead);
		}
		else
		{
			this.#showItem(PanelItem.NotRead);
			this.#hideItem(PanelItem.Read);
		}

		if (this.#currentFolderIsSpam)
		{
			this.#showItem(PanelItem.NotSpam);
			this.#hideItem(PanelItem.Spam);
		}
		else
		{
			this.#showItem(PanelItem.Spam);
			this.#hideItem(PanelItem.NotSpam);
		}

		if (messages.length === 1)
		{
			this.#applyCrmPairByRow(messages[0]);
		}
		else
		{
			this.#applyCrmPairByDefault();
		}

		this.#announceLayoutChange();
	}

	/**
	 * Whether the message is still unread is drawn rather than told: reading it takes the mark off its
	 * cells and writes nothing anywhere else (`user-interface-manager.js:392`). The action behind the
	 * button reads the document too when pressed (`list.es6.js:3337`), and the two have to agree.
	 */
	#isUnseen(row: MessageRow): boolean
	{
		return this.#options.gridContainer.querySelector(
			`tr[data-id="${row.id}"] ${UnseenCellSelector}`,
		) !== null;
	}

	/**
	 * Whether the message is already bound to CRM is drawn rather than told: the button of the binding
	 * belongs to `mail.client.binding`, so the state is read where it is written
	 * (`user-interface-manager.js:296`).
	 */
	#applyCrmPairByRow(row: MessageRow): void
	{
		const bound = this.#options.gridContainer.querySelector(
			`tr[data-id="${row.id}"] ${ActiveCrmBindingSelector}`,
		) !== null;

		if (bound)
		{
			this.#showItem(PanelItem.ExcludeFromCrm);
			this.#hideItem(PanelItem.AddToCrm);

			return;
		}

		this.#applyCrmPairByDefault();
	}

	#applyCrmPairByDefault(): void
	{
		this.#showItem(PanelItem.AddToCrm);
		this.#hideItem(PanelItem.ExcludeFromCrm);
	}

	#showItem(id: string): void
	{
		this.#panel.getItemById(id)?.showAsInlineBlock();
	}

	#hideItem(id: string): void
	{
		this.#panel.getItemById(id)?.hide();
	}

	/**
	 * The panel measures the row of its buttons on a resize and moves what no longer fits into the menu
	 * of the rest, so a rebuild of the buttons is followed by one (`user-interface-manager.js:434`).
	 */
	#announceLayoutChange(): void
	{
		// `Event` of `main.core` stands for the name here, so the one of the document is named in full
		window.dispatchEvent(new window.Event('resize', { bubbles: true, cancelable: true }));
	}
}

/**
 * Builds the panel of a grid and registers it where the screen looks for one. Without the container
 * the screen keeps beside the grid there is no panel at all.
 */
export function createActionPanel(options: ActionPanelOptions): GridActionPanel | null
{
	const container = document.getElementById(options.panel.containerId);
	const PanelClass = resolveGlobal<ActionPanelConstructor>('BX.UI.ActionPanel');
	if (!container || !PanelClass)
	{
		return null;
	}

	const adapter = new GridActionPanel(
		options,
		new PanelClass({
			// Neither a grid nor an outer click: this panel is led by calls, see the note on the class.
			pinnedMode: true,
			autoHide: false,
			maxHeight: PanelMaxHeight,
			renderTo: container,
			className: PanelClassName,
			groupActions: options.panel.groupActions,
		}),
		container,
	);

	const panels = Reflection.namespace('BX.Mail.Home.GridActionPanels') as Record<string, unknown>;
	panels[options.gridId] = adapter.getPanel();

	return adapter;
}
