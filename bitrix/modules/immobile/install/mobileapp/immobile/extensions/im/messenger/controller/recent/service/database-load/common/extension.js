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

			const page = await this.#loadPage(true);
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

			const page = await this.#loadPage();
			await this.#savePageToModel(page, true);
			await this.#saveFixedParentChatToModel();

			const loadedPageCursor = this.#processLoadedPageData(page);

			this.#setPaginationState(loadedPageCursor);

			this.logger.log('loadFirstPage complete');
		}

		/**
		 * @private
		 * @return {string}
		 */
		get section()
		{
			return this.recentLocator.get('recentSection');
		}

		/**
		 * @private
		 * @return {number|null}
		 */
		get parentChatId()
		{
			if (this.props.filter?.ignoreParentChatId)
			{
				return null;
			}

			return this.recentLocator.get('parentChatId') ?? null;
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
		 * @param {boolean} [withCursor] pass true for subsequent pages to include lastActivityDate cursor
		 * @return {Promise<RecentListResult>}
		 */
		async #loadPage(withCursor = false)
		{
			if (this.#hasChatIdsFilter())
			{
				const page = await this.recentRepository.getByChatIds(this.props.filter.chatIds);
				page.items = this.#sortPageItems(page.items).slice(0, this.limit);
				page.hasMore = false;

				this.logger.log('#loadPage folder filter loaded:', page);

				return page;
			}

			const filter = {
				section: this.section,
				parentChatId: this.parentChatId,
				limit: this.limit,
				...(withCursor && { lastActivityDate: this.lastActivityDate }),
			};
			this.logger.log('#loadPage filter:', filter);
			const page = await this.recentRepository.getListBySectionFilter(filter);
			this.logger.log('#loadPage loaded:', page);

			return page;
		}

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
		 * Dispatches all related model data from a page (dialogues, users, messages, files, draft, stickers).
		 * Does NOT dispatch recent items — callers decide how to handle them.
		 *
		 * @param {RecentListResult} page
		 * @return {Promise<void>}
		 */
		async #saveRelatedDataToModel(page)
		{
			const saveList = [];

			const chatList = page.items.map((item) => item.chat).filter(Boolean);
			if (Type.isArrayFilled(chatList))
			{
				saveList.push(this.store.dispatch('dialoguesModel/setCollectionFromLocalDatabase', chatList));
			}

			if (Type.isArrayFilled(page.users))
			{
				saveList.push(this.store.dispatch('usersModel/setFromLocalDatabase', page.users));
			}

			if (Type.isArrayFilled(page.messages))
			{
				saveList.push(this.store.dispatch('messagesModel/store', page.messages));
			}

			if (Type.isArrayFilled(page.files))
			{
				saveList.push(this.store.dispatch('filesModel/setFromLocalDatabase', page.files));
			}

			if (Type.isArrayFilled(page.draft))
			{
				saveList.push(this.store.dispatch('draftModel/setFromLocalDatabase', page.draft));
			}

			if (Type.isArrayFilled(page.stickers))
			{
				saveList.push(this.store.dispatch('stickerPackModel/addStickers', {
					stickers: page.stickers,
				}));
			}

			await Promise.all(saveList);
		}

		/**
		 * @param {RecentListResult} page
		 * @param {boolean} firstPage
		 */
		async #savePageToModel(page, firstPage = false)
		{
			try
			{
				await this.#saveRelatedDataToModel(page);

				if (firstPage || Type.isArrayFilled(page.items))
				{
					const recentAction = firstPage ? this.saveFirstPageAction : this.savePageAction;
					const actionName = firstPage ? this.saveFirstPageActionName : this.savePageActionName;
					const payload = {
						recentSection: this.recentLocator.get('recentSection'),
						itemList: page.items ?? [],
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

		/**
		 * Loads the parent chat into state.collection without adding it to nestedIdCollection.
		 * Only runs when props.fetchFixedParentChat is true and parentChatId is set.
		 */
		async #saveFixedParentChatToModel()
		{
			if (!this.props.fetchFixedParentChat || !this.parentChatId)
			{
				return;
			}

			const dialogId = `chat${this.parentChatId}`;
			const page = await this.recentRepository.getByDialogIds([dialogId]);

			if (!Type.isArrayFilled(page.items))
			{
				return;
			}

			await this.#saveRelatedDataToModel(page);

			// Dispatch to collection only — nestedIdCollection must not include the parent chat
			await this.store.dispatch('recentModel/set', page.items);
		}

		subscribeEvents()
		{}

		unsubscribeEvents()
		{}
	}

	module.exports = CommonDatabaseLoadService;
});
