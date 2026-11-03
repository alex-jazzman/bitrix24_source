/**
 * @module im/messenger/controller/sidebar-v2/tabs/audio/src/player/audio-player-v2
 */
jn.define('im/messenger/controller/sidebar-v2/tabs/audio/src/player/audio-player-v2', (require, exports, module) => {
	const { AudioPlayer: NativeAudioPlayer } = require('native/media');
	const { Type } = require('type');
	const { DialogHelper } = require('im/messenger/lib/helper');
	const { throttle } = require('utils/function');
	const { isEqual, isEmpty } = require('utils/object');
	const { getLogger } = require('im/messenger/lib/logger');
	const { AudioEvents, AudioPlayingState } = require('im/messenger/const');
	const {
		prepareAudioName,
		roundAudioTime,
		roundAudioSpeed,
		getAudioRate,
		extractSpeed,
		createChatReturnData,
		mergeDefinedFields,
		createAudioPlayerId,
	} = require('im/messenger/controller/dialog/lib/audio-panel/audio-helper');
	const {
		panelVisibilityArbiter,
	} = require('im/messenger/controller/dialog/lib/audio-panel/panel-visibility');
	const { BaseAudioPlayer } = require('im/messenger/controller/sidebar-v2/tabs/audio/src/player/base-player');
	const { isPlayableAudioRow } = require('im/messenger/controller/sidebar-v2/tabs/audio/src/row-state');

	const logger = getLogger('sidebar-v2-audio-controller');

	const eventStateMap = {
		[AudioPlayingState.playing]: AudioEvents.play,
		[AudioPlayingState.paused]: AudioEvents.pause,
		[AudioPlayingState.final]: AudioEvents.finish,
		[AudioPlayingState.stopped]: AudioEvents.stop,
	};

	/**
	 * @returns {SidebarAudioPlayingState}
	 */
	const createEmptyPlayingState = () => ({
		messageId: 0,
		fileId: 0,
		currentTime: 0,
		duration: 0,
		isPlaying: false,
	});

	class AudioPlayerV2 extends BaseAudioPlayer
	{
		/** @type {SidebarAudioPlayingState} */
		#playingState = createEmptyPlayingState();

		#lastMediaChangeState = null;
		#lastTimeUpdate = null;

		constructor(props)
		{
			super(props);

			this.player = this.createPlayer();
			this.setPlayingTime = throttle(this.setPlayingTime, 200, this);
			this.#subscribePlayerEvents();
		}

		/**
		 * Binds the tab to the audio that is already playing (started in the chat or
		 * in another tab). Every lookup may legitimately miss: the file may be out of
		 * the store, and the message may be older than the loaded page of the tab.
		 *
		 * The panel is hidden only when the playing audio really gets a row in this tab -
		 * the row then carries the progress and the controls. Otherwise the panel stays
		 * the only control the listener has, so it must remain visible.
		 *
		 * @returns {Promise<string|number|null>} file id to scroll to, null if none
		 */
		async initActualState()
		{
			const audioState = this.getCurrentAudio();
			const currentAudio = audioState?.currentAudio;
			const messageId = currentAudio?.associatedId || null;
			// Paused audio counts as active here, the same way the panel and the rest of the
			// player treat it: otherwise a message paused in the chat leaves its row idle,
			// the list does not scroll to it and the panel stays over a visible row.
			const hasActiveAudio = [
				AudioPlayingState.playing,
				AudioPlayingState.paused,
			].includes(audioState?.playingState);
			if (!hasActiveAudio || !messageId)
			{
				this.#showPanelIfHasAudio();

				return null;
			}

			const fileModel = this.#getFileByMessageId(messageId);
			if (!fileModel?.id)
			{
				logger.warn('initActualState: no file in the store for the playing message', messageId);
				this.#showPanelIfHasAudio();

				return null;
			}

			const fileId = fileModel.id;
			if (!this.findItem(fileId)?.getKey())
			{
				logger.warn('initActualState: playing audio is out of the loaded tab page', fileId);
				this.#showPanelIfHasAudio();

				return null;
			}

			// The state comes from the native player: a copy is passed on instead of writing
			// into the object the native side owns.
			const resolvedState = {
				...audioState,
				currentAudio: {
					...currentAudio,
					returnData: {
						...currentAudio.returnData,
						fileId,
						messageId,
					},
				},
			};

			this.hidePanel();
			this.#playMediaChanged(resolvedState);

			return fileId;
		}

		/**
		 * Mirrors the dialog panel: the playing row visible in the list replaces the
		 * panel, anything else brings the panel back.
		 *
		 * @param {Array<number>} [visibleIndexes] indexes of the rows the list reports as visible
		 */
		syncPanelVisibility(visibleIndexes = [])
		{
			const playingFileId = this.#getPlayingFileId();
			if (!playingFileId)
			{
				return;
			}

			const isPlayingRowVisible = visibleIndexes.some((index) => {
				const rowFileId = this.getItems()[index]?.data?.fileId;

				return rowFileId !== undefined && Number(rowFileId) === Number(playingFileId);
			});

			if (isPlayingRowVisible)
			{
				this.hidePanel();

				return;
			}

			this.showPanel();
		}

		/**
		 * The list reports indexes of the rows it shows, in the order of getItems():
		 * the tab renders a single section.
		 *
		 * @param {Array<number>} visibleIndexes
		 */
		onViewableItemsChanged(visibleIndexes)
		{
			this.syncPanelVisibility(Array.isArray(visibleIndexes) ? visibleIndexes : []);
		}

		/**
		 * Called when the tab loses the screen: no row can stand in for the panel there.
		 */
		restorePanel()
		{
			this.#showPanelIfHasAudio();
		}

		/**
		 * Shows the panel while the player still holds audio, playing or paused - the
		 * listener needs the controls in both states.
		 */
		#showPanelIfHasAudio()
		{
			if (!this.#getPlayingFileId())
			{
				return;
			}

			this.showPanel();
		}

		/**
		 * @returns {string|number|null}
		 */
		#getPlayingFileId()
		{
			return this.#playingState.fileId || this.getCurrentFileId();
		}

		#subscribePlayerEvents()
		{
			this.player.on(AudioEvents.playingMediaChanged, this.#playMediaChanged);
			this.player.on(AudioEvents.timeUpdate, this.setPlayingTime);
			this.player.on(AudioEvents.speedChanged, this.#speedChanged);
		}

		#unsubscribePlayerEvents()
		{
			this.player?.off(AudioEvents.playingMediaChanged, this.#playMediaChanged);
			this.player?.off(AudioEvents.timeUpdate, this.setPlayingTime);
			this.player?.off(AudioEvents.speedChanged, this.#speedChanged);
		}

		/**
		 * The speed is changed in the native panel, which the sidebar shares with the
		 * dialog: without this the rate picked from the sidebar is lost for every other
		 * audio message. The payload comes in two shapes - see extractSpeed.
		 *
		 * @param {SpeedChangedState|number} payload
		 */
		#speedChanged = (payload) => {
			const speed = extractSpeed(payload);
			if (speed === null)
			{
				return;
			}

			const audioRate = roundAudioSpeed(speed);
			if (audioRate === getAudioRate(this.store))
			{
				return;
			}

			void this.#updateAudioMessageSpeed(audioRate);
		};

		/**
		 * @param {AudioRate} audioSpeed
		 * @returns {Promise}
		 */
		#updateAudioMessageSpeed(audioSpeed)
		{
			return this.store
				.dispatch('applicationModel/setAudioRateSetting', audioSpeed)
				.catch((error) => {
					logger.error('applicationModel/setAudioRateSetting', error);
				});
		}

		/**
		 * @param {AudioState} audioState
		 */
		#playMediaChanged = (audioState) => {
			const { playingState } = audioState;

			if (isEqual(this.#lastMediaChangeState, audioState))
			{
				return;
			}

			this.#lastMediaChangeState = audioState;
			if (playingState === AudioPlayingState.final)
			{
				this.onChange({ event: AudioEvents.finish, fileId: null });
				// The playlist is over: keeping the file here would later make the panel
				// come back for audio that is no longer loaded in the player.
				this.#playingState = createEmptyPlayingState();

				return;
			}

			this.#setPlayingState(audioState);
			this.onChange({ event: eventStateMap[playingState] });
		};

		/**
		 * @param {AudioState} audioState
		 */
		#setPlayingState(audioState)
		{
			const { duration, currentAudio, playingState, playingTime } = audioState;
			if (isEmpty(currentAudio))
			{
				logger.error('setPlayingState: current audio is empty', audioState);

				return;
			}

			const { associatedId: messageId, returnData } = currentAudio;
			const { fileId } = returnData ?? {};

			// duration and playingTime are absent in part of the native payloads:
			// rounding an absent value to 0 would blank the indicator, so the previous
			// value is kept instead.
			this.#updatePlayingState({
				fileId,
				messageId,
				duration: Type.isNumber(duration) ? roundAudioTime(duration) : undefined,
				currentTime: Type.isNumber(playingTime) ? roundAudioTime(playingTime) : undefined,
				isPlaying: this.#isPlayingState(playingState),
			});
		}

		/**
		 * @param {Partial<SidebarAudioPlayingState>} patch
		 */
		#updatePlayingState(patch)
		{
			this.#playingState = mergeDefinedFields(this.#playingState, patch);
		}

		/**
		 * @param {MessageId} messageId
		 * @returns {FilesModelState|undefined}
		 */
		#getFileByMessageId(messageId)
		{
			const listMessages = this.store.getters['filesModel/getListByMessageId'](messageId);

			return Array.isArray(listMessages) ? listMessages[0] : undefined;
		}

		/**
		 * @param {TimeUpdateState} payload
		 */
		setPlayingTime = ({ currentTime }) => {
			const roundTime = roundAudioTime(currentTime);
			const { currentTime: playingTime } = this.#playingState;

			if (this.#lastTimeUpdate === roundTime || roundTime === playingTime || roundTime === 0)
			{
				return;
			}

			this.#lastTimeUpdate = roundTime;

			this.#updatePlayingState({ currentTime: roundTime });
			this.onChange({ event: AudioEvents.timeUpdate });
		};

		/**
		 * @param {SidebarAudioChangePayload} payload
		 */
		onChange(payload)
		{
			super.onChange({
				...this.#playingState,
				...payload,
			});
		}

		/**
		 * @param {AudioFile} audioFile
		 */
		start(audioFile)
		{
			this.#resetEventCaches();
			this.#updatePlayingState({ currentTime: 0 });
			this.playList(audioFile);
		}

		/**
		 * Shares the native player of the dialog audio panel: the id must match the
		 * one the panel builds, otherwise the tab attaches to a separate player and
		 * loses the audio started in the chat.
		 *
		 * @returns {NativeAudioPlayer}
		 */
		createPlayer()
		{
			const dialog = DialogHelper.getDialogModel(this.props.dialogId);
			this.playerId = createAudioPlayerId({
				chatId: this.chatId,
				isComment: DialogHelper.createByModel(dialog)?.isComment,
				parentChatId: dialog?.parentChatId,
			});

			return this.createNativePlayer({
				id: this.playerId,
				keepPlaying: true,
			});
		}

		/**
		 * @param {NativeAudioPlayerParams} params
		 * @returns {NativeAudioPlayer}
		 */
		createNativePlayer(params)
		{
			return new NativeAudioPlayer(params);
		}

		/**
		 * @param {AudioFile} [startAudioFile]
		 * @returns {Array<NativeAudioItem>}
		 */
		createPlaylist(startAudioFile)
		{
			// The item list holds every row of the tab. A video note is one of them and has no
			// playback here; a row can also outlive its file model in the store, and one such
			// row must not break the whole playlist. Both are skipped, not played.
			const playlist = this.getItems().map(({ data: file }) => {
				const fileModel = this.getFileModel(file?.fileId);
				if (!fileModel)
				{
					logger.warn('createPlaylist: no file model in the store for the row', file?.fileId);

					return null;
				}

				if (!isPlayableAudioRow(fileModel))
				{
					return null;
				}

				return {
					uri: fileModel.localUrl || fileModel.urlDownload,
					title: prepareAudioName({
						fileName: fileModel.name,
						messageId: file.messageId,
						store: this.store,
					}),
					associatedId: String(file.messageId),
					returnData: createChatReturnData({
						dialogId: this.props.dialogId,
						fileId: String(file.fileId),
						messageId: String(file.messageId),
					}),
				};
			}).filter(Boolean);

			if (!startAudioFile)
			{
				return playlist;
			}

			const startIndex = playlist.findIndex((item) => {
				return Number(item.returnData?.fileId) === Number(startAudioFile.fileId);
			});

			if (startIndex === -1)
			{
				logger.error('Audio file not found in playlist', startAudioFile);

				return playlist;
			}

			return playlist.slice(startIndex);
		}

		/**
		 * @param {AudioFile} [audioFile]
		 */
		playList(audioFile)
		{
			this.player?.playList(this.createPlaylist(audioFile));
		}

		/**
		 * The native player walks the playlist by itself, so there is nothing to
		 * advance here - unlike the legacy player, which starts the next file.
		 */
		onFinish()
		{}

		/**
		 * @param {AudioPlayingStateType} playingState
		 * @returns {boolean}
		 */
		#isPlayingState(playingState)
		{
			return AudioPlayingState.playing === playingState;
		}

		/**
		 * Only drops the subscriptions. The native player is shared with the dialog
		 * audio panel, which owns its lifecycle: releasing it here would kill the
		 * audio started in the chat as soon as the sidebar is closed.
		 */
		destructor()
		{
			this.#unsubscribePlayerEvents();
			// A decision made inside the coalescing window would otherwise reach the native
			// player after the tab is gone.
			panelVisibilityArbiter.cancel(this.playerId);
		}

		/**
		 * @returns {Partial<AudioState>}
		 */
		getCurrentAudio()
		{
			return this.player?.getCurrentMediaState?.() ?? {};
		}

		/**
		 * @returns {string|number|null}
		 */
		getCurrentFileId()
		{
			const audioState = this.getCurrentAudio();
			const currentAudio = audioState?.currentAudio;

			return currentAudio?.returnData?.fileId || null;
		}

		// The panel is shared with the dialog panel through the same native player, so the
		// decision goes through the arbiter - see panel-visibility.
		hidePanel()
		{
			panelVisibilityArbiter.request(this.playerId, () => this.player?.hideAudioPanel());
		}

		showPanel()
		{
			panelVisibilityArbiter.request(this.playerId, () => this.player?.showAudioPanel());
		}

		stop()
		{
			this.#resetEventCaches();
			this.#playingState = createEmptyPlayingState();
			super.stop();
			this.player?.clearPlaylist();
		}

		#resetEventCaches()
		{
			this.#lastMediaChangeState = null;
			this.#lastTimeUpdate = null;
		}
	}

	module.exports = {
		AudioPlayerV2,
	};
});
