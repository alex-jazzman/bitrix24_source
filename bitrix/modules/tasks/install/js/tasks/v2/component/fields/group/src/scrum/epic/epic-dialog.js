import { ajax, Loc, Runtime, Text, Type } from 'main.core';
import { type BaseEvent } from 'main.core.events';
import { Notifier } from 'ui.notification-manager';

import { Core } from 'tasks.v2.core';
import { EntitySelectorEntity, Model } from 'tasks.v2.const';
import { EntitySelectorDialog, type ItemId } from 'tasks.v2.lib.entity-selector-dialog';
import { taskService } from 'tasks.v2.provider.service.task-service';

import { EpicCreateFooter } from './epic-create-footer';

type Params = {
	targetNode: HTMLElement,
	taskId: number | string,
	onClose?: Function,
};

type EpicResponse = {
	id: number,
	name: string,
	color: string,
};

type DialogState = {
	taskId: number | string,
	// Id of the operation window currently open for each task the dialog has been shown for. An
	// inline create captures the id of its own task and writes back only while that id is still
	// current. Windows are kept per task, not per group: the dialog instance is shared by every
	// task of the group, so closing it for one task must not cancel a create started for another.
	operations: { [taskId: number | string]: number },
	suppressBindForEpicId: number | string | null,
	onClose: Function | null,
};

const dialogs: { [groupId: number]: EntitySelectorDialog } = {};

// Per-group mutable state kept separate from dialog instances so that
// concurrent show() calls for different tasks never corrupt each other.
const dialogStates: { [groupId: number]: DialogState } = {};

// Monotonic across all groups and tasks, so an id is never reused: a create captured before its
// window ended cannot match the id of a window opened for the same task afterwards.
let lastOperationId = 0;

function getState(groupId: number): DialogState
{
	dialogStates[groupId] ??= { taskId: 0, operations: {}, suppressBindForEpicId: null, onClose: null };

	return dialogStates[groupId];
}

function startOperationWindow(state: DialogState, taskId: number | string): number
{
	lastOperationId += 1;
	const { operations } = state;
	operations[taskId] = lastOperationId;

	return lastOperationId;
}

function endOperationWindow(state: DialogState, taskId: number | string): void
{
	const { operations } = state;
	delete operations[taskId];
}

function isCurrentOperationWindow(state: DialogState, taskId: number | string, operationId: number): boolean
{
	// An ended window leaves no entry, so an undefined lookup must not read as "still current".
	return operationId > 0 && state.operations[taskId] === operationId;
}

// Bound the pending-retry registry. An auto-hidden retry toast never delivers a local 'close'
// event (see the 'close' handler below), so entries would otherwise accumulate for the whole
// singleton lifecycle. Evict the oldest on overflow instead of using a timer, which would fight
// the toast's hover-to-pause auto-hide and could drop a still-visible Retry.
export const MAX_PENDING_RETRIES = 20;

