/**
 * @module im/messenger/controller/dialog/lib/sticker/src/ui/grid/grid
 */
jn.define('im/messenger/controller/dialog/lib/sticker/src/ui/grid/grid', (require, exports, module) => {
	const { Type } = require('type');
	const { Color } = require('tokens');
	const { isEqual } = require('utils/object');
	const { Loc } = require('im/messenger/loc');
	const { AsyncQueue, createPromiseWithResolvers } = require('im/messenger/lib/utils');
	const { StickerPackHeader } = require('im/messenger/controller/dialog/lib/sticker/src/ui/grid/rows/pack-header');
	const { StickersRow } = require('im/messenger/controller/dialog/lib/sticker/src/ui/grid/rows/stickers');
	const { StickerPackShimmerHeader } = require('im/messenger/controller/dialog/lib/sticker/src/ui/grid/rows/shimmer-header');
	const { StickersShimmerRow } = require('im/messenger/controller/dialog/lib/sticker/src/ui/grid/rows/shimmer-stickers');
	const { GridUtils } = require('im/messenger/controller/dialog/lib/sticker/src/utils/grid');
	const { emitter } = require('im/messenger/controller/dialog/lib/sticker/src/utils/emitter');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');

	const logger = getLoggerWithContext('dialog--sticker', 'StickerGrid');

	const {
		StickerEventType,
		RowType,
		DEVICE_WIDTH,
	} = require('im/messenger/controller/dialog/lib/sticker/src/const');

	const ROW_SIZE = GridUtils.calculateRowSize(DEVICE_WIDTH);

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
		/** @type {Partial<StickerGridProps>} */
		static defaultProps = {
			ref: () => {},
		};

		/**
		 * @param {StickerGridProps} props
		 */
		constructor(props)
		{
			super(props);
			this.state = {
				isLoaded: this.props.isLoaded ?? false,
				packs: this.props.packs,
				recentStickers: this.props.recentStickers,
				rows: [],
				hasNextPage: this.props.hasNextPage,
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

			this.listOpetationsQueue = new AsyncQueue();
			/** @type {ListViewMethods} */
			this.listView = null;
		}

		componentDidMount()
		{
			emitter.on(StickerEventType.grid.scrollTo, this.scrollToSectionHandler);
			emitter.on(StickerEventType.grid.scrollToSmoothly, this.scrollToSectionSmoothlyHandler);
			emitter.on(StickerEventType.grid.scrollToBegin, this.scrollToRecentSectionHandler);
			emitter.on(StickerEventType.grid.scrollToBeginSmoothly, this.scrollToRecentSectionSmoothlyHandler);

			this.props.ref(this);
		}

		componentWillUnmount()
		{
			emitter.off(StickerEventType.grid.scrollTo, this.scrollToSectionHandler);
			emitter.off(StickerEventType.grid.scrollToSmoothly, this.scrollToSectionSmoothlyHandler);
			emitter.off(StickerEventType.grid.scrollToBegin, this.scrollToRecentSectionHandler);
			emitter.off(StickerEventType.grid.scrollToBeginSmoothly, this.scrollToRecentSectionSmoothlyHandler);
		}

		/**
		 * @param {StickerGridProps} props
		 */
		componentWillReceiveProps(props)
		{
			super.componentWillReceiveProps(props);

			if (Type.isArray(props.packs))
			{
				this.state.packs = props.packs;
			}

			if (Type.isBoolean(props.hasNextPage))
			{
				this.state.hasNextPage = props.hasNextPage;
			}
		}

		render()
		{
			return this.renderStickers();
		}

		renderStickers()
		{
			this.state.rows = this.getData();

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
						data: [{ items: this.state.rows }],
						renderItem: (item, section, row) => {
							if (item.type === RowType.stickerHeader)
							{
								return new StickerPackHeader(item);
							}

							if (item.type === RowType.shimmerHeader)
							{
								return new StickerPackShimmerHeader({});
							}

							if (item.type === RowType.shimmerStickers)
							{
								return new StickersShimmerRow(item);
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
			if (!this.props.shouldRenderTopStroke)
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
			this.currentActiveSection ??= RecentSection;

			const data = [
				...this.getRecentStickersData(),
				...this.getPacksData(this.state.packs),
				...this.getLoadingPackData(),
			];

			this.calculateMapHeaders(data);

			logger.log('getData: data', data);

			return data;
		}

		getRecentStickersData()
		{
			if (!Type.isArrayFilled(this.state.recentStickers))
			{
				return [];
			}

			const data = [];
			if (this.props.shouldRenderHeaders)
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
				position < this.state.recentStickers.length;
				position += ROW_SIZE, rowCount++
			)
			{
				const row = this.state.recentStickers.slice(position, position + ROW_SIZE);
				data.push({
					type: RowType.stickers,
					key: `recentStickers-${rowCount}`,
					stickers: row,
					fakeItemCount: ROW_SIZE - row.length,
					isFirstPackRow: rowCount === 0,
					...RecentSection,
				});
			}

			return data;
		}

		/**
		 * @param {Array<PackWithStickers>} packs
		 * @return {*[]}
		 */
		getPacksData(packs)
		{
			if (!Type.isArrayFilled(packs))
			{
				return [];
			}

			const result = [];
			for (const { pack, stickers } of packs)
			{
				if (this.props.shouldRenderHeaders)
				{
					const key = GridUtils.createHeaderKey(pack.type, pack.id);
					result.push({
						type: RowType.stickerHeader,
						key,
						title: pack.name,
						configurable: pack.type === 'custom',
						canEditPack: this.props.canEditPack,
						sectionType: SectionType.pack,
						sectionData: {
							packId: pack.id,
							packType: pack.type,
							authorId: pack.authorId,
						},
					});
				}

				const keyPrefix = GridUtils.createStickersKeyPrefix(pack.type, pack.id);
				const packStickers = [...stickers];

				for (
					let position = 0,
						rowCount = 0;
					position < packStickers.length;
					position += ROW_SIZE, rowCount++
				)
				{
					const row = packStickers.slice(position, position + ROW_SIZE);

					result.push({
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
							authorId: pack.authorId,
						},
						isFirstPackRow: rowCount === 0,
					});
				}
			}

			return result;
		}

		getLoadingPackData()
		{
			if (!this.state.hasNextPage)
			{
				return [];
			}

			const data = [];
			if (this.props.shouldRenderHeaders)
			{
				data.push({
					type: RowType.shimmerHeader,
					key: 'loading-header',
				});
			}
			Array.from({ length: 2 }).forEach((item, index) => {
				data.push({
					type: RowType.shimmerStickers,
					key: `loading-row-${index}`,
					stickers: Array.from({ length: ROW_SIZE }).fill(0),
					index,
				});
			});

			return data;
		}

		/**
		 * @param {Array<object>} data
		 */
		calculateMapHeaders(data)
		{
			this.sectionMap.clear();

			data.forEach((row, index) => {
				if (row.type !== RowType.stickerHeader)
				{
					return;
				}

				if (row.sectionType === SectionType.recent)
				{
					return;
				}

				this.sectionMap.set(row.key, index);
			});
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

			const { sectionType, sectionData } = this.state.rows[sectionForHighestContent];
			const section = {
				sectionType,
				sectionData,
			};

			if (!isEqual(this.currentActiveSection, section))
			{
				this.currentActiveSection = section;

				this.sendActiveSectionMethods[sectionType](sectionData);
			}

			if (this.#shouldLoadNextPage(items))
			{
				const lastPack = this.state.packs[this.state.packs.length - 1].pack;
				this.props.onLoadNextPage(lastPack);
			}
		};

		scrollToSectionSmoothlyHandler = (packId, packType) => {
			const sectionIndex = this.#getSectionIndex(packId, packType);
			if (Type.isNil(sectionIndex))
			{
				return;
			}

			this.listView.scrollTo(0, sectionIndex, true, 'top');
		};

		scrollToSectionHandler = (packId, packType) => {
			const sectionIndex = this.#getSectionIndex(packId, packType);
			if (Type.isNil(sectionIndex))
			{
				return;
			}

			this.listView.scrollTo(0, sectionIndex, false, 'top');
		};

		scrollToRecentSectionHandler = () => {
			this.listView.scrollToBegin(false);
		};

		scrollToRecentSectionSmoothlyHandler = () => {
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
				if (this.isHeaderItem(this.state.rows[i]))
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

		deleteRecentStickers()
		{
			this.listOpetationsQueue.enqueue(() => {
				this.state.recentStickers = [];
				const recentRowKeys = this.state.rows
					.filter((row) => row.sectionType === SectionType.recent)
					.map((recentRow) => recentRow.key)
				;

				return this.#deleteRowsByKeys(recentRowKeys);
			});
		}

		deleteRecentSticker(stickerId, packId, packType)
		{
			this.listOpetationsQueue.enqueue(async () => {
				this.state.recentStickers = this.state.recentStickers
					.filter((recentSticker) => {
						return recentSticker.id !== stickerId
							|| recentSticker.packId !== packId
							|| recentSticker.packType !== packType;
					})
				;

				await this.#updateRecentSection();
			});
		}

		deletePack(packId, packType)
		{
			this.listOpetationsQueue.enqueue(async () => {
				const packRowKeys = this.state.rows
					.filter((row) => row?.sectionData?.packId === packId && row?.sectionData?.packType === packType)
					.map((packRow) => packRow.key)
				;

				await this.#deleteRowsByKeys(packRowKeys);
				this.calculateMapHeaders(this.state.rows);

				this.#cleanRecentStickersFromPack(packId, packType);
			},);
		}

		/**
		 * @param {{packs: Array<PackWithStickers>, hasNextPage: boolean}} pageData
		 */
		async setPage(pageData)
		{
			this.state.hasNextPage = pageData.hasNextPage;
			this.state.packs = [...this.state.packs, ...pageData.packs];
			const insertingRows = this.getPacksData(pageData.packs);

			await this.listView.insertRows(insertingRows, 0, this.state.rows.length - 3, 'none');
			this.state.rows.splice(-3, 0, ...insertingRows);
			this.calculateMapHeaders(this.state.rows);

			const { promise, resolve } = createPromiseWithResolvers();
			if (this.state.hasNextPage)
			{
				resolve();
			}
			else
			{
				const deletingIndex = this.state.rows.slice(-3).map((row) => row.key);
				this.listView.deleteRowsByKeys(deletingIndex, 'none', () => {
					this.state.rows.splice(-3, 3);
					resolve();
				});
			}

			return promise;
		}

		#cleanRecentStickersFromPack(packId, packType)
		{
			this.listOpetationsQueue.enqueue(async () => {
				this.state.recentStickers = this.state.recentStickers
					.filter((recentSticker) => {
						return recentSticker.packId !== packId || recentSticker.packType !== packType;
					})
				;

				await this.#updateRecentSection();
			});
		}

		/**
		 * @param {Array<string>} keyList
		 * @return {Promise<void>}
		 */
		async #deleteRowsByKeys(keyList)
		{
			if (!Type.isArrayFilled(keyList))
			{
				return;
			}

			const { promise, resolve } = createPromiseWithResolvers();
			const rowKeysToDelete = new Set(keyList);

			this.listView.deleteRowsByKeys([...rowKeysToDelete.values()], 'none', () => {
				this.state.rows = this.state.rows.filter((row) => !rowKeysToDelete.has(row.key));
				resolve();
			});

			// eslint-disable-next-line consistent-return
			return promise;
		}

		async #updateRecentSection()
		{
			const recentRowKeys = this.state.rows
				.filter((row) => row.sectionType === SectionType.recent)
				.map((recentRow) => recentRow.key)
			;

			if (!Type.isArrayFilled(recentRowKeys))
			{
				return;
			}

			const newRecentRows = this.getRecentStickersData();

			if (!Type.isArrayFilled(newRecentRows))
			{
				this.deleteRecentStickers();

				return;
			}

			const rowKeysToDelete = new Set(recentRowKeys);

			const rowsToUpdate = [];
			newRecentRows.forEach((row) => {
				rowKeysToDelete.delete(row.key);

				const index = this.state.rows.findIndex((stateRow) => stateRow.key === row.key);
				if (index === -1)
				{
					return;
				}

				if (!isEqual(row, this.state.rows[index]))
				{
					rowsToUpdate.push(row);
				}
			});

			await this.#deleteRowsByKeys([...rowKeysToDelete]);

			if (!Type.isArrayFilled(rowsToUpdate))
			{
				return;
			}
			await this.listView.updateRows(rowsToUpdate, 'automatic');
			newRecentRows.forEach((row) => {
				const index = this.state.rows.findIndex((stateRow) => stateRow.key === row.key);

				if (index === -1)
				{
					return;
				}

				this.state.rows[index] = row;
			});
		}

		#shouldLoadNextPage(viewableItems)
		{
			if (!this.state.hasNextPage)
			{
				return false;
			}

			const lastVisibleIndex = Math.max(...viewableItems);
			const total = this.state.rows.length;
			if (total === 0)
			{
				return false;
			}

			const visibleRatio = (lastVisibleIndex + 1) / total;

			return visibleRatio >= 0.8;
		}

		/**
		 * @param {StickerPackId} packId
		 * @param {StickerPackType} packType
		 * @return {string | undefined}
		 */
		#getSectionIndex(packId, packType)
		{
			const key = GridUtils.createHeaderKey(packType, packId);

			return this.sectionMap.get(key);
		}
	}

	module.exports = { StickerGrid };
});
