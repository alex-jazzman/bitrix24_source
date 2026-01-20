import { Runtime, Type, Event, Text } from 'main.core';
import type { Store } from 'ui.vue3.vuex';

import { Core } from 'tasks.v2.core';
import { Endpoint, Model } from 'tasks.v2.const';
import { apiClient } from 'tasks.v2.lib.api-client';
import { idUtils, type TaskId } from 'tasks.v2.lib.id-utils';
import { taskService } from 'tasks.v2.provider.service.task-service';
import type { CheckListModel } from 'tasks.v2.model.check-list';
import type { UserModel } from 'tasks.v2.model.users';

import { mapDtoToModel, prepareCheckLists, prepareTitleCheckLists } from './mappers';

class CheckListService
{
	#getPromises = {};
	#completeCheckListIds: { [taskId: number]: Set<number> } = {};
	#renewCheckListIds: { [taskId: number]: Set<number> } = {};
	#completePromises: { [taskId: number]: Resolvable } = {};
	#renewPromises: { [taskId: number]: Resolvable } = {};
	#completeDebounced: { [taskId: number]: Function } = {};
	#renewDebounced: { [taskId: number]: Function } = {};

	constructor()
	{
		Event.bind(window, 'beforeunload', this.handleBeforeUnload);
	}

	handleBeforeUnload = (): void => {
		void this.forceSaveAllPending();
	};

