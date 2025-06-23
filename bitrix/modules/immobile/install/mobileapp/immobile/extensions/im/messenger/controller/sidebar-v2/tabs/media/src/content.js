/**
 * @module im/messenger/controller/sidebar-v2/tabs/media/src/content
 */
jn.define('im/messenger/controller/sidebar-v2/tabs/media/src/content', (require, exports, module) => {
	const { SidebarBaseTabContent } = require('im/messenger/controller/sidebar-v2/tabs/base/src/content');
	const { SidebarTabMediaItemModel } = require('im/messenger/controller/sidebar-v2/tabs/media/src/items/media-item');
	const { Loc } = require('im/messenger/controller/sidebar-v2/loc');
	const { FileType } = require('im/messenger/const');
	const { Color } = require('tokens');
	const { Moment } = require('utils/date/moment');
	const { monthYear } = require('utils/date/formats');
	const {
		openNativeViewer,
	} = require('utils/file');
	const { assertDefined } = require('utils/validation');
	const { uniqBy } = require('utils/array');

	const isMediaGridAvailable = Boolean(MediaGrid);

	/**
	 * @class SidebarMediaTabContent
	 */
	class SidebarMediaTabContent extends SidebarBaseTabContent
	{
		constructor(props)
		{
			super(props);

			/** @type {SidebarDataProvider} */
			this.dataProvider = props.dataProvider;
			assertDefined(this.dataProvider, 'dataProvider property is required');

			const { items, hasNextPage } = this.getItemsFromStore();

			this.state = {
				items,
				hasNextPage,
				pending: items === null,
			};

			this.bindMethods();
			this.subscribeStoreEvents();

			this.chatId = this.props.dialogData.chatId;
			this.mediaGridRef = null;
		}

		subscribeStoreEvents()
		{
			this.storeManager.on('sidebarModel/sidebarFilesModel/set', this.onSetSidebarFilesStore);
			this.storeManager.on('sidebarModel/sidebarFilesModel/delete', this.onDeleteSidebarFilesStore);
			this.storeManager.on('sidebarModel/sidebarFilesModel/setHasNextPage', this.onSetHasNextPage);
		}

		unsubscribeStoreEvents()
		{
			this.storeManager.off('sidebarModel/sidebarFilesModel/set', this.onSetSidebarFilesStore);
			this.storeManager.off('sidebarModel/sidebarFilesModel/delete', this.onDeleteSidebarFilesStore);
			this.storeManager.off('sidebarModel/sidebarFilesModel/setHasNextPage', this.onSetHasNextPage);
		}

		bindMethods()
		{
			this.onSetSidebarFilesStore = this.onSetSidebarFilesStore.bind(this);
			this.onDeleteSidebarFilesStore = this.onDeleteSidebarFilesStore.bind(this);
			this.onSetHasNextPage = this.onSetHasNextPage.bind(this);
		}

		onSetHasNextPage(mutation)
		{
			const {
				chatId: eventChatId,
				subType,
				hasNextPage,
			} = mutation.payload.data;

			const isEqualChatId = eventChatId === this.chatId;
			const isEqualSubType = subType === this.dataProvider.getStoreKey();

			if (isEqualChatId && isEqualSubType && !hasNextPage)
			{
				this.disablePaginationLoader();
			}
		}

		getItemsFromStore()
		{
			const { chatId } = this.props.dialogData;

			const getSidebarFiles = this.store.getters['sidebarModel/sidebarFilesModel/get'];
			const data = getSidebarFiles(chatId, this.dataProvider.getStoreKey());

			const items = data.items;

			return {
				items: items ? this.convertToSortedList(items) : null,
				hasNextPage: data.hasNextPage,
			};
		}

		/**
		 * @param {object} mutation
		 * @param {object} mutation.payload
		 * @param {SidebarFilesSetData} mutation.payload.data
		 */
		onSetSidebarFilesStore(mutation)
		{
			const {
				chatId: eventChatId,
				subType,
			} = mutation.payload.data;

			const isEqualChatId = eventChatId === this.chatId;
			const isEqualSubType = subType === this.dataProvider.getStoreKey();

			if (isEqualChatId && isEqualSubType)
			{
				this.onStoreItemsUpdated();
			}
		}

		/**
		 * @protected
		 */
		onStoreItemsUpdated()
		{
			const { items, hasNextPage } = this.getItemsFromStore();

			if (this.isPending())
			{
				if (items !== null)
				{
					this.setState({ items, hasNextPage, pending: false });
				}
			}
			else
			{
				this.state.hasNextPage = hasNextPage;
				this.state.items = items;
				if (this.mediaGridRef)
				{
					this.mediaGridRef.updateOrInsert(this.getMediaGridData());
				}
			}
		}

		/**
		 * @param {object} mutation
		 * @param {object} mutation.payload
		 * @param {SidebarFilesDeleteData} mutation.payload.data
		 */
		onDeleteSidebarFilesStore(mutation)
		{
			const { fileId, chatId: eventChatId } = mutation.payload.data;

			if (String(eventChatId) !== String(this.chatId))
			{
				return;
			}

			if (this.mediaGridRef)
			{
				this.mediaGridRef.delete([fileId]);
			}
		}

		renderContent()
		{
			return this.hasItems() && isMediaGridAvailable
				? this.renderItemsContainer()
				: this.renderEmptyScreen();
		}

		renderItemsContainer()
		{
			const { onScrollCalculated, onScroll, onOverscrollTop, onOverscrollBottom } = this.props;

			return View(
				{
					style: {
						flex: 1,
					},
				},
				// eslint-disable-next-line no-undef
				MediaGrid({
					onScrollCalculated,
					onScroll,
					onOverscrollTop,
					onOverscrollBottom,
					ref: this.onMediaGridControllerAvailable,
					style: {
						flex: 1,
					},
					getSection: this.getSection,
					sectionHeaderStyle: {
						font: {
							color: Color.base4.toHex(),
							size: 15,
						},
					},
					isScrollable: true,
					onLoadMore: () => this.onLoadMore(),
					onItemClick: this.onItemClick,
				}),
			);
		}

		/**
		 * @protected
		 */
		onLoadMore()
		{
			const offset = this.getItems().length;

			if (this.isLastPage())
			{
				this.disablePaginationLoader();

				return;
			}

			this.dataProvider.loadPage(offset)
				.then((data) => {
					this.logger.info('onLoadMore', data);
				})
				.catch((error) => {
					this.logger.error('onLoadMore', error);
				})
			;
		}

		/**
		 * @protected
		 */
		enablePaginationLoader()
		{
			this.mediaGridRef?.setNextPageLoaderVisibility(true);
		}

		/**
		 * @protected
		 */
		disablePaginationLoader()
		{
			this.mediaGridRef?.setNextPageLoaderVisibility(false);
		}

		onMediaGridControllerAvailable = (ref) => {
			if (ref && !this.mediaGridRef)
			{
				this.mediaGridRef = ref;
				this.mediaGridRef.setInitialMediaFiles(this.getMediaGridData());
				if (this.state.hasNextPage)
				{
					this.enablePaginationLoader();
				}
			}
		};

		onItemClick = (item) => {
			if (item.type === FileType.image)
			{
				openNativeViewer({
					fileType: 'image',
					url: item.urlShow,
					name: item.name,
					images: this.getImagesForNativeViewer(item.fileId),
				});
			}

			if (item.type === FileType.video)
			{
				viewer.openVideo(item.urlShow, item.name);
			}
		};

		getImagesForNativeViewer(defaultId)
		{
			/** @return {SidebarTabMediaItemModel[]} */
			const images = this.getItems().filter((item) => item.getType() === FileType.image);

			return images.map((image) => {
				return {
					url: image.getUrlShow(),
					default: image.getId() === defaultId,
				};
			});
		}

		/**
		 * @param {String} sectionId - timestamp
		 * @returns {{sectionSortKey: number, title: string}}
		 */
		getSection = (sectionId) => {
			const timestamp = new Date(Number(sectionId));
			const moment = new Moment(timestamp);

			return {
				sectionSortKey: -Number(sectionId),
				title: moment.format(monthYear),
			};
		};

		getMediaGridData()
		{
			return this.getItems().map((item) => item.toMediaGridView()).filter(Boolean);
		}

		/**
		 * @protected
		 * @return {SidebarTabMediaItemModel[]}
		 */
		getItems()
		{
			return Array.isArray(this.state.items) ? this.state.items : [];
		}

		/**
		 * @param {Map<number, SidebarFile>} map
		 * @return {Array<SidebarFile>}
		 */
		convertToSortedList(map)
		{
			return uniqBy(
				[...map]
					.map(([_, value]) => (value))
					.sort((a, b) => new Date(b.dateCreate).getTime() - new Date(a.dateCreate).getTime())
					.map((data) => new SidebarTabMediaItemModel(this.store, data)),
				(item) => item.getId(),
			);
		}

		getEmptyScreenProps()
		{
			const emptyScreenProps = {
				testId: 'media',
				title: isMediaGridAvailable
					? Loc.getMessage('IMMOBILE_SIDEBAR_V2_COMMON_TAB_MEDIA_EMPTY_SCREEN_TITLE')
					: Loc.getMessage('IMMOBILE_SIDEBAR_V2_COMMON_TAB_NOT_SUPPORTED_TITLE'),
				image: 'media.svg',
			};

			if (!isMediaGridAvailable)
			{
				emptyScreenProps.description = Loc.getMessage('IMMOBILE_SIDEBAR_V2_COMMON_TAB_NOT_SUPPORTED_SUBTITLE');
			}

			return emptyScreenProps;
		}

		/**
		 * @public
		 * @param {boolean} animated
		 * @return {Promise}
		 */
		scrollToBegin(animated = true)
		{
			if (this.mediaGridRef?.scrollToBegin)
			{
				this.mediaGridRef.scrollToBegin(animated);

				return Promise.resolve();
			}

			if (this.isEmpty())
			{
				return Promise.resolve();
			}

			return Promise.reject(new Error('Scrollable ref not found'));
		}
	}

	module.exports = { SidebarMediaTabContent };
});
