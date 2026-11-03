/**
 * @module im/messenger/controller/sidebar-v2/tabs/audio/src/content
 */
jn.define('im/messenger/controller/sidebar-v2/tabs/audio/src/content', (require, exports, module) => {
	const { Type } = require('type');
	const { AudioEvents } = require('im/messenger/const');
	const { PerfPoint } = require('debug/prism');
	const { AsyncQueue } = require('im/messenger/lib/utils');
	const { Loc } = require('im/messenger/controller/sidebar-v2/loc');
	const { AudioItem } = require('im/messenger/controller/sidebar-v2/tabs/audio/src/item');
	const { VideoNoteItem } = require('im/messenger/controller/sidebar-v2/tabs/audio/src/video-note-item');
	const { SidebarFilesTabContent } = require('im/messenger/controller/sidebar-v2/tabs/files');
	const { SidebarTabListItemModel } = require('im/messenger/controller/sidebar-v2/tabs/base');
	const {
		PlayerStage,
		AudioTabEmptyScreenTitleId,
	} = require('im/messenger/controller/sidebar-v2/tabs/audio/src/const');
	const {
		AudioTabRowType,
		resolveAudioTabRowType,
	} = require('im/messenger/controller/sidebar-v2/tabs/audio/src/row-state');
	const { getLogger } = require('im/messenger/lib/logger');
	const logger = getLogger('sidebar-v2-audio-item');

	class SidebarAudioTabContent extends SidebarFilesTabContent
	{
		/** @type {Map<number, string>} */
		#stages = new Map();
		#asyncQueue = new AsyncQueue();

		/**
		 * The list of a tab that is off-screen still reports its viewable rows, and a row
		 * of a tab nobody looks at must not hide the panel.
		 *
		 * @type {boolean}
		 */
		#isSelectedTab = false;

		get audioController()
		{
			return this.props.audioController;
		}

		componentDidMount()
		{
			super.componentDidMount?.();

			// Subscribing once here, not in componentDidUpdate: an update is not
			// guaranteed to happen at all, and repeating the subscription on every
			// update leaks handlers.
			this.audioController?.on('onChange', this.#onChangeAudio);
			// The controller gets the rows of the list, all of them and in their order: it
			// addresses this list by the row indexes the list reports (syncPanelVisibility).
			// What can be played is decided from the file model, where playback starts.
			this.audioController?.setItems(this.getItems());
		}

		componentDidUpdate(prevProps, prevState)
		{
			super.componentDidUpdate?.(prevProps, prevState);

			this.audioController?.setItems(this.getItems());
		}

		componentWillUnmount()
		{
			super.componentWillUnmount?.();

			this.#asyncQueue.clear();
			this.#isSelectedTab = false;
			this.audioController?.off('onChange', this.#onChangeAudio);
			// The panel is deliberately left alone here. The sidebar is closing, so the
			// dialog comes back on screen and re-checks the visibility itself - and it does
			// that after this teardown, so restoring the panel from here would only override
			// the correct decision and leave the panel over a row that shows its own progress.
			// Switching tabs inside the sidebar is the opposite case: no dialog event follows,
			// which is what onDeselectedTab is for.

			const { destroyAudioController } = this.props;

			destroyAudioController?.();
		}

		bindMethods()
		{
			super.bindMethods();

			this.onViewableItemsChanged = this.onViewableItemsChanged.bind(this);
		}

		/**
		 * @param {string|number} fileId
		 * @returns {string}
		 */
		#getStage(fileId)
		{
			if (!fileId)
			{
				return PlayerStage.IDLE;
			}

			return this.#stages.get(Number(fileId)) || PlayerStage.IDLE;
		}

		/**
		 * @param {string|number} fileId
		 * @param {string} stage
		 */
		#setStage(fileId, stage)
		{
			if (!fileId)
			{
				return;
			}
			this.#stages.set(Number(fileId), stage);
		}

		/**
		 * @param {SidebarTabListItemModel} item
		 * @param {SidebarFile} item.data
		 * @returns {AudioItem|VideoNoteItem}
		 */
		renderItem(item)
		{
			const {
				dialogData,
				widgetNavigator,
			} = this.props;

			const itemProps = {
				...item.data,
				dialogId: dialogData.dialogId,
				widgetNavigator,
			};

			if (this.#getRowType(item) === AudioTabRowType.videoNote)
			{
				return new VideoNoteItem(itemProps);
			}

			return new AudioItem({
				...itemProps,
				onClick: this.onClick,
			});
		}

		/**
		 * @param {SidebarTabListItemModel} item
		 * @returns {string}
		 */
		#getRowType(item)
		{
			return resolveAudioTabRowType(this.store.getters['filesModel/getById'](item?.data?.fileId));
		}

		/**
		 * @param {string|number} fileId
		 */
		onClick = (fileId) => {
			const prevFileId = this.#getPrevPlayingFileId();
			const isOtherFilePlaying = prevFileId !== null
				&& Number(prevFileId) !== Number(fileId)
				&& this.#getStage(prevFileId) === PlayerStage.PLAYING;

			if (isOtherFilePlaying)
			{
				this.audioController?.stop();
			}

			switch (this.#getStage(fileId))
			{
				case PlayerStage.IDLE:
					this.audioController?.start({ fileId });
					break;
				case PlayerStage.PAUSED:
					this.audioController?.play();
					break;
				case PlayerStage.PLAYING:
					this.audioController?.pause();
					break;
				case PlayerStage.LOADING:
					this.audioController?.stop();
					break;
				default:
					break;
			}
		};

		/**
		 * @param {SidebarAudioChangePayload} params
		 */
		#onChangeAudio = (params) => {
			const { event, fileId, currentTime, duration } = params;

			// Only the playback fields reach the row: spreading the whole payload would
			// push event/messageId/isPlaying into the item model and diff them natively
			// on every tick.
			const playbackData = { fileId, currentTime, duration };

			const updateStage = (stage) => this.#updateStage({ stage, ...playbackData });
			const toIdleStage = (id = fileId) => {
				this.#updateStage({
					fileId: id,
					stage: PlayerStage.IDLE,
					duration: 0,
					currentTime: 0,
				});
			};

			switch (event)
			{
				case AudioEvents.play:
					updateStage(PlayerStage.PLAYING);
					break;
				case AudioEvents.pause:
					updateStage(PlayerStage.PAUSED);
					break;
				case AudioEvents.stop:
				case AudioEvents.finish:
					toIdleStage();
					break;
				case AudioEvents.error:
					logger.error('audio playback error', params);
					toIdleStage();
					break;
				case AudioEvents.timeUpdate:
				case AudioEvents.ready:
					this.#updateRowByKey(fileId, playbackData);
					break;
				default:
					break;
			}

			this.#stages.forEach((stage, id) => {
				if (Number(id) !== Number(fileId) && stage === PlayerStage.PLAYING)
				{
					toIdleStage(id);
				}
			});
		};

		/**
		 * @param {SidebarAudioRowUpdate} params
		 */
		#updateStage({ stage, ...params })
		{
			const { fileId } = params;
			const prevStage = this.#getStage(fileId);

			if (prevStage === stage)
			{
				return;
			}

			this.#setStage(fileId, stage);
			this.#updateRowByKey(fileId, params);
		}

		/**
		 * @param {string|number} fileId
		 * @param {SidebarAudioRowUpdate} [data]
		 */
		#updateRowByKey(fileId, data)
		{
			const itemModel = this.#getListItemModel(fileId, data);
			if (!itemModel)
			{
				return;
			}

			void this.#asyncQueue.enqueue(() => this.updateRowByKey(itemModel));
		}

		/**
		 * @param {string|number} fileId
		 * @param {SidebarAudioRowUpdate} [data]
		 * @returns {SidebarTabListItemModel|null}
		 */
		#getListItemModel(fileId, data = {})
		{
			const itemModel = this.findItem(fileId);

			if (!itemModel)
			{
				return null;
			}

			return new SidebarTabListItemModel({
				...itemModel.getData(),
				...data,
				stage: this.#getStage(fileId),
			});
		}

		/**
		 * @param {SidebarViewableRowsPayload} payload
		 */
		onViewableItemsChanged(payload = [])
		{
			if (!this.#isSelectedTab)
			{
				return;
			}

			const items = payload?.[0]?.items;

			this.audioController?.onViewableItemsChanged(Type.isArray(items) ? items : []);
		}

		/**
		 * @param {SidebarTabSelectedParams} params
		 */
		onSelectedTab({ tab })
		{
			const { tabId } = this.props;
			if (tab.id !== tabId)
			{
				return;
			}

			this.#isSelectedTab = true;
			this.#initActualState().catch((error) => {
				logger.error('initActualState', error);
			});
		}

		/**
		 * Another tab took the screen: its list has no row for the playing audio, so the
		 * panel becomes the only control again.
		 */
		onDeselectedTab()
		{
			this.#isSelectedTab = false;
			this.audioController?.restorePanel?.();
		}

		async #initActualState()
		{
			const dialogId = this.props.dialogData?.dialogId;
			const point = new PerfPoint('IM Audio Panel Sidebar State', `dialog ${dialogId}`).start();
			try
			{
				point.startPoint('Resolve Playing Row');
				const fileId = await this.audioController?.initActualState();
				point.endPoint('Resolve Playing Row', { found: Boolean(fileId) });

				if (!fileId)
				{
					return;
				}

				point.startPoint('Scroll To Row');
				await this.scrollToItem(this.findItem(fileId));
				point.endPoint('Scroll To Row');
			}
			finally
			{
				point.end();
			}
		}

		/**
		 * @param {SidebarTabListItemModel} [item]
		 */
		async scrollToItem(item)
		{
			const listViewRef = this.getListViewRef();
			if (!listViewRef)
			{
				return;
			}

			const itemKey = item?.getKey();
			if (!itemKey)
			{
				return;
			}

			const isVisible = await listViewRef.isItemVisible(itemKey);
			if (isVisible)
			{
				return;
			}

			const position = listViewRef.getElementPosition(itemKey);
			if (!position)
			{
				return;
			}

			listViewRef.scrollTo(position.section, position.index, true);
		}

		getEmptyScreenProps()
		{
			return {
				testId: 'audio',
				title: Loc.getMessage(AudioTabEmptyScreenTitleId),
				image: 'audio.svg',
			};
		}

		/**
		 * @returns {string|number|null}
		 */
		#getPrevPlayingFileId()
		{
			return [...this.#stages].find(([, stage]) => stage === PlayerStage.PLAYING)?.[0] ?? null;
		}

		/**
		 * The playback state of a row lives outside the item list, so a row rebuilt from the
		 * list alone would reset the playing row to idle.
		 *
		 * @param {SidebarTabListItemModel} item
		 */
		refreshRow(item)
		{
			this.#updateRowByKey(item.getData()?.fileId);
		}
	}

	module.exports = { SidebarAudioTabContent };
});
