/**
 * @module im/messenger/controller/dialog/lib/sticker/src/ui/navigation/buttons/pack
 */
jn.define('im/messenger/controller/dialog/lib/sticker/src/ui/navigation/buttons/pack', (require, exports, module) => {
	const { SafeImage } = require('layout/ui/safe-image');
	const { StickerEventType } = require('im/messenger/controller/dialog/lib/sticker/src/const');
	const { emitter } = require('im/messenger/controller/dialog/lib/sticker/src/utils/emitter');
	const { ActiveIndicator } = require('im/messenger/controller/dialog/lib/sticker/src/ui/navigation/buttons/active-indicator');

	/**
	 * @class StickerPackNavigationButton
	 * @typedef {LayoutComponent<
	 * StickerPackNavigationButtonProps,
	 * StickerPackNavigationButtonState
	 * >} StickerPackNavigationButton
	 */
	class StickerPackNavigationButton extends LayoutComponent
	{
		constructor(props)
		{
			super(props);
			this.state = {
				isActive: false,
			};
		}

		componentDidMount()
		{
			emitter.on(StickerEventType.navigation.setActivePack, this.setActivePackHandler);
			emitter.on(StickerEventType.navigation.setActiveRecent, this.setActiveRecentHandler);
		}

		componentWillUnmount()
		{
			emitter.off(StickerEventType.navigation.setActivePack, this.setActivePackHandler);
			emitter.off(StickerEventType.navigation.setActiveRecent, this.setActiveRecentHandler);
		}

		/**
		 * @param {StickersEvents['navigation:set-active-pack'][0]} packId
		 * @param {StickersEvents['navigation:set-active-pack'][1]} packType
		 */
		setActivePackHandler = (packId, packType) => {
			if (packId !== this.props.packId || packType !== this.props.packType)
			{
				if (this.state.isActive)
				{
					this.setState({ isActive: false });
				}

				return;
			}

			if (!this.state.isActive)
			{
				this.setState({ isActive: true });
			}
		};

		setActiveRecentHandler = () => {
			if (this.state.isActive)
			{
				this.setState({ isActive: false });
			}
		};

		render()
		{
			return View(
				{
					style: {
						flex: 1,
						paddingHorizontal: 8,
					},
					onClick: () => {
						emitter.emit(StickerEventType.grid.scrollTo, [this.props.packId, this.props.packType]);
					},
				},
				View(
					{
						style: {
							width: 36,
							height: 48,
							paddingTop: 10,
							paddingLeft: 4,
							paddingRight: 4,
							flexDirection: 'column',
							alignItems: 'center',
						},
						clickable: false,
					},
					View(
						{
							clickable: false,
							style: {
								marginBottom: 7,
							},
						},
						SafeImage({
							withShimmer: true,
							uri: this.props.uri,
							wrapperStyle: {
								width: 28,
								height: 28,
								borderRadius: 4,
							},
							style: {
								width: 28,
								height: 28,
								borderRadius: 4,
							},
							resizeMode: 'contain',
							clickable: false,
						}),
					),
					ActiveIndicator({
						isActive: this.state.isActive,
					}),

				),
			);
		}
	}

	module.exports = { StickerPackNavigationButton };
});
