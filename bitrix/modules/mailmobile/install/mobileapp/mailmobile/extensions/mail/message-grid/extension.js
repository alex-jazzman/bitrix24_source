/**
 * @module mail/message-grid
 */
jn.define('mail/message-grid', (require, exports, module) => {
	const { Selector: FolderSelector } = require('mail/folder/selector');

	const {
		MessageGridFilterController,
		MessageGridHeader,
		MessageGridTabs,
		MessageGridSorting,
		MessageGridMoreMenu,
		MessageGridMultiSelectMenu,
		MessageGridGroupActionsMenu,
	} = require('mail/message-grid/navigation');
	const { MessageGridController } = require('mail/message-grid/src/controller');
	const { MessageGridEventBinder } = require('mail/message-grid/src/event-binder');
	const { MessageGridListAdapter } = require('mail/message-grid/src/list-adapter');
	const { MessageGridNavigator } = require('mail/message-grid/src/navigator');
	const { AjaxMethod } = require('mail/const');

	const { MobileFeature } = require('im/messenger/lib/feature');
	const { SearchLayout } = require('layout/ui/search-bar');
	const { BottomPanel } = require('native/bottom-panel');
	const { Box } = require('ui-system/layout/box');
	const { Color } = require('tokens');

	/**
	 * @class MessageGrid
	 */
	class MessageGrid extends LayoutComponent
	{
		constructor(props)
		{
			super(props);

			this.mailboxes = this.props.mailboxes;
			this.parentWidget = props.layout;
			const mailboxId = props.mailboxId ?? 0;
			this.searchMailboxId = mailboxId;

			this.sorting = new MessageGridSorting({
				type: MessageGridSorting.types.RECEIVE_DATE,
				fallbackType: MessageGridSorting.types.ID,
				isASC: false,
			});
			this.moreMenu = new MessageGridMoreMenu({
				selectedSorting: this.sorting.getType(),
				isASC: this.sorting.getIsASC(),
			});
			this.#createSearch({ disablePresets: false });
			this.filterController = new MessageGridFilterController({
				mailboxId,
				search: this.search,
			});

			if (MobileFeature.isNativeBottomPanelApiSupported())
			{
				this.panel = new BottomPanel();
				this.actionMenu = new MessageGridGroupActionsMenu({ parentWidget: this.parentWidget, panel: this.panel });
				this.panel.setComponent(this.actionMenu);
			}
			else
			{
				this.parentWidget.setLeftButtons(this.leftMenuButtons);
				this.multiSelectMenu = new MessageGridMultiSelectMenu({
					parentWidget: this.parentWidget,
				});
			}

			this.folderSelector = new FolderSelector({
				parentWidget: this.parentWidget,
			});
			this.navigator = new MessageGridNavigator({
				parentWidget: this.parentWidget,
			});
			this.tabs = new MessageGridTabs({
				onTabSelected: (tab) => this.controller.handleTabSelected(tab),
			});
			this.listAdapter = new MessageGridListAdapter({
				parentWidget: this.parentWidget,
				sorting: this.sorting,
				filterController: this.filterController,
				getMenuButtons: () => this.rightMenuButtons,
				onOpenMessageChain: this.navigator.openMessageChain,
				onWriteEmail: this.navigator.openWriteEmail,
				onListReloaded: () => this.controller.handleListReloaded(),
				requestRender: () => this.setState({}),
			});
			this.header = new MessageGridHeader({
				parentWidget: this.parentWidget,
				panel: this.panel,
				actionMenu: this.actionMenu,
				multiSelectMenu: this.multiSelectMenu,
				tabs: this.tabs,
				getRightButtons: () => this.rightMenuButtons,
				getLeftButtons: () => this.leftMenuButtons,
				setFloatingButtonVisibility: (isVisible) => this.listAdapter.setFloatingButtonVisibility(isVisible),
			});
			this.controller = new MessageGridController({
				tabs: this.tabs,
				header: this.header,
				filterController: this.filterController,
				listAdapter: this.listAdapter,
				panel: this.panel,
				allIncomeTabId: MessageGridTabs.tabIds.allIncome,
				reloadList: () => this.setState({}, () => this.listAdapter.reload({ skipUseCache: true })),
				recreateSearch: (params) => this.#createSearch(params),
			});
			this.eventBinder = new MessageGridEventBinder({
				parentWidget: this.parentWidget,
				onBindingSent: this.controller.handleBindingSent,
				onMailboxStructureChanged: this.controller.handleMailboxStructureChanged,
				onTabsSelected: this.controller.handleTabsSelected,
				onViewHidden: this.controller.handleViewHidden,
				onOpenFolderMenu: this.navigator.openFolderMenu,
				onVisibleMailboxesChange: this.controller.handleVisibleMailboxesChange,
				onVisibleMailsChange: this.controller.handleVisibleMailsChange,
				onVisibleFoldersChange: this.controller.handleVisibleFoldersChange,
				onPullCallback: this.controller.handlePullCallback,
			});
			this.parentWidget.setBackButtonHandler(() => this.controller.handleSystemBackButton());
		}

		componentDidMount()
		{
			this.controller.syncMailboxes(this.mailboxes);
			this.eventBinder.bind();

			this.header.setInitialTitle();
		}

		componentWillUnmount()
		{
			this.eventBinder.unbind();
			this.controller.destroy();
		}

		render()
		{
			return Box(
				{
					resizableByKeyboard: true,
					backgroundColor: Color.bgPrimary,
				},
				View(
					{
						style: {
							flex: 1,
							backgroundColor: Color.bgPrimary,
						},
					},
					this.tabs.render(),
					this.listAdapter.render(),
				),
			);
		}

		get rightMenuButtons()
		{
			return [
				this.search.getSearchButton(),
				this.folderSelector.getMenuButton(this.navigator.openFolderMenu),
				this.moreMenu.getMenuButton(),
			];
		}

		get leftMenuButtons()
		{
			return [];
		}

		#createSearch({ disablePresets })
		{
			this.search = new SearchLayout({
				layout: this.parentWidget,
				searchDataAction: AjaxMethod.mailGetFilterPresets,
				searchDataActionParams: { mailboxId: this.searchMailboxId },
				onSearch: (searchData) => this.controller.handleSearch(searchData),
				onCancel: (searchData) => this.controller.handleSearch(searchData),
				disablePresets,
			});

			if (this.filterController)
			{
				this.filterController.search = this.search;
			}

			if (this.parentWidget && this.controller)
			{
				this.parentWidget.setRightButtons(this.rightMenuButtons);
			}
		}
	}

	module.exports = { MessageGrid };
});
