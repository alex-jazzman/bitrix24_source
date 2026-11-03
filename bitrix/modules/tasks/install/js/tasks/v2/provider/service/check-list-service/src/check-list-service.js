import { Runtime, Type, Event, Text, Loc } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { type Store } from 'ui.vue3.vuex';

import { Core } from 'tasks.v2.core';
import { Endpoint, EventName, Model } from 'tasks.v2.const';
import { apiClient } from 'tasks.v2.lib.api-client';
import { idUtils, type TaskId } from 'tasks.v2.lib.id-utils';
import { taskService } from 'tasks.v2.provider.service.task-service';
import { type CheckListModel } from 'tasks.v2.model.check-list';
import { type UserModel } from 'tasks.v2.model.users';

import { mapDtoToModel, prepareCheckLists, prepareTitleCheckLists } from './mappers';
import { StatusBatch } from './status-batch';
import { mergeCheckLists, deriveParentCompletion, memberSetsEqual, SEMANTIC_SCALAR_FIELDS, MEMBER_FIELDS, ATTACHMENT_FIELD } from './merge';
import { activeFieldRegistry } from './active-field-registry';

const CONFLICT_MAX_RETRIES = 3;

const CONFLICT_RETRY_BASE_DELAY_MS = 300;

export class CheckListService
{
	#getPromises = {};
	#refreshPromises = {};
	#completeBatch: StatusBatch = new StatusBatch((taskId: number) => this.#completeCheckLists(taskId));
	#renewBatch: StatusBatch = new StatusBatch((taskId: number) => this.#renewCheckLists(taskId));

	#revisions = {};

	#serverTrees = {};

	#checkedEntities = {};

	#mergeChains = {};

	#pullConflictsQueue = [];

