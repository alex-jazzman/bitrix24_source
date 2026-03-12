/**
 * @module im/messenger/controller/dialog/lib/sticker/src/ui/grid/shimmer-grid
 */
jn.define('im/messenger/controller/dialog/lib/sticker/src/ui/grid/shimmer-grid', (require, exports, module) => {
	const { GridUtils } = require('im/messenger/controller/dialog/lib/sticker/src/utils/grid');
	const {
		RowType, DEVICE_WIDTH
	} = require('im/messenger/controller/dialog/lib/sticker/src/const');
	const { StickerPackShimmerHeader } = require('im/messenger/controller/dialog/lib/sticker/src/ui/grid/rows/shimmer-header');
	const { StickersShimmerRow } = require('im/messenger/controller/dialog/lib/sticker/src/ui/grid/rows/shimmer-stickers');

	const ROW_SIZE = GridUtils.calculateRowSize(DEVICE_WIDTH);

	/**
	 * @class ShimmerGrid
	 */
	class ShimmerGrid extends LayoutComponent
	{
		render()
		{
			return View(
				{
					style: {
						flex: 1,
					},
				},
				ListView(
					{
						style: {
							flex: 1,
							padding: 0.5,
							height: '100%',
							width: '100%',
						},
						ref: (ref) => {
							this.listView = ref;
						},
						isScrollBarEnabled: false,
						isScrollable: true,
						data: [{ items: this.getShimmerData() }],
						renderItem: (item, section, row) => {
							if (item.type === RowType.shimmerHeader)
							{
								return new StickerPackShimmerHeader(item);
							}

							return new StickersShimmerRow(item);
						},
					},
				),
			);
		}

		getShimmerData()
		{
			const data = [];
			if (this.props.shouldRenderHeaders)
			{
				data.push({
					type: RowType.shimmerHeader,
					key: '0',
				});
			}
			Array.from({ length: 4 }).forEach((item, index) => {
				data.push({
					type: RowType.shimmerStickers,
					key: `key ${index}`,
					stickers: Array.from({ length: ROW_SIZE }).fill(0),
					index,
				});
			});

			return data;
		}
	}

	module.exports = { ShimmerGrid };
});
