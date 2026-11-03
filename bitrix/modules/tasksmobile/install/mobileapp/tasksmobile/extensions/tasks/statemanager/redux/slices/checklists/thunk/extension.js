/** @module tasks/statemanager/redux/slices/checklists/thunk */
jn.define('tasks/statemanager/redux/slices/checklists/thunk', (require, exports, module) => {
	const { createAsyncThunk } = require('statemanager/redux/toolkit');
	const { isOnline } = require('device/connection');
	const { PerfPoint } = require('debug/prism');
	const { ChecklistEntityType } = require('tasks/checklist/enum');
	const { buildSavePayload } = require('tasks/statemanager/redux/slices/checklists/model');
	const api = require('tasks/statemanager/redux/slices/checklists/api');
	const { selectChecklistsByEntity } = require('tasks/statemanager/redux/slices/checklists/selector');
	const { selectItemsByChecklistId } = require('tasks/statemanager/redux/slices/checklist-items/selector');

	const TASK = ChecklistEntityType.TASK.getValue();

	/**
	 * Measures the request itself, not the reject wrapper: on a failed status the response is still
	 * a resolved promise, and its status has to reach the perf point before rejectWithValue hides it.
	 *
	 * @param {string} badge
	 * @param {string} label
	 * @param {string} key
	 * @param {Promise<RunActionResponse>} requestPromise
	 * @param {function(RunActionResponse): object} buildExtra
	 * @return {Promise<RunActionResponse>}
	 */
	const measureRequest = async (badge, label, key, requestPromise, buildExtra) => {
		const point = new PerfPoint(badge, label).start();
		point.startPoint(key);

		try
		{
			const response = await requestPromise;
			point.endPoint(key, buildExtra(response));

			return response;
		}
		catch (error)
		{
			point.endPoint(key, { status: 'error' });

			throw error;
		}
		finally
		{
			point.end();
		}
	};

	/**
	 * @param {Promise<RunActionResponse>} responsePromise
	 * @param {object} thunkAPI
	 * @return {Promise<RunActionResponse>}
	 */
	const awaitOrReject = async (responsePromise, thunkAPI) => {
		const response = await responsePromise;

		if (response?.status !== 'success')
		{
			return thunkAPI.rejectWithValue(response);
		}

		return response;
	};

	/**
	 * Task save answers with a revision envelope `{ status, revision, checklist }`, template save - with a
	 * bare list. Unwrap the envelope for the reducers and treat a save conflict as a failure.
	 *
	 * @param {Promise<RunActionResponse>} responsePromise
	 * @param {object} thunkAPI
	 * @return {Promise<RunActionResponse>}
	 */
	const awaitSaveOrReject = async (responsePromise, thunkAPI) => {
		const response = await responsePromise;

		if (response?.status !== 'success')
		{
			return thunkAPI.rejectWithValue(response);
		}

		const payload = response.data;

		if (Array.isArray(payload))
		{
			return response;
		}

		if (payload?.status !== 'success')
		{
			return thunkAPI.rejectWithValue(response);
		}

		return { ...response, data: payload.checklist };
	};

	/**
	 * A task create form holds a draft guid instead of a task id: the entity does not exist on the
	 * server yet, so its checklist lives in the store until the entity itself is saved.
	 *
	 * @param {number|string} [entityId]
	 * @return {boolean}
	 */
	const isEntityPersisted = (entityId) => Number(entityId) > 0;

	/**
	 * @param {ChecklistEntityArg} [arg]
	 * @return {boolean}
	 */
	const condition = (arg) => isOnline()
		&& !ChecklistEntityType.isDod(arg?.entityType)
		&& isEntityPersisted(arg?.entityId);

	/**
	 * @param {object} state
	 * @param {ChecklistEntityType} entityType
	 * @param {number|string} entityId
	 * @return {Array<[string, number]>}
	 */
	const collectIdPairs = (state, entityType, entityId) => {
		const pairs = [];
		selectChecklistsByEntity(state, entityType, entityId).forEach((checklist) => {
			if (Number.isInteger(checklist.serverId))
			{
				pairs.push([checklist.id, checklist.serverId]);
			}
			selectItemsByChecklistId(state, checklist.id).forEach((item) => {
				if (Number.isInteger(item.serverId))
				{
					pairs.push([item.id, item.serverId]);
				}
			});
		});

		return pairs;
	};

	/**
	 * @param {object} state
	 * @param {ChecklistEntityType} entityType
	 * @param {number|string} entityId
	 * @return {Record<number, string>}
	 */
	const buildServerIdToStoreId = (state, entityType, entityId) => {
		const map = {};
		collectIdPairs(state, entityType, entityId).forEach(([storeId, serverId]) => {
			map[serverId] = storeId;
		});

		return map;
	};

	/**
	 * @param {ChecklistEntityArg} arg
	 */
	const fetchChecklists = createAsyncThunk(
		'tasks:checklists/fetch',
		async ({ entityId, entityType = TASK }, thunkAPI) => {
			const response = await measureRequest(
				'Tasks Checklist Fetch',
				`${entityType} ${entityId}`,
				'Server Fetch',
				api.getList({ entityType, entityId }),
				({ status, data }) => ({ status, itemsCount: data?.length ?? 0 }),
			);

			if (response?.status !== 'success')
			{
				return thunkAPI.rejectWithValue(response);
			}

			return {
				...response,
				serverIdToStoreId: buildServerIdToStoreId(thunkAPI.getState(), entityType, entityId),
			};
		},
		{ condition },
	);

	/**
	 * @param {SaveChecklistsArg} arg
	 */
	const saveChecklists = createAsyncThunk(
		'tasks:checklists/save',
		({ entityType = TASK, entityId, skipNotification = false }, thunkAPI) => {
			const state = thunkAPI.getState();
			const checklists = selectChecklistsByEntity(state, entityType, entityId);
			const itemsByChecklistId = Object.fromEntries(
				checklists.map((checklist) => [
					checklist.id,
					selectItemsByChecklistId(state, checklist.id),
				]),
			);

			const payload = buildSavePayload(checklists, itemsByChecklistId);

			return awaitSaveOrReject(
				measureRequest(
					'Tasks Checklist Save',
					`${entityType} ${entityId}`,
					'Server Save',
					api.save({ entityType, entityId, payload, skipNotification }),
					({ status }) => ({ status, checklistsCount: checklists.length }),
				),
				thunkAPI,
			);
		},
		{ condition },
	);

	/**
	 * @param {ToggleItemsArg} arg
	 */
	const toggleItems = createAsyncThunk(
		'tasks:checklists/toggleItems',
		({ entityType = TASK, entityId, serverIds = [], isComplete }, thunkAPI) => awaitOrReject(
			measureRequest(
				'Tasks Checklist Toggle',
				isComplete ? 'complete' : 'renew',
				'Server Toggle',
				api.toggleItemsBatch({ entityType, entityId, serverIds, isComplete }),
				({ status }) => ({ status, itemsCount: serverIds.length }),
			),
			thunkAPI,
		),
		{
			condition: (arg) => condition(arg) && (arg?.serverIds?.length > 0),
		},
	);

	/**
	 * @param {ChecklistRefArg} arg
	 */
	const collapseChecklist = createAsyncThunk(
		'tasks:checklists/collapse',
		({ entityType = TASK, entityId, checklistId }, thunkAPI) => awaitOrReject(
			api.collapse({ entityType, entityId, checklistId }),
			thunkAPI,
		),
		{ condition },
	);

	/**
	 * @param {ChecklistRefArg} arg
	 */
	const expandChecklist = createAsyncThunk(
		'tasks:checklists/expand',
		({ entityType = TASK, entityId, checklistId }, thunkAPI) => awaitOrReject(
			api.expand({ entityType, entityId, checklistId }),
			thunkAPI,
		),
		{ condition },
	);

	module.exports = {
		condition,
		isEntityPersisted,
		fetchChecklists,
		saveChecklists,
		toggleItems,
		collapseChecklist,
		expandChecklist,
	};
});
