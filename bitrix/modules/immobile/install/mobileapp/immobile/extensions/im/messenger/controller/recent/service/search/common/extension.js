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
		FolderLocalSearchStrategy,
		UserLocalSearchStrategy,
		CompositeLocalSearchStrategy,
		DefaultServerSearchStrategy,
	} = require('im/messenger/lib/chat-search');
	const { EventType } = require('im/messenger/const');

	const { BaseUiRecentService } = require('im/messenger/controller/recent/service/base');
	const { FolderComposition } = require('im/messenger/controller/recent/service/lib/folder-composition');

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

			if (this.props.folderCompositionOnly && this.props.folderEligibleOnly)
			{
				this.logger.warn('onInit: both folder scopes are declared, the eligibility one wins');
			}
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
					recentTab: this.#resolveServerSection(),
					dynamicOptions: () => this.#getServerSearchOptions(),
				}),
			});
		}

		/**
		 * Whether the tab searches the composition of a folder. The scope is declared by the config, not
		 * guessed from the folder id, so a folder tab whose id is not known yet is still a folder tab.
		 *
		 * The two folder scopes are exclusive. The server resolves the composition one first, so a
		 * request holding both keys would drop the eligibility rule without a word; the rule wins here,
		 * and a folder id added to the config of its tab moves neither stage of the search.
		 *
		 * @private
		 * @return {boolean}
		 */
		#isFolderCompositionSearch()
		{
			return this.props.folderCompositionOnly === true && !this.#isFolderEligibleSearch();
		}

		/**
		 * @private
		 * @return {boolean}
		 */
		#isFolderEligibleSearch()
		{
			return this.props.folderEligibleOnly === true;
		}

		/**
		 * The recent section the server search is scoped to. A folder scope replaces the section rather
		 * than joining it: it describes the result set on its own, so the client sends no section next
		 * to it.
		 *
		 * The local strategy keeps its own section either way, so the two scopes are allowed to differ.
		 *
		 * @private
		 * @return {string | undefined}
		 */
		#resolveServerSection()
		{
			const isFolderScopeSearch = this.#isFolderEligibleSearch() || this.#isFolderCompositionSearch();

			return isFolderScopeSearch ? undefined : this.props.recentTab;
		}

		/**
		 * Options applied to the server config before every search: the folder id is read here rather
		 * than captured when the service is built.
		 *
		 * An unknown id goes as zero instead of being left out: the server reads the scope by the
		 * presence of the key, so a request without it asks for the default scope, wider than the tab
		 * shows, while a folder nobody owns closes the answer.
		 *
		 * @private
		 * @return {{ excludeGuests: boolean, searchFolderId?: number, searchFolderEligible?: boolean }}
		 */
		#getServerSearchOptions()
		{
			if (this.#isFolderEligibleSearch())
			{
				return { excludeGuests: true, searchFolderEligible: true };
			}

			if (this.#isFolderCompositionSearch())
			{
				const { folderId } = this.props;

				return { excludeGuests: true, searchFolderId: Type.isNumber(folderId) ? folderId : 0 };
			}

			return { excludeGuests: true };
		}

		/**
		 * @private
		 * @return {LocalSearchStrategy}
		 */
		#createLocalStrategy()
		{
			const recentStrategy = this.#createRecentStrategy();

			if (!this.props.searchUsers)
			{
				return recentStrategy;
			}

			return new CompositeLocalSearchStrategy({
				strategies: [recentStrategy, new UserLocalSearchStrategy()],
			});
		}

		/**
		 * A tab scoped to a folder searches the local base by the composition of that folder, a tab
		 * standing on a section - by that section.
		 *
		 * @private
		 * @return {LocalSearchStrategy}
		 */
		#createRecentStrategy()
		{
			if (this.#isFolderCompositionSearch())
			{
				return new FolderLocalSearchStrategy({
					getSections: () => this.#resolveFolderSections(),
					parentChatId: this.#resolveParentChatId(),
				});
			}

			return new RecentSectionLocalSearchStrategy({
				section: this.props.recentTab,
				parentChatId: this.#resolveParentChatId(),
			});
		}

		/**
		 * Sections the folder of the tab is made of, read on every search. Asked for by the tab id, as
		 * every other reader of the composition asks. A folder the store knows nothing of gives an empty
		 * scope rather than a guess: searching the whole base would answer wider than the tab shows.
		 *
		 * @private
		 * @return {Set<string>}
		 */
		#resolveFolderSections()
		{
			return FolderComposition.getSectionsByTabId(this.recentLocator.get('id'));
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
