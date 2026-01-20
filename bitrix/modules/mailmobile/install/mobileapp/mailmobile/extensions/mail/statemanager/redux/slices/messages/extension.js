/**
 * @module mail/statemanager/redux/slices/messages
 */
jn.define('mail/statemanager/redux/slices/messages', (require, exports, module) => {
	const { isOffline } = require('device/connection');

	const { createSlice } = require('statemanager/redux/toolkit');
	const { ReducerRegistry } = require('statemanager/redux/reducer-registry');

	const { sliceName, messagesListAdapter } = require('mail/statemanager/redux/slices/messages/meta');
	const { remove, changeReadStatus, moveToFolder, addToChat } = require('mail/statemanager/redux/slices/messages/thunk');
	const {
		removePending,
		removeFulfilled,
		changeReadStatusPending,
		changeReadStatusFulfilled,
		addToChatFulfilled,
	} = require('mail/statemanager/redux/slices/messages/extra-reducer');
	const { MessageModel } = require('mail/statemanager/redux/slices/messages/model/message');

	const preparePayload = (messages) => {
		return messages.map((message) => MessageModel.prepareReduxMailFromServer(message));
	};

	const messageListSlice = createSlice({
		name: sliceName,
		initialState: {
			...messagesListAdapter.getInitialState(),
			isMultiSelectMode: false,
			selectedIds: [],
		},
		reducers: {
			mailsUpsertedFromServer: {
				reducer: messagesListAdapter.upsertMany,
				prepare: (mails) => ({
					payload: preparePayload(mails),
				}),
			},
			mailsAddedFromServer: {
				reducer: messagesListAdapter.addMany,
				prepare: (mails) => ({
					payload: preparePayload(mails),
				}),
			},
			mailsUpserted: {
				reducer: messagesListAdapter.upsertMany,
			},
			mailsAdded: {
				reducer: messagesListAdapter.upsertMany,
			},
			markAsRemoved: (state, { payload }) => {
				if (isOffline())
				{
					return;
				}

				const { objectIds } = payload;
				const objectsToUpdate = objectIds.map((id) => {
					const object = state.entities[id];

					return object ? {
						...object,
						isRemoved: true,
					} : null;
				}).filter(Boolean);

				if (objectsToUpdate.length > 0)
				{
					messagesListAdapter.upsertMany(state, objectsToUpdate);
				}
			},
			unmarkAsRemoved: (state, { payload }) => {
				if (isOffline())
				{
					return;
				}

				const { objectIds } = payload;
				const objectsToUpdate = objectIds.map((id) => {
					const object = state.entities[id];

					return object ? {
						...object,
						isRemoved: false,
					} : null;
				}).filter(Boolean);

				if (objectsToUpdate.length > 0)
				{
					messagesListAdapter.upsertMany(state, objectsToUpdate);
				}
			},
			markAsSelected: (state, { payload }) => {
				if (isOffline())
				{
					return;
				}

				const { objectId } = payload;
				const object = state.entities[objectId];

				messagesListAdapter.upsertOne(state, {
					...object,
					isSelected: true,
				});

				if (!state.isMultiSelectMode)
				{
					state.isMultiSelectMode = true;
				}

				if (!state.selectedIds.includes(objectId))
				{
					state.selectedIds.push(objectId);
				}
			},
			unmarkAsSelected: (state, { payload }) => {
				if (isOffline())
				{
					return;
				}

				const { objectId } = payload;
				const object = state.entities[objectId];

				messagesListAdapter.upsertOne(state, {
					...object,
					isSelected: false,
				});

				if (state.selectedIds.includes(objectId))
				{
					state.selectedIds = state.selectedIds.filter((id) => id !== objectId);
				}

				if (state.selectedIds.length === 0)
				{
					state.isMultiSelectMode = false;
				}
			},
			setTaskId: (state, { payload }) => {
				if (isOffline())
				{
					return;
				}

				const { objectId, taskId } = payload;
				const object = state.entities[objectId];

				messagesListAdapter.upsertOne(state, {
					...object,
					taskBindId: taskId,
				});
			},
			setMultiSelectMode: (state, { payload }) => {
				if (isOffline())
				{
					return;
				}

				const { isMultiSelectMode } = payload;
				state.isMultiSelectMode = isMultiSelectMode;

				if (!isMultiSelectMode)
				{
					state.selectedIds = [];

					Object.keys(state.entities).forEach((id) => {
						const entity = state.entities[id];
						if (entity.isSelected)
						{
							messagesListAdapter.upsertOne(state, {
								...entity,
								isSelected: false,
							});
						}
					});
				}
			},
			clearSelection: (state) => {
				const previouslySelected = [...state.selectedIds];
				state.selectedIds = [];

				previouslySelected.forEach((id) => {
					const object = state.entities[id];
					if (object)
					{
						messagesListAdapter.upsertOne(state, {
							...object,
							isSelected: false,
						});
					}
				});
			},
			moveMessagesToFolder: (state, { payload }) => {
				const { messageIds, targetFolderId } = payload;
				const objectsToUpdate = messageIds.map((id) => {
					const message = state.entities[id];

					return message ? {
						...message,
						folderId: targetFolderId,
					} : null;
				}).filter(Boolean);

				if (objectsToUpdate.length > 0)
				{
					messagesListAdapter.upsertMany(state, objectsToUpdate);
				}
			},
		},
		extraReducers: (builder) => {
			builder
				.addCase(remove.pending, removePending)
				.addCase(remove.fulfilled, removeFulfilled)
				.addCase(changeReadStatus.pending, changeReadStatusPending)
				.addCase(changeReadStatus.fulfilled, changeReadStatusFulfilled)
				.addCase(moveToFolder.pending, removePending)
				.addCase(moveToFolder.fulfilled, removeFulfilled)
				.addCase(addToChat.fulfilled, addToChatFulfilled)
			;
		},
	});

	const { reducer: messageListReducer, actions } = messageListSlice;
	const {
		mailsUpsertedFromServer,
		mailsUpserted,
		setTaskId,
		mailsAddedFromServer,
		mailsAdded,
		markAsRemoved,
		unmarkAsRemoved,
		markAsSelected,
		unmarkAsSelected,
		setMultiSelectMode,
		clearSelection,
		moveMessagesToFolder,
	} = actions;

	ReducerRegistry.register(sliceName, messageListReducer);

	module.exports = {
		mailsUpsertedFromServer,
		mailsUpserted,
		setTaskId,
		mailsAddedFromServer,
		mailsAdded,
		markAsRemoved,
		unmarkAsRemoved,
		markAsSelected,
		unmarkAsSelected,
		setMultiSelectMode,
		clearSelection,
		moveMessagesToFolder,
	};
});
