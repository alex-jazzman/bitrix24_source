/**
 * @module mail/message-grid/src/list-adapter
 */
jn.define('mail/message-grid/src/list-adapter', (require, exports, module) => {
	const { MessageGridItemsResponseHandler } = require('mail/message-grid/src/items-response-handler');
	const { MessageModel } = require('mail/statemanager/redux/slices/messages/model/message');
	const { selectEntities } = require('mail/statemanager/redux/slices/messages/selector');
	const { ListItemType, ListItemsFactory } = require('mail/simple-list/items');
	const { MessageGridListSync } = require('mail/message-grid/src/list-sync');
	const { MessageGridCache } = require('mail/message-grid/src/cache');
	const { MailDialog } = require('mail/dialog');
	const { AjaxMethod } = require('mail/const');
	const { StatusBlock, makeLibraryImagePath } = require('ui-system/blocks/status-block');
	const { StatefulList } = require('layout/ui/stateful-list');
	const store = require('statemanager/redux/store');
	const { Type } = require('type');
	const { Loc } = require('loc');

	const PAGE_SIZE = 50;

	class MessageGridListAdapter
	{
		constructor({
			parentWidget,
			sorting,
			filterController,
			getMenuButtons = () => [],
			onOpenMessageChain = () => {},
			onWriteEmail = () => {},
			onListReloaded = () => {},
			requestRender = () => {},
			pageSize = PAGE_SIZE,
		} = {})
		{
			this.parentWidget = parentWidget;
			this.sorting = sorting;
			this.filterController = filterController;
			this.getMenuButtons = getMenuButtons;
			this.onOpenMessageChain = onOpenMessageChain;
			this.onWriteEmail = onWriteEmail;
			this.onExternalListReloaded = onListReloaded;
			this.requestRender = requestRender;
			this.pageSize = pageSize;

			this.showFloatingButton = false;
			this.listSync = new MessageGridListSync();
			this.itemsResponseHandler = new MessageGridItemsResponseHandler({
				cache: new MessageGridCache(),
				filterController: this.filterController,
				onMailboxAvailable: () => this.setFloatingButtonVisibility(true),
				onProviderRestriction: (provider, mailboxId) => this.showProviderRestrictionBanner(provider, mailboxId),
			});
		}

		showProviderRestrictionBanner(provider, mailboxId)
		{
			MailDialog.show({
				type: MailDialog.PROVIDER_RESTRICTION,
				provider,
				mailboxId,
				parentWidget: this.parentWidget,
			});
		}

		render()
		{
			return new StatefulList({
				isFloatingButtonAccent: true,
				layout: this.parentWidget,
				ref: this.onListRef,
				testId: 'message-grid',
				useCache: false,
				needInitMenu: true,
				showAirStyle: true,
				isShowFloatingButton: this.showFloatingButton,
				onListReloaded: this.onListReloaded,
				onFloatingButtonClick: this.onWriteEmail,
				sortingConfig: this.sorting.getSortingConfig(),
				onBeforeItemsSetState: this.onBeforeItemsSetState,
				onBeforeItemsRender: this.onBeforeItemsRender,
				getEmptyListComponent: this.renderEmptyListComponent,
				menuButtons: this.getMenuButtons(),
				itemFactory: ListItemsFactory,
				itemDetailOpenHandler: this.onOpenMessageChain,
				itemType: ListItemType.MESSAGE,
				itemsLoadLimit: this.pageSize,
				actions: {
					loadItems: AjaxMethod.mailGetList,
				},
				actionParams: this.filterController.getActionParams(),
				actionCallbacks: {
					loadItems: this.onItemsLoaded,
				},
				changeItemsOperations: this.changeItemsOperations,
			});
		}

		setFloatingButtonVisibility(status)
		{
			if (this.showFloatingButton === status)
			{
				return;
			}

			this.showFloatingButton = status;
			this.listSync.updateFloatingButton({
				hide: !status,
			});
			this.requestRender();
		}

		isReady()
		{
			return this.listSync.isReady();
		}

		reload(params = {})
		{
			return this.listSync.reload(params);
		}

		removeItems(items = [])
		{
			return this.listSync.removeItems(items);
		}

		updateItems(items = [])
		{
			return this.listSync.updateItems(items);
		}

		addOrRestoreItems(items = [])
		{
			return this.listSync.addOrRestoreItems(items);
		}

		onListRef = (ref) => {
			this.listSync.bindListRef(ref);
		};

		onListReloaded = (pullToReload) => {
			if (!pullToReload)
			{
				this.listSync.clearRemoved();
			}

			this.onExternalListReloaded(pullToReload);
		};

		onBeforeItemsSetState = (items) => {
			const mailEntities = selectEntities(store.getState());
			const normalizedItems = items.map((item) => MessageModel.prepareReduxMailFromServer(item));

			return normalizedItems.filter(({ id }) => {
				const { isRemoved } = mailEntities[id] || {};

				return Type.isNil(isRemoved) || !isRemoved;
			});
		};

		onBeforeItemsRender = (items) => {
			return items;
		};

		onItemsLoaded = (responseData, context) => {
			this.itemsResponseHandler.handle(responseData, context);
		};

		changeItemsOperations = (...args) => {
			return args[2];
		};

		renderEmptyListComponent = () => {
			return StatusBlock({
				image: Image({
					uri: makeLibraryImagePath('empty-folder-grid-full.png', 'empty-states', 'mail'),
					style: {
						width: 146,
						height: 137,
					},
				}),
				testId: 'empty-state-message-grid',
				description: Loc.getMessage('MAILMOBILE_MESSAGE_GRID_EMPTY_STATE_DESCRIPTION_EMPTY_FOLDER'),
				emptyScreen: false,
				onRefresh: () => {},
			});
		};
	}

	module.exports = { MessageGridListAdapter };
});
