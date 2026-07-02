/**
 * @module mail/statemanager/redux/slices/messages/thunk
 */
jn.define('mail/statemanager/redux/slices/messages/thunk', (require, exports, module) => {
	const { createAsyncThunk, createAction } = require('statemanager/redux/toolkit');
	const { sliceName } = require('mail/statemanager/redux/slices/messages/meta');
	const { AjaxMethod } = require('mail/const');
	const { RunActionExecutor } = require('rest/run-action-executor');
	const { isOnline } = require('device/connection');
	const { selectUidIdsByIds, selectOriginalReadStatuses, selectById } = require('mail/statemanager/redux/slices/messages/selector');
	const { selectByPath } = require('mail/statemanager/redux/slices/folders/selector');
	const { DefaultFolderType } = require('mail/enum/default-folder-type');

	const condition = () => isOnline();

	const adjustUnreadCounters = createAction(`${sliceName}/adjustUnreadCounters`);

	const runActionPromise = ({ action, options }) => new Promise((resolve) => {
		(new RunActionExecutor(action, options)).setHandler(resolve).call(false);
	});

	const invertDeltas = (deltas) => {
		const inverted = {};
		for (const [key, value] of Object.entries(deltas))
		{
			inverted[key] = -value;
		}

		return inverted;
	};

	const countUnreadByFolder = (objectIds, state) => {
		const folderCounterDeltas = {};
		let affectedUnreadCount = 0;

		objectIds.forEach((id) => {
			const msg = selectById(state, id);
			if (!msg || msg.isRead || !msg.folderId)
			{
				return;
			}

			folderCounterDeltas[msg.folderId] = (folderCounterDeltas[msg.folderId] || 0) - 1;
			affectedUnreadCount++;
		});

		return { folderCounterDeltas, affectedUnreadCount };
	};

	const pickMissedIds = ({ objectIds, objectUidIds, processedIds, state }) => {
		if (!Array.isArray(processedIds))
		{
			return [];
		}
		if (processedIds.length === objectUidIds.length)
		{
			return [];
		}

		const processedSet = new Set(processedIds);

		return objectIds.filter((id) => {
			const msg = selectById(state, id);

			return msg?.uidId && !processedSet.has(msg.uidId);
		});
	};

	const remove = createAsyncThunk(
		`${sliceName}/remove`,
		async ({ objectUidIds, objectIds }, { getState, dispatch }) => {
			const state = getState();
			const { folderCounterDeltas, affectedUnreadCount } = countUnreadByFolder(objectIds, state);
			const globalCounterDelta = -affectedUnreadCount;

			dispatch(adjustUnreadCounters({ folderCounterDeltas, globalCounterDelta }));

			const response = await runActionPromise({
				action: AjaxMethod.mailDelete,
				options: { ids: objectUidIds },
			});

			if (response?.errors?.length > 0)
			{
				dispatch(adjustUnreadCounters({
					folderCounterDeltas: invertDeltas(folderCounterDeltas),
					globalCounterDelta: -globalCounterDelta,
				}));

				return response;
			}

			const missedIds = pickMissedIds({
				objectIds,
				objectUidIds,
				processedIds: response?.data?.processedIds,
				state,
			});

			if (missedIds.length > 0)
			{
				const missed = countUnreadByFolder(missedIds, state);
				dispatch(adjustUnreadCounters({
					folderCounterDeltas: invertDeltas(missed.folderCounterDeltas),
					globalCounterDelta: missed.affectedUnreadCount,
				}));
			}

			return response;
		},
		{ condition },
	);

	const markAsSpam = createAsyncThunk(
		`${sliceName}/markAsSpam`,
		async ({ objectUidIds, objectIds }, { getState, dispatch }) => {
			const state = getState();
			const { folderCounterDeltas, affectedUnreadCount } = countUnreadByFolder(objectIds, state);
			const globalCounterDelta = -affectedUnreadCount;

			dispatch(adjustUnreadCounters({ folderCounterDeltas, globalCounterDelta }));

			const response = await runActionPromise({
				action: AjaxMethod.mailMarkAsSpam,
				options: { ids: objectUidIds },
			});

			if (response?.errors?.length > 0)
			{
				dispatch(adjustUnreadCounters({
					folderCounterDeltas: invertDeltas(folderCounterDeltas),
					globalCounterDelta: -globalCounterDelta,
				}));

				return response;
			}

			const missedIds = pickMissedIds({
				objectIds,
				objectUidIds,
				processedIds: response?.data?.processedIds,
				state,
			});

			if (missedIds.length > 0)
			{
				const missed = countUnreadByFolder(missedIds, state);
				dispatch(adjustUnreadCounters({
					folderCounterDeltas: invertDeltas(missed.folderCounterDeltas),
					globalCounterDelta: missed.affectedUnreadCount,
				}));
			}

			return response;
		},
		{ condition },
	);

	const changeReadStatus = createAsyncThunk(
		`${sliceName}/changeReadStatus`,
		async ({ objectUidIds, objectIds, isRead }, { getState, dispatch }) => {
			const state = getState();
			const originalReadStatuses = selectOriginalReadStatuses(state) || {};
			const filteredObjectIds = [];
			let globalCounterDelta = 0;
			const folderCounterDeltas = {};

			objectIds.forEach((id) => {
				const wasRead = originalReadStatuses[id];

				if (wasRead === undefined || Boolean(wasRead) === Boolean(isRead))
				{
					return;
				}

				filteredObjectIds.push(id);

				const msg = selectById(state, id);
				if (!msg?.folderId)
				{
					return;
				}

				const delta = isRead ? -1 : 1;
				globalCounterDelta += delta;
				folderCounterDeltas[msg.folderId] = (folderCounterDeltas[msg.folderId] || 0) + delta;
			});
			const filteredObjectUidIds = selectUidIdsByIds(state, filteredObjectIds) ?? [];

			if (filteredObjectUidIds.length === 0)
			{
				return {};
			}

			dispatch(adjustUnreadCounters({ folderCounterDeltas, globalCounterDelta }));

			const response = await runActionPromise({
				action: AjaxMethod.mailChangeReadStatus,
				options: { ids: filteredObjectUidIds, isRead },
			});

			if (response?.errors?.length > 0)
			{
				dispatch(adjustUnreadCounters({
					folderCounterDeltas: invertDeltas(folderCounterDeltas),
					globalCounterDelta: -globalCounterDelta,
				}));

				return response;
			}

			const missedIds = pickMissedIds({
				objectIds: filteredObjectIds,
				objectUidIds: filteredObjectUidIds,
				processedIds: response?.data?.processedIds,
				state,
			});

			if (missedIds.length > 0)
			{
				const missedFolderDeltas = {};
				let missedGlobalDelta = 0;
				const delta = isRead ? -1 : 1;

				missedIds.forEach((id) => {
					const msg = selectById(state, id);
					if (!msg?.folderId)
					{
						return;
					}

					missedGlobalDelta += delta;
					missedFolderDeltas[msg.folderId] = (missedFolderDeltas[msg.folderId] || 0) + delta;
				});

				dispatch(adjustUnreadCounters({
					folderCounterDeltas: invertDeltas(missedFolderDeltas),
					globalCounterDelta: -missedGlobalDelta,
				}));
			}

			return response;
		},
		{ condition },
	);

	const addToCrm = createAsyncThunk(
		`${sliceName}/addToCrm`,
		({ objectIds }) => runActionPromise({
			action: AjaxMethod.mailCreateCrm,
			options: { ids: objectIds },
		}).then((response) => {
			if (response?.data)
			{
				sendBindingEvent();
			}
		}),
		{ condition },
	);

	const addToTask = createAsyncThunk(
		`${sliceName}/addToTask`,
		async ({ objectId, title, description }) => {
			const { Entry } = await requireLazy('tasks:entry');
			Entry.openTaskCreation({
				initialTaskData: {
					title,
					description,
					mailMessageId: objectId,
				},
			});
		},
		{ condition },
	);

	const addToEvent = createAsyncThunk(
		`${sliceName}/addToEvent`,
		({ messageId, calendarEventId }) => runActionPromise({
			action: AjaxMethod.addToEvent,
			options: {
				messageId,
				calendarEventId,
			},
		}),
		{ condition },
	);

	const addToChat = createAsyncThunk(
		`${sliceName}/addToChat`,
		({ objectId }) => runActionPromise({
			action: AjaxMethod.mailCreateChat,
			options: { messageId: objectId },
		}),
		{ condition },
	);

	const discussInChat = createAsyncThunk(
		`${sliceName}/discussInChat`,
		({ messageId, dialogId }) => runActionPromise({
			action: AjaxMethod.mailDiscussInChat,
			options: {
				messageId,
				dialogId,
			},
		}),
		{ condition },
	);

	const buildMoveDeltas = ({ ids, state, toFolder }) => {
		const { folderCounterDeltas, affectedUnreadCount } = countUnreadByFolder(ids, state);

		if (toFolder?.id && affectedUnreadCount > 0)
		{
			folderCounterDeltas[toFolder.id] = (folderCounterDeltas[toFolder.id] || 0) + affectedUnreadCount;
		}

		const toHasCounter = DefaultFolderType.isFolderWithCounterStatus(toFolder?.type);
		const globalCounterDelta = toHasCounter ? 0 : -affectedUnreadCount;

		return { folderCounterDeltas, globalCounterDelta };
	};

	const moveToFolder = createAsyncThunk(
		`${sliceName}/moveToFolder`,
		async ({ objectUidIds, objectIds, folderPath }, { getState, dispatch }) => {
			const state = getState();
			const toFolder = selectByPath(state, folderPath);
			const { folderCounterDeltas, globalCounterDelta } = buildMoveDeltas({ ids: objectIds, state, toFolder });

			dispatch(adjustUnreadCounters({ folderCounterDeltas, globalCounterDelta }));

			const response = await runActionPromise({
				action: AjaxMethod.mailMoveToFolder,
				options: { ids: objectUidIds, folderPath },
			});

			if (response?.errors?.length > 0)
			{
				dispatch(adjustUnreadCounters({
					folderCounterDeltas: invertDeltas(folderCounterDeltas),
					globalCounterDelta: -globalCounterDelta,
				}));

				return response;
			}

			const missedIds = pickMissedIds({
				objectIds,
				objectUidIds,
				processedIds: response?.data?.processedIds,
				state,
			});

			if (missedIds.length > 0)
			{
				const missed = buildMoveDeltas({ ids: missedIds, state, toFolder });
				dispatch(adjustUnreadCounters({
					folderCounterDeltas: invertDeltas(missed.folderCounterDeltas),
					globalCounterDelta: -missed.globalCounterDelta,
				}));
			}

			return response;
		},
		{ condition },
	);

	function sendBindingEvent()
	{
		BX.postComponentEvent('Mail.Binding::bindingSent', []);
	}

	module.exports = {
		remove,
		markAsSpam,
		moveToFolder,
		changeReadStatus,
		addToCrm,
		addToChat,
		discussInChat,
		sendBindingEvent,
		addToTask,
		addToEvent,
		adjustUnreadCounters,
	};
});
