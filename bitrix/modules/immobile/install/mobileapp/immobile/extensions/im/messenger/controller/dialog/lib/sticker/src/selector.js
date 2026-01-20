/**
 * @module im/messenger/controller/dialog/lib/sticker/src/selector
 */
jn.define('im/messenger/controller/dialog/lib/sticker/src/selector', (require, exports, module) => {
	const { Color } = require('tokens');

	const { getLoggerWithContext } = require('im/messenger/lib/logger');
	const { Notification } = require('im/messenger/lib/ui/notification');

	const { emitter } = require('im/messenger/controller/dialog/lib/sticker/src/utils/emitter');
	const { StickerEventType } = require('im/messenger/controller/dialog/lib/sticker/src/const');
	const { StickerGrid } = require('im/messenger/controller/dialog/lib/sticker/src/ui/grid/grid');
	const { StickerNavigationBar } = require('im/messenger/controller/dialog/lib/sticker/src/ui/navigation/bar');
	const { StickerService } = require('im/messenger/controller/dialog/lib/sticker/src/service');

	const logger = getLoggerWithContext('dialog--sticker', 'StickerSelector');

	/**
	 * @class StickerSelector
	 * @typedef {LayoutComponent<StickerSelectorProps, StickerSelectorState>} StickerSelector
	 */
	class StickerSelector extends LayoutComponent
	{
		constructor(props)
		{
			super(props);
			this.service = new StickerService(props.dialogLocator);

			this.initState();
		}

		componentDidMount()
		{
			emitter.on(StickerEventType.action.send, this.sendActionHandler);
			emitter.on(StickerEventType.action.deleteRecentSticker, this.deleteRecentStickerActionHandler);
			emitter.on(StickerEventType.action.clearHistory, this.clearHistoryActionHandler);
		}

		componentWillUnmount()
		{
			emitter.off(StickerEventType.action.send, this.sendActionHandler);
			emitter.off(StickerEventType.action.deleteRecentSticker, this.deleteRecentStickerActionHandler);
			emitter.off(StickerEventType.action.clearHistory, this.clearHistoryActionHandler);
		}

		render()
		{
			return View(
				{
					style: {
						flex: 1,
						backgroundColor: Color.bgSecondary.toHex(),
					},
				},
				new StickerNavigationBar({
					isLoaded: this.state.isStickersLoaded,
					packs: this.state.packs,
					recentStickers: this.state.recentStickers,
				}),
				new StickerGrid({
					isLoaded: this.state.isStickersLoaded,
					packs: this.state.packs,
					recentStickers: this.state.recentStickers,
					renderHeaders: true,
					renderTopStroke: true,
				}),
			);
		}

		initState()
		{
			if (this.service.isCurrentPacksLoaded())
			{
				this.state = {
					...this.service.getCurrentStickers(),
					isStickersLoaded: true,
				};

				return;
			}

			this.state = {
				isStickersLoaded: false,
				packs: [],
				recentStickers: [],
			};

			this.service.loadInitialStickers()
				.then((result) => {
					this.setState({
						...result,
						isStickersLoaded: true,
					});
				})
				.catch((error) => {
					logger.error('loadInitialStickers error', error);
				})
			;
		}

		sendActionHandler = (stickerId, packId, packType, uri) => {
			this.service.sendSticker({
				stickerId,
				packId,
				packType,
				uri,
			})
				.catch((error) => {
					logger.error('sendActionHandler error', error);
				});

			this.props.close();
		};

		deleteRecentStickerActionHandler = (stickerId, packId, packType) => {
			this.service.deleteRecentSticker(stickerId, packId, packType)
				.then((result) => {
					this.setState({
						...result,
					});
				})
				.catch((error) => {
					Notification.showErrorToast();
					logger.error('deleteRecentStickerActionHandler error', error);
				})
			;
		};

		clearHistoryActionHandler = () => {
			this.service.deleteAllRecentStickers()
				.then((result) => {
					this.setState({
						...result,
					});
				})
				.catch((error) => {
					Notification.showErrorToast();
					logger.error('clearHistoryActionHandler error', error);
				})
			;
		};
	}

	module.exports = { StickerSelector };
});
