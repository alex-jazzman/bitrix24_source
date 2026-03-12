import { EventEmitter, type BaseEvent } from 'main.core.events';

import { Footer } from 'tasks.entity-selector';
import { Core } from 'tasks.v2.core';
import { EntitySelectorEntity, EventName } from 'tasks.v2.const';
import { EntitySelectorDialog, type Item, type ItemId } from 'tasks.v2.lib.entity-selector-dialog';
import { idUtils, type TaskId } from 'tasks.v2.lib.id-utils';
import { taskService } from 'tasks.v2.provider.service.task-service';

type Params = {
	targetNode: HTMLElement,
	taskId: TaskId,
	onClose: Function,
};

const dialogs: { [key: string]: EntitySelectorDialog } = {};

export const tagsDialog = new class
{
	#onClose: Function | null;

	constructor()
	{
		EventEmitter.subscribe(EventName.TagDeleted, (event: BaseEvent) => {
			const { tagName, groupId } = event.getData();

			Object.entries(dialogs).forEach(([key, dialog]) => {
				if (Number(key.split('-')[1]) === groupId)
				{
					const tagId = dialog.getItems().find((item: Item) => item.getTitle() === tagName).getId();
					dialog.removeItem([EntitySelectorEntity.Tag, tagId]);
				}
			});
		});
	}

	show(params: Params): void
	{
		this.#onClose = params.onClose;

		this.#fillDialog(params.taskId);
		this.#getDialog(params.taskId).showTo(params.targetNode);
	}

	#getDialog(taskId: TaskId): EntitySelectorDialog
	{
		const userId = Core.getParams().currentUser.id;
		const groupId = taskService.getStoreTask(taskId).groupId ?? 0;

		const key = `${taskId}-${groupId}`;
		const entityId = this.#getEntityId(taskId);
		dialogs[key] ??= new EntitySelectorDialog({
			enableSearch: true,
			dropdownMode: true,
			entities: [
				{
					id: entityId,
					options: { taskId, groupId },
				},
			],
			searchOptions: {
				allowCreateItem: true,
			},
			footer: entityId === EntitySelectorEntity.Tag ? Footer : false,
			footerOptions: { userId, groupId },
			clearUnavailableItems: true,
			events: {
				onLoad: () => this.#fillDialog(taskId),
				'Search:onItemCreateAsync': (event: BaseEvent): void => {
					const tag = event.getData().searchQuery.getQuery();
					if (!taskService.getStoreTask(taskId).tags.includes(tag))
					{
						dialogs[key].addItem(this.#getTagItem(entityId, tag));
					}
				},
			},
			popupOptions: {
				events: {
					onClose: (): void => {
						const tags = this.#getDialog(taskId).getSelectedItems().map((item: Item) => item.getTitle());

						void taskService.update(taskId, { tags });

						this.#onClose?.(tags);
					},
				},
			},
		});

		return dialogs[key];
	}

	#fillDialog(taskId: TaskId): void
	{
		const dialog = this.#getDialog(taskId);
		const entityId = this.#getEntityId(taskId);
		const tags: Set<string> = new Set(taskService.getStoreTask(taskId).tags);

		const idsMap: Map<string, ItemId> = new Map([...tags].map((tag) => [tag, [entityId, tag]]));
		dialog.getItems().forEach((item: Item) => {
			if (tags.has(item.getTitle()))
			{
				idsMap.set(item.getTitle(), [entityId, item.getId()]);
			}
		});

		idsMap.entries().forEach(([tag, id]) => {
			if (!dialog.getItem(id))
			{
				dialog.addItem(this.#getTagItem(entityId, tag));
			}
		});

		dialog.selectItemsByIds([...idsMap.values()]);
	}

	#getTagItem(entityId: string, title: string): Item
	{
		return {
			id: title || 'empty',
			entityId,
			title,
			tabs: 'all',
			selected: true,
		};
	}

	#getEntityId(taskId: TaskId): string
	{
		return idUtils.isTemplate(taskId) ? EntitySelectorEntity.TemplateTag : EntitySelectorEntity.Tag;
	}
}();
