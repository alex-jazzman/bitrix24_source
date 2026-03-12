import { Event, Tag } from 'main.core';
import { EventEmitter, type BaseEvent } from 'main.core.events';

import { TaskCard } from 'tasks.v2.application.task-card';
import { Core } from 'tasks.v2.core';
import { Model, EntitySelectorEntity, EventName, Analytics } from 'tasks.v2.const';
import { EntitySelectorDialog, type Item, type ItemId } from 'tasks.v2.lib.entity-selector-dialog';
import { relationError } from 'tasks.v2.lib.relation-error';
import { idUtils, type TaskId } from 'tasks.v2.lib.id-utils';
import { taskService } from 'tasks.v2.provider.service.task-service';
import type { TaskModel } from 'tasks.v2.model.tasks';

import type { RelationDialogMeta } from './types';

type Params = {
	targetNode: HTMLElement,
	targetContainer: HTMLElement,
	taskId: TaskId,
	ids: number[],
	onClose: Function,
	onUpdate: Function,
	analytics: Object,
};

export class RelationTasksDialog
{
	#dialogs: { [taskId: TaskId]: EntitySelectorDialog } = {};
	#meta: RelationDialogMeta;

	#taskId: TaskId;
	#ids: number[];
	#onClose: Function | null;
	#onUpdate: Function | null;
	#analytics: Object | null;

	constructor(meta: RelationDialogMeta)
	{
		this.#meta = meta;

		EventEmitter.subscribe(EventName.TaskAdded, (event: BaseEvent) => {
			const task: TaskModel = event.getData().task;

			this.#addTaskItems([task.id]);
		});

		EventEmitter.subscribe(EventName.TaskDeleted, (event: BaseEvent) => {
			const task: TaskModel = event.getData();

			this.#deleteTaskItems([task.id]);
		});
	}

