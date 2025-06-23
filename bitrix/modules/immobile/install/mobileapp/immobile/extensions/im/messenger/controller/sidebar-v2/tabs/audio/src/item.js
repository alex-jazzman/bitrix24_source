/**
 * @module im/messenger/controller/sidebar-v2/tabs/audio/src/item
 */

jn.define('im/messenger/controller/sidebar-v2/tabs/audio/src/item', (require, exports, module) => {
	const { AudioPlayer } = require('native/media');

	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { ListItem } = require('im/messenger/controller/sidebar-v2/ui/layout/list-item');
	const { getLogger } = require('im/messenger/lib/logger');

	const { PlaybackTimeIndicator } = require('im/messenger/controller/sidebar-v2/tabs/audio/src/ui/playback-time-indicator');
	const { TitleDate } = require('im/messenger/controller/sidebar-v2/tabs/audio/src/ui/title-date');
	const { AudioActionMenu } = require('im/messenger/controller/sidebar-v2/tabs/audio/src/action-menu');
	const { AudioIcon } = require('im/messenger/controller/sidebar-v2/tabs/audio/src/ui/audio-icon');
	const { PlayerStage } = require('im/messenger/controller/sidebar-v2/tabs/audio/const');
	const { Owner } = require('im/messenger/controller/sidebar-v2/tabs/audio/src/ui/owner');

	const logger = getLogger('sidebar-v2-audio-item');

	class AudioItem extends LayoutComponent
	{
		/**
		 * @param {object} props
		 * @param {number} props.dialogId
		 * @param {number} props.authorId
		 * @param {number} props.messageId
		 * @param {number} props.fileId
		 * @param {function} props.ref
		 * @param {function} props.setCurrentPlayingItem
		 * @param {function} props.stopCurrentPlayingItem
		 * @param {function} props.getCurrentPlayingItem
		 * @param {function} props.onFinish
		 * @param {WidgetNavigator} props.widgetNavigator
		 */
		constructor(props)
		{
			super(props);

			this.ref = null;

			/**
			 * @protected
			 * @type {MessengerCoreStore}
			 */
			this.store = serviceLocator.get('core').getStore();

			this.dialogId = props.dialogId;
			this.messageId = props.messageId;
			this.fileId = props.fileId;
			this.fileModel = this.store.getters['filesModel/getById'](this.fileId);

			this.player = null;
			this.state = {
				duration: 0,
				timing: 0,
				stage: PlayerStage.IDLE,
			};

			this.setCurrentPlayingItem = props.setCurrentPlayingItem;
			this.stopCurrentPlayingItem = props.stopCurrentPlayingItem;
			this.getCurrentPlayingItem = props.getCurrentPlayingItem;
			this.onFinish = props.onFinish;
		}

		get isCurrentItem()
		{
			return this.getId() === this.getCurrentPlayingItem()?.getId();
		}

		componentWillUnmount()
		{
			if (this.player)
			{
				this.player.stop();
			}
		}

		getId()
		{
			return this.props.id;
		}

		/**
		 * @protected
		 * @param {?string} suffix
		 * @returns {string}
		 */
		getTestId(suffix = null)
		{
			const prefix = `sidebar-tab-audio-item-${this.fileId}`;

			return suffix ? `${prefix}-${suffix}` : prefix;
		}

		render()
		{
			return new ListItem({
				ref: this.onRef,
				testId: this.getTestId(),
				title: this.createTitle,
				subtitle: () => Owner(
					this.fileModel.authorId,
					this.fileModel.authorName,
					this.getTestId(),
				),
				leftIcon: () => AudioIcon(this.state.stage),
				onClick: this.onClick,
				onShowMenu: this.showActionMenu,
			});
		}

		createTitle = () => {
			const stage = this.state.stage;
			if (stage === PlayerStage.PLAYING || stage === PlayerStage.PAUSED)
			{
				return PlaybackTimeIndicator(
					this.state.timing,
					this.state.duration,
					this.getTestId(),
				);
			}

			return TitleDate(this.fileModel?.date, this.getTestId());
		};

		onRef = (ref) => {
			this.ref = ref;
		};

		onClick = () => {
			if (this.state.stage === PlayerStage.IDLE)
			{
				this.start();

				return;
			}

			if (this.state.stage === PlayerStage.PAUSED)
			{
				this.player.setSeek(this.state.timing ?? 0);
				this.play();

				return;
			}

			if (this.state.stage === PlayerStage.PLAYING)
			{
				this.pause();

				return;
			}

			if (this.state.stage === PlayerStage.LOADING)
			{
				this.stop();
			}
		};

		finish = () => {
			this.stop(this.onFinish);
		};

		/**
		 * @public
		 */
		stop = (onStop) => {
			this.setState({ stage: PlayerStage.IDLE, timing: 0 }, () => {
				this.clearInterval();
				if (this.player)
				{
					this.player.stop();

					this.player.off('ready', this.onReadyAudio);
					this.player.off('pause', this.onPauseAudio);
					this.player.off('error', this.onErrorAudio);
					this.player.off('play', this.onPlayAudio);
					this.player.off('stop', this.stop);
					this.player.off('finish', this.finish);

					this.player = null;
				}

				if (onStop)
				{
					onStop();
				}
			});
		};

		pause()
		{
			this.setState({ stage: PlayerStage.PAUSED }, () => {
				if (this.player)
				{
					this.player.pause();
				}
			});
		}

		play()
		{
			this.setState({ stage: PlayerStage.PLAYING }, () => {
				if (this.player)
				{
					this.player.play();

					return;
				}

				this.initPlayer();
			});
		}

		start()
		{
			this.setState({ stage: PlayerStage.LOADING }, () => {
				if (!this.isCurrentItem)
				{
					this.stopCurrentPlayingItem();
				}

				this.initPlayer();
			});
		}

		showActionMenu = ({ ref: target }) => {
			(new AudioActionMenu({
				fileId: this.fileModel.id,
				dialogId: this.dialogId,
				messageId: this.messageId,
				widgetNavigator: this.props.widgetNavigator,
			})).show(target);
		};

		initPlayer = () => {
			if (!this.fileModel.urlDownload)
			{
				logger.error('Audio file not found', this.fileModel);

				return;
			}

			if (!this.player)
			{
				this.player = new AudioPlayer({
					uri: this.fileModel.urlDownload,
				});

				this.player.on('ready', this.onReadyAudio);
				this.player.on('pause', this.onPauseAudio);
				this.player.on('error', this.onErrorAudio);
				this.player.on('play', this.onPlayAudio);
				this.player.on('stop', this.stop);
				this.player.on('finish', this.finish);
			}

			this.setCurrentPlayingItem(this);
		};

		onReadyAudio = ({ duration }) => {
			this.setState({ duration, stage: PlayerStage.PLAYING }, () => {
				this.player.play();
			});
		};

		onErrorAudio = (error) => {
			logger.error('error', error);
		};

		onPauseAudio = (timing) => {
			if (!this.isCurrentItem)
			{
				return;
			}

			this.setState(
				{ stage: PlayerStage.PAUSED, timing },
				this.clearInterval,
			);
		};

		onPlayAudio = () => {
			if (!this.isCurrentItem)
			{
				return;
			}

			this.setState(
				{ stage: PlayerStage.PLAYING },
				() => {
					if (!this.intervalId)
					{
						this.intervalId = setInterval(() => {
							if (this.state.timing < this.state.duration)
							{
								this.setState({
									timing: this.state.timing + 1,
								});
							}
							else
							{
								this.setState({
									stage: PlayerStage.IDLE,
									timing: 0,
								});

								this.clearInterval();
							}
						}, 1000);
					}
				},
			);
		};

		clearInterval = () => {
			clearInterval(this.intervalId);
			this.intervalId = null;
		};
	}

	module.exports = {
		AudioItem,
	};
});
