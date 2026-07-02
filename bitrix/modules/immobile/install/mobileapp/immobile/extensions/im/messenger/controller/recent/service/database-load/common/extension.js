/**
 * @module im/messenger/controller/recent/service/database-load/common
 */
jn.define('im/messenger/controller/recent/service/database-load/common', (require, exports, module) => {
	const { Type } = require('type');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');

	const { PaginationState } = require('im/messenger/controller/recent/service/pagination/lib/state');
	const { BaseRecentService } = require('im/messenger/controller/recent/service/base');

	/**
	 * @implements {IDatabaseLoadService}
	 * @class CommonDatabaseLoadService
	 */
	class CommonDatabaseLoadService extends BaseRecentService
	{
		onInit()
		{
			this.logger.log('onInit');

			this.core = serviceLocator.get('core');
			this.store = serviceLocator.get('core').getStore();
			/** @type {RecentRepository} */
			this.recentRepository = this.core.getRepository().recent;

			this.hasMore = true;
			this.setLastItem(null);
		}

		/**
		 * @param {object|null} lastItem
		 */
		setLastItem(lastItem)
		{
			this.lastItem = lastItem;
		}

		/**
		 * @return {Promise<LoadedPageCursor>}
		 */
		async loadNextPage()
		{
			this.logger.log('loadNextPage');

			const page = await this.#getPage();
			await this.#savePageToModel(page);

			this.logger.log('loadNextPage complete');

			return this.#processLoadedPageData(page);
		}

		/**
		 * @return {Promise<LoadedPageCursor>}
		 */
		async loadFirstPage()
		{
			this.logger.log('loadFirstPage');

			const page = await this.#getFirstPage();
			await this.#savePageToModel(page, true);

			const loadedPageCursor = this.#processLoadedPageData(page);

			this.#setPaginationState(loadedPageCursor);

			this.logger.log('loadFirstPage complete');
		}

		/**
		 * @private
		 * @return ListByDialogTypeFilter
		 */
		get filter()
		{
			return this.props.filter;
		}

		/**
		 * @private
		 * @return {number}
		 */
		get limit()
		{
			return this.props.filter?.limit ?? 50;
		}

		/**
		 * @private
		 * @return {string}
		 */
		get savePageAction()
		{
			return this.props.savePageAction;
		}

		/**
		 * @private
		 * @return {string}
		 */
		get saveFirstPageAction()
		{
			return this.props.saveFirstPageAction ?? 'recentModel/setFirstPageByRecentSection';
		}

		/**
		 * @private
		 * @return {?string}
		 */
		get savePageActionName()
		{
			return this.props.savePageActionName;
		}

		/**
		 * @private
		 * @return {?string}
		 */
		get saveFirstPageActionName()
		{
			return this.props.saveFirstPageActionName;
		}

		/**
		 * @private
		 * @return {string|null}
		 */
		get lastActivityDate()
		{
			return this.lastItem?.lastActivityDate;
		}

		/**
		 * @returns {IRenderService|null}
		 */
		get renderService()
		{
			return this.recentLocator.get('render') ?? null;
		}

		/**
		 * @returns {IPaginationService|null}
		 */
		get paginationService()
		{
			return this.recentLocator.get('pagination') ?? null;
		}

		/**
		 * @return {Promise<RecentListResult>}
		 */
		async #getFirstPage()
		{
			if (this.#hasChatIdsFilter())
			{
				return this.#getChatIdsPage();
			}

			const filter = {
				...this.filter,
			};
			this.logger.log('#getFirstPage filter:', filter);
			const page = await this.recentRepository.getListByDialogTypeFilter(filter);
			this.logger.log('#getFirstPage loaded:', page);

			return page;
		}

		/**
		 * @return {Promise<RecentListResult>}
		 */
		async #getPage()
		{
			if (this.#hasChatIdsFilter())
			{
				return this.#getChatIdsPage();
			}

			const filter = {
				...this.filter,
				lastActivityDate: this.lastActivityDate,
			};
			this.logger.log('#getPage filter:', filter);
			const page = await this.recentRepository.getListByDialogTypeFilter(filter);
			this.logger.log('#getPage loaded:', page);

			return page;
		}

		/**
		 * @return {Promise<RecentListResult>}
		 */
		async #getChatIdsPage()
		{
			const page = await this.recentRepository.getByChatIds(this.props.filter.chatIds);
			page.items = this.#sortPageItems(page.items).slice(0, this.limit);
			page.hasMore = false;

			this.logger.log('#getChatIdsPage loaded:', page);

			return page;
		}

		/**
		 * @return {boolean}
		 */
		#hasChatIdsFilter()
		{
			return Type.isArray(this.props.filter?.chatIds);
		}

		/**
		 * @param {Array<RecentModelState>} items
		 * @return {Array<RecentModelState>}
		 */
		#sortPageItems(items)
		{
			if (!Type.isArrayFilled(items))
			{
				return [];
			}

			return [...items].sort((a, b) => {
				if (a.pinned !== b.pinned)
				{
					return a.pinned ? -1 : 1;
				}

				return this.#getItemTimestamp(b) - this.#getItemTimestamp(a);
			});
		}

		/**
		 * @param {RecentModelState} item
		 * @return {number}
		 */
		#getItemTimestamp(item)
		{
			const date = item.lastActivityDate ?? item.message?.date;
			if (date instanceof Date)
			{
				return date.getTime();
			}

			return new Date(date).getTime() || 0;
		}

		/**
		 * @param {RecentListResult} page
		 * @return {LoadedPageCursor}
		 */
		#processLoadedPageData(page)
		{
			const lastActivityDate = this.#extractLastActivityDateFromPage(page);
			this.setLastItem({
				lastActivityDate,
			});

			this.logger.log('#processLoadedPage lastActivityDate:', lastActivityDate);

			this.#manageLoader(page.hasMore);

			return {
				hasMore: page.hasMore,
				lastItem: this.lastItem,
			};
		}

		/**
		 * @param {RecentListResult} page
		 * @param {boolean} firstPage
		 */
		async #savePageToModel(page, firstPage = false)
		{
			try
			{
				const savePromiseList = [];
				const chatList = page.items.map((item) => item.chat);
				if (Type.isArrayFilled(chatList))
				{
					savePromiseList.push(this.store.dispatch('dialoguesModel/setCollectionFromLocalDatabase', chatList));
				}

				if (Type.isArrayFilled(page.users))
				{
					savePromiseList.push(this.store.dispatch('usersModel/setFromLocalDatabase', page.users));
				}

				if (Type.isArrayFilled(page.messages))
				{
					savePromiseList.push(this.store.dispatch('messagesModel/store', page.messages));
				}

				if (Type.isArrayFilled(page.files))
				{
					savePromiseList.push(this.store.dispatch('filesModel/setFromLocalDatabase', page.files));
				}

				if (Type.isArrayFilled(page.draft))
				{
					savePromiseList.push(this.store.dispatch('draftModel/setFromLocalDatabase', page.draft));
				}

				if (Type.isArrayFilled(page.stickers))
				{
					savePromiseList.push(this.store.dispatch('stickerPackModel/addStickers', {
						stickers: page.stickers,
					}));
				}

				await Promise.all(savePromiseList);

				if (Type.isArrayFilled(page.items))
				{
					const recentAction = firstPage ? this.saveFirstPageAction : this.savePageAction;
					const actionName = firstPage ? this.saveFirstPageActionName : this.savePageActionName;
					const payload = {
						recentSection: this.recentLocator.get('recentSection'),
						itemList: page.items,
						parentChatId: this.recentLocator.get('parentChatId'),
					};
					if (Type.isStringFilled(actionName))
					{
						payload.actionName = actionName;
					}

					await this.store.dispatch(recentAction, payload);
				}
			}
			catch (error)
			{
				this.logger.error('saveFirstPageToModel error:', error);
			}
		}

		/**
		 * @param {RecentListResult} page
		 * @return {string|null}
		 */
		#extractLastActivityDateFromPage(page)
		{
			if (!page.items || page.items.length === 0)
			{
				return null;
			}

			const lastActivityDateObj = page.items[page.items.length - 1]?.lastActivityDate;

			return lastActivityDateObj?.toISOString() ?? null;
		}

		/**
		 * @param {boolean} hasMore
		 */
		#manageLoader(hasMore)
		{
			if (hasMore)
			{
				this.renderService?.showLoader();
			}
			// page from db should not hide  loader, there may be more items on server
		}

		/**
		 * @param {LoadedPageCursor} loadedPageCursor
		 */
		#setPaginationState(loadedPageCursor)
		{
			this.paginationService?.setFirstPageData(
				PaginationState.DATABASE_SOURCE,
				{
					hasMore: loadedPageCursor.hasMore,
					nextPage: 2,
					lastItem: loadedPageCursor.lastItem,
				},
			);
		}

		subscribeEvents()
		{}

		unsubscribeEvents()
		{}
	}

	module.exports = CommonDatabaseLoadService;
});
