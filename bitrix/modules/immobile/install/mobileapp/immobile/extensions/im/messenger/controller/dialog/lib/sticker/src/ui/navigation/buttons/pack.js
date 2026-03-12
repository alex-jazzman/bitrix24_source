/**
 * @module im/messenger/controller/dialog/lib/sticker/src/ui/navigation/buttons/pack
 */
jn.define('im/messenger/controller/dialog/lib/sticker/src/ui/navigation/buttons/pack', (require, exports, module) => {
	const { Type } = require('type');
	const { SafeImage } = require('layout/ui/safe-image');
	const { Line } = require('utils/skeleton');
	const { StickerEventType, NAVIGATION_BUTTON_WIDTH } = require('im/messenger/controller/dialog/lib/sticker/src/const');
	const { emitter } = require('im/messenger/controller/dialog/lib/sticker/src/utils/emitter');
	const { ActiveIndicator } = require('im/messenger/controller/dialog/lib/sticker/src/ui/navigation/buttons/active-indicator');

	const { getLoggerWithContext } = require('im/messenger/lib/logger');

	const logger = getLoggerWithContext('dialog--sticker', 'StickerPackNavigationButton');

	/**
	 * @class StickerPackNavigationButton
	 * @typedef {LayoutComponent<
	 * StickerPackNavigationButtonProps,
	 * StickerPackNavigationButtonState
	 * >} StickerPackNavigationButton
	 */
	class StickerPackNavigationButton extends LayoutComponent
	{
		/**
		 * @param {StickerPackNavigationButtonProps} props
		 */
		constructor(props)
		{
			super(props);
			this.state = {
				isActive: false,
				isVisible: true,
			};
		}

		componentDidMount()
		{
			emitter.on(StickerEventType.navigation.setActivePack, this.setActivePackHandler);
			emitter.on(StickerEventType.navigation.setActiveRecent, this.setActiveRecentHandler);
			emitter.on(StickerEventType.navigation.deletePack, this.deletePackHandler);
		}

		componentWillUnmount()
		{
			emitter.off(StickerEventType.navigation.setActivePack, this.setActivePackHandler);
			emitter.off(StickerEventType.navigation.setActiveRecent, this.setActiveRecentHandler);
			emitter.off(StickerEventType.navigation.deletePack, this.deletePackHandler);
		}

		/**
		 * @param {StickerPackNavigationButtonProps} props
		 */
		componentWillReceiveProps(props)
		{
			if (props.isActive !== this.state.isActive)
			{
				this.state.isActive = props.isActive;
			}
		}

		/**
		 * @param {StickersEvents['navigation:set-active-pack'][0]} packId
		 * @param {StickersEvents['navigation:set-active-pack'][1]} packType
		 */
		setActivePackHandler = (packId, packType) => {
			if (packId === this.props.packId && packType === this.props.packType && !this.state.isActive)
			{
				this.setState({ isActive: true });

				return;
			}

			this.setState({ isActive: false });
		};

		setActiveRecentHandler = () => {
			if (this.state.isActive)
			{
				this.setState({ isActive: false });
			}
		};

		deletePackHandler = (packId, packType) => {
			if (this.props.packId === packId && this.props.packType === packType)
			{
				this.#hide();
			}
		};

		render()
		{
			return View(
				{
					style: {
						display: this.state.isVisible ? 'flex' : 'none',
						paddingHorizontal: 8,
						width: NAVIGATION_BUTTON_WIDTH,
					},
					onClick: () => {
						this.props.onClick(this.props.packId, this.props.packType);
					},
					ref: (ref) => {
						this.ref = ref;
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
						this.#renderContent(),
					),
					ActiveIndicator({
						isActive: this.state.isActive,
					}),
				),
			);
		}

		#renderContent()
		{
			if (Type.isNil(this.props.uri))
			{
				return Line(28, 28, 0, 0, 4);
			}

			return SafeImage({
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
			});
		}

		#hide()
		{
			try
			{
				this.ref.animate({ opacity: 0, width: 0 }, () => {
					this.setState({ isVisible: false });
				});
			}
			catch (error)
			{
				logger.error('hide error', error);
			}
		}
	}

	module.exports = { StickerPackNavigationButton };
});