	constructor()
	{
		Event.bind(window, 'beforeunload', this.handleBeforeUnload);

		EventEmitter.subscribe(EventName.CardClosed, this.#handleCardClosed);
		EventEmitter.subscribe(EventName.FullCardClosed, this.#handleCardClosed);
	}

	handleBeforeUnload = (): void => {
		void this.forceSaveAllPending();
	};

	#handleCardClosed = (event): void => {
		const taskId = event?.getData()?.taskId;
		if (taskId !== undefined && taskId !== null)
		{
			this.clearTask(taskId);
		}
	};

	clearTask(taskId: TaskId): void
	{
		delete this.#revisions[taskId];
		delete this.#serverTrees[taskId];
		delete this.#checkedEntities[taskId];
		delete this.#getPromises[taskId];
		delete this.#refreshPromises[taskId];
		this.clearPullConflicts(taskId);
	}

	#storeRevisionAndTree(taskId: TaskId, revision: ?string, checklist: ?Array): void
	{
		if (revision !== undefined && revision !== null)
		{
			this.#revisions[taskId] = revision;
		}
		if (Array.isArray(checklist))
		{
			this.#serverTrees[taskId] = checklist.map((it) => mapDtoToModel(it));
		}
	}

	#setRevisionAndTree(taskId: TaskId, revision: ?string, mappedTree: ?Array): void
	{
		if (revision !== undefined && revision !== null)
		{
			this.#revisions[taskId] = revision;
		}
		if (Array.isArray(mappedTree))
		{
			this.#serverTrees[taskId] = mappedTree;
		}
	}

	#holdDeferredFields(incomingTree: CheckListModel[], baseTree: CheckListModel[], deferred: Array): CheckListModel[]
	{
		const heldFields = new Map();
		deferred.forEach(({ id, field }) => {
			if (!heldFields.has(id))
			{
				heldFields.set(id, new Set());
			}
			heldFields.get(id).add(field);
		});

		const baseById = new Map((baseTree ?? []).map((it) => [it.id, it]));

		return incomingTree.map((item) => {
			const fields = heldFields.get(item.id);
			const baseItem = baseById.get(item.id);
			if (!fields || !baseItem)
			{
				return item;
			}

			const held = { ...item };
			fields.forEach((field) => {
				held[field] = baseItem[field];
			});

			return held;
		});
	}

	getRevision(taskId: TaskId): string | void
	{
		return this.#revisions[taskId];
	}

	// an empty store means "no checklists" only for a task whose tree already came from the server
	hasServerTree(taskId: TaskId): boolean
	{
		return Array.isArray(this.#serverTrees[taskId]);
	}

	initializeFromStore(taskId: TaskId, checklist: CheckListModel[]): void
	{
		if (this.hasServerTree(taskId) || !Array.isArray(checklist))
		{
			return;
		}

		this.#storeRevisionAndTree(taskId, undefined, checklist);
	}

	// a tree loaded earlier may already be behind, so only a check at the current revision proves that
	// the entity is missing from the server tree; without a revision nothing can be proven at all.
	// the revision moves only with pull, so a check of one entity says nothing about another one
	hasCheckedEntity(taskId: TaskId, entityId: number): boolean
	{
		return this.hasCheckedEntities(taskId, [entityId]);
	}

	hasCheckedEntities(taskId: TaskId, entityIds: number[]): boolean
	{
		const revision = this.#revisions[taskId];
		if (revision === undefined || revision === null || !this.hasServerTree(taskId))
		{
			return false;
		}

		return this.#checkedEntities[taskId]?.get(this.#getEntityCheckKey(entityIds)) === revision;
	}

	#entityChecksOf(taskId: TaskId): Map<string, string>
	{
		if (!this.#checkedEntities[taskId])
		{
			this.#checkedEntities[taskId] = new Map();
		}

		return this.#checkedEntities[taskId];
	}

	#getEntityCheckKey(entityIds: number[]): string
	{
		return [...new Set(entityIds)].sort((a, b) => a - b).join(':');
	}

	#resolveActionRights(taskId: TaskId): Object
	{
		const rights = taskService.getStoreTask(taskId)?.rights ?? {};

		return {
			currentUserId: this.$store.getters[`${Model.Interface}/currentUserId`],
			checklistEdit: rights.checklistEdit === true,
			checklistToggle: rights.checklistToggle === true,
		};
	}

	async applyIncomingTree(taskId: TaskId, incomingDto: Array, revision: string): Promise<void>
	{
		await this.#enqueueMerge(taskId, () => this.#mergeIncomingTree(taskId, incomingDto, revision));
	}

	// pull and refresh merge into the same base, so their merges run one after another per task:
	// otherwise both read the base before either writes it back, and the older answer wins the race
	#enqueueMerge<T>(taskId: TaskId, merge: () => Promise<T>): Promise<T>
	{
		const chained = (this.#mergeChains[taskId] ?? Promise.resolve()).then(merge, merge);
		this.#mergeChains[taskId] = chained;

		const release = () => {
			if (this.#mergeChains[taskId] === chained)
			{
				delete this.#mergeChains[taskId];
			}
		};
		void chained.then(release, release);

		return chained;
	}

	// resolves to false when there is no store task to merge into, so nothing about it was proven
	async #mergeIncomingTree(taskId: TaskId, incomingDto: Array, revision: string): Promise<boolean>
	{
		const task = taskService.getStoreTask(taskId);
		if (!task)
		{
			return false;
		}

		const base = this.#serverTrees[taskId] ?? [];
		const getById = this.$store.getters[`${Model.CheckList}/getById`];
		const local = (task.checklist ?? [])
			.map((id) => getById(id))
			.filter(Boolean);
		const incoming = (incomingDto ?? []).map((it) => mapDtoToModel(it));

		const { merged, conflicts, deferred } = mergeCheckLists(base, local, incoming, {
			isFieldActive: (itemId, field) => activeFieldRegistry.isActive(itemId, field),
			...this.#resolveActionRights(taskId),
		});

		const withParentCompletion = deriveParentCompletion(merged, {
			isFieldActive: (itemId, field) => activeFieldRegistry.isActive(itemId, field),
		});

		const hasConflicts = Array.isArray(conflicts) && conflicts.length > 0;
		const hadConflictsForTask = this.#pullConflictsQueue.some((c) => c.taskId === taskId);

		const otherTasksConflicts = this.#pullConflictsQueue.filter((c) => c.taskId !== taskId);
		const priorConflictsForTask = this.#pullConflictsQueue.filter((c) => c.taskId === taskId);
		const freshConflictsForTask = hasConflicts
			? conflicts.map((c) => ({ ...c, taskId }))
			: [];

		// Once #serverTrees advances to the server value, a still-diverging local edit looks like a
		// one-sided change and stops being reported by the merge. Replacing the queue outright would
		// drop the pending conflict, and the next save (revision matches) would overwrite the server
		// value without a popup. Keep each prior conflict until it is provably moot — the item is gone,
		// or local converged to the current server value; an explicit resolution clears the queue itself.
		const freshKeys = new Set(freshConflictsForTask.map((c) => `${c.id}::${c.field}`));
		const localById = new Map(local.map((it) => [it.id, it]));
		const incomingById = new Map(incoming.map((it) => [it.id, it]));
		const carriedConflictsForTask = priorConflictsForTask.reduce((acc, c) => {
			if (freshKeys.has(`${c.id}::${c.field}`))
			{
				return acc;
			}

			const localItem = localById.get(c.id) ?? null;
			const incomingItem = incomingById.get(c.id) ?? null;
			if (!localItem && !incomingItem)
			{
				return acc;
			}

			if (c.field === 'title')
			{
				if (localItem && (!incomingItem || localItem.title !== incomingItem.title))
				{
					acc.push({ ...c, local: localItem.title, incoming: incomingItem ? incomingItem.title : c.incoming });
				}

				return acc;
			}

			acc.push(c);

			return acc;
		}, []);

		this.#pullConflictsQueue = [...otherTasksConflicts, ...freshConflictsForTask, ...carriedConflictsForTask];

		await this.#applyIncomingDelta(taskId, withParentCompletion, local);

		if (!Array.isArray(deferred) || deferred.length === 0)
		{
			this.#setRevisionAndTree(taskId, revision, incoming);
		}

		if (hasConflicts || hadConflictsForTask)
		{
			EventEmitter.emit('tasks:checkList:manualConflicts', { taskId, refreshOnly: true });
		}

		return true;
	}

	async #applyIncomingDelta(taskId: TaskId, merged: CheckListModel[], currentItems: CheckListModel[]): Promise<void>
	{
		const currentById = new Map((currentItems ?? []).map((it) => [it.id, it]));
		const currentIds = [...currentById.keys()];
		const mergedIds = merged.map((it) => it.id);
		const mergedIdSet = new Set(mergedIds);

		const toUpsert = merged.filter((item) => {
			const prev = currentById.get(item.id);

			return !prev || CheckListService.#checkListItemChanged(prev, item);
		});

		const removedIds = currentIds.filter((id) => !mergedIdSet.has(id));
		const addedIds = mergedIds.filter((id) => !currentById.has(id));

		const compositionChanged = addedIds.length > 0 || removedIds.length > 0;

		if (toUpsert.length === 0 && removedIds.length === 0 && !compositionChanged)
		{
			return;
		}

		const dispatches = [
			this.$store.dispatch(`${Model.Interface}/setDisableCheckListAnimations`, true),
		];
		if (toUpsert.length > 0)
		{
			dispatches.push(this.$store.dispatch(`${Model.CheckList}/upsertMany`, toUpsert));
		}
		if (removedIds.length > 0)
		{
			dispatches.push(this.$store.dispatch(`${Model.CheckList}/deleteMany`, removedIds));
		}
		await Promise.all(dispatches);

		const membersChanged = toUpsert.some((item) => {
			const prev = currentById.get(item.id);

			return !prev
				|| !memberSetsEqual(prev.accomplices, item.accomplices)
				|| !memberSetsEqual(prev.auditors, item.auditors);
		});

		if (compositionChanged || membersChanged)
		{
			await this.#updateTask(taskId, merged);
		}

		void this.$store.dispatch(`${Model.Interface}/setDisableCheckListAnimations`, false);
	}

	static #checkListItemChanged(prev: CheckListModel, next: CheckListModel): boolean
	{
		const SCALAR_FIELDS = [
			'title',
			'parentId',
			'parentNodeId',
			'sortIndex',
			'isImportant',
			'isComplete',
			'toggledDate',
		];

		for (const field of SCALAR_FIELDS)
		{
			if (prev[field] !== next[field])
			{
				return true;
			}
		}

		if ((prev.creator?.id ?? null) !== (next.creator?.id ?? null))
		{
			return true;
		}

		if ((prev.toggledBy?.id ?? null) !== (next.toggledBy?.id ?? null))
		{
			return true;
		}

		if (
			!memberSetsEqual(prev.accomplices, next.accomplices)
			|| !memberSetsEqual(prev.auditors, next.auditors)
			|| !memberSetsEqual(prev.attachments, next.attachments)
		)
		{
			return true;
		}

		const prevActions = prev.actions ?? {};
		const nextActions = next.actions ?? {};

		return prevActions.modify !== nextActions.modify
			|| prevActions.remove !== nextActions.remove
			|| prevActions.toggle !== nextActions.toggle;
	}

	getPullConflicts(): Array
	{
		return this.#pullConflictsQueue;
	}

	clearPullConflicts(taskId?: TaskId): void
	{
		if (taskId !== undefined && taskId !== null)
		{
			this.#pullConflictsQueue = this.#pullConflictsQueue.filter((c) => c.taskId !== taskId);
		}
		else
		{
			this.#pullConflictsQueue = [];
		}
	}

	async load(taskId: TaskId, cloneTo?: TaskId): Promise<void>
	{
		const task = taskService.getStoreTask(taskId);
		if (!idUtils.isReal(taskId) && task.templateId)
		{
			await this.load(idUtils.boxTemplate(task.templateId), taskId);

			return;
		}

		const toId = cloneTo ?? taskId;
		const pending = this.#getPromises[toId];
		if (pending)
		{
			await pending;

			return;
		}

		const promise = (async () => {
			const { revision, checklist: rawItems } = await this.#requestTree(taskId);

			let checkLists = rawItems.map((it) => mapDtoToModel(it));
			if (cloneTo)
			{
				checkLists = this.#clone(checkLists);
			}

			await this.#enqueueMerge(toId, async () => {
				const appliedRevision = this.#revisions[toId];
				if (
					!CheckListService.#isResponseComparable(appliedRevision, revision)
					|| CheckListService.#isAppliedNewerThanResponse(appliedRevision, revision)
				)
				{
					return;
				}

				await Promise.all([
					this.$store.dispatch(`${Model.CheckList}/upsertMany`, checkLists),
					taskService.updateStoreTask(toId, {
						containsChecklist: checkLists.length > 0,
						checklist: checkLists.map(({ id }) => id),
					}),
				]);
				this.#storeRevisionAndTree(toId, revision, rawItems);
			});
		})();

		this.#getPromises[toId] = promise;

		try
		{
			await promise;
		}
		finally
		{
			if (this.#getPromises[toId] === promise)
			{
				delete this.#getPromises[toId];
			}
		}
	}

	async #requestTree(taskId: TaskId): Promise<{ revision: string | void, checklist: Array }>
	{
		const isTemplate = idUtils.isTemplate(taskId);
		const urlCheckListGet = isTemplate ? 'Template.CheckList.get' : Endpoint.CheckListGet;
		const idKey = isTemplate ? 'templateId' : 'taskId';

		const response = await apiClient.post(urlCheckListGet, {
			[idKey]: idUtils.unbox(taskId),
		});

		if (Array.isArray(response))
		{
			return { revision: undefined, checklist: response };
		}

		return { revision: response.revision, checklist: response.checklist ?? [] };
	}

	// unlike load() this one may not discard unsaved local edits, so the response goes through the merge.
	// a tree already in the store proves nothing about entityId: it may predate the entity, so the check
	// is remembered for the pair and not for the task
	async refresh(taskId: TaskId, entityIds: number | number[]): Promise<void>
	{
		const entityChecks = this.#entityChecksOf(taskId);
		const normalizedEntityIds = Array.isArray(entityIds) ? entityIds : [entityIds];
		const checkKey = this.#getEntityCheckKey(normalizedEntityIds);
		const refreshPromises = this.#refreshPromises[taskId] ?? new Map();
		this.#refreshPromises[taskId] = refreshPromises;

		let promise = refreshPromises.get(checkKey);
		if (!promise)
		{
			promise = this.#startRefresh(taskId);
			refreshPromises.set(checkKey, promise);
		}

		let outcome;
		try
		{
			outcome = await promise;
		}
		finally
		{
			if (refreshPromises.get(checkKey) === promise)
			{
				refreshPromises.delete(checkKey);
			}
		}

		// a card closed while the request was in flight dropped its checks, and they say nothing about
		// the next opening, so a late response must not bring them back
		if (outcome === false || this.#checkedEntities[taskId] !== entityChecks)
		{
			return;
		}

		entityChecks.set(checkKey, this.#revisions[taskId]);
	}

	// resolves to false when the response proved nothing about the store — it could not be ordered
	// against the applied state, or the merge found no store task to apply it to
	#startRefresh(taskId: TaskId): Promise<boolean>
	{
		return this.#requestTree(taskId).then((response) => this.#applyRefreshedTree(taskId, response));
	}

	async #applyRefreshedTree(
		taskId: TaskId,
		response: { revision: string | void, checklist: Array },
	): Promise<boolean>
	{
		// the response is ordered against the applied revision inside the chain: a merge queued ahead
		// of this one may have already advanced the store past the response
		return this.#enqueueMerge(taskId, async () => {
			const appliedRevision = this.#revisions[taskId];
			if (!CheckListService.#isResponseComparable(appliedRevision, response.revision))
			{
				return false;
			}

			if (CheckListService.#isAppliedNewerThanResponse(appliedRevision, response.revision))
			{
				return true;
			}

			return this.#mergeIncomingTree(taskId, response.checklist, response.revision);
		});
	}

	// a versioned store cannot be ordered against a response that carries no revision
	static #isResponseComparable(appliedRevision: ?string, responseRevision: ?string): boolean
	{
		return Number.isNaN(Number.parseInt(appliedRevision, 10))
			|| !Number.isNaN(Number.parseInt(responseRevision, 10));
	}

	// the backend serializes revision as a monotonic counter, so ordering it is a numeric comparison
	static #isAppliedNewerThanResponse(appliedRevision: ?string, responseRevision: ?string): boolean
	{
		const applied = Number.parseInt(appliedRevision, 10);
		const response = Number.parseInt(responseRevision, 10);

		return !Number.isNaN(applied) && !Number.isNaN(response) && applied > response;
	}

	async ensureLoaded(taskId: TaskId): Promise<void>
	{
		const task = taskService.getStoreTask(taskId);
		if (!task?.containsChecklist)
		{
			return;
		}

		const checkListIds = task.checklist ?? [];
		const isComplete = checkListIds.length > 0 && checkListIds.every((checkListId) => {
			return Boolean(this.$store.getters[`${Model.CheckList}/getById`](checkListId));
		});

		if (!isComplete)
		{
			await this.load(taskId);
		}
	}

	#isCheckListDirty(taskId: TaskId, checklists: CheckListModel[]): boolean
	{
		const serverTree = this.#serverTrees[taskId];

		if (!Array.isArray(serverTree))
		{
			return true;
		}

		const serverMap = new Map(serverTree.map((it) => [it.id, it]));
		const localMap = new Map((checklists ?? []).map((it) => [it.id, it]));

		if (serverMap.size !== localMap.size)
		{
			return true;
		}
		for (const id of localMap.keys())
		{
			if (!serverMap.has(id))
			{
				return true;
			}
		}

		for (const [id, localItem] of localMap)
		{
			const serverItem = serverMap.get(id);

			for (const field of SEMANTIC_SCALAR_FIELDS)
			{
				if (localItem[field] !== serverItem[field])
				{
					return true;
				}
			}

			for (const field of MEMBER_FIELDS)
			{
				if (!memberSetsEqual(localItem[field], serverItem[field]))
				{
					return true;
				}
			}

			if (!memberSetsEqual(localItem[ATTACHMENT_FIELD], serverItem[ATTACHMENT_FIELD]))
			{
				return true;
			}
		}

		return false;
	}

	async save(taskId: number, checklists: CheckListModel[], skipNotification: boolean = false): Promise<{ hasDeferred: boolean }>
	{
		// eslint-disable-next-line no-param-reassign
		checklists = this.#excludeDeletingItems(checklists);

		if (this.#pullConflictsQueue.some((c) => c.taskId === taskId))
		{
			EventEmitter.emit('tasks:checkList:manualConflicts', { taskId });

			return { hasDeferred: false };
		}

		if (!this.#isCheckListDirty(taskId, checklists))
		{
			return { hasDeferred: false };
		}

		// eslint-disable-next-line no-async-promise-executor
		return new Promise(async (resolve, reject) => {
			try
			{
				const result = await this.#saveWithRetry(taskId, checklists, skipNotification, 0);
				resolve(result);
			}
			catch (error)
			{
				reject(error);
			}
		});
	}

	async #saveWithRetry(
		taskId: number,
		checklists: CheckListModel[],
		skipNotification: boolean,
		attempt: number,
	): Promise<{ hasDeferred: boolean }>
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

		let listToSend = checklists;
		if (!canOpenFullCard)
		{
			// todo remove after features.isV2Enabled === true
			listToSend = prepareTitleCheckLists(checklists);
		}

		const baseRevision = this.#revisions[taskId];
		const baseTree = this.#serverTrees[taskId] ?? [];
		const requestPayload = {
			[entity]: {
				id: idPure,
				checklist: prepareCheckLists(listToSend),
			},
			skipNotification,
		};

		if (baseRevision !== undefined)
		{
			requestPayload.baseRevision = baseRevision;
		}

		const response = await apiClient.post(urlCheckListSave, requestPayload);

		if (Array.isArray(response))
		{
			const checkLists = response.map((it) => mapDtoToModel(it));
			await this.#applyCheckListsToStore(taskId, checkLists);

			return { hasDeferred: false };
		}

		const { status, revision, checklist: responseChecklist } = response;

		if (status === 'conflict')
		{
			const incomingTree = responseChecklist.map((it) => mapDtoToModel(it));

			const { merged, conflicts: mergeConflicts, deferred } = mergeCheckLists(baseTree, checklists, incomingTree, {
				isFieldActive: (itemId, field) => activeFieldRegistry.isActive(itemId, field),
				...this.#resolveActionRights(taskId),
			});

			const hasDeferred = Array.isArray(deferred) && deferred.length > 0;

			if (hasDeferred)
			{
				this.#setRevisionAndTree(taskId, undefined, this.#holdDeferredFields(incomingTree, baseTree, deferred));
			}
			else
			{
				this.#storeRevisionAndTree(taskId, revision, responseChecklist);
			}

			if (Array.isArray(mergeConflicts) && mergeConflicts.length > 0)
			{
				const queueMap = new Map(
					this.#pullConflictsQueue.map((c) => [`${c.taskId}::${c.id}::${c.field}`, c]),
				);
				mergeConflicts.forEach((c) => {
					queueMap.set(`${taskId}::${c.id}::${c.field}`, { ...c, taskId });
				});
				this.#pullConflictsQueue = [...queueMap.values()];

				await this.#applyCheckListsToStore(taskId, merged);

				EventEmitter.emit('tasks:checkList:manualConflicts', { taskId });

				return { hasDeferred: false };
			}

			if (hasDeferred)
			{
				await this.#applyCheckListsToStore(taskId, merged);

				return { hasDeferred: true };
			}

			if (attempt >= CONFLICT_MAX_RETRIES)
			{
				await this.#notifyRetryExhausted();

				throw new Error(Loc.getMessage('TASKS_V2_CHECK_LIST_SERVICE_SYNC_FAILED'));
			}

			await this.#applyCheckListsToStore(taskId, merged);

			const delay = CONFLICT_RETRY_BASE_DELAY_MS * (2 ** attempt);
			await new Promise((resolve) => {
				setTimeout(resolve, delay);
			});

			return this.#saveWithRetry(taskId, merged, skipNotification, attempt + 1);
		}

		if (this.#revisions[taskId] !== baseRevision)
		{
			return { hasDeferred: false };
		}

		this.#storeRevisionAndTree(taskId, revision, responseChecklist);

		const checkLists = (responseChecklist ?? []).map((it) => mapDtoToModel(it));
		await this.#applyCheckListsToStore(taskId, checkLists);

		this.clearPullConflicts(taskId);

		return { hasDeferred: false };
	}

	async #applyCheckListsToStore(taskId: number, checkLists: CheckListModel[]): Promise<void>
	{
		const task = taskService.getStoreTask(taskId);
		const nextIdSet = new Set(checkLists.map((item) => item.id));
		const removedIds = (task?.checklist ?? []).filter((id) => !nextIdSet.has(id));

		const dispatches = [
			this.$store.dispatch(`${Model.Interface}/setDisableCheckListAnimations`, true),
			this.$store.dispatch(`${Model.CheckList}/upsertMany`, checkLists),
		];
		if (removedIds.length > 0)
		{
			dispatches.push(this.$store.dispatch(`${Model.CheckList}/deleteMany`, removedIds));
		}
		await Promise.all(dispatches);

		await this.#updateTask(taskId, checkLists);

		void this.$store.dispatch(`${Model.Interface}/setDisableCheckListAnimations`, false);
	}

	async #notifyRetryExhausted(): Promise<void>
	{
		const { UI } = await Runtime.loadExtension('ui.notification');

		UI.Notification.Center.notify({
			content: Loc.getMessage('TASKS_V2_CHECK_LIST_SERVICE_SYNC_FAILED'),
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
		await this.#changeStatus(taskId, checkListId, true);
	}

	async renew(taskId: number, checkListId: number): Promise<void>
	{
		await this.#changeStatus(taskId, checkListId, false);
	}

	async #changeStatus(taskId: number, checkListId: number, isComplete: boolean): Promise<void>
	{
		await this.#waitForInFlightBatches(taskId);

		const [batch, oppositeBatch] = isComplete
			? [this.#completeBatch, this.#renewBatch]
			: [this.#renewBatch, this.#completeBatch];

		const originalState = this.#getOriginalState(taskId, checkListId, batch, oppositeBatch);
		await this.$store.dispatch(`${Model.CheckList}/update`, {
			id: checkListId,
			fields: { isComplete },
		});

		oppositeBatch.remove(taskId, checkListId);

		await batch.add(taskId, checkListId, originalState).catch(() => {});
	}

	async delete(taskId: number, checkListId: number): Promise<void>
	{
		const task = taskService.getStoreTask(taskId);
		const checklists = this.$store.getters[`${Model.CheckList}/getByIds`](task.checklist);
		await this.save(taskId, checklists);
	}

	async #completeCheckLists(taskId: number): Promise<void>
	{
		const url = idUtils.isTemplate(taskId) ? 'Template.CheckList.complete' : Endpoint.CheckListComplete;

		await this.#sendBatch(taskId, this.#completeBatch, url, true);
	}

	async #renewCheckLists(taskId: number): Promise<void>
	{
		const url = idUtils.isTemplate(taskId) ? 'Template.CheckList.renew' : Endpoint.CheckListRenew;

		await this.#sendBatch(taskId, this.#renewBatch, url, false);
	}

	async #sendBatch(taskId: number, batch: StatusBatch, url: string, isComplete: boolean): Promise<void>
	{
		const { checkListIds, originalStates, promise } = batch.takePending(taskId);
		if (!checkListIds || checkListIds.size === 0)
		{
			promise?.resolve();

			return;
		}

		batch.markInFlight(taskId, promise);

		try
		{
			const checkLists = [...checkListIds].map((checkListId) => this.#getById(checkListId));

			await apiClient.post(url, {
				[idUtils.isTemplate(taskId) ? 'template' : 'task']: {
					id: idUtils.unbox(taskId),
					checklist: prepareCheckLists(checkLists),
				},
			});

			promise?.resolve();
		}
		catch (error)
		{
			try
			{
				await this.#restoreOriginalStates(originalStates, isComplete);
			}
			finally
			{
				promise?.reject(error);
			}
		}
		finally
		{
			batch.clearInFlight(taskId, promise);
		}
	}

	#excludeDeletingItems(checkLists: CheckListModel[]): CheckListModel[]
	{
		const deletingMap = this.$store.getters[`${Model.Interface}/deletingCheckListIds`] ?? {};
		const deletingIds = new Set(Object.values(deletingMap));

		if (deletingIds.size === 0)
		{
			return checkLists;
		}

		const queue = [...deletingIds];

		while (queue.length > 0)
		{
			const parentId = queue.shift();
			checkLists.forEach((item: CheckListModel) => {
				if (!deletingIds.has(item.id) && item.parentId === parentId)
				{
					deletingIds.add(item.id);
					queue.push(item.id);
				}
			});
		}

		return checkLists.filter((item: CheckListModel) => !deletingIds.has(item.id));
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

	async forceCompletePending(taskId: number, options: { rejectOnError?: boolean } = {}): Promise<void>
	{
		await this.#forcePendingBatch(
			taskId,
			this.#completeBatch,
			() => this.#completeCheckLists(taskId),
			options.rejectOnError === true,
		);
	}

	async forceRenewPending(taskId: number, options: { rejectOnError?: boolean } = {}): Promise<void>
	{
		await this.#forcePendingBatch(
			taskId,
			this.#renewBatch,
			() => this.#renewCheckLists(taskId),
			options.rejectOnError === true,
		);
	}

	async #forcePendingBatch(
		taskId: number,
		batch: StatusBatch,
		send: () => Promise<void>,
		rejectOnError: boolean,
	): Promise<void>
	{
		const promises = [];
		const inFlight = batch.getInFlight(taskId);
		if (inFlight)
		{
			promises.push(inFlight);
		}

		if (batch.getPendingSize(taskId) > 0)
		{
			promises.push(batch.getPromise(taskId));
			await send();
		}

		await this.#waitForBatches(promises, rejectOnError);
	}

	async forceSavePending(taskId: number, options: { rejectOnError?: boolean } = {}): Promise<void>
	{
		await Promise.all([
			this.forceCompletePending(taskId, options),
			this.forceRenewPending(taskId, options),
		]);
	}

	async #waitForBatches(promises: Promise<void>[], rejectOnError: boolean): Promise<void>
	{
		if (rejectOnError)
		{
			await Promise.all(promises);

			return;
		}

		await Promise.all(promises.map((promise) => promise.catch(() => {})));
	}

	async #waitForInFlightBatches(taskId: number): Promise<void>
	{
		await this.#waitForBatches([
			this.#completeBatch.getInFlight(taskId),
			this.#renewBatch.getInFlight(taskId),
		].filter(Boolean), false);
	}

	#getOriginalState(
		taskId: number,
		checkListId: number,
		batch: StatusBatch,
		oppositeBatch: StatusBatch,
	): boolean
	{
		return batch.getOriginalState(taskId, checkListId)
			?? oppositeBatch.getOriginalState(taskId, checkListId)
			?? Boolean(this.#getById(checkListId)?.isComplete)
		;
	}

	async #restoreOriginalStates(originalStates: Map<number, boolean>, optimisticState: boolean): Promise<void>
	{
		await Promise.all([...originalStates].map(async ([checkListId, isComplete]) => {
			if (this.#getById(checkListId)?.isComplete !== optimisticState)
			{
				return;
			}

			await this.$store.dispatch(`${Model.CheckList}/update`, {
				id: checkListId,
				fields: { isComplete },
			});
		}));
	}

	async forceSaveAllPending(): Promise<void>
	{
		const allTaskIds = new Set([
			...this.#completeBatch.getTaskIds(),
			...this.#renewBatch.getTaskIds(),
		]);

		await Promise.all([...allTaskIds].map((taskId) => this.forceSavePending(taskId)));
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
