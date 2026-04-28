/**
 * @module mail/statemanager/redux/slices/folders/model/folder
 */
jn.define('mail/statemanager/redux/slices/folders/model/folder', (require, exports, module) => {
	class FolderModel
	{
		/**
		 * @public
		 * @param {object[]} serverFolders
		 * @param {number|null} parentId
		 * @returns {FolderReduxModel[]}
		 */
		static prepareReduxFoldersFromServer(serverFolders, parentId = null)
		{
			const result = [];

			for (const folder of serverFolders)
			{
				result.push({
					id: Number(folder.id),
					name: folder.name,
					type: folder.type,
					path: folder.path,
					isHidden: folder.isHidden,
					unreadCount: Number(folder.unseen || 0),
					messageCount: Number(folder.count || 0),
					parentId,
					hasChild: folder.dataset?.hasChild === true || folder.dataset?.hasChild === 1,
				});

				if (Array.isArray(folder.items) && folder.items.length > 0)
				{
					result.push(...FolderModel.prepareReduxFoldersFromServer(folder.items, Number(folder.id)));
				}
			}

			return result;
		}
	}

	module.exports = { FolderModel };
});
