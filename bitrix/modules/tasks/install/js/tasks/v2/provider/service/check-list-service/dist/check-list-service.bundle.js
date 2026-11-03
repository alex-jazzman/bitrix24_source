/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Provider = this.BX.Tasks.V2.Provider || {};
(function (exports, tasks_v2_model_users, tasks_v2_provider_service_userService, main_core, main_core_events, tasks_v2_core, tasks_v2_const, tasks_v2_lib_apiClient, tasks_v2_lib_idUtils, tasks_v2_provider_service_taskService) {
	'use strict';

	function prepareCheckLists(checklist) {
		const parentNodeIdMap = new Map();
		checklist.forEach(item => {
			parentNodeIdMap.set(item.id, item.nodeId);
		});
		return checklist.map(item => {
			const parentNodeId = item.parentId ? parentNodeIdMap.get(item.parentId) : 0;
			const isComplete = item.localCompleteState ?? item.isComplete;
			return {
				...item,
				parentNodeId,
				isComplete
			};
		});
	}

	// todo remove after features.isV2Enabled === true
	function prepareTitleCheckLists(checklist) {
		return checklist.map(item => {
			const title = prepareTitle(item);
			return {
				...item,
				title
			};
		});
	}
	function mapDtoToModel(checkList) {
		return {
			id: checkList.id,
			nodeId: checkList.nodeId,
			title: checkList.title,
			creator: checkList.creator ? tasks_v2_provider_service_userService.UserMappers.mapDtoToModel(checkList.creator) : null,
			toggledBy: checkList.toggledBy ? tasks_v2_provider_service_userService.UserMappers.mapDtoToModel(checkList.toggledBy) : null,
			toggledDate: checkList.toggledDate,
			accomplices: checkList.accomplices?.map(it => tasks_v2_provider_service_userService.UserMappers.mapDtoToModel(it)),
			auditors: checkList.auditors?.map(it => tasks_v2_provider_service_userService.UserMappers.mapDtoToModel(it)),
			attachments: checkList.attachments,
			isComplete: checkList.isComplete,
			isImportant: checkList.isImportant,
			parentId: checkList.parentId,
			parentNodeId: checkList.parentNodeId,
			sortIndex: checkList.sortIndex,
			actions: checkList.actions,
			panelIsShown: checkList.panelIsShown,
			myFilterActive: checkList.myFilterActive,
			collapsed: checkList.collapsed,
			expanded: checkList.expanded,
			localCompleteState: checkList.localCompleteState,
			localCollapsedState: checkList.localCollapsedState,
			areCompletedCollapsed: checkList.areCompletedCollapsed,
			hidden: checkList.hidden,
			groupMode: checkList.groupMode
		};
	}
	function mapModelToSliderData(checkLists) {
		return Object.fromEntries(checkLists.map(item => {
			const accomplices = item.accomplices?.map(accomplice => ({
				ID: accomplice.id,
				TYPE: 'A',
				NAME: accomplice.name,
				IMAGE: accomplice.image,
				IS_COLLABER: accomplice.type === tasks_v2_model_users.UserTypes.Collaber ? 1 : ''
			}));
			const auditors = item.auditors?.map(auditor => ({
				ID: auditor.id,
				TYPE: 'U',
				NAME: auditor.name,
				IMAGE: auditor.image,
				IS_COLLABER: auditor.type === tasks_v2_model_users.UserTypes.Collaber ? 1 : ''
			}));
			const attachments = Object.fromEntries(item.attachments?.map(key => [key, key]));
			const members = [...accomplices, ...auditors].reduce((acc, curr) => {
				acc[curr.ID] = curr;
				return acc;
			}, {});
			const title = prepareTitle(item);
			const node = Object.fromEntries(Object.entries({
				NODE_ID: item.nodeId,
				TITLE: title,
				CREATED_BY: item.creator?.id,
				TOGGLED_BY: item.toggledBy?.id,
				TOGGLED_DATE: item.toggledDate,
				MEMBERS: members,
				NEW_FILE_IDS: attachments,
				ATTACHMENTS: attachments,
				IS_COMPLETE: item.isComplete,
				IS_IMPORTANT: item.isImportant,
				PARENT_ID: item.parentId,
				SORT_INDEX: item.sortIndex,
				ACTIONS: {
					MODIFY: item.actions.modify,
					REMOVE: item.actions.remove,
					TOGGLE: item.actions.toggle
				}
			}).filter(([, value]) => value !== null && value !== undefined));
			return [item.nodeId, node];
		}));
	}
	function getUserIdsFromChecklists(checkLists, userType) {
		return checkLists.flatMap(item => (item[userType] || []).map(user => user.id)).filter((id, idx, arr) => arr.indexOf(id) === idx);
	}
	function prepareTitle(item) {
		const names = [...(item.accomplices ?? []).map(member => member.name), ...(item.auditors ?? []).map(member => member.name)].join(' ');
		if (names) {
			return `${item.title} ${names}`;
		}
		return item.title;
	}

	const DebounceDelay = 1500;
	/**
	 * Per-task queue of checklist items waiting for one status endpoint (complete or renew).
	 * Keeps the pending ids, the states to roll back to and the promise callers await, so that
	 * the two opposite operations do not have to juggle parallel maps.
	 */
	class StatusBatch {
		#flush;
		#checkListIds = {};
		#originalStates = {};
		#promises = {};
		#inFlightPromises = {};
		#debounced = {};
		constructor(flush) {
			this.#flush = flush;
		}
		add(taskId, checkListId, originalState) {
			this.#checkListIds[taskId] ??= new Set();
			this.#checkListIds[taskId].add(checkListId);
			this.#originalStates[taskId] ??= new Map();
			this.#originalStates[taskId].set(checkListId, originalState);
			this.#promises[taskId] ??= new Resolvable();
			this.#debounced[taskId] ??= main_core.Runtime.debounce(this.#flush, DebounceDelay);
			this.#debounced[taskId](taskId);
			return this.#promises[taskId];
		}
		remove(taskId, checkListId) {
			const checkListIds = this.#checkListIds[taskId];
			if (!checkListIds?.delete(checkListId)) {
				return;
			}
			this.#originalStates[taskId]?.delete(checkListId);
			if (this.#originalStates[taskId]?.size === 0) {
				delete this.#originalStates[taskId];
			}
			if (checkListIds.size > 0) {
				return;
			}
			delete this.#checkListIds[taskId];
			const promise = this.#promises[taskId];
			delete this.#promises[taskId];
			promise?.resolve();
		}
		takePending(taskId) {
			const checkListIds = this.#checkListIds[taskId];
			delete this.#checkListIds[taskId];
			const originalStates = this.#originalStates[taskId] ?? new Map();
			delete this.#originalStates[taskId];
			const promise = this.#promises[taskId];
			delete this.#promises[taskId];
			return {
				checkListIds,
				originalStates,
				promise
			};
		}
		getOriginalState(taskId, checkListId) {
			return this.#originalStates[taskId]?.get(checkListId);
		}
		getPendingSize(taskId) {
			return this.#checkListIds[taskId]?.size ?? 0;
		}
		getPromise(taskId) {
			return this.#promises[taskId];
		}
		markInFlight(taskId, promise) {
			this.#inFlightPromises[taskId] = promise;
		}
		clearInFlight(taskId, promise) {
			if (this.#inFlightPromises[taskId] === promise) {
				delete this.#inFlightPromises[taskId];
			}
		}
		getInFlight(taskId) {
			return this.#inFlightPromises[taskId];
		}
		getTaskIds() {
			return Object.keys(this.#checkListIds).map(Number);
		}
	}
	function Resolvable() {
		const promise = new Promise((resolve, reject) => {
			this.resolve = resolve;
			this.reject = reject;
		});
		promise.resolve = this.resolve;
		promise.reject = this.reject;
		return promise;
	}

	const SEMANTIC_SCALAR_FIELDS = ['title', 'parentId', 'sortIndex', 'isImportant', 'isComplete'];
	const MEMBER_FIELDS = ['accomplices', 'auditors'];
	const ATTACHMENT_FIELD = 'attachments';
	const CARRIED_LOCAL_FIELDS = ['actions', 'panelIsShown', 'myFilterActive', 'collapsed', 'expanded', 'localCollapsedState', 'areCompletedCollapsed', 'hidden', 'groupMode'];
	function carryLocalFields(target, localItem) {
		CARRIED_LOCAL_FIELDS.forEach(field => {
			if (target[field] !== undefined && target[field] !== null) {
				return;
			}
			if (localItem && localItem[field] !== undefined && localItem[field] !== null) {
				target[field] = localItem[field];
			} else {
				delete target[field];
			}
		});
		return target;
	}
	function reconcileLocalCompleteState(merged, localItem, id, isFieldActive) {
		const localValue = localItem ? localItem.localCompleteState : undefined;
		if (isFieldActive(id, 'isComplete') && localValue !== undefined && localValue !== null) {
			merged.localCompleteState = localValue;
		} else {
			merged.localCompleteState = null;
		}
	}
	function indexById(items) {
		const map = new Map();
		items.forEach(item => {
			map.set(item.id, item);
		});
		return map;
	}
	function memberSetsEqual(a, b) {
		const aIds = new Set((a ?? []).map(u => u.id));
		const bIds = new Set((b ?? []).map(u => u.id));
		if (aIds.size !== bIds.size) {
			return false;
		}
		for (const id of aIds) {
			if (!bIds.has(id)) {
				return false;
			}
		}
		return true;
	}
	function attachmentSetsEqual(a, b) {
		return memberSetsEqual(a, b);
	}
	function scalarChanged(base, candidate, field) {
		const baseVal = base ? base[field] : undefined;
		return baseVal !== candidate[field];
	}
	function resolveIncomingActions(incomingItem, options, localCanToggle = false) {
		const creatorId = incomingItem?.creator?.id ?? null;
		const canEdit = options.checklistEdit === true || creatorId !== null && creatorId === options.currentUserId;
		return {
			modify: canEdit,
			remove: canEdit,
			toggle: options.checklistToggle === true || localCanToggle === true
		};
	}
	function mergeCheckLists(base, local, incoming, options = {}) {
		const isFieldActive = typeof options.isFieldActive === 'function' ? options.isFieldActive : () => false;
		const baseMap = indexById(base ?? []);
		const localMap = indexById(local ?? []);
		const incomingMap = indexById(incoming ?? []);
		const localCanToggle = [...localMap.values()].some(it => it?.actions?.toggle === true);
		const conflicts = [];
		const deferred = [];
		const allIds = new Set([...baseMap.keys(), ...localMap.keys(), ...incomingMap.keys()]);
		const mergedMap = new Map();
		allIds.forEach(id => {
			const baseItem = baseMap.get(id) ?? null;
			const localItem = localMap.get(id) ?? null;
			const incomingItem = incomingMap.get(id) ?? null;
			if (!incomingItem && localItem && baseItem) {
				const localChanged = SEMANTIC_SCALAR_FIELDS.some(f => scalarChanged(baseItem, localItem, f)) || !memberSetsEqual(baseItem.accomplices, localItem.accomplices) || !memberSetsEqual(baseItem.auditors, localItem.auditors) || !attachmentSetsEqual(baseItem.attachments, localItem.attachments);
				if (localChanged) {
					conflicts.push({
						id,
						field: 'deleted',
						base: baseItem,
						local: localItem,
						incoming: null,
						resolution: 'MANUAL'
					});
					mergedMap.set(id, localItem);
				}
				return;
			}
			if (!localItem && incomingItem && baseItem) {
				const incomingChanged = SEMANTIC_SCALAR_FIELDS.some(f => scalarChanged(baseItem, incomingItem, f)) || !memberSetsEqual(baseItem.accomplices, incomingItem.accomplices) || !memberSetsEqual(baseItem.auditors, incomingItem.auditors) || !attachmentSetsEqual(baseItem.attachments, incomingItem.attachments);
				if (incomingChanged) {
					conflicts.push({
						id,
						field: 'deleted',
						base: baseItem,
						local: null,
						incoming: incomingItem,
						resolution: 'MANUAL'
					});
					mergedMap.set(id, carryLocalFields({
						...incomingItem
					}, null));
				}
				return;
			}
			if (!incomingItem && !baseItem && localItem) {
				mergedMap.set(id, localItem);
				return;
			}
			if (!localItem && !baseItem && incomingItem) {
				const newItem = carryLocalFields({
					...incomingItem
				}, null);
				if (newItem.actions === undefined) {
					newItem.actions = resolveIncomingActions(incomingItem, options, localCanToggle);
				}
				mergedMap.set(id, newItem);
				return;
			}
			if (!localItem && !incomingItem) {
				return;
			}
			if (!baseItem && localItem && incomingItem) {
				const merged = carryLocalFields({
					...incomingItem
				}, localItem);
				reconcileLocalCompleteState(merged, localItem, id, isFieldActive);
				mergedMap.set(id, merged);
				return;
			}
			const merged = {
				...incomingItem
			};
			SEMANTIC_SCALAR_FIELDS.forEach(field => {
				const localChanged = scalarChanged(baseItem, localItem, field);
				const incomingChanged = scalarChanged(baseItem, incomingItem, field);
				const divergentConflict = localChanged && incomingChanged && localItem[field] !== incomingItem[field];
				if (field === 'title' && divergentConflict) {
					conflicts.push({
						id,
						field: 'title',
						base: baseItem[field],
						local: localItem[field],
						incoming: incomingItem[field],
						resolution: 'MANUAL'
					});
					merged[field] = localItem[field];
					return;
				}
				if (incomingChanged && isFieldActive(id, field)) {
					merged[field] = localItem[field];
					deferred.push({
						id,
						field,
						value: incomingItem[field]
					});
					return;
				}
				if (divergentConflict) {
					merged[field] = incomingItem[field];
				} else if (localChanged && !incomingChanged) {
					merged[field] = localItem[field];
				}
			});
			MEMBER_FIELDS.forEach(field => {
				const localChanged = !memberSetsEqual(baseItem[field], localItem[field]);
				const incomingChanged = !memberSetsEqual(baseItem[field], incomingItem[field]);
				if (localChanged && !incomingChanged) {
					merged[field] = localItem[field];
				}
			});
			const baseAtts = baseItem[ATTACHMENT_FIELD] ?? [];
			const localAtts = localItem[ATTACHMENT_FIELD] ?? [];
			const incomingAtts = incomingItem[ATTACHMENT_FIELD] ?? [];
			const baseIds = new Set(baseAtts.map(a => a.id));
			const localIds = new Set(localAtts.map(a => a.id));
			const incomingIds = new Set(incomingAtts.map(a => a.id));
			const localAdded = localAtts.filter(a => !baseIds.has(a.id));
			const incomingAdded = incomingAtts.filter(a => !baseIds.has(a.id));
			const localRemoved = baseAtts.filter(a => !localIds.has(a.id));
			const incomingRemoved = baseAtts.filter(a => !incomingIds.has(a.id));
			const localAttsChanged = localAdded.length > 0 || localRemoved.length > 0;
			const incomingAttsChanged = incomingAdded.length > 0 || incomingRemoved.length > 0;
			const removalConflict = localAttsChanged && incomingAttsChanged && (localRemoved.some(a => incomingIds.has(a.id)) || incomingRemoved.some(a => localIds.has(a.id)));
			if (removalConflict) {
				conflicts.push({
					id,
					field: ATTACHMENT_FIELD,
					base: baseAtts,
					local: localAtts,
					incoming: incomingAtts,
					resolution: 'MANUAL'
				});
				merged[ATTACHMENT_FIELD] = incomingAtts;
			} else {
				const removedIds = new Set([...localRemoved, ...incomingRemoved].map(a => a.id));
				const attById = new Map();
				baseAtts.forEach(a => attById.set(a.id, a));
				localAtts.forEach(a => attById.set(a.id, a));
				incomingAtts.forEach(a => attById.set(a.id, a));
				const resultIds = new Set([...baseAtts.map(a => a.id).filter(attId => !removedIds.has(attId)), ...localAdded.map(a => a.id), ...incomingAdded.map(a => a.id)]);
				merged[ATTACHMENT_FIELD] = [...resultIds].map(attId => attById.get(attId));
			}
			carryLocalFields(merged, localItem);
			reconcileLocalCompleteState(merged, localItem, id, isFieldActive);
			mergedMap.set(id, merged);
		});
		const appendDescendants = (rootIds, sourceMap) => {
			if (rootIds.length === 0) {
				return;
			}
			const childrenByParent = new Map();
			sourceMap.forEach(it => {
				const siblings = childrenByParent.get(it.parentId) ?? [];
				siblings.push(it);
				childrenByParent.set(it.parentId, siblings);
			});
			const stack = [...rootIds];
			while (stack.length > 0) {
				const parentId = stack.pop();
				(childrenByParent.get(parentId) ?? []).forEach(child => {
					if (!mergedMap.has(child.id)) {
						mergedMap.set(child.id, carryLocalFields({
							...child
						}, localMap.get(child.id) ?? null));
					}
					stack.push(child.id);
				});
			}
		};
		const keptDeletedConflicts = conflicts.filter(c => c.field === 'deleted');
		appendDescendants(keptDeletedConflicts.filter(c => c.local !== null).map(c => c.id), localMap);
		appendDescendants(keptDeletedConflicts.filter(c => c.local === null && c.incoming !== null).map(c => c.id), incomingMap);
		return {
			merged: [...mergedMap.values()],
			conflicts,
			deferred
		};
	}
	function deriveParentCompletion(items, options = {}) {
		const isFieldActive = typeof options.isFieldActive === 'function' ? options.isFieldActive : () => false;
		const byId = indexById(items ?? []);
		const childIds = new Map();
		(items ?? []).forEach(item => {
			const siblings = childIds.get(item.parentId) ?? [];
			siblings.push(item.id);
			childIds.set(item.parentId, siblings);
		});
		const depthCache = new Map();
		const depthOf = item => {
			if (depthCache.has(item.id)) {
				return depthCache.get(item.id);
			}
			const path = [];
			const visited = new Set();
			let current = item;
			while (current && current.parentId && !depthCache.has(current.id) && !visited.has(current.id)) {
				path.push(current);
				visited.add(current.id);
				current = byId.get(current.parentId);
			}
			let depth = current && depthCache.has(current.id) ? depthCache.get(current.id) : 0;
			for (let index = path.length - 1; index >= 0; index--) {
				depth++;
				depthCache.set(path[index].id, depth);
			}
			return depthCache.get(item.id) ?? 0;
		};
		const parents = (items ?? []).filter(item => childIds.has(item.id)).sort((a, b) => depthOf(b) - depthOf(a));
		parents.forEach(parent => {
			if (isFieldActive(parent.id, 'isComplete')) {
				return;
			}
			const children = (childIds.get(parent.id) ?? []).map(id => byId.get(id));
			if (children.length === 0) {
				return;
			}
			const allComplete = children.every(child => child.localCompleteState ?? child.isComplete);
			const currentParent = byId.get(parent.id);
			if ((currentParent.isComplete ?? false) !== allComplete) {
				byId.set(parent.id, {
					...currentParent,
					isComplete: allComplete
				});
			}
		});
		return (items ?? []).map(item => byId.get(item.id));
	}

	class ActiveFieldRegistry {
		#registry = new Map();
		#key(itemId, field) {
			return `${itemId}:${field}`;
		}
		register(itemId, field) {
			const k = this.#key(itemId, field);
			this.#registry.set(k, (this.#registry.get(k) ?? 0) + 1);
		}
		release(itemId, field) {
			const k = this.#key(itemId, field);
			const count = this.#registry.get(k) ?? 0;
			if (count <= 1) {
				this.#registry.delete(k);
			} else {
				this.#registry.set(k, count - 1);
			}
		}
		isActive(itemId, field) {
			return this.#registry.has(this.#key(itemId, field));
		}
	}
	const activeFieldRegistry = new ActiveFieldRegistry();

	const CONFLICT_MAX_RETRIES = 3;
	const CONFLICT_RETRY_BASE_DELAY_MS = 300;
	class CheckListService {
		#getPromises = {};
		#refreshPromises = {};
		#completeBatch = new StatusBatch(taskId => this.#completeCheckLists(taskId));
		#renewBatch = new StatusBatch(taskId => this.#renewCheckLists(taskId));
		#revisions = {};
		#serverTrees = {};
		#checkedEntities = {};
		#mergeChains = {};
		#pullConflictsQueue = [];
		constructor() {
			main_core.Event.bind(window, 'beforeunload', this.handleBeforeUnload);
			main_core_events.EventEmitter.subscribe(tasks_v2_const.EventName.CardClosed, this.#handleCardClosed);
			main_core_events.EventEmitter.subscribe(tasks_v2_const.EventName.FullCardClosed, this.#handleCardClosed);
		}
		handleBeforeUnload = () => {
			void this.forceSaveAllPending();
		};
		#handleCardClosed = event => {
			const taskId = event?.getData()?.taskId;
			if (taskId !== undefined && taskId !== null) {
				this.clearTask(taskId);
			}
		};
		clearTask(taskId) {
			delete this.#revisions[taskId];
			delete this.#serverTrees[taskId];
			delete this.#checkedEntities[taskId];
			delete this.#getPromises[taskId];
			delete this.#refreshPromises[taskId];
			this.clearPullConflicts(taskId);
		}
		#storeRevisionAndTree(taskId, revision, checklist) {
			if (revision !== undefined && revision !== null) {
				this.#revisions[taskId] = revision;
			}
			if (Array.isArray(checklist)) {
				this.#serverTrees[taskId] = checklist.map(it => mapDtoToModel(it));
			}
		}
		#setRevisionAndTree(taskId, revision, mappedTree) {
			if (revision !== undefined && revision !== null) {
				this.#revisions[taskId] = revision;
			}
			if (Array.isArray(mappedTree)) {
				this.#serverTrees[taskId] = mappedTree;
			}
		}
		#holdDeferredFields(incomingTree, baseTree, deferred) {
			const heldFields = new Map();
			deferred.forEach(({
				id,
				field
			}) => {
				if (!heldFields.has(id)) {
					heldFields.set(id, new Set());
				}
				heldFields.get(id).add(field);
			});
			const baseById = new Map((baseTree ?? []).map(it => [it.id, it]));
			return incomingTree.map(item => {
				const fields = heldFields.get(item.id);
				const baseItem = baseById.get(item.id);
				if (!fields || !baseItem) {
					return item;
				}
				const held = {
					...item
				};
				fields.forEach(field => {
					held[field] = baseItem[field];
				});
				return held;
			});
		}
		getRevision(taskId) {
			return this.#revisions[taskId];
		}

		// an empty store means "no checklists" only for a task whose tree already came from the server
		hasServerTree(taskId) {
			return Array.isArray(this.#serverTrees[taskId]);
		}
		initializeFromStore(taskId, checklist) {
			if (this.hasServerTree(taskId) || !Array.isArray(checklist)) {
				return;
			}
			this.#storeRevisionAndTree(taskId, undefined, checklist);
		}

		// a tree loaded earlier may already be behind, so only a check at the current revision proves that
		// the entity is missing from the server tree; without a revision nothing can be proven at all.
		// the revision moves only with pull, so a check of one entity says nothing about another one
		hasCheckedEntity(taskId, entityId) {
			return this.hasCheckedEntities(taskId, [entityId]);
		}
		hasCheckedEntities(taskId, entityIds) {
			const revision = this.#revisions[taskId];
			if (revision === undefined || revision === null || !this.hasServerTree(taskId)) {
				return false;
			}
			return this.#checkedEntities[taskId]?.get(this.#getEntityCheckKey(entityIds)) === revision;
		}
		#entityChecksOf(taskId) {
			if (!this.#checkedEntities[taskId]) {
				this.#checkedEntities[taskId] = new Map();
			}
			return this.#checkedEntities[taskId];
		}
		#getEntityCheckKey(entityIds) {
			return [...new Set(entityIds)].sort((a, b) => a - b).join(':');
		}
		#resolveActionRights(taskId) {
			const rights = tasks_v2_provider_service_taskService.taskService.getStoreTask(taskId)?.rights ?? {};
			return {
				currentUserId: this.$store.getters[`${tasks_v2_const.Model.Interface}/currentUserId`],
				checklistEdit: rights.checklistEdit === true,
				checklistToggle: rights.checklistToggle === true
			};
		}
		async applyIncomingTree(taskId, incomingDto, revision) {
			await this.#enqueueMerge(taskId, () => this.#mergeIncomingTree(taskId, incomingDto, revision));
		}

		// pull and refresh merge into the same base, so their merges run one after another per task:
		// otherwise both read the base before either writes it back, and the older answer wins the race
		#enqueueMerge(taskId, merge) {
			const chained = (this.#mergeChains[taskId] ?? Promise.resolve()).then(merge, merge);
			this.#mergeChains[taskId] = chained;
			const release = () => {
				if (this.#mergeChains[taskId] === chained) {
					delete this.#mergeChains[taskId];
				}
			};
			void chained.then(release, release);
			return chained;
		}

		// resolves to false when there is no store task to merge into, so nothing about it was proven
		async #mergeIncomingTree(taskId, incomingDto, revision) {
			const task = tasks_v2_provider_service_taskService.taskService.getStoreTask(taskId);
			if (!task) {
				return false;
			}
			const base = this.#serverTrees[taskId] ?? [];
			const getById = this.$store.getters[`${tasks_v2_const.Model.CheckList}/getById`];
			const local = (task.checklist ?? []).map(id => getById(id)).filter(Boolean);
			const incoming = (incomingDto ?? []).map(it => mapDtoToModel(it));
			const {
				merged,
				conflicts,
				deferred
			} = mergeCheckLists(base, local, incoming, {
				isFieldActive: (itemId, field) => activeFieldRegistry.isActive(itemId, field),
				...this.#resolveActionRights(taskId)
			});
			const withParentCompletion = deriveParentCompletion(merged, {
				isFieldActive: (itemId, field) => activeFieldRegistry.isActive(itemId, field)
			});
			const hasConflicts = Array.isArray(conflicts) && conflicts.length > 0;
			const hadConflictsForTask = this.#pullConflictsQueue.some(c => c.taskId === taskId);
			const otherTasksConflicts = this.#pullConflictsQueue.filter(c => c.taskId !== taskId);
			const priorConflictsForTask = this.#pullConflictsQueue.filter(c => c.taskId === taskId);
			const freshConflictsForTask = hasConflicts ? conflicts.map(c => ({
				...c,
				taskId
			})) : [];

			// Once #serverTrees advances to the server value, a still-diverging local edit looks like a
			// one-sided change and stops being reported by the merge. Replacing the queue outright would
			// drop the pending conflict, and the next save (revision matches) would overwrite the server
			// value without a popup. Keep each prior conflict until it is provably moot — the item is gone,
			// or local converged to the current server value; an explicit resolution clears the queue itself.
			const freshKeys = new Set(freshConflictsForTask.map(c => `${c.id}::${c.field}`));
			const localById = new Map(local.map(it => [it.id, it]));
			const incomingById = new Map(incoming.map(it => [it.id, it]));
			const carriedConflictsForTask = priorConflictsForTask.reduce((acc, c) => {
				if (freshKeys.has(`${c.id}::${c.field}`)) {
					return acc;
				}
				const localItem = localById.get(c.id) ?? null;
				const incomingItem = incomingById.get(c.id) ?? null;
				if (!localItem && !incomingItem) {
					return acc;
				}
				if (c.field === 'title') {
					if (localItem && (!incomingItem || localItem.title !== incomingItem.title)) {
						acc.push({
							...c,
							local: localItem.title,
							incoming: incomingItem ? incomingItem.title : c.incoming
						});
					}
					return acc;
				}
				acc.push(c);
				return acc;
			}, []);
			this.#pullConflictsQueue = [...otherTasksConflicts, ...freshConflictsForTask, ...carriedConflictsForTask];
			await this.#applyIncomingDelta(taskId, withParentCompletion, local);
			if (!Array.isArray(deferred) || deferred.length === 0) {
				this.#setRevisionAndTree(taskId, revision, incoming);
			}
			if (hasConflicts || hadConflictsForTask) {
				main_core_events.EventEmitter.emit('tasks:checkList:manualConflicts', {
					taskId,
					refreshOnly: true
				});
			}
			return true;
		}
		async #applyIncomingDelta(taskId, merged, currentItems) {
			const currentById = new Map((currentItems ?? []).map(it => [it.id, it]));
			const currentIds = [...currentById.keys()];
			const mergedIds = merged.map(it => it.id);
			const mergedIdSet = new Set(mergedIds);
			const toUpsert = merged.filter(item => {
				const prev = currentById.get(item.id);
				return !prev || CheckListService.#checkListItemChanged(prev, item);
			});
			const removedIds = currentIds.filter(id => !mergedIdSet.has(id));
			const addedIds = mergedIds.filter(id => !currentById.has(id));
			const compositionChanged = addedIds.length > 0 || removedIds.length > 0;
			if (toUpsert.length === 0 && removedIds.length === 0 && !compositionChanged) {
				return;
			}
			const dispatches = [this.$store.dispatch(`${tasks_v2_const.Model.Interface}/setDisableCheckListAnimations`, true)];
			if (toUpsert.length > 0) {
				dispatches.push(this.$store.dispatch(`${tasks_v2_const.Model.CheckList}/upsertMany`, toUpsert));
			}
			if (removedIds.length > 0) {
				dispatches.push(this.$store.dispatch(`${tasks_v2_const.Model.CheckList}/deleteMany`, removedIds));
			}
			await Promise.all(dispatches);
			const membersChanged = toUpsert.some(item => {
				const prev = currentById.get(item.id);
				return !prev || !memberSetsEqual(prev.accomplices, item.accomplices) || !memberSetsEqual(prev.auditors, item.auditors);
			});
			if (compositionChanged || membersChanged) {
				await this.#updateTask(taskId, merged);
			}
			void this.$store.dispatch(`${tasks_v2_const.Model.Interface}/setDisableCheckListAnimations`, false);
		}
		static #checkListItemChanged(prev, next) {
			const SCALAR_FIELDS = ['title', 'parentId', 'parentNodeId', 'sortIndex', 'isImportant', 'isComplete', 'toggledDate'];
			for (const field of SCALAR_FIELDS) {
				if (prev[field] !== next[field]) {
					return true;
				}
			}
			if ((prev.creator?.id ?? null) !== (next.creator?.id ?? null)) {
				return true;
			}
			if ((prev.toggledBy?.id ?? null) !== (next.toggledBy?.id ?? null)) {
				return true;
			}
			if (!memberSetsEqual(prev.accomplices, next.accomplices) || !memberSetsEqual(prev.auditors, next.auditors) || !memberSetsEqual(prev.attachments, next.attachments)) {
				return true;
			}
			const prevActions = prev.actions ?? {};
			const nextActions = next.actions ?? {};
			return prevActions.modify !== nextActions.modify || prevActions.remove !== nextActions.remove || prevActions.toggle !== nextActions.toggle;
		}
		getPullConflicts() {
			return this.#pullConflictsQueue;
		}
		clearPullConflicts(taskId) {
			if (taskId !== undefined && taskId !== null) {
				this.#pullConflictsQueue = this.#pullConflictsQueue.filter(c => c.taskId !== taskId);
			} else {
				this.#pullConflictsQueue = [];
			}
		}
		async load(taskId, cloneTo) {
			const task = tasks_v2_provider_service_taskService.taskService.getStoreTask(taskId);
			if (!tasks_v2_lib_idUtils.idUtils.isReal(taskId) && task.templateId) {
				await this.load(tasks_v2_lib_idUtils.idUtils.boxTemplate(task.templateId), taskId);
				return;
			}
			const toId = cloneTo ?? taskId;
			const pending = this.#getPromises[toId];
			if (pending) {
				await pending;
				return;
			}
			const promise = (async () => {
				const {
					revision,
					checklist: rawItems
				} = await this.#requestTree(taskId);
				let checkLists = rawItems.map(it => mapDtoToModel(it));
				if (cloneTo) {
					checkLists = this.#clone(checkLists);
				}
				await this.#enqueueMerge(toId, async () => {
					const appliedRevision = this.#revisions[toId];
					if (!CheckListService.#isResponseComparable(appliedRevision, revision) || CheckListService.#isAppliedNewerThanResponse(appliedRevision, revision)) {
						return;
					}
					await Promise.all([this.$store.dispatch(`${tasks_v2_const.Model.CheckList}/upsertMany`, checkLists), tasks_v2_provider_service_taskService.taskService.updateStoreTask(toId, {
						containsChecklist: checkLists.length > 0,
						checklist: checkLists.map(({
							id
						}) => id)
					})]);
					this.#storeRevisionAndTree(toId, revision, rawItems);
				});
			})();
			this.#getPromises[toId] = promise;
			try {
				await promise;
			} finally {
				if (this.#getPromises[toId] === promise) {
					delete this.#getPromises[toId];
				}
			}
		}
		async #requestTree(taskId) {
			const isTemplate = tasks_v2_lib_idUtils.idUtils.isTemplate(taskId);
			const urlCheckListGet = isTemplate ? 'Template.CheckList.get' : tasks_v2_const.Endpoint.CheckListGet;
			const idKey = isTemplate ? 'templateId' : 'taskId';
			const response = await tasks_v2_lib_apiClient.apiClient.post(urlCheckListGet, {
				[idKey]: tasks_v2_lib_idUtils.idUtils.unbox(taskId)
			});
			if (Array.isArray(response)) {
				return {
					revision: undefined,
					checklist: response
				};
			}
			return {
				revision: response.revision,
				checklist: response.checklist ?? []
			};
		}

		// unlike load() this one may not discard unsaved local edits, so the response goes through the merge.
		// a tree already in the store proves nothing about entityId: it may predate the entity, so the check
		// is remembered for the pair and not for the task
		async refresh(taskId, entityIds) {
			const entityChecks = this.#entityChecksOf(taskId);
			const normalizedEntityIds = Array.isArray(entityIds) ? entityIds : [entityIds];
			const checkKey = this.#getEntityCheckKey(normalizedEntityIds);
			const refreshPromises = this.#refreshPromises[taskId] ?? new Map();
			this.#refreshPromises[taskId] = refreshPromises;
			let promise = refreshPromises.get(checkKey);
			if (!promise) {
				promise = this.#startRefresh(taskId);
				refreshPromises.set(checkKey, promise);
			}
			let outcome;
			try {
				outcome = await promise;
			} finally {
				if (refreshPromises.get(checkKey) === promise) {
					refreshPromises.delete(checkKey);
				}
			}

			// a card closed while the request was in flight dropped its checks, and they say nothing about
			// the next opening, so a late response must not bring them back
			if (outcome === false || this.#checkedEntities[taskId] !== entityChecks) {
				return;
			}
			entityChecks.set(checkKey, this.#revisions[taskId]);
		}

		// resolves to false when the response proved nothing about the store — it could not be ordered
		// against the applied state, or the merge found no store task to apply it to
		#startRefresh(taskId) {
			return this.#requestTree(taskId).then(response => this.#applyRefreshedTree(taskId, response));
		}
		async #applyRefreshedTree(taskId, response) {
			// the response is ordered against the applied revision inside the chain: a merge queued ahead
			// of this one may have already advanced the store past the response
			return this.#enqueueMerge(taskId, async () => {
				const appliedRevision = this.#revisions[taskId];
				if (!CheckListService.#isResponseComparable(appliedRevision, response.revision)) {
					return false;
				}
				if (CheckListService.#isAppliedNewerThanResponse(appliedRevision, response.revision)) {
					return true;
				}
				return this.#mergeIncomingTree(taskId, response.checklist, response.revision);
			});
		}

		// a versioned store cannot be ordered against a response that carries no revision
		static #isResponseComparable(appliedRevision, responseRevision) {
			return Number.isNaN(Number.parseInt(appliedRevision, 10)) || !Number.isNaN(Number.parseInt(responseRevision, 10));
		}

		// the backend serializes revision as a monotonic counter, so ordering it is a numeric comparison
		static #isAppliedNewerThanResponse(appliedRevision, responseRevision) {
			const applied = Number.parseInt(appliedRevision, 10);
			const response = Number.parseInt(responseRevision, 10);
			return !Number.isNaN(applied) && !Number.isNaN(response) && applied > response;
		}
		async ensureLoaded(taskId) {
			const task = tasks_v2_provider_service_taskService.taskService.getStoreTask(taskId);
			if (!task?.containsChecklist) {
				return;
			}
			const checkListIds = task.checklist ?? [];
			const isComplete = checkListIds.length > 0 && checkListIds.every(checkListId => {
				return Boolean(this.$store.getters[`${tasks_v2_const.Model.CheckList}/getById`](checkListId));
			});
			if (!isComplete) {
				await this.load(taskId);
			}
		}
		#isCheckListDirty(taskId, checklists) {
			const serverTree = this.#serverTrees[taskId];
			if (!Array.isArray(serverTree)) {
				return true;
			}
			const serverMap = new Map(serverTree.map(it => [it.id, it]));
			const localMap = new Map((checklists ?? []).map(it => [it.id, it]));
			if (serverMap.size !== localMap.size) {
				return true;
			}
			for (const id of localMap.keys()) {
				if (!serverMap.has(id)) {
					return true;
				}
			}
			for (const [id, localItem] of localMap) {
				const serverItem = serverMap.get(id);
				for (const field of SEMANTIC_SCALAR_FIELDS) {
					if (localItem[field] !== serverItem[field]) {
						return true;
					}
				}
				for (const field of MEMBER_FIELDS) {
					if (!memberSetsEqual(localItem[field], serverItem[field])) {
						return true;
					}
				}
				if (!memberSetsEqual(localItem[ATTACHMENT_FIELD], serverItem[ATTACHMENT_FIELD])) {
					return true;
				}
			}
			return false;
		}
		async save(taskId, checklists, skipNotification = false) {
			// eslint-disable-next-line no-param-reassign
			checklists = this.#excludeDeletingItems(checklists);
			if (this.#pullConflictsQueue.some(c => c.taskId === taskId)) {
				main_core_events.EventEmitter.emit('tasks:checkList:manualConflicts', {
					taskId
				});
				return {
					hasDeferred: false
				};
			}
			if (!this.#isCheckListDirty(taskId, checklists)) {
				return {
					hasDeferred: false
				};
			}

			// eslint-disable-next-line no-async-promise-executor
			return new Promise(async (resolve, reject) => {
				try {
					const result = await this.#saveWithRetry(taskId, checklists, skipNotification, 0);
					resolve(result);
				} catch (error) {
					reject(error);
				}
			});
		}
		async #saveWithRetry(taskId, checklists, skipNotification, attempt) {
			const isTemplate = tasks_v2_lib_idUtils.idUtils.isTemplate(taskId);
			const idPure = tasks_v2_lib_idUtils.idUtils.unbox(taskId);
			const urlCheckListSave = isTemplate ? 'Template.CheckList.save' : tasks_v2_const.Endpoint.CheckListSave;
			const entity = isTemplate ? 'template' : 'task';
			const features = tasks_v2_core.Core.getParams().features;

			// todo remove after features.isV2Enabled === true
			const task = tasks_v2_provider_service_taskService.taskService.getStoreTask(taskId);
			const canOpenFullCard = features.isV2Enabled || main_core.Type.isArray(features.allowedGroups) && features.allowedGroups.includes(task.groupId);
			let listToSend = checklists;
			if (!canOpenFullCard) {
				// todo remove after features.isV2Enabled === true
				listToSend = prepareTitleCheckLists(checklists);
			}
			const baseRevision = this.#revisions[taskId];
			const baseTree = this.#serverTrees[taskId] ?? [];
			const requestPayload = {
				[entity]: {
					id: idPure,
					checklist: prepareCheckLists(listToSend)
				},
				skipNotification
			};
			if (baseRevision !== undefined) {
				requestPayload.baseRevision = baseRevision;
			}
			const response = await tasks_v2_lib_apiClient.apiClient.post(urlCheckListSave, requestPayload);
			if (Array.isArray(response)) {
				const checkLists = response.map(it => mapDtoToModel(it));
				await this.#applyCheckListsToStore(taskId, checkLists);
				return {
					hasDeferred: false
				};
			}
			const {
				status,
				revision,
				checklist: responseChecklist
			} = response;
			if (status === 'conflict') {
				const incomingTree = responseChecklist.map(it => mapDtoToModel(it));
				const {
					merged,
					conflicts: mergeConflicts,
					deferred
				} = mergeCheckLists(baseTree, checklists, incomingTree, {
					isFieldActive: (itemId, field) => activeFieldRegistry.isActive(itemId, field),
					...this.#resolveActionRights(taskId)
				});
				const hasDeferred = Array.isArray(deferred) && deferred.length > 0;
				if (hasDeferred) {
					this.#setRevisionAndTree(taskId, undefined, this.#holdDeferredFields(incomingTree, baseTree, deferred));
				} else {
					this.#storeRevisionAndTree(taskId, revision, responseChecklist);
				}
				if (Array.isArray(mergeConflicts) && mergeConflicts.length > 0) {
					const queueMap = new Map(this.#pullConflictsQueue.map(c => [`${c.taskId}::${c.id}::${c.field}`, c]));
					mergeConflicts.forEach(c => {
						queueMap.set(`${taskId}::${c.id}::${c.field}`, {
							...c,
							taskId
						});
					});
					this.#pullConflictsQueue = [...queueMap.values()];
					await this.#applyCheckListsToStore(taskId, merged);
					main_core_events.EventEmitter.emit('tasks:checkList:manualConflicts', {
						taskId
					});
					return {
						hasDeferred: false
					};
				}
				if (hasDeferred) {
					await this.#applyCheckListsToStore(taskId, merged);
					return {
						hasDeferred: true
					};
				}
				if (attempt >= CONFLICT_MAX_RETRIES) {
					await this.#notifyRetryExhausted();
					throw new Error(main_core.Loc.getMessage('TASKS_V2_CHECK_LIST_SERVICE_SYNC_FAILED'));
				}
				await this.#applyCheckListsToStore(taskId, merged);
				const delay = CONFLICT_RETRY_BASE_DELAY_MS * 2 ** attempt;
				await new Promise(resolve => {
					setTimeout(resolve, delay);
				});
				return this.#saveWithRetry(taskId, merged, skipNotification, attempt + 1);
			}
			if (this.#revisions[taskId] !== baseRevision) {
				return {
					hasDeferred: false
				};
			}
			this.#storeRevisionAndTree(taskId, revision, responseChecklist);
			const checkLists = (responseChecklist ?? []).map(it => mapDtoToModel(it));
			await this.#applyCheckListsToStore(taskId, checkLists);
			this.clearPullConflicts(taskId);
			return {
				hasDeferred: false
			};
		}
		async #applyCheckListsToStore(taskId, checkLists) {
			const task = tasks_v2_provider_service_taskService.taskService.getStoreTask(taskId);
			const nextIdSet = new Set(checkLists.map(item => item.id));
			const removedIds = (task?.checklist ?? []).filter(id => !nextIdSet.has(id));
			const dispatches = [this.$store.dispatch(`${tasks_v2_const.Model.Interface}/setDisableCheckListAnimations`, true), this.$store.dispatch(`${tasks_v2_const.Model.CheckList}/upsertMany`, checkLists)];
			if (removedIds.length > 0) {
				dispatches.push(this.$store.dispatch(`${tasks_v2_const.Model.CheckList}/deleteMany`, removedIds));
			}
			await Promise.all(dispatches);
			await this.#updateTask(taskId, checkLists);
			void this.$store.dispatch(`${tasks_v2_const.Model.Interface}/setDisableCheckListAnimations`, false);
		}
		async #notifyRetryExhausted() {
			const {
				UI
			} = await main_core.Runtime.loadExtension('ui.notification');
			UI.Notification.Center.notify({
				content: main_core.Loc.getMessage('TASKS_V2_CHECK_LIST_SERVICE_SYNC_FAILED')
			});
		}
		async collapse(taskId, checkListId) {
			const isTemplate = tasks_v2_lib_idUtils.idUtils.isTemplate(taskId);
			const idPure = tasks_v2_lib_idUtils.idUtils.unbox(taskId);
			const urlCheckListCollapse = isTemplate ? 'Template.CheckList.collapse' : tasks_v2_const.Endpoint.CheckListCollapse;
			const entity = isTemplate ? 'template' : 'task';
			await tasks_v2_lib_apiClient.apiClient.post(urlCheckListCollapse, {
				[`${entity}Id`]: idPure,
				checkListId
			});
			void this.$store.dispatch(`${tasks_v2_const.Model.CheckList}/update`, {
				id: checkListId,
				fields: {
					collapsed: true,
					expanded: false
				}
			});
		}
		async expand(taskId, checkListId) {
			const isTemplate = tasks_v2_lib_idUtils.idUtils.isTemplate(taskId);
			const idPure = tasks_v2_lib_idUtils.idUtils.unbox(taskId);
			const urlCheckListExpand = isTemplate ? 'Template.CheckList.expand' : tasks_v2_const.Endpoint.CheckListExpand;
			const entity = isTemplate ? 'template' : 'task';
			await tasks_v2_lib_apiClient.apiClient.post(urlCheckListExpand, {
				[`${entity}Id`]: idPure,
				checkListId
			});
			void this.$store.dispatch(`${tasks_v2_const.Model.CheckList}/update`, {
				id: checkListId,
				fields: {
					collapsed: false,
					expanded: true
				}
			});
		}
		async complete(taskId, checkListId) {
			await this.#changeStatus(taskId, checkListId, true);
		}
		async renew(taskId, checkListId) {
			await this.#changeStatus(taskId, checkListId, false);
		}
		async #changeStatus(taskId, checkListId, isComplete) {
			await this.#waitForInFlightBatches(taskId);
			const [batch, oppositeBatch] = isComplete ? [this.#completeBatch, this.#renewBatch] : [this.#renewBatch, this.#completeBatch];
			const originalState = this.#getOriginalState(taskId, checkListId, batch, oppositeBatch);
			await this.$store.dispatch(`${tasks_v2_const.Model.CheckList}/update`, {
				id: checkListId,
				fields: {
					isComplete
				}
			});
			oppositeBatch.remove(taskId, checkListId);
			await batch.add(taskId, checkListId, originalState).catch(() => {});
		}
		async delete(taskId, checkListId) {
			const task = tasks_v2_provider_service_taskService.taskService.getStoreTask(taskId);
			const checklists = this.$store.getters[`${tasks_v2_const.Model.CheckList}/getByIds`](task.checklist);
			await this.save(taskId, checklists);
		}
		async #completeCheckLists(taskId) {
			const url = tasks_v2_lib_idUtils.idUtils.isTemplate(taskId) ? 'Template.CheckList.complete' : tasks_v2_const.Endpoint.CheckListComplete;
			await this.#sendBatch(taskId, this.#completeBatch, url, true);
		}
		async #renewCheckLists(taskId) {
			const url = tasks_v2_lib_idUtils.idUtils.isTemplate(taskId) ? 'Template.CheckList.renew' : tasks_v2_const.Endpoint.CheckListRenew;
			await this.#sendBatch(taskId, this.#renewBatch, url, false);
		}
		async #sendBatch(taskId, batch, url, isComplete) {
			const {
				checkListIds,
				originalStates,
				promise
			} = batch.takePending(taskId);
			if (!checkListIds || checkListIds.size === 0) {
				promise?.resolve();
				return;
			}
			batch.markInFlight(taskId, promise);
			try {
				const checkLists = [...checkListIds].map(checkListId => this.#getById(checkListId));
				await tasks_v2_lib_apiClient.apiClient.post(url, {
					[tasks_v2_lib_idUtils.idUtils.isTemplate(taskId) ? 'template' : 'task']: {
						id: tasks_v2_lib_idUtils.idUtils.unbox(taskId),
						checklist: prepareCheckLists(checkLists)
					}
				});
				promise?.resolve();
			} catch (error) {
				try {
					await this.#restoreOriginalStates(originalStates, isComplete);
				} finally {
					promise?.reject(error);
				}
			} finally {
				batch.clearInFlight(taskId, promise);
			}
		}
		#excludeDeletingItems(checkLists) {
			const deletingMap = this.$store.getters[`${tasks_v2_const.Model.Interface}/deletingCheckListIds`] ?? {};
			const deletingIds = new Set(Object.values(deletingMap));
			if (deletingIds.size === 0) {
				return checkLists;
			}
			const queue = [...deletingIds];
			while (queue.length > 0) {
				const parentId = queue.shift();
				checkLists.forEach(item => {
					if (!deletingIds.has(item.id) && item.parentId === parentId) {
						deletingIds.add(item.id);
						queue.push(item.id);
					}
				});
			}
			return checkLists.filter(item => !deletingIds.has(item.id));
		}
		isCheckListExists(checkListId) {
			return this.#getById(checkListId) !== null;
		}
		filterItemsBelongingToCheckList(checkListId, checkListItemIds) {
			const result = [];
			checkListItemIds.forEach(checkListItemId => {
				const rootId = this.#getRootId(checkListItemId);
				if (rootId === checkListId) {
					result.push(checkListItemId);
				}
			});
			return result;
		}
		#getRootId(checkListItemId) {
			const item = this.#getById(checkListItemId);
			if (!item) {
				return 0;
			}
			if (item.parentId === 0) {
				return item.id;
			}
			return this.#getRootId(item.parentId);
		}
		#getById(checkListId) {
			return this.$store.getters[`${tasks_v2_const.Model.CheckList}/getById`](checkListId) ?? null;
		}
		async #updateTask(taskId, checkLists) {
			const task = tasks_v2_provider_service_taskService.taskService.getStoreTask(taskId);
			const accomplicesIdsSet = new Set(task?.accomplicesIds);
			const auditorsIdsSet = new Set(task?.auditorsIds);
			const users = [];
			checkLists.forEach(item => {
				item.accomplices?.forEach(accomplice => {
					users.push(accomplice);
					accomplicesIdsSet.add(accomplice.id);
				});
				item.auditors?.forEach(auditor => {
					users.push(auditor);
					auditorsIdsSet.add(auditor.id);
				});
			});
			const accomplicesIds = [...accomplicesIdsSet];
			const auditorsIds = [...auditorsIdsSet];
			await tasks_v2_core.Core.getStore().dispatch(`${tasks_v2_const.Model.Users}/upsertMany`, users);
			await tasks_v2_provider_service_taskService.taskService.updateStoreTask(taskId, {
				containsChecklist: checkLists.length > 0,
				checklist: checkLists.map(item => item.id),
				accomplicesIds,
				auditorsIds
			});
		}
		async forceCompletePending(taskId, options = {}) {
			await this.#forcePendingBatch(taskId, this.#completeBatch, () => this.#completeCheckLists(taskId), options.rejectOnError === true);
		}
		async forceRenewPending(taskId, options = {}) {
			await this.#forcePendingBatch(taskId, this.#renewBatch, () => this.#renewCheckLists(taskId), options.rejectOnError === true);
		}
		async #forcePendingBatch(taskId, batch, send, rejectOnError) {
			const promises = [];
			const inFlight = batch.getInFlight(taskId);
			if (inFlight) {
				promises.push(inFlight);
			}
			if (batch.getPendingSize(taskId) > 0) {
				promises.push(batch.getPromise(taskId));
				await send();
			}
			await this.#waitForBatches(promises, rejectOnError);
		}
		async forceSavePending(taskId, options = {}) {
			await Promise.all([this.forceCompletePending(taskId, options), this.forceRenewPending(taskId, options)]);
		}
		async #waitForBatches(promises, rejectOnError) {
			if (rejectOnError) {
				await Promise.all(promises);
				return;
			}
			await Promise.all(promises.map(promise => promise.catch(() => {})));
		}
		async #waitForInFlightBatches(taskId) {
			await this.#waitForBatches([this.#completeBatch.getInFlight(taskId), this.#renewBatch.getInFlight(taskId)].filter(Boolean), false);
		}
		#getOriginalState(taskId, checkListId, batch, oppositeBatch) {
			return batch.getOriginalState(taskId, checkListId) ?? oppositeBatch.getOriginalState(taskId, checkListId) ?? Boolean(this.#getById(checkListId)?.isComplete);
		}
		async #restoreOriginalStates(originalStates, optimisticState) {
			await Promise.all([...originalStates].map(async ([checkListId, isComplete]) => {
				if (this.#getById(checkListId)?.isComplete !== optimisticState) {
					return;
				}
				await this.$store.dispatch(`${tasks_v2_const.Model.CheckList}/update`, {
					id: checkListId,
					fields: {
						isComplete
					}
				});
			}));
		}
		async forceSaveAllPending() {
			const allTaskIds = new Set([...this.#completeBatch.getTaskIds(), ...this.#renewBatch.getTaskIds()]);
			await Promise.all([...allTaskIds].map(taskId => this.forceSavePending(taskId)));
		}
		#clone(checkLists) {
			const {
				idsMap,
				nodeIdsMap
			} = checkLists.reduce((maps, {
				id,
				nodeId
			}) => {
				maps.idsMap.set(id, main_core.Text.getRandom());
				if (nodeId) {
					maps.nodeIdsMap.set(nodeId, main_core.Text.getRandom());
				}
				return maps;
			}, {
				idsMap: new Map(),
				nodeIdsMap: new Map()
			});
			return checkLists.map(checkList => ({
				...checkList,
				id: idsMap.get(checkList.id),
				copiedId: checkList.id,
				nodeId: nodeIdsMap.get(checkList.nodeId) ?? main_core.Text.getRandom(),
				parentId: idsMap.get(checkList.parentId) ?? 0,
				parentNodeId: nodeIdsMap.get(checkList.parentNodeId) ?? null,
				actions: {
					modify: true,
					remove: true,
					toggle: true
				}
			}));
		}
		get $store() {
			return tasks_v2_core.Core.getStore();
		}
	}
	const checkListService = new CheckListService();

	const CheckListMappers = {
		mapModelToSliderData,
		getUserIdsFromChecklists
	};

	exports.CheckListMappers = CheckListMappers;
	exports.activeFieldRegistry = activeFieldRegistry;
	exports.checkListService = checkListService;

})(this.BX.Tasks.V2.Provider.Service = this.BX.Tasks.V2.Provider.Service || {}, BX.Tasks.V2.Model, BX.Tasks.V2.Provider.Service, BX, BX.Event, BX.Tasks.V2, BX.Tasks.V2.Const, BX.Tasks.V2.Lib, BX.Tasks.V2.Lib, BX.Tasks.V2.Provider.Service);
//# sourceMappingURL=check-list-service.bundle.js.map
