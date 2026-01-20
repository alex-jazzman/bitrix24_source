/**
 * @module im/messenger/controller/dialog/lib/message-sender/src/recent-message-updater
 */
jn.define('im/messenger/controller/dialog/lib/message-sender/src/recent-message-updater', (require, exports, module) => {
	const { Type } = require('type');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { RecentDataConverter } = require('im/messenger/lib/converter/data/recent');
	const {
		MessageStatus,
		SubTitleIconType,
	} = require('im/messenger/const');

	/**
	 * @class RecentMessageUpdater
	 */
	class RecentMessageUpdater
	{
		/**
		 * @param {DialogId} dialogId
		 * @param {RecentModelState} recentModel
		 */
		constructor({ dialogId, recentModel })
		{
			this.dialogId = dialogId;
			this.recentModel = recentModel;
		}

		/**
		 * @private
		 * @return {MessengerCoreStore}
		 */
		get store()
		{
			return serviceLocator.get('core').getStore();
		}

		/**
		 * @private
		 * @return {?DialoguesModelState}
		 */
		get dialog()
		{
			return this.store.getters['dialoguesModel/getById'](this.dialogId);
		}

		/**
		 * @param {MessageId} messageId
		 * @param {(message: MessagesModelState) => boolean} isManualSend
		 * @return {Object|false}
		 */
		async updateByMessageId(messageId, isManualSend)
		{
			const messageModel = this.store.getters['messagesModel/getById'](messageId);
			const recentModel = this.recentModel;

			const isMessageFile = Type.isArray(messageModel.files) && messageModel.files.length > 0;
			const isUploadingMessage = this.store.getters['messagesModel/isUploadingMessage'](messageId);

			let subTitleIcon = SubTitleIconType.reply;
			if (isMessageFile && isUploadingMessage)
			{
				subTitleIcon = SubTitleIconType.wait;
			}

			if (messageModel.error)
			{
				subTitleIcon = isManualSend(messageModel) ? SubTitleIconType.error : SubTitleIconType.wait;
			}

			let status = MessageStatus.received;
			if (messageModel && Type.isBoolean(messageModel.viewedByOthers) && messageModel.viewedByOthers)
			{
				status = MessageStatus.delivered;
			}

			const date = new Date();

			let recentItem = RecentDataConverter.fromPushToModel({
				id: this.dialogId,
				chat: recentModel ? recentModel.chat : this.dialog,
				message: {
					id: messageId,
					senderId: messageModel.authorId,
					text: isMessageFile ? `[${BX.message('IM_F_FILE')}]` : messageModel.text,
					date,
					subTitleIcon,
					status,
				},
				lastActivityDate: date,
			});

			if (isUploadingMessage)
			{
				recentItem = {
					...recentModel,
					uploadingState: {
						lastActivityDate: date,
						message: recentItem.message,
					},
				};
			}

			return this.store.dispatch('recentModel/set', [recentItem]);
		}
	}

	module.exports = { RecentMessageUpdater };
});
