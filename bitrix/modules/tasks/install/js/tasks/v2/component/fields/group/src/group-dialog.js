import { Notifier } from 'ui.notification-manager';

import { Core } from 'tasks.v2.core';
import { EntitySelectorEntity, Model, Endpoint } from 'tasks.v2.const';
import { EntitySelectorDialog, type ItemId } from 'tasks.v2.lib.entity-selector-dialog';
import { taskService } from 'tasks.v2.provider.service.task-service';
import { groupService } from 'tasks.v2.provider.service.group-service';

type Params = {
	targetNode: HTMLElement,
	taskId: number | string,
	onClose: Function,
};

export const groupDialog = new class
{
	#dialog: EntitySelectorDialog;
	#taskId: number | string;
	#onClose: Function | null;

	show(params: Params): void
	{
		this.#taskId = params.taskId;
		this.#onClose = params.onClose;

		this.#dialog ??= this.#createDialog();
		this.#dialog.selectItemsByIds(this.#items);
		this.#dialog.showTo(params.targetNode);
	}

	#createDialog(): EntitySelectorDialog
	{
		return new EntitySelectorDialog({
			context: 'tasks-card',
			multiple: false,
			hideOnDeselect: true,
			enableSearch: true,
			entities: [
				{
					id: EntitySelectorEntity.Project,
				},
			],
			preselectedItems: this.#items,
			events: {
				onLoad: this.#fillStore,
			},
			popupOptions: {
				events: {
					onClose: this.#handleGroupSelect,
				},
			},
		});
	}

	#handleGroupSelect = async (): Promise<void> => {
		if (!this.#dialog.isLoaded())
		{
			return;
		}

		const groupId = await this.#fillStore();

		if (this.#groupId === groupId)
		{
			return;
		}

		groupService.setHasScrumInfo(this.#taskId);

		this.#onClose?.(groupId);

		taskService.setSilentErrorMode(true);

		const result = await taskService.update(this.#taskId, { groupId, stageId: 0 });

		taskService.setSilentErrorMode(false);

		if (result[Endpoint.TaskUpdate]?.length)
		{
			const error = result[Endpoint.TaskUpdate][0];

			Notifier.notifyViaBrowserProvider({
				id: 'task-notify-update-group-error',
				text: error?.message,
			});
		}
	};

	#fillStore = async (): Promise<number> => {
		const item = this.#dialog.getSelectedItems()[0];
		if (!item)
		{
			return 0;
		}

		const group = {
			id: item.getId(),
			name: item.getTitle(),
			image: item.getAvatar(),
			type: item.getEntityType(),
		};

		await Core.getStore().dispatch(`${Model.Groups}/insert`, group);

		return group.id;
	};

	get #items(): ItemId[]
	{
		return this.#groupId ? [[EntitySelectorEntity.Project, this.#groupId]] : [];
	}

	get #groupId(): ?number
	{
		return taskService.getStoreTask(this.#taskId).groupId;
	}
}();
