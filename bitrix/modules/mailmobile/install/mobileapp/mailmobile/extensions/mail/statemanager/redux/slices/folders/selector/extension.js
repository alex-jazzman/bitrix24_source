/**
 * @module mail/statemanager/redux/slices/folders/selector
 */
jn.define('mail/statemanager/redux/slices/folders/selector', (require, exports, module) => {
	const { sliceName, foldersListAdapter } = require('mail/statemanager/redux/slices/folders/meta');
	const { DefaultFolderType } = require('mail/enum/default-folder-type');

	const {
		selectAll: baseSelectAll,
		selectById,
		selectEntities,
	} = foldersListAdapter.getSelectors((state) => state[sliceName]);

	const selectAll = (state, getHiddenFolders = false) => {
		const allFolders = baseSelectAll(state);
		if (getHiddenFolders)
		{
			return allFolders;
		}

		return allFolders.filter((folder) => !folder.isHidden);
	};
	const selectCurrentFolderPath = (state) => state['mail:folders'].currentFolderPath;
	const selectCurrentFolder = (state) => {
		const currentFolderPath = selectCurrentFolderPath(state);

		return currentFolderPath ? selectByPath(state, currentFolderPath) : null;
	};

	const selectCurrentFolderCounter = (state) => {
		const currentFolder = selectCurrentFolder(state);

		return currentFolder ? currentFolder.unreadCount : null;
	};

	const selectByPath = (state, path, getHiddenFolders = false) => {
		const allFolders = selectAll(state, getHiddenFolders);

		return allFolders.find((folder) => folder.path === path) || null;
	};

	const selectByType = (state, type, getHiddenFolders = false) => {
		const allFolders = selectAll(state, getHiddenFolders);

		return allFolders.find((folder) => folder.type === type) || null;
	};

	const selectSystemFolders = (state, getHiddenFolders = false) => {
		const allFolders = selectAll(state, getHiddenFolders);

		return allFolders.filter((folder) => DefaultFolderType.getValues().includes(folder.type));
	};

	const selectCustomFolders = (state, getHiddenFolders = false) => {
		const allFolders = selectAll(state, getHiddenFolders);

		return allFolders.filter((folder) => folder.type === 'custom');
	};

	const selectFoldersByType = (state, type, getHiddenFolders = false) => {
		const allFolders = selectAll(state, getHiddenFolders);

		return allFolders.filter((folder) => folder.type === type);
	};

	const selectDefaultFolderByType = (state, type, getHiddenFolders = false) => {
		const allFolders = selectAll(state, getHiddenFolders);

		return allFolders.find((folder) => DefaultFolderType.getValues().includes(folder.type) && folder.type === type);
	};

	const selectTotalUnreadCount = (state, getHiddenFolders = false) => {
		const allFolders = selectAll(state, getHiddenFolders);

		return allFolders.reduce((total, folder) => total + folder.unreadCount, 0);
	};

	const selectTotalMessageCount = (state, getHiddenFolders = false) => {
		const allFolders = selectAll(state, getHiddenFolders);

		return allFolders.reduce((total, folder) => total + folder.messageCount, 0);
	};

	const selectFoldersWithUnread = (state, getHiddenFolders = false) => {
		const allFolders = selectAll(state, getHiddenFolders);

		return allFolders.filter((folder) => folder.unreadCount > 0);
	};

	const selectFoldersCount = (state, getHiddenFolders = false) => {
		return selectAll(state, getHiddenFolders).length;
	};

	const selectHasFolders = (state, getHiddenFolders = false) => {
		return selectFoldersCount(state, getHiddenFolders) > 0;
	};

	module.exports = {
		selectAll,
		selectById,
		selectEntities,
		selectByPath,
		selectCurrentFolderPath,
		selectCurrentFolder,
		selectSystemFolders,
		selectCustomFolders,
		selectFoldersByType,
		selectDefaultFolderByType,
		selectCurrentFolderCounter,

		selectTotalUnreadCount,
		selectTotalMessageCount,
		selectFoldersWithUnread,
		selectByType,
		selectFoldersCount,
		selectHasFolders,
	};
});
