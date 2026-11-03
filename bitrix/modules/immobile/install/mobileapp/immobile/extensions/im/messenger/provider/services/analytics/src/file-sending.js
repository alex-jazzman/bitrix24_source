/**
 * @module im/messenger/provider/services/analytics/file-sending
 */
jn.define('im/messenger/provider/services/analytics/file-sending', (require, exports, module) => {
	const { AnalyticsEvent } = require('analytics');
	const { Analytics, NavigationTabId } = require('im/messenger/const');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { DialogHelper } = require('im/messenger/lib/helper');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');
	const { AnalyticsHelper } = require('im/messenger/provider/services/analytics/helper');

	/**
	 * @class FileSending
	 */
	class FileSending
	{
		constructor()
		{
			this.store = serviceLocator.get('core').getStore();
			this.logger = getLoggerWithContext('analytics-service', this);
		}

		get #recentManager()
		{
			const recentManager = serviceLocator.get('recent-manager');
			if (recentManager)
			{
				return recentManager;
			}

			this.logger.error('recentManager is not initialized.');

			return null;
		}

		/**
		 * @desc p4 of the event carries the channel axis only: it reports no project.
		 * @param {DialogId} dialogId
		 * @param {number} filesCount
		 */
		sendToastShownGalleryLimitExceeded({ dialogId, filesCount })
		{
			const dialog = this.store.getters['dialoguesModel/getById'](dialogId);
			const helper = DialogHelper.createByModel(dialog);
			const category = this.#getChatCategory(helper);
			const section = this.#getChatSection();
			try
			{
				const analytics = new AnalyticsEvent()
					.setTool(Analytics.Tool.im)
					.setCategory(category)
					.setEvent(Analytics.Event.galleryLimitException)
					.setSection(section)
					.setP1(AnalyticsHelper.getP1ByDialog(dialog))
					.setP3(`filesCount_${filesCount}`)

				const isChannelOrComment = helper?.isChannelOrComment;
				if (isChannelOrComment)
				{
					analytics.setP4(`parentChatId_${dialog.parentChatId}`);
				}

				if (helper?.isCollab)
				{
					analytics.setP2(AnalyticsHelper.getP2ByUserType());
				}

				analytics.send();
			}
			catch (error)
			{
				this.logger.error(`${this.constructor.name}.sendToastShownGalleryLimitExceeded.catch:`, error);
			}
		}

		/**
		 * @desc p4 of the event carries the channel axis only: it reports no project.
		 * @param {string} temporaryMessageId
		 * @param {string} fileId
		 */
		async sendFileUploadCancel({ temporaryMessageId, fileId })
		{
			const messageModel = this.store.getters['messagesModel/getById'](temporaryMessageId);
			const dialogModel = this.store.getters['dialoguesModel/getByChatId'](messageModel?.chatId);
			const helper = DialogHelper.createByModel(dialogModel);
			const category = this.#getChatCategory(helper);
			const section = this.#getChatSection();

			try
			{
				const analytics = new AnalyticsEvent()
					.setTool(Analytics.Tool.im)
					.setCategory(category)
					.setEvent(Analytics.Event.cancelFileUpload)
					.setSection(section)
					.setP1(AnalyticsHelper.getP1ByDialog(dialogModel));

				const isChannelOrComment = helper?.isChannelOrComment;
				if (isChannelOrComment)
				{
					analytics.setP4(`parentChatId_${dialogModel.parentChatId}`);
				}

				if (helper?.isCollab)
				{
					analytics.setP2(AnalyticsHelper.getP2ByUserType());
				}

				analytics.send();
			}
			catch (error)
			{
				this.logger.error(`${this.constructor.name}.sendToastShownFilesMoreThenHundred.catch:`, error);
			}
		}

		/**
		 * @param {DialogHelper|null} dialogHelper
		 * @return {string}
		 */
		#getChatCategory(dialogHelper)
		{
			return AnalyticsHelper.getCategoryByChat(dialogHelper?.dialogModel);
		}

		/**
		 * @return {string}
		 */
		#getChatSection()
		{
			switch (this.#recentManager?.getActiveRecentId())
			{
				case NavigationTabId.channel: return Analytics.Section.channelTab;
				case NavigationTabId.collab: return Analytics.Section.projectTab;
				default: return Analytics.Section.chatTab;
			}
		}
	}

	module.exports = { FileSending };
});
