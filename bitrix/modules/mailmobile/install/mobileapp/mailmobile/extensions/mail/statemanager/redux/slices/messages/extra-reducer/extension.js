/**
 * @module mail/statemanager/redux/slices/messages/extra-reducer
 */
jn.define('mail/statemanager/redux/slices/messages/extra-reducer', (require, exports, module) => {
	const { showErrorToast } = require('toast');
	const { messagesListAdapter } = require('mail/statemanager/redux/slices/messages/meta');

	const removePending = (state, action) => {
		const objectIds = action.meta.arg.objectIds;

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
	};

	const removeFulfilled = (state, action) => {
		const objectIds = action.meta.arg.objectIds;

		const { errors } = action.payload;
		if (errors && errors.length > 0)
		{
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
			showErrorToast(errors[0]);
		}
		else
		{
			messagesListAdapter.removeMany(state, objectIds);
		}
	};

	const changeReadStatusPending = (state, action) => {
		const { objectIds, isRead } = action.meta.arg;
		if (!state.originalReadStatuses)
		{
			state.originalReadStatuses = {};
		}

		objectIds.forEach((id) => {
			const object = state.entities[id];
			if (object)
			{
				state.originalReadStatuses[id] = object.isRead;
			}
		});

		const objectsToUpdate = objectIds.map((id) => {
			const object = state.entities[id];

			return object ? {
				...object,
				isRead,
			} : null;
		}).filter(Boolean);

		if (objectsToUpdate.length > 0)
		{
			messagesListAdapter.upsertMany(state, objectsToUpdate);
		}
	};

	const changeReadStatusFulfilled = (state, action) => {
		const { objectIds, isRead: targetIsRead } = action.meta.arg;
		const { errors } = action.payload;

		if (errors && errors.length > 0)
		{
			const objectsToUpdate = objectIds.map((id) => {
				const object = state.entities[id];
				if (!object)
				{
					return null;
				}

				const originalStatus = state.originalReadStatuses?.[id];

				return {
					...object,
					isRead: originalStatus === undefined ? !targetIsRead : originalStatus,
				};
			}).filter(Boolean);

			if (objectsToUpdate.length > 0)
			{
				messagesListAdapter.upsertMany(state, objectsToUpdate);
			}
			showErrorToast(errors[0]);

			if (state.originalReadStatuses)
			{
				objectIds.forEach((id) => {
					delete state.originalReadStatuses[id];
				});
			}

			return;
		}

		const objectsToUpdate = objectIds.map((id) => {
			const object = state.entities[id];

			return object ? {
				...object,
				isRead: targetIsRead,
			} : null;
		}).filter(Boolean);

		if (objectsToUpdate.length > 0)
		{
			messagesListAdapter.upsertMany(state, objectsToUpdate);
		}

		if (state.originalReadStatuses)
		{
			objectIds.forEach((id) => {
				delete state.originalReadStatuses[id];
			});
		}
	};

	const addToChatFulfilled = (state, action) => {
		const chatId = action.payload.data;
		const objectId = action.meta.arg.objectId;
		const object = state.entities[objectId];

		messagesListAdapter.upsertOne(state, {
			...object,
			chatBindId: chatId,
		});
	};

	module.exports = {
		removePending,
		removeFulfilled,
		changeReadStatusPending,
		changeReadStatusFulfilled,
		addToChatFulfilled,
	};
});
