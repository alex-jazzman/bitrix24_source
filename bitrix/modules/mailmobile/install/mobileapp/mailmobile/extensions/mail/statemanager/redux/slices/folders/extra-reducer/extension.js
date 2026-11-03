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

	/**
	 * The label mode lives as long as the server says the domain is on: a gone flag takes the list
	 * back to all messages instead of leaving it on a folder that no longer exists for the client.
	 */
	const applyLabelsAvailability = (state, labelsAvailable) => {
		state.labelsAvailable = labelsAvailable === true;

		if (!state.labelsAvailable && state.currentVirtualFolderKey === 'label')
		{
			state.currentVirtualFolderKey = 'all_messages';
		}
	};

	module.exports = { adjustFolderUnreadCounters, applyLabelsAvailability };
});
