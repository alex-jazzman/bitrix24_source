/**
 * @module im/messenger/provider/services/analytics/src/folder
 */
jn.define('im/messenger/provider/services/analytics/src/folder', (require, exports, module) => {
	const { AnalyticsEvent } = require('analytics');
	const { Analytics } = require('im/messenger/const');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');
	const { AnalyticsHelper } = require('im/messenger/provider/services/analytics/helper');

	// Types the open_folder event does not report.
	// "All" is the start section of navigation, not a move between folders (analytics label table,
	// row open_folder), so its absence from the type set is deliberate, not a forgotten case.
	const TYPES_WITHOUT_OPEN_FOLDER_EVENT = [Analytics.Type.Folder.all];

	// The project folder is coded as 'collab' inside the app; the open_folder row of the label table
	// reports it as a single project, not as the folder of them all (analyst feedback, master).
	const ANALYTICS_TYPE_BY_FOLDER_CODE = {
		collab: Analytics.Type.Dialog.project,
	};

	// Folder codes left out of the type slot of the folder domain. The app folder holds a value of the
	// report dictionary and feeds c_section with it, but the folder domain reports nothing about a folder
	// of another team: the web leaves it out of its own type map, and a type sent from one platform alone
	// would split the row.
	const CODES_WITHOUT_FOLDER_EVENT_TYPE = ['vibecodeApp'];

	/**
	 * @class FolderAnalytics
	 */
	class FolderAnalytics
	{
		constructor()
		{
			/** @private */
			this.logger = getLoggerWithContext('analytics-service', this);
		}

		/** @private */
		get store()
		{
			return serviceLocator.get('core').getStore();
		}

		/**
		 * @desc Single place that knows the report dictionary of folder types: a system folder reports the
		 *       value its code is mapped to, a personal one the shared user folder value. Codes outside the
		 *       map ('default'), the codes this domain reports no type for and a folder that is not in the
		 *       store give no value at all, and it is up to each event to decide whether it still has
		 *       something to report.
		 * @param {?FolderModelState} folder
		 * @return {string|undefined}
		 */
		#getFolderType(folder)
		{
			if (!folder || CODES_WITHOUT_FOLDER_EVENT_TYPE.includes(folder.code))
			{
				return undefined;
			}

			return folder.type === 'system'
				? Analytics.Type.Folder[folder.code]
				: Analytics.Type.userFolder
			;
		}

		/**
		 * @desc The entry of the create goes to the section slot, the one the label table names for this
		 *       event and the one the web sends it in: the same label read from two platforms has to fall
		 *       into one column of the report.
		 * @param {string} section - Analytics.Section.createBox | Analytics.Section.folderList
		 */
		sendClickCreateFolder(section)
		{
			try
			{
				new AnalyticsEvent()
					.setTool(Analytics.Tool.im)
					.setCategory(Analytics.Category.folders)
					.setEvent(Analytics.Event.clickCreateFolder)
					.setSection(section)
					.send()
				;
			}
			catch (error)
			{
				this.logger.error('sendClickCreateFolder error', error);
			}
		}

		/**
		 * @param {object} params
		 * @param {number} params.folderId
		 * @param {string} params.subSection - Analytics.SubSection.folderContextMenu | Analytics.SubSection.settings
		 */
		sendClickDelete({ folderId, subSection })
		{
			try
			{
				const folder = this.store.getters['folderModel/getById'](folderId);
				const chatIds = folder?.chatIds || [];
				const type = chatIds.length > 0 ? Analytics.Type.nonEmpty : Analytics.Type.empty;

				new AnalyticsEvent()
					.setTool(Analytics.Tool.im)
					.setCategory(Analytics.Category.folders)
					.setEvent(Analytics.Event.clickDelete)
					.setType(type)
					.setSubSection(subSection)
					.send()
				;
			}
			catch (error)
			{
				this.logger.error('sendClickDelete error', error);
			}
		}

		/**
		 * @param {object} params
		 * @param {DialogId} params.dialogId
		 * @param {string} params.subSection - Analytics.SubSection.recentContextMenu
		 *        | Analytics.SubSection.recentSwipeMenu
		 */
		sendAddToFolder({ dialogId, subSection })
		{
			this.#sendChatMembershipEvent(Analytics.Event.addToFolder, { dialogId, subSection });
		}

		/**
		 * @param {object} params
		 * @param {DialogId} params.dialogId
		 * @param {string} [params.subSection] - Analytics.SubSection.recentContextMenu
		 *        | Analytics.SubSection.recentSwipeMenu
		 * @param {string} [params.section] - overrides the folder the user stands in
		 */
		sendDeleteFromFolder({ dialogId, subSection, section })
		{
			this.#sendChatMembershipEvent(Analytics.Event.deleteFromFolder, { dialogId, subSection, section });
		}

		/**
		 * @desc Both halves of one membership change answer the same question - which chat moved and
		 *       where the user was - so they share the payload. The surface is left out where the label
		 *       table has no value for it (the composition form of a folder is one): a lost slot is
		 *       better than an invented value.
		 * @private
		 * @param {string} event
		 * @param {{dialogId: DialogId, subSection: ?string, section: ?string}} params
		 */
		#sendChatMembershipEvent(event, { dialogId, subSection, section })
		{
			try
			{
				const dialog = this.store.getters['dialoguesModel/getById'](dialogId);
				if (!dialog)
				{
					return;
				}

				const analytics = new AnalyticsEvent()
					.setTool(Analytics.Tool.im)
					.setCategory(AnalyticsHelper.getCategoryByChat(dialog))
					.setEvent(event)
					.setSection(section ?? AnalyticsHelper.getFolderSectionCode())
					.setP1(AnalyticsHelper.getP1ByDialog(dialog))
				;

				if (subSection)
				{
					analytics.setSubSection(subSection);
				}

				analytics.send();
			}
			catch (error)
			{
				this.logger.error(`${event} error`, error);
			}
		}

		/**
		 * @param {string} subSection - Analytics.SubSection.folderContextMenu | Analytics.SubSection.settings
		 */
		sendOpenList(subSection)
		{
			try
			{
				new AnalyticsEvent()
					.setTool(Analytics.Tool.im)
					.setCategory(Analytics.Category.folders)
					.setEvent(Analytics.Event.openList)
					.setSubSection(subSection)
					.send()
				;
			}
			catch (error)
			{
				this.logger.error('sendOpenList error', error);
			}
		}

		/**
		 * @desc Unlike opening a folder, this is a click and always reports: when the folder gives no type,
		 *       the slot is left empty and the event still goes, because a lost click is worse than a
		 *       typeless one.
		 * @param {object} params
		 * @param {number} params.folderId
		 * @param {string} params.subSection - Analytics.SubSection.folderContextMenu | Analytics.SubSection.folderList
		 */
		sendClickEdit({ folderId, subSection })
		{
			try
			{
				const folder = this.store.getters['folderModel/getById'](folderId);

				new AnalyticsEvent()
					.setTool(Analytics.Tool.im)
					.setCategory(Analytics.Category.folders)
					.setEvent(Analytics.Event.clickEdit)
					.setType(this.#getFolderType(folder))
					.setSubSection(subSection)
					.send()
				;
			}
			catch (error)
			{
				this.logger.error('sendClickEdit error', error);
			}
		}

		/**
		 * @param {object} params
		 * @param {number} params.folderId
		 */
		sendOpenFolder({ folderId })
		{
			try
			{
				const folder = this.store.getters['folderModel/getById'](folderId);
				if (!folder)
				{
					return;
				}

				const type = ANALYTICS_TYPE_BY_FOLDER_CODE[folder.code] ?? this.#getFolderType(folder);
				// no value in the map: 'default' ("Chats")
				if (!type)
				{
					return;
				}

				if (TYPES_WITHOUT_OPEN_FOLDER_EVENT.includes(type))
				{
					return;
				}

				new AnalyticsEvent()
					.setTool(Analytics.Tool.im)
					.setCategory(Analytics.Category.folders)
					.setEvent(Analytics.Event.openFolder)
					.setType(type)
					.send()
				;
			}
			catch (error)
			{
				this.logger.error('sendOpenFolder error', error);
			}
		}

		sendFolderLimitException()
		{
			try
			{
				new AnalyticsEvent()
					.setTool(Analytics.Tool.im)
					.setCategory(Analytics.Category.folders)
					.setEvent(Analytics.Event.folderLimitException)
					.send()
				;
			}
			catch (error)
			{
				this.logger.error('sendFolderLimitException error', error);
			}
		}

		sendChatLimitException()
		{
			try
			{
				new AnalyticsEvent()
					.setTool(Analytics.Tool.im)
					.setCategory(Analytics.Category.folders)
					.setEvent(Analytics.Event.chatLimitException)
					.send()
				;
			}
			catch (error)
			{
				this.logger.error('sendChatLimitException error', error);
			}
		}
	}

	module.exports = { FolderAnalytics };
});
