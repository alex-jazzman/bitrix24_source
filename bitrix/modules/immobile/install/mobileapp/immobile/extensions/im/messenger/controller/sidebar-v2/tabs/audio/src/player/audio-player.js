/**
 * @module im/messenger/controller/sidebar-v2/tabs/audio/src/player/audio-player
 */
jn.define('im/messenger/controller/sidebar-v2/tabs/audio/src/player/audio-player', (require, exports, module) => {
	const { AudioPlayer: NativeAudioPlayer } = require('native/media');
	const { Type } = require('type');
	const { getLogger } = require('im/messenger/lib/logger');
	const { AudioEvents } = require('im/messenger/const');
	const { BaseAudioPlayer } = require('im/messenger/controller/sidebar-v2/tabs/audio/src/player/base-player');
	const { isPlayableAudioRow } = require('im/messenger/controller/sidebar-v2/tabs/audio/src/row-state');

	const logger = getLogger('sidebar-v2-audio-controller');

	/**
	 * This player emits pause as a bare number (the playback position), while
	 * timeupdate and ready send objects. Normalizing here keeps a single payload
	 * shape for the tab.
	 *
	 * @param {TimeUpdateState|number} [payload]
	 * @returns {TimeUpdateState|{}}
	 */
	const toPayloadObject = (payload) => {
		if (Type.isNumber(payload))
		{
			return { currentTime: payload };
		}

		return Type.isPlainObject(payload) ? payload : {};
	};

	class AudioPlayer extends BaseAudioPlayer
	{
		/**
		 * @param {AudioFile} audioFile
		 */
		start(audioFile)
		{
			const { fileId } = audioFile;
			const file = this.getFileModel(fileId);

			if (!file?.urlDownload)
			{
				logger.error('Audio file not found', file);

				return;
			}

			// Drops the previous player with its subscriptions: without this, switching
			// files leaves the old native player alive and still emitting.
			this.destructor();

			this.player = this.createPlayer(file);
		}

		/**
		 * @param {FilesModelState} fileModel
		 * @returns {NativeAudioPlayer|null}
		 */
		createPlayer(fileModel)
		{
			if (!fileModel.urlDownload)
			{
				logger.error('Audio file not found', fileModel);

				return null;
			}

			const player = this.createNativePlayer({ uri: fileModel.urlDownload });

			const fileId = fileModel.id;
			// The event name must reach the tab as a string: it is matched against
			// AudioEvents there, and an object would silently match nothing.
			const onChange = (event) => (payload) => this.onChange({
				event,
				fileId,
				...toPayloadObject(payload),
			});

			const handlers = {
				[AudioEvents.ready]: this.onReady({ event: AudioEvents.ready, fileId }),
				[AudioEvents.pause]: onChange(AudioEvents.pause),
				[AudioEvents.error]: onChange(AudioEvents.error),
				[AudioEvents.play]: onChange(AudioEvents.play),
				[AudioEvents.stop]: onChange(AudioEvents.stop),
				[AudioEvents.finish]: onChange(AudioEvents.finish),
				[AudioEvents.timeUpdate]: onChange(AudioEvents.timeUpdate),
			};

			this.playerHandlers = handlers;

			Object.entries(handlers).forEach(([event, handler]) => {
				player.on(event, handler);
			});

			return player;
		}

		/**
		 * @param {{ uri: string }} params
		 * @returns {NativeAudioPlayer}
		 */
		createNativePlayer(params)
		{
			return new NativeAudioPlayer(params);
		}

		removePlayerEvents()
		{
			if (this.player && this.playerHandlers)
			{
				Object.entries(this.playerHandlers).forEach(([event, handler]) => {
					this.player.off?.(event, handler);
				});

				this.playerHandlers = null;
			}
		}

		onReady = (params) => (payload) => {
			this.onChange({ ...params, ...toPayloadObject(payload) });
			this.play();
		};

		/**
		 * @param {string|number} fileId
		 */
		onFinish(fileId)
		{
			if (this.player)
			{
				this.stop();
				this.destructor();
			}

			const nextItem = this.#findNextPlayableItem(this.findItemIndex(fileId));

			if (nextItem)
			{
				this.start(nextItem.data);
			}
		}

		/**
		 * The item list holds every row of the tab, video notes among them: they have no
		 * playback here, so the run walks past them to the next audio.
		 *
		 * @param {number} currentIndex
		 * @returns {SidebarTabListItemModel|undefined}
		 */
		#findNextPlayableItem(currentIndex)
		{
			return this.getItems()
				.slice(currentIndex + 1)
				.find((item) => isPlayableAudioRow(this.getFileModel(item?.data?.fileId)));
		}

		/**
		 * Stops the sound, not only the subscriptions: this player owns its native
		 * instance, and closing the sidebar used to stop it through the row component.
		 * Unsubscribing first keeps the switch between files silent - the events of the
		 * player being dropped would otherwise reset the row of the new file.
		 */
		destructor()
		{
			this.removePlayerEvents();
			this.player?.stop();
			this.player = null;
		}
	}

	module.exports = {
		AudioPlayer,
	};
});
