import { Extension } from 'main.core';

import { Core } from 'tasks.v2.core';
import { EntitySelectorEntity, Model } from 'tasks.v2.const';
import { idUtils, type TaskId } from 'tasks.v2.lib.id-utils';
import { CrmMappers } from 'tasks.v2.provider.service.crm-service';
import { taskService } from 'tasks.v2.provider.service.task-service';
import { EntitySelectorDialog, type Item, type ItemId } from 'tasks.v2.lib.entity-selector-dialog';
import type { CrmItemModel } from 'tasks.v2.model.crm-items';

type Params = {
	targetNode: HTMLElement,
	taskId: TaskId,
	onClose: Function,
};

const dialogs: { [taskId: TaskId]: EntitySelectorDialog } = {};

export const crmDialog = new class
{
	#taskId: TaskId;
	#onClose: Function | null;

	fillDialog(taskId: TaskId): void
	{
		this.#taskId = taskId;

		this.#fillDialog(this.#ids);
	}

	show(params: Params): void
	{
		this.#taskId = params.taskId;
		this.#onClose = params.onClose;

		this.#fillDialog(this.#ids);
		this.#dialog.selectItemsByIds(this.#items);
		this.#dialog.showTo(params.targetNode);
	}

	get #dialog(): EntitySelectorDialog
	{
		dialogs[this.#taskId] ??= this.#createDialog();

		return dialogs[this.#taskId];
	}

	#createDialog(): EntitySelectorDialog
	{
		const { crmIntegration } = Extension.getSettings('tasks.v2.component.fields.crm');
		const settings = idUtils.isTemplate(this.#taskId) ? crmIntegration?.template : crmIntegration?.task;

		const dynamicTypeIds = Object.entries(settings ?? {})
			.filter(([entityId, enabled]) => enabled === 'Y' && entityId.startsWith('DYNAMIC_'))
			.map(([entityId]) => Number(entityId.slice(8)))
		;

		return new EntitySelectorDialog({
			context: 'tasks-card',
			enableSearch: true,
			entities: [
				EntitySelectorEntity.Deal,
				EntitySelectorEntity.Contact,
				EntitySelectorEntity.Company,
				EntitySelectorEntity.Lead,
				EntitySelectorEntity.SmartInvoice,
				EntitySelectorEntity.DynamicMultiple,
			].map((entityId: string) => ({
				id: entityId,
				dynamicLoad: true,
				dynamicSearch: true,
				options: {
					dynamicTypeIds,
					showTab: true,
					allowAllCategories: true,
				},
				dynamicSearchMatchMode: 'all',
			})),
			preselectedItems: this.#items,
			events: {
				onLoad: this.#fillStore,
			},
			popupOptions: {
				events: {
					onClose: async (): Promise<void> => {
						if (!this.#dialog.isLoaded())
						{
							return;
						}

						const items = await this.#fillStore();

						const crmItemIds = items.map(({ id }) => id);
						void taskService.update(this.#taskId, { crmItemIds });

						this.#onClose?.();
					},
				},
			},
		});
	}

	#fillStore = async (): Promise<CrmItemModel[]> => {
		const crmItems = this.#dialog.getSelectedItems().map((item: Item) => this.#mapItemToModel(item));

		await Core.getStore().dispatch(`${Model.CrmItems}/upsertMany`, crmItems);

		return crmItems;
	};

	#fillDialog(ids: string[]): void
	{
		if (!this.#dialog.isLoaded())
		{
			return;
		}

		const itemIds = new Set(this.#dialog.getItems().map((it) => CrmMappers.mapId(it.getEntityId(), it.getId())));
		ids.forEach((crmItemId: number) => {
			const [entityId, id] = CrmMappers.splitId(crmItemId);

			if (itemIds.has(crmItemId))
			{
				this.#dialog.getItem([entityId, id]).select(true);

				return;
			}

			const crmItem: CrmItemModel = Core.getStore().getters[`${Model.CrmItems}/getById`](crmItemId);

			this.#dialog.addItem({
				id,
				entityId,
				title: crmItem.title,
				customData: {
					entityInfo: {
						typeNameTitle: crmItem.typeName,
						url: crmItem.link,
					},
				},
				selected: true,
				tabs: ['recents', entityId, entityId.toUpperCase()],
			});
		});
	}

	#mapItemToModel(item: Item): CrmItemModel
	{
		const entityInfo = item.getCustomData().get('entityInfo');
		const id = item.getId();

		return {
			id: CrmMappers.mapId(item.getEntityId(), item.getId()),
			entityId: Number.isInteger(id) ? id : Number(id.split(':')[1]),
			type: item.getEntityId(),
			typeName: entityInfo.typeNameTitle,
			title: item.getTitle(),
			link: entityInfo.url,
		};
	}

	get #items(): ItemId[]
	{
		return this.#ids.map((id) => CrmMappers.splitId(id));
	}

	get #ids(): string[]
	{
		return taskService.getStoreTask(this.#taskId).crmItemIds ?? [];
	}
}();
