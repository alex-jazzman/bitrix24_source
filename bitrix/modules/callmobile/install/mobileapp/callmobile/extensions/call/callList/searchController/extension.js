/**
 * @module call/callList/searchController
 */
jn.define('call/callList/searchController', (require, exports, module) => {
	const { CallListAnalyticsController } = require('call/callList/analyticsController');
	const { CallListSearchView } = require('call/callList/searchView');
	const { restCall, searchUsers } = require('call/callList/utils');

	const PER_PAGE = 40;

	class SearchController
	{
		constructor(component)
		{
			this.component = component;
			this.searchView = null;
			this.searchTimer = null;
			this.searchAnalyticsSent = false;
		}

		setupSearch()
		{
			BX.onViewLoaded(() => {
				const mainLayout = this.component.layout || layout;
				if (!mainLayout)
				{
					return;
				}

				if (typeof mainLayout.setRightButtons === 'function')
				{
					mainLayout.setRightButtons([
						{
							type: 'search',
							id: 'search',
							callback: () => this.openSearch(mainLayout),
						},
					]);
				}
			});
		}

		openSearch(mainLayout)
		{
			const searchHost = (mainLayout && mainLayout.search)
				? mainLayout.search
				: (layout && layout.search ? layout.search : null);
			if (!searchHost)
			{
				return;
			}

			this.searchView = new CallListSearchView({
				onItemClick: (item) => this.component.startCall(item),
			});
			searchHost.mode = 'layout';
			searchHost.show(this.searchView);
			searchHost.on('textChanged', ({ text }) => this.onSearchTextChanged(text));
			searchHost.on('cancel', () => this.onSearchCancel());
			searchHost.on('hide', () => this.onSearchHide());
		}

		onSearchTextChanged(text)
		{
			if (!this.searchAnalyticsSent)
			{
				CallListAnalyticsController.sendStartSearch();
				this.searchAnalyticsSent = true;
			}

			const query = String(text || '');
			const minTokenSize = Number(BX.componentParameters.get('SEARCH_MIN_SIZE', 3));
			const isActive = (query.trim().length >= minTokenSize);
			this.component.setState({ searchQuery: query, isSearchMode: isActive });

			if (this.searchTimer)
			{
				clearTimeout(this.searchTimer);
			}

			if (!isActive)
			{
				this.applySearchResults(null);

				this.setLoading(false);

				return;
			}

			this.searchTimer = setTimeout(() => this.performSearch(query), 350);
		}

		async performSearch(query)
		{
			this.setLoading(true);

			let callItems = [];
			let userItems = [];

			try
			{
				callItems = await this.searchCalls(query);
			}
			catch (error)
			{
				console.error('[CallList][search][calls][error]', error);
			}

			try
			{
				const existingUserIds = this.getExistingUserIds(callItems);
				existingUserIds.add(env.userId);

				userItems = await searchUsers(query, {
					limit: 10,
					excludeUserIds: existingUserIds,
				});
			}
			catch (error)
			{
				console.error('[CallList][search][users][error]', error);
			}

			this.applySearchResults([...callItems, ...userItems]);
			this.setLoading(false);
		}

		async searchCalls(query)
		{
			const payload = await restCall('call.CallLog.list', {
				filter: {
					SEARCH: query,
				},
				lastId: 0,
				count: PER_PAGE,
			});

			return payload.calls.map((callData) => this.component.normalizeCallData(callData));
		}

		getExistingUserIds(callItems)
		{
			const existingUserIds = new Set();
			callItems.forEach((call) => {
				if (call.chatType === 'private' && call.dialogId)
				{
					existingUserIds.add(call.dialogId);
				}
			});

			return existingUserIds;
		}

		onSearchCancel()
		{
			this.component.setState({ searchQuery: '', isSearchMode: false, searchItems: null });

			this.setLoading(false);
		}

		onSearchHide()
		{
			this.component.setState({ searchQuery: '', isSearchMode: false, searchItems: null });
			this.searchAnalyticsSent = false;

			if (this.searchView && typeof this.searchView.setItems === 'function')
			{
				this.searchView.setItems(null);
			}

			this.setLoading(false);
		}

		setLoading(loading)
		{
			if (this.searchView?.setLoading)
			{
				this.searchView.setLoading(loading);
			}
		}

		applySearchResults(items)
		{
			const list = items ? (Array.isArray(items) ? items : []) : null;
			this.component.setState({ searchItems: list });
			try
			{
				if (this.searchView && typeof this.searchView.setItems === 'function')
				{
					this.searchView.setItems(list);
				}
			}
			catch (error)
			{
				console.error('[CallList][search][apply][error]', error);
			}
		}

		cleanup()
		{
			if (this.searchTimer)
			{
				clearTimeout(this.searchTimer);
				this.searchTimer = null;
			}
		}
	}

	module.exports = { SearchController };
});
