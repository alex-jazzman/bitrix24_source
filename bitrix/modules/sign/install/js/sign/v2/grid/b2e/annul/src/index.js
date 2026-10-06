import { Event, Loc, Runtime, Type } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { Button, ButtonColor } from 'ui.buttons';
import { MessageBox } from 'ui.dialogs.messagebox';
import { UI } from 'ui.notification';

import { ActionPanel } from 'sign.v2.grid.components.action-panel';

type RowMeta = {
	uid: string,
	canAnnul: boolean,
	isAnnulled: boolean,
};

type BatchResult = {
	changed: number,
	unchanged: number,
	forbidden: number,
};

type SingleResult = {
	uid: string,
	isAnnulled: boolean,
	canAnnul: boolean,
	status: string,
	changed: boolean,
};

type Grid = BX.Main.grid;

const META_SELECTOR = '.sign-document-list__annul-meta';

const ANNUL_BUTTON_ID = 'sign-document-list-annul-button';
const UNANNUL_BUTTON_ID = 'sign-document-list-unannul-button';
const GRID_CHANGE_EVENTS = Object.freeze([
	'Grid::updated',
	'Grid::allRowsSelected',
	'Grid::allRowsUnselected',
	'Grid::thereSelectedRows',
	'Grid::noSelectedRows',
	'Grid::selectRow',
	'Grid::unselectRow',
]);

/**
 * Annulment controller for the sign.document.list company safe and per-document
 * process grids. Each grid row is a member record, so the controller addresses
 * the annul endpoints by member uid: the single-row action toggles one record,
 * the mass action collects the selected records' uids, confirms, calls the batch
 * REST endpoint and reports the aggregated result without leaving the grid. Row
 * rights (canAnnul) are honored on the client to avoid pointless calls, while the
 * endpoints stay authoritative (they re-check rights and the member role/status).
 */
