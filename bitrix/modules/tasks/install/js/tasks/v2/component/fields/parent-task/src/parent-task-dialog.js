import { Dom, Runtime } from 'main.core';

import { EntitySelectorEntity, TaskField } from 'tasks.v2.const';
import { EntitySelectorDialog, type ItemId } from 'tasks.v2.lib.entity-selector-dialog';
import { relationError } from 'tasks.v2.lib.relation-error';
import { idUtils, type TaskId } from 'tasks.v2.lib.id-utils';
import { subTasksService } from 'tasks.v2.provider.service.relation-service';
import { taskService } from 'tasks.v2.provider.service.task-service';

type Params = {
	targetNode: HTMLElement,
	taskId: TaskId,
	withTemplates: boolean,
	onUpdate: Function,
};

const dialogs: { [taskId: TaskId]: EntitySelectorDialog } = {};

export const parentTaskDialog = new class
{
	#taskId: TaskId;
	#withTemplates: boolean;
	#onUpdate: Function;
	#templateEntity: Object;

	show(params: Params): void
	{
		this.#taskId = params.taskId;
		this.#withTemplates = params.withTemplates ?? true;
		this.#onUpdate = params.onClose;

		this.#dialog.selectItemsByIds(this.#items);
		this.#dialog.showTo(params.targetNode);

		this.#updateTemplatesVisibility();
	}

	get #dialog(): EntitySelectorDialog
	{
		dialogs[this.#taskId] ??= this.#createDialog();

		return dialogs[this.#taskId];
	}

	#createDialog(): EntitySelectorDialog
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
				this.#isTemplate && {
					id: EntitySelectorEntity.Template,
					options: {
						withTab: true,
						withFooter: false,
					},
				},
			].filter((it) => it),
			preselectedItems: this.#items,
			events: {
				onLoad: this.#updateTemplatesVisibility,
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

	#updateTemplatesVisibility = (): void => {
		if (!this.#isTemplate || !this.#dialog.isLoaded())
		{
			return;
		}

		if (!this.#withTemplates)
		{
			if (this.#templateEntity)
			{
				return;
			}

			const items = this.#dialog.getEntityItems(EntitySelectorEntity.Template);
			const tab = this.#dialog.getTab(EntitySelectorEntity.Template);

			this.#templateEntity = { items, tab };

			items.forEach((it) => it.setHidden(true));

			Dom.addClass(tab.getLabelContainer(), 'ui-selector-tab-label-hidden');
			if (tab.isSelected())
			{
				this.#dialog.selectFirstTab();
			}
		}
		else if (this.#templateEntity)
		{
			const { items, tab } = this.#templateEntity;

			items.forEach((it) => it.setHidden(false));

			Dom.removeClass(tab.getLabelContainer(), 'ui-selector-tab-label-hidden');

			this.#templateEntity = null;
		}
	};

	get #items(): ItemId[]
	{
		const parentId = taskService.getStoreTask(this.#taskId).parentId;
		const templateId = idUtils.unbox(parentId);
		const isTemplate = idUtils.isTemplate(parentId);
		const itemId = isTemplate ? [EntitySelectorEntity.Template, templateId] : [EntitySelectorEntity.Task, parentId];

		return parentId ? [itemId] : [];
	}

	get #isTemplate(): boolean
	{
		return idUtils.isTemplate(this.#taskId);
	}
}();
