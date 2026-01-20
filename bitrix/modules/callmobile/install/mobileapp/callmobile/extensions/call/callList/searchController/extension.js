/**
 * @module call/callList/searchController
 */
jn.define('call/callList/searchController', (require, exports, module) => {
	const { CallListSearchView } = require('call/callList/searchView');
	const { restCall, normalizeUserAvatarPath } = require('call/callList/utils');

	const PER_PAGE = 40;

	class SearchController
	{
		constructor(component)
		{
			this.component = component;
			this.searchView = null;
			this.searchTimer = null;
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

				return;
			}

			this.searchTimer = setTimeout(() => this.performSearch(query), 350);
		}

		async performSearch(query)
		{
			try
			{
				const callItems = await this.searchCalls(query);
				const existingUserIds = this.getExistingUserIds(callItems);
				const userItems = await this.searchUsers(query, existingUserIds);

				this.applySearchResults([...callItems, ...userItems]);
			}
			catch (error)
			{
				console.error('[CallList][search][users][error]', error);
			}
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

		async searchUsers(query, existingUserIds)
		{
			const userRes = await restCall('im.search.user', {
				FIND: query,
				LIMIT: 10,
				OFFSET: 0,
			});

			let rawUsers = [];
			if (userRes)
			{
				rawUsers = Array.isArray(userRes) ? userRes : Object.values(userRes);
			}

			const filteredUsers = rawUsers.filter((user) => !existingUserIds.has(String(user.id)));

			return Promise.all(
				filteredUsers.map(async (user) => {
					let chatId = 0;

					const dialogRes = await restCall('im.dialog.get', {
						DIALOG_ID: user.id,
					});

					if (dialogRes)
					{
						chatId = dialogRes.id || 0;
					}

					return {
						chatId,
						id: `user-${user.id}`,
						key: `user-${user.id}`,
						ts: 0,
						title: user.name || '',
						phone: '',
						phoneNumber: '',
						sourceType: 'user',
						dialogId: String(user.id),
						chatType: 'private',
						avatar: normalizeUserAvatarPath(user.avatar),
						workPosition: (user.work_position || user.workPosition || ''),
						userColor: (user.color || ''),
						isUnseen: false,
						duration: 0,
					};
				}),
			);
		}

		onSearchCancel()
		{
			this.component.setState({ searchQuery: '', isSearchMode: false, searchItems: null });
		}

		onSearchHide()
		{
			this.component.setState({ searchQuery: '', isSearchMode: false, searchItems: null });
			if (this.searchView && typeof this.searchView.setItems === 'function')
			{
				this.searchView.setItems(null);
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
