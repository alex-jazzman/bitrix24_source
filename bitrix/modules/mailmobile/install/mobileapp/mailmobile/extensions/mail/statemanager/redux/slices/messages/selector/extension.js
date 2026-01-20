/**
 * @module mail/statemanager/redux/slices/messages/selector
 */
jn.define('mail/statemanager/redux/slices/messages/selector', (require, exports, module) => {
	const { sliceName, messagesListAdapter } = require('mail/statemanager/redux/slices/messages/meta');

	const {
		selectAll,
		selectById,
		selectEntities,
		selectIds,
		selectTotal,
	} = messagesListAdapter.getSelectors((state) => state[sliceName]);

	const selectIsMultiSelectMode = (state) => state[sliceName].isMultiSelectMode;
	const selectSelectedIds = (state) => state[sliceName].selectedIds;
	const selectSelectedCount = (state) => state[sliceName].selectedIds.length;
	const selectOriginalReadStatuses = (state) => state[sliceName].originalReadStatuses;
	const selectSelectedMessages = (state) => {
		const entities = selectEntities(state);
		const selectedIds = selectSelectedIds(state);

		return selectedIds.map((id) => entities[id]).filter(Boolean);
	};

	const selectSelectedUidIds = (state) => {
		const entities = selectEntities(state);
		const selectedIds = selectSelectedIds(state);

		return selectedIds
			.map((id) => entities[id]?.uidId)
			.filter(Boolean);
	};

	const selectMessagesByFolder = (state, folderId) => {
		const allMessages = selectAll(state);

		return allMessages.filter((message) => message.folderId === folderId);
	};

	const selectUnreadMessagesByFolder = (state, folderId) => {
		const folderMessages = selectMessagesByFolder(state, folderId);

		return folderMessages.filter((message) => !message.isRead);
	};

	const selectMessageCountByFolder = (state, folderId) => {
		return selectMessagesByFolder(state, folderId).length;
	};

	const selectUnreadCountByFolder = (state, folderId) => {
		return selectUnreadMessagesByFolder(state, folderId).length;
	};

	const selectUidIdsByIds = (state, ids) => {
		return ids
			.map((id) => selectById(state, id)?.uidId)
			.filter(Boolean);
	};

	module.exports = {
		selectAll,
		selectById,
		selectEntities,
		selectSelectedUidIds,
		selectIds,
		selectTotal,
		selectIsMultiSelectMode,
		selectSelectedIds,
		selectSelectedCount,
		selectSelectedMessages,
		selectMessagesByFolder,
		selectUnreadMessagesByFolder,
		selectMessageCountByFolder,
		selectUnreadCountByFolder,
		selectOriginalReadStatuses,
		selectUidIdsByIds,
	};
});
