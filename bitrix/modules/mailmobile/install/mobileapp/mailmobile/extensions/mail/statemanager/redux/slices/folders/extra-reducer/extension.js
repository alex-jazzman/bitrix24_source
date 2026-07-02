/**
 * @module mail/statemanager/redux/slices/folders/extra-reducer
 */
jn.define('mail/statemanager/redux/slices/folders/extra-reducer', (require, exports, module) => {
	const { foldersListAdapter } = require('mail/statemanager/redux/slices/folders/meta');
	const { DefaultFolderType } = require('mail/enum/default-folder-type');

	const adjustFolderUnreadCounters = (state, folderCounterDeltas) => {
		if (!folderCounterDeltas)
		{
			return;
		}

		const entitiesArray = foldersListAdapter.getSelectors().selectAll(state);

		for (const [folderId, delta] of Object.entries(folderCounterDeltas))
		{
			const numericId = Number(folderId);
			if (!Number.isFinite(numericId))
			{
				continue;
			}

			const folder = entitiesArray.find((item) => item.id === numericId);

			if (folder && DefaultFolderType.isFolderWithCounterStatus(folder.type))
			{
				foldersListAdapter.upsertOne(state, {
					...folder,
					unreadCount: Math.max(0, folder.unreadCount + delta),
				});
			}
		}
	};

	module.exports = { adjustFolderUnreadCounters };
});
