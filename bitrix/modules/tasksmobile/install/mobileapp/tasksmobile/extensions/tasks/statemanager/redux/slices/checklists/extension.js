/**
 * @module tasks/statemanager/redux/slices/checklists
 */
jn.define('tasks/statemanager/redux/slices/checklists', (require, exports, module) => {
	const { ReducerRegistry } = require('statemanager/redux/reducer-registry');
	const { createSlice } = require('statemanager/redux/toolkit');
	const { sliceName, checklistsAdapter, initialState } = require(
		'tasks/statemanager/redux/slices/checklists/meta',
	);
	const { ChecklistEntityType } = require('tasks/checklist/enum');
	const TASK = ChecklistEntityType.TASK.getValue();
	const {
		splitFlatList,
		makeNewChecklist,
		makeNewItem,
		buildFetchMergeMaps,
		isKnownServerEntity,
		mergeServerModelsIntoSlice,
		rekeyEntityRecords,
		markEntityDirty,
		clearEntityDirty,
		isEntityDirty,
		moveEntityDirty,
	} = require('tasks/statemanager/redux/slices/checklists/model');
	const {
		fetchChecklists,
		saveChecklists,
		toggleItems,
		collapseChecklist,
		expandChecklist,
	} = require('tasks/statemanager/redux/slices/checklists/thunk');
	const selectors = require('tasks/statemanager/redux/slices/checklists/selector');

	/**
	 * @param {object} state
	 * @param {ChecklistEntityContext} context
	 * @return {void}
	 */
	const removeEntityChecklists = (state, { entityType, entityId }, exceptIds = null) => {
		const ids = Object.values(state.entities)
			.filter((checklist) => checklist.entityType === entityType
				&& checklist.entityId === entityId
				&& !exceptIds?.has(checklist.id))
			.map((checklist) => checklist.id);

		checklistsAdapter.removeMany(state, ids);
	};

	/**
	 * @param {object} state
	 * @param {object} action
	 * @return {void}
	 */
	const mergeFromServer = (state, action) => {
		const { entityType = TASK, entityId } = action.meta.arg;
		const rawItems = action.payload?.data;

		if (!Array.isArray(rawItems))
		{
			return;
		}

		const serverIdToStoreId = action.payload?.serverIdToStoreId ?? {};
		const { responseServerIds } = buildFetchMergeMaps(
			rawItems,
			serverIdToStoreId,
			{ entityType, entityId },
		);
		const { checklists } = splitFlatList(rawItems, { entityType, entityId });

		const toAdd = checklists.filter((checklist) => !isKnownServerEntity(checklist, serverIdToStoreId));

		// changes made elsewhere are applied only while nothing local is waiting to be saved
		if (!isEntityDirty(state, { entityType, entityId }))
		{
			checklists
				.filter((checklist) => isKnownServerEntity(checklist, serverIdToStoreId))
				.forEach((checklist) => {
					const local = state.entities[serverIdToStoreId[checklist.serverId]];
					if (!local)
					{
						return;
					}

					// id, nodeId and serverId identify the record and stay as they are
					Object.assign(local, {
						title: checklist.title,
						sortIndex: checklist.sortIndex,
						isComplete: checklist.isComplete,
						collapsed: checklist.collapsed,
						expanded: checklist.expanded,
						actions: checklist.actions,
						createdBy: checklist.createdBy,
					});
				});
		}

		const toRemoveIds = Object.values(state.entities)
			.filter((checklist) => checklist.entityType === entityType
				&& checklist.entityId === entityId
				&& Number.isInteger(checklist.serverId)
				&& !checklist.isNew
				&& !responseServerIds.has(checklist.serverId))
			.map((checklist) => checklist.id);

		if (toRemoveIds.length > 0)
		{
			checklistsAdapter.removeMany(state, toRemoveIds);
		}

		if (toAdd.length > 0)
		{
			// a draft that already took the canonical key needs the serverId, not a silently dropped addMany
			mergeServerModelsIntoSlice(state, checklistsAdapter, toAdd, { entityType, entityId });
		}
	};

	/**
	 * @param {object} state
	 * @param {object} action
	 * @return {void}
	 */
	const mergeFromSave = (state, action) => {
		const { entityType = TASK, entityId } = action.meta.arg;
		const rawItems = action.payload?.data;

		if (!Array.isArray(rawItems))
		{
			return;
		}

		const { checklists } = splitFlatList(rawItems, { entityType, entityId });
		mergeServerModelsIntoSlice(state, checklistsAdapter, checklists, { entityType, entityId });

		// the request carried the whole entity, so nothing local is left unsaved. An edit made while the
		// request was in flight loses its flag here, but it schedules a save of its own right after.
		clearEntityDirty(state, { entityType, entityId });
	};

	const checklistsSlice = createSlice({
		name: sliceName,
		initialState,
		reducers: {
			checklistsUpserted: (state, { payload }) => {
				checklistsAdapter.upsertMany(state, payload.checklists);
				// seeding from a server payload also comes through here, and it is not a local change
				payload.checklists
					.filter((checklist) => checklist.isNew)
					.forEach((checklist) => markEntityDirty(state, checklist));
			},
			checklistsReplacedForEntity: (state, { payload }) => {
				removeEntityChecklists(state, payload);
				clearEntityDirty(state, payload);
			},
			checklistAdded: (state, { payload }) => {
				checklistsAdapter.addOne(state, payload.checklist);
				markEntityDirty(state, payload.checklist);
			},
			checklistRemoved: (state, { payload }) => {
				markEntityDirty(state, state.entities[payload.checklistId]);
				checklistsAdapter.removeOne(state, payload.checklistId);
			},
			checklistTitleChanged: (state, { payload }) => {
				const checklist = state.entities[payload.checklistId];
				if (checklist)
				{
					checklist.title = payload.title;
					markEntityDirty(state, checklist);
				}
			},
		},
		extraReducers: (builder) => {
			builder
				.addCase(fetchChecklists.fulfilled, mergeFromServer)
				.addCase(saveChecklists.fulfilled, mergeFromSave)
				// rebind to the real task id after the task is created: guid -> id, store keys included
				.addCase('tasks:tasks/create/fulfilled', (state, action) => {
					const { status, data } = action.payload ?? {};
					const tempId = action.meta?.arg?.taskId;
					const realId = data?.task?.id;

					if (status !== 'success' || !tempId || !realId || tempId === realId)
					{
						return;
					}

					const from = { entityType: TASK, entityId: tempId };
					const to = { entityType: TASK, entityId: realId };

					rekeyEntityRecords(state, checklistsAdapter, from, to);
					moveEntityDirty(state, from, to);
				})
				.addCase(collapseChecklist.pending, (state, action) => {
					const checklist = state.entities[action.meta.arg.checklistId];
					if (checklist)
					{
						checklist.collapsed = true;
						checklist.expanded = false;
					}
				})
				.addCase(collapseChecklist.rejected, (state, action) => {
					const checklist = state.entities[action.meta.arg.checklistId];
					if (checklist)
					{
						checklist.collapsed = false;
					}
				})
				.addCase(expandChecklist.pending, (state, action) => {
					const checklist = state.entities[action.meta.arg.checklistId];
					if (checklist)
					{
						checklist.expanded = true;
						checklist.collapsed = false;
					}
				})
				.addCase(expandChecklist.rejected, (state, action) => {
					const checklist = state.entities[action.meta.arg.checklistId];
					if (checklist)
					{
						checklist.expanded = false;
					}
				});
		},
	});

	const { reducer: checklistsReducer, actions } = checklistsSlice;
	const {
		checklistsUpserted,
		checklistsReplacedForEntity,
		checklistAdded,
		checklistRemoved,
		checklistTitleChanged,
	} = actions;

	ReducerRegistry.register(sliceName, checklistsReducer);

	module.exports = {
		checklistsReducer,

		checklistsUpserted,
		checklistsReplacedForEntity,
		checklistAdded,
		checklistRemoved,
		checklistTitleChanged,

		makeNewChecklist,
		makeNewItem,

		...selectors,

		fetchChecklists,
		saveChecklists,
		toggleItems,
		collapseChecklist,
		expandChecklist,
	};
});
