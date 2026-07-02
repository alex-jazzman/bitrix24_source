/**
 * @module mail/statemanager/redux/slices/folders
 */
jn.define('mail/statemanager/redux/slices/folders', (require, exports, module) => {
	const { ReducerRegistry } = require('statemanager/redux/reducer-registry');
	const { StateCache } = require('statemanager/redux/state-cache');
	const { createSlice } = require('statemanager/redux/toolkit');
	const { FolderModel } = require('mail/statemanager/redux/slices/folders/model/folder');
	const { sliceName, foldersListAdapter } = require('mail/statemanager/redux/slices/folders/meta');
	const { adjustUnreadCounters } = require('mail/statemanager/redux/slices/messages/thunk');
	const { adjustFolderUnreadCounters } = require('mail/statemanager/redux/slices/folders/extra-reducer');

	const preparePayload = (folders) => {
		return FolderModel.prepareReduxFoldersFromServer(folders);
	};

	const defaultState = {
		...foldersListAdapter.getInitialState(),
		currentFolderPath: null,
		currentVirtualFolderKey: null,
	};
	const initialState = StateCache.getReducerState(sliceName, defaultState);

	const foldersSlice = createSlice({
		name: sliceName,
		initialState,
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
				reducer: foldersListAdapter.upsertMany,
				prepare: (folder) => ({
					payload: FolderModel.prepareReduxFoldersFromServer([folder]),
				}),
			},
			setCurrentFolder: (state, { payload }) => {
				const { folderPath } = payload;
				state.currentFolderPath = folderPath;
				state.currentVirtualFolderKey = null;
			},
			setCurrentVirtualFolderKey: (state, { payload }) => {
				const { key } = payload;
				state.currentVirtualFolderKey = key;
			},
			clearFolders: foldersListAdapter.removeAll,
		},
		extraReducers: (builder) => {
			builder
				.addCase(adjustUnreadCounters, (state, action) => {
					const { folderCounterDeltas } = action.payload;
					adjustFolderUnreadCounters(state, folderCounterDeltas);
				})
			;
		},
	});

	const {
		foldersUpserted,
		foldersAdded,
		folderUpdated,
		setCurrentFolder,
		setCurrentVirtualFolderKey,
		clearFolders,
	} = foldersSlice.actions;

	ReducerRegistry.register(sliceName, foldersSlice.reducer);

	module.exports = {
		foldersUpserted,
		foldersAdded,
		folderUpdated,
		setCurrentFolder,
		setCurrentVirtualFolderKey,
		clearFolders,
	};
});
