import { Extension, Runtime } from 'main.core';

import { Core } from 'tasks.v2.core';
import { EntitySelectorEntity, Model } from 'tasks.v2.const';
import { EntitySelectorDialog, type ItemId } from 'tasks.v2.lib.entity-selector-dialog';
import { groupService } from 'tasks.v2.provider.service.group-service';
import { taskService } from 'tasks.v2.provider.service.task-service';
import type { FlowModel } from 'tasks.v2.model.flows';

type Params = {
	targetNode: HTMLElement,
	taskId: number | string,
	onClose: Function,
};

class FlowDialog
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
		const dialog = new EntitySelectorDialog({
			context: 'tasks-card',
			width: 380,
			height: 370,
			multiple: false,
			hideOnDeselect: true,
			enableSearch: true,
			entities: [
				{
					id: EntitySelectorEntity.Flow,
					options: {
						onlyActive: true,
					},
				},
			],
			preselectedItems: this.#items,
			events: {
				onLoad: this.#fillStore,
			},
			popupOptions: {
				events: {
					onClose: async (): Promise<void> => {
						const flow = await this.#fillStore();

						if (flow)
						{
							const { id: flowId, templateId, groupId } = flow;
							groupService.setHasScrumInfo(this.#taskId);
							void taskService.update(this.#taskId, { flowId, templateId, groupId, stageId: 0 });
						}

						this.#onClose?.();
					},
				},
			},
		});

		if (Core.getParams().rights.flow.create)
		{
			const isFeatureTriable = Extension.getSettings('tasks.v2.component.fields.flow').get('isFeatureTriable');

			void Runtime.loadExtension('tasks.flow.entity-selector').then(({ EmptyStub, Footer }) => {
				dialog.setFooter(new Footer(dialog, { isFeatureTriable }).render());
				dialog.getRecentTab().getStub().hide();
				dialog.getRecentTab().setStub(EmptyStub, { showArrow: false });
				dialog.getRecentTab().render();
			});
		}

		return dialog;
	}

	#fillStore = async (): Promise<?FlowModel> => {
		const item = this.#dialog.getSelectedItems()[0];
		if (!item)
		{
			return null;
		}

		const flow = {
			id: item.getId(),
			name: item.getTitle(),
			groupId: item.getCustomData().get('groupId'),
			templateId: item.getCustomData().get('templateId'),
		};

		if (!Core.getStore().getters[`${Model.Groups}/getById`](flow.groupId))
		{
			await groupService.getGroup(flow.groupId);
		}

		await Core.getStore().dispatch(`${Model.Flows}/insert`, flow);

		return flow;
	};

	get #items(): ItemId[]
	{
		return [[EntitySelectorEntity.Flow, taskService.getStoreTask(this.#taskId).flowId]];
	}
}

export const flowDialog = new FlowDialog();
