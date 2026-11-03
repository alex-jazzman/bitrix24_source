/* global Partial */

import { type Store } from 'ui.vue3.vuex';
import { GroupType, Model, Endpoint } from 'tasks.v2.const';
import { apiClient } from 'tasks.v2.lib.api-client';
import { mapDtoToModel, mapStageDtoToModel, type GroupModel } from 'tasks.v2.model.groups';
import { type TaskModel } from 'tasks.v2.model.tasks';
import { type GroupInfo } from './types';

type CoreApplication = {
	getParams: () => { features: { isNewProjectsOn: boolean } },
	getStore: () => Store,
};

class GroupService
{
	async getUrl(id: number, type: string): Promise<string>
	{
		if (this.#getCore().getParams().features.isNewProjectsOn)
		{
			return this.getProjectUrl(id, type);
		}

		if (type !== GroupType.Collab)
		{
			return `/workgroups/group/${id}/`;
		}

		try
		{
			return apiClient.post(Endpoint.GroupUrlGet, { group: { id, type } });
		}
		catch (error)
		{
			console.error('GroupService: getUrl error', error);

			return '';
		}
	}

	async getStages(id: number): Promise<void>
	{
		try
		{
			const data = await apiClient.post(Endpoint.GroupStageList, { group: { id } });

			const stages = data.map((stage) => mapStageDtoToModel(stage));
			const stagesIds = stages.map((stage) => stage.id);

			await Promise.all([
				this.#getCore().getStore().dispatch(`${Model.Stages}/upsertMany`, stages),
				this.#getCore().getStore().dispatch(`${Model.Groups}/update`, {
					id,
					fields: { stagesIds },
				}),
			]);
		}
		catch (error)
		{
			console.error('GroupService: getStages error', error);
		}
	}

	async getGroup(id: number): Promise<?GroupModel>
	{
		try
		{
			const data = await apiClient.post(Endpoint.GroupGet, { group: { id } });

			const group = mapDtoToModel(data);

			await this.#getCore().getStore().dispatch(`${Model.Groups}/insert`, group);

			return group;
		}
		catch (error)
		{
			console.error('GroupService: getGroup error', error);

			return null;
		}
	}

	async getGroupByTaskId(id: number): Promise<?GroupModel>
	{
		try
		{
			const data = await apiClient.post(Endpoint.GroupGetByTaskId, { task: { id } });

			const group = mapDtoToModel(data);

			await this.#getCore().getStore().dispatch(`${Model.Groups}/insert`, group);

			return group;
		}
		catch (error)
		{
			console.error('GroupService: getGroupByTaskId error', error);

			return null;
		}
	}

	#scrumInfoPromises: { [taskId: number | string]: Promise } = {};
	#scrumInfoStates: { [taskId: number | string]: string } = {};
	#scrumInfoSubscribers: { [taskId: number | string]: Set<(state: string) => void> } = {};
	#scrumInfoReturnUnsubscribers: { [taskId: number | string]: () => void } = {};
	// A globally unique generation guards responses even when deletion clears a task's entry. A
	// response is applied only if its generation is still current, so a
	// stale fetch (a mount-fetch started before a group change, or an earlier force in a burst)
	// cannot overwrite the fresh data a later fetch just wrote — last writer wins.
	//
	// Force refetches are deliberately NOT coalesced. Coalescing by taskId alone was incorrect:
	// a second group change would await the in-flight request of the first and skip its own,
	// letting the first group's answer land on a task already moved to the second group. Each
	// force now issues its own request and bumps the generation, so the last change always wins
	// regardless of response order. The trade-off — a burst of rapid changes fires N requests
	// instead of 1 — is accepted: correctness over de-dup, and group changes are rare.
	#scrumInfoGen: { [taskId: number | string]: number } = {};
	#scrumInfoGenCounter: number = 0;
	#scrumInfoStore: ?Store = null;
	#unsubscribeScrumInfoStore: ?Function = null;

	async getScrumInfo(taskId: number, options: { force?: boolean } = {}): Promise<void>
	{
		// A create-mode draft has a string taskId; force skips hasScrumInfo, so guard here too —
		// otherwise the string reaches Scrum.getTaskInfo(int) and throws a BinderArgumentException.
		if (!this.#isRealTaskId(taskId))
		{
			return;
		}
		this.#observeTaskChanges();

		// An unknown task may still be loading into the store. A deleted task waits
		// for its return instead of sending another request from a mounted field.
		const storeTask = this.#getStoreTask(taskId);
		if (!storeTask && this.#scrumInfoStates[taskId] === 'missing')
		{
			this.#watchTaskReturn(taskId);
			this.#releaseTaskObserverIfUnused();

			return;
		}

		const groupId = storeTask?.groupId;
		if (groupId === 0)
		{
			this.#clearScrumInfoForNoGroup(taskId);

			return;
		}

		const group = this.#getCore().getStore().getters[`${Model.Groups}/getById`](groupId ?? 0);
		if (group && group.type !== GroupType.Scrum)
		{
			this.#releaseTaskObserverIfUnused();

			return;
		}

		const force = options.force === true;

		if (!force && this.hasScrumInfo(taskId))
		{
			await this.#scrumInfoPromises[taskId];

			return;
		}

		const gen = ++this.#scrumInfoGenCounter;
		this.#scrumInfoGen[taskId] = gen;

		const promise = new Resolvable();
		this.#scrumInfoPromises[taskId] = promise;
		this.#observeTaskChanges();
		this.#setScrumInfoState(taskId, 'loading');

		try
		{
			const data = await apiClient.post(Endpoint.ScrumGetTaskInfo, { taskId });
			if (data?.status === 'error')
			{
				throw new Error('Scrum information request failed');
			}

			this.#observeTaskChanges();
			const currentTask = this.#getStoreTask(taskId);
			// Drop the result if a newer fetch superseded this one; last writer wins.
			if (this.#scrumInfoGen[taskId] === gen)
			{
				if (Boolean(currentTask) !== Boolean(storeTask) || currentTask?.groupId !== groupId)
				{
					this.#invalidateScrumInfo(taskId);

					return;
				}

				if (!currentTask)
				{
					this.#markTaskMissing(taskId);

					return;
				}

				await Promise.all([
					this.#getCore().getStore().dispatch(`${Model.Epics}/upsert`, data.epic),
					this.#updateStoreTask(taskId, {
						storyPoints: data.storyPoints,
						epicId: data.epic?.id,
						canCreateEpic: data.canCreateEpic === true,
						canUpdateScrumFields: data.canUpdateScrumFields === true,
					}),
				]);
				this.#observeTaskChanges();
				const updatedTask = this.#getStoreTask(taskId);
				if (this.#scrumInfoGen[taskId] === gen)
				{
					if (Boolean(updatedTask) !== Boolean(storeTask) || updatedTask?.groupId !== groupId)
					{
						this.#invalidateScrumInfo(taskId);
					}
					else if (updatedTask)
					{
						this.#setScrumInfoState(taskId, 'loaded');
					}
					else
					{
						this.#markTaskMissing(taskId);
					}
				}
			}
		}
		catch (error)
		{
			this.#observeTaskChanges();
			if (this.#scrumInfoGen[taskId] !== gen)
			{
				return;
			}

			const currentTask = this.#getStoreTask(taskId);
			if (Boolean(currentTask) !== Boolean(storeTask) || currentTask?.groupId !== groupId)
			{
				this.#invalidateScrumInfo(taskId);

				return;
			}

			console.error('GroupService: getScrumInfo error', error);

			// Drop the cache entry: otherwise hasScrumInfo() keeps reporting data that never
			// arrived, every plain retry short-circuits on the resolved promise, and the task is
			// stuck with the fail-safe canCreateEpic: false until a force refetch or a reload.
			this.#setScrumInfoState(taskId, 'error');
			delete this.#scrumInfoPromises[taskId];
			delete this.#scrumInfoGen[taskId];
			this.#releaseTaskObserverIfUnused();
		}
		finally
		{
			// A superseded caller must wait for the current generation before it observes completion.
			// Otherwise a component that started before a group change can keep the loading state after
			// the new force request has already started.
			const current = this.#scrumInfoPromises[taskId];
			if (current && current !== promise)
			{
				await current;
			}

			// Always resolve so a failed fetch cannot leave the promise forever-pending and
			// hang the next mount on a phantom loader.
			promise.resolve();
			this.#releaseTaskObserverIfUnused();
		}
	}

	// Resolves the "create epic" right for a create-mode draft, whose string taskId keeps getScrumInfo
	// (which needs a real taskId for Scrum.getTaskInfo(int)) from ever confirming it. The right does
	// not depend on the task: server-side it is Group::can(groupId, ACTION_CREATE_TASKS) — the same
	// gate as getTaskInfo and createEpic — so it is answered by groupId alone and the draft's string
	// id never leaves the client. A real task keeps resolving the right through getScrumInfo.
	async getEpicCreationRight(taskId: number | string): Promise<void>
	{
		if (this.#isRealTaskId(taskId))
		{
			return;
		}

		const groupId = this.#getStoreTask(taskId)?.groupId ?? 0;
		const group = this.#getCore().getStore().getters[`${Model.Groups}/getById`](groupId);
		if (groupId <= 0 || group?.type !== GroupType.Scrum)
		{
			return;
		}

		// Share getScrumInfo's generation guard: setHasScrumInfo() bumps it on every group/flow change
		// and resets canCreateEpic to false, so a late response for a superseded group must not
		// overwrite the fresh state. Bump-and-capture, apply only if still current — last writer wins.
		const gen = ++this.#scrumInfoGenCounter;
		this.#scrumInfoGen[taskId] = gen;

		try
		{
			const canCreateEpic = await apiClient.post(Endpoint.ScrumGetEpicCreationRight, { groupId });

			if (this.#scrumInfoGen[taskId] === gen)
			{
				this.#updateStoreTask(taskId, { canCreateEpic: canCreateEpic === true });
			}
		}
		catch (error)
		{
			console.error('GroupService: getEpicCreationRight error', error);
		}
	}

	// Invariant: between setHasScrumInfo() and the task.groupId write (inside taskService.update)
	// there must be no await — otherwise Vue can mount the Epic component and fire a competing
	// mount-fetch for the old group before the new groupId lands, reintroducing a race.
	setHasScrumInfo(taskId: number): boolean
	{
		this.#observeTaskChanges();
		// Reset Scrum rights too (fail-safe): until the force refetch confirms the new group's
		// rights, do not keep the old group's interactive controls. This write is synchronous, so
		// the no-await invariant above still holds. The server enforces the rights regardless.
		// The generation bump invalidates in-flight fetches started before the group change,
		// so a late response cannot resurrect stale data over this fail-safe reset.
		this.#scrumInfoGen[taskId] = ++this.#scrumInfoGenCounter;
		this.#updateStoreTask(taskId, {
			epicId: 0,
			storyPoints: '',
			canCreateEpic: false,
			canUpdateScrumFields: false,
		});
		this.#scrumInfoPromises[taskId] = new Resolvable();
		this.#scrumInfoPromises[taskId].resolve();
		this.#setScrumInfoState(taskId, 'loading');
	}

	#observeTaskChanges(): void
	{
		const store = this.#getCore().getStore();
		if (store === this.#scrumInfoStore)
		{
			return;
		}

		const replacedStore = this.#scrumInfoStore !== null;
		const subscribedTaskIds = Object.keys(this.#scrumInfoSubscribers)
			.filter((id) => this.#scrumInfoSubscribers[id].size > 0)
			.map(Number)
		;
		this.#unsubscribeScrumInfoStore?.();
		Object.values(this.#scrumInfoReturnUnsubscribers).forEach((unsubscribe) => unsubscribe());
		this.#scrumInfoReturnUnsubscribers = {};
		this.#scrumInfoStore = store;
		if (replacedStore)
		{
			this.#scrumInfoGen = {};
			this.#scrumInfoPromises = {};
			this.#scrumInfoStates = {};
		}
		this.#unsubscribeScrumInfoStore = store.subscribe(({ type, payload }) => {
			if (this.#scrumInfoStore !== store)
			{
				return;
			}
			if (type === `${Model.Tasks}/delete`)
			{
				if (payload in this.#scrumInfoGen || this.#scrumInfoSubscribers[payload]?.size)
				{
					this.#markTaskMissing(payload);
				}

				return;
			}

			if (type !== `${Model.Tasks}/update` && type !== `${Model.Tasks}/upsert`)
			{
				return;
			}

			const taskId = payload?.id;
			if (taskId in this.#scrumInfoGen && this.#getStoreTask(taskId)?.groupId === 0)
			{
				this.#clearScrumInfoForNoGroup(taskId);
			}
		});

		if (replacedStore)
		{
			for (const taskId of subscribedTaskIds)
			{
				this.#setScrumInfoState(taskId, 'loading');
				if (this.#getStoreTask(taskId))
				{
					void this.getScrumInfo(taskId, { force: true });
				}
				else
				{
					this.#setScrumInfoState(taskId, 'missing');
					this.#watchTaskReturn(taskId);
				}
			}
		}
	}

	#releaseTaskObserverIfUnused(): void
	{
		if (
			Object.keys(this.#scrumInfoPromises).length > 0
			|| Object.values(this.#scrumInfoSubscribers).some((subscribers) => subscribers.size > 0)
			|| Object.keys(this.#scrumInfoReturnUnsubscribers).length > 0
		)
		{
			return;
		}

		this.#unsubscribeScrumInfoStore?.();
		this.#unsubscribeScrumInfoStore = null;
		this.#scrumInfoStore = null;
	}

	#invalidateScrumInfo(taskId: number | string): void
	{
		delete this.#scrumInfoPromises[taskId];
		delete this.#scrumInfoGen[taskId];
		const task = this.#getStoreTask(taskId);
		this.#setScrumInfoState(taskId, task ? 'loading' : 'missing');
		if (task && this.#scrumInfoSubscribers[taskId]?.size)
		{
			void this.getScrumInfo(taskId, { force: true });
		}
		else if (!task)
		{
			this.#watchTaskReturn(taskId);
		}
		this.#releaseTaskObserverIfUnused();
	}

	#markTaskMissing(taskId: number | string): void
	{
		delete this.#scrumInfoPromises[taskId];
		delete this.#scrumInfoGen[taskId];
		this.#setScrumInfoState(taskId, 'missing');
		this.#watchTaskReturn(taskId);
		this.#releaseTaskObserverIfUnused();
	}

	#clearScrumInfoForNoGroup(taskId: number | string): void
	{
		const hadScrumInfo = taskId in this.#scrumInfoGen || taskId in this.#scrumInfoPromises;
		delete this.#scrumInfoGen[taskId];
		delete this.#scrumInfoPromises[taskId];

		if (hadScrumInfo)
		{
			this.#updateStoreTask(taskId, {
				epicId: 0,
				storyPoints: '',
				canCreateEpic: false,
				canUpdateScrumFields: false,
			});
		}

		this.#setScrumInfoState(taskId, 'loaded');
		this.#releaseTaskObserverIfUnused();
	}

	#watchTaskReturn(taskId: number | string): void
	{
		if (!this.#scrumInfoSubscribers[taskId]?.size || this.#scrumInfoReturnUnsubscribers[taskId])
		{
			return;
		}

		if (this.#getStoreTask(taskId))
		{
			void this.getScrumInfo(taskId);

			return;
		}

		const store = this.#getCore().getStore();
		this.#scrumInfoReturnUnsubscribers[taskId] = store.subscribe(() => {
			if (this.#scrumInfoStore !== store)
			{
				return;
			}

			if (!this.#getStoreTask(taskId))
			{
				return;
			}

			this.#scrumInfoReturnUnsubscribers[taskId]?.();
			delete this.#scrumInfoReturnUnsubscribers[taskId];
			void this.getScrumInfo(taskId);
		});
	}

	#getStoreTask(taskId: number | string): ?TaskModel
	{
		const task = this.#getCore().getStore().getters[`${Model.Tasks}/getById`](taskId);

		return task ? { ...task } : null;
	}

	#updateStoreTask(taskId: number | string, fields: Partial<TaskModel>): void
	{
		if (this.#getStoreTask(taskId))
		{
			void this.#getCore().getStore().dispatch(`${Model.Tasks}/update`, { id: taskId, fields });
		}
	}

	#getCore(): CoreApplication
	{
		const core = BX.Tasks?.V2?.Core;
		if (!core)
		{
			throw new Error('GroupService: tasks.v2.core must be initialized before use');
		}

		return core;
	}

	#isRealTaskId(taskId: number | string): boolean
	{
		return Number.isInteger(taskId) && taskId > 0;
	}

	hasScrumInfo(taskId: number | string): boolean
	{
		if (!this.#isRealTaskId(taskId))
		{
			return true;
		}

		this.#observeTaskChanges();
		const hasScrumInfo = taskId in this.#scrumInfoPromises;
		this.#releaseTaskObserverIfUnused();

		return hasScrumInfo;
	}

	getScrumInfoState(taskId: number | string): string
	{
		if (!this.#isRealTaskId(taskId))
		{
			return 'loaded';
		}

		this.#observeTaskChanges();
		const state = this.#scrumInfoStates[taskId] ?? 'loading';
		this.#releaseTaskObserverIfUnused();

		return state;
	}

	subscribeScrumInfoState(taskId: number | string, callback: (state: string) => void): () => void
	{
		if (this.#isRealTaskId(taskId))
		{
			this.#observeTaskChanges();
		}

		this.#scrumInfoSubscribers[taskId] ??= new Set();
		const subscribers = this.#scrumInfoSubscribers[taskId];
		subscribers.add(callback);
		if (this.#scrumInfoStates[taskId] === 'missing')
		{
			this.#watchTaskReturn(taskId);
		}

		return () => {
			subscribers.delete(callback);
			if (subscribers.size === 0 && this.#scrumInfoSubscribers[taskId] === subscribers)
			{
				this.#scrumInfoReturnUnsubscribers[taskId]?.();
				delete this.#scrumInfoReturnUnsubscribers[taskId];
				delete this.#scrumInfoSubscribers[taskId];
				this.#releaseTaskObserverIfUnused();
			}
		};
	}

	#setScrumInfoState(taskId: number | string, state: string): void
	{
		this.#scrumInfoStates[taskId] = state;
		this.#scrumInfoSubscribers[taskId]?.forEach((callback) => callback(state));
	}

	#groupInfoPromises: { [groupId: number]: Promise<GroupInfo> } = {};

	async getGroupInfo(groupId: number): Promise<GroupInfo>
	{
		if (this.#groupInfoPromises[groupId])
		{
			return this.#groupInfoPromises[groupId];
		}

		this.#groupInfoPromises[groupId] = new Resolvable();

		try
		{
			const GroupFields = Object.freeze({
				OwnerData: 'OWNER_DATA',
				DateCreate: 'DATE_CREATE',
				SubjectData: 'SUBJECT_DATA',
				NumberOfMembers: 'NUMBER_OF_MEMBERS',
			});

			const { data } = await BX.ajax.runAction('socialnetwork.api.workgroup.get', {
				data: {
					params: {
						select: Object.values(GroupFields),
						groupId,
					},
				},
			});

			this.#groupInfoPromises[groupId].resolve({
				ownerId: data[GroupFields.OwnerData]?.ID,
				ownerName: data[GroupFields.OwnerData]?.FORMATTED_NAME,
				dateCreate: data[GroupFields.DateCreate],
				subjectTitle: data[GroupFields.SubjectData]?.NAME,
				numberOfMembers: data[GroupFields.NumberOfMembers],
			});

			return this.#groupInfoPromises[groupId];
		}
		catch (error)
		{
			const emptyGroupInfo = {};

			this.#groupInfoPromises[groupId].resolve(emptyGroupInfo);

			console.error('GroupService: getGroupInfo error', error);

			return emptyGroupInfo;
		}
	}

	getProjectUrl(id: number, type: string): string
	{
		if (type === GroupType.Scrum)
		{
			return `/workgroups/group/${id}/tasks/?scrum=y`;
		}

		return `/workgroups/group/${id}/`;
	}
}

export const groupService = new GroupService();

function Resolvable(): Promise
{
	const promise = new Promise((resolve) => {
		this.resolve = resolve;
	});

	promise.resolve = this.resolve;

	return promise;
}
