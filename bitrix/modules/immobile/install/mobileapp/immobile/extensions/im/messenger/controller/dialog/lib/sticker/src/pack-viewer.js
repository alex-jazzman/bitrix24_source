/**
 * @module im/messenger/controller/dialog/lib/sticker/src/pack-viewer
 */
jn.define('im/messenger/controller/dialog/lib/sticker/src/pack-viewer', (require, exports, module) => {
	const { Color, Component } = require('tokens');
	const { Line } = require('utils/skeleton');
	const { Text4 } = require('ui-system/typography/text');

	const { getLoggerWithContext } = require('im/messenger/lib/logger');

	const { StickerService } = require('im/messenger/controller/dialog/lib/sticker/src/service');
	const { StickerEventType } = require('im/messenger/controller/dialog/lib/sticker/src/const');
	const { emitter } = require('im/messenger/controller/dialog/lib/sticker/src/utils/emitter');
	const { StickerGrid } = require('im/messenger/controller/dialog/lib/sticker/src/ui/grid/grid');

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
			this.service = new StickerService(props.dialogLocator);
			this.initState();
		}

		componentDidMount()
		{
			emitter.on(StickerEventType.action.send, this.sendActionHandler);
		}

		componentWillUnmount()
		{
			emitter.off(StickerEventType.action.send, this.sendActionHandler);
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
				this.renderHeader(),
				new StickerGrid({
					isLoaded: this.state.isPackLoaded,
					packs: this.state.pack ? [this.state.pack] : [],
					recentStickers: [],
					renderHeaders: false,
					renderTopStroke: false,
				}),
				// this.renderFooter(), // TODO section for second iteration
			);
		}

		renderHeader()
		{
			return View(
				{
					style: {
						height: 54,
						marginTop: 15,
						flexDirection: 'row',
						justifyContent: 'center',
						paddingHorizontal: Component.paddingLr.toNumber(),
						alignItems: 'center',
					},
				},
				this.state.isPackLoaded
					? this.renderTitle()
					: this.renderShimmer()
				,
			);
		}

		renderTitle()
		{
			return View(
				{
					style: {
						flex: 1,
						flexDirection: 'row',
						justifyContent: 'center',
					},
				},
				View({
					style: {
						width: 28,
					},
				}),
				View(
					{
						style: {
							flexGrow: 2,
							justifyContent: 'center',
							alignItems: 'center',
						},
					},
					Text4({
						text: this.state.pack.name,
						color: Color.base1,
						accent: true,
					}),
				),
				View(
					{
						style: {
							alignSelf: 'flex-end',
							width: 28,
						},
					},
					// TODO for second iteration
					// IconView({
					// 	icon: Icon.MORE,
					// 	size: 28,
					// }),
				),
			);
		}

		renderShimmer()
		{
			return Line(100, 20, 0, 0, 6);
		}

		renderFooter()
		{
			return View(
				{
					style: {
						minHeight: 34,
						borderTopWidth: 1,
						borderTopColor: Color.base7.toHex(),
					},
				},
				// TODO add button in the second iteration
			);
		}

		initState()
		{
			const { packId, packType } = this.props;
			if (this.service.isPackLoaded(packId, packType))
			{
				this.state = {
					pack: this.service.getPack(packId, packType),
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
					logger.error('sendActionHandler', error);
				});

			this.props.close();
		};
	}

	module.exports = { StickerPackViewer };
});
