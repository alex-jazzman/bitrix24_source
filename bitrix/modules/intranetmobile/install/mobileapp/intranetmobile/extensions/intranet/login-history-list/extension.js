/**
 * @module intranet/login-history-list
 */
jn.define('intranet/login-history-list', (require, exports, module) => {
	const { ListItemType, ListItemsFactory } = require('intranet/simple-list/items');
	const { TypeGenerator } = require('layout/ui/stateful-list/type-generator');
	const { StatefulList } = require('layout/ui/stateful-list');
	const { makeLibraryImagePath } = require('asset-manager');
	const { StatusBlock } = require('ui-system/blocks/status-block');
	const { Loc } = require('loc');
	const CURRENT_DEVICE_ID = 'login-history-current-device';

	class LoginHistoryList extends LayoutComponent
	{
		constructor(props)
		{
			super(props);

			this.listRef = null;
			this.parentWidget = props.layout || layout;
			this.currentDeviceFromServer = null;
		}

		render()
		{
			return this.renderList();
		}

		renderList()
		{
			return new StatefulList({
				testId: 'login-history-list',
				showAirStyle: true,
				layout: this.parentWidget,
				typeGenerator: {
					generator: TypeGenerator.generators.bySelectedProperties,
					properties: [
						'ip',
						'browser',
						'devicePlatform',
						'deviceType',
						'geolocation',
						'loginDate',
					],
					callbacks: {},
				},
				actions: {
					loadItems: 'intranetmobile.loginhistory.getList',
				},
				actionCallbacks: {
					loadItems: this.onItemsLoaded,
				},
				onBeforeItemsRender: this.onBeforeItemsRender,
				onBeforeItemsSetState: this.onBeforeItemsSetState,
				itemType: ListItemType.LOGIN,
				itemFactory: ListItemsFactory,
				isShowFloatingButton: false,
				onPanListHandler: this.onPanList,
				getEmptyListComponent: this.getEmptyListComponent,
				ref: this.onListRef,
			});
		}

		onItemsLoaded = (data) => {
			this.currentDeviceFromServer = data?.currentDevice || null;
		};

		onListRef = (ref) => {
			this.listRef = ref;
		};

		getEmptyListComponent = () => {
			return StatusBlock({
				testId: 'empty-state',
				title: Loc.getMessage('M_INTRANET_LOGIN_HISTORY_LIST_EMPTY_STATE_TITLE'),
				description: Loc.getMessage('M_INTRANET_LOGIN_HISTORY_LIST_EMPTY_STATE_DESCRIPTION'),
				emptyScreen: true,
				onRefresh: () => {
					this.listRef.reload();
				},
				image: Image({
					resizeMode: 'contain',
					style: {
						width: 202,
						height: 172,
					},
					uri: makeLibraryImagePath('empty_login_history.png', 'empty-states', 'intranet', false),
				}),
			});
		};

		onBeforeItemsRender = (items) => {
			return items.map((item, index) => ({
				...item,
				isFirst: index === 1,
			}));
		};

		onBeforeItemsSetState = (items, params = {}) => {
			if (params?.append !== false)
			{
				return items;
			}

			if (!items || items.length === 0 || !this.currentDeviceFromServer)
			{
				return items;
			}

			const cleanedItems = items.filter((item) => item.id !== CURRENT_DEVICE_ID);

			return [
				{
					...this.currentDeviceFromServer,
					id: CURRENT_DEVICE_ID,
					showBorder: false,
					isCurrent: true,
				},
				...cleanedItems,
			];
		};
	}

	module.exports = {
		LoginHistoryList,
	};
});
