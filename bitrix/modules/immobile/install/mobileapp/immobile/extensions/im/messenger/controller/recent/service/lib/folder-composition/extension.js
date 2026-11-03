/**
 * @module im/messenger/controller/recent/service/lib/folder-composition
 */
jn.define('im/messenger/controller/recent/service/lib/folder-composition', (require, exports, module) => {
	const { Type } = require('type');
	const {
		NavigationTabByFolderCode,
		RecentTabByNavigationTab,
	} = require('im/messenger/const');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');

	/**
	 * @param {?FolderModelState} folder
	 * @return {boolean}
	 */
	const isPersonalFolder = (folder) => folder?.type === 'personal';

	/**
	 * A composite folder is the one with a non-empty source list, the same criterion the tab badge uses.
	 *
	 * @param {?FolderModelState} folder
	 * @return {boolean}
	 */
	const isCompositeFolder = (folder) => Type.isArrayFilled(folder?.sourceFolders);

	/**
	 * Two kinds of folder have a settings screen behind them: a composite one opens the composition
	 * settings, a personal one its own edit form. Every other folder has no entry to offer, so this
	 * is the union both the card of the folder list and the action menu of a tab ask about.
	 *
	 * @param {?FolderModelState} folder
	 * @return {boolean}
	 */
	const hasFolderSettingsEntry = (folder) => isCompositeFolder(folder) || isPersonalFolder(folder);

	/**
	 * Resolves a navigation tab into the set of recent sections its list is made of.
	 * Single entry point for both single-section tabs and folders.
	 */
	class FolderComposition
	{
		/**
		 * A system folder tab is identified by the tab id of its code, a personal one by the
		 * folder id, so both forms are resolved here.
		 *
		 * @param {string} tabId
		 * @return {?FolderModelState}
		 */
		static getFolderByTabId(tabId)
		{
			const store = serviceLocator.get('core').getStore();
			const folderId = Number(tabId);
			if (Number.isInteger(folderId))
			{
				return store.getters['folderModel/getById'](folderId);
			}

			const systemFolder = store.getters['folderModel/getList']()
				.find((folder) => folder.type === 'system' && NavigationTabByFolderCode[folder.code] === tabId)
			;

			if (systemFolder)
			{
				return systemFolder;
			}

			return null;
		}

		/**
		 * @param {string} tabId
		 * @return {Set<string>}
		 */
		static getSectionsByTabId(tabId)
		{
			const singleSection = RecentTabByNavigationTab[tabId];
			if (singleSection !== undefined)
			{
				return new Set([singleSection]);
			}

			const folder = FolderComposition.getFolderByTabId(tabId);
			if (!folder)
			{
				return new Set();
			}

			if (isCompositeFolder(folder))
			{
				return serviceLocator.get('core').getStore().getters['folderModel/getSourceSections'](folder.id);
			}

			if (folder.recentSection)
			{
				return new Set([folder.recentSection]);
			}

			return new Set();
		}
	}

	module.exports = { FolderComposition, hasFolderSettingsEntry, isCompositeFolder, isPersonalFolder };
});