export class Annul
{
	#gridId: string;
	#api: ?Object = null;
	#actionPanel: ActionPanel;
	// Guards against a second action being started while the confirm dialog is
	// open or the batch request is still in flight (double-submit protection).
	#running: boolean = false;
	#subscribedOnGridEvents: boolean = false;
	#onGridChanged = (event) => {
		if (this.#isOwnGridEvent(event))
		{
			this.#seedEmptyActionsForRowsWithoutActions();
			setTimeout(() => this.#syncActionPanel(), 0);
		}
	};

	constructor(gridId: string, actionPanel: ?ActionPanel = null)
	{
		this.#gridId = gridId;
		this.#actionPanel = actionPanel ?? new ActionPanel();
	}

	/**
	 * The grid re-creates its rows on every reload, so the action seeding below is
	 * re-applied after each update.
	 */
	subscribeOnGridEvents(): void
	{
		Event.ready(() => {
			if (this.#subscribedOnGridEvents || !Type.isObject(this.#getGrid()))
			{
				return;
			}

			this.#subscribedOnGridEvents = true;
			for (const eventName of GRID_CHANGE_EVENTS)
			{
				EventEmitter.subscribe(eventName, this.#onGridChanged);
			}
			this.#seedEmptyActionsForRowsWithoutActions();
			this.#syncActionPanel();
		});
	}

	/**
	 * With exactly one row checked the shared action panel builds itself from that
	 * row's own actions. A row the annulment cannot apply to offers no action, the
	 * grid renders no actions button for it, and `Row.getActions()` then returns
	 * null: the panel, unlike the row menu, does not guard against that and throws
	 * instead of showing up. Seeding an empty action list keeps such rows selectable
	 * and simply leaves the panel empty for them. The list is assigned directly
	 * rather than through `Row.setActions()`, which would also render an (empty)
	 * actions button into the row.
	 */
	#seedEmptyActionsForRowsWithoutActions(): void
	{
		const grid = this.#getGrid();
		if (!Type.isObject(grid))
		{
			return;
		}

		for (const row of grid.getRows().getBodyChild())
		{
			if (!Type.isArray(row.getActions()))
			{
				row.actions = [];
			}
		}
	}

	#isOwnGridEvent(event): boolean
	{
		const [eventGrid] = event?.getCompatData?.() ?? [];
		if (!Type.isObject(eventGrid))
		{
			return true;
		}

		return eventGrid === this.#getGrid()
			|| (Type.isFunction(eventGrid.getId) && eventGrid.getId() === this.#gridId)
		;
	}

	/**
	 * sign.v2.api is loaded on first use rather than imported: it pulls the whole
	 * side-panel stack (ui.sidepanel-content, and through it main.sidepanel), which
	 * the grid never needs by itself, while the endpoints are reached only after the
	 * user confirms an action.
	 */
	async #getApi(): Promise<Object>
	{
		if (this.#api === null)
		{
			const { Api } = await Runtime.loadExtension('sign.v2.api');
			this.#api = new Api();
		}

		return this.#api;
	}

	annulSelected(): void
	{
		void this.#run(true);
	}

	unannulSelected(): void
	{
		void this.#run(false);
	}

	// Single-row action wired to the row dropdown. Same confirm + reload contract
	// as the mass action, but it targets one member uid and hits the single annul
	// endpoint. Rights are still enforced server-side.
	annulOne(uid: string, annul: boolean): void
	{
		void this.#runOne(uid, annul);
	}

	async #runOne(uid: string, annul: boolean): Promise<void>
	{
		if (!Type.isStringFilled(uid) || this.#running)
		{
			return;
		}

		this.#running = true;
		try
		{
			const confirmed = await this.#confirmOne(annul);
			if (!confirmed)
			{
				return;
			}

			const api = await this.#getApi();
			const result: SingleResult = await api.annulMember(uid, annul);
			UI.Notification.Center.notify({
				content: this.#buildOneResultMessage(annul, result),
			});
			this.#reload();
		}
		catch
		{
			// A failed request is already reported by the API layer; a failed load of
			// that layer leaves the grid as it was, which is the same outcome.
		}
		finally
		{
			this.#running = false;
		}
	}

	async #run(annul: boolean): Promise<void>
	{
		if (this.#running)
		{
			return;
		}

		const { annulUids, unannulUids } = this.#getSelection();
		const targetUids = annul ? annulUids : unannulUids;
		const unchangedCount = annul ? unannulUids.length : annulUids.length;

		// Nothing to offer when the whole selection has no rows for the requested
		// transition; otherwise the endpoint remains authoritative.
		if (targetUids.length === 0)
		{
			UI.Notification.Center.notify({
				content: Loc.getMessage('SIGN_DOCUMENT_LIST_ANNUL_NOTHING_TO_DO'),
			});
			this.#syncActionPanel();

			return;
		}

		this.#running = true;
		try
		{
			const confirmed = await this.#confirm(annul, targetUids.length);
			if (!confirmed)
			{
				return;
			}

			const api = await this.#getApi();
			const result: BatchResult = await api.annulMembersBatch(targetUids, annul);
			UI.Notification.Center.notify({
				content: this.#buildResultMessage({
					...result,
					unchanged: Number(result?.unchanged ?? 0) + unchangedCount,
				}),
			});
			this.#reload();
		}
		catch
		{
			// A failed request is already reported by the API layer; a failed load of
			// that layer leaves the grid as it was, which is the same outcome.
		}
		finally
		{
			this.#running = false;
		}
	}

	#getGrid(): ?Grid
	{
		return BX.Main.gridManager.getInstanceById(this.#gridId);
	}

	#getSelection(): { annulUids: string[], unannulUids: string[] }
	{
		const grid = this.#getGrid();
		if (!Type.isObject(grid))
		{
			return { annulUids: [], unannulUids: [] };
		}

		const uids = new Set();
		const actionUids = [];
		const annulUids = [];
		const unannulUids = [];
		grid.getRows().getRows().forEach((row) => {
			if (!row.getCheckbox()?.checked)
			{
				return;
			}

			const meta = this.#extractMeta(row);
			if (meta === null || meta.uid === '' || !meta.canAnnul || uids.has(meta.uid))
			{
				return;
			}

			uids.add(meta.uid);
			actionUids.push(meta.uid);
			if (meta.isAnnulled)
			{
				unannulUids.push(meta.uid);
			}
			else
			{
				annulUids.push(meta.uid);
			}
		});

		return { annulUids, unannulUids };
	}

	#syncActionPanel(): void
	{
		const { annulUids, unannulUids } = this.#getSelection();

		this.#setActionButtonVisible(ANNUL_BUTTON_ID, annulUids.length > 0);
		this.#setActionButtonVisible(UNANNUL_BUTTON_ID, unannulUids.length > 0);
	}

	#setActionButtonVisible(id: string, visible: boolean): void
	{
		this.#actionPanel.toggleActionButtonVisibility(id, visible);
	}

	#extractMeta(row: BX.Grid.Row): ?RowMeta
	{
		const element = [...row.getCells()]
			.map((cell: HTMLElement) => cell.querySelector(META_SELECTOR))
			.find((node) => node)
		;
		if (!element)
		{
			return null;
		}

		return {
			uid: element.dataset.uid ?? '',
			canAnnul: element.dataset.canAnnul === '1',
			isAnnulled: element.dataset.isAnnulled === '1',
		};
	}

	#confirm(annul: boolean, count: number): Promise<boolean>
	{
		const title = annul
			? Loc.getMessage('SIGN_DOCUMENT_LIST_ANNUL_CONFIRM_TITLE')
			: Loc.getMessage('SIGN_DOCUMENT_LIST_UNANNUL_CONFIRM_TITLE')
		;
		const message = annul
			? Loc.getMessage('SIGN_DOCUMENT_LIST_ANNUL_CONFIRM_TEXT', { '#COUNT#': count })
			: Loc.getMessage('SIGN_DOCUMENT_LIST_UNANNUL_CONFIRM_TEXT', { '#COUNT#': count })
		;

		return this.#showConfirmDialog(title, message, annul);
	}

	#confirmOne(annul: boolean): Promise<boolean>
	{
		const title = annul
			? Loc.getMessage('SIGN_DOCUMENT_LIST_ANNUL_ONE_CONFIRM_TITLE')
			: Loc.getMessage('SIGN_DOCUMENT_LIST_UNANNUL_ONE_CONFIRM_TITLE')
		;
		const message = annul
			? Loc.getMessage('SIGN_DOCUMENT_LIST_ANNUL_ONE_CONFIRM_TEXT')
			: Loc.getMessage('SIGN_DOCUMENT_LIST_UNANNUL_ONE_CONFIRM_TEXT')
		;

		return this.#showConfirmDialog(title, message, annul);
	}

	#showConfirmDialog(title: string, message: string, annul: boolean): Promise<boolean>
	{
		return new Promise((resolve) => {
			let resolved = false;
			const finish = (value: boolean): void => {
				if (!resolved)
				{
					resolved = true;
					resolve(value);
				}
			};

			MessageBox.show({
				popupOptions: {
					events: {
						onPopupClose: () => finish(false),
						onPopupDestroy: () => finish(false),
					},
				},
				title,
				message,
				modal: true,
				buttons: [
					new Button({
						text: annul
							? Loc.getMessage('SIGN_DOCUMENT_LIST_ANNUL_CONFIRM_YES')
							: Loc.getMessage('SIGN_DOCUMENT_LIST_UNANNUL_CONFIRM_YES'),
						color: ButtonColor.PRIMARY,
						onclick: (button) => {
							finish(true);
							button.getContext().close();
						},
					}),
					new Button({
						text: Loc.getMessage('SIGN_DOCUMENT_LIST_ANNUL_CONFIRM_NO'),
						color: ButtonColor.LINK,
						onclick: (button) => {
							finish(false);
							button.getContext().close();
						},
					}),
				],
			});
		});
	}

	/**
	 * The single endpoint reports whether it performed the transition: a repeated
	 * action on an already applied state succeeds without changing anything, and
	 * must be reported as such instead of claiming a change.
	 */
	#buildOneResultMessage(annul: boolean, result: ?SingleResult): string
	{
		if (result?.changed === false)
		{
			return annul
				? Loc.getMessage('SIGN_DOCUMENT_LIST_ANNUL_ONE_UNCHANGED')
				: Loc.getMessage('SIGN_DOCUMENT_LIST_UNANNUL_ONE_UNCHANGED')
			;
		}

		return annul
			? Loc.getMessage('SIGN_DOCUMENT_LIST_ANNUL_ONE_DONE')
			: Loc.getMessage('SIGN_DOCUMENT_LIST_UNANNUL_ONE_DONE')
		;
	}

	#buildResultMessage(result: BatchResult): string
	{
		const changed = Number(result?.changed ?? 0);
		const unchanged = Number(result?.unchanged ?? 0);
		const forbidden = Number(result?.forbidden ?? 0);

		if (forbidden > 0)
		{
			return Loc.getMessage('SIGN_DOCUMENT_LIST_ANNUL_RESULT_WITH_FORBIDDEN', {
				'#CHANGED#': changed,
				'#UNCHANGED#': unchanged,
				'#FORBIDDEN#': forbidden,
			});
		}

		return Loc.getMessage('SIGN_DOCUMENT_LIST_ANNUL_RESULT', {
			'#CHANGED#': changed,
			'#UNCHANGED#': unchanged,
		});
	}

	#reload(): void
	{
		const grid = this.#getGrid();
		if (Type.isObject(grid))
		{
			grid.reloadTable();
		}
	}
}
