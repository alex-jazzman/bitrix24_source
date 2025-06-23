import { Runtime } from 'main.core';
import { EntitySelectorDialog, type ItemId } from 'tasks.v2.lib.entity-selector-dialog';
import { Core } from 'tasks.v2.core';
import { EntitySelectorEntity, Model } from 'tasks.v2.const';
import { taskService } from 'tasks.v2.provider.service.task-service';
import type { TaskModel } from 'tasks.v2.model.tasks';

class GroupDialog
{
	#taskId: number | string;
	#dialog: EntitySelectorDialog;
	#onUpdateOnce: Function | null = null;
	#onUpdate: Function | null = null;
	#onHide: Function | null = null;

	setTaskId(taskId: number | string): GroupDialog
	{
		this.#taskId = taskId;

		return this;
	}

	async init(): void
	{
		this.#dialog ??= this.#createDialog();
	}

	showTo(targetNode: HTMLElement): void
	{
		this.init();
		this.#dialog.selectItemsByIds(this.#items);
		this.#dialog.showTo(targetNode);
	}

	onUpdateOnce(callback: Function): void
	{
		this.#onUpdateOnce = callback;
	}

	onUpdate(callback: Function): void
	{
		this.#onUpdate = callback;
	}

	onHide(callback: Function): void
	{
		this.#onHide = callback;
	}

	#createDialog(): EntitySelectorDialog
	{
		const handleItemChangeDebounced = Runtime.debounce(this.#handleItemChange, 10, this);

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
				'Item:onSelect': handleItemChangeDebounced,
				'Item:onDeselect': handleItemChangeDebounced,
				onHide: () => {
					this.#onHide();
					this.#clearOnUpdateOnce();
				},
				onDestroy: this.#clearOnUpdateOnce,
				onLoad: async () => {
					this.#upsertGroup();
				},
			},
		});
	}

	async #upsertGroup(): void
	{
		const item = this.#dialog.getSelectedItems()[0];
		if (item)
		{
			// Insert group into Vuex and wait for it to complete
			await Core.getStore().dispatch(`${Model.Groups}/insert`, {
				id: item.getId(),
				name: item.getTitle(),
				image: item.getAvatar(),
				type: item.getEntityType(),
			});
		}

		this.#updateGroup(item?.getId());
	}

	#handleItemChange(): void
	{
		this.#upsertGroup();
		this.#onUpdate();
	}

	get #items(): ItemId[]
	{
		return [[EntitySelectorEntity.Project, this.#task.groupId]];
	}

	get #task(): TaskModel
	{
		return Core.getStore().getters[`${Model.Tasks}/getById`](this.#taskId);
	}

	#updateGroup(groupId: number): void
	{
		void taskService.update(
			this.#taskId,
			{
				groupId,
				stageId: 0,
			},
		);

		this.#onUpdateOnce?.();
		this.#clearOnUpdateOnce();
	}

	#clearOnUpdateOnce = (): void => {
		this.#onUpdateOnce = null;
	};
}

export const groupDialog = new GroupDialog();
