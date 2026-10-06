/**
 * @module im/messenger/provider/services/analytics/src/folder
 */
jn.define('im/messenger/provider/services/analytics/src/folder', (require, exports, module) => {
	const { AnalyticsEvent } = require('analytics');
	const { Analytics } = require('im/messenger/const');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { AnalyticsHelper } = require('im/messenger/provider/services/analytics/helper');

	/**
	 * @class FolderAnalytics
	 */
	class FolderAnalytics
	{
		/** @private */
		get store()
		{
			return serviceLocator.get('core').getStore();
		}

		/**
		 * @param {string} subSection - Analytics.SubSection.createBox | Analytics.SubSection.folderList
		 */
		sendClickCreateFolder(subSection)
		{
			new AnalyticsEvent()
				.setTool(Analytics.Tool.im)
				.setCategory(Analytics.Category.folders)
				.setEvent(Analytics.Event.clickCreateFolder)
				.setSubSection(subSection)
				.send()
			;
		}

		/**
		 * @param {object} params
		 * @param {number} params.folderId
		 * @param {string} params.subSection - Analytics.SubSection.folderContextMenu | Analytics.SubSection.settings
		 */
		sendClickDelete({ folderId, subSection })
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

		/**
		 * @param {object} params
		 * @param {DialogId} params.dialogId
		 * @param {string} params.subSection - Analytics.SubSection.recentContextMenu | Analytics.SubSection.recentSwipeMenu
		 */
		sendAddToFolder({ dialogId, subSection })
		{
			const dialog = this.store.getters['dialoguesModel/getById'](dialogId);
			if (!dialog)
			{
				return;
			}

			new AnalyticsEvent()
				.setTool(Analytics.Tool.im)
				.setCategory(AnalyticsHelper.getCategoryByChatType(dialog.type))
				.setEvent(Analytics.Event.addToFolder)
				.setSection(AnalyticsHelper.getSectionCode())
				.setSubSection(subSection)
				.setP1(AnalyticsHelper.getP1ByDialog(dialog))
				.send()
			;
		}

		/**
		 * @param {string} subSection - Analytics.SubSection.folderContextMenu | Analytics.SubSection.settings
		 */
		sendOpenList(subSection)
		{
			new AnalyticsEvent()
				.setTool(Analytics.Tool.im)
				.setCategory(Analytics.Category.folders)
				.setEvent(Analytics.Event.openList)
				.setSubSection(subSection)
				.send()
			;
		}

		/**
		 * @param {string} subSection - Analytics.SubSection.folderContextMenu | Analytics.SubSection.settings
		 */
		sendClickEdit(subSection)
		{
			new AnalyticsEvent()
				.setTool(Analytics.Tool.im)
				.setCategory(Analytics.Category.folders)
				.setEvent(Analytics.Event.clickEdit)
				.setSubSection(subSection)
				.send()
			;
		}

		/**
		 * @param {object} params
		 * @param {number} params.folderId
		 */
		sendOpenFolder({ folderId })
		{
			const folder = this.store.getters['folderModel/getById'](folderId);
			const type = (folder && folder.type === 'system' && folder.code)
				? folder.code
				: Analytics.Type.userFolder
			;

			new AnalyticsEvent()
				.setTool(Analytics.Tool.im)
				.setCategory(Analytics.Category.folders)
				.setEvent(Analytics.Event.openFolder)
				.setType(type)
				.send()
			;
		}
	}

	module.exports = { FolderAnalytics };
});
