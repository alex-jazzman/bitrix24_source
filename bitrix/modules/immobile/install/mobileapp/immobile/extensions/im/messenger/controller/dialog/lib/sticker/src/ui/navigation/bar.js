/**
 * @module im/messenger/controller/dialog/lib/sticker/src/ui/navigation/bar
 */
jn.define('im/messenger/controller/dialog/lib/sticker/src/ui/navigation/bar', (require, exports, module) => {
	const { Type } = require('type');
	const { NavigationButtonType } = require('im/messenger/controller/dialog/lib/sticker/src/const');
	const { StickerPackNavigationButton } = require('im/messenger/controller/dialog/lib/sticker/src/ui/navigation/buttons/pack');
	const { ShimmerNavigationButton } = require('im/messenger/controller/dialog/lib/sticker/src/ui/navigation/buttons/shimmer');
	const { RecentStickersNavigationButton } = require('im/messenger/controller/dialog/lib/sticker/src/ui/navigation/buttons/recent');

	/**
	 * @class StickerNavigationBar
	 * @typedef {LayoutComponent<StickerNavigationBarProps, StickerNavigationBarState>} StickerNavigationBar
	 */
	class StickerNavigationBar extends LayoutComponent
	{
		render()
		{
			if (!this.props.isLoaded)
			{
				return this.renderShimmerNavigation();
			}

			return this.renderStickersNavigation();
		}

		renderShimmerNavigation()
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
						},
					},
					GridView({
						style: {
							height: 48,
						},
						isScrollable: true,
						params: {
							orientation: 'horizontal',
							rows: 1,
						},
						showsHorizontalScrollIndicator: false,
						data: [{ items: this.getShimmerData() }],
						renderItem: (item) => {
							if (item.type === NavigationButtonType.recent)
							{
								return new RecentStickersNavigationButton({
									isActive: false,
								});
							}

							return new ShimmerNavigationButton({});
						},
					}),
				),
			);
		}

		renderStickersNavigation()
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
						},
					},
					GridView({
						style: {
							height: 48,
						},
						isScrollable: true,
						params: {
							orientation: 'horizontal',
							rows: 1,
						},
						showsHorizontalScrollIndicator: false,
						data: [{ items: this.getStickerData() }],
						renderItem: (item) => {
							if (item.type === NavigationButtonType.recent)
							{
								return new RecentStickersNavigationButton(item);
							}

							return new StickerPackNavigationButton(item);
						},
					}),
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
				...Array.from({ length: 20 }).fill(0).map((item, index) => ({
					type: '1',
					key: `key ${index}`,
					title: `item ${index}`,
				})),
			];
		}

		getStickerData()
		{
			const data = [
				{
					type: NavigationButtonType.recent,
					key: NavigationButtonType.recent,
					isActive: true,
				},
			];

			if (Type.isArrayFilled(this.props.packs))
			{
				for (const pack of this.props.packs)
				{
					const key = `pack-${pack.type}:${pack.id}`;
					const packData = {
						type: NavigationButtonType.pack,
						id: key,
						key,
						packId: pack.id,
						packType: pack.type,
						uri: pack.stickers[0]?.uri,
						isActive: false,
					};

					data.push(packData);
				}
			}

			return data;
		}
	}

	module.exports = { StickerNavigationBar };
});
