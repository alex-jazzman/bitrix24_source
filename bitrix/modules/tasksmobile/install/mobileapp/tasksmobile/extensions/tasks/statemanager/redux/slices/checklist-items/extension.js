/**
 * @module tasks/statemanager/redux/slices/checklist-items
 */
jn.define('tasks/statemanager/redux/slices/checklist-items', (require, exports, module) => {
	const { ReducerRegistry } = require('statemanager/redux/reducer-registry');
	const { createSlice, original } = require('statemanager/redux/toolkit');
	const { sliceName, itemsAdapter, initialState } = require('tasks/statemanager/redux/slices/checklist-items/meta');
	const { ChecklistEntityType, ChecklistMemberType } = require('tasks/checklist/enum');
	const {
		splitFlatList,
		buildDisplayIndexes,
		buildFetchMergeMaps,
		isKnownServerEntity,
		mergeServerModelsIntoSlice,
		rekeyEntityRecords,
		collectSubtreeIds,
		nextSortIndex,
		buildLocalAttachmentIndex,
		computeAncestorCompletion,
		markEntityDirty,
		clearEntityDirty,
		isEntityDirty,
		moveEntityDirty,
	} = require('tasks/statemanager/redux/slices/checklists/model');
	const {
		fetchChecklists,
		saveChecklists,
		toggleItems,
	} = require('tasks/statemanager/redux/slices/checklists/thunk');
	const selectors = require('tasks/statemanager/redux/slices/checklist-items/selector');

	/**
	 * @param {object} state
	 * @param {Iterable<ChecklistItemId>} checklistIds
	 * @return {void}
	 */
	const recalcDisplayIndexesForChecklists = (state, checklistIds) => {
		const targets = checklistIds instanceof Set ? checklistIds : new Set(checklistIds);
		if (targets.size === 0)
		{
			return;
		}

		const { entities } = state;
		const itemsByChecklist = new Map();
		Object.values(entities).forEach((item) => {
			if (!targets.has(item.checklistId))
			{
				return;
			}

			const list = itemsByChecklist.get(item.checklistId);
			if (list)
			{
				list.push(item);
			}
			else
			{
				itemsByChecklist.set(item.checklistId, [item]);
			}
		});

		itemsByChecklist.forEach((ownItems) => {
			const indexes = buildDisplayIndexes(ownItems);
			ownItems.forEach((item) => {
				entities[item.id].displaySortIndex = indexes[item.id] ?? '';
			});
		});
	};

	/**
	 * @param {object} state
	 * @param {ChecklistItemId} checklistId
	 * @return {void}
	 */
	const recalcDisplayIndexes = (state, checklistId) => {
		recalcDisplayIndexesForChecklists(state, [checklistId]);
	};

	/**
	 * @param {object} state
	 * @param {ChecklistItemId} fromParentId
	 * @return {void}
	 */
	const applyAncestorCompletion = (state, fromParentId) => {
		computeAncestorCompletion(Object.values(state.entities), fromParentId).forEach(({ id, isComplete }) => {
			// eslint-disable-next-line no-param-reassign
			state.entities[id].isComplete = isComplete;
		});
	};

	/**
	 * @param {object} state
	 * @param {ChecklistEntityContext} context
	 * @param {Set<ChecklistItemId>|null} [exceptIds]
	 * @return {void}
	 */
	const removeEntityItems = (state, { entityType, entityId }, exceptIds = null) => {
		const ids = Object.values(state.entities)
			.filter((item) => item.entityType === entityType
				&& item.entityId === entityId
				&& !exceptIds?.has(item.id))
			.map((item) => item.id);

		itemsAdapter.removeMany(state, ids);
	};

	/**
	 * @param {object} state
	 * @param {object} action
	 * @return {void}
	 */
	const mergeFromServer = (state, action) => {
		const { entityType = ChecklistEntityType.TASK.getValue(), entityId } = action.meta.arg;
		const rawItems = action.payload?.data;

		if (!Array.isArray(rawItems))
		{
			return;
		}

		const serverIdToStoreId = action.payload?.serverIdToStoreId ?? {};
		const { storeIdRemap, responseServerIds } = buildFetchMergeMaps(
			rawItems,
			serverIdToStoreId,
			{ entityType, entityId },
		);
		// remap a new item's response store id to the ancestor's existing one, else the tree orphans/splits
		const remap = (storeId) => storeIdRemap[storeId] ?? storeId;

		const { items } = splitFlatList(rawItems, { entityType, entityId });

		const newItems = items.filter((item) => !isKnownServerEntity(item, serverIdToStoreId));

		// changes made elsewhere are applied only while nothing local is waiting to be saved
		const knownItems = isEntityDirty(state, { entityType, entityId })
			? []
			: items.filter((item) => isKnownServerEntity(item, serverIdToStoreId));

		// enrich "poor" server attachments ({id, fileId}) from local items by server id/fileId
		const localAttachmentByServerKey = (newItems.length > 0 || knownItems.length > 0)
			? buildLocalAttachmentIndex(Object.values(original(state).entities))
			: new Map();

		const enrichAttachments = (item) => (item.attachments ?? []).map((attachment) => {
			const byServer = localAttachmentByServerKey.get(`id:${attachment.id}`)
				?? localAttachmentByServerKey.get(`fileId:${attachment.fileId}`);

			return (byServer && byServer.name) ? byServer : attachment;
		});

		const toAdd = newItems.map((item) => ({
			...item,
			checklistId: remap(item.checklistId),
			parentId: remap(item.parentId),
			attachments: enrichAttachments(item),
		}));

		const touchedChecklistIds = new Set();
		knownItems.forEach((item) => {
			const local = state.entities[serverIdToStoreId[item.serverId]];
			if (!local)
			{
				return;
			}

			// an item moved to another checklist elsewhere: both lists need their indexes recomputed
			touchedChecklistIds.add(local.checklistId);
			touchedChecklistIds.add(remap(item.checklistId));

			// id, nodeId and serverId identify the record and stay as they are
			Object.assign(local, {
				title: item.title,
				isComplete: item.isComplete,
				isImportant: item.isImportant,
				accomplices: item.accomplices,
				auditors: item.auditors,
				attachments: enrichAttachments(item),
				actions: item.actions,
				sortIndex: item.sortIndex,
				checklistId: remap(item.checklistId),
				parentId: remap(item.parentId),
				parentNodeId: item.parentNodeId,
			});
		});

		const baseEntities = original(state).entities;
		const toRemoveIds = Object.values(state.entities)
			.filter((item) => item.entityType === entityType
				&& item.entityId === entityId
				&& Number.isInteger(item.serverId)
				&& !item.isNew
				&& !responseServerIds.has(item.serverId))
			.map((item) => item.id);

		if (toRemoveIds.length > 0)
		{
			itemsAdapter.removeMany(state, toRemoveIds);
		}

		if (toAdd.length > 0)
		{
			// a draft that already took the canonical key needs the serverId, not a silently dropped addMany
			mergeServerModelsIntoSlice(state, itemsAdapter, toAdd, { entityType, entityId });
		}

		const affected = new Set([...touchedChecklistIds, ...toAdd.map((item) => item.checklistId)]);
		toRemoveIds.forEach((id) => {
			const removed = baseEntities[id];
			if (removed)
			{
				affected.add(removed.checklistId);
			}
		});
		recalcDisplayIndexesForChecklists(state, affected);
	};

	/**
	 * @param {object} state
	 * @param {object} action
	 * @return {void}
	 */
	const mergeFromSave = (state, action) => {
		const { entityType = ChecklistEntityType.TASK.getValue(), entityId } = action.meta.arg;
		const rawItems = action.payload?.data;

		if (!Array.isArray(rawItems))
		{
			return;
		}

		const { items } = splitFlatList(rawItems, { entityType, entityId });
		const toAdd = mergeServerModelsIntoSlice(state, itemsAdapter, items, { entityType, entityId });

		// the request carried the whole entity, so nothing local is left unsaved. An edit made while the
		// request was in flight loses its flag here, but it schedules a save of its own right after.
		clearEntityDirty(state, { entityType, entityId });

		if (toAdd.length > 0)
		{
			recalcDisplayIndexesForChecklists(state, toAdd.map((item) => item.checklistId));
		}
	};

	const itemsSlice = createSlice({
		name: sliceName,
		initialState,
		reducers: {
			itemsUpserted: (state, { payload }) => {
				itemsAdapter.upsertMany(state, payload.items);
				// seeding from a server payload also comes through here, and it is not a local change
				payload.items.filter((item) => item.isNew).forEach((item) => markEntityDirty(state, item));
				recalcDisplayIndexesForChecklists(state, payload.items.map((item) => item.checklistId));
			},
			itemsReplacedForEntity: (state, { payload }) => {
				removeEntityItems(state, payload);
				clearEntityDirty(state, payload);
			},
			itemsReplacedForChecklist: (state, { payload }) => {
				const ids = Object.values(state.entities)
					.filter((item) => item.checklistId === payload.checklistId)
					.map((item) => item.id);
				itemsAdapter.removeMany(state, ids);
			},
			itemAdded: (state, { payload }) => {
				const { afterItemId } = payload;
				const afterItem = afterItemId ? state.entities[afterItemId] : null;

				const insertAfterSibling = afterItem && afterItem.parentId === payload.item.parentId;
				const sortIndex = insertAfterSibling
					? afterItem.sortIndex + 1
					: nextSortIndex(Object.values(state.entities), payload.item.parentId);

				if (insertAfterSibling)
				{
					// shift those after afterItem down to avoid a sortIndex collision
					Object.values(state.entities).forEach((sibling) => {
						if (sibling.parentId === payload.item.parentId && sibling.sortIndex >= sortIndex)
						{
							// eslint-disable-next-line no-param-reassign
							sibling.sortIndex += 1;
						}
					});
				}

				const item = { ...payload.item, sortIndex };
				itemsAdapter.addOne(state, item);
				markEntityDirty(state, item);
				recalcDisplayIndexes(state, item.checklistId);
			},
			itemRemoved: (state, { payload }) => {
				const item = state.entities[payload.itemId];
				if (!item)
				{
					return;
				}
				markEntityDirty(state, item);
				const { checklistId, parentId } = item;
				itemsAdapter.removeMany(state, collectSubtreeIds(Object.values(state.entities), payload.itemId));
				recalcDisplayIndexes(state, checklistId);
				// parent may have become complete or been left childless - recompute
				applyAncestorCompletion(state, parentId);
			},
			itemTitleChanged: (state, { payload }) => {
				const item = state.entities[payload.itemId];
				if (item)
				{
					item.title = payload.title;
					markEntityDirty(state, item);
				}
			},
			itemsToggled: (state, { payload }) => {
				payload.itemIds.forEach((itemId) => {
					const item = state.entities[itemId];
					if (item)
					{
						item.isComplete = payload.isComplete;
						markEntityDirty(state, item);
					}
				});
			},
			itemImportantToggled: (state, { payload }) => {
				const item = state.entities[payload.itemId];
				if (item)
				{
					item.isImportant = payload.isImportant;
					markEntityDirty(state, item);
				}
			},
			itemTabbedIn: (state, { payload }) => {
				const item = state.entities[payload.itemId];
				if (!item)
				{
					return;
				}
				markEntityDirty(state, item);
				const oldParentId = item.parentId;
				const siblings = Object.values(state.entities)
					.filter((sibling) => sibling.parentId === item.parentId && sibling.id !== item.id)
					.sort((a, b) => a.sortIndex - b.sortIndex);
				const prevSibling = [...siblings].reverse().find((sibling) => sibling.sortIndex < item.sortIndex);
				if (!prevSibling)
				{
					return;
				}
				// compute sortIndex before reassigning parentId, else the item enters its own max
				const sortIndex = nextSortIndex(Object.values(state.entities), prevSibling.id);
				item.parentId = prevSibling.id;
				item.sortIndex = sortIndex;
				recalcDisplayIndexes(state, item.checklistId);
				// prevSibling gained a child, old parent lost one - recompute completion of both
				applyAncestorCompletion(state, prevSibling.id);
				applyAncestorCompletion(state, oldParentId);
			},
			itemTabbedOut: (state, { payload }) => {
				const item = state.entities[payload.itemId];
				if (!item)
				{
					return;
				}
				const oldParentId = item.parentId;
				const parent = state.entities[item.parentId];
				if (!parent)
				{
					// the parent is the checklist root, there is nowhere higher
					return;
				}
				markEntityDirty(state, item);
				const newParentId = parent.parentId;
				const targetIndex = parent.sortIndex + 1;

				// shift new-level siblings after the parent to avoid sortIndex collisions
				Object.values(state.entities).forEach((sibling) => {
					if (
						sibling.parentId === newParentId
						&& sibling.id !== item.id
						&& sibling.sortIndex >= targetIndex
					)
					{
						// eslint-disable-next-line no-param-reassign
						sibling.sortIndex += 1;
					}
				});

				item.parentId = newParentId;
				item.sortIndex = targetIndex;
				recalcDisplayIndexes(state, item.checklistId);
				// the old parent lost a child, the new one gained: recompute both up the tree
				applyAncestorCompletion(state, oldParentId);
				applyAncestorCompletion(state, newParentId);
			},
			itemMovedToChecklist: (state, { payload }) => {
				const item = state.entities[payload.itemId];
				if (!item)
				{
					return;
				}
				markEntityDirty(state, item);
				const sourceChecklistId = item.checklistId;
				const sourceParentId = item.parentId;
				const { entities } = state;
				const subtreeIds = collectSubtreeIds(Object.values(entities), payload.itemId);

				// compute sortIndex before changing parentId, otherwise nextSortIndex counts the item itself
				const newSortIndex = nextSortIndex(Object.values(entities), payload.checklistId);

				subtreeIds.forEach((id) => {
					entities[id].checklistId = payload.checklistId;
				});
				item.parentId = payload.checklistId;
				item.sortIndex = newSortIndex;

				recalcDisplayIndexesForChecklists(state, [sourceChecklistId, payload.checklistId]);
				// source parent lost the subtree - recompute its completion (target root has no parent item)
				applyAncestorCompletion(state, sourceParentId);
			},
			membersChanged: (state, { payload }) => {
				const item = state.entities[payload.itemId];
				if (item)
				{
					item.accomplices = payload.accomplices ?? item.accomplices;
					item.auditors = payload.auditors ?? item.auditors;
					markEntityDirty(state, item);
				}
			},
			itemMembersAdded: (state, { payload }) => {
				const item = state.entities[payload.itemId];
				if (!item)
				{
					return;
				}

				markEntityDirty(state, item);

				ChecklistMemberType.getStoreKeys().forEach((role) => {
					const added = payload[role];
					if (!Array.isArray(added) || added.length === 0)
					{
						return;
					}

					const existingIds = new Set(item[role].map((member) => member.id));
					item[role] = [
						...item[role],
						...added.filter((member) => !existingIds.has(member.id)),
					];
				});
			},
			itemMembersClearedByType: (state, { payload }) => {
				const item = state.entities[payload.itemId];
				if (item && ChecklistMemberType.isStoreKey(payload.role))
				{
					item[payload.role] = [];
					markEntityDirty(state, item);
				}
			},
			attachmentsChanged: (state, { payload }) => {
				const item = state.entities[payload.itemId];
				if (item)
				{
					item.attachments = payload.attachments;
					markEntityDirty(state, item);
				}
			},
		},
		extraReducers: (builder) => {
			builder
				.addCase(fetchChecklists.fulfilled, mergeFromServer)
				.addCase(saveChecklists.fulfilled, mergeFromSave)
				// optimistically toggle the whole cascade by itemIds (nodeId), even ids the thunk won't send
				.addCase(toggleItems.pending, (state, action) => {
					const { itemIds, isComplete } = action.meta.arg;
					itemIds.forEach((itemId) => {
						const item = state.entities[itemId];
						if (item)
						{
							item.isComplete = isComplete;
						}
					});
				})
				.addCase(toggleItems.rejected, (state, action) => {
					const { itemIds, isComplete } = action.meta.arg;
					itemIds.forEach((itemId) => {
						const item = state.entities[itemId];
						if (item)
						{
							item.isComplete = !isComplete;
						}
					});
				})
				// rebind to the real task id after the task is created: guid -> id, store keys included
				.addCase('tasks:tasks/create/fulfilled', (state, action) => {
					const { status, data } = action.payload ?? {};
					const tempId = action.meta?.arg?.taskId;
					const realId = data?.task?.id;

					if (status !== 'success' || !tempId || !realId || tempId === realId)
					{
						return;
					}

					const taskType = ChecklistEntityType.TASK.getValue();
					const from = { entityType: taskType, entityId: tempId };
					const to = { entityType: taskType, entityId: realId };

					// an item points at its checklist and at its parent by store id, so both move along
					const rekeyed = rekeyEntityRecords(state, itemsAdapter, from, to, ['checklistId', 'parentId']);
					moveEntityDirty(state, from, to);
					recalcDisplayIndexesForChecklists(state, rekeyed.map((item) => item.checklistId));
				})
				// cascade on checklist removal (checklists slice, subscribed by the string type)
				.addCase('tasks:checklists/checklistRemoved', (state, action) => {
					const { checklistId } = action.payload;
					const own = Object.values(state.entities)
						.filter((item) => item.checklistId === checklistId);
					markEntityDirty(state, own[0]);
					itemsAdapter.removeMany(state, own.map((item) => item.id));
				})
				// cascade: replacing all of the entity's checklists must not leave orphaned items
				.addCase('tasks:checklists/checklistsReplacedForEntity', (state, action) => {
					removeEntityItems(state, action.payload);
					clearEntityDirty(state, action.payload);
				});
		},
	});

	const { reducer: itemsReducer, actions } = itemsSlice;
	const {
		itemsUpserted,
		itemsReplacedForEntity,
		itemsReplacedForChecklist,
		itemAdded,
		itemRemoved,
		itemTitleChanged,
		itemsToggled,
		itemImportantToggled,
		itemTabbedIn,
		itemTabbedOut,
		itemMovedToChecklist,
		membersChanged,
		itemMembersAdded,
		itemMembersClearedByType,
		attachmentsChanged,
	} = actions;

	ReducerRegistry.register(sliceName, itemsReducer);

	module.exports = {
		itemsReducer,

		itemsUpserted,
		itemsReplacedForEntity,
		itemsReplacedForChecklist,
		itemAdded,
		itemRemoved,
		itemTitleChanged,
		itemsToggled,
		itemImportantToggled,
		itemTabbedIn,
		itemTabbedOut,
		itemMovedToChecklist,
		membersChanged,
		itemMembersAdded,
		itemMembersClearedByType,
		attachmentsChanged,

		...selectors,

		toggleItems,
	};
});
