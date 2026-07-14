/**
 * @module im/messenger/controller/recent/service/search/common
 */
jn.define('im/messenger/controller/recent/service/search/common', (require, exports, module) => {
	const { Type } = require('type');
	const {
		ChatSearchSelector,
		ChatSearchProvider,
		ChatSearchConfig,
		RecentSectionLocalSearchStrategy,
		UserLocalSearchStrategy,
		CompositeLocalSearchStrategy,
		DefaultServerSearchStrategy,
	} = require('im/messenger/lib/chat-search');
	const { EventType } = require('im/messenger/const');

	const { BaseUiRecentService } = require('im/messenger/controller/recent/service/base');

	/**
	 * @implements {ISearchService}
	 * @extends {BaseUiRecentService<CommonSearchServiceProps>}
	 * @class CommonSearchService
	 */
	class CommonSearchService extends BaseUiRecentService
	{
		onInit()
		{
			this.logger.log('onInit');
		}

		/**
		 * @param {BaseList} ui
		 */
		async onUiReady(ui)
		{
			this.logger.log('onUiReady');

			this.ui = ui;
			this.searchSelector = new ChatSearchSelector(ui, {
				provider: this.#createSearchProvider(),
				sections: this.props.sections,
			});

			this.subscribeEvents(ui);
		}

		/**
		 * @private
		 * @return {ChatSearchProvider}
		 */
		#createSearchProvider()
		{
			return new ChatSearchProvider({
				localStrategy: this.#createLocalStrategy(),
				serverStrategy: new DefaultServerSearchStrategy({
					config: new ChatSearchConfig(this.#resolveParentChatId()),
					recentTab: this.props.recentTab,
				}),
			});
		}

		/**
		 * @private
		 * @return {LocalSearchStrategy}
		 */
		#createLocalStrategy()
		{
			const recentStrategy = new RecentSectionLocalSearchStrategy({
				section: this.props.recentTab,
				parentChatId: this.#resolveParentChatId(),
			});

			if (!this.props.searchUsers)
			{
				return recentStrategy;
			}

			return new CompositeLocalSearchStrategy({
				strategies: [recentStrategy, new UserLocalSearchStrategy()],
			});
		}

		/**
		 * @private
		 * @return {number | null}
		 */
		#resolveParentChatId()
		{
			return Type.isUndefined(this.props.parentId)
				? this.recentLocator.get('parentChatId')
				: this.props.parentId;
		}

		async openSearch()
		{
			this.logger.log('openSearch');

			try
			{
				await this.uiReadyPromise;
				this.searchSelector.open();
			}
			catch (error)
			{
				this.logger.error('openSearch error: ', error);
			}
		}

		closeSearchHandler = () => {
			this.logger.log('closeSearchHandler');

			try
			{
				this.searchSelector.close();
			}
			catch (error)
			{
				this.logger.error('closeSearchHandler error: ', error);
			}
		};

		subscribeEvents(ui)
		{
			ui?.on(EventType.recent.searchHide, this.closeSearchHandler);
		}

		unsubscribeEvents()
		{
			this.recentLocator.get('ui')
				.then((ui) => {
					ui?.off(EventType.recent.searchHide, this.closeSearchHandler);
				})
				.catch((error) => {
					this.logger.error('unsubscribeEvents error', error);
				})
			;
		}
	}

	module.exports = CommonSearchService;
});