	async load(taskId: TaskId, cloneTo: TaskId): Promise<CheckListModel[]>
	{
		const task = taskService.getStoreTask(taskId);
		if (!idUtils.isReal(taskId) && task.templateId)
		{
			await this.load(idUtils.boxTemplate(task.templateId), taskId);

			return;
		}

		const isTemplate = idUtils.isTemplate(taskId);
		const toId = cloneTo ?? taskId;
		const urlCheckListGet = isTemplate ? 'Template.CheckList.get' : Endpoint.CheckListGet;
		const idKey = isTemplate ? 'templateId' : 'taskId';
		// eslint-disable-next-line no-async-promise-executor
		this.#getPromises[toId] = new Promise(async (resolve, reject) => {
			try
			{
				const data = await apiClient.post(urlCheckListGet, {
					[idKey]: idUtils.unbox(taskId),
				});

				let checkLists = data.map((it) => mapDtoToModel(it));
				if (cloneTo)
				{
					checkLists = this.#clone(checkLists);
				}

				await Promise.all([
					this.$store.dispatch(`${Model.CheckList}/upsertMany`, checkLists),
					taskService.updateStoreTask(toId, {
						containsChecklist: checkLists.length > 0,
						checklist: checkLists.map(({ id }) => id),
					}),
				]);

				resolve();
			}
			catch (error)
			{
				reject(error);
			}
		});

		await this.#getPromises[toId];
	}

	async save(taskId: number, checklists: CheckListModel[], skipNotification: boolean = false): Promise<void>
	{
		// eslint-disable-next-line no-async-promise-executor
		return new Promise(async (resolve, reject) => {
			try
			{
				const isTemplate = idUtils.isTemplate(taskId);
				const idPure = idUtils.unbox(taskId);
				const urlCheckListSave = isTemplate ? 'Template.CheckList.save' : Endpoint.CheckListSave;
				const entity = isTemplate ? 'template' : 'task';
				const features = Core.getParams().features;

				// todo remove after features.isV2Enabled === true
				const task = taskService.getStoreTask(taskId);
				const canOpenFullCard = (
					features.isV2Enabled
					|| (
						Type.isArray(features.allowedGroups)
						&& features.allowedGroups.includes(task.groupId)
					)
				);

				if (!canOpenFullCard)
				{
					// todo remove after features.isV2Enabled === true
					// eslint-disable-next-line no-param-reassign
					checklists = prepareTitleCheckLists(checklists);
				}

				const savedList = await apiClient.post(urlCheckListSave, {
					[entity]: {
						id: idPure,
						checklist: prepareCheckLists(checklists),
					},
					skipNotification,
				});

				const checkLists = savedList.map((it) => mapDtoToModel(it));

				await Promise.all([
					this.$store.dispatch(`${Model.Interface}/setDisableCheckListAnimations`, true),
					this.$store.dispatch(`${Model.CheckList}/upsertMany`, checkLists),
				]);

				await this.#updateTask(taskId, checkLists);

				void this.$store.dispatch(`${Model.Interface}/setDisableCheckListAnimations`, false);

				resolve();
			}
			catch (error)
			{
				reject(error);
			}
		});
	}

	async collapse(taskId: number, checkListId: number): Promise<void>
	{
		const isTemplate = idUtils.isTemplate(taskId);
		const idPure = idUtils.unbox(taskId);
		const urlCheckListCollapse = isTemplate ? 'Template.CheckList.collapse' : Endpoint.CheckListCollapse;
		const entity = isTemplate ? 'template' : 'task';

		await apiClient.post(urlCheckListCollapse, {
			[`${entity}Id`]: idPure,
			checkListId,
		});

		void this.$store.dispatch(`${Model.CheckList}/update`, {
			id: checkListId,
			fields: {
				collapsed: true,
				expanded: false,
			},
		});
	}

	async expand(taskId: number, checkListId: number): Promise<void>
	{
		const isTemplate = idUtils.isTemplate(taskId);
		const idPure = idUtils.unbox(taskId);
		const urlCheckListExpand = isTemplate ? 'Template.CheckList.expand' : Endpoint.CheckListExpand;
		const entity = isTemplate ? 'template' : 'task';

		await apiClient.post(urlCheckListExpand, {
			[`${entity}Id`]: idPure,
			checkListId,
		});

		void this.$store.dispatch(`${Model.CheckList}/update`, {
			id: checkListId,
			fields: {
				collapsed: false,
				expanded: true,
			},
		});
	}

	async complete(taskId: number, checkListId: number): Promise<void>
	{
		await this.$store.dispatch(`${Model.CheckList}/update`, {
			id: checkListId,
			fields: { isComplete: true },
		});

		this.#completeCheckListIds[taskId] ??= new Set();
		this.#completeCheckListIds[taskId].add(checkListId);

		this.#completePromises[taskId] ??= new Resolvable();

		this.#completeDebounced[taskId] ??= Runtime.debounce(this.#completeCheckLists, 1500, this);
		this.#completeDebounced[taskId](taskId);

		await this.#completePromises[taskId];
	}

	async renew(taskId: number, checkListId: number): Promise<void>
	{
		await this.$store.dispatch(`${Model.CheckList}/update`, {
			id: checkListId,
			fields: { isComplete: false },
		});

		this.#renewCheckListIds[taskId] ??= new Set();
		this.#renewCheckListIds[taskId].add(checkListId);

		this.#renewPromises[taskId] ??= new Resolvable();

		this.#renewDebounced[taskId] ??= Runtime.debounce(this.#renewCheckLists, 1500, this);
		this.#renewDebounced[taskId](taskId);

		await this.#renewPromises[taskId];
	}

	async delete(taskId: number, checkListId: number): Promise<void>
	{
		const task = taskService.getStoreTask(taskId);
		const checklists = this.$store.getters[`${Model.CheckList}/getByIds`](task.checklist);
		await this.save(taskId, checklists);
	}

	async #completeCheckLists(taskId: number): Promise<void>
	{
		const isTemplate = idUtils.isTemplate(taskId);
		const idPure = idUtils.unbox(taskId);
		const urlCheckListComplete = isTemplate ? 'Template.CheckList.complete' : Endpoint.CheckListComplete;
		const entity = isTemplate ? 'template' : 'task';
		const checkListIds = this.#completeCheckListIds[taskId];
		delete this.#completeCheckListIds[taskId];

		const promise = this.#completePromises[taskId];
		delete this.#completePromises[taskId];

		if (!checkListIds || checkListIds.size === 0)
		{
			promise?.resolve();

			return;
		}

		try
		{
			const checkLists = await Promise.all(
				[...checkListIds].map((checkListId) => {
					return this.$store.getters[`${Model.CheckList}/getById`](checkListId);
				}),
			);

			await apiClient.post(urlCheckListComplete, {
				[entity]: {
					id: idPure,
					checklist: prepareCheckLists(checkLists),
				},
			});

			promise?.resolve();
		}
		catch
		{
			promise?.resolve();
		}
	}

	async #renewCheckLists(taskId: number): Promise<void>
	{
		const isTemplate = idUtils.isTemplate(taskId);
		const idPure = idUtils.unbox(taskId);
		const urlCheckListRenew = isTemplate ? 'Template.CheckList.renew' : Endpoint.CheckListRenew;
		const entity = isTemplate ? 'template' : 'task';
		const checkListIds = this.#renewCheckListIds[taskId];
		delete this.#renewCheckListIds[taskId];

		const promise = this.#renewPromises[taskId];
		delete this.#renewPromises[taskId];

		if (!checkListIds || checkListIds.size === 0)
		{
			promise?.resolve();

			return;
		}

		try
		{
			const checkLists = await Promise.all(
				[...checkListIds].map(async (checkListId) => {
					return this.$store.getters[`${Model.CheckList}/getById`](checkListId);
				}),
			);

			await apiClient.post(urlCheckListRenew, {
				[entity]: {
					id: idPure,
					checklist: prepareCheckLists(checkLists),
				},
			});

			promise?.resolve();
		}
		catch
		{
			promise?.resolve();
		}
	}

	isCheckListExists(checkListId: number): boolean
	{
		return this.#getById(checkListId) !== null;
	}

	filterItemsBelongingToCheckList(checkListId: number, checkListItemIds: number[]): number[]
	{
		const result = [];

		checkListItemIds.forEach((checkListItemId: number) => {
			const rootId = this.#getRootId(checkListItemId);
			if (rootId === checkListId)
			{
				result.push(checkListItemId);
			}
		});

		return result;
	}

	#getRootId(checkListItemId: number): number
	{
		const item = this.#getById(checkListItemId);

		if (!item)
		{
			return 0;
		}

		if (item.parentId === 0)
		{
			return item.id;
		}

		return this.#getRootId(item.parentId);
	}

	#getById(checkListId: number): CheckListModel | null
	{
		return this.$store.getters[`${Model.CheckList}/getById`](checkListId) ?? null;
	}

	async #updateTask(taskId: number, checkLists: CheckListModel[]): void
	{
		const task = taskService.getStoreTask(taskId);

		const accomplicesIdsSet = new Set(task?.accomplicesIds);
		const auditorsIdsSet = new Set(task?.auditorsIds);

		const users = [];
		checkLists.forEach((item: CheckListModel) => {
			item.accomplices?.forEach((accomplice: UserModel) => {
				users.push(accomplice);
				accomplicesIdsSet.add(accomplice.id);
			});
			item.auditors?.forEach((auditor: UserModel) => {
				users.push(auditor);
				auditorsIdsSet.add(auditor.id);
			});
		});

		const accomplicesIds = [...accomplicesIdsSet];
		const auditorsIds = [...auditorsIdsSet];

		await Core.getStore().dispatch(`${Model.Users}/upsertMany`, users);

		await taskService.updateStoreTask(taskId, {
			containsChecklist: checkLists.length > 0,
			checklist: checkLists.map((item: CheckListModel) => item.id),
			accomplicesIds,
			auditorsIds,
		});
	}

	async forceCompletePending(taskId: number): Promise<void>
	{
		if (this.#completeCheckListIds[taskId]?.size > 0)
		{
			await this.#completeCheckLists(taskId);
		}
	}

	async forceRenewPending(taskId: number): Promise<void>
	{
		if (this.#renewCheckListIds[taskId]?.size > 0)
		{
			await this.#renewCheckLists(taskId);
		}
	}

	async forceSavePending(taskId: number): Promise<void>
	{
		await Promise.all([
			this.forceCompletePending(taskId),
			this.forceRenewPending(taskId),
		]);
	}

	async forceSaveAllPending(): Promise<void>
	{
		const allTaskIds = new Set([
			...Object.keys(this.#completeCheckListIds),
			...Object.keys(this.#renewCheckListIds),
		]);

		await Promise.all(
			[...allTaskIds].map((taskId) => this.forceSavePending(parseInt(taskId, 10))),
		);
	}

	#clone(checkLists: CheckListModel[]): CheckListModel[]
	{
		const { idsMap, nodeIdsMap } = checkLists.reduce((maps, { id, nodeId }) => {
			maps.idsMap.set(id, Text.getRandom());
			if (nodeId)
			{
				maps.nodeIdsMap.set(nodeId, Text.getRandom());
			}

			return maps;
		}, { idsMap: new Map(), nodeIdsMap: new Map() });

		return checkLists.map((checkList: CheckListModel) => ({
			...checkList,
			id: idsMap.get(checkList.id),
			copiedId: checkList.id,
			nodeId: nodeIdsMap.get(checkList.nodeId) ?? Text.getRandom(),
			parentId: idsMap.get(checkList.parentId) ?? 0,
			parentNodeId: nodeIdsMap.get(checkList.parentNodeId) ?? null,
			actions: {
				modify: true,
				remove: true,
				toggle: true,
			},
		}));
	}

	get $store(): Store
	{
		return Core.getStore();
	}
}

export const checkListService = new CheckListService();

function Resolvable(): Promise
{
	const promise = new Promise((resolve) => {
		this.resolve = resolve;
	});

	promise.resolve = this.resolve;

	return promise;
}
