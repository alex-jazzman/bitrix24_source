/**
 * @module im/messenger/controller/dialog/lib/sticker/src/ui/grid/rows/shimmer-header
 */
jn.define('im/messenger/controller/dialog/lib/sticker/src/ui/grid/rows/shimmer-header', (require, exports, module) => {
	const { Line } = require('utils/skeleton');
	/**
	 * @class StickerPackShimmerHeader
	 */
	class StickerPackShimmerHeader extends LayoutComponent
	{
		render()
		{
			return View(
				{
					style: {
						width: '100%',
						height: 40,
						paddingLeft: 19,
						flexDirection: 'row',
						paddingTop: 17,
						paddingBottom: 11,
					},
				},
				Line(280, 12, 0, 0, 4),
			);
		}
	}

	module.exports = { StickerPackShimmerHeader };
});
