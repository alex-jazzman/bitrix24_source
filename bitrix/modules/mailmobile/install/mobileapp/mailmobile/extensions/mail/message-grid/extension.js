/**
 * @module mail/message-grid
 */
jn.define('mail/message-grid', (require, exports, module) => {
	const { Selector: FolderSelector } = require('mail/folder/selector');
	const { DraftAhaMomentController } = require('mail/draft/aha');

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
	const {
		deleteDrafts,
		getDraftSwipeActions,
		MessageGridListAdapter,
		MessageGridMode,
		adaptDraftListResponse,
		adaptDraftToMessageViewModel,
		isDraftPageFullyLoaded,
		prepareDraftListActionParams,
		toggleDraftSelection,
	} = require('mail/message-grid/src/list-adapter');
	const { MessageGridNavigator } = require('mail/message-grid/src/navigator');
	const { AjaxMethod } = require('mail/const');

	const { MobileFeature } = require('im/messenger/lib/feature');
	const { SearchLayout } = require('layout/ui/search-bar');
	const { BottomPanel } = require('native/bottom-panel');
	const { Box } = require('ui-system/layout/box');
	const { Color } = require('tokens');
	const { Loc } = require('loc');

	function switchMessageGridMode({
		currentMode,
		nextMode,
		listAdapter,
		eventBinder,
		setState,
		onModeApplied,
		schedule = (callback) => setTimeout(callback, 0),
	})
	{
		if (nextMode === currentMode)
		{
			return false;
		}

		listAdapter.setMode(nextMode);
		eventBinder.setReduxObserversEnabled(nextMode === MessageGridMode.MESSAGES);
		setState({ mode: nextMode }, () => {
			onModeApplied(nextMode);
			schedule(() => listAdapter.reload({ skipUseCache: true }));
		});

		return true;
	}

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
			this.state = {
				mode: MessageGridMode.MESSAGES,
				isDraftMultiSelectMode: false,
				selectedDraftIds: [],
			};

			this.sorting = new MessageGridSorting({
				type: MessageGridSorting.types.RECEIVE_DATE,
				fallbackType: MessageGridSorting.types.ID,
				isASC: false,
			});
			this.moreMenu = new MessageGridMoreMenu({
				selectedSorting: this.sorting.getType(),
				isASC: this.sorting.getIsASC(),
				isDraftMode: () => this.state.mode === MessageGridMode.DRAFTS,
				onCheckDrafts: this.toggleDraftMultiSelectMode,
			});
			this.#createSearch({ disablePresets: false });
			this.filterController = new MessageGridFilterController({
				mailboxId,
				search: this.search,
			});

			if (MobileFeature.isNativeBottomPanelApiSupported())
			{
				this.panel = new BottomPanel();
				this.actionMenu = new MessageGridGroupActionsMenu({
					parentWidget: this.parentWidget,
					panel: this.panel,
					isDraftMode: () => this.state.mode === MessageGridMode.DRAFTS,
					getDraftSelectedCount: () => this.state.selectedDraftIds.length,
					onRemoveDrafts: this.removeSelectedDrafts,
					onToggleDraftMultiSelectMode: this.toggleDraftMultiSelectMode,
				});
				this.panel.setComponent(this.actionMenu);
			}
			else
			{
				this.parentWidget.setLeftButtons(this.leftMenuButtons);
				this.multiSelectMenu = new MessageGridMultiSelectMenu({
					parentWidget: this.parentWidget,
					isDraftMode: () => this.state.mode === MessageGridMode.DRAFTS,
					onRemoveDrafts: this.removeSelectedDrafts,
					onToggleDraftMultiSelectMode: this.toggleDraftMultiSelectMode,
				});
			}

			this.folderSelector = new FolderSelector({
				parentWidget: this.parentWidget,
			});
			this.draftAhaMomentController = new DraftAhaMomentController();
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
				getDraftSelectionState: this.getDraftSelectionState,
				onToggleDraftSelection: this.toggleDraftSelection,
				onEnterDraftMultiSelectMode: this.enterDraftMultiSelectMode,
				onResetDraftSelection: this.resetDraftSelection,
			});
			this.header = new MessageGridHeader({
				parentWidget: this.parentWidget,
				panel: this.panel,
				actionMenu: this.actionMenu,
				multiSelectMenu: this.multiSelectMenu,
				tabs: this.tabs,
				getRightButtons: () => this.rightMenuButtons,
				getLeftButtons: () => this.leftMenuButtons,
				isDraftMode: () => this.state.mode === MessageGridMode.DRAFTS,
				getDraftSelectedCount: () => this.state.selectedDraftIds.length,
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
				onFeedPostBound: this.controller.handleFeedPostBound,
				onMailboxStructureChanged: this.controller.handleMailboxStructureChanged,
				onTabsSelected: this.controller.handleTabsSelected,
				onViewHidden: this.handleViewHidden,
				onOpenFolderMenu: this.openFolderMenu,
				onVisibleMailboxesChange: this.controller.handleVisibleMailboxesChange,
				onVisibleMailsChange: this.controller.handleVisibleMailsChange,
				onVisibleFoldersChange: this.controller.handleVisibleFoldersChange,
				onLabelsChange: this.controller.handleLabelsChange,
				onPullCallback: this.controller.handlePullCallback,
				onLabelCountersUpdated: this.controller.handleLabelCountersUpdated,
			});
			this.parentWidget.setBackButtonHandler(() => this.controller.handleSystemBackButton());
		}

		componentDidMount()
		{
			this.controller.syncMailboxes(this.mailboxes);
			this.eventBinder.bind();
			this.parentWidget.on('onViewShown', this.handleViewShown);
			this.draftAhaMomentController.mount();

			this.header.setInitialTitle();
		}

		componentWillUnmount()
		{
			this.parentWidget.removeEventListener?.('onViewShown', this.handleViewShown);
			this.draftAhaMomentController.destroy();
			this.eventBinder.unbind();
			this.controller.destroy();
			this.listAdapter.destroy();
			this.moreMenu.destroy();
		}

		handleViewShown = () => {
			this.draftAhaMomentController.onViewShown();
		};

		handleViewHidden = () => {
			this.draftAhaMomentController.onViewHidden();
			this.controller.handleViewHidden();
		};

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
					this.state.mode === MessageGridMode.MESSAGES && this.tabs.render(),
					this.listAdapter.renderMigrationBanner(),
					this.listAdapter.render(),
				),
			);
		}

		get rightMenuButtons()
		{
			return [
				this.search.getSearchButton(),
				this.folderSelector.getMenuButton(this.openFolderMenu),
				this.moreMenu.getMenuButton(),
			];
		}

		openFolderMenu = () => {
			this.navigator.openFolderMenu({
				onModeSelect: this.setMode,
				isDraftsSelected: this.state.mode === MessageGridMode.DRAFTS,
			});
		};

		setMode = (mode) => {
			if (mode !== MessageGridMode.DRAFTS)
			{
				this.resetDraftSelection();
			}

			switchMessageGridMode({
				currentMode: this.state.mode,
				nextMode: mode,
				listAdapter: this.listAdapter,
				eventBinder: this.eventBinder,
				setState: (state, callback) => this.setState(state, callback),
				onModeApplied: (appliedMode) => {
					const isDraftsMode = appliedMode === MessageGridMode.DRAFTS;

					// drafts have no filter presets, and a new search layout drops the previous phrase
					this.#createSearch({ disablePresets: isDraftsMode });

					if (!isDraftsMode)
					{
						// The search layout is recreated empty and without a preset chip, so the message
						// filter is reset whole: a preset kept in the filter alone would be invisible.
						this.filterController.handleSearch({ text: '', presetId: null });
					}

					if (isDraftsMode)
					{
						this.parentWidget.setTitle({
							text: Loc.getMessage('MAILMOBILE_MESSAGE_GRID_DRAFTS_TITLE'),
							type: 'section',
						});
					}
					else
					{
						this.header.updateTitle(true);
					}
				},
			});
		};

		get leftMenuButtons()
		{
			return [];
		}

		getDraftSelectionState = () => {
			return {
				isMultiSelectMode: this.state.isDraftMultiSelectMode,
				selectedIds: this.state.selectedDraftIds,
			};
		};

		toggleDraftMultiSelectMode = () => {
			this.setDraftSelectionState({
				isMultiSelectMode: !this.state.isDraftMultiSelectMode,
				selectedIds: [],
			});
		};

		enterDraftMultiSelectMode = (draftId) => {
			this.setDraftSelectionState({
				isMultiSelectMode: true,
				selectedIds: [draftId],
			});
		};

		resetDraftSelection = () => {
			if (!this.state.isDraftMultiSelectMode && this.state.selectedDraftIds.length === 0)
			{
				return;
			}

			this.setDraftSelectionState({ isMultiSelectMode: false, selectedIds: [] });
		};

		toggleDraftSelection = (draftId) => {
			this.setDraftSelectionState(toggleDraftSelection(this.state.selectedDraftIds, draftId));
		};

		setDraftSelectionState = ({ isMultiSelectMode, selectedIds }) => {
			this.setState({
				isDraftMultiSelectMode: isMultiSelectMode,
				selectedDraftIds: selectedIds,
			}, () => {
				this.actionMenu?.updateDraftSelection();
				this.header.applyMode(!isMultiSelectMode);
			});
		};

		removeSelectedDrafts = () => {
			const draftIds = [...this.state.selectedDraftIds];
			if (draftIds.length === 0)
			{
				return;
			}

			this.setDraftSelectionState({ isMultiSelectMode: false, selectedIds: [] });
			void this.listAdapter.deleteDraftList(draftIds);
		};

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

	module.exports = {
		deleteDrafts,
		getDraftSwipeActions,
		MessageGrid,
		MessageGridMode,
		adaptDraftListResponse,
		adaptDraftToMessageViewModel,
		isDraftPageFullyLoaded,
		prepareDraftListActionParams,
		switchMessageGridMode,
		toggleDraftSelection,
	};
});
