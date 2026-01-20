/**
 * @module mail/statemanager/redux/slices/messages/thunk
 */
jn.define('mail/statemanager/redux/slices/messages/thunk', (require, exports, module) => {
	const { createAsyncThunk } = require('statemanager/redux/toolkit');
	const { sliceName } = require('mail/statemanager/redux/slices/messages/meta');
	const { AjaxMethod } = require('mail/const');
	const { RunActionExecutor } = require('rest/run-action-executor');
	const { isOnline } = require('device/connection');
	const { selectUidIdsByIds, selectOriginalReadStatuses, selectById } = require('mail/statemanager/redux/slices/messages/selector');
	const { selectCurrentFolderPath } = require('mail/statemanager/redux/slices/folders/selector');

	const condition = () => isOnline();

	const runActionPromise = ({ action, options }) => new Promise((resolve) => {
		(new RunActionExecutor(action, options)).setHandler(resolve).call(false);
	});

	const remove = createAsyncThunk(
		`${sliceName}/remove`,
		({ objectUidIds }) => runActionPromise({
			action: AjaxMethod.mailDelete,
			options: { ids: objectUidIds },
		}),
		{ condition },
	);

	const changeReadStatus = createAsyncThunk(
		`${sliceName}/changeReadStatus`,
		async ({ objectUidIds, objectIds, isRead }, { getState }) => {
			const state = getState();
			const originalReadStatuses = selectOriginalReadStatuses(state) || {};
			const filteredObjectIds = [];
			let readDelta = 0;

			objectIds.forEach((id) => {
				const wasRead = originalReadStatuses[id];

				if (wasRead !== undefined && Boolean(wasRead) !== Boolean(isRead))
				{
					readDelta += isRead ? -1 : 1;
					filteredObjectIds.push(id);
				}
			});
			const filteredObjectUidIds = selectUidIdsByIds(state, filteredObjectIds) ?? [];

			if (filteredObjectUidIds.length === 0)
			{
				return {};
			}

			const response = await runActionPromise({
				action: AjaxMethod.mailChangeReadStatus,
				options: { ids: filteredObjectUidIds, isRead },
			});

			return {
				...response,
				isRead,
				readDelta,
			};
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

	const addToChat = createAsyncThunk(
		`${sliceName}/addToChat`,
		({ objectId }) => runActionPromise({
			action: AjaxMethod.mailCreateChat,
			options: { messageId: objectId },
		}),
		{ condition },
	);

	const moveToFolder = createAsyncThunk(
		`${sliceName}/moveToFolder`,
		async ({ objectUidIds, objectIds, folderPath }, { getState }) => {
			const state = getState();
			const currentFolderPath = selectCurrentFolderPath(state);

			const unreadMovedCount = objectIds.reduce((acc, id) => {
				const msg = selectById(state, id);

				return msg?.isRead ? acc : acc + 1;
			}, 0);

			const response = await runActionPromise({
				action: AjaxMethod.mailMoveToFolder,
				options: { ids: objectUidIds, folderPath },
			});

			return {
				...response,
				movedCount: unreadMovedCount,
				fromFolderPath: currentFolderPath,
				toFolderPath: folderPath,
			};
		},
		{ condition },
	);

	function sendBindingEvent()
	{
		BX.postComponentEvent('Mail.Binding::bindingSent', []);
	}

	module.exports = {
		remove,
		moveToFolder,
		changeReadStatus,
		addToCrm,
		addToChat,
		sendBindingEvent,
		addToTask,
	};
});
