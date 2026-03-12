/**
 * @module im/messenger/controller/dialog/lib/sticker/src/ui/navigation/shimmer-bar
 */
jn.define('im/messenger/controller/dialog/lib/sticker/src/ui/navigation/shimmer-bar', (require, exports, module) => {
	const { NavigationButtonType } = require('im/messenger/controller/dialog/lib/sticker/src/const');
	const { ShimmerNavigationButton } = require('im/messenger/controller/dialog/lib/sticker/src/ui/navigation/buttons/shimmer');
	const { RecentStickersNavigationButton } = require('im/messenger/controller/dialog/lib/sticker/src/ui/navigation/buttons/recent');

	/**
	 * @class ShimmerBar
	 */
	class ShimmerBar extends LayoutComponent
	{
		render()
		{
			return View(
				{
					style: {
						marginTop: 15,
						height: 48,
						width: '100%',
						paddingLeft: 8,
					},
				},
				View(
					{
						style: {
							flex: 1,
							flexDirection: 'row',
						},
					},
					...(this.getShimmerData().map((item) => {
						if (item.type === NavigationButtonType.recent)
						{
							return new RecentStickersNavigationButton({
								isActive: false,
							});
						}

						return new ShimmerNavigationButton({});
					})),
				),
			);
		}

		getShimmerData()
		{
			return [
				{
					type: NavigationButtonType.recent,
					key: NavigationButtonType.recent,
					isActive: true,
				},
				...Array.from({ length: 5 }).fill(0).map((item, index) => ({
					type: NavigationButtonType.shimmer,
					key: `key ${index}`,
					title: `item ${index}`,
				})),
			];
		}
	}

	module.exports = { ShimmerBar };
});
