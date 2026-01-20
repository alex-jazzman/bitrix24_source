/**
 * @module im/messenger/controller/dialog/lib/sticker/src/ui/grid/rows/shimmer-stickers
 */
jn.define('im/messenger/controller/dialog/lib/sticker/src/ui/grid/rows/shimmer-stickers', (require, exports, module) => {
	const { Line } = require('utils/skeleton');

	/**
	 * @class StickersShimmerRow
	 */
	class StickersShimmerRow extends LayoutComponent
	{
		render()
		{
			return View(
				{
					style: {
						paddingLeft: 18,
						paddingRight: 18,
						marginTop: 4,
						flexDirection: 'row',
						justifyContent: 'space-between',
					},
				},
				...this.props.stickers.map(() => {
					return View(
						{
							style: {
								width: 82,
								height: 82,
								padding: 5,
							},
						},
						Line(72, 72, 0, 0, 6),
					);
				}),
			);
		}
	}

	module.exports = { StickersShimmerRow };
});
