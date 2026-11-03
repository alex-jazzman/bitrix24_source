/**
 * @module im/messenger/controller/recent/service/database-load/all
 */
jn.define('im/messenger/controller/recent/service/database-load/all', (require, exports, module) => {
	const { Type } = require('type');
	const { PerfPoint } = require('debug/prism');
	const { ROOT_PARENT_CHAT_ID } = require('im/messenger/const');
	const { FolderComposition } = require('im/messenger/controller/recent/service/lib/folder-composition');
	const CommonDatabaseLoadService = require('im/messenger/controller/recent/service/database-load/common');

	/**
	 * @implements {IDatabaseLoadService}
	 * @class AllDatabaseLoadService
	 */
	class AllDatabaseLoadService extends CommonDatabaseLoadService
	{
		/**
		 * The list of the "All" folder is the union of the member sections, so the page comes from
		 * a multi-section query instead of the single-section one. Only roots are requested: nested
		 * task chats belong to the tab of their project, not here.
		 *
		 * @override
		 * @param {boolean} [withCursor]
		 * @return {Promise<RecentListResult>}
		 */
		async loadPage(withCursor = false)
		{
			const filter = {
				sections: this.sections,
				parentChatId: ROOT_PARENT_CHAT_ID,
				limit: this.limit,
				...(withCursor && { lastActivityDate: this.lastActivityDate }),
			};

			this.logger.log('loadPage filter:', filter);

			const point = new PerfPoint('recent-all-db-page', withCursor ? 'next page' : 'first page').start();
			try
			{
				const page = await this.recentRepository.getListBySectionsFilter(filter);
				this.logger.log('loadPage loaded:', page);

				return page;
			}
			finally
			{
				point.end();
			}
		}

		/**
		 * The page is seeded section by section, so the union getter rebuilds the view from the
		 * sections themselves: the "All" folder keeps no membership storage of its own.
		 *
		 * The seed is additive for every page, first one included: the buckets it writes to are
		 * shared with the tabs of the member sections and must not be replaced by a page of "All".
		 *
		 * @override
		 * @param {RecentListResult} page
		 * @return {Promise<void>}
		 */
		async savePageToModel(page)
		{
			const point = new PerfPoint('recent-all-db-seed', this.recentLocator.get('id')).start();

			try
			{
				await this.saveRelatedDataToModel(page);

				point.startPoint('sections-query');
				const items = await this.buildSectionItems(page.items);
				point.endPoint('sections-query', { itemsCount: items.length });

				if (Type.isArrayFilled(items))
				{
					point.startPoint('model-seed');
					await this.store.dispatch('recentModel/setByRecentConfigTabsBatch', { items });
					point.endPoint('model-seed');

					// a page read from below the bottom of the previous one is outside the window of
					// the list service until it is reported
					this.recentLocator.get('vuex')?.addLoadedPage(items.map((item) => item.itemList.id));
				}
			}
			catch (error)
			{
				this.logger.error('savePageToModel error:', error);

				// closes the phase that was open when it failed; an already closed key is a no-op
				point.endPoint('sections-query', { error });
				point.endPoint('model-seed', { error });
			}
			finally
			{
				point.end();
			}
		}

		/**
		 * @return {Array<string>}
		 */
		get sections()
		{
			return [...FolderComposition.getSectionsByTabId(this.recentLocator.get('id'))];
		}

		/**
		 * Every section the dialog is stored with is seeded, not only the ones the "All" folder is
		 * built from: the model stays consistent with what the section table holds, and the union
		 * getter picks the sections it needs itself.
		 *
		 * @param {Array<RecentModelState>} items
		 * @return {Promise<Array<{sections: Array<string>, itemList: object, parentChatId: number}>>}
		 */
		async buildSectionItems(items)
		{
			if (!Type.isArrayFilled(items))
			{
				return [];
			}

			const sectionsByDialogId = await this.recentRepository.getSectionsByDialogIds(
				items.map((item) => String(item.id)),
			);

			return items
				.map((item) => {
					const sections = sectionsByDialogId.get(String(item.id));
					if (!Type.isArrayFilled(sections))
					{
						this.logger.error('buildSectionItems: no stored sections for the item', item.id);

						return null;
					}

					return {
						sections,
						itemList: item,
						parentChatId: ROOT_PARENT_CHAT_ID,
					};
				})
				.filter(Boolean);
		}
	}

	module.exports = AllDatabaseLoadService;
});
