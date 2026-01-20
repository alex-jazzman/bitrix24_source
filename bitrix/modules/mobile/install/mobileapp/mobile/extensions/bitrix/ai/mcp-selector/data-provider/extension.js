/**
 * @module ai/mcp-selector/data-provider
 */
jn.define('ai/mcp-selector/data-provider', (require, exports, module) => {
	const { Type } = require('type');
	const { RunActionExecutor } = require('rest');
	const store = require('statemanager/redux/store');
	const { selectById } = require('statemanager/redux/slices/users/selector');
	const { dispatch } = require('statemanager/redux/store');
	const { usersUpserted } = require('statemanager/redux/slices/users');

	class MCPSelectorDataProvider
	{
		/**
		 * @param {MCPSelectorDataProviderProps} props
		 */
		constructor(props)
		{
			this.cacheHandler = props.cacheHandler ?? null;
			this.responseHandler = props.responseHandler ?? null;
			this.onItemSelect = props.onItemSelect ?? null;
		}

		async load()
		{
			const response = await (new RunActionExecutor('mobile.MCPSelector.getData', {}))
				.enableJson()
				.setCacheHandler(this.handleCache)
				.setHandler(this.handleResponse)
				.call(false)
			;

			const users = response.data?.users;
			if (Type.isArrayFilled(users))
			{
				await dispatch(usersUpserted(users));
			}
		}

		/**
		 * @param response
		 * @param {MCPSelectorResponseData} response.data
		 */
		handleResponse = async (response) => {
			if (this.responseHandler)
			{
				this.responseHandler(this.prepareResponseData(response.data));
			}
		};

		handleCache = (response) => {
			if (this.cacheHandler)
			{
				this.cacheHandler(this.prepareResponseData(response.data));
			}
		};

		prepareResponseData(data)
		{
			const { items, disabledByAdmin, disabledByTariff } = data;

			return {
				items: items.map((item) => this.prepareItem({
					...item,
					onSelect: this.onItemSelect,
					isDisabled: disabledByAdmin || disabledByTariff,
				})),
				disabledByAdmin,
				disabledByTariff,
			};
		}

		/**
		 * @param {MCPSelectorServerModel} item
		 * @return {MCPSelectorPreparedItem}
		 */
		prepareItem(item)
		{
			return {
				id: item.id,
				name: item.name,
				subtitle: item.description,
				iconUrl: item.iconUrl,
				isActive: item.isActive,
				isDisabled: item.isDisabled ?? false,
				onSelect: item.onSelect,
				authorizations: item.authorizations?.map(
					(auth) => this.prepareAuthorizationItem(item, auth, item.onSelect),
				) ?? [],
				isLink: Type.isArrayFilled(item.authorizations) && item.authorizations.length > 1,
			};
		}

		/**
		 * @param {MCPSelectorServerModel} item
		 * @param {MCPSelectorServerAuthorizationModel} auth
		 * @return {MCPSelectorPreparedItem}
		 */
		prepareAuthorizationItem(item, auth)
		{
			return {
				id: auth.id,
				serverId: item.id,
				isAuthorization: true,
				name: this.getUserLogin(auth.userId),
				iconUrl: item.iconUrl,
				onSelect: item.onSelect,
				userId: auth.userId,
			};
		}

		getUserLogin(userId)
		{
			const user = selectById(store.getState(), userId) ?? {};

			return user.email ?? user.fullName;
		}
	}

	module.exports = {
		MCPSelectorDataProvider,
	};
});
