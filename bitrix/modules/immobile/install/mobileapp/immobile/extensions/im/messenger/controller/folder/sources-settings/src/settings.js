/**
 * @module im/messenger/controller/folder/sources-settings/settings
 */
jn.define('im/messenger/controller/folder/sources-settings/settings', (require, exports, module) => {
	const { Type } = require('type');
	const { isOnline } = require('device/connection');
	const { Color } = require('tokens');
	const { Loc } = require('im/messenger/loc');
	const { NavigationTabByFolderCode } = require('im/messenger/const');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');
	const { Notification } = require('im/messenger/lib/ui/notification');
	const { FolderComposition } = require('im/messenger/controller/recent/service/lib/folder-composition');
	const { FolderSourcesDraft } = require('im/messenger/controller/folder/sources-settings/draft');
	const { FolderSourcesSettingsList } = require('im/messenger/controller/folder/sources-settings/settings-list');
	const {
		getFolderSources,
		updateFolderSources,
		showUpdateSuccessToast,
	} = require('im/messenger/controller/folder/lib/actions');

	const logger = getLoggerWithContext('folder--sources-settings', 'FolderSourcesSettings');

	/**
	 * The composition settings screen of a composite folder: a full screen page with a switcher
	 * per source and a footer. Public entry of the block: the neighbouring block opens the
	 * screen through it.
	 */
	class FolderSourcesSettings
	{
		/**
		 * Nothing is returned and nothing is promised to the caller: the saved composition is
		 * applied by the screen itself. The right to open the screen is decided by the caller
		 * too: the entry checks the connection and the core, not the permissions.
		 *
		 * @param {{ folderId: number|string, parentWidget?: object }} options
		 *   folderId - the id of the folder or the tab id of a system one; parentWidget is
		 *   optional, but a caller that has one must pass it, otherwise the screen ends up
		 *   under the slider
		 */
		static async open({ folderId, parentWidget } = {})
		{
			const opener = parentWidget || PageManager;

			if (!isOnline())
			{
				Notification.showOfflineToast({}, opener);

				return;
			}

			if (!serviceLocator.get('core'))
			{
				logger.error('open: messenger core is not ready');
				Notification.showErrorToast({}, opener);

				return;
			}

			const folder = FolderComposition.getFolderByTabId(folderId);
			if (!folder)
			{
				// an id that resolves to nothing is a mistake of the calling code rather than
				// of the person, so it goes to the log alone
				logger.error('open: folder is not found', folderId);

				return;
			}

			let draft = null;
			try
			{
				// the composition is read before the sheet opens, so that it never shows an
				// empty frame; a refusal leaves the screen closed and the toast is already up
				const { sources, folders } = await getFolderSources({
					folderId: folder.id,
					layoutWidget: opener,
				});

				draft = new FolderSourcesDraft(FolderSourcesSettings.#buildItems({ sources, folders }));
			}
			catch (error)
			{
				logger.error('open: sources are not loaded', error);

				return;
			}

			FolderSourcesSettings.#openScreen({ folder, draft, opener });
		}

		/**
		 * @param {{ sources: Array<object>, folders: Array<object> }} response
		 * @return {Array<object>}
		 */
		static #buildItems({ sources, folders })
		{
			// the item carries no text of its own: the title and the description live in the
			// folder object behind it, and the folder id is the only key between the two
			const folderById = new Map(folders.map((folder) => [folder.id, folder]));

			return sources.map((source) => {
				const folder = folderById.get(source.folderId);

				// the row of a nameless source is still built and still drawn: hidden, it would
				// keep its state travelling on save while the person could neither see nor
				// switch it
				if (!Type.isStringFilled(folder?.title))
				{
					logger.error('#buildItems: source has no title', source.code, source.folderId);
				}

				return {
					folderId: source.folderId,
					code: source.code,
					title: folder?.title ?? '',
					description: folder?.description ?? '',
					enabled: Boolean(source.enabled),
					togglable: Boolean(source.togglable),
				};
			});
		}

		/**
		 * The list of the section is rebuilt by its own service on the folder mutation, but the rows
		 * of a source just switched on arrive only with the first page from the server. Nothing is
		 * awaited here: the sheet closes and the toast is shown regardless of the load.
		 *
		 * @param {FolderModelState} folder
		 */
		static #reloadFolderSection(folder)
		{
			// the screen is reachable from the folder list of any tab, and then the section has no
			// controller yet: it loads itself on the first entry
			const tabId = NavigationTabByFolderCode[folder.code];
			const recent = serviceLocator.get('recent-manager')?.getRecentById(tabId);

			void recent?.reloadFirstPage();
		}

		/**
		 * @param {{ folder: FolderModelState, draft: FolderSourcesDraft, opener: object }} options
		 */
		static #openScreen({ folder, draft, opener })
		{
			let settingsList = null;
			let isSubmitting = false;

			opener.openWidget('layout', {
				titleParams: {
					text: Loc.getMessage('IMMOBILE_FOLDER_SOURCES_NAV_TITLE'),
					type: 'dialog',
				},
				backgroundColor: Color.bgContentPrimary.toHex(),
				onReady: (layoutWidget) => {
					settingsList = new FolderSourcesSettingsList({
						draft,
						onSave: async () => {
							if (isSubmitting)
							{
								return;
							}

							isSubmitting = true;
							try
							{
								const appliedCodes = await updateFolderSources({
									folderId: folder.id,
									sourceCodes: draft.getCodesToSend(),
									layoutWidget,
								});

								settingsList?.markSaved(appliedCodes);
								FolderSourcesSettings.#reloadFolderSection(folder);
								layoutWidget.close(() => showUpdateSuccessToast(opener));
							}
							catch (error)
							{
								// the toast of the refusal is already shown by the action, and the
								// switchers keep the choice: saving can be repeated as it is
								logger.error('save sources error', error);
							}
							finally
							{
								isSubmitting = false;
								settingsList?.saveButton?.setLoading(false);
							}
						},
					});

					layoutWidget.showComponent(settingsList);
				},
			}).catch((error) => {
				logger.error('#openScreen: widget is not opened', error);
			});
		}
	}

	module.exports = { FolderSourcesSettings };
});
