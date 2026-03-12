/**
 * @module im/messenger/controller/dialog/lib/sticker/src/ui/navigation/bar
 */
jn.define('im/messenger/controller/dialog/lib/sticker/src/ui/navigation/bar', (require, exports, module) => {
	const { Type } = require('type');
	const { createPromiseWithResolvers } = require('im/messenger/lib/utils');
	const { NavigationButtonType, StickerEventType, DEVICE_WIDTH, NAVIGATION_BUTTON_WIDTH } = require('im/messenger/controller/dialog/lib/sticker/src/const');
	const { emitter } = require('im/messenger/controller/dialog/lib/sticker/src/utils/emitter');
	const { StickerPackNavigationButton } = require('im/messenger/controller/dialog/lib/sticker/src/ui/navigation/buttons/pack');
	const { RecentStickersNavigationButton } = require('im/messenger/controller/dialog/lib/sticker/src/ui/navigation/buttons/recent');
	const { StickerPackCreateNavigationButton } = require('im/messenger/controller/dialog/lib/sticker/src/ui/navigation/buttons/create');
	const { ShimmerNavigationButton } = require('im/messenger/controller/dialog/lib/sticker/src/ui/navigation/buttons/shimmer');
	const { StickerNavigationUtils } = require('im/messenger/controller/dialog/lib/sticker/src/utils/navigation');

	/**
	 * @class StickerNavigationBar
	 * @typedef {LayoutComponent<StickerNavigationBarProps, StickerNavigationBarState>} StickerNavigationBar
	 */
	class StickerNavigationBar extends LayoutComponent
	{
		/**
		 * @param {StickerNavigationBarProps} props
		 */
		constructor(props)
		{
			super(props);
			this.state = {
				packs: props.packs,
				hasNextPage: props.hasNextPage,
			};

			this.deviceWidth = DEVICE_WIDTH;
			this.activeItem = this.props.canCreatePack ? 1 : 0;

			this.itemsOnScreen = Math.floor(DEVICE_WIDTH / NAVIGATION_BUTTON_WIDTH);
			this.currentOffSet = 0;
		}

		deletePack(packId, packType)
		{
			emitter.emit(StickerEventType.navigation.deletePack, [packId, packType]);
		}

		/**
		 * @param {{packs: Array<PackWithStickers>, hasNextPage: boolean}} pageData
		 */
		async setPage(pageData)
		{
			const { promise, resolve } = createPromiseWithResolvers();

			this.setState(
				{
					packs: [...this.state.packs, ...pageData.packs],
					hasNextPage: pageData.hasNextPage,
				},
				resolve,
			);

			return promise;
		}

		/**
		 * @param {StickerNavigationBarProps} props
		 */
		componentWillReceiveProps(props)
		{
			super.componentWillReceiveProps(props);

			if (Type.isArray(props.packs))
			{
				this.state.packs = props.packs;
			}
		}

		componentDidMount()
		{
			super.componentDidMount();

			emitter.on(StickerEventType.navigation.setActivePack, this.#setActivePackHandler);
			emitter.on(StickerEventType.navigation.setActiveRecent, this.#setActiveRecentHandler);
			this.props.ref(this);
		}

		componentWillUnmount()
		{
			emitter.off(StickerEventType.navigation.setActivePack, this.#setActivePackHandler);
			emitter.off(StickerEventType.navigation.setActiveRecent, this.#setActiveRecentHandler);
		}

		render()
		{
			return View(
				{
					style: {
						height: 48,
						marginTop: 15,
					},
				},
				ScrollView(
					{
						style: {
							flex: 1,
						},
						horizontal: true,
						scrollEventThrottle: 100,
						showsHorizontalScrollIndicator: false,
						ref: (ref) => {
							this.scrollView = ref;
						},
						onScroll: ({ contentOffset, contentSize }) => {
							if (!this.state.hasNextPage)
							{
								return;
							}

							if (!this.#shouldLoadNextPage(contentOffset, contentSize))
							{
								return;
							}

							this.props.onLoadNextPage(this.state.packs[this.state.packs.length - 1].pack);
						},
					},
					View(
						{
							style: {
								flexDirection: 'row',
								paddingLeft: 8,
							},
						},
						...this.#renderElements(),
					),
				),
			);
		}

		#renderElements()
		{
			return this.#getStickerData(this.state.packs).map((item, index) => {
				switch (item.type)
				{
					case NavigationButtonType.create:
						return StickerPackCreateNavigationButton({});
					case NavigationButtonType.recent:
						return new RecentStickersNavigationButton({
							...item,
							isActive: this.activeItem === index,
							onClick: this.clickRecentHandler,
						});
					case NavigationButtonType.shimmer:
						return new ShimmerNavigationButton({});
					default:
						return new StickerPackNavigationButton({
							...item,
							isActive: this.activeItem === index,
							onClick: this.clickPackHandler,
						});
				}
			});
		}

		#getStickerData(packs)
		{
			const data = [];
			if (this.props.canCreatePack)
			{
				data.push({
					type: NavigationButtonType.create,
					key: NavigationButtonType.create,
				});
			}

			data.push({
				type: NavigationButtonType.recent,
				key: NavigationButtonType.recent,
				isActive: true,
			});

			if (Type.isArrayFilled(packs))
			{
				for (const { pack, stickers } of packs)
				{
					const key = `pack-${pack.type}:${pack.id}`;
					const packData = {
						type: NavigationButtonType.pack,
						id: key,
						key,
						packId: pack.id,
						packType: pack.type,
						uri: stickers[0]?.uri,
						isActive: false,
					};

					data.push(packData);
				}
			}

			if (this.state.hasNextPage)
			{
				data.push(
					{ type: NavigationButtonType.shimmer },
				);
			}
			this.data = data;

			return data;
		}

		/**
		 * @param {{x: number, y: number}} contentOffset
		 * @param {{width: number, height: number}} contentSize
		 */
		#shouldLoadNextPage(contentOffset, contentSize)
		{
			return this.#getRightContentOffset(contentOffset) > contentSize.width * 0.8;
		}

		/**
		 * @param {{x: number, y: number}} contentOffset
		 */
		#getRightContentOffset(contentOffset)
		{
			return this.deviceWidth + contentOffset.x;
		}

		#setActivePackHandler = (packId, packType) => {
			const index = this.#getPackIndex(packId, packType);

			if (index === -1)
			{
				return;
			}

			// eslint-disable-next-line no-unused-expressions
			this.activeItem <= index
				? this.scrollToOlderPack(index)
				: this.scrollToNewerPack(index)
			;
			this.activeItem = index;
		};

		/**
		 * @param {StickerPackId} packId
		 * @param {StickerPackType} packType
		 */
		clickPackHandler = (packId, packType) => {
			const index = this.#getPackIndex(packId, packType);

			if (index === -1 || index === this.activeItem)
			{
				return;
			}

			const eventName = Math.abs(index - this.activeItem) < 3
				? StickerEventType.grid.scrollToSmoothly
				: StickerEventType.grid.scrollTo
			;

			emitter.emit(eventName, [packId, packType]);
		};

		clickRecentHandler = () => {
			if (this.activeItem === this.#getRecentIndex())
			{
				return;
			}

			const eventName = Math.abs(this.activeItem - 1) < 3
				? StickerEventType.grid.scrollToBeginSmoothly
				: StickerEventType.grid.scrollToBegin
			;

			emitter.emit(eventName, []);
		};

		/**
		 * @desc method to
		 * @param {number} index
		 */
		scrollToOlderPack(index)
		{
			const indexToScroll = Math.max(index - this.itemsOnScreen + 2, 0);

			const offset = NAVIGATION_BUTTON_WIDTH * indexToScroll;
			if (offset <= this.currentOffSet)
			{
				return;
			}

			this.scrollView.scrollTo({ x: offset, animated: true });
			this.currentOffSet = offset;
		}

		scrollToNewerPack(index)
		{
			const offset = Math.max(index - 2, 0) * NAVIGATION_BUTTON_WIDTH;
			if (offset > this.currentOffSet)
			{
				return;
			}

			this.scrollView.scrollTo({ x: offset, animated: true });
			this.currentOffSet = offset;
		}

		#setActiveRecentHandler = () => {
			this.activeItem = this.#getRecentIndex();
			this.currentOffSet = 0;
			this.scrollView.scrollToBegin(true);
		};

		/**
		 * @param {StickerPackId} packId
		 * @param {StickerPackType} packType
		 * @return {number}
		 */
		#getPackIndex(packId, packType)
		{
			return this.data.findIndex((row) => (
				row?.packId === packId && row?.packType === packType
			));
		}

		#getRecentIndex()
		{
			return this.data.findIndex((row) => row.key === NavigationButtonType.recent);
		}
	}

	module.exports = { StickerNavigationBar };
});
