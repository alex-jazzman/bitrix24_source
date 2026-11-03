/**
 * @module im/messenger/controller/dialog/lib/video-note-message-manager
 */
jn.define('im/messenger/controller/dialog/lib/video-note-message-manager', (require, exports, module) => {
	const { Type } = require('type');
	const { media } = require('native/media');

	const {
		EventType,
	} = require('im/messenger/const');
	const { Feature } = require('im/messenger/lib/feature');
	const {
		getAudioRate,
		getNextAudioRate,
	} = require('im/messenger/controller/dialog/lib/audio-panel/audio-helper');
	const { MessagePlayer } = require('im/messenger/controller/dialog/lib/message-player');
	const { AfterScrollMessagePosition } = require('im/messenger/view/dialog');
	const { AnalyticsService } = require('im/messenger/provider/services/analytics');
	const { MessageHelper } = require('im/messenger/lib/helper');

	const { getLogger } = require('im/messenger/lib/logger');
	const logger = getLogger('dialog--video-note-manager');

	/**
	 * The playing position comes from the view and reaches the model, which checks the type of the
	 * value only. The file model of a video note carries no duration, so the upper bound is unknown
	 * here and just the lower one is kept. A payload that carries no position gives null: a zero
	 * written instead would rewind the playing video note to its start.
	 *
	 * @param {number} playingTime
	 * @return {?number}
	 */
	function getPlayingPosition(playingTime)
	{
		return Type.isNumber(playingTime) ? Math.max(playingTime, 0) : null;
	}

	/**
	 * @class VideoNoteMessageManager
	 */
	class VideoNoteMessageManager
	{
		/**
		 * @type {MessagePlayer}
		 */
		#videoNoteMessagePlayer = null;

		/**
		 *
		 * @param {DialogId} dialogId
		 * @param {number} chatId
		 * @param {DialogLocator} dialogLocator
		 * @param {SendingService} sendingService
		 */
		constructor({ dialogLocator, dialogId, chatId, sendingService })
		{
			this.dialogLocator = dialogLocator;
			this.dialogId = dialogId;
			this.chatId = chatId;
			this.sendingService = sendingService;

			this.store = this.dialogLocator.get('store');
			this.view = this.dialogLocator.get('view');
			this.chatService = this.dialogLocator.get('chat-service');

			this.#videoNoteMessagePlayer = new MessagePlayer(this.store, dialogId);
		}

		get player()
		{
			return this.#videoNoteMessagePlayer;
		}

		/**
		 * @return {InputActionManager}
		 */
		get inputActionManager()
		{
			return this.dialogLocator.get('input-action-manager');
		}

		/**
		 * @return {AudioPanel | AudioMessagePlayer | undefined}
		 */
		get audioPlayer()
		{
			return this.dialogLocator.get('audio-player');
		}

		subscribeViewEvents()
		{
			this.view.on(EventType.dialog.videoNoteTap, this.tapHandler);
			this.view.on(EventType.dialog.videoNoteSubmit, this.submitHandler);
			this.view.on(EventType.dialog.videoNoteRecordingStart, this.recordStartHandler);
			this.view.on(EventType.dialog.videoNoteRecordingFinish, this.recordFinishHandler);
			this.view.on(EventType.dialog.videoNotePlaybackCompleted, this.playbackCompletedHandler);
			this.view.on(EventType.dialog.videoNoteWasHide, this.wasHideHandler);
			this.view.on(EventType.dialog.videoNoteRateTap, this.rateTapHandler);
		}

		unsubscribeEvents()
		{
			this.view.off(EventType.dialog.videoNoteTap, this.tapHandler);
			this.view.off(EventType.dialog.videoNoteSubmit, this.submitHandler);
			this.view.off(EventType.dialog.videoNoteRecordingStart, this.recordStartHandler);
			this.view.off(EventType.dialog.videoNoteRecordingFinish, this.recordFinishHandler);
			this.view.off(EventType.dialog.videoNotePlaybackCompleted, this.playbackCompletedHandler);
			this.view.off(EventType.dialog.videoNoteWasHide, this.wasHideHandler);
			this.view.off(EventType.dialog.videoNoteRateTap, this.rateTapHandler);
		}

		/**
		 * @private
		 */
		recordStartHandler = () => {
			this.#videoNoteMessagePlayer?.stop();
			this.audioPlayer?.stopPlayback();
			this.inputActionManager.startRecordVideoNote();
		};

		/**
		 * @private
		 */
		recordFinishHandler = () => {
			this.inputActionManager.cancelInputActionRequest();
		};

		/**
		 * @private
		 */
		submitHandler = (videoNote) => {
			const { duration, needConvert = false } = videoNote;
			const file = {
				...videoNote,
				isVideoNote: true,
				isTranscribable: true,
			};

			const params = {};
			if (needConvert)
			{
				params.prepareFile = async (file) => {
					return {
						...file,
						url: await media.converter.convertRoundVideo(file.url),
					};
				};
			}

			if (Feature.isAiTaskCreationEnabled && Feature.isAiTaskCreationUISupported)
			{
				this.store.dispatch('messagesModel/interruptTaskAnimationMessages', { chatId: this.chatId });
			}

			// Preserve the reply link for the video note, like text/sticker (the link is never gated).
			// Capture the replyId synchronously, before resetting the reply state, so the plaque leaves
			// and the next message is not sent as a reply.
			const replyManager = this.dialogLocator.get('reply-manager');
			if (replyManager && (replyManager.isQuoteInProcess || replyManager.isQuoteInBackground))
			{
				const replyId = Number(replyManager.getQuoteMessage()?.id);
				if (Number.isInteger(replyId) && replyId > 0)
				{
					params.replyId = replyId;
					if (replyManager.isQuoteInProcess)
					{
						replyManager.finishQuotingMessage();
					}
				}
			}

			AnalyticsService.getInstance().sendRecordVideoNote(this.dialogId, duration);
			this.sendingService.sendFiles(this.dialogId, [file], '', params)
				.catch((error) => logger.error(`${this.constructor.name}.submitHandler.sendFiles`, error))
			;
		};

		/**
		 * @param {number} messageId
		 * @param {number} playingTime
		 */
		play(messageId, playingTime = 0)
		{
			if (!this.#isPlayingMessage(messageId))
			{
				this.#videoNoteMessagePlayer?.stop();
			}

			this.audioPlayer?.stopPlayback();

			AnalyticsService.getInstance().sendTapToPlayVideoNote(this.dialogId);
			this.#videoNoteMessagePlayer?.play(messageId, playingTime);
		}

		/**
		 *
		 * @param {number} messageId
		 * @param {boolean} isPlaying
		 * @param {number} playingTime
		 * @private
		 */
		tapHandler = (messageId, isPlaying, playingTime) => {
			logger.log(`${this.constructor.name}.tapHandler`, messageId, isPlaying, playingTime);

			const messageModel = this.store.getters['messagesModel/getById'](messageId);
			const fileModel = this.store.getters['filesModel/getById'](messageModel?.files?.[0]);
			if (!fileModel?.isVideoNote)
			{
				return;
			}

			const position = getPlayingPosition(playingTime) ?? 0;
			if (isPlaying)
			{
				this.#videoNoteMessagePlayer?.pause(position);
				AnalyticsService.getInstance().sendTapToPauseVideoNote(this.dialogId);
			}
			else
			{
				this.play(messageId, position);
			}
		};

		/**
		 * The rate control of the video note shares a single setting with the voice messages: the
		 * tap switches that setting, and the native side applies the new value once it arrives with
		 * the message data. The video note id comes with the payload of the native event, but the
		 * shared setting needs no lookup by it: the message alone tells whether the tap is ours.
		 *
		 * @param {string} videoNoteId
		 * @param {string} messageId
		 * @param {number} playingTime
		 * @private
		 */
		rateTapHandler = async (videoNoteId, messageId, playingTime) => {
			logger.log(`${this.constructor.name}.rateTapHandler`, videoNoteId, messageId, playingTime);

			if (!Feature.isVideoNotePlaybackRateAvailable)
			{
				return;
			}

			const messageModel = this.store.getters['messagesModel/getById'](messageId);
			const fileModel = this.store.getters['filesModel/getById'](messageModel?.files?.[0]);
			if (!fileModel?.isVideoNote || !this.#isMessageOfDialog(messageModel))
			{
				return;
			}

			const newRate = getNextAudioRate(getAudioRate(this.store));
			const position = getPlayingPosition(playingTime);

			try
			{
				await this.store.dispatch('applicationModel/setAudioRateSetting', newRate);
				if (position !== null)
				{
					await this.#keepPlaybackPosition(messageModel.id, position);
				}

				// The played video note is the only one with a playback record, so a position update
				// reaches the model and the playback manager redraws that cell on its own.
				const isRedrawnByPlaybackManager = position !== null && this.#isPlayingMessage(messageId);
				if (!isRedrawnByPlaybackManager)
				{
					await this.#renderStoreMessage(messageModel);
				}

				// Last, and only after the setting is saved: whichever of the two players is built, it
				// needs the stored value - the panel hands it to its native player, the panelless one
				// redraws the playing voice message from the shared options. Being last, a failure here
				// cannot take the redraw of the video note down with it: it only reaches the log below.
				await this.audioPlayer?.applyRate?.(newRate);
			}
			catch (error)
			{
				logger.error(`${this.constructor.name}.rateTapHandler.catch:`, error);
			}
		};

		/**
		 * The chat is taken from the dialog model, the source the message list itself is drawn from:
		 * the manager is built before the chat is loaded and may hold no chat id yet. The feed of a
		 * comment chat opens with the parent message, and that one belongs to the channel chat - the
		 * same exception the transcript manager makes.
		 *
		 * @param {MessagesModelState} messageModel
		 * @return {boolean}
		 * @private
		 */
		#isMessageOfDialog(messageModel)
		{
			const dialog = this.store.getters['dialoguesModel/getById'](this.dialogId);
			if (!dialog)
			{
				return false;
			}

			return messageModel.chatId === dialog.chatId || messageModel.id === dialog.parentMessageId;
		}

		/**
		 * The player keeps the id it was started with: a tap payload of the view carries a string,
		 * while the automatic switch to the next video note takes the id from the message model, a
		 * number. So the comparison of the manager brings both sides to one type.
		 *
		 * @param {number|string} messageId
		 * @return {boolean}
		 * @private
		 */
		#isPlayingMessage(messageId)
		{
			const playingMessageId = this.#videoNoteMessagePlayer?.playingMessageId;
			if (Type.isNil(playingMessageId) || Type.isNil(messageId))
			{
				return false;
			}

			return String(playingMessageId) === String(messageId);
		}

		/**
		 * @param {MessagesModelState} messageModel
		 * @return {Promise}
		 * @private
		 */
		#renderStoreMessage(messageModel)
		{
			const renderer = this.dialogLocator.get('message-renderer');
			// An id unknown to the renderer goes to the branch that adds a new cell to the feed.
			if (!renderer?.isMessageRendered(messageModel.id))
			{
				return Promise.resolve();
			}

			// The store keeps a reply without the quote block, so a raw model would redraw the
			// video note without an already shown quote.
			return renderer.render([renderer.prepareStoreMessageForRender(messageModel)]);
		}

		/**
		 * The re-rendered cell restores its playback position from the model, so the position the
		 * tap came with has to reach the model first - otherwise the video note jumps back to where
		 * playback started. The action touches an existing record only: a video note that is not
		 * playing has none and must not get one.
		 *
		 * @param {number} messageId
		 * @param {number} playingTime
		 * @return {Promise}
		 * @private
		 */
		#keepPlaybackPosition(messageId, playingTime)
		{
			return this.store.dispatch('messagesModel/playbackModel/update', {
				dialogId: this.dialogId,
				messageId,
				playingTime,
			});
		}

		/**
		 * @private
		 */
		playbackCompletedHandler = async () => {
			const previousMessageId = this.#videoNoteMessagePlayer?.playingMessageId;
			const nextMessageToPlay = await this.getNextMessageToPlay(previousMessageId);

			if (!nextMessageToPlay)
			{
				this.#videoNoteMessagePlayer?.stop();

				return;
			}

			this.view.scrollToMessageById(
				nextMessageToPlay.id,
				true,
				() => {
					this.audioPlayer?.stopPlayback();
					this.#videoNoteMessagePlayer?.playNext(nextMessageToPlay);
				},
				AfterScrollMessagePosition.center,
			);
		};

		/**
		 * @param {number|string} previousMessageId
		 * @return {MessagesModelState}
		 * @private
		 */
		async getNextMessageToPlay(previousMessageId)
		{
			const { messageList } = await this.view.getViewableMessages();

			const messageIds = messageList
				.map((message) => message.id)
				.filter((id) => {
					const isValidTypes = Type.isNumber(Number(id)) && Type.isNumber(Number(previousMessageId));
					const isNextMessage = Number(id) > Number(previousMessageId);

					return isValidTypes && isNextMessage;
				})
			;

			const nextMessageList = this.store.getters['messagesModel/getListByIds'](messageIds);

			return nextMessageList.find((message) => {
				if (!message.files[0])
				{
					return false;
				}

				const file = this.store.getters['filesModel/getById'](message.files[0]);
				const messageHelper = MessageHelper.createById(message.id);

				return file.isVideoNote && !messageHelper.isVideoNoteText;
			});
		}

		/**
		 *
		 * @param {string} messageId
		 * @private
		 */
		wasHideHandler = (messageId) => {
			if (this.#isPlayingMessage(messageId))
			{
				this.#videoNoteMessagePlayer?.stop();
			}
		};
	}

	module.exports = { VideoNoteMessageManager };
});