export const epicDialog = new class
{
	#pendingRetries: Map<string, { taskId: number | string, groupId: number, name: string }> = new Map();
	#openingEpicLists: Map<number, number> = new Map();

	constructor()
	{
		// Event/action names are stable constants of ui.notification-manager (not re-exported).
		Notifier.subscribe('action', (event: BaseEvent) => {
			const { id, action } = event.getData();
			if (action !== 'button_1' || !this.#pendingRetries.has(id))
			{
				return;
			}

			const { taskId, groupId, name } = this.#pendingRetries.get(id);
			this.#pendingRetries.delete(id);

			if (!this.#isTaskStillInGroup(taskId, groupId))
			{
				return;
			}

			if (!this.#canUpdateScrumFields(taskId))
			{
				this.#closeDialog(groupId);

				return;
			}

			// A retry click is a fresh explicit intent, so it opens a new operation window for its
			// task rather than reusing the one the failed attempt was captured in.
			// #createEpic re-throws on failure; the error is already surfaced via #notifyServerError,
			// so swallow it here to avoid an unhandled rejection on a repeated retry click.
			const operationId = startOperationWindow(getState(groupId), taskId);

			void this.#createEpic(taskId, groupId, name, operationId).catch(() => {});
		});

		// Drop a pending retry when its toast is closed manually. Auto-hide does not reach here
		// (it only broadcasts 'close' to other tabs, never to us), so the size cap in
		// #notifyServerError is what ultimately keeps the registry bounded.
		Notifier.subscribe('close', (event: BaseEvent) => {
			this.#pendingRetries.delete(event.getData().id);
		});
	}

	show(params: Params): void
	{
		const taskId = params.taskId;
		const groupId = taskService.getStoreTask(taskId).groupId;

		const state = getState(groupId);
		// Every open starts a fresh operation window for its own task, so anything still in flight
		// from a previous open of that task must not write back. Only this task's window is touched:
		// opening for a different task merely re-targets the shared per-group dialog and must not
		// cancel a create already started for another task of the same group.
		startOperationWindow(state, taskId);
		state.taskId = taskId;
		// The focus-return callback lives in the per-group state, not in a singleton field: the dialog
		// is cached per group, so two card fields of different tasks must not overwrite each other's.
		state.onClose = params.onClose ?? null;
		// Clear any stale suppression so a fresh show() cannot inherit a previous create's guard.
		state.suppressBindForEpicId = null;

		// Proactively hide the "create epic" footer when the server would deny creation.
		// The right is stable per (group + user), so reading it at the first (lazy) dialog
		// creation is correct; the dialog is cached per group afterwards.
		const canCreateEpic = taskService.getStoreTask(taskId).canCreateEpic === true;

		dialogs[groupId] ??= this.#createDialog(groupId, canCreateEpic);

		this.#syncCreateAction(groupId, canCreateEpic);

		// The dialog is cached per group and #setFooterError() mutates the footer label in place,
		// so a previous empty-name error would persist into this open. Reset it to the normal label.
		this.#setFooterError(groupId, Loc.getMessage('TASKS_V2_GROUP_EPIC_FOOTER_CREATE'));

		const epicId = taskService.getStoreTask(taskId).epicId;
		const items: ItemId[] = epicId ? [[EntitySelectorEntity.Epic, epicId]] : [];

		// On the first open the dynamic-load dialog has no items yet, so selectItemsByIds()
		// (it iterates getItems()) cannot preselect the bound epic. setPreselectedItems()
		// makes the dialog select it while loading; selectItemsByIds() then keeps reuse opens
		// in sync once items already exist. Without this, opening/closing without changes
		// reads zero selected items and clears the existing binding (epicId: 0).
		dialogs[groupId].setPreselectedItems(items);
		dialogs[groupId].selectItemsByIds(items);
		dialogs[groupId].showTo(params.targetNode);
	}

	syncCreateAvailability(taskId: number | string): void
	{
		const task = taskService.getStoreTask(taskId);
		if (!task)
		{
			return;
		}

		const groupId = task.groupId;
		const dialog = dialogs[groupId];

		if (!dialog || getState(groupId).taskId !== taskId)
		{
			return;
		}

		this.#syncCreateAction(groupId, task.canCreateEpic === true);
	}

	#createDialog(groupId: number, canCreateEpic: boolean): EntitySelectorDialog
	{
		// Preselection is set per-open in show() via setPreselectedItems() because the dialog
		// is created once and reused; computing it here from mutable state would be a stale read.
		const preselectedItems: ItemId[] = [];

		return new EntitySelectorDialog({
			context: 'tasks-card',
			multiple: false,
			hideOnDeselect: true,
			enableSearch: true,
			entities: [
				{
					id: EntitySelectorEntity.Epic,
					options: { groupId },
					dynamicLoad: true,
					dynamicSearch: true,
				},
			],
			searchOptions: {
				allowCreateItem: canCreateEpic,
				footerOptions: {
					label: Loc.getMessage('TASKS_V2_GROUP_EPIC_FOOTER_CREATE'),
				},
			},
			footer: canCreateEpic ? EpicCreateFooter : null,
			footerOptions: this.#getFooterOptions(groupId),
			preselectedItems,
			events: {
				onLoad: () => this.#fillStore(groupId),
				'Search:onItemCreateAsync': (event: BaseEvent) => this.#handleItemCreate(groupId, event),
			},
			popupOptions: {
				events: {
					onClose: () => this.#handleEpicSelect(groupId),
				},
			},
		});
	}

	#handleItemCreate = async (groupId: number, event: BaseEvent): Promise<void> => {
		const name = (event.getData().searchQuery.getQuery() ?? '').trim();

		if (name === '')
		{
			const errorMessage = Loc.getMessage('TASKS_V2_GROUP_EPIC_EMPTY_NAME_ERROR');

			this.#setFooterError(groupId, errorMessage);

			// The footer label is a visual-only change; announce it so screen readers
			// learn why the create failed (WCAG 4.1.3 / 3.3.1). ui.a11y is loaded lazily
			// here so this rare error path does not pull ~60 KB into the card's initial load.
			try
			{
				const { LiveAnnouncer } = await Runtime.loadExtension('ui.a11y');
				LiveAnnouncer.announce(errorMessage, 'assertive');
			}
			catch
			{
				// Announcement is best-effort; a failed extension load must not break the flow.
			}

			// Reject keeps the dialog open and the entered query untouched.
			throw new Error('empty name');
		}

		// Capture taskId synchronously and open the operation window this create owns, so that
		// neither a concurrent show() nor a selection made while the request is in flight can
		// redirect or overwrite the binding. A create started now is current by definition; it
		// stops being current once the dialog is closed or reopened for this same task.
		const state = getState(groupId);
		const taskId = state.taskId;
		if (!this.#canUpdateScrumFields(taskId))
		{
			this.#closeDialog(groupId);

			return;
		}
		const operationId = startOperationWindow(state, taskId);

		await this.#createEpic(taskId, groupId, name, operationId);
	};

	#getFooterOptions(groupId: number): Object
	{
		return {
			manageLabel: Loc.getMessage('TASKS_V2_GROUP_EPIC_FOOTER_MANAGE'),
			hint: Loc.getMessage('TASKS_V2_GROUP_EPIC_FOOTER_HINT'),
			onManageEpic: () => this.#showEpicList(groupId),
		};
	}

	#showEpicList = async (groupId: number): Promise<void> => {
		const state = getState(groupId);
		const taskId = state.taskId;
		const operationId = state.operations[taskId];
		if (this.#openingEpicLists.get(groupId) === operationId)
		{
			return;
		}

		this.#openingEpicLists.set(groupId, operationId);
		try
		{
			let epic = null;
			try
			{
				const { Epic } = await Runtime.loadExtension('tasks.scrum.epic');
				if (!Type.isFunction(Epic))
				{
					throw new TypeError('The tasks.scrum.epic extension does not export Epic');
				}

				if (!isCurrentOperationWindow(state, taskId, operationId) || state.taskId !== taskId)
				{
					return;
				}

				epic = new Epic({ view: 'list', groupId });
			}
			catch
			{
				this.#notifyEpicListError();

				return;
			}

			epic.show();
		}
		finally
		{
			if (this.#openingEpicLists.get(groupId) === operationId)
			{
				this.#openingEpicLists.delete(groupId);
			}
		}
	};

	#notifyEpicListError(): void
	{
		Notifier.notifyViaBrowserProvider({
			id: `tasks-epic-list-error-${Text.getRandom()}`,
			text: Loc.getMessage('TASKS_V2_GROUP_EPIC_LIST_LOAD_ERROR'),
		});
	}

	#createEpic = async (
		taskId: number | string,
		groupId: number,
		name: string,
		operationId: number,
	): Promise<void> => {
		try
		{
			const response = await ajax.runAction('tasks.scrum.epic.createEpic', {
				data: { groupId, name },
			});

			this.#applyCreatedEpic(taskId, groupId, operationId, response.data);
		}
		catch (response)
		{
			this.#notifyServerError(taskId, groupId, name, response);

			throw response;
		}
	};

	// The create action returns code TASKS_EC_02 (Group::ACTION_CREATE_TASKS denied) for
	// read-only roles; ajax.runAction rejects with a plain { errors: [{ code }] } payload.
	#isAccessDenied(response: mixed): boolean
	{
		const errors = response?.errors;

		return Array.isArray(errors) && errors.some((error) => error?.code === 'TASKS_EC_02');
	}

	#applyCreatedEpic(taskId: number | string, groupId: number, operationId: number, data: EpicResponse): void
	{
		const epic = {
			id: data.id,
			title: data.name,
			color: data.color,
		};

		// The epic exists on the server regardless of what the user did meanwhile, so it is always
		// stored and listed. Only the write-back below is dropped for a stale operation window.
		void Core.getStore().dispatch(`${Model.Epics}/insert`, epic);

		const dialog = dialogs[groupId];
		const state = getState(groupId);
		const isCurrentOperation = isCurrentOperationWindow(state, taskId, operationId)
			&& this.#isTaskStillInGroup(taskId, groupId)
		;

		if (dialog)
		{
			dialog.addItem({
				entityId: EntitySelectorEntity.Epic,
				id: epic.id,
				title: epic.title,
				avatarOptions: { bgColor: epic.color },
				// Provider returns its items in the 'recents' tab; place the created epic in the
				// same tab so it stays visible (and rendered) when the dialog is reopened.
				tabs: 'recents',
			});

			if (isCurrentOperation && state.taskId === taskId)
			{
				// The explicit update below already binds the epic; suppress the duplicate bind
				// that onClose would trigger — but only when it is still this same epic.
				// Programmatic selectItemsByIds does not emit onClose, so we key suppression
				// to the epic id rather than relying on "the next close" (which may be a
				// different epic chosen by the user in the same open dialog).
				state.suppressBindForEpicId = epic.id;
				dialog.selectItemsByIds([[EntitySelectorEntity.Epic, epic.id]]);
			}
		}

		if (isCurrentOperation)
		{
			if (!this.#canUpdateScrumFields(taskId))
			{
				this.#closeDialog(groupId);

				return;
			}

			void taskService.update(taskId, { epicId: epic.id });
		}
	}

	#isTaskStillInGroup(taskId: number | string, groupId: number): boolean
	{
		return taskService.getStoreTask(taskId)?.groupId === groupId;
	}

	#syncCreateAction(groupId: number, canCreateEpic: boolean): void
	{
		const dialog = dialogs[groupId];
		const searchTab = dialog.getSearchTab?.();
		if (searchTab && searchTab.canCreateItem?.() !== canCreateEpic)
		{
			searchTab.setAllowCreateItem(canCreateEpic, {
				label: Loc.getMessage('TASKS_V2_GROUP_EPIC_FOOTER_CREATE'),
			});
		}

		const hasCreateFooter = dialog.getFooter() instanceof EpicCreateFooter;
		if (hasCreateFooter !== canCreateEpic)
		{
			dialog.setFooter(canCreateEpic ? EpicCreateFooter : null, this.#getFooterOptions(groupId));
		}
	}

	#setFooterError(groupId: number, message: string): void
	{
		const footer = dialogs[groupId]?.getSearchTab?.()?.getFooter?.();
		footer?.setLabel?.(message);
	}

	#notifyServerError(taskId: number | string, groupId: number, name: string, response: mixed): void
	{
		// An access-denied failure is deterministic: retrying will fail the same way, so show a
		// plain message without a Retry button and without registering a pending retry.
		if (this.#isAccessDenied(response))
		{
			Notifier.notifyViaBrowserProvider({
				id: `tasks-epic-create-error-${Text.getRandom()}`,
				text: Loc.getMessage('TASKS_V2_GROUP_EPIC_CREATE_ACCESS_DENIED'),
			});

			return;
		}

		const id = `tasks-epic-create-error-${Text.getRandom()}`;
		if (this.#pendingRetries.size >= MAX_PENDING_RETRIES)
		{
			this.#pendingRetries.delete(this.#pendingRetries.keys().next().value);
		}
		this.#pendingRetries.set(id, { taskId, groupId, name });

		Notifier.notifyViaBrowserProvider({
			id,
			text: Loc.getMessage('TASKS_V2_GROUP_EPIC_CREATE_SERVER_ERROR'),
			button1Text: Loc.getMessage('TASKS_V2_GROUP_EPIC_CREATE_RETRY'),
		});
	}

	#handleEpicSelect = async (groupId: number): Promise<void> => {
		const dialog = dialogs[groupId];
		const state = getState(groupId);

		// End the operation window of the task the dialog currently targets, synchronously before any
		// await: whatever the user chose on close wins over an inline create still in flight for THAT
		// task. Other tasks of the group keep their own windows, so their pending creates survive.
		endOperationWindow(state, state.taskId);

		// Consume the callback before any early return below: focus has to go back to the field
		// on every close, even when nothing gets bound. Consuming makes it fire exactly once.
		const onClose = state.onClose;
		state.onClose = null;
		onClose?.();

		if (!dialog?.isLoaded())
		{
			// Nothing selectable yet; drop any pending suppression so it cannot leak.
			state.suppressBindForEpicId = null;

			return;
		}

		const suppressedEpicId = state.suppressBindForEpicId;
		state.suppressBindForEpicId = null; // consume once, regardless of outcome

		// Capture the id synchronously before the await so a concurrent show() cannot redirect the bind.
		const taskId = state.taskId;
		if (!this.#isTaskStillInGroup(taskId, groupId))
		{
			return;
		}

		const epicId = await this.#fillStore(groupId);
		if (!this.#isTaskStillInGroup(taskId, groupId))
		{
			return;
		}

		// The inline-created epic was already bound in #applyCreatedEpic; skip the
		// redundant re-bind only when the closing selection is still that same epic.
		// Programmatic selectItemsByIds does not emit onClose, so suppression must be
		// keyed to the epic id and must never rely on "the next close".
		if (suppressedEpicId !== null && suppressedEpicId === epicId)
		{
			return;
		}

		if (!this.#canUpdateScrumFields(taskId))
		{
			this.#closeDialog(groupId);

			return;
		}

		await taskService.update(taskId, { epicId });
	};

	#canUpdateScrumFields(taskId: number | string): boolean
	{
		return typeof taskId !== 'number' || taskService.getStoreTask(taskId)?.canUpdateScrumFields !== false;
	}

	#closeDialog(groupId: number): void
	{
		const dialog = dialogs[groupId];
		if (typeof dialog?.isShown !== 'function' || dialog.isShown())
		{
			dialog.hide();
		}
	}

	#fillStore = async (groupId: number): Promise<number> => {
		const item = dialogs[groupId]?.getSelectedItems()[0];
		if (!item)
		{
			return 0;
		}

		const epic = {
			id: item.getId(),
			title: item.getTitle(),
			color: item.getAvatarOption('bgColor'),
		};

		await Core.getStore().dispatch(`${Model.Epics}/insert`, epic);

		return epic.id;
	};
}();
