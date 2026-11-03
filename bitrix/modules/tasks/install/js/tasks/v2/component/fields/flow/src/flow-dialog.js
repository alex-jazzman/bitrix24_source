import { Extension, Runtime } from 'main.core';

import { Core } from 'tasks.v2.core';
import { EntitySelectorEntity, Model } from 'tasks.v2.const';
import { EntitySelectorDialog, type ItemId } from 'tasks.v2.lib.entity-selector-dialog';
import { groupService } from 'tasks.v2.provider.service.group-service';
import { flowService } from 'tasks.v2.provider.service.flow-service';
import { taskService } from 'tasks.v2.provider.service.task-service';
import type { FlowModel } from 'tasks.v2.model.flows';
import type { TaskModel } from 'tasks.v2.model.tasks';

type Params = {
	targetNode: HTMLElement,
	taskId: number | string,
	onClose: Function,
	onUpdate?: Function,
};

class FlowDialog
{
	#dialog: EntitySelectorDialog;
	#taskId: number | string;
	#onClose: Function | null;
	#onUpdate: Function | null;

	show(params: Params): void
	{
		this.#taskId = params.taskId;
		this.#onClose = params.onClose;
		this.#onUpdate = params.onUpdate;

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
					onClose: this.#handleFlowSelect,
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

	#handleFlowSelect = async (): Promise<void> => {
		try
		{
			if (!this.#dialog.isLoaded())
			{
				return;
			}

			// Singleton dialog: a show() for another card can overwrite this.#taskId while an await
			// below is in flight, so capture the id and current flow synchronously and use only these.
			const taskId = this.#taskId;
			const currentFlowId = taskService.getStoreTask(taskId).flowId;

			const flow = await this.#fillStore();

			if (flow?.id === currentFlowId)
			{
				return;
			}

			if (flow)
			{
				const { id: flowId, templateId, groupId } = flow;
				groupService.setHasScrumInfo(taskId);
				const updatePromise = taskService.update(taskId, { flowId, templateId, groupId, stageId: 0 });

				// Non-blocking so the flow popup closes immediately. Refetch canCreateEpic
				// unconditionally: setHasScrumInfo() cleared it as a fail-safe, so on update failure
				// (server unchanged) the refetch still restores the group's real right. Each call
				// self-guards by task id kind: getScrumInfo for a real task, getEpicCreationRight for
				// a create-mode draft.
				void updatePromise.then(() => {
					void groupService.getScrumInfo(taskId, { force: true });
					void groupService.getEpicCreationRight(taskId);
				});

				this.#onUpdate?.();
			}
		}
		finally
		{
			this.#onClose?.();
		}
	};

	#fillStore = async (): Promise<?FlowModel> => {
		const item = this.#dialog.getSelectedItems()[0];
		if (!item)
		{
			return null;
		}

		const flowId = Number(item.getId()) || 0;

		if (flowId <= 0)
		{
			return null;
		}

		const flow = {
			id: flowId,
			name: item.getTitle(),
			groupId: item.getCustomData().get('groupId'),
			templateId: item.getCustomData().get('templateId'),
		};

		if (!Core.getStore().getters[`${Model.Flows}/getById`](flow.id))
		{
			await flowService.getFlow(flow.id);
		}

		return flow;
	};

	get #items(): ItemId[]
	{
		return this.#flowId > 0 ? [[EntitySelectorEntity.Flow, this.#flowId]] : [];
	}

	get #flowId(): TaskModel
	{
		return taskService.getStoreTask(this.#taskId).flowId;
	}
}

export const flowDialog = new FlowDialog();
