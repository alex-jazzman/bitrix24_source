/**
 * @module mail/statemanager/redux/slices/folders/observers/stateful-list
 */
jn.define('mail/statemanager/redux/slices/folders/observers/stateful-list', (require, exports, module) => {
	const {
		selectEntities,
		selectCurrentFolder,
	} = require('mail/statemanager/redux/slices/folders/selector');
	const { isEqual } = require('utils/object');

	const observeFoldersChange = (store, onChange) => {
		let prevFolders = selectEntities(store.getState());
		let prevCurrentFolder = selectCurrentFolder(store.getState());

		return store.subscribe(() => {
			let selected = null;
			const nextFolders = selectEntities(store.getState());
			const nextCurrentFolder = selectCurrentFolder(store.getState());
			const {
				moved,
				removed,
				added,
				created,
			} = getDiffForFoldersObserver(prevFolders, nextFolders);
			const isCurrentFolderChanged = (prevCurrentFolder !== null && nextCurrentFolder !== null)
				&& (prevCurrentFolder.id !== nextCurrentFolder.id);

			if (isCurrentFolderChanged)
			{
				selected = nextCurrentFolder;
			}

			if (
				moved.length > 0 || removed.length > 0
				|| added.length > 0 || created.length > 0
				|| isCurrentFolderChanged
			)
			{
				onChange({
					moved,
					removed,
					added,
					created,
					selected,
				});
			}

			prevFolders = nextFolders;
			prevCurrentFolder = nextCurrentFolder;
		});
	};

	/**
	 * @private
	 * @param {Object.<number, FolderReduxModel>} prevFolders
	 * @param {Object.<number, FolderReduxModel>} nextFolders
	 * @return {{
	 * moved: FolderReduxModel[],
	 * removed: FolderReduxModel[],
	 * added: FolderReduxModel[],
	 * created: FolderReduxModel[]
	 * }}
	 */
	const getDiffForFoldersObserver = (prevFolders, nextFolders) => {
		const moved = [];
		const removed = [];
		const added = [];
		const created = [];

		if (prevFolders === nextFolders)
		{
			return { moved, removed, added, created };
		}

		Object.values(prevFolders).forEach((prevFolder) => {
			const nextFolder = nextFolders[prevFolder.id];
			if (!nextFolder)
			{
				removed.push(prevFolder);
			}
		});

		Object.values(nextFolders).forEach((nextFolder) => {
			const prevFolder = prevFolders[nextFolder.id];

			if (!prevFolder)
			{
				added.push(nextFolder);
				created.push(nextFolder);
			}
			else if (!isEqual(prevFolder, nextFolder))
			{
				moved.push(nextFolder);
			}
		});

		return { moved, removed, added, created };
	};

	module.exports = {
		observeFoldersChange,
	};
});