	show(params: Params): void
	{
		this.#ids = params.ids;
		this.#taskId = params.taskId;
		this.#onClose = params.onClose;
		this.#onUpdate = params.onUpdate;
		this.#analytics = params.analytics;

		if (!this.#ids && !this.#meta.service.areIdsLoaded(this.#taskId))
		{
			return;
		}

		if (!this.#ids && this.dialog.isLoaded())
		{
			this.#addTaskItems(this.#task[this.#meta.idsField]);
			this.dialog.setSelectableByIds(this.#selectableItems);
		}

		this.dialog.selectItemsByIds(this.#items);
		this.dialog.getPopup().setTargetContainer(params.targetContainer);
		this.dialog.showTo(params.targetNode);
	}

	get dialog(): EntitySelectorDialog
	{
		this.#dialogs[this.#taskId] ??= this.#createDialog();

		return this.#dialogs[this.#taskId];
	}

	#createDialog(): EntitySelectorDialog
	{
		return new EntitySelectorDialog({
			context: 'tasks-card',
			multiple: !this.#ids,
			enableSearch: true,
			width: 500,
			entities: [
				{
					id: this.#entityId,
					options: {
						withFooter: false,
					},
				},
			],
			preselectedItems: this.#items,
			events: {
				onLoad: (): void => {
					const titles = this.dialog.getItems().map((item: Item): TaskModel => ({
						id: this.#isTemplate ? idUtils.boxTemplate(item.getId()) : item.getId(),
						title: item.getTitle().replace(new RegExp(`\\[${item.getId()}\\]$`), ''),
					}));

					void Core.getStore().dispatch(`${Model.Tasks}/setTitles`, titles);
				},
			},
			popupOptions: {
				events: {
					onClose: (): void => {
						this.#onClose?.(this.dialog.getSelectedItems());
						if (this.dialog.isLoaded() && !this.#ids)
						{
							void this.#updateTask();
						}
					},
				},
			},
			footer: this.#isTemplate ? null : this.#createFooter(),
		});
	}

	#createFooter(): ?HTMLElement
	{
		const footer = Tag.render`
			<span class="ui-selector-footer-link ui-selector-footer-link-add">${this.#meta.footerText}</span>
		`;

		Event.bind(footer, 'click', this.#clickCreate.bind(this));

		return footer;
	}

	#clickCreate(): void
	{
		TaskCard.showCompactCard({
			title: this.dialog.getTagSelector()?.getTextBoxValue(),
			groupId: this.#task.groupId,
			[this.#meta.relationToField]: this.#taskId,
			analytics: {
				context: this.#analytics?.context ?? Analytics.Section.Tasks,
				additionalContext: Analytics.SubSection.TaskCard,
				element: Analytics.Element.CreateButton,
			},
		});

		this.dialog.clearSearch();
		this.dialog.freeze();

		const unfreeze = () => {
			this.dialog.unfreeze();
			EventEmitter.unsubscribe(EventName.CardClosed, unfreeze);
			EventEmitter.unsubscribe(EventName.FullCardClosed, unfreeze);

			if (this.#ids)
			{
				this.dialog.hide();
			}
		};

		EventEmitter.subscribe(EventName.CardClosed, unfreeze);
		EventEmitter.subscribe(EventName.FullCardClosed, unfreeze);
	}

	#addTaskItems(ids: number[]): void
	{
		if (!this.dialog || this.#isTemplate)
		{
			return;
		}

		const itemIds = new Set(this.dialog.getItems().map((it) => it.getId()));
		ids.filter((id) => !itemIds.has(id)).forEach((id: number) => {
			const task = taskService.getStoreTask(id);
			this.dialog.addItem({
				id,
				entityId: EntitySelectorEntity.Task,
				title: task.title,
				selected: true,
				sort: 0,
				tabs: ['recents'],
			});
		});
	}

	#deleteTaskItems(ids: number[]): void
	{
		if (!this.dialog || this.#isTemplate)
		{
			return;
		}

		ids.forEach((id: number) => this.dialog.removeItem([EntitySelectorEntity.Task, id]));
	}

	async #updateTask(): Promise<void>
	{
		const currentTaskIds = this.#task[this.#meta.idsField];
		const newTaskIds = this.dialog.getSelectedItems().map((item) => {
			return this.#isTemplate ? idUtils.boxTemplate(item.getId()) : item.getId();
		});

		const idsToDelete = currentTaskIds.filter((id) => !newTaskIds.includes(id));
		const idsToAdd = newTaskIds.filter((id) => !currentTaskIds.includes(id));

		if (idsToDelete.length > 0 || idsToAdd.length > 0)
		{
			await Promise.all([
				this.#meta.service.delete(this.#taskId, idsToDelete),
				this.#add(idsToAdd),
			]);

			this.#onUpdate?.();
		}
	}

	async #add(ids: number[]): Promise<void>
	{
		const error = await this.#meta.service.add(this.#taskId, ids);

		if (error)
		{
			void relationError.setTaskId(this.#taskId).showError(error, this.#meta.id);
		}
	}

	get #selectableItems(): { selectable: ItemId[], unselectable: ItemId[] }
	{
		const selectableIds = [];
		const unselectableIds = [];

		this.#task[this.#meta.idsField].forEach((id: number) => {
			const task = taskService.getStoreTask(id);
			if (!task || task.rights.detachParent || task.rights.detachRelated)
			{
				selectableIds.push(id);
			}
			else
			{
				unselectableIds.push(id);
			}
		});

		return {
			selectable: this.#mapIdsToItemIds(selectableIds),
			unselectable: this.#mapIdsToItemIds(unselectableIds),
		};
	}

	get #items(): ItemId[]
	{
		return this.#mapIdsToItemIds(this.#ids ?? this.#task?.[this.#meta.idsField] ?? []);
	}

	#mapIdsToItemIds(ids: number[]): ItemId[]
	{
		return ids.map((id: number) => [this.#entityId, idUtils.unbox(id)]);
	}

	get #entityId(): string
	{
		return this.#isTemplate ? EntitySelectorEntity.Template : EntitySelectorEntity.Task;
	}

	get #isTemplate(): boolean
	{
		return this.#meta.isTemplate && idUtils.isTemplate(this.#taskId);
	}

	get #task(): TaskModel
	{
		return taskService.getStoreTask(this.#taskId);
	}
}
