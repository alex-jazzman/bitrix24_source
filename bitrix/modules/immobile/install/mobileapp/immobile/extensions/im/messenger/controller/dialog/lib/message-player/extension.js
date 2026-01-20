/**
 * @module im/messenger/controller/dialog/lib/message-player
 */
jn.define('im/messenger/controller/dialog/lib/message-player', (require, exports, module) => {
	const { Logger } = require('im/messenger/lib/logger');

	/**
	 * @class MessagePlayer
	 */
	class MessagePlayer
	{
		constructor(store)
		{
			/**
			 * @type {MessengerCoreStore}
			 */
			this.store = store;
			/**
			 * @type {number|null}
			 */
			this.playingMessageId = null;
		}

		/**
		 * @param {number|string} messageId
		 * @param {?number} playingTime
		 */
		play(messageId, playingTime = 0)
		{
			Logger.log(`${this.constructor.name}MessagePlayer.play: messageId: ${messageId}, playingTime: ${playingTime}`);

			const playingMessage = this.store.getters['messagesModel/getById'](messageId);
			if (!playingMessage || !playingMessage.files[0])
			{
				return;
			}

			const file = this.store.getters['filesModel/getById'](playingMessage.files[0]);
			if (!file)
			{
				return;
			}

			this.playingMessageId = messageId;
			this.#setMessageIsPlaying(true, playingTime);
		}

		/**
		 * @param {?MessagesModelState} nextMessageToPlay
		 */
		playNext(nextMessageToPlay)
		{
			this.stop();

			if (!nextMessageToPlay)
			{
				return;
			}

			this.play(nextMessageToPlay.id);
		}

		/**
		 * @param {?number} playingTime
		 */
		stop(playingTime = 0)
		{
			if (!this.playingMessageId)
			{
				return;
			}

			this.#setMessageIsPlaying(false, playingTime);
			this.playingMessageId = null;
		}

		/**
		 * @param {?number} playingTime
		 */
		pause(playingTime = 0)
		{
			if (!this.playingMessageId)
			{
				return;
			}

			this.#setMessageIsPlaying(false, playingTime);
		}

		/**
		 * @param {boolean} isPlaying
		 * @param {number} playingTime
		 */
		#setMessageIsPlaying(isPlaying, playingTime)
		{
			const message = this.store.getters['messagesModel/getById'](this.playingMessageId);
			if (!message)
			{
				return;
			}

			this.store.dispatch('messagesModel/setPlayingState', {
				id: this.playingMessageId,
				isPlaying,
				playingTime,
			});
		}
	}

	module.exports = {
		MessagePlayer,
	};
});
