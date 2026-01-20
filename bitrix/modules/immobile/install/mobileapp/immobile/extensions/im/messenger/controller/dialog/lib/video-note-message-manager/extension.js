/**
 * @module im/messenger/controller/dialog/lib/video-note-message-manager
 */
jn.define('im/messenger/controller/dialog/lib/video-note-message-manager', (require, exports, module) => {
	const { Type } = require('type');
	const { media } = require('native/media');

	const {
		EventType,
	} = require('im/messenger/const');
	const { MessagePlayer } = require('im/messenger/controller/dialog/lib/message-player');
	const { AfterScrollMessagePosition } = require('im/messenger/view/dialog');
	const { AnalyticsService } = require('im/messenger/provider/services/analytics');
	const { MessageHelper } = require('im/messenger/lib/helper');

	const { getLogger } = require('im/messenger/lib/logger');
	const logger = getLogger('dialog--video-note-manager');

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
		 * @param {chatId} number
		 * @param {DialogLocator} dialogLocator
		 * @param {SendingService} sendingService
		 */
		constructor({ dialogLocator, dialogId, sendingService })
		{
			this.dialogLocator = dialogLocator;
			this.dialogId = dialogId;
			this.sendingService = sendingService;

			this.store = this.dialogLocator.get('store');
			this.view = this.dialogLocator.get('view');
			this.chatService = this.dialogLocator.get('chat-service');

			this.#videoNoteMessagePlayer = new MessagePlayer(this.store);
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

		subscribeViewEvents()
		{
			this.view.on(EventType.dialog.videoNoteTap, this.tapHandler);
			this.view.on(EventType.dialog.videoNoteSubmit, this.submitHandler);
			this.view.on(EventType.dialog.videoNoteRecordingStart, this.recordStartHandler);
			this.view.on(EventType.dialog.videoNoteRecordingFinish, this.recordFinishHandler);
			this.view.on(EventType.dialog.videoNotePlaybackCompleted, this.playbackCompletedHandler);
			this.view.on(EventType.dialog.videoNoteWasHide, this.wasHideHandler);
		}

		unsubscribeEvents()
		{
			this.view.off(EventType.dialog.videoNoteTap, this.tapHandler);
			this.view.off(EventType.dialog.videoNoteSubmit, this.submitHandler);
			this.view.off(EventType.dialog.videoNoteRecordingStart, this.recordStartHandler);
			this.view.off(EventType.dialog.videoNoteRecordingFinish, this.recordFinishHandler);
			this.view.off(EventType.dialog.videoNotePlaybackCompleted, this.playbackCompletedHandler);
			this.view.off(EventType.dialog.videoNoteWasHide, this.wasHideHandler);
		}

		/**
		 * @private
		 */
		recordStartHandler = () => {
			this.#videoNoteMessagePlayer?.stop();
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
			const { needConvert = false } = videoNote;
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

			AnalyticsService.getInstance().sendRecordVideoNote(this.dialogId, videoNote.duration);
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
			if (this.#videoNoteMessagePlayer?.playingMessageId !== messageId)
			{
				this.#videoNoteMessagePlayer?.stop();
			}

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

			if (isPlaying)
			{
				this.#videoNoteMessagePlayer?.pause(playingTime);
				AnalyticsService.getInstance().sendTapToPauseVideoNote(this.dialogId);
			}
			else
			{
				this.play(messageId, playingTime);
			}
		};

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
				() => this.#videoNoteMessagePlayer?.playNext(nextMessageToPlay),
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
			const isPlaying = this.#videoNoteMessagePlayer?.playingMessageId === messageId;
			if (isPlaying)
			{
				this.#videoNoteMessagePlayer?.stop();
			}
		};
	}

	module.exports = { VideoNoteMessageManager };
});
