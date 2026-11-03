/**
 * @module im/messenger/controller/dialog/lib/audio-panel/audio-player
 */
jn.define('im/messenger/controller/dialog/lib/audio-panel/audio-player', (require, exports, module) => {
	const {
		FileType,
	} = require('im/messenger/const');
	const { Type } = require('type');
	const { isEmpty } = require('utils/object');
	const { throttle } = require('utils/function');
	const { AudioPlayer } = require('native/media');
	const { PerfPoint } = require('debug/prism');
	const { AsyncQueue } = require('im/messenger/lib/utils');
	const { DialogHelper, MessageHelper } = require('im/messenger/lib/helper');
	const { Logger } = require('im/messenger/lib/logger');
	const { AudioEvents, AudioPlayingState } = require('im/messenger/const');
	const { AnalyticsService } = require('im/messenger/provider/services/analytics');
	const {
		prepareAudioName,
		extractSpeed,
		roundAudioSpeed,
		getAudioRate,
		getNextAudioRate,
		createChatReturnData,
		mergeDefinedFields,
		createAudioPlayerId,
	} = require('im/messenger/controller/dialog/lib/audio-panel/audio-helper');
	const {
		panelVisibilityArbiter,
	} = require('im/messenger/controller/dialog/lib/audio-panel/panel-visibility');

	const IS_ANDROID = Application.getPlatform() === 'android';

	class AudioPanel
	{
		#props;
		#player;
		#playerId;
		#asyncQueue;
		#dialogIsShown = false;
		/**
		 * Measures the whole play path: the tap, the playlist built from the store and the
		 * wait for the native player to report the first playing state. Kept in a field
		 * because the span ends in the native event handler, not in play().
		 *
		 * @type {PerfPoint|null}
		 */
		#playPerfPoint = null;
		/** @type {AnalyticsService} */
		#analyticsService;
		#playingState = {
			playingTime: 0,
			messageId: 0,
		};

		/**
		 * @param {AudioPanelProps} props
		 */
		constructor(props)
		{
			this.#props = props;
			this.#player = this.#createPlayer();
			this.#asyncQueue = new AsyncQueue();
			this.#analyticsService = AnalyticsService.getInstance();

			this.setPlayingTime = throttle(this.setPlayingTime, 200, this);
			this.#subscribePlayerEvents();
		}

		/**
		 * @public
		 */
		initialPlayerState()
		{
			const { currentAudio, playingState, playingTime } = this.#getCurrentMediaState();
			if (!currentAudio)
			{
				return;
			}

			const messageId = currentAudio?.associatedId;
			const message = this.#getMessageById(messageId);
			if (!message)
			{
				return;
			}

			// The dispatch is skipped for an unchanged value: this runs on every return
			// of the dialog to the screen, not only on a real speed change.
			const audioSpeed = this.#getSpeed();
			if (audioSpeed > 0 && roundAudioSpeed(audioSpeed) !== getAudioRate(this.store))
			{
				void this.#updateAudioMessageSpeed(audioSpeed);
			}

			const options = {
				messageId,
				playingTime,
				isPlaying: this.#isPlayingState(playingState),
			};

			void this.#updateMessagePlaying(options);
		}

		#subscribePlayerEvents()
		{
			this.#player.on(AudioEvents.playingMediaChanged, this.#playingMediaChanged);
			this.#player.on(AudioEvents.speedChanged, this.#playingSpeedChanged);
			this.#player.on(AudioEvents.timeUpdate, this.setPlayingTime);
		}

		#unsubscribePlayerEvents()
		{
			this.#player.off(AudioEvents.playingMediaChanged, this.#playingMediaChanged);
			this.#player.off(AudioEvents.speedChanged, this.#playingSpeedChanged);
			this.#player.off(AudioEvents.timeUpdate, this.setPlayingTime);
		}

		/**
		 * @param {AudioState} audioState
		 */
		#playingMediaChanged = (audioState) => {
			// The first state from the native player closes the play span: whatever the
			// state is, the sound path has answered.
			this.#endPlayPerfPoint();

			const {
				playingState,
				playingTime,
				currentAudio,
			} = audioState;
			const playingMessageId = currentAudio?.associatedId;

			if (AudioPlayingState.final === playingState)
			{
				this.#finalPlaying();
			}
			else
			{
				this.#muteConcurrentMediaOnStart(playingState);
				this.#stopPreviousMessage(playingMessageId);
				this.#setPlayingState({ messageId: playingMessageId, playingTime });
				void this.#updateMessagePlaying({
					playingTime,
					messageId: playingMessageId,
					isPlaying: this.#isPlayingState(playingState),
				});
			}
		};

		/**
		 * The play button of the native panel resumes the sound without passing through the
		 * dialog, so the mutual exclusion with video notes - which the dialog applies to its
		 * own taps - has to be applied here as well, on every reported playback.
		 *
		 * @param {AudioPlayingStateType} playingState
		 */
		#muteConcurrentMediaOnStart(playingState)
		{
			if (!this.#isPlayingState(playingState))
			{
				return;
			}

			// Asked of the player instead of remembered from the previous event. Our own
			// pause() and stopPlayback() change the playback without producing one, so a
			// remembered flag goes stale in both directions: it either blocks the muting
			// for good, or mutes the video note the listener has just started with a state
			// delivered after that pause. Muting again for a state already handled is
			// harmless - stopping the video note player is idempotent.
			const { playingState: currentState } = this.#getCurrentMediaState();
			if (currentState !== undefined && !this.#isPlayingState(currentState))
			{
				return;
			}

			const { stopConcurrentMedia } = this.#props;
			stopConcurrentMedia?.();
		}

		/**
		 * The native player reports only the track it switched to, so the row of the
		 * previous message would keep its playing indicator: after a playlist advance or
		 * a start from another message two rows would look active at once.
		 *
		 * @param {MessageId} [nextMessageId]
		 */
		#stopPreviousMessage(nextMessageId)
		{
			const previousMessageId = this.#getPlayingMessageId();
			// Ids mix numbers, strings and UUIDs of own unsent messages, so they are only
			// comparable as strings.
			if (!previousMessageId || String(previousMessageId) === String(nextMessageId))
			{
				return;
			}

			void this.#updateMessagePlaying({
				messageId: previousMessageId,
				isPlaying: false,
				playingTime: 0,
			});
		}

		/**
		 * @param {AudioPlayingStateType} playingState
		 * @returns {boolean}
		 */
		#isPlayingState(playingState)
		{
			return AudioPlayingState.playing === playingState;
		}

		/**
		 * @param {SpeedChangedState|number} payload
		 */
		#playingSpeedChanged = (payload) => {
			const speed = extractSpeed(payload);
			if (speed === null)
			{
				return;
			}

			this.#asyncQueue.enqueue(async () => {
				const audioRate = roundAudioSpeed(speed);
				if (audioRate !== getAudioRate(this.store))
				{
					await this.#updateAudioMessageSpeed(audioRate);
					await this.#updateMessagePlaying({ messageId: this.#getPlayingMessageId() });
				}
			});
		};

		#createPlayer()
		{
			const dialog = this.#getDialog();
			this.#playerId = createAudioPlayerId({
				chatId: this.chatId,
				isComment: this.#isComment(dialog),
				parentChatId: dialog?.parentChatId,
			});

			return this.createNativePlayer({
				id: this.#playerId,
				keepPlaying: true,
			});
		}

		/**
		 * The only line that needs the native module: everything around it is plain
		 * logic that tests can drive through a stub player.
		 *
		 * @param {NativeAudioPlayerParams} params
		 * @returns {AudioPlayer}
		 */
		createNativePlayer(params)
		{
			return new AudioPlayer(params);
		}

		/**
		 * @param {MessageId} messageId
		 * @param {number|string|null} [preferredFileId] file of the tapped audio, when the message holds several
		 * @returns {Array<NativeAudioItem>}
		 */
		createPlayList(messageId, preferredFileId = null)
		{
			const files = this.#getAudioFiles(messageId, preferredFileId);

			if (isEmpty(files))
			{
				return [];
			}

			const { dialogId } = this.#props;

			return files.map((file) => ({
				uri: file.localUrl || file.urlDownload,
				title: prepareAudioName({
					fileName: file.name,
					messageId,
					store: this.store,
				}),
				associatedId: String(file.messageId),
				returnData: createChatReturnData({
					dialogId,
					fileId: file.id,
					messageId: file.messageId,
				}),
			}));
		}

		/**
		 * @param {AudioPlayActionParams} options
		 */
		play(options)
		{
			const { messageId, fileId = null, playingTime } = options;
			// The resume position must be resolved BEFORE the state is updated: after
			// the new messageId is stored, #getPlayingTime can no longer tell whether
			// the kept progress belongs to this message or to the previous one.
			const resumeTime = (Type.isNumber(playingTime) && playingTime > 0)
				? playingTime
				: this.#getPlayingTime(messageId);

			Logger.log('AudioPanel.play: messageId: ', messageId, ' playingTime:', resumeTime);
			this.#startPlayPerfPoint(messageId);
			this.#setPlayingState({ messageId, playingTime: resumeTime });
			this.#playListByMessageId(messageId, resumeTime, fileId);
		}

		/**
		 * @param {AudioPlayActionParams} options
		 */
		pause(options)
		{
			const { messageId, playingTime = 0 } = options;
			Logger.log('AudioPanel.pause: messageId: ', messageId, ' playingTime:', playingTime);
			this.#analyticsService.sendClickToPauseAudioInChat({ dialogId: this.dialogId });
			this.#setPlayingState(options);
			this.#player.pause();
		}

		/**
		 * @return {Promise}
		 */
		changeRate()
		{
			const audioSpeed = getNextAudioRate(getAudioRate(this.store));
			this.#changePlayerSpeed(audioSpeed);
			this.#analyticsService.sendClickToChangeAudioSpeedInChat({
				dialogId: this.dialogId,
				speed: audioSpeed,
			});

			return this.#updateAudioMessageSpeed(audioSpeed);
		}

		/**
		 * Applies a rate already chosen and stored elsewhere - a tap on the video note speed
		 * control - and does nothing else: the setting is saved by the caller, and sending the
		 * voice message analytics from here would report a video note action as a change of the
		 * voice message speed. Without this the native player keeps the previous speed and
		 * overwrites the setting with it on the next initialPlayerState().
		 *
		 * @param {AudioRate} rate
		 */
		applyRate(rate)
		{
			this.#changePlayerSpeed(rate);
		}

		/**
		 * @param {AudioRate} speed
		 */
		#changePlayerSpeed(speed)
		{
			this.#player.setSpeed(roundAudioSpeed(speed));
		}

		/**
		 * Mutes the sound when another chat media takes over, keeping the progress
		 * so the listener can resume from the same position. Does not send pause
		 * analytics: the pause is not a user action. Idempotent.
		 */
		stopPlayback()
		{
			const messageId = this.#getPlayingMessageId();
			if (!messageId)
			{
				return;
			}

			const { playingTime } = this.#playingState;

			this.#player.pause();
			void this.#updateMessagePlaying({
				messageId,
				playingTime,
				isPlaying: false,
			});
		}

		readMessageList(messageList)
		{
			this.#togglePanelVisibility(messageList);
		}

		async #updatePanelVisibility()
		{
			if (!this.#dialogIsShown || !this.#getPlayingMessageId())
			{
				return;
			}

			const viewableMessages = await this.#getViewableMessages().catch((error) => {
				Logger.error('AudioPanel.updatePanelVisibility: getViewableMessages', error);

				return null;
			});

			if (!viewableMessages)
			{
				return;
			}

			this.#togglePanelVisibility(viewableMessages.messageList);
		}

		#togglePanelVisibility(messageList)
		{
			if (!Type.isArray(messageList))
			{
				return;
			}

			// No audio held by the player - nothing to toggle. Without this the scroll
			// handler would reach the native panel on every viewability batch while idle.
			const playingMessageId = this.#getPlayingMessageId();
			if (!playingMessageId)
			{
				return;
			}

			// The view reports its rows with string ids while the model keeps them as numbers,
			// so the two are only comparable as strings. Numbers would not do: an own message
			// carries a UUID until the server confirms it, and Number(uuid) is NaN on both
			// sides - the row would never match and the panel would cover it.
			const isVisibleMessage = messageList.some((message) => String(message.id) === String(playingMessageId));
			const togglePanelVisibility = isVisibleMessage ? this.hidePanel : this.showPanel;

			togglePanelVisibility();
		}

		/**
		 * @param {MessageId} messageId
		 * @param {number} [playingTime]
		 * @param {number|string|null} [preferredFileId]
		 */
		#playListByMessageId(messageId, playingTime = 0, preferredFileId = null)
		{
			this.#playPerfPoint?.startPoint('Build Playlist');
			const playList = this.createPlayList(messageId, preferredFileId);
			this.#playPerfPoint?.endPoint('Build Playlist', { itemsCount: playList.length });

			if (isEmpty(playList))
			{
				// The native player will never report a state, so the span has to close here.
				this.#endPlayPerfPoint();

				return;
			}

			this.#player.playList(playList, playingTime);
		}

		/**
		 * @param {MessageId} messageId
		 */
		#startPlayPerfPoint(messageId)
		{
			// A previous span may still be open if the native player never answered.
			this.#endPlayPerfPoint();
			this.#playPerfPoint = new PerfPoint('IM Audio Panel Play', `message ${messageId}`).start();
		}

		#endPlayPerfPoint()
		{
			this.#playPerfPoint?.end();
			this.#playPerfPoint = null;
		}

		/**
		 * @param {AudioMessagePlayingParams} params
		 * @returns {Promise}
		 */
		async #updateMessagePlaying({ messageId, isPlaying, playingTime = 0 })
		{
			const message = this.#getMessageById(messageId);
			if (!message)
			{
				// Not an error: the message may be out of the loaded history. Callers
				// fire this without awaiting, so rejecting here would only produce
				// unhandled rejections.
				return null;
			}

			void this.#updatePanelVisibility();

			return this.#setAudioModelState({
				id: messageId,
				isPlaying,
				playingTime,
			});
		}

		/**
		 * @param {AudioModelState} state
		 * @returns {Promise<any>}
		 */
		#setAudioModelState(state)
		{
			return this.store.dispatch('messagesModel/setPlayingState', state);
		}

		/**
		 * @param {AudioRate} audioSpeed
		 * @return {Promise}
		 */
		#updateAudioMessageSpeed(audioSpeed)
		{
			return this.store.dispatch(
				'applicationModel/setAudioRateSetting',
				roundAudioSpeed(audioSpeed),
			).catch((error) => {
				Logger.error(
					'setApplicationAudioRate.applicationModel/setAudioRateSetting.catch:',
					error,
				);
			});
		}

		/**
		 * Audio of the chat messages starting from the given one, in the order of the chat.
		 * A message with two or more files stays out of the queue; a message of the builder keeps
		 * its audio in the block, so the file is resolved by the shared chain.
		 *
		 * @param {MessageId} messageId
		 * @param {number|string|null} [preferredFileId]
		 * @return {Array<(FilesModelState & { messageId: MessageId })>}
		 */
		#getAudioFiles(messageId, preferredFileId = null)
		{
			const messageList = [];
			const dialog = this.#getDialog();

			if (this.#isComment(dialog) && dialog.parentMessageId > 0)
			{
				// The parent post may be out of the loaded history: a null here would break
				// the filter below and the tap would start no playback at all.
				const parentMessage = this.#getMessageById(dialog.parentMessageId);
				if (parentMessage)
				{
					messageList.push(parentMessage);
				}
			}

			const chatMessageList = this.store.getters['messagesModel/getByChatId'](this.chatId);
			if (Type.isArrayFilled(chatMessageList))
			{
				messageList.push(...chatMessageList);
			}

			if (isEmpty(messageList))
			{
				return [];
			}

			return messageList
				.filter((message) => message.id >= messageId)
				.map((message) => {
					const clickedFileId = String(message.id) === String(messageId) ? preferredFileId : null;
					const preferredId = clickedFileId ?? MessageHelper.getAudioBlockFileId(this.store, message);
					const file = MessageHelper.resolveAudioFile(this.store, message, preferredId);
					const hasSeveralMessageFiles = message.files?.length > 1;
					const isBlockFile = file && MessageHelper.isAudioBlockFile(this.store, message, file.id);
					if (hasSeveralMessageFiles && !isBlockFile)
					{
						return null;
					}

					return file ? { ...file, messageId: message.id } : null;
				})
				.filter((file) => file && file.type === FileType.audio);
		}

		/**
		 * @param {MessageId} messageId
		 * @returns {MessagesModelState|null}
		 */
		#getMessageById(messageId)
		{
			const message = this.store.getters['messagesModel/getById'](messageId);

			return isEmpty(message) ? null : message;
		}

		/**
		 * @param {TimeUpdateState} [payload]
		 */
		setPlayingTime({ currentTime } = {})
		{
			if (currentTime > 0)
			{
				this.#setPlayingState({ playingTime: currentTime });
			}
		}

		/**
		 * @param {MessageId} messageId
		 * @returns {number}
		 */
		#getPlayingTime(messageId)
		{
			const { playingTime, messageId: playingMessageId } = this.#playingState;
			// Compared as strings: an own message carries a UUID until the server confirms
			// it, and Number(uuid) is NaN on both sides - the kept progress would be lost
			// and the message would restart from the beginning after a pause.
			if (String(messageId) !== String(playingMessageId))
			{
				return 0;
			}

			return playingTime;
		}

		/**
		 * @returns {MessageId|null}
		 */
		#getPlayingMessageId()
		{
			if (this.#playingState.messageId)
			{
				return this.#playingState.messageId;
			}

			const currentAudio = this.#getCurrentAudio();
			if (!currentAudio)
			{
				return null;
			}

			return currentAudio?.associatedId;
		}

		/**
		 * @returns {CurrentAudioState}
		 */
		#getCurrentAudio()
		{
			const { currentAudio } = this.#getCurrentMediaState();

			return currentAudio;
		}

		/**
		 * @returns {Partial<AudioState>}
		 */
		#getCurrentMediaState()
		{
			return this.#player.getCurrentMediaState?.() ?? {};
		}

		#destructor()
		{
			if (!this.#player)
			{
				return;
			}

			// Unsubscribe first: release() may emit a final state, and handling it
			// after the panel is gone would dispatch into a dead dialog.
			this.#unsubscribePlayerEvents();
			this.#endPlayPerfPoint();
			panelVisibilityArbiter.cancel(this.#playerId);

			if (IS_ANDROID)
			{
				// release() is documented for Android but is not exposed by every app build
				this.#player.release?.();
			}
		}

		/**
		 * @returns {Promise<ViewableMessages>}
		 */
		#getViewableMessages()
		{
			const { getViewableMessages } = this.#props;

			return getViewableMessages();
		}

		#getSpeed()
		{
			return this.#player?.getCurrentSpeed?.();
		}

		/**
		 * Keeps the fields the caller did not pass: the native player omits
		 * playingTime in part of its payloads, and timeupdate carries no
		 * messageId at all, so a blind spread would erase the other field.
		 *
		 * @param {Partial<AudioPanelPlayingState>} patch
		 */
		#setPlayingState(patch)
		{
			this.#playingState = mergeDefinedFields(this.#playingState, patch);
		}

		#finalPlaying()
		{
			void this.#updateMessagePlaying({
				playingTime: 0,
				isPlaying: false,
				messageId: this.#getPlayingMessageId(),
			});

			this.#playingState = {
				playingTime: 0,
				messageId: 0,
			};
		}

		// The panel has several owners per native player - this dialog, the comment dialog
		// of a channel post, the sidebar audio tab - so the decision goes through the
		// arbiter, which keeps only the last one within a frame.
		showPanel = () => {
			panelVisibilityArbiter.request(this.#playerId, () => this.#player.showAudioPanel());
		};

		hidePanel = () => {
			panelVisibilityArbiter.request(this.#playerId, () => this.#player.hideAudioPanel());
		};

		hiddenDialog()
		{
			this.#dialogIsShown = false;

			// The dialog left the screen: sidebar, participant profile, another section.
			// While it was shown the panel could be legitimately hidden because the playing
			// message was visible in the list - now there is nothing else to control the
			// audio with, so the panel has to come back.
			this.#showPanelIfHasAudio();
		}

		/**
		 * Shows the panel whenever the player still holds audio, playing or paused -
		 * the same rule the in-dialog toggle uses, which cares about the message being
		 * visible and not about the playback state.
		 */
		#showPanelIfHasAudio()
		{
			if (!this.#getPlayingMessageId())
			{
				return;
			}

			this.showPanel();
		}

		showDialog()
		{
			this.#dialogIsShown = true;

			// Whoever was on top of the dialog - sidebar, profile - could have shown the
			// panel while leaving. The message list fires no viewability event unless it
			// scrolls, so without this the panel stays over a message that already shows
			// its own progress.
			void this.#updatePanelVisibility();
		}

		closeDialog()
		{
			this.#destructor();
		}

		/**
		 * @param {DialoguesModelState} [dialog]
		 * @return {boolean}
		 */
		#isComment(dialog)
		{
			return DialogHelper.createByModel(dialog)?.isComment;
		}

		/**
		 * @returns {?DialoguesModelState}
		 */
		#getDialog()
		{
			return DialogHelper.getDialogModel(this.dialogId);
		}

		/**
		 * @returns {MessengerCoreStore}
		 */
		get store()
		{
			const { store } = this.#props;

			return store;
		}

		/**
		 * @returns {ChatId}
		 */
		get chatId()
		{
			const { chatId } = this.#props;

			return chatId;
		}

		/**
		 * @returns {DialogId}
		 */
		get dialogId()
		{
			const { dialogId } = this.#props;

			return dialogId;
		}
	}

	module.exports = {
		AudioPanel,
	};
});
