import { Core } from 'tasks.v2.core';
import { EntitySelectorEntity, Model } from 'tasks.v2.const';
import { EntitySelectorDialog, type ItemId } from 'tasks.v2.lib.entity-selector-dialog';
import { taskService } from 'tasks.v2.provider.service.task-service';

type Params = {
	targetNode: HTMLElement,
	taskId: number | string,
};

const dialogs: { [groupId: number]: EntitySelectorDialog } = {};

export const epicDialog = new class
{
	#taskId: number | string;

	show(params: Params): void
	{
		this.#taskId = params.taskId;

		this.#dialog.selectItemsByIds(this.#items);
		this.#dialog.showTo(params.targetNode);
	}

	get #dialog(): EntitySelectorDialog
	{
		const groupId = taskService.getStoreTask(this.#taskId).groupId;

		dialogs[groupId] ??= this.#createDialog(groupId);

		return dialogs[groupId];
	}

	#createDialog(groupId: number): EntitySelectorDialog
	{
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
			preselectedItems: this.#items,
			events: {
				onLoad: this.#fillStore,
			},
			popupOptions: {
				events: {
					onClose: this.#handleEpicSelect,
				},
			},
		});
	}

	#handleEpicSelect = async (): Promise<void> => {
		if (!this.#dialog.isLoaded())
		{
			return;
		}

		const epicId = await this.#fillStore();

		await taskService.update(this.#taskId, { epicId });
	};

	#fillStore = async (): Promise<number> => {
		const item = this.#dialog.getSelectedItems()[0];
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

	get #items(): ItemId[]
	{
		const epicId = taskService.getStoreTask(this.#taskId).epicId;

		return epicId ? [[EntitySelectorEntity.Epic, epicId]] : [];
	}
}();
