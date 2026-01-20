/**
 * @module mail/statemanager/redux/slices/folders
 */
jn.define('mail/statemanager/redux/slices/folders', (require, exports, module) => {
	const { ReducerRegistry } = require('statemanager/redux/reducer-registry');
	const { createSlice } = require('statemanager/redux/toolkit');
	const { FolderModel } = require('mail/statemanager/redux/slices/folders/model/folder');
	const { sliceName, foldersListAdapter } = require('mail/statemanager/redux/slices/folders/meta');
	const { changeReadStatus, moveToFolder } = require('mail/statemanager/redux/slices/messages/thunk');
	const { changeReadStatusFulfilled, moveToFolderFulfilled } = require('mail/statemanager/redux/slices/folders/extra-reducer');

	const preparePayload = (folders) => {
		return folders.map((folder) => FolderModel.prepareReduxFolderFromServer(folder));
	};

	const foldersSlice = createSlice({
		name: sliceName,
		initialState: {
			...foldersListAdapter.getInitialState(),
			currentFolderPath: null,
		},
		reducers: {
			foldersUpserted: {
				reducer: foldersListAdapter.upsertMany,
				prepare: (folders) => ({
					payload: preparePayload(folders),
				}),
			},
			foldersAdded: {
				reducer: foldersListAdapter.addMany,
				prepare: (folders) => ({
					payload: preparePayload(folders),
				}),
			},
			folderUpdated: {
				reducer: foldersListAdapter.upsertOne,
				prepare: (folder) => ({
					payload: FolderModel.prepareReduxFolderFromServer(folder),
				}),
			},
			setCurrentFolder: (state, { payload }) => {
				const { folderPath } = payload;
				state.currentFolderPath = folderPath;
			},
			updateFolderCounters: (state, { payload }) => {
				const { folderId, unreadCount, messageCount } = payload;
				const folder = state.entities[folderId];

				if (folder)
				{
					foldersListAdapter.upsertOne(state, {
						...folder,
						unreadCount: Number(unreadCount || 0),
						messageCount: Number(messageCount || 0),
					});
				}
			},
			clearFolders: foldersListAdapter.removeAll,
		},
		extraReducers: (builder) => {
			builder
				.addCase(changeReadStatus.fulfilled, changeReadStatusFulfilled)
				.addCase(moveToFolder.fulfilled, moveToFolderFulfilled)
			;
		},
	});

	const {
		foldersUpserted,
		foldersAdded,
		folderUpdated,
		setCurrentFolder,
		updateFolderCounters,
		clearFolders,
	} = foldersSlice.actions;

	ReducerRegistry.register(sliceName, foldersSlice.reducer);

	module.exports = {
		foldersUpserted,
		foldersAdded,
		folderUpdated,
		setCurrentFolder,
		updateFolderCounters,
		clearFolders,
	};
});
