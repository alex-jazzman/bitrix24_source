import { Runtime } from 'main.core';

import { EntitySelectorEntity, TaskField } from 'tasks.v2.const';
import { EntitySelectorDialog, type ItemId } from 'tasks.v2.lib.entity-selector-dialog';
import { relationError } from 'tasks.v2.lib.relation-error';
import { idUtils, type TaskId } from 'tasks.v2.lib.id-utils';
import { subTasksService } from 'tasks.v2.provider.service.relation-service';
import { taskService } from 'tasks.v2.provider.service.task-service';

type Params = {
	targetNode: HTMLElement,
	taskId: TaskId,
	onUpdate: Function,
};

const dialogs: { [isTemplate: boolean]: EntitySelectorDialog } = {};

export const parentTaskDialog = new class
{
	#taskId: TaskId;
	#onUpdate: Function;

	show(params: Params): void
	{
		this.#taskId = params.taskId;
		this.#onUpdate = params.onClose;

		this.#dialog.selectItemsByIds(this.#items);
		this.#dialog.showTo(params.targetNode);
	}

	get #dialog(): EntitySelectorDialog
	{
		const isTemplate = idUtils.isTemplate(this.#taskId);
		dialogs[isTemplate] ??= this.#createDialog(isTemplate);

		return dialogs[isTemplate];
	}

	#createDialog(isTemplate: boolean): EntitySelectorDialog
	{
		const onItemChange = Runtime.debounce(this.#onItemChange, 10, this);

		return new EntitySelectorDialog({
			context: 'tasks-card',
			multiple: false,
			hideOnDeselect: true,
			enableSearch: true,
			width: 500,
			entities: [
				{
					id: EntitySelectorEntity.Task,
					options: {
						withTab: true,
					},
				},
				isTemplate && {
					id: EntitySelectorEntity.Template,
					options: {
						withTab: true,
						withFooter: false,
					},
				},
			].filter((it) => it),
			preselectedItems: this.#items,
			events: {
				'Item:onSelect': onItemChange,
				'Item:onDeselect': onItemChange,
			},
		});
	}

	async #onItemChange(): void
	{
		const item = this.#dialog.getSelectedItems()[0];
		const isTemplate = item?.getEntityId() === EntitySelectorEntity.Template;
		const selectedTaskId = isTemplate ? idUtils.boxTemplate(item.getId()) : (item?.getId() ?? 0);

		const error = await subTasksService.setParent(this.#taskId, selectedTaskId);

		if (error)
		{
			void relationError.setTaskId(this.#taskId).showError(error, TaskField.Parent);

			return;
		}

		this.#onUpdate?.();
	}

	get #items(): ItemId[]
	{
		const parentId = taskService.getStoreTask(this.#taskId).parentId;
		const templateId = idUtils.unbox(parentId);
		const isTemplate = idUtils.isTemplate(parentId);
		const itemId = isTemplate ? [EntitySelectorEntity.Template, templateId] : [EntitySelectorEntity.Task, parentId];

		return parentId ? [itemId] : [];
	}
}();
