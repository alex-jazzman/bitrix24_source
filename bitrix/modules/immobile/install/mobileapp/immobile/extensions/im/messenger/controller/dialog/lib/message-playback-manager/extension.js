/**
 * @module im/messenger/controller/dialog/lib/message-playback-manager
 */
jn.define('im/messenger/controller/dialog/lib/message-playback-manager', (require, exports, module) => {
	const { getLogger } = require('im/messenger/lib/logger');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const logger = getLogger('dialog--message-playback-manager');

	/**
	 * @class MessagePlaybackManager
	 */
	class MessagePlaybackManager
	{
		/**
		 * @param {DialogLocator} dialogLocator
		 * @param {DialogId} dialogId
		 */
		constructor({ dialogLocator, dialogId })
		{
			this.dialogLocator = dialogLocator;
			this.dialogId = dialogId;

			this.store = serviceLocator.get('core').getStore();
			this.storeManager = serviceLocator.get('core').getStoreManager();

			this.messageRenderer = this.dialogLocator.get('message-renderer');
		}

		subscribeStoreEvents()
		{
			this.storeManager
				.on('messagesModel/playbackModel/add', this.messagePlaybackUpdateHandler)
				.on('messagesModel/playbackModel/update', this.messagePlaybackUpdateHandler)
				.on('messagesModel/playbackModel/delete', this.messagePlaybackUpdateHandler)
			;
		}

		unsubscribeStoreEvents()
		{
			this.storeManager
				.off('messagesModel/playbackModel/add', this.messagePlaybackUpdateHandler)
				.off('messagesModel/playbackModel/update', this.messagePlaybackUpdateHandler)
				.off('messagesModel/playbackModel/delete', this.messagePlaybackUpdateHandler)
			;
		}

		/**
		 * @param {MutationPayload<
		 * PlaybackAddData | PlaybackUpdateData | PlaybackDeleteData,
		 * PlaybackAddActions | PlaybackUpdateActions | PlaybackDeleteActions
		 * >} payload
		 */
		messagePlaybackUpdateHandler = ({ payload }) => {
			const { messageId, dialogId } = payload.data;

			if (dialogId !== this.dialogId)
			{
				return;
			}

			logger.log(`${this.constructor.name}.messagePlaybackUpdateHandler ${this.dialogId}`, payload);

			const playbackState = this.store.getters['messagesModel/playbackModel/getPlayback'](this.dialogId, messageId);
			const message = this.store.getters['messagesModel/getById'](messageId);

			const messageToUpdate = { ...message, ...playbackState };
			void this.messageRenderer.render([messageToUpdate]);
		};
	}

	module.exports = { MessagePlaybackManager };
});
