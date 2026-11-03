/**
 * @module im/messenger/provider/services/analytics/download-file
 */
jn.define('im/messenger/provider/services/analytics/download-file', (require, exports, module) => {
	const { AnalyticsEvent } = require('analytics');

	const { Analytics } = require('im/messenger/const');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { AnalyticsHelper } = require('im/messenger/provider/services/analytics/helper');

	/**
	 * @class DownloadFile
	 */
	class DownloadFile
	{
		constructor()
		{
			this.store = serviceLocator.get('core').getStore();
			this.userId = serviceLocator.get('core').getUserId();
		}

		/**
		 * @param {Object} params
		 * @param {FileType} params.fileType
		 * @param {DialogId} params.dialogId
		 * @return {AnalyticsEvent}
		 */
		sendDownloadToDisk(params)
		{
			this.#sendDownload(params).setEvent(Analytics.Event.saveToDisk).send();
		}

		/**
		 * @param {Object} params
		 * @param {FileType} params.fileType
		 * @param {DialogId} params.dialogId
		 * @return {AnalyticsEvent}
		 */
		sendDownloadToDevice(params)
		{
			this.#sendDownload(params).setEvent(Analytics.Event.downloadFile).send();
		}

		/**
		 * @param {Object} params
		 * @param {FileType} params.fileType
		 * @param {DialogId} params.dialogId
		 * @param {DialogId} params.status
		 * @return {AnalyticsEvent}
		 */
		sendDownloadError(params)
		{
			this.#sendDownload(params).setEvent(Analytics.Event.downloadError).send();
		}

		/**
		 * @param {Object} params
		 * @param {FileType} params.fileType
		 * @param {DialogId} params.dialogId
		 * @param {string} params.status
		 * @return {AnalyticsEvent}
		 */
		#sendDownload({ fileType, dialogId, status, isNestedSection })
		{
			const dialogModel = this.store.getters['dialoguesModel/getById'](dialogId);
			const userModel = this.store.getters['usersModel/getById'](this.userId);

			const category = AnalyticsHelper.getCategoryByChat(dialogModel);

			const analytics = new AnalyticsEvent()
				.setTool(Analytics.Tool.im)
				.setCategory(category)
				.setType(Analytics.Type[fileType])
				.setSection(Analytics.Section.chatWindow)
				.setSubSection(Analytics.SubSection.contextMenu)
				.setP1(AnalyticsHelper.getP1ByDialog(dialogModel))
				.setP2(Analytics.P2[userModel.type])
				.setP5(this.#getChatP5(dialogModel));

			if (category === Analytics.Category.project)
			{
				const projectId = AnalyticsHelper.getFormattedProjectId(dialogModel);
				if (projectId)
				{
					analytics.setP4(projectId);
				}
			}

			if (isNestedSection)
			{
				analytics.setElement(Analytics.Element.more);
			}

			if (status)
			{
				analytics.setStatus(status);
			}

			return analytics;
		}

		#getChatP5(chatData)
		{
			return `chatId_${chatData.chatId}`;
		}
	}

	module.exports = { DownloadFile };
});
