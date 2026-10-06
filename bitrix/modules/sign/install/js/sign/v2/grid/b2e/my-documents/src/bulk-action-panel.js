import { Dom, Event, Type } from 'main.core';
import { EventEmitter } from 'main.core.events';

import { ActionPanel } from 'sign.v2.grid.components.action-panel';

import { BulkActionType } from './bulk-action-type';

const APPROVE_CONTROL_ID = 'sign-my-documents-bulk-action-approve';
const REJECT_CONTROL_ID = 'sign-my-documents-bulk-action-reject';
const GRID_SELECTION_EVENTS = [
	'Grid::thereSelectedRows',
	'Grid::allRowsSelected',
	'Grid::allRowsUnselected',
	'Grid::noSelectedRows',
	'Grid::selectRow',
	'Grid::unselectRow',
];

type BulkAction = 'approve' | 'reject';
type BulkActionLabels = {
	disabledHint?: { [action: BulkAction]: string },
};
type Grid = BX.Main.grid;

type BulkActionPanelOptions = {
	gridId: string,
	labels: BulkActionLabels,
	onApply?: ({ actionType: BulkAction, memberIds: number[], trigger: ?HTMLElement }) => void,
};

export class BulkActionPanel
{
	#gridId: string;
	#labels: BulkActionLabels;
	#onApply: ?Function;
	#actionPanel: ActionPanel = new ActionPanel();
	#availableActions: BulkAction[] = [];
	#disabled = false;
	#subscribed = false;
	#boundControls: WeakSet<HTMLElement> = new WeakSet();
	#onGridUpdated = (event) => {
		if (!this.#isOwnGridEvent(event))
		{
			return;
		}

		this.reset();
		this.#prepareRowCheckboxes();
	};

	#onGridSelectionChanged = (event) => {
		if (this.#isOwnGridEvent(event))
		{
			this.refresh();
		}
	};

	#onWindowUnload = () => this.destroy();

	#onUiActionPanelCreated = (event) => {
		const [panel] = event?.getCompatData?.() ?? [];
		if (!Type.isObject(panel) || panel.params?.gridId !== this.#gridId)
		{
			return;
		}

		this.#adoptUiActionPanel(panel);
	};

	constructor({ gridId, labels, onApply }: BulkActionPanelOptions)
	{
		this.#gridId = gridId;
		this.#labels = labels;
		this.#onApply = onApply;
	}

