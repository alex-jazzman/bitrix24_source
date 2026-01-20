/**
 * @module im/messenger/controller/dialog/lib/sticker/src/ui/navigation/buttons/recent
 */
jn.define('im/messenger/controller/dialog/lib/sticker/src/ui/navigation/buttons/recent', (require, exports, module) => {
	const { IconView, Icon } = require('ui-system/blocks/icon');
	const { StickerEventType } = require('im/messenger/controller/dialog/lib/sticker/src/const');
	const { emitter } = require('im/messenger/controller/dialog/lib/sticker/src/utils/emitter');
	const { ActiveIndicator } = require('im/messenger/controller/dialog/lib/sticker/src/ui/navigation/buttons/active-indicator');

	/**
	 * @class RecentStickersNavigationButton
	 * @typedef {LayoutComponent<
	 * RecentStickersNavigationButtonProps,
	 * RecentStickersNavigationButtonState
	 * >} RecentStickersNavigationButton
	 */
	class RecentStickersNavigationButton extends LayoutComponent
	{
		constructor(props)
		{
			super(props);
			this.state = {
				isActive: props.isActive,
			};

			this.initial = false;
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

		setActivePackHandler = () => {
			if (this.state.isActive)
			{
				this.setState({ isActive: false });
			}
		};

		setActiveRecentHandler = () => {
			if (!this.state.isActive)
			{
				this.setState({ isActive: true });
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
						emitter.emit(StickerEventType.grid.scrollToBegin, []);
					},
				},
				View(
					{
						style: {
							width: 36,
							height: 48,
							paddingTop: 8,
							paddingLeft: 2,
							paddingRight: 2,
							flexDirection: 'column',
							alignItems: 'center',
						},
						clickable: false,
					},
					IconView({
						icon: Icon.CLOCK,
						size: 32,
						style: {
							marginBottom: 5,
						},
					}),
					ActiveIndicator({
						isActive: this.state.isActive,
					}),
				),
			);
		}
	}

	module.exports = { RecentStickersNavigationButton };
});
