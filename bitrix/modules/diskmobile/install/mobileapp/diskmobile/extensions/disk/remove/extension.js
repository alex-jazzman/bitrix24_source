/**
 * @module disk/remove
 */
jn.define('disk/remove', (require, exports, module) => {
	const { Loc } = require('loc');
	const { Feature } = require('feature');
	const { showRemoveToast } = require('toast/remove');

	const store = require('statemanager/redux/store');
	const { dispatch } = store;
	const {
		markAsRemoved,
		unmarkAsRemoved,
	} = require('disk/statemanager/redux/slices/files');
	const { remove } = require('disk/statemanager/redux/slices/files/thunk');
	const { selectById } = require('disk/statemanager/redux/slices/files/selector');

	const pendingRemovals = new Map();

	function finalizeRemove(objectId)
	{
		if (!pendingRemovals.has(objectId))
		{
			return;
		}

		pendingRemovals.delete(objectId);
		dispatch(remove({ objectId }));
	}

	function cancelRemove(objectId)
	{
		if (!pendingRemovals.has(objectId))
		{
			return;
		}

		pendingRemovals.delete(objectId);
		dispatch(
			unmarkAsRemoved({ objectId }),
		);
	}

	function finalizePendingRemovals({ relativeFolderId = null, parentWidget = null } = {})
	{
		[...pendingRemovals.entries()]
			.filter(([, pendingRemoval]) => (
				pendingRemoval.relativeFolderId === relativeFolderId
				&& pendingRemoval.parentWidget === parentWidget
			))
			.forEach(([objectId]) => finalizeRemove(objectId));
	}

	function removeObject(objectId, { relativeFolderId = null, parentWidget = null } = {})
	{
		const file = selectById(store.getState(), objectId);
		if (!file)
		{
			return;
		}

		if (!Feature.isToastSupported())
		{
			dispatch(remove({ objectId }));

			return;
		}

		dispatch(
			markAsRemoved({ objectId }),
		);
		pendingRemovals.set(objectId, { relativeFolderId, parentWidget });

		showRemoveToast(
			{
				message: file.isFolder
					? Loc.getMessage('M_DISK_FOLDER_REMOVE_TOAST_MESSAGE')
					: Loc.getMessage('M_DISK_FILE_REMOVE_TOAST_MESSAGE'),
				offset: 86,
				onButtonTap: () => cancelRemove(objectId),
				onTimerOver: () => finalizeRemove(objectId),
			},
		);
	}

	module.exports = { removeObject, finalizePendingRemovals };
});
