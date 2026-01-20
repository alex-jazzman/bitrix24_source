/**
 * @module im/messenger/controller/dialog/lib/sticker/src/ui/grid/grid
 */
jn.define('im/messenger/controller/dialog/lib/sticker/src/ui/grid/grid', (require, exports, module) => {
	const { Type } = require('type');
	const { Color } = require('tokens');
	const { isEqual } = require('utils/object');
	const { Loc } = require('im/messenger/loc');
	const { StickerPackHeader } = require('im/messenger/controller/dialog/lib/sticker/src/ui/grid/rows/pack-header');
	const { StickersRow } = require('im/messenger/controller/dialog/lib/sticker/src/ui/grid/rows/stickers');
	const { StickerPackShimmerHeader } = require('im/messenger/controller/dialog/lib/sticker/src/ui/grid/rows/shimmer-header');
	const { StickersShimmerRow } = require('im/messenger/controller/dialog/lib/sticker/src/ui/grid/rows/shimmer-stickers');
	const { GridUtils } = require('im/messenger/controller/dialog/lib/sticker/src/utils/grid');
	const { emitter } = require('im/messenger/controller/dialog/lib/sticker/src/utils/emitter');
	const {
		StickerEventType,
		RowType,
	} = require('im/messenger/controller/dialog/lib/sticker/src/const');

	const ROW_SIZE = GridUtils.calculateRowSize(device.screen.width);

	const SectionType = {
		recent: 'recent',
		pack: 'pack',
	};

	const RecentSection = {
		sectionType: SectionType.recent,
		sectionData: {},
	};

	/**
	 * @class StickerGrid
	 * @typedef {LayoutComponent<StickerGridProps, StickerGridState>} StickerGrid
	 */
	class StickerGrid extends LayoutComponent
	{
		constructor(props) {
			super(props);
			this.state = {
				isLoaded: this.props.isLoaded ?? false,
				isLoadMore: false,
				packs: this.props.packs,
				recentStickers: this.props.recentStickers,
			};
			this.sectionMap = new Map();
			this.sendActiveSectionMethods = {
				[SectionType.recent]: this.sendRecentActive,
				[SectionType.pack]: this.sendPackActive,
			};

			this.scrollOffset = Animated.newCalculatedValue2D(0, 0);
			this.opacity = this.scrollOffset.getValue2().interpolate({
				inputRange: [0, 10, 50, 100],
				outputRange: [0, 0.2, 0.5, 1],
			});
		}

		componentDidMount()
		{
			emitter.on(StickerEventType.grid.scrollTo, this.scrollToSectionHandler);
			emitter.on(StickerEventType.grid.scrollToBegin, this.scrollToRecentSectionHandler);
		}

		componentWillUnmount()
		{
			emitter.off(StickerEventType.grid.scrollTo, this.scrollToSectionHandler);
			emitter.off(StickerEventType.grid.scrollToBegin, this.scrollToRecentSectionHandler);
		}

		render()
		{
			if (!this.props.isLoaded)
			{
				return this.renderShimmerGrid();
			}

			return this.renderStickers();
		}

		renderShimmerGrid()
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

		renderStickers()
		{
			return View(
				{
					style: {
						flex: 1,
					},
				},
				this.renderStoke(),
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
						isScrollable: true,
						isScrollBarEnabled: false,
						data: [{ items: this.getData() }],
						renderItem: (item, section, row) => {
							if (item.type === RowType.stickerHeader)
							{
								return new StickerPackHeader(item);
							}

							return new StickersRow({
								...item,
							});
						},
						viewabilityConfig: {
							waitForInteraction: 100,
							itemVisiblePercentThreshold: 55,
						},
						onViewableItemsChanged: ([{ items }]) => {
							this.viewableItemsChangedHandler(items);
						},
						onScrollCalculated: {
							contentOffset: this.scrollOffset,
						},
					},
				),
			);
		}

		renderStoke()
		{
			if (!this.props.renderTopStroke)
			{
				return null;
			}

			return View({
				style: {
					height: 1,
					backgroundColor: Color.base7.toHex(),
					opacity: this.opacity,
				},
			});
		}

		getData()
		{
			const data = [];
			this.currentActiveSection ??= RecentSection;

			if (Type.isArrayFilled(this.props.recentStickers))
			{
				if (this.props.renderHeaders)
				{
					data.push({
						type: RowType.stickerHeader,
						key: 'header-recent',
						title: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_STICKER_GRID_RECENT_SECTION_HEADER'),
						configurable: true,
						...RecentSection,
					});
				}

				for (
					let position = 0,
						rowCount = 0;
					position < this.props.recentStickers.length;
					position += ROW_SIZE, rowCount++
				)
				{
					const row = this.props.recentStickers.slice(position, position + ROW_SIZE);
					data.push({
						type: RowType.stickers,
						key: `recentStickers-${rowCount}`,
						stickers: row,
						fakeItemCount: ROW_SIZE - row.length,
						...RecentSection,
					});
				}
			}

			if (Type.isArrayFilled(this.props.packs))
			{
				for (const pack of this.props.packs)
				{
					if (this.props.renderHeaders)
					{
						const key = GridUtils.createHeaderKey(pack.type, pack.id);
						this.sectionMap.set(key, data.length);
						data.push({
							type: RowType.stickerHeader,
							key,
							title: pack.name,
							configurable: false,
							sectionType: SectionType.pack,
							sectionData: {
								packId: pack.id,
								packType: pack.type,
							},
						});
					}

					const keyPrefix = GridUtils.createStickersKeyPrefix(pack.type, pack.id);
					for (
						let position = 0,
							rowCount = 0;
						position < pack.stickers.length;
						position += ROW_SIZE, rowCount++
					)
					{
						const row = pack.stickers.slice(position, position + ROW_SIZE);

						data.push({
							type: RowType.stickers,
							key: GridUtils.createStickersKey(keyPrefix, rowCount),
							stickers: row.map((sticker) => ({
								...sticker,
								packId: pack.id,
								packType: pack.type,
							})),
							fakeItemCount: ROW_SIZE - row.length,
							sectionType: SectionType.pack,
							sectionData: {
								packId: pack.id,
								packType: pack.type,
							},
						});
					}
				}
			}

			this.data = data;

			return data;
		}

		getShimmerData()
		{
			const data = [];
			if (this.props.renderHeaders)
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

		/**
		 * @param {Array<number>} items
		 */
		viewableItemsChangedHandler = (items) => {
			if (items.length === 0)
			{
				return;
			}

			if (items.includes(0)) // recent section must be active even if there are no elements of it in the grid.
			{
				this.currentActiveSection = RecentSection;
				this.sendRecentActive();

				return;
			}

			const highestVisibleContentIndex = Math.min(...items);
			const sectionForHighestContent = this.findSectionForContentIndex(highestVisibleContentIndex);

			if (Type.isNull(sectionForHighestContent)) // no headers from sectionForHighestContent to 0
			{
				return;
			}

			const { sectionType, sectionData } = this.data[sectionForHighestContent];
			const section = {
				sectionType,
				sectionData,
			};

			if (!isEqual(this.currentActiveSection, section))
			{
				this.currentActiveSection = section;

				this.sendActiveSectionMethods[sectionType](sectionData);
			}
		};

		scrollToSectionHandler = (packId, packType) => {
			const key = GridUtils.createHeaderKey(packType, packId);
			const sectionIndex = this.sectionMap.get(key);

			if (Type.isNil(sectionIndex))
			{
				return;
			}
			this.listView.scrollTo(0, sectionIndex, true, 'top');
		};

		scrollToRecentSectionHandler = () => {
			this.listView.scrollToBegin(true);
		};

		sendRecentActive()
		{
			emitter.emit(StickerEventType.navigation.setActiveRecent);
		}

		/**
		 * @param {StickerPackId} packId
		 * @param {string} packType
		 */
		sendPackActive({ packId, packType })
		{
			emitter.emit(StickerEventType.navigation.setActivePack, [packId, packType]);
		}

		/**
		 * @param contentIndex
		 * @return {number|null}
		 */
		findSectionForContentIndex(contentIndex)
		{
			for (let i = contentIndex; i >= 0; i--)
			{
				if (this.isHeaderItem(this.data[i]))
				{
					return i;
				}
			}

			return null;
		}

		isHeaderItem(item)
		{
			return item.type === RowType.stickerHeader;
		}
	}

	module.exports = { StickerGrid };
});
