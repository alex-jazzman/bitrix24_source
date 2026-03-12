import type { Store } from 'ui.vue3.vuex';
import { Type } from 'main.core';

import { Core } from 'tasks.v2.core';
import { Model } from 'tasks.v2.const';
import { usersDialog } from 'tasks.v2.lib.user-selector-dialog';
import { taskService } from 'tasks.v2.provider.service.task-service';

import type { EntitySelectorDialog } from 'tasks.v2.lib.entity-selector-dialog';
import type { CheckListModel } from 'tasks.v2.model.check-list';
import type { TaskModel } from 'tasks.v2.model.tasks';
import type { UserModel } from 'tasks.v2.model.users';

export type ParticipantType = 'accomplices' | 'auditors';

type ShowParticipantDialogParams = {
	targetNode: HTMLElement;
	type: ParticipantType;
	items: CheckListModel[];
	isMultiple?: boolean;
	withAngle?: boolean;
	enableSearch?: boolean;
	onSelect?: (userId: number) => void;
	onDeselect?: (userId: number) => void;
	onClose?: (userIds: number[]) => void;
};

export class CheckListParticipantService
{
	#taskId: number | string;
	#dialog: ?EntitySelectorDialog;

	constructor(taskId: number | string)
	{
		this.#taskId = taskId;
	}

	showParticipantDialog(params: ShowParticipantDialogParams): void
	{
		if (!params.items?.length)
		{
			console.error('CheckListParticipantService: items cannot be empty');

			return;
		}

		const participants = params.items[0][params.type];

		const selectedUserIds = Type.isArrayFilled(participants)
			? participants.map((user: UserModel): number => user.id)
			: []
		;

		const handleClose = (userIds: number[]): void => {
			void this.#saveParticipants(params.items, params.type, userIds);
			params.onClose?.(userIds);
		};

		void usersDialog.show({
			targetNode: params.targetNode,
			ids: selectedUserIds,
			onSelect: params.onSelect,
			onDeselect: params.onDeselect,
			onClose: handleClose,
			isMultiple: params.isMultiple ?? true,
			withAngle: params.withAngle ?? true,
			enableSearch: params.enableSearch ?? true,
		});

		this.#dialog = usersDialog.getDialog();
	}

	async #saveParticipants(checkListItems: CheckListModel[], type: ParticipantType, userIds: number[]): void
	{
		const users = this.$store.getters[`${Model.Users}/getByIds`](userIds);

		await this.#updateCheckListItems(checkListItems, type, users);
		await this.#mergeTaskParticipants(type, userIds);
	}

	async #updateCheckListItems(
		checkListItems: CheckListModel[],
		type: ParticipantType,
		users: UserModel[],
	): Promise<void>
	{
		if (checkListItems.length > 1)
		{
			const updatedItems = checkListItems.map((item: CheckListModel) => ({
				...item,
				[type]: users,
			}));

			await this.#upsertCheckLists(updatedItems);
		}
		else
		{
			await this.#updateCheckList(checkListItems[0].id, { [type]: users });
		}
	}

	async #mergeTaskParticipants(type: ParticipantType, newUserIds: number[]): Promise<void>
	{
		const task = taskService.getStoreTask(this.#taskId);
		const participantIdsKey = `${type}Ids`;
		const existingUserIds = task[participantIdsKey] || [];
		const mergedUserIds = [...new Set([...existingUserIds, ...newUserIds])];

		await this.#updateTask({ [participantIdsKey]: mergedUserIds });
	}

	updateSearch(searchQuery: string): void
	{
		this.#dialog?.search(searchQuery);
	}

	isDialogOpen(): boolean
	{
		if (!this.#dialog)
		{
			return false;
		}

		return this.#dialog.isOpen();
	}

	closeDialog(): void
	{
		if (!this.#dialog)
		{
			return;
		}

		this.#dialog.hide();
		this.#dialog = null;
	}

	async #updateTask(fields: Partial<TaskModel>): Promise<void>
	{
		return taskService.updateStoreTask(this.#taskId, fields);
	}

	async #updateCheckList(id: number | string, fields: Partial<CheckListModel>): Promise<void>
	{
		return this.$store.dispatch(`${Model.CheckList}/update`, { id, fields });
	}

	async #upsertCheckLists(items: CheckListModel[]): Promise<void>
	{
		return this.$store.dispatch(`${Model.CheckList}/upsertMany`, items);
	}

	get $store(): Store
	{
		return Core.getStore();
	}
}
