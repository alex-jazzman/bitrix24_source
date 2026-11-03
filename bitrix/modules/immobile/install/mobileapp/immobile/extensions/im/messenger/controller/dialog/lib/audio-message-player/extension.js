/**
 * @module im/messenger/controller/dialog/lib/audio-player
 */
jn.define('im/messenger/controller/dialog/lib/audio-player', (require, exports, module) => {
	const { MessageHelper } = require('im/messenger/lib/helper');
	const { Logger } = require('im/messenger/lib/logger');
	const {
		getAudioRate,
		getNextAudioRate,
	} = require('im/messenger/controller/dialog/lib/audio-panel/audio-helper');

	/**
	 * @class AudioMessagePlayer
	 */
	class AudioMessagePlayer
	{
		/**
		 * @param {MessengerCoreStore} store
		 * @param {DialogLocator} [dialogLocator]
		 */
		constructor(store, dialogLocator = null)
		{
			this.store = store;
			this.dialogLocator = dialogLocator;
			this.player = null;
			this.playingMessageId = null;
		}

		play({ messageId, fileId = null, playingTime = 0 })
		{
			Logger.log('AudioMessagePlayer.play: messageId: ', messageId, ' playingTime:', playingTime);
			if (this.playingMessageId)
			{
				this.pause();
			}

			this.playingMessageId = messageId;
			const playingMessage = this.store.getters['messagesModel/getById'](this.playingMessageId);
			if (!playingMessage || !this.resolveAudioFile(playingMessage, fileId))
			{
				return;
			}

			this.setMessageIsPlaying(true, playingTime);
		}

		/**
		 * @private
		 * @param {MessagesModelState} message
		 * @param {number|string|null} [preferredFileId]
		 * @return {FilesModelState|null}
		 */
		resolveAudioFile(message, preferredFileId = null)
		{
			return MessageHelper.resolveAudioFile(this.store, message, preferredFileId);
		}

		/**
		 * @return {Promise}
		 */
		changeRate()
		{
			return this.setApplicationAudioRate(getNextAudioRate(getAudioRate(this.store)));
		}

		/**
		 * Counterpart of AudioPanel.applyRate for the build without the audio panel. This player
		 * holds no native player of its own - the rate reaches the native audio cell with the
		 * message data - so the value is applied by redrawing the cell of the voice message that
		 * is playing.
		 *
		 * Takes no rate: unlike AudioPanel.applyRate, which hands the value to its native player,
		 * this one gets it from the saved setting, the source the shared message options are built
		 * from. Hence the precondition of the contract - the caller saves the setting first, or the
		 * redraw carries the previous value.
		 *
		 * @return {Promise}
		 */
		applyRate()
		{
			Logger.log('AudioMessagePlayer.applyRate');

			return this.renderPlayingMessage();
		}

		/**
		 * Only the playing voice message is redrawn: a silent one takes the new rate with its next
		 * ordinary render. The playback survives the redraw - the renderer reads the live position
		 * of a playing audio cell from the view instead of the model.
		 *
		 * @return {Promise}
		 * @private
		 */
		renderPlayingMessage()
		{
			const renderer = this.dialogLocator?.get('message-renderer');
			// An id unknown to the renderer goes to the branch that adds a new cell to the feed.
			if (!this.playingMessageId || !renderer?.isMessageRendered(this.playingMessageId))
			{
				return Promise.resolve();
			}

			const message = this.store.getters['messagesModel/getById'](this.playingMessageId);
			if (!message)
			{
				return Promise.resolve();
			}

			// The store keeps a reply without the quote block, so a raw model would redraw the
			// voice message without an already shown quote.
			return renderer.render([renderer.prepareStoreMessageForRender(message)]);
		}

		playNext()
		{
			const previousMessageId = this.playingMessageId;

			this.pause();

			const nextMessageToPlay = this.getNextMessageToPlay(previousMessageId);
			if (!nextMessageToPlay)
			{
				return;
			}

			this.store.dispatch('messagesModel/setPlayAudio', {
				id: nextMessageToPlay.id,
				audioPlaying: true,
			});

			this.play({ messageId: nextMessageToPlay.id });
		}

		pause(playingTime = 0)
		{
			if (!this.playingMessageId)
			{
				return;
			}

			this.setMessageIsPlaying(false, playingTime);
			this.playingMessageId = null;
		}

		closeDialog()
		{
			this.stopPlayingMessage();
		}

		/**
		 * The dialog calls the same lifecycle methods on whichever player the feature gate
		 * produced, and it guards only the player itself, not the method. This player has no
		 * floating panel, so there is nothing to do here - but the methods must exist.
		 */
		showDialog()
		{}

		hiddenDialog()
		{}

		stopPlayingMessage()
		{
			this.pause();
		}

		/**
		 * Stops current audio playback: mutes the sound and resets the store playing state.
		 * Does not send pause analytics. Idempotent: safe when nothing is playing.
		 */
		stopPlayback()
		{
			this.pause();
		}

		/**
		 * @private
		 */
		setMessageIsPlaying(isPlaying, playingTime)
		{
			const message = this.store.getters['messagesModel/getById'](this.playingMessageId);
			if (!message)
			{
				return;
			}

			this.store.dispatch('messagesModel/setPlayingState', {
				id: this.playingMessageId,
				isPlaying: isPlaying,
				playingTime,
			});
		}

		/**
		 * @param {AudioRate} rate
		 * @return {Promise}
		 * @private
		 */
		setApplicationAudioRate(rate)
		{
			return this.store.dispatch('applicationModel/setAudioRateSetting', rate)
				.catch((error) => Logger.error(
					'setApplicationAudioRate.applicationModel/setAudioRateSetting.catch:',
					error,
				));
		}

		/**
		 * @private
		 */
		getNextMessageToPlay(previousMessageId)
		{
			const previousMessage = this.store.getters['messagesModel/getById'](previousMessageId);
			if (!previousMessage)
			{
				return null;
			}

			const chatMessageList = this.store.getters['messagesModel/getByChatId'](previousMessage.chatId);

			return chatMessageList.find((message) => {
				if (message.id <= previousMessage.id)
				{
					return false;
				}

				return Boolean(this.resolveAudioFile(message));
			});
		}
	}

	module.exports = {
		AudioMessagePlayer,
	};
});
