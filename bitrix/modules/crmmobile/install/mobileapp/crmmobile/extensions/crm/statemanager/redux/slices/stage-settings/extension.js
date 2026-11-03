/* eslint-disable no-param-reassign */
/**
 * @module crm/statemanager/redux/slices/stage-settings
 */
jn.define('crm/statemanager/redux/slices/stage-settings', (require, exports, module) => {
	const { ReducerRegistry } = require('statemanager/redux/reducer-registry');
	const { StateCache } = require('statemanager/redux/state-cache');
	const {
		createEntityAdapter,
		createSlice,
		createDraftSafeSelector,
		createAsyncThunk,
	} = require('statemanager/redux/toolkit');

	const { StageAjax, CategoryAjax } = require('crm/ajax');
	const {
		getTunnelUniqueId,
		prepareTunnelsBeforeSave,
		selectItemsByIds: selectTunnelsEntities,
	} = require('crm/statemanager/redux/slices/tunnels');
	const {
		buildStageUpdateFields,
		hasRequestedTunnels,
		writableStageFields,
	} = require('crm/statemanager/redux/slices/stage-settings/request');

	const reducerName = 'crm:stage';
	const adapter = createEntityAdapter({});
	const initialState = StateCache.getReducerState(reducerName, adapter.getInitialState());

	const {
		selectById,
		selectEntities,
		selectAll,
	} = adapter.getSelectors((state) => state[reducerName]);

	const selectStatusIdById = createDraftSafeSelector(
		selectById,
		(stage) => stage?.statusId,
	);

	const readStageTunnels = (state, stageId) => {
		const { tunnels } = selectById(state, stageId) || {};

		return Object.values(selectTunnelsEntities(state, tunnels || []));
	};

	const createCrmStage = createAsyncThunk(
		`${reducerName}/createCrmStage`,
		async (
			{ entityTypeId, fields, stageId, categoryId, kanbanSettingsId },
			{ getState, rejectWithValue },
		) => {
			try
			{
				const { sort } = selectById(getState(), stageId) || {};
				const result = await StageAjax.create(entityTypeId, categoryId, {
					...fields,
					sort: sort + 1,
				});

				if (result.status !== 'success')
				{
					return rejectWithValue({
						...result,
					});
				}

				return {
					...result,
					kanbanSettingsId,
				};
			}
			catch (error)
			{
				console.error(error);

				return null;
			}
		},
	);

	const updateCrmStage = createAsyncThunk(
		`${reducerName}/updateCrmStage`,
		async (
			{ entityTypeId, fields, categoryId, kanbanSettingsId, permissions },
			{ rejectWithValue, getState },
		) => {
			try
			{
				// a part the caller may not write is dropped before anything else reads the change:
				// the request, the tunnel state below and the reducers all speak of what was written
				const writableFields = writableStageFields(fields, permissions);

				// the tunnel state is only read when the request carries tunnels: an update that
				// leaves them out says nothing about them, and the reducers keep what they have
				const requestedTunnels = hasRequestedTunnels(writableFields);
				const tunnels = requestedTunnels ? writableFields.tunnels : undefined;
				const tunnelsBeforeUpdate = requestedTunnels
					? readStageTunnels(getState(), writableFields.id)
					: undefined;

				const response = await StageAjax.update(
					entityTypeId,
					categoryId,
					buildStageUpdateFields(writableFields, prepareTunnelsBeforeSave),
				);

				if (response.status !== 'success')
				{
					return rejectWithValue({
						...response,
					});
				}

				return {
					...response,
					fields: writableFields,
					kanbanSettingsId,
					tunnels,
					tunnelsBeforeUpdate,
				};
			}
			catch (error)
			{
				console.error(error);

				return null;
			}
		},
	);

	const deleteCrmStage = createAsyncThunk(
		`${reducerName}/deleteCrmStage`,
		async (
			{ entityTypeId, statusId, id, categoryId, kanbanSettingsId, semantics },
			{ rejectWithValue },
		) => {
			try
			{
				const response = await StageAjax.delete(entityTypeId, categoryId, statusId);

				if (response.status !== 'success')
				{
					return rejectWithValue({
						...response,
					});
				}

				return {
					...response,
					id,
					kanbanSettingsId,
					semantics,
				};
			}
			catch (error)
			{
				console.error(error);

				return null;
			}
		},
	);

	const slice = createSlice({
		name: reducerName,
		initialState,
		reducers: {},
		extraReducers: (builder) => {
			builder
				.addCase('crm:kanban/fetchCrmKanban/pending', (state, action) => {
					const { entityTypeId, categoryId } = action.meta.arg;
					const data = CategoryAjax.getCache('get', { entityTypeId, categoryId });
					if (data)
					{
						const {
							processStages,
							successStages,
							failedStages,
						} = data;

						const stages = [
							...processStages,
							...successStages,
							...failedStages,
						];

						const preparedStages = stages.map((stage) => ({
							...stage,
							tunnels: stage.tunnels.map((tunnel) => getTunnelUniqueId(tunnel)),
						}));

						adapter.addMany(state, preparedStages);
					}
				})
				.addCase('crm:kanban/fetchCrmKanban/fulfilled', (state, action) => {
					const {
						data: {
							processStages,
							successStages,
							failedStages,
						},
					} = action.payload;

					const stages = [
						...processStages,
						...successStages,
						...failedStages,
					];

					const preparedStages = stages.map((stage) => ({
						...stage,
						tunnels: stage.tunnels.map((tunnel) => getTunnelUniqueId(tunnel)),
					}));

					adapter.upsertMany(state, preparedStages);
				})
				.addCase(createCrmStage.pending, (state) => {
					state.status = 'loading';
				})
				.addCase(createCrmStage.fulfilled, (state, action) => {
					state.status = action.payload.status;
					const { data } = action.payload;

					adapter.addOne(state, data);
				})
				.addCase(createCrmStage.rejected, (state, action) => {
					state.status = action.payload.status;
				})
				.addCase(updateCrmStage.pending, (state) => {
					state.status = 'loading';
				})
				.addCase(updateCrmStage.fulfilled, (state, action) => {
					const {
						fields,
						tunnels,
						status,
					} = action.payload;
					state.status = status;

					const stage = state.entities[fields.id];

					if (stage)
					{
						adapter.upsertOne(state, {
							...stage,
							...fields,
							tunnels: Array.isArray(tunnels) ? tunnels.map(({ id }) => id) : stage.tunnels,
						});
					}
				})
				.addCase(updateCrmStage.rejected, (state, action) => {
					state.status = action.payload.status;
				})
				.addCase(deleteCrmStage.pending, (state) => {
					state.status = 'loading';
				})
				.addCase(deleteCrmStage.fulfilled, (state, action) => {
					const {
						status,
						id,
					} = action.payload;
					state.status = status;

					adapter.removeOne(state, id);
				})
				.addCase(deleteCrmStage.rejected, (state, action) => {
					state.status = action.payload.status;
				})
			;
		},
	});

	const selectIdAndStatusByIds = createDraftSafeSelector(
		selectAll,
		(store, ids) => ids,
		(items, ids) => ids.map((id) => {
			const item = items.find(({ id: itemId }) => itemId === id);

			return item ? { id: item.id, statusId: item.statusId } : null;
		}),
	);

	const { reducer } = slice;

	ReducerRegistry.register(reducerName, reducer);

	module.exports = {
		selectById,
		selectEntities,
		selectStatusIdById,
		selectIdAndStatusByIds,

		createCrmStage,
		updateCrmStage,
		deleteCrmStage,
	};
});
