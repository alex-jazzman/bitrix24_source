/**
 * @module mail/statemanager/redux/slices/folders/extra-reducer
 */
jn.define('mail/statemanager/redux/slices/folders/extra-reducer', (require, exports, module) => {
	const { foldersListAdapter } = require('mail/statemanager/redux/slices/folders/meta');
	const { DefaultFolderType } = require('mail/enum/default-folder-type');

	const changeReadStatusFulfilled = (state, action) => {
		const { errors, readDelta } = action.payload;

		if (errors && errors.length > 0)
		{
			return;
		}

		const entitiesArray = foldersListAdapter.getSelectors().selectAll(state);
		const currentFolder = entitiesArray.find((item) => item.path === state.currentFolderPath);

		if (currentFolder.unreadCount >= 0
			&& readDelta !== 0
			&& DefaultFolderType.isFolderWithCounterStatus(currentFolder.type)
		)
		{
			foldersListAdapter.upsertOne(state, {
				...currentFolder,
				unreadCount: currentFolder.unreadCount += readDelta,
			});
		}
	};

	const moveToFolderFulfilled = (state, action) => {
		const { errors, movedCount, fromFolderPath, toFolderPath } = action.payload;

		if (errors && errors.length > 0)
		{
			return;
		}

		const entitiesArray = foldersListAdapter.getSelectors().selectAll(state);
		const fromFolder = entitiesArray.find((item) => item.path === fromFolderPath);
		const toFolder = entitiesArray.find((item) => item.path === toFolderPath);
		if (movedCount > 0
		)
		{
			if (DefaultFolderType.isFolderWithCounterStatus(fromFolder.type))
			{
				foldersListAdapter.upsertOne(state, {
					...fromFolder,
					unreadCount: fromFolder.unreadCount -= movedCount,
				});
			}

			if (DefaultFolderType.isFolderWithCounterStatus(toFolder.type))
			{
				foldersListAdapter.upsertOne(state, {
					...toFolder,
					unreadCount: toFolder.unreadCount += movedCount,
				});
			}
		}
	};

	module.exports = {
		moveToFolderFulfilled,
		changeReadStatusFulfilled,
	};
});
