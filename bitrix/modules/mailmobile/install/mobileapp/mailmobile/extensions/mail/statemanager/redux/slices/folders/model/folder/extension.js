/**
 * @module mail/statemanager/redux/slices/folders/model/folder
 */
jn.define('mail/statemanager/redux/slices/folders/model/folder', (require, exports, module) => {
	class FolderModel
	{
		/**
		 * @public
		 * @param {object} sourceFolderData
		 * @returns {FolderReduxModel}
		 */
		static prepareReduxFolderFromServer(sourceFolderData)
		{
			return {
				id: Number(sourceFolderData.id),
				name: sourceFolderData.name,
				type: sourceFolderData.type,
				path: sourceFolderData.path,
				isHidden: sourceFolderData.isHidden,
				unreadCount: Number(sourceFolderData.unseen || 0),
				messageCount: Number(sourceFolderData.count || 0),
			};
		}
	}

	module.exports = { FolderModel };
});
