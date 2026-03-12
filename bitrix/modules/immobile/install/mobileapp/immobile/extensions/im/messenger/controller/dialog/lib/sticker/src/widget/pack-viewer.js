/**
 * @module im/messenger/controller/dialog/lib/sticker/src/widget/pack-viewer
 */
jn.define('im/messenger/controller/dialog/lib/sticker/src/widget/pack-viewer', (require, exports, module) => {
	const { Color, Indent, Component } = require('tokens');
	const { Line } = require('utils/skeleton');

	const { Loc } = require('im/messenger/loc');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { AnalyticsService } = require('im/messenger/provider/services/analytics');

	const { StickerWidgetHeader } = require('im/messenger/controller/dialog/lib/sticker/src/ui/header');
	const { StickerService } = require('im/messenger/controller/dialog/lib/sticker/src/service/service');
	const { StickerEventType } = require('im/messenger/controller/dialog/lib/sticker/src/const');
	const { emitter } = require('im/messenger/controller/dialog/lib/sticker/src/utils/emitter');
	const { StickerGrid } = require('im/messenger/controller/dialog/lib/sticker/src/ui/grid/grid');
	const { PackButton } = require('im/messenger/controller/dialog/lib/sticker/src/ui/button');
	const { ShimmerGrid } = require('im/messenger/controller/dialog/lib/sticker/src/ui/grid/shimmer-grid');
	const { StickerNotifier } = require('im/messenger/controller/dialog/lib/sticker/src/notifier');
	const { StickerDialogs } = require('im/messenger/controller/dialog/lib/sticker/src/dialogs');
	const { PackMenu, ActionType: PackActionType } = require('im/messenger/controller/dialog/lib/sticker/src/ui/menu/pack');
	const { StickerMenu, ActionType: StickerActionType } = require('im/messenger/controller/dialog/lib/sticker/src/ui/menu/sticker');

	const logger = getLoggerWithContext('dialog--sticker', 'StickerPackViewer');

	/**
	 * @class StickerPackViewer
	 * @typedef {LayoutComponent<StickerPackViewerProps, StickerPackViewerState>} StickerPackViewer
	 */
	class StickerPackViewer extends LayoutComponent
	{
		constructor(props)
		{
			super(props);
			this.service = new StickerService({
				dialogLocator: props.dialogLocator,
			});
			this.footerRef = null;
			this.headerRef = null;
			this.dialogs = new StickerDialogs();
			this.initState();
		}

		componentDidMount()
		{
			emitter.on(StickerEventType.action.send, this.sendActionHandler);
			emitter.on(StickerEventType.action.unlinkPack, this.unlinkActionHandler);
			emitter.on(StickerEventType.action.deletePack, this.deletePackActionHandler);
			emitter.on(StickerEventType.action.edit, this.editPackActionHandler);
			emitter.on(StickerEventType.widget.reload, this.reloadHandler);
			emitter.on(StickerEventType.sticker.click, this.stickerClickHandler);
		}

		componentWillUnmount()
		{
			emitter.off(StickerEventType.action.send, this.sendActionHandler);
			emitter.off(StickerEventType.action.unlinkPack, this.unlinkActionHandler);
			emitter.off(StickerEventType.action.deletePack, this.deletePackActionHandler);
			emitter.off(StickerEventType.action.edit, this.editPackActionHandler);
			emitter.off(StickerEventType.widget.reload, this.reloadHandler);
			emitter.off(StickerEventType.sticker.click, this.stickerClickHandler);
		}

		render()
		{
			if (!this.state.isPackLoaded)
			{
				return this.renderShimmer();
			}

			return View(
				{
					style: {
						flex: 1,
						backgroundColor: Color.bgSecondary.toHex(),
					},
				},
				this.renderHeader(),
				new StickerGrid({
					isLoaded: this.state.isPackLoaded,
					packs: this.state.pack ? [this.state.pack] : [],
					recentStickers: [],
					shouldRenderHeaders: false,
					shouldRenderTopStroke: false,
					shouldRenderCreationStickerElement: false,
					hasNextPage: false,
				}),
				this.renderFooter(),
			);
		}

		renderHeader()
		{
			if (!this.state.isPackLoaded)
			{
				return this.renderShimmer();
			}

			return new StickerWidgetHeader({
				title: this.state.pack.pack.name,
				configurable: this.#isPackConfigurable(),
				onClick: (buttonRef) => {
					this.#showPackMenu(buttonRef);
				},
				ref: (ref) => {
					this.headerRef = ref;
				},
			});
		}

		renderShimmer()
		{
			return View(
				{},
				this.renderShimmerHeader(),
				new ShimmerGrid({}),
			);
		}

		renderShimmerHeader()
		{
			return View(
				{
					style: {
						height: 44,
						marginTop: 15,
						justifyContent: 'center',
						alignItems: 'center',
					},
				},
				Line(100, 20, 0, 0, 6),
			);
		}

		renderFooter()
		{
			if (!this.state.isPackLoaded)
			{
				return null;
			}

			if (this.state.pack.pack.type === 'vendor')
			{
				return null;
			}

			const isPackAdded = this.state.pack.pack.isAdded;

			return View(
				{
					style: {
						height: isPackAdded ? 0 : 100,
						opacity: isPackAdded ? 0 : 1,
						borderTopWidth: 1,
						borderTopColor: Color.base7.toHex(),
						paddingTop: Indent.XL.toNumber(),
						paddingHorizontal: Component.paddingLrMore.toNumber(),
						flexDirection: 'column',
						justifyContent: 'flex-start',
					},
					ref: (ref) => {
						this.footerRef = ref;
					},
				},
				new PackButton({
					text: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_STICKER_PACK_LINK_BUTTON'),
					enabled: true,
					onClick: this.linkHandler,
					ref: (ref) => {
						this.buttonRef = ref;
					},
				}),
			);
		}

		initState()
		{
			const { packId, packType } = this.props;
			if (this.service.isPackLoaded(packId, packType))
			{
				this.state = {
					pack: {
						pack: this.service.getPack(packId, packType),
						stickers: this.service.getPackStickers(packId, packType),
					},
					isPackLoaded: true,
				};

				return;
			}

			this.state = {
				pack: null,
				isPackLoaded: false,
			};

			this.service.loadStickerPack(packId, packType)
				.then((result) => {
					this.setState({
						isPackLoaded: true,
						pack: result,
					});
				})
				.catch((error) => {
					logger.error('loadStickerPack', error);

					StickerNotifier.showUnknownError();
				})
			;
		}

		stickerClickHandler = (stickerId, packId, packType, ref) => {
			const menu = new StickerMenu({
				ui: ref,
				actions: [StickerActionType.send],
				stickerData: {
					id: stickerId,
					packId,
					packType,
				},
			});

			menu.show();
		};

		sendActionHandler = (stickerId, packId, packType) => {
			this.service.sendSticker({
				stickerId,
				packId,
				packType,
			})
				.catch((error) => {
					logger.error('sendActionHandler', error);
				});

			this.props.close();
		};

		linkHandler = () => {
			this.linkPack()
				.then(() => {
					this.props.close();
					StickerNotifier.showPackLinkedSuccess();
					AnalyticsService.getInstance().sendAddStickerPack();
				})
				.catch((error) => {
					logger.error('link pack error', error);
					StickerNotifier.showUnknownError();
					this.buttonRef.setLoading(false);
				})
			;
		};

		unlinkActionHandler = (packId, packType) => {
			this.dialogs.unlinkPack(() => {
				this.service.unlinkPack(packId, packType)
					.then(() => {
						this.props.close();
						StickerNotifier.showPackUnlinkedSuccess();
					})
					.catch((error) => {
						logger.error('unlinkActionHandler error', error);
						StickerNotifier.showUnknownError();
					})
				;
			});
		};

		deletePackActionHandler = (packId, packType) => {
			this.dialogs.deletePack(() => {
				this.service.deletePack(packId, packType)
					.then(() => {
						this.props.close();
					})
					.catch((error) => {
						logger.error('deletePackActionHandler error', error);
						StickerNotifier.showUnknownError();
					});
			});
		};

		editPackActionHandler = (packId, packType) => {
			this.props.onEdit(packId, packType);
		};

		reloadHandler = () => {
			const { pack } = this.state.pack;
			this.setState({
				pack: {
					pack: this.service.getPack(pack.id, pack.type),
					stickers: this.service.getPackStickers(pack.id, pack.type),
				},
				isPackLoaded: true,
			});
		};

		async linkPack()
		{
			const { pack } = this.state.pack;

			await this.service.linkPack(pack.id, pack.type);

			pack.isAdded = true;
		}

		#isPackConfigurable()
		{
			if (!this.state.isPackLoaded)
			{
				return false;
			}

			return this.state.pack.pack.type === 'custom' && this.state.pack.pack.isAdded;
		}

		#showPackMenu(buttonRef)
		{
			const menu = new PackMenu({
				ui: buttonRef,
				actions: this.#getMenuActions(),
				packData: this.state.pack.pack,
			});

			menu.show();
		}

		#getMenuActions()
		{
			if (this.state.pack.pack.authorId === serviceLocator.get('core').getUserId())
			{
				const actionList = [];
				if (this.props.canEditPack)
				{
					actionList.push(PackActionType.edit);
				}

				return [
					...actionList,
					PackActionType.delete,
				];
			}

			return [
				PackActionType.unlink,
			];
		}

		hideFooter()
		{
			this.buttonRef.setLoading(false);
			this.footerRef.animate({ height: 0, opacity: 0, option: 'linear' });
		}

		showFooter()
		{
			this.footerRef.animate({ height: 100, opacity: 1, option: 'linear' });
		}
	}

	module.exports = { StickerPackViewer };
});
