/**
 * @module im/messenger/controller/sidebar-v2/tabs/audio
 */
jn.define('im/messenger/controller/sidebar-v2/tabs/audio', (require, exports, module) => {
	const { Loc } = require('im/messenger/controller/sidebar-v2/loc');
	const { SidebarBaseTab } = require('im/messenger/controller/sidebar-v2/tabs/base');
	const {
		SidebarFileService,
		SidebarFileDateOrder,
	} = require('im/messenger/controller/sidebar-v2/services/file-service');
	const { SidebarAudioTabSubtypes } = require('im/messenger/controller/sidebar-v2/const');
	const { SidebarAudioTabContent } = require('im/messenger/controller/sidebar-v2/tabs/audio/src/content');
	const { Feature } = require('im/messenger/lib/feature');
	const { AudioPlayer } = require('im/messenger/controller/sidebar-v2/tabs/audio/src/player/audio-player');
	const { AudioPlayerV2 } = require('im/messenger/controller/sidebar-v2/tabs/audio/src/player/audio-player-v2');

	class SidebarAudioTab extends SidebarBaseTab
	{
		/** @type {IAudioPlayerController|null} */
		#audioController = null;

		getId()
		{
			return 'audio';
		}

		getTitle()
		{
			return Loc.getMessage('IMMOBILE_SIDEBAR_V2_COMMON_TABS_AUDIO_TITLE_MSGVER_1');
		}

		createDataProvider()
		{
			const { chatId, dialogId } = this.dialogData;

			return new SidebarFileService({
				chatId,
				dialogId,
				subtypes: SidebarAudioTabSubtypes,
				order: SidebarFileDateOrder,
			});
		}

		getView()
		{
			return (props = {}) => new SidebarAudioTabContent({
				tabId: this.getId(),
				audioController: this.createAudioPlayer(),
				destroyAudioController: this.destroyAudioController,
				dialogData: this.dialogData,
				widgetNavigator: this.widgetNavigator,
				dataProvider: this.getDataProvider(),
				...props,
			});
		}

		/**
		 * One controller per tab instance, kept on the tab so it is destroyed with it.
		 * A module-level singleton would outlive the tab: the legacy player then keeps
		 * playing with nothing to control it, and nested sidebars of different chats
		 * would share one controller with a foreign item list.
		 *
		 * @returns {IAudioPlayerController}
		 */
		createAudioPlayer()
		{
			if (this.#audioController)
			{
				return this.#audioController;
			}

			const { chatId, dialogId } = this.dialogData;
			/** @type {SidebarAudioPlayerProps} */
			const audioControllerParams = {
				chatId,
				dialogId,
				store: this.store,
			};

			this.#audioController = Feature.isAudioPanelSupported()
				? new AudioPlayerV2(audioControllerParams)
				: new AudioPlayer(audioControllerParams);

			return this.#audioController;
		}

		destroyAudioController = () => {
			this.#audioController?.destructor?.();
			this.#audioController = null;
		};
	}

	module.exports = { SidebarAudioTab };
});
