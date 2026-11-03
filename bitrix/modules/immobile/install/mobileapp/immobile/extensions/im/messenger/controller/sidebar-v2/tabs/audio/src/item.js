/**
 * @module im/messenger/controller/sidebar-v2/tabs/audio/src/item
 */

jn.define('im/messenger/controller/sidebar-v2/tabs/audio/src/item', (require, exports, module) => {
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { ListItem } = require('im/messenger/controller/sidebar-v2/ui/layout/list-item');
	const { playbackTimeIndicator } = require(
		'im/messenger/controller/sidebar-v2/tabs/audio/src/ui/playback-time-indicator',
	);
	const { TitleDate } = require('im/messenger/controller/sidebar-v2/tabs/audio/src/ui/title-date');
	const { fileActionMenu } = require('im/messenger/controller/sidebar-v2/tabs/files/action-menu');
	const { AudioIcon } = require('im/messenger/controller/sidebar-v2/tabs/audio/src/ui/audio-icon');
	const { PlayerStage } = require('im/messenger/controller/sidebar-v2/tabs/audio/src/const');
	const { Owner } = require('im/messenger/controller/sidebar-v2/tabs/audio/src/ui/owner');
	const { createTestIdGenerator } = require('utils/test');

	/**
	 * @extends {LayoutComponent<AudioItemProps>}
	 */
	class AudioItem extends LayoutComponent
	{
		/**
		 * @param {AudioItemProps} props
		 */
		constructor(props)
		{
			super(props);

			/** @type {MessengerCoreStore} */
			this.store = serviceLocator.get('core').getStore();
			this.fileModel = this.store.getters['filesModel/getById'](props.fileId);
			// Built once: the playing row re-renders on every progress tick, and every
			// render asks for several test ids.
			this.getTestId = createTestIdGenerator({
				prefix: `sidebar-tab-audio-item-${props.fileId}`,
			});
		}

		render()
		{
			const { onClick, fileId, stage } = this.props;

			return new ListItem({
				testId: this.getTestId(),
				title: this.createTitle,
				subtitle: () => Owner(
					this.fileModel?.authorId,
					this.fileModel?.authorName,
					this.getTestId(),
				),
				onClick: () => onClick(fileId),
				leftIcon: () => AudioIcon(stage),
				onShowMenu: this.showActionMenu,
			});
		}

		createTitle = () => {
			const { stage, currentTime, duration } = this.props;

			if (stage === PlayerStage.PLAYING || stage === PlayerStage.PAUSED)
			{
				return playbackTimeIndicator({
					duration,
					currentTime,
					testId: this.getTestId(),
				});
			}

			return TitleDate(this.fileModel?.date, this.getTestId());
		};

		showActionMenu = ({ ref: target }) => {
			const { fileId, messageId, dialogId, widgetNavigator } = this.props;

			void fileActionMenu({
				testId: this.getTestId(),
				fileId,
				dialogId,
				messageId,
				widgetNavigator,
			}).show(target);
		};
	}

	module.exports = {
		AudioItem,
	};
});
