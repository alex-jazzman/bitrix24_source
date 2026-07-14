/**
 * @module call/callList/recentSearchController
 */
jn.define('call/callList/recentSearchController', (require, exports, module) => {
	const { CallListSearchView } = require('call/callList/searchView');
	const { searchUsers } = require('call/callList/utils');

	const SEARCH_DEBOUNCE_MS = 350;
	const SEARCH_MIN_TOKEN_SIZE = Number(BX.componentParameters.get('SEARCH_MIN_SIZE', 3));
	const REMOTE_SEARCH_LIMIT = 10;

	class RecentSearchController
	{
		constructor(component)
		{
			this.component = component;
			this.searchView = null;
			this.searchTimer = null;
		}

		openSearch(layoutWidget)
		{
			if (!layoutWidget || !layoutWidget.search)
			{
				return;
			}

			this.searchView = new CallListSearchView({
				onItemClick: (item) => this.handleItemClick(item),
			});

			const searchHost = layoutWidget.search;
			searchHost.mode = 'layout';
			searchHost.show(this.searchView);
			searchHost.on('textChanged', ({ text }) => this.onSearchTextChanged(text));
			searchHost.on('cancel', () => this.resetSearch());
			searchHost.on('hide', () => this.resetSearch());
		}

		onSearchTextChanged(text)
		{
			const query = String(text || '').trim();

			this.clearSearchTimer();

			if (!query || query.length < SEARCH_MIN_TOKEN_SIZE)
			{
				this.resetSearch();

				return;
			}

			this.searchTimer = setTimeout(() => this.performSearch(query), SEARCH_DEBOUNCE_MS);
		}

		async performSearch(query)
		{
			this.setLoading(true);

			let filteredRecent = [];
			let remoteItems = [];

			try
			{
				filteredRecent = this.filterRecentItems(query);
			}
			catch (error)
			{
				console.error('[RecentSearchController][performSearch][filterRecentItems][error]', error);
			}

			try
			{
				const existingUserIds = this.extractUserIds(filteredRecent);
				existingUserIds.add(env.userId);

				remoteItems = await this.searchRemote(query, existingUserIds);
			}
			catch (error)
			{
				console.error('[RecentSearchController][performSearch][searchRemote][error]', error);
			}

			this.setItems([...filteredRecent, ...remoteItems]);
			this.setLoading(false);
		}

		extractUserIds(items)
		{
			const userIds = new Set();

			items.forEach((item) => {
				const userId = item.userId || item.dialogId;
				if (userId)
				{
					userIds.add(String(userId));
				}
			});

			return userIds;
		}

		filterRecentItems(query)
		{
			const recentItems = this.component.state.items || [];
			const lowerQuery = query.toLowerCase().trim();

			if (!lowerQuery || recentItems.length === 0)
			{
				return [];
			}

			const filtered = recentItems.filter((item) => {
				const title = String(item.title || '').toLowerCase();
				const workPosition = String(item.workPosition || '').toLowerCase();

				return title.includes(lowerQuery) || workPosition.includes(lowerQuery);
			});

			return filtered.map((item) => ({
				...item,
				sourceType: 'user',
			}));
		}

		async searchRemote(query, excludeUserIds)
		{
			return searchUsers(query, {
				limit: REMOTE_SEARCH_LIMIT,
				excludeUserIds,
				includeUserId: true,
			});
		}

		handleItemClick(item)
		{
			if (this.component.onUserClick)
			{
				this.component.onUserClick(item);
			}
		}

		setLoading(isLoading)
		{
			if (this.searchView?.setLoading)
			{
				this.searchView.setLoading(isLoading);
			}
		}

		setItems(items)
		{
			if (this.searchView?.setItems)
			{
				const list = items ? (Array.isArray(items) ? items : []) : null;
				this.searchView.setItems(list);
			}
		}

		clearSearchTimer()
		{
			if (this.searchTimer)
			{
				clearTimeout(this.searchTimer);
				this.searchTimer = null;
			}
		}

		resetSearch()
		{
			this.clearSearchTimer();
			this.setItems(null);
			this.setLoading(false);
		}

		cleanup()
		{
			this.clearSearchTimer();
		}
	}

	module.exports = { RecentSearchController };
});
