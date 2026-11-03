/**
 * @module mail/message-grid/src/list-adapter
 */
jn.define('mail/message-grid/src/list-adapter', (require, exports, module) => {
	const { PerfPoint } = require('debug/prism');
	const {
		conversationOnboardingEligibilityCapture,
		conversationSettingsState,
	} = require('mail/message-grid/src/conversation-aha');
	const { MessageGridItemsResponseHandler } = require('mail/message-grid/src/items-response-handler');
	const { callAction: callVirtualFolderAction, ALL_MESSAGES } = require('mail/folder/virtual');
	const { ConversationStatefulList } = require('mail/message-grid/src/conversation-stateful-list');
	const { MessageModel } = require('mail/statemanager/redux/slices/messages/model/message');
	const { selectEntities } = require('mail/statemanager/redux/slices/messages/selector');
	const { selectCurrentMailboxId } = require('mail/statemanager/redux/slices/mailboxes/selector');
	const { selectByType } = require('mail/statemanager/redux/slices/folders/selector');
	const { DefaultFolderType } = require('mail/enum/default-folder-type');
	const { ListItemType, ListItemsFactory } = require('mail/simple-list/items');
	const { MessageGridListSync } = require('mail/message-grid/src/list-sync');
	const { MessageGridMigrationBanner } = require('mail/message-grid/src/migration-banner');
	const { promoteConversationRowReplacements } = require('mail/message-grid/src/added-message-plan');
	const { MessageGridCache } = require('mail/message-grid/src/cache');
	const { MailDialog } = require('mail/dialog');
	const { MigrationNotice } = require('mail/dialog/banners/migrationnotice');
	const { MailOpener } = require('mail/opener');
	const { DraftConnector } = require('mail/draft/connector');
	const { AjaxMethod } = require('mail/const');
	const { StatusBlock, makeLibraryImagePath } = require('ui-system/blocks/status-block');
	const store = require('statemanager/redux/store');
	const { Type } = require('type');
	const { Loc } = require('loc');
	const { confirmDestructiveAction } = require('alert');
	const { NotifyManager } = require('notify-manager');
	const { showErrorToast } = require('toast/error');
	const { Color } = require('tokens');

	const PAGE_SIZE = 50;
	const MESSAGE_GRID_KEY = 'message-grid';
	const MessageGridMode = Object.freeze({
		MESSAGES: 'messages',
		DRAFTS: 'drafts',
	});
	const DRAFT_DELETE_ACTION = 'delete-draft';
	const DRAFT_ID_PREFIX = 'd:';
	const DRAFT_DIRECTION_OUTGOING = 2;

	const resolveConversationMailboxId = (...candidates) => {
		for (const candidate of candidates)
		{
			const mailboxId = Number(candidate);
			if (Number.isFinite(mailboxId) && mailboxId > 0)
			{
				return Math.floor(mailboxId);
			}
		}

		return null;
	};

	const isConversationListEnabled = (settings = {}) => (
		settings.featureAvailable === true && settings.enabled !== false
	);

	const isDraftGridId = (gridId) => String(gridId ?? '').startsWith(DRAFT_ID_PREFIX);

	const parseDraftGridId = (gridId) => {
		const rawId = String(gridId ?? '');
		const draftId = Number(rawId.startsWith(DRAFT_ID_PREFIX) ? rawId.slice(DRAFT_ID_PREFIX.length) : rawId);

		return Number.isFinite(draftId) && draftId > 0 ? draftId : null;
	};

	const adaptDraftToMessageViewModel = (draft = {}) => {
		const updatedAtTimestamp = Math.floor(Date.parse(draft.updatedAt) / 1000);

		return {
			id: draft.id,
			revision: draft.revision,
			isDraft: true,
			direction: DRAFT_DIRECTION_OUTGOING,
			to: (draft.recipients ?? []).map((recipient) => ({ customData: recipient })),
			from: draft.sender ? [{ customData: draft.sender }] : [],
			subject: draft.subject,
			abbreviatedText: draft.bodyPreview,
			date: Number.isFinite(updatedAtTimestamp) ? updatedAtTimestamp : 0,
			isRead: true,
			withAttachments: Number(draft.attachmentCount) > 0,
		};
	};

	/** DTO-01. The codes the list of letters draws; every other one belongs to another surface. */
	const MigrationNoticeCode = Object.freeze({
		VARIANT_A: 'mig_a',
		VARIANT_B: 'mig_b',
		BANNER: 'ban_1',
	});

	const MIGRATION_POPUP_CODES = [MigrationNoticeCode.VARIANT_A, MigrationNoticeCode.VARIANT_B];

	function getDraftSwipeActions({ title, color })
	{
		return [{
			identifier: DRAFT_DELETE_ACTION,
			title,
			iconName: 'action_delete',
			color,
		}];
	}

	function prepareDraftListActionParams(actionParams = {}, blockPage)
	{
		return {
			...actionParams,
			page: blockPage ?? 1,
			pageSize: actionParams.pageSize ?? PAGE_SIZE,
			search: normalizeDraftSearch(actionParams.search) || normalizeDraftSearch(actionParams.extra?.search),
		};
	}

	function normalizeDraftSearch(search)
	{
		return typeof search === 'string' ? search.trim() : '';
	}

	function adaptDraftListResponse(response)
	{
		const page = response?.data?.page;

		// Drafts mode also serves conversation pages, and those answer with the grid envelope.
		if (!page)
		{
			return response;
		}

		return {
			...response,
			data: {
				...page,
				items: page.items ?? [],
			},
		};
	}

	function isDraftPageFullyLoaded({ total = 0, page = 1, pageSize = PAGE_SIZE } = {})
	{
		return page * pageSize >= total;
	}

	function isDraftRow(item)
	{
		return item?.isDraft === true;
	}

	function isPreparedMessageRow(item)
	{
		return Number.isFinite(Number(item?.id))
			&& Number.isFinite(Number(item?.mailboxId))
			&& item?.message === undefined
		;
	}

	function getMessageGridModeCapabilities(mode)
	{
		const isDrafts = mode === MessageGridMode.DRAFTS;

		return {
			syncResponseToRedux: !isDrafts,
			observeMessageRedux: !isDrafts,
			allowBulkActions: true,
			allowMessageActions: !isDrafts,
		};
	}

	function toggleDraftSelection(selectedIds, draftId)
	{
		const nextSelectedIds = selectedIds.includes(draftId)
			? selectedIds.filter((id) => id !== draftId)
			: [...selectedIds, draftId]
		;

		return {
			isMultiSelectMode: nextSelectedIds.length > 0,
			selectedIds: nextSelectedIds,
		};
	}

	async function deleteDrafts(connector, draftIds)
	{
		try
		{
			const response = await connector.deleteMany({ draftIds }, { handleErrors: false });
			const deletedIds = response?.data?.deletedIds ?? [];
			const failedIds = response?.data?.failedIds
				?? draftIds.filter((draftId) => !deletedIds.includes(draftId));

			return { deletedIds, failedIds };
		}
		catch
		{
			return { deletedIds: [], failedIds: [...draftIds] };
		}
	}

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
			getDraftSelectionState = () => ({ isMultiSelectMode: false, selectedIds: [] }),
			onToggleDraftSelection = () => {},
			onEnterDraftMultiSelectMode = () => {},
			onResetDraftSelection = () => {},
			pageSize = PAGE_SIZE,
			mode = MessageGridMode.MESSAGES,
			getConversationState = () => store.getState(),
			loadConversationItems = null,
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
			this.getDraftSelectionState = getDraftSelectionState;
			this.onToggleDraftSelection = onToggleDraftSelection;
			this.onEnterDraftMultiSelectMode = onEnterDraftMultiSelectMode;
			this.onResetDraftSelection = onResetDraftSelection;
			this.pageSize = pageSize;
			this.mode = mode;
			this.getConversationState = getConversationState;
			this.loadConversationItems = loadConversationItems
				?? ((request, label) => this.#loadConversationItems(request, label));
			this.conversationRuntime = null;
			this.loadedListGrouped = false;
			this.conversationLoadFallbackStarted = false;
			this.isDestroyed = false;
			conversationSettingsState.set({});
			this.draftConnector = new DraftConnector();
			this.shouldRefreshDraftsOnShow = false;
			this.parentWidget?.on('onViewShown', this.onViewShown);

			this.showFloatingButton = false;
			this.listSync = new MessageGridListSync();
			this.migrationPopupShownFor = '';
			this.migrationBanner = new MessageGridMigrationBanner({
				onDecision: (decision) => this.showMigrationNotice(decision),
				onChange: () => this.requestRender(),
				parentWidget: this.parentWidget,
			});
			this.itemsResponseHandler = new MessageGridItemsResponseHandler({
				cache: new MessageGridCache(),
				filterController: this.filterController,
				onMailboxAvailable: () => this.setFloatingButtonVisibility(true),
				onProviderRestriction: (provider, mailboxId) => this.showProviderRestrictionBanner(provider, mailboxId),
				onMigrationNotice: (payload) => this.showMigrationNotice(MigrationNotice.readDecision(payload)),
				// A label deleted on the web (the domain stays on) leaves the grid in the label mode
				// without a label; switch back to all messages so the folders observer reloads the list.
				onStaleLabel: () => callVirtualFolderAction(ALL_MESSAGES),
			});
		}

		activateConversationExtension = (extension) =>
		{
			if (this.isDestroyed)
			{
				throw new Error('The mail grid was destroyed before the conversation runtime loaded.');
			}

			if (this.conversationRuntime !== null)
			{
				return;
			}

			const Runtime = extension?.MessageGridConversationRuntime;
			if (typeof Runtime !== 'function')
			{
				throw new Error('The mail conversation runtime is unavailable.');
			}

			this.conversationRuntime = new Runtime({
				getRequestContext: () => this.getConversationRequestContext(),
				loadItems: (request, label = null) => this.loadConversationItems(
					request,
					label ?? (request.cursor === null ? 'first page' : 'next page'),
				),
				reload: (params) => this.reload(params),
				updateItems: (items) => this.updateItems(items),
				getState: this.getConversationState,
			});
			this.itemsResponseHandler.setConversationRuntime(this.conversationRuntime);
		};

		handleConversationExtensionFailure = (error) =>
		{
			// eslint-disable-next-line no-console
			console.error('MessageGridListAdapter: conversation extension loading failed.', error);
			if (this.isDestroyed || this.conversationLoadFallbackStarted)
			{
				return;
			}

			this.conversationLoadFallbackStarted = true;
			showErrorToast({}, this.parentWidget);
			this.messageLoadParams = {
				...(this.messageLoadParams ?? {}),
				cursor: null,
				supportsGroupedRows: false,
			};

			return Promise.resolve()
				.then(() => this.reload({
					skipUseCache: true,
					actionParams: { loadItems: this.messageLoadParams },
				}))
				.finally(() => {
					this.conversationLoadFallbackStarted = false;
				})
			;
		};

		async #loadConversationItems(request, label)
		{
			const perfPoint = new PerfPoint('Mail Conversation Expansion', label).start();

			try
			{
				const response = await BX.ajax.runAction(
					AjaxMethod.getConversationItems,
					{ data: request },
				);

				return response.data;
			}
			finally
			{
				perfPoint.end();
			}
		}

		getConversationRequestContext()
		{
			const mailboxId = resolveConversationMailboxId(this.messageLoadParams?.mailboxId)
				?? resolveConversationMailboxId(selectCurrentMailboxId(this.getConversationState()));

			return {
				mailboxId,
				filterParams: this.messageLoadParams?.filterParams ?? {},
				sort: this.messageLoadParams?.sort,
				virtualFolderKey: this.messageLoadParams?.virtualFolderKey,
			};
		}

		async syncExpandedConversations(conversationIds = [])
		{
			await this.conversationRuntime?.syncExpanded(conversationIds);
		}

		onToggleConversation = (conversationId) => this.conversationRuntime?.toggle(conversationId);

		onRetryConversation = (conversationId) => this.conversationRuntime?.retry(conversationId);

		onLoadMoreConversation = (conversationId) => this.conversationRuntime?.loadMore(conversationId);

		showProviderRestrictionBanner(provider, mailboxId)
		{
			MailDialog.show({
				type: MailDialog.PROVIDER_RESTRICTION,
				provider,
				mailboxId,
				parentWidget: this.parentWidget,
			});
		}

		/**
		 * The display point of the migration messages (BAN-1, MIG-A, MIG-B). Which of them is due the
		 * code of the decision says, and there is no code that means all of them: a decision with
		 * nothing to show takes the banner off the screen and opens nothing.
		 *
		 * @param {MigrationNoticeDecision|null} decision
		 */
		showMigrationNotice(decision)
		{
			const code = decision?.code ?? '';

			this.migrationBanner.setDecision(code === MigrationNoticeCode.BANNER ? decision : null);

			if (MIGRATION_POPUP_CODES.includes(code))
			{
				this.showMigrationPopup(decision);
			}
		}

		/**
		 * The popup opens once per message and per visit to the section. It stands until the person is
		 * done with it, so the list under it goes on loading and every load brings the same message back
		 * with a token of its own - and a second popup over the first is no repeat the person asked for.
		 * The message is therefore remembered by what it is about and not by the token it came with.
		 *
		 * @param {MigrationNoticeDecision} decision
		 */
		showMigrationPopup(decision)
		{
			const opened = `${decision.code}:${decision.mailboxId ?? 0}`;
			if (this.migrationPopupShownFor === opened)
			{
				return;
			}

			this.migrationPopupShownFor = opened;

			MailDialog.show({
				type: MailDialog.MIGRATION_NOTICE,
				decision,
				parentWidget: this.parentWidget,
			});
		}

		/**
		 * The mode of the list is not looked at here, drafts included: whether the banner is due at all
		 * is the server's to say (BAN-1), and a condition on the mode would be a rule of the display
		 * kept on the client beside it.
		 */
		renderMigrationBanner()
		{
			return this.migrationBanner.render();
		}

		render()
		{
			if (this.isDraftsMode() && !this.shouldUseConversationList())
			{
				return this.renderDrafts();
			}

			return this.renderMessageList();
		}

		/**
		 * One list serves both grid modes: in drafts mode the conversation page carries the drafts
		 * of the folder, so the affordances of a draft row travel with it.
		 */
		renderMessageList()
		{
			const isDrafts = this.isDraftsMode();
			const { isMultiSelectMode, selectedIds } = this.getDraftSelectionState();
			const withDraftSwipe = isDrafts && !isMultiSelectMode;

			return new ConversationStatefulList({
				key: MESSAGE_GRID_KEY,
				isFloatingButtonAccent: true,
				layout: this.parentWidget,
				ref: this.onListRef,
				testId: isDrafts ? 'message-grid-drafts' : 'message-grid',
				getVoiceContext: () => ({
					module: 'mail',
					screen: this.isDraftsMode() ? 'mail.draft.list' : 'mail.message.list',
					filter: this.isDraftsMode()
						? { search: this.getDraftSearch() }
						: this.filterController.getActionParams().loadItems,
				}),
				useCache: false,
				needInitMenu: true,
				showAirStyle: true,
				isShowFloatingButton: this.showFloatingButton,
				onListReloaded: this.onListReloaded,
				onFloatingButtonClick: this.onWriteEmail,
				sortingConfig: isDrafts ? null : this.sorting.getSortingConfig(),
				onBeforeItemsSetState: this.onBeforeItemsSetState,
				onBeforeItemsRender: this.onBeforeItemsRender,
				getEmptyListComponent: isDrafts
					? this.renderDraftsEmptyListComponent
					: this.renderEmptyListComponent,
				menuButtons: this.getMenuButtons(),
				itemFactory: ListItemsFactory,
				itemDetailOpenHandler: this.onOpenGridItem,
				itemType: ListItemType.MESSAGE,
				itemParams: {
					...(isDrafts
						? {
							isMultiSelectMode,
							selectedIds,
							onToggleDraftSelection: this.onToggleDraftSelection,
							onEnterDraftMultiSelectMode: this.onEnterDraftMultiSelectMode,
						}
						: {}),
					onToggleConversation: this.onToggleConversation,
					onRetryConversation: this.onRetryConversation,
					onLoadMoreConversation: this.onLoadMoreConversation,
				},
				actionsForItem: withDraftSwipe ? this.getGridSwipeActions : null,
				onActionClick: withDraftSwipe ? this.onDraftActionClick : null,
				itemsLoadLimit: this.pageSize,
				actions: {
					loadItems: AjaxMethod.mailGetList,
				},
				actionCallbacks: {
					loadItems: this.onActionItemsLoaded,
				},
				actionParams: this.getMessageActionParams(),
				needCloneActionParams: false,
				getRequestNavigation: this.getMessageRequestNavigation,
				isAllItemsLoaded: this.isMessagePageFullyLoaded,
				onGridResponseReady: this.onItemsLoaded,
				onConversationExtensionLoaded: this.activateConversationExtension,
				onConversationExtensionFailed: this.handleConversationExtensionFailure,
				actionResponseAdapter: this.adaptActionResponse,
				changeItemsOperations: this.changeItemsOperations,
			});
		}

		shouldUseConversationList()
		{
			return isConversationListEnabled(conversationSettingsState.get());
		}

		/**
		 * Whether the rows currently shown came as a conversation page.
		 */
		isGroupedListLoaded()
		{
			return this.loadedListGrouped;
		}

		getMessageActionParams()
		{
			const actionParams = this.filterController.getActionParams();
			const loadItems = actionParams.loadItems;

			loadItems.sort = {
				field: this.sorting.getType(),
				direction: this.sorting.getIsASC() ? 'asc' : 'desc',
			};
			loadItems.cursor = null;

			if (this.isDraftsMode())
			{
				const draftsFolder = selectByType(store.getState(), DefaultFolderType.DRAFTS.value, true);
				loadItems.tabId = null;
				loadItems.presetId = null;
				loadItems.virtualFolderKey = null;
				loadItems.filterParams = {
					...(draftsFolder?.path ? { DIR: draftsFolder.path } : {}),
					...(this.getDraftSearch() ? { FIND: this.getDraftSearch() } : {}),
				};
			}

			this.messageLoadParams = loadItems;

			return { loadItems: this.messageLoadParams };
		}

		/**
		 * A conversation page is walked by the server cursor, a plain page by its own offset; the
		 * page size travels with both.
		 */
		getMessageRequestNavigation = ({ blockPage, defaultNavigation }) => {
			this.messageLoadParams.cursor = this.conversationRuntime?.resolvePageCursor(blockPage) ?? null;

			return defaultNavigation;
		};

		isMessagePageFullyLoaded = ({ response, items }) => (
			response?.grouped === true
				? (response.nextCursor ?? null) === null
				: items.length < this.pageSize
		);

		renderDrafts()
		{
			const draftActionParams = this.getDraftActionParams();
			const { isMultiSelectMode, selectedIds } = this.getDraftSelectionState();

			return new ConversationStatefulList({
				key: MESSAGE_GRID_KEY,
				isFloatingButtonAccent: true,
				layout: this.parentWidget,
				ref: this.onListRef,
				testId: 'message-grid-drafts',
				getVoiceContext: () => ({
					module: 'mail',
					screen: 'mail.draft.list',
					filter: { search: this.getDraftSearch() },
				}),
				useCache: false,
				needInitMenu: true,
				menuButtons: this.getMenuButtons(),
				showAirStyle: true,
				isShowFloatingButton: this.showFloatingButton,
				onListReloaded: this.onListReloaded,
				onFloatingButtonClick: this.onWriteEmail,
				getEmptyListComponent: this.renderDraftsEmptyListComponent,
				itemFactory: ListItemsFactory,
				itemDetailOpenHandler: this.openDraft,
				itemType: ListItemType.MESSAGE,
				itemParams: {
					isMultiSelectMode,
					selectedIds,
					onToggleDraftSelection: this.onToggleDraftSelection,
					onEnterDraftMultiSelectMode: this.onEnterDraftMultiSelectMode,
				},
				actionsForItem: isMultiSelectMode ? null : this.getDraftSwipeActions,
				onActionClick: isMultiSelectMode ? null : this.onDraftActionClick,
				itemsLoadLimit: this.pageSize,
				actions: { loadItems: AjaxMethod.mailDraftList },
				actionParams: draftActionParams,
				needCloneActionParams: false,
				getRequestNavigation: ({ blockPage }) => {
					Object.assign(
						this.draftLoadParams,
						prepareDraftListActionParams(this.draftLoadParams, blockPage),
					);

					return {};
				},
				actionResponseAdapter: this.adaptActionResponse,
				onBeforeItemsSetState: (items) => items.map(adaptDraftToMessageViewModel),
				isAllItemsLoaded: ({ response }) => isDraftPageFullyLoaded(response),
			});
		}

		setMode(mode)
		{
			if (mode !== this.mode)
			{
				this.resetDraftSearch();
			}

			this.mode = mode;
		}

		isDraftsMode()
		{
			return this.mode === MessageGridMode.DRAFTS;
		}

		/**
		 * A mode switch only updates the props of the mounted list, while StatefulList keeps the
		 * adapter it received on construction. So both modes pass this very function and the mode
		 * is resolved when a response arrives.
		 */
		adaptActionResponse = (response) => (
			this.isDraftsMode() ? adaptDraftListResponse(response) : response
		);

		/**
		 * Request data of StatefulList is the very object passed as actionParams.loadItems,
		 * so the reference is kept stable: getRequestNavigation writes pagination into it.
		 * @returns {{ loadItems: object }}
		 */
		getDraftActionParams()
		{
			if (!this.draftLoadParams)
			{
				this.draftLoadParams = { page: 1, pageSize: this.pageSize, search: '' };
			}

			return { loadItems: this.draftLoadParams };
		}

		getDraftSearch()
		{
			return normalizeDraftSearch(this.draftLoadParams?.search);
		}

		hasDraftSearch()
		{
			return this.getDraftSearch() !== '';
		}

		applyDraftSearch = ({ text = '' } = {}) => {
			const search = normalizeDraftSearch(text);
			const actionParams = this.getDraftActionParams();

			if (normalizeDraftSearch(actionParams.loadItems.search) === search)
			{
				return null;
			}

			actionParams.loadItems.search = search;
			actionParams.loadItems.page = 1;

			// The phrase is kept in one place, but a conversation page of drafts is asked for by
			// the request of the grid, so the reload has to carry that request and not this one.
			return this.reload({
				skipUseCache: true,
				actionParams: this.shouldUseConversationList() ? this.getMessageActionParams() : actionParams,
			});
		};

		resetDraftSearch()
		{
			if (!this.draftLoadParams)
			{
				return;
			}

			this.draftLoadParams.search = '';
			this.draftLoadParams.page = 1;
		}

		openDraft = (rowId) => {
			const draftId = parseDraftGridId(rowId);
			if (draftId === null)
			{
				return;
			}

			this.shouldRefreshDraftsOnShow = true;
			MailOpener.openSend({ isCrmMessage: false, draftId });
		};

		/**
		 * A conversation page mixes messages and drafts, so the row decides which screen opens.
		 */
		onOpenGridItem = (rowId, ...params) => {
			if (isDraftGridId(rowId))
			{
				this.openDraft(rowId);

				return;
			}

			this.onOpenMessageChain(rowId, ...params);
		};

		onViewShown = () => {
			if (this.mode === MessageGridMode.DRAFTS && this.shouldRefreshDraftsOnShow)
			{
				this.shouldRefreshDraftsOnShow = false;
				this.reload({ skipUseCache: true });
			}
		};

		confirmDeleteDraft = (draftId) => {
			confirmDestructiveAction({
				title: Loc.getMessage('MAILMOBILE_MESSAGE_GRID_DRAFT_DELETE_TITLE'),
				description: Loc.getMessage('MAILMOBILE_MESSAGE_GRID_DRAFT_DELETE_TEXT'),
				destructionText: Loc.getMessage('MAILMOBILE_MESSAGE_GRID_DRAFT_DELETE'),
				cancelText: Loc.getMessage('MAILMOBILE_MESSAGE_GRID_DRAFT_CANCEL'),
				onDestruct: () => this.deleteDraft(draftId),
			});
		};

		getDraftSwipeActions = () => getDraftSwipeActions({
			title: Loc.getMessage('MAILMOBILE_MESSAGE_GRID_DRAFT_DELETE'),
			color: Color.accentMainAlert.toHex(),
		});

		/**
		 * Only a draft row of the page is swiped away; a conversation keeps its own actions.
		 */
		getGridSwipeActions = (item) => (isDraftRow(item?.data ?? item) ? this.getDraftSwipeActions() : []);

		onDraftActionClick = (event) => {
			if (event?.action?.identifier !== DRAFT_DELETE_ACTION)
			{
				return;
			}

			const draftId = parseDraftGridId(event?.item?.id ?? event?.item?.data?.id);
			if (draftId !== null)
			{
				this.confirmDeleteDraft(draftId);
			}
		};

		deleteDraft(draftId)
		{
			void this.deleteDraftList([draftId]);
		}

		/**
		 * @param {Array<number|string>} rowIds selected rows, plain draft ids or `d:{draftId}`
		 */
		async deleteDraftList(rowIds)
		{
			const draftIds = rowIds.map(parseDraftGridId).filter((draftId) => draftId !== null);
			if (draftIds.length === 0)
			{
				return;
			}

			NotifyManager.showLoadingIndicator();

			try
			{
				const { failedIds } = await deleteDrafts(this.draftConnector, draftIds);
				await this.reload({ skipUseCache: true });

				if (failedIds.length > 0)
				{
					showErrorToast({
						message: Loc.getMessage('MAILMOBILE_MESSAGE_GRID_DRAFT_DELETE_ERROR'),
					}, this.parentWidget);
				}
			}
			finally
			{
				NotifyManager.hideLoadingIndicatorWithoutFallback();
			}
		}

		destroy()
		{
			this.isDestroyed = true;
			this.conversationRuntime?.destroy();
			this.parentWidget?.removeEventListener('onViewShown', this.onViewShown);
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

			if (this.isDraftsMode())
			{
				// a reloaded list may no longer show the selected drafts, so the selection is dropped
				this.onResetDraftSelection();
			}

			this.onExternalListReloaded(pullToReload);
		};

		onBeforeItemsSetState = (items) => {
			const mailEntities = selectEntities(store.getState());
			const grouped = this.isGroupedListLoaded();

			return items
				.map((item) => this.#toListRow(item, grouped))
				.filter((row) => row !== null)
				.filter(({ id }) => {
					const { isRemoved } = mailEntities[id] || {};

					return Type.isNil(isRemoved) || !isRemoved;
				});
		};

		/**
		 * Row of the list for a server item of the current page: a conversation summary and a draft
		 * are drawn from the row itself, a message from its numeric model.
		 *
		 * @param {GridItem} item
		 * @param {boolean} grouped whether the page came grouped
		 * @return {object|null} null for a row type this client does not know
		 */
		#toListRow(item, grouped)
		{
			// Redux observers send prepared message models back to StatefulList. A grouped server
			// envelope has `message`; routing its prepared model as an envelope again removes the row.
			if (grouped && isPreparedMessageRow(item))
			{
				return item;
			}

			const routed = grouped
				? this.conversationRuntime?.routeGridItem(item)
				: { kind: 'message', row: item }
			;

			if (!routed)
			{
				return null;
			}

			if (routed.kind === 'message')
			{
				return MessageModel.prepareReduxMailFromServer(routed.row);
			}

			if (routed.kind === 'conversation')
			{
				return { ...routed.row, itemType: ListItemType.CONVERSATION };
			}

			return routed.row;
		}

		onBeforeItemsRender = (items) => {
			return items;
		};

		onItemsLoaded = (responseData, context) => {
			this.loadedListGrouped = responseData?.grouped === true;
			const eligibilityCandidate = responseData?.conversationOnboardingEligibilityCandidate;
			if (typeof eligibilityCandidate === 'boolean')
			{
				void conversationOnboardingEligibilityCapture.schedule(
					eligibilityCandidate,
					(candidate) => BX.ajax.runAction(
						AjaxMethod.captureConversationOnboardingEligibility,
						{ data: { hadPreviousMailbox: candidate } },
					),
				).catch(() => {});
			}

			const wasConversationList = this.shouldUseConversationList();
			conversationSettingsState.set(responseData?.settings);
			const actionParams = this.messageLoadParams ?? this.filterController.getActionParams().loadItems;
			const mailboxId = resolveConversationMailboxId(
				actionParams.mailboxId,
				responseData?.currentMailboxId,
			) ?? resolveConversationMailboxId(selectCurrentMailboxId(store.getState()));
			const contextKey = this.conversationRuntime?.buildContextKey({
				mailboxId,
				folderPath: actionParams.filterParams?.DIR,
				virtualFolderKey: actionParams.virtualFolderKey,
				filterParams: actionParams.filterParams,
				sort: actionParams.sort,
				grouped: Boolean(responseData?.grouped),
				settings: responseData?.settings,
			}) ?? null;

			this.itemsResponseHandler.handle(responseData, context, contextKey);

			// The setting of the response decides which list the drafts mode shows next.
			if (this.isDraftsMode() && wasConversationList !== this.shouldUseConversationList())
			{
				this.requestRender();
			}
		};

		onActionItemsLoaded = (responseData, context, config) => {
			if (config === undefined)
			{
				this.onItemsLoaded(responseData, context);
			}
		};

		getExpandedConversationIds()
		{
			return this.conversationRuntime?.getExpandedIds() ?? [];
		}

		filterTopLevelAddedMessages(messages = [])
		{
			return this.conversationRuntime?.filterTopLevelAddedMessages(messages) ?? messages;
		}

		invalidateConversations({ clear = false } = {})
		{
			this.conversationRuntime?.invalidate({ clear });
		}

		changeItemsOperations = (...args) => {
			return promoteConversationRowReplacements(args[2]);
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

		renderDraftsEmptyListComponent = ({ isSearchEnabled } = {}) => {
			const isSearchActive = Boolean(isSearchEnabled) || this.hasDraftSearch();

			return StatusBlock({
				testId: isSearchActive ? 'message-grid-drafts-search-empty' : 'message-grid-drafts-empty',
				emptyScreen: true,
				title: Loc.getMessage(
					isSearchActive
						? 'MAILMOBILE_MESSAGE_GRID_DRAFT_SEARCH_EMPTY_TITLE'
						: 'MAILMOBILE_MESSAGE_GRID_DRAFT_EMPTY_TITLE',
				),
				description: Loc.getMessage(
					isSearchActive
						? 'MAILMOBILE_MESSAGE_GRID_DRAFT_SEARCH_EMPTY_TEXT'
						: 'MAILMOBILE_MESSAGE_GRID_DRAFT_EMPTY_TEXT',
				),
			});
		};
	}

	module.exports = {
		deleteDrafts,
		getDraftSwipeActions,
		MessageGridListAdapter,
		MessageGridMode,
		MigrationNoticeCode,
		adaptDraftListResponse,
		adaptDraftToMessageViewModel,
		getMessageGridModeCapabilities,
		isDraftPageFullyLoaded,
		prepareDraftListActionParams,
		toggleDraftSelection,
	};
});
