/**
 * @module im/messenger/controller/dialog/lib/sticker/src/widget/selector
 */
jn.define('im/messenger/controller/dialog/lib/sticker/src/widget/selector', (require, exports, module) => {
	const { Type } = require('type');
	const { Color } = require('tokens');

	const { getLoggerWithContext } = require('im/messenger/lib/logger');
	const { Notification } = require('im/messenger/lib/ui/notification');
	const { AnalyticsService } = require('im/messenger/provider/services/analytics');

	const { emitter } = require('im/messenger/controller/dialog/lib/sticker/src/utils/emitter');
	const { StickerEventType } = require('im/messenger/controller/dialog/lib/sticker/src/const');
	const { StickerGrid } = require('im/messenger/controller/dialog/lib/sticker/src/ui/grid/grid');
	const { StickerNavigationBar } = require('im/messenger/controller/dialog/lib/sticker/src/ui/navigation/bar');
	const { ShimmerBar } = require('im/messenger/controller/dialog/lib/sticker/src/ui/navigation/shimmer-bar');
	const { StickerService } = require('im/messenger/controller/dialog/lib/sticker/src/service/service');
	const { StickerDialogs } = require('im/messenger/controller/dialog/lib/sticker/src/dialogs');
	const { StickerNotifier } = require('im/messenger/controller/dialog/lib/sticker/src/notifier');
	const { ShimmerGrid } = require('im/messenger/controller/dialog/lib/sticker/src/ui/grid/shimmer-grid');

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
			this.service = new StickerService({
				dialogLocator: props.dialogLocator,
			});
			this.dialogs = new StickerDialogs();
			/** @type {StickerGrid} */
			this.grid = null;

			this.isPageLoading = false;

			/** @type {StickerNavigationBar} */
			this.navigation = null;

			this.initState();
		}

		componentDidMount()
		{
			emitter.on(StickerEventType.action.send, this.sendActionHandler);
			emitter.on(StickerEventType.action.deleteRecentSticker, this.deleteRecentStickerActionHandler);
			emitter.on(StickerEventType.action.clearHistory, this.clearHistoryActionHandler);
			emitter.on(StickerEventType.action.createPack, this.createPackActionHandler);
			emitter.on(StickerEventType.action.edit, this.editPackActionHandler);
			emitter.on(StickerEventType.action.unlinkPack, this.unlinkPackActionHandler);
			emitter.on(StickerEventType.action.deletePack, this.deletePackActionHandler);
			emitter.on(StickerEventType.widget.reload, this.reloadHandler);
			emitter.on(StickerEventType.sticker.click, this.sendActionHandler);

			AnalyticsService.getInstance().sendOpenStickerSelector(this.props.dialogId);
		}

		componentWillUnmount()
		{
			emitter.off(StickerEventType.action.send, this.sendActionHandler);
			emitter.off(StickerEventType.action.deleteRecentSticker, this.deleteRecentStickerActionHandler);
			emitter.off(StickerEventType.action.clearHistory, this.clearHistoryActionHandler);
			emitter.off(StickerEventType.action.createPack, this.createPackActionHandler);
			emitter.off(StickerEventType.action.edit, this.editPackActionHandler);
			emitter.off(StickerEventType.action.deletePack, this.deletePackActionHandler);
			emitter.off(StickerEventType.action.unlinkPack, this.unlinkPackActionHandler);
			emitter.off(StickerEventType.widget.reload, this.reloadHandler);
			emitter.off(StickerEventType.sticker.click, this.sendActionHandler);
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
				this.#renderNavigation(),
				this.#renderGrid(),
			);
		}

		#renderNavigation()
		{
			if (!this.state.isStickersLoaded)
			{
				return new ShimmerBar({});
			}

			return new StickerNavigationBar({
				isLoaded: this.state.isStickersLoaded,
				packs: this.state.packs,
				recentStickers: this.state.recentStickers,
				hasNextPage: this.state.hasNextPage,
				onLoadNextPage: this.loadNextPageHandler,
				canCreatePack: this.props.canCreatePack,
				ref: (ref) => {
					this.navigation = ref;
				},
			});
		}

		#renderGrid()
		{
			if (!this.state.isStickersLoaded)
			{
				return new ShimmerGrid({
					shouldRenderHeaders: true,
				});
			}

			return new StickerGrid({
				isLoaded: this.state.isStickersLoaded,
				packs: this.state.packs,
				recentStickers: this.state.recentStickers,
				shouldRenderHeaders: true,
				shouldRenderTopStroke: true,
				shouldRenderCreationStickerElement: false,
				hasNextPage: this.state.hasNextPage,
				onLoadNextPage: this.loadNextPageHandler,
				canEditPack: this.props.canEditPack,
				ref: (ref) => {
					this.grid = ref;
				},
			});
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
				hasNextPage: true,
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

		/**
		 * @param {StickerPackState} pack
		 */
		loadNextPageHandler = ({ id, type }) => {
			if (this.isPageLoading || !this.state.hasNextPage)
			{
				return;
			}

			this.isPageLoading = true;

			this.service.loadNextPage({ id, type })
				.then((result) => {
					this.state.hasNextPage = result.hasNextPage;

					return Promise.all([
						this.navigation.setPage(result),
						this.grid.setPage(result),
					]);
				})
				.then(() => {
					this.isPageLoading = false;
				})
				.catch((error) => {
					logger.error('loadNextPage error', error);
					StickerNotifier.showUnknownError();
				});
		};

		sendActionHandler = (stickerId, packId, packType) => {
			this.service.sendSticker({
				stickerId,
				packId,
				packType,
			})
				.catch((error) => {
					logger.error('sendActionHandler error', error);
				});

			this.props.close();
		};

		deleteRecentStickerActionHandler = (stickerId, packId, packType) => {
			this.service.deleteRecentSticker(stickerId, packId, packType)
				.then(() => {
					this.grid.deleteRecentSticker(stickerId, packId, packType);
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
					this.grid.deleteRecentStickers();
				})
				.catch((error) => {
					Notification.showErrorToast();
					logger.error('clearHistoryActionHandler error', error);
				})
			;
		};

		createPackActionHandler = () => {
			AnalyticsService.getInstance().sendCreateStickerPack();
			this.dialogs.createPack((packParams) => {
				if (Type.isNil(packParams))
				{
					return;
				}

				this.props.onCreate(packParams);
			});
		};

		editPackActionHandler = (packId, packType) => {
			this.props.onEdit(packId, packType);
		};

		deletePackActionHandler = async (packId, packType) => {
			this.dialogs.deletePack(() => {
				this.service.deletePack(packId, packType)
					.then(() => {
						this.grid.deletePack(packId, packType);
						this.navigation.deletePack(packId, packType);
					})
					.catch((error) => {
						Notification.showErrorToast();
						logger.error('deletePackActionHandler error', error);
					})
				;
			});
		};

		unlinkPackActionHandler = async (packId, packType) => {
			this.dialogs.unlinkPack(() => {
				this.service.unlinkPack(packId, packType)
					.then(() => {
						this.grid.deletePack(packId, packType);
						this.navigation.deletePack(packId, packType);
					})
					.catch((error) => {
						Notification.showErrorToast();
						logger.error('deletePackActionHandler error', error);
					})
				;
			});
		};

		reloadHandler = () => {
			const result = this.service.getCurrentStickers();

			this.setState({
				...result,
			});
		};
	}

	module.exports = { StickerSelector };
});
