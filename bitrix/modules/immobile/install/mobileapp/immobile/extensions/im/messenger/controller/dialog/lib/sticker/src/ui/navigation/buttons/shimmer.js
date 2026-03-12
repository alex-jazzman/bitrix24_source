/**
 * @module im/messenger/controller/dialog/lib/sticker/src/ui/navigation/buttons/shimmer
 */
jn.define('im/messenger/controller/dialog/lib/sticker/src/ui/navigation/buttons/shimmer',(require, exports, module) => {
	const { Line } = require('utils/skeleton');
	const { NAVIGATION_BUTTON_WIDTH } = require('im/messenger/controller/dialog/lib/sticker/src/const');

	/**
	 * @class ShimmerNavigationButton
	 */
	class ShimmerNavigationButton extends LayoutComponent
	{
		render()
		{
			return View(
				{
					style: {
						paddingHorizontal: 8,
						width: NAVIGATION_BUTTON_WIDTH,
					},
				},
				View(
					{
						style: {
							width: 36,
							height: 48,
							paddingTop: 8,
							paddingLeft: 4,
							paddingRight: 4,
							flexDirection: 'column',
						},
					},
					Line(28, 28, 0, 0, 4),
				),
			);
		}
	}

	module.exports = { ShimmerNavigationButton };
});