	subscribe(): void
	{
		// the shared panel announces itself from its constructor on document ready, so the listener
		// is set right away and not from inside another ready callback
		EventEmitter.subscribe('BX.UI.ActionPanel:created', this.#onUiActionPanelCreated);

		Event.ready(() => {
			if (this.#subscribed || !Type.isObject(this.#getGrid()))
			{
				return;
			}

			this.#subscribed = true;
			EventEmitter.subscribe('Grid::updated', this.#onGridUpdated);
			GRID_SELECTION_EVENTS.forEach((eventName) => {
				EventEmitter.subscribe(eventName, this.#onGridSelectionChanged);
			});
			Event.bind(window, 'unload', this.#onWindowUnload);
			this.#prepareRowCheckboxes();
			this.refresh();
		});
	}

	/**
	 * With a single row selected the shared panel builds the actions of that row instead of the group
	 * ones. The bulk actions of this grid are group actions and belong to a selection of any size, so
	 * the handler is replaced on the instance - the same way the panel expects its click handler to be.
	 *
	 * Mirrors ui.actionpanel -> BX.UI.ActionPanel.prototype.handleGridSelectItem: keep both in step.
	 */
	#adoptUiActionPanel(panel: Object): void
	{
		const targetPanel = panel;
		targetPanel.handleGridSelectItem = () => {
			// the panel keeps its grid from Grid::ready, which never arrives for a foreign grid id
			const selectedIds = targetPanel.grid?.getRows?.()?.getSelectedIds?.();
			if (targetPanel.showTotalSelectedBlock && Type.isArray(selectedIds))
			{
				targetPanel.setTotalSelectedItems(selectedIds.length);
			}

			targetPanel.buildPanelByGroup();
		};
	}

	destroy(): void
	{
		EventEmitter.unsubscribe('BX.UI.ActionPanel:created', this.#onUiActionPanelCreated);

		if (!this.#subscribed)
		{
			return;
		}

		EventEmitter.unsubscribe('Grid::updated', this.#onGridUpdated);
		GRID_SELECTION_EVENTS.forEach((eventName) => {
			EventEmitter.unsubscribe(eventName, this.#onGridSelectionChanged);
		});
		Event.unbind(window, 'unload', this.#onWindowUnload);
		this.#subscribed = false;
	}

	apply(actionType: BulkAction): void
	{
		const memberIds = this.getSelectedMemberIds();
		if (
			this.#disabled
			|| !Object.values(BulkActionType).includes(actionType)
			|| !this.#availableActions.includes(actionType)
			|| memberIds.length === 0
		)
		{
			return;
		}

		this.#onApply?.({
			actionType,
			memberIds: [...memberIds],
			trigger: document.getElementById(this.#getControlId(actionType)),
		});
	}

	refresh(): void
	{
		this.#availableActions = this.#getAvailableActions(this.getSelectedMemberIds());
		this.#render();
	}

	reset(): void
	{
		this.#availableActions = [];
		this.#render();
	}

	setDisabled(disabled: boolean): void
	{
		this.#disabled = disabled;
		this.#render();
	}

	getSelectedMemberIds(): number[]
	{
		const grid = this.#getGrid();
		if (!Type.isObject(grid))
		{
			return [];
		}

		return grid.getRows().getSelectedIds()
			.map((id) => Number(id))
			.filter((id) => Number.isInteger(id) && id > 0)
		;
	}

	getAvailableActions(): BulkAction[]
	{
		return [...this.#availableActions];
	}

	#isOwnGridEvent(event): boolean
	{
		const [eventGrid] = event?.getCompatData?.() ?? [];
		if (!Type.isObject(eventGrid))
		{
			return false;
		}

		return eventGrid === this.#getGrid()
			|| (Type.isFunction(eventGrid.getId) && eventGrid.getId() === this.#gridId)
		;
	}

	#getGrid(): ?Grid
	{
		return BX.Main.gridManager?.getInstanceById(this.#gridId)
			?? BX.Main.gridManager?.getById(this.#gridId)?.instance
			?? null
		;
	}

	#getAvailableActions(memberIds: number[]): BulkAction[]
	{
		if (memberIds.length === 0)
		{
			return [];
		}

		const grid = this.#getGrid();
		if (!Type.isObject(grid))
		{
			return [];
		}

		let intersection = null;
		for (const memberId of memberIds)
		{
			const row = grid.getContainer().querySelector(`.main-grid-row[data-id="${memberId}"]`);
			const actions = (row?.dataset.bulkActions ?? '')
				.split(',')
				.filter((action) => Object.values(BulkActionType).includes(action))
			;

			intersection = intersection === null
				? actions
				: intersection.filter((action) => actions.includes(action))
			;
		}

		return intersection ?? [];
	}

	#render(): void
	{
		Object.values(BulkActionType).forEach((actionType) => {
			const controlId = this.#getControlId(actionType);
			const control = document.getElementById(controlId);
			if (control === null)
			{
				return;
			}

			this.#prepareControl(control, controlId);
			this.#setControlEnabled(
				control,
				!this.#disabled && this.#availableActions.includes(actionType),
				this.#getDisabledHint(actionType),
			);
		});
	}

	/**
	 * The hint explains the selection, so it belongs only to a button held back by what the user picked.
	 * While the whole panel waits for a running bulk process, the block means something else entirely.
	 */
	#getDisabledHint(actionType: BulkAction): string
	{
		if (this.#disabled || this.#availableActions.includes(actionType))
		{
			return '';
		}

		return this.#labels.disabledHint?.[actionType] ?? '';
	}

	#prepareControl(control: HTMLElement, testId: string): void
	{
		const targetControl = control;
		targetControl.dataset.testid = testId;
		targetControl.setAttribute('role', 'button');
		targetControl.setAttribute('tabindex', '0');
		Dom.addClass(targetControl, 'sign-my-documents-bulk-action-control');

		const panel = targetControl.closest('.ui-action-panel');
		if (panel !== null)
		{
			panel.dataset.testid = 'sign-my-documents-bulk-action-panel';
		}

		if (this.#boundControls.has(targetControl))
		{
			return;
		}

		Event.bind(targetControl, 'click', (event) => {
			if (targetControl.getAttribute('aria-disabled') === 'true')
			{
				event.preventDefault();
				event.stopImmediatePropagation();
			}
		}, true);
		Event.bind(targetControl, 'keydown', (event) => {
			if (event.key !== 'Enter' && event.key !== ' ')
			{
				return;
			}

			event.preventDefault();
			if (targetControl.getAttribute('aria-disabled') !== 'true')
			{
				(document.getElementById(`${targetControl.id}_control`) ?? targetControl).click();
			}
		});
		this.#boundControls.add(targetControl);
	}

	#setControlEnabled(control: HTMLElement, enabled: boolean, disabledHint: string = ''): void
	{
		this.#actionPanel.toggleActionButton(control.id, enabled, disabledHint);
		// the shared panel writes the title only when a button first becomes disabled, while the reason
		// can change under a button that stays disabled: a running process replaces the selection hint
		Dom.attr(control, 'title', enabled ? '' : disabledHint);
		control.setAttribute('aria-disabled', enabled ? 'false' : 'true');
		this.#setControlReason(control, enabled ? '' : disabledHint);
	}

	/**
	 * The title of an element with role="button" and text of its own is left out of the accessible name,
	 * so a screen reader would never say why the button is blocked. Without a reason the name goes back
	 * to the text of the button, which the shared panel may have rebuilt in the meantime.
	 */
	#setControlReason(control: HTMLElement, reason: string): void
	{
		const targetControl = control;
		if (reason === '')
		{
			targetControl.removeAttribute('aria-label');

			return;
		}

		const text = (targetControl.textContent ?? '').replaceAll(/\s+/g, ' ').trim();
		targetControl.setAttribute('aria-label', text === '' ? reason : `${text}. ${reason}`);
	}

	#getControlId(actionType: BulkAction): string
	{
		return actionType === BulkActionType.approve ? APPROVE_CONTROL_ID : REJECT_CONTROL_ID;
	}

	#prepareRowCheckboxes(): void
	{
		const grid = this.#getGrid();
		if (!Type.isObject(grid))
		{
			return;
		}

		grid.getContainer().querySelectorAll('.main-grid-row input[type="checkbox"]').forEach((checkbox) => {
			const rowCheckbox = checkbox;
			const row = rowCheckbox.closest('.main-grid-row');
			const memberId = Number(row?.dataset.id);
			if (Number.isInteger(memberId) && memberId > 0)
			{
				rowCheckbox.dataset.testid = `sign-my-documents-row-checkbox-${memberId}`;
			}
		});
	}
}
