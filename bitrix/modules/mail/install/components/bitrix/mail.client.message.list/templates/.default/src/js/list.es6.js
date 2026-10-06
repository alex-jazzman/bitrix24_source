import { EventEmitter } from "main.core.events";
import { Dom, Event, Loc, Reflection, Runtime, Type } from 'main.core';
import { AirButtonStyle, Button, ButtonSize } from 'ui.buttons';
import { withFavoritesSection, withoutFavoritesSection, isFavoritesSectionUrl } from 'mail.favorites-filter-state';
import { getMigrationState } from 'mail.migration-state';

const DRAFTS_SECTION = 'drafts';
const LABEL_SCOPE_ALL_MAILBOXES = 0;
const LABELS_SLIDER_URL = '/mail/labels';
const LABEL_ITEM_ID_PREFIX = 'mail-label-';
const ACTION_PANEL_MENU_ID = 'ui-action-panel-item-popup-menu';
const ACTION_PANEL_POPUP_ID = `menu-popup-${ACTION_PANEL_MENU_ID}`;

export class List
{
	constructor(options)
	{
		this.gridId = options.gridId;
		this.filterId = options.filterId;
		this.isDraftMode = options.isDraftMode === true;
		this.composePath = options.composePath || '';
		this.composeSliderOptions = options.composeSliderOptions || { cacheable: false };
		this.draftsPath = options.draftsPath || '';
		this.messageListPath = options.messageListPath || '';
		this.favoritesSectionActive = options.favoritesSectionActive === true;
		// the section is a part of the list improvements, and the server applies its marker only
		// under them: with the improvements off the same marker in the address means nothing here
		this.listImprovementsEnabled = Loc.getMessage('MAIL_LIST_IMPROVEMENTS_ENABLED') === 'Y';
		this.folderBehindFavoritesSection = '';
		this.draftDeleteConfirm = options.draftDeleteConfirm || '';
		this.draftDeleteDescription = options.draftDeleteDescription || '';
		this.draftDeleteManyConfirm = options.draftDeleteManyConfirm || '';
		this.draftDeleteManyDescription = options.draftDeleteManyDescription || '';
		this.draftDeleteButton = options.draftDeleteButton || '';
		this.draftCancelButton = options.draftCancelButton || '';
		this.draftDeletePartialError = options.draftDeletePartialError || '';
		this.mailboxId = options.mailboxId;
		this.canMarkSpam = options.canMarkSpam;
		this.canDelete = options.canDelete;
		this.mailboxCanDelete = options.mailboxCanDelete ?? {};
		this.mailboxCanMarkSpam = options.mailboxCanMarkSpam ?? {};
		this.ERROR_CODE_CAN_NOT_DELETE = options.ERROR_CODE_CAN_NOT_DELETE;
		this.ERROR_CODE_CAN_NOT_MARK_SPAM = options.ERROR_CODE_CAN_NOT_MARK_SPAM;
		this.disabledClassName = 'js-disabled';
		this.migrationActiveMailboxIds = new Set();
		this.migrationActionIds = options.migrationActionIds ?? [];
		this.migrationMailboxIds = options.migrationMailboxIds ?? [Number(this.mailboxId)];
		this.migrationStates = new Map();
		this.migrationStateUnsubscribes = [];
		this.migrationStatesInitialized = false;
		this.migrationStatesDestroyed = false;
		this.migrationPageLeaveHandler = null;
		this.migrationActionPreviousState = new Map();
		this.modifiedDraftSliders = new Set();
		this.closedDraftSliders = new Map();
		this.userInterfaceManager = new BX.Mail.Client.Message.List.UserInterfaceManager(options);
		this.userInterfaceManager.resetGridSelection = this.resetGridSelection.bind(this);
		this.userInterfaceManager.isSelectedRowsHaveClass = this.isSelectedRowsHaveClass.bind(this);
		this.userInterfaceManager.getGridInstance = this.getGridInstance.bind(this);
		this.userInterfaceManager.updateCountersFromBackend = this.updateCountersFromBackend.bind(this);
		this.cache = {};
		this.isAssignMenuOpening = false;

		const labelCore = (BX.Mail && BX.Mail.Label && BX.Mail.Label.Core) ? BX.Mail.Label.Core : null;
		this.labelCollection = labelCore ? new labelCore.LabelCollection(options.labels || []) : null;
		this.labelsVersion = 0;

		this.addEventHandlers();
		this.initDraftsSection();
		if (!this.isDraftMode)
		{
			setTimeout(() => this.initClientDraftList());
			// the sections live in the address, so history navigation drives them even
			// on portals where the embedded draft list is off
			Event.bind(window, 'popstate', () => this.handleHistoryChange());
		}

		if (this.labelCollection)
		{
			this.subscribeLabelsSliderClose();
		}

		BX.Mail.Client.Message.List[options.id] = this;
		BX.Mail.Client.Message.List.confirmDeleteSelectedDrafts = this.confirmDeleteSelectedDrafts.bind(this);
		Reflection.namespace('BX.Mail.Home').MessageList = this;

		if (!this.isDraftMode)
		{
			this.migrationPageLeaveHandler = () => this.destroyMigrationStates();
			Event.bind(window, 'pagehide', this.migrationPageLeaveHandler);
			const initializations = [];
			this.migrationMailboxIds.forEach((mailboxId) => {
				const normalizedMailboxId = Number(mailboxId);
				if (!Number.isInteger(normalizedMailboxId) || normalizedMailboxId <= 0)
				{
					return;
				}

				const migrationState = getMigrationState(normalizedMailboxId);
				this.migrationStates.set(normalizedMailboxId, migrationState);
				this.migrationStateUnsubscribes.push(migrationState.subscribe((change) => {
					this.setMailboxMigrationActive(
						normalizedMailboxId,
						change.active,
						this.migrationStatesInitialized,
					);
				}));
				this.setMailboxMigrationActive(normalizedMailboxId, migrationState.isActive(), false);
				initializations.push(migrationState.initialize());
			});
			void Promise.all(initializations).then(() => {
				if (this.migrationStatesDestroyed)
				{
					return;
				}

				this.migrationActiveMailboxIds.clear();
				this.migrationStates.forEach((migrationState, mailboxId) => {
					if (migrationState.isActive())
					{
						this.migrationActiveMailboxIds.add(mailboxId);
					}
				});
				this.migrationStatesInitialized = true;
				this.applyMigrationStateToGrid();
			});
		}
	};

	setMailboxMigrationActive(mailboxId, active, applyToGrid = true)
	{
		const wasActive = this.migrationActiveMailboxIds.has(mailboxId);
		if (active === true)
		{
			this.migrationActiveMailboxIds.add(mailboxId);
		}
		else
		{
			this.migrationActiveMailboxIds.delete(mailboxId);
		}
		if (applyToGrid)
		{
			this.applyMigrationStateToGrid(wasActive && !active);
		}
	}

	applyMigrationStateToGrid(resetSelection = false)
	{
		BX.Mail.Home.Grid?.setMigrationLocked(this.migrationActiveMailboxIds);
		if (resetSelection)
		{
			BX.Mail.Home.Grid?.resetGridSelection();
		}
		this.syncMigrationActionPanel();
	}

	destroyMigrationStates()
	{
		if (this.migrationStatesDestroyed)
		{
			return;
		}

		this.migrationStatesDestroyed = true;
		this.migrationStateUnsubscribes.forEach((unsubscribe) => unsubscribe());
		this.migrationStateUnsubscribes = [];
		this.migrationStates.clear();
		if (this.migrationPageLeaveHandler)
		{
			Event.unbind(window, 'pagehide', this.migrationPageLeaveHandler);
			this.migrationPageLeaveHandler = null;
		}
	}

	syncMigrationActionPanel()
	{
		const panel = BX.Mail.Home.Grid?.getPanel();
		if (!panel)
		{
			return;
		}

		const selectedIds = this.getGridInstance()?.getRows().getSelectedIds() ?? [];
		const hasSelection = selectedIds.length > 0;
		const migrationSelected = BX.Mail.Home.Grid?.areAllRowsSelected?.() === true
			? this.shouldRefuseMigrationActionForMessageIds(['all'])
			: this.shouldRefuseMigrationActionForMessageIds(selectedIds)
		;
		this.migrationActionIds.forEach((actionId) => {
			const item = panel.getItemById?.(actionId);
			if (!item)
			{
				return;
			}

			if (migrationSelected)
			{
				if (!this.migrationActionPreviousState.has(actionId))
				{
					this.migrationActionPreviousState.set(actionId, item.isDisabled());
				}
				item.disable();
				item.layout?.container?.setAttribute(
					'title',
					Loc.getMessage('MAIL_MESSAGE_LIST_MIGRATION_ACTION_UNAVAILABLE'),
				);

				return;
			}

			if (this.migrationActionPreviousState.has(actionId))
			{
				if (this.migrationActionPreviousState.get(actionId) === false && hasSelection)
				{
					item.enable();
				}
				else
				{
					item.disable();
				}
				this.migrationActionPreviousState.delete(actionId);
			}
			if (item.layout?.container)
			{
				item.layout.container.setAttribute('title', item.title || item.text || '');
			}
		});
	}

	hasActiveMigrationForMessageIds(messageIds)
	{
		if (this.migrationActiveMailboxIds.size === 0)
		{
			return false;
		}
		if (messageIds.includes('all'))
		{
			return true;
		}

		return messageIds.some((messageId) => (
			this.migrationActiveMailboxIds.has(this.getRowMailboxId(messageId))
		));
	}

	shouldRefuseMigrationActionForMessageIds(messageIds)
	{
		const mailboxIds = messageIds.includes('all')
			? [...this.migrationStates.keys()]
			: messageIds.map((messageId) => this.getRowMailboxId(messageId))
		;

		return mailboxIds.some((mailboxId) => {
			const migrationState = this.migrationStates.get(mailboxId);

			return migrationState !== undefined
				&& (!migrationState.isInitialized() || migrationState.isActive())
			;
		});
	}

	refuseMigrationAction(id)
	{
		const messageIds = id === undefined
			? (BX.Mail.Home.Grid?.areAllRowsSelected?.() === true
				? ['all']
				: this.getGridInstance().getRows().getSelectedIds())
			: [id]
		;
		if (!this.shouldRefuseMigrationActionForMessageIds(messageIds))
		{
			return false;
		}

		this.notify(Loc.getMessage('MAIL_MESSAGE_LIST_MIGRATION_ACTION_UNAVAILABLE'));

		return true;
	}

	// The left menu decides which section is lit, and the drafts item is rendered by
	// the template: the screen hands the menu the pair of handlers for that item.
	initDraftsSection()
	{
		const directoryMenu = BX.Mail.Home.LeftMenuNode?.directoryMenu;
		if (!directoryMenu)
		{
			return;
		}

		directoryMenu.registerSection(DRAFTS_SECTION, {
			activate: () => this.applyDraftsHighlight(true),
			deactivate: () => this.applyDraftsHighlight(false),
		});

		if (this.isDraftMode)
		{
			directoryMenu.activateSection(DRAFTS_SECTION);
		}
	}

	setDraftsSectionActive(active)
	{
		const directoryMenu = BX.Mail.Home.LeftMenuNode?.directoryMenu;
		if (!directoryMenu)
		{
			this.applyDraftsHighlight(active);

			return;
		}

		if (active)
		{
			directoryMenu.activateSection(DRAFTS_SECTION);
		}
		else
		{
			directoryMenu.releaseSection(DRAFTS_SECTION);
		}
	}

	applyDraftsHighlight(active)
	{
		const draftsButton = document.querySelector('[data-testid="mail-drafts-button"]');
		if (!draftsButton)
		{
			return;
		}

		if (active)
		{
			Dom.addClass(draftsButton, 'mail-menu-directory-item--active');
			Dom.attr(draftsButton, 'aria-current', 'page');
		}
		else
		{
			Dom.removeClass(draftsButton, 'mail-menu-directory-item--active');
			Dom.attr(draftsButton, 'aria-current', null);
		}
	}

	initClientDraftList(attempt = 0)
	{
		this.draftNavigationButton = document.querySelector('[data-testid="mail-drafts-button"]');
		this.messageListContainer = document.querySelector('[data-role="mail-message-list-view"]');
		this.draftListContainer = document.querySelector('[data-testid="mail-client-draft-list"]');
		this.messageFilterContainer = document.querySelector('[data-role="mail-message-list-filter"]');
		this.draftFilterContainer = document.querySelector('[data-testid="mail-draft-list-filter"]');
		if (
			!this.draftNavigationButton
			|| !this.messageListContainer
			|| !this.draftListContainer
			|| !this.messageFilterContainer
			|| !this.draftFilterContainer
		)
		{
			if (attempt < 100)
			{
				setTimeout(() => this.initClientDraftList(attempt + 1), 50);
			}

			return;
		}

		this.draftNavigationButton.addEventListener('click', (event) => {
			event.preventDefault();
			event.stopImmediatePropagation();
			this.showDrafts();
		});

		if (this.isDraftUrl(window.location.href))
		{
			this.showDrafts(false);
		}
	}

	handleHistoryChange()
	{
		if (this.isDraftUrl(window.location.href))
		{
			this.showDrafts(false);

			return;
		}

		this.hideDrafts(false);
		this.syncFavoritesSectionFromHistory();
	}

	isDraftUrl(url)
	{
		const currentUrl = new URL(url, window.location.origin);
		const draftUrl = new URL(this.draftsPath, window.location.origin);
		if (currentUrl.pathname.replace(/\/+$/, '') !== draftUrl.pathname.replace(/\/+$/, ''))
		{
			return false;
		}

		return !draftUrl.searchParams.has('list_mode')
			|| currentUrl.searchParams.get('list_mode') === draftUrl.searchParams.get('list_mode')
		;
	}

	showDrafts(updateHistory = true)
	{
		if (!this.draftListContainer || this.draftListContainer.hidden === false)
		{
			return;
		}

		if (this.favoritesSectionActive)
		{
			// the drafts address carries no section marker, so the section is left behind
			this.switchFavoritesSection(false, { updateHistory: false, reload: false });
		}

		this.resetGridViewSelection(this.gridId);
		this.resetGridViewSelection('mail-internal-draft-list');
		this.messageListContainer.hidden = true;
		this.draftListContainer.hidden = false;
		this.messageFilterContainer.hidden = true;
		this.draftFilterContainer.hidden = false;
		this.unfixActionPanel(this.gridId);
		this.refreshActionPanelPosition('mail-internal-draft-list');
		Dom.addClass(document.body, 'mail-client-draft-list-view');
		this.setDraftsSectionActive(true);
		const draftGrid = this.getDraftGridInstance();
		if (draftGrid)
		{
			draftGrid.baseUrl = this.draftsPath;
			this.syncDraftActionPanel(draftGrid);
			const moreButton = this.draftListContainer.querySelector(`#${draftGrid.getId()}_nav_more`);
			if (moreButton)
			{
				const page = new URL(moreButton.href, window.location.origin).searchParams.get('mail-internal-draft-list');
				moreButton.href = BX.util.add_url_param(this.draftsPath, {
					'mail-internal-draft-list': page,
				});
			}

			draftGrid.reloadTable('POST', {}, null, this.draftsPath);
			setTimeout(() => this.syncDraftActionPanel(this.getDraftGridInstance()));
		}

		if (updateHistory)
		{
			window.history.pushState({ mailDraftList: true }, '', this.draftsPath);
		}
	}

	unfixActionPanel(gridId)
	{
		const actionPanel = BX.Mail.Home.GridActionPanels?.[gridId];
		actionPanel?.getPositionTracker?.().stop();
		actionPanel?.unfixPanel();
		if (actionPanel?.renderTo)
		{
			actionPanel.renderTo.appendChild(actionPanel.getPanelContainer());
			Dom.removeClass(actionPanel.getPanelContainer(), 'ui-action-panel-fixed');
			actionPanel.panelIsFixed = null;
		}
	}

	refreshActionPanelPosition(gridId)
	{
		const actionPanel = BX.Mail.Home.GridActionPanels?.[gridId];
		if (!actionPanel)
		{
			return;
		}

		actionPanel.getPositionTracker?.().start();
		actionPanel.unfixPanel();
		requestAnimationFrame(() => {
			actionPanel.adjustPanelStyle();
			actionPanel.handleScroll();
		});
	}

	resetGridViewSelection(gridId)
	{
		if (gridId === this.gridId)
		{
			BX.onCustomEvent('Mail::resetGridSelection');
		}

		const grid = BX.Main.gridManager.getInstanceById(gridId);
		grid?.getRows().unselectAll();
		grid?.adjustCheckAllCheckboxes();

		const actionPanel = BX.Mail.Home.GridActionPanels?.[gridId];
		const checkAllCheckbox = actionPanel?.getPanelContainer().querySelector(
			`input[data-mail-grid-check-all="${gridId}"]`,
		);
		if (checkAllCheckbox)
		{
			checkAllCheckbox.checked = false;
			checkAllCheckbox.indeterminate = false;
		}
		actionPanel?.setTotalSelectedItems(0);
		actionPanel?.hidePanel(grid);
	}

	syncDraftActionPanel(draftGrid)
	{
		const actionPanel = BX.Mail.Home.GridActionPanels?.['mail-internal-draft-list'];
		if (actionPanel && draftGrid)
		{
			actionPanel.grid = draftGrid;
			this.userInterfaceManager.addCheckAllCheckbox(actionPanel, draftGrid);
		}
	}

	hideDrafts(updateHistory = true)
	{
		if (!this.draftListContainer || this.draftListContainer.hidden)
		{
			return;
		}

		this.resetGridViewSelection('mail-internal-draft-list');
		this.resetGridViewSelection(this.gridId);
		this.draftListContainer.hidden = true;
		this.messageListContainer.hidden = false;
		this.draftFilterContainer.hidden = true;
		this.messageFilterContainer.hidden = false;
		this.unfixActionPanel('mail-internal-draft-list');
		this.refreshActionPanelPosition(this.gridId);
		Dom.removeClass(document.body, 'mail-client-draft-list-view');
		this.setDraftsSectionActive(false);

		if (updateHistory)
		{
			window.history.pushState({ mailDraftList: false }, '', this.messageListPath);
		}

		this.selectedDraftIds = [];
	}

	showFavoritesSection()
	{
		this.hideDrafts(false);
		this.switchFavoritesSection(true, {
			// a repeated pick of the same section refreshes it instead of stacking history
			updateHistory: !this.favoritesSectionActive,
			reload: true,
		});
	}

	leaveFavoritesSection()
	{
		if (!this.favoritesSectionActive)
		{
			return;
		}

		// the caller reloads the list itself by applying the filter
		this.switchFavoritesSection(false, { updateHistory: true, reload: false });
	}

	navigateToMessageList(params)
	{
		const url = BX.util.add_url_param(this.messageListPath, params);
		const slider = top.BX.SidePanel.Instance.getTopSlider();
		if (slider)
		{
			slider.setUrl(url);
			slider.getFrameWindow().location.href = url;

			return;
		}

		window.location.href = url;
	}

	syncFavoritesSectionFromHistory()
	{
		if (!this.listImprovementsEnabled)
		{
			return;
		}

		const active = isFavoritesSectionUrl(window.location.href);
		if (active === this.favoritesSectionActive)
		{
			return;
		}

		this.switchFavoritesSection(active, { updateHistory: false, reload: true });
	}

	switchFavoritesSection(active, { updateHistory, reload })
	{
		const base = this.isDraftUrl(window.location.href) ? this.messageListPath : window.location.href;
		const url = active ? withFavoritesSection(base) : withoutFavoritesSection(base);
		const grid = BX.Main.gridManager.getById(this.gridId)?.instance ?? null;

		if (active && !this.favoritesSectionActive)
		{
			// the way back: the section is left for the folder it was entered from
			this.folderBehindFavoritesSection = this.getFilterFolder();
		}

		// the folder is kept for one way back only, so leaving the section spends it
		const folderBehindSection = this.folderBehindFavoritesSection;
		if (!active)
		{
			this.folderBehindFavoritesSection = '';
		}

		this.favoritesSectionActive = active;
		if (grid)
		{
			// the grid keeps its own copy of the address it reloads from
			grid.baseUrl = url;
		}

		if (updateHistory)
		{
			window.history.pushState({ mailFavoritesSection: active }, '', url);
		}

		BX.Mail.Home.LeftMenuNode?.directoryMenu?.setFavoritesActive(active);

		if (!reload)
		{
			return;
		}

		// the all mail view keeps no folder field, so there is nothing to hand over to the filter
		if (this.hasFilterFolderField())
		{
			this.applyFolderToFilter(active ? '' : folderBehindSection);

			return;
		}

		grid?.reloadTable('POST', {}, null, url);
	}

	getFilterInstance()
	{
		const filter = BX.Main?.filterManager?.getById?.(this.filterId);

		return (BX.Main?.Filter && filter instanceof BX.Main.Filter) ? filter : null;
	}

	hasFilterFolderField()
	{
		return this.getFilterInstance()?.getFilterFieldsValues()?.DIR !== undefined;
	}

	getFilterFolder()
	{
		return this.getFilterInstance()?.getFilterFieldsValues()?.DIR ?? '';
	}

	// The section spans the whole mailbox, so it holds the filter at "any folder": the very field the
	// left menu writes when a folder is picked. Applying it reloads the list from the address the
	// section owns, so the filter and the selection tell the same story.
	applyFolderToFilter(folder)
	{
		// forced, so that the extension lays the fields over the applied ones and leaves the rest of
		// the filter as the user set it; without the flag a named preset takes the folder into the
		// additional values it saves for the user
		this.getFilterInstance().getApi().extendFilter({ DIR: folder, LABEL_ID: '' }, true);
	}

	addEventHandlers()
	{
		BX.addCustomEvent('Grid::updated', () => {
			this.syncDraftActionPanel(this.getDraftGridInstance());
			this.syncMigrationActionPanel();
		});
		BX.addCustomEvent('Grid::thereSelectedRows', () => this.syncMigrationActionPanel());
		BX.addCustomEvent('Grid::allRowsSelected', () => this.syncMigrationActionPanel());
		BX.addCustomEvent('BX.UI.ActionPanel:created', () => this.syncMigrationActionPanel());

		// todo delete this hack
		// it is here to prevent grid's title changing after filter apply
		BX.ajax.UpdatePageData = (function() {
		});

		BX.addCustomEvent('SidePanel.Slider:onMessage', (event) => {
			if (event.getEventId() === 'Mail.Client.DraftClosed')
			{
				const slider = event.getSender?.();
				if (slider)
				{
					this.closedDraftSliders.set(slider, event.getData()?.content ?? '');
				}

				return;
			}

			if (event.getEventId() === 'Mail.Client.DraftSaved')
			{
				const slider = event.getSender?.();
				if (slider)
				{
					this.modifiedDraftSliders.add(slider);
				}

				return;
			}

			if (event.getEventId() !== 'Mail.Client.MessageCreatedSuccess')
			{
				return;
			}

			this.reloadDraftGrid();
		});

		(window.top?.BX ?? BX).addCustomEvent('SidePanel.Slider:onCloseComplete', (event) => {
			const slider = event.getSlider?.();
			if (this.modifiedDraftSliders.delete(slider))
			{
				this.reloadDraftGrid();
			}

			if (this.closedDraftSliders.has(slider))
			{
				const content = this.closedDraftSliders.get(slider);
				this.closedDraftSliders.delete(slider);
				void this.showDraftSavedNotification(content);
			}
		});

		document.addEventListener('click', (event) => {
			const draftListContainer = document.querySelector('[data-testid="mail-client-draft-list"]');
			if (draftListContainer && !draftListContainer.hidden)
			{
				setTimeout(() => {
					if (!draftListContainer.hidden)
					{
						this.updateDraftActionPanel();
					}
				}, 50);
				setTimeout(() => {
					if (!draftListContainer.hidden)
					{
						this.updateDraftActionPanel();
					}
				}, 250);
			}

		}, true);

		if (this.isDraftMode)
		{
			return;
		}

		EventEmitter.subscribe(
			'onSubMenuShow',
			function(event){
				const menuItem = event.target;
				const container = menuItem.getMenuWindow().getPopupWindow().getPopupContainer();
				let id = null;

				if (container)
				{
					id = BX.data(container, 'grid-row-id');
				}

				BX.data(
					menuItem.getSubMenu().getPopupWindow().getPopupContainer(),
					'grid-row-id',
					menuItem.gridRowId || id,
				);
			},
		);

		EventEmitter.subscribe('Mail::directoryChanged', () =>
		{
			this.resetGridSelection();
		})

		EventEmitter.subscribe('BX.Mail.Home:updatingCounters', (event) => {
			if(event['data']['name'] !== 'mailboxCounters')
			{
				const counters = event['data']['counters'];
				BX.Mail.Home.LeftMenuNode.directoryMenu.setCounters(counters);

				BX.Mail.Home.mailboxCounters.setCounters([
					{ path: 'unseenCountInCurrentMailbox', count: BX.Mail.Home.Counters.getTotalCounter() }
				]);
			}
			else if (BX.Mail.Home.MailboxSelector)
			{
				BX.Mail.Home.MailboxSelector.syncTopLevelCounter();
			}
		});

		EventEmitter.subscribe('BX.Main.Menu.Item:onmouseenter', function(event) {
			const menuItem = event.target;

			if (!menuItem.dataset || !menuItem.getMenuWindow())
			{
				return;
			}

			const menuWindow = menuItem.getMenuWindow();
			const subMenuItems = menuWindow.getMenuItems();

			const path = menuItem.dataset.path;
			const hash = menuItem.dataset.dirMd5;
			const hasChild = menuItem.dataset.hasChild;

			if (!hasChild)
			{
				return;
			}

			for (let i = 0; i < subMenuItems.length; i++)
			{
				const item = subMenuItems[i];

				if (item.getId() === path)
				{
					const hasSubMenu = item.hasSubMenu();

					if (hasSubMenu)
					{
						item.showSubMenu();
						const subMenu = item.getSubMenu();

						let hasLoadingItem = false;

						if (subMenu)
						{
							const items = subMenu.getMenuItems();

							for (let k = 0; k < items.length; k++)
							{
								const subItem = items[k];

								if (subItem.getId() === 'loading')
								{
									hasLoadingItem = true;
								}
							}
						}

						if (!hasLoadingItem)
						{
							return;
						}
					}

					this.loadLevelMenu(item, hash);
				}
			}
		}.bind(this));

		EventEmitter.subscribe('BX.Main.Menu.Item:onmouseenter', (event) => {
			const menuItem = event.target;

			if (menuItem && menuItem.dataset && menuItem.dataset.labelMenu)
			{
				this.prepareLabelsSubMenu(menuItem);
			}
		});

		this.panelPopupShowHandler = (popupWindow) => this.handleActionPanelPopupShow(popupWindow);
		BX.addCustomEvent(window, 'onPopupShow', this.panelPopupShowHandler);

		const itemsMenu = document.querySelectorAll('.ical-event-control-menu');

		for (let i = 0; i < itemsMenu.length; i++)
		{
			itemsMenu[i].addEventListener('click', this.showICalMenuDropdown.bind(this));
		}

		BX.bindDelegate(document.body, 'click', { className: 'ical-event-control-button' }, this.onClickICalButton.bind(this));
	}

	async showDraftSavedNotification(content)
	{
		const rootWindow = window.top ?? window;
		let notificationCenter = rootWindow.BX?.UI?.Notification?.Center;
		if (!notificationCenter)
		{
			const notificationExtension = await rootWindow.BX.Runtime.loadExtension('ui.notification');
			notificationCenter = rootWindow.BX?.UI?.Notification?.Center ?? notificationExtension.Center;
		}
		notificationCenter.notify({ content });
	}

	reloadDraftGrid()
	{
		this.getDraftGridInstance()?.reloadTable('POST');
	}

	openDraft(draftId)
	{
		BX.SidePanel.Instance.open(
			BX.util.add_url_param(this.composePath, { draftId }),
			this.composeSliderOptions,
		);
	}

	deleteDraft(draftId)
	{
		return new Promise((resolve, reject) => {
			BX.ajax.runAction('mail.api.draft.delete', { data: { draftId } }).then((response) => {
				if (response.data.deleted === true)
				{
					BX.Mail.Home.FilterToolbar?.decreaseStaticCount(1);
				}

				this.getDraftGridInstance()?.reloadTable('POST', {}, null, this.draftsPath);
				resolve(response);
			}, reject);
		});
	}

	deleteSelectedDrafts()
	{
		const draftIds = this.getSelectedDraftIds();
		if (draftIds.length === 0)
		{
			return Promise.resolve();
		}

		return new Promise((resolve, reject) => {
			BX.ajax.runAction('mail.api.draft.deleteMany', { data: { draftIds } }).then((response) => {
				const deletedIds = Array.isArray(response.data.deletedIds) ? response.data.deletedIds : [];
				const failedIds = Array.isArray(response.data.failedIds) ? response.data.failedIds : [];
				BX.Mail.Home.FilterToolbar?.decreaseStaticCount(deletedIds.length);
				const draftGrid = this.getDraftGridInstance();
				draftGrid?.getRows().unselectAll();
				draftGrid?.adjustCheckAllCheckboxes();
				this.selectedDraftIds = [];
				draftGrid?.reloadTable('POST', {}, null, this.draftsPath);
				if (failedIds.length > 0)
				{
					this.notify(
						this.draftDeletePartialError.replace('#COUNT#', String(failedIds.length)),
						5000,
					);
				}
				resolve(response);
			}, reject);
		});
	}

	getSelectedDraftIds()
	{
		const draftListContainer = document.querySelector('[data-testid="mail-client-draft-list"]');
		const draftIds = Array.from(
			draftListContainer?.querySelectorAll(
				'.main-grid-row[data-draft-id] input[type="checkbox"]:checked',
			) || [],
		).map((checkbox) => Number(checkbox.closest('[data-draft-id]').dataset.draftId));

		return draftIds.length > 0 ? draftIds : (this.selectedDraftIds || []);
	}

	confirmDeleteSelectedDrafts()
	{
		const draftIds = this.getSelectedDraftIds();
		if (draftIds.length === 0)
		{
			return;
		}

		this.showDraftDeleteConfirmation(
			this.draftDeleteManyConfirm,
			this.draftDeleteManyDescription.replace('#COUNT#', String(draftIds.length)),
			() => this.deleteSelectedDrafts(),
		);
	}

	confirmDeleteDraft(draftId)
	{
		this.showDraftDeleteConfirmation(
			this.draftDeleteConfirm,
			this.draftDeleteDescription,
			() => this.deleteDraft(draftId),
		);
	}

	async showDraftDeleteConfirmation(title, description, onConfirm)
	{
		const {
			Dialog,
			Text,
		} = await Runtime.loadExtension([
			'ui.system.dialog',
			'ui.system.typography',
		]);
		let dialog;
		const confirmButton = new Button({
			text: this.draftDeleteButton,
			size: ButtonSize.LARGE,
			style: AirButtonStyle.FILLED_ALERT,
			useAirDesign: true,
			onclick: () => {
				confirmButton.setWaiting();
				cancelButton.setDisabled();
				const handleError = () => {
					confirmButton.setWaiting(false);
					cancelButton.setDisabled(false);
				};
				try
				{
					const result = onConfirm();
					if (result && typeof result.then === 'function')
					{
						result.then(
							() => dialog.hide(),
							handleError,
						);
					}
					else
					{
						dialog.hide();
					}
				}
				catch
				{
					handleError();
				}
			},
		});
		const cancelButton = new Button({
			text: this.draftCancelButton,
			size: ButtonSize.LARGE,
			style: AirButtonStyle.OUTLINE,
			useAirDesign: true,
			onclick: () => dialog.hide(),
		});

		dialog = new Dialog({
			title,
			content: Text.render(description, { size: 'sm' }),
			centerButtons: [confirmButton, cancelButton],
			hasCloseButton: true,
			hasOverlay: true,
			closeByEsc: true,
			closeByClickOutside: true,
			width: 480,
		});
		dialog.show();
	}

	loadLevelMenu(menuItem, hash)
	{
		const menu = this.getCache(menuItem.getId());
		const popup = BX.Main.PopupManager.getPopupById('menu-popup-popup-submenu-' + menuItem.getId());

		if (popup)
		{
			popup.destroy();
		}

		if (menu)
		{
			menuItem.destroySubMenu();
			menuItem.addSubMenu(menu);
			menuItem.showSubMenu();
			return;
		}

		const subItem = {
			'id': 'loading',
			'text': Loc.getMessage('MAIL_CLIENT_BUTTON_LOADING'),
			'disabled': true,
		};

		menuItem.destroySubMenu();
		menuItem.addSubMenu([subItem]);
		menuItem.showSubMenu();

		BX.ajax.runComponentAction('bitrix:mail.client.config.dirs', 'level', {
			mode: 'class',
			data: { mailboxId: this.mailboxId, dir: { path: menuItem.getId(), dirMd5: hash } },
		}).then(
			function(response) {
				const dirs = response.data.dirs;
				const items = [];

				for (let i = 0; i < dirs.length; i++)
				{
					const hasChild = /(HasChildren)/i.test(dirs[i].FLAGS);
					const item = {
						'id': dirs[i].PATH,
						'text': dirs[i].NAME,
						'dataset': {
							'path': dirs[i].PATH,
							'dirMd5': dirs[i].DIR_MD5,
							'isDisabled': dirs[i].IS_DISABLED,
							'hasChild': hasChild,
						},
						items: hasChild ? [{
							id: 'loading',
							'text': Loc.getMessage('MAIL_CLIENT_BUTTON_LOADING'),
							'disabled': true,
						}] : [],
					};

					items.push(item);
				}

				this.setCache(menuItem.getId(), items);

				const popup = BX.Main.PopupManager.getPopupById('menu-popup-popup-submenu-' + menuItem.getId());
				const isShown = menuItem.getMenuWindow().getPopupWindow().isShown();

				if (popup)
				{
					popup.destroy();
				}

				if (isShown)
				{
					menuItem.destroySubMenu();
					menuItem.addSubMenu(items);
					menuItem.showSubMenu();
				}
			}.bind(this),
			function(response) {
			}.bind(this),
		);
	}

	onCrmClick(id)
	{
		const selected = this.getGridInstance().getRows().getSelected();
		const row = id ? this.getGridInstance().getRows().getById(id) : selected[0];
		if (!(row && row.node))
		{
			return;
		}
		const addToCrm = this.userInterfaceManager.isAddToCrmActionAvailable(row.node);
		const messageIdNode = row.node.querySelector('[data-message-id]');
		if (!(messageIdNode.dataset && messageIdNode.dataset.messageId))
		{
			return;
		}

		if(id === undefined)
		{
			this.resetGridSelection();
		}

		if (addToCrm)
		{
			const crmBtnInRow = row.node.querySelector('.mail-binding-crm.mail-ui-not-active');

			if(crmBtnInRow)
			{
				crmBtnInRow.startWait();
			}

			if (typeof this.isAddingToCrmInProgress !== "object")
			{
				this.isAddingToCrmInProgress = {};
			}
			if (this.isAddingToCrmInProgress[id] === true)
			{
				return;
			}
			this.isAddingToCrmInProgress[id] = true;

			BX.ajax.runAction(
				'bitrix:mail.message.createCrmActivity',
				{
					data: {
						messageId: messageIdNode.dataset.messageId,
					},
					analyticsLabel: {
						'groupCount': selected.length,
						'bindings': this.getRowsBindings([row]),
					},
				},
			).then(
				function(id) {
					this.isAddingToCrmInProgress[id] = false;
					this.notify(Loc.getMessage('MAIL_MESSAGE_LIST_NOTIFY_ADDED_TO_CRM'));
				}.bind(this, id),
				function(json) {

					if(crmBtnInRow)
					{
						crmBtnInRow.stopWait();
					}

					this.isAddingToCrmInProgress[id] = false;
					if (json.errors && json.errors.length > 0)
					{
						this.notify(json.errors.map(
							function(item) {
								return item.message;
							},
						).join('<br>'), 5000);
					}
					else
					{
						this.notify(Loc.getMessage('MAIL_MESSAGE_LIST_NOTIFY_ADD_TO_CRM_ERROR'));
					}
				}.bind(this),
			);
		}
		else
		{
			this.userInterfaceManager.onCrmBindingDeleted(messageIdNode.dataset.messageId);
			BX.ajax.runComponentAction(
				'bitrix:mail.client',
				'removeCrmActivity',
				{
					mode: 'ajax',
					data: {
						messageId: messageIdNode.dataset.messageId,
					},
					analyticsLabel: {
						'groupCount': selected.length,
						'bindings': this.getRowsBindings([row]),
					},
				},
			).then(function(messageIdNode) {
				this.notify(Loc.getMessage('MAIL_MESSAGE_LIST_NOTIFY_EXCLUDED_FROM_CRM'));
			}.bind(this, messageIdNode));
		}

		let selectedIds = this.getGridInstance().getRows().getSelectedIds();
		if(selectedIds.length === 1 && selectedIds[0]===id)
		{
			this.resetGridSelection();
		}
	}

	updateDraftActionPanel()
	{
		const draftGrid = this.getDraftGridInstance();
		const actionPanel = BX.Mail.Home.GridActionPanels?.['mail-internal-draft-list'];
		if (!draftGrid || !actionPanel)
		{
			return;
		}

		actionPanel.grid = draftGrid;
		this.selectedDraftIds = this.getSelectedDraftIds();
		const selectedCount = this.selectedDraftIds.length;
		actionPanel.setTotalSelectedItems(selectedCount);
		const deleteItem = actionPanel.getItemById('draft-delete');
		const deleteButton = document.querySelector(
			'[data-testid="mail-client-draft-list"] #draft-delete',
		);
		if (selectedCount === 0)
		{
			deleteItem?.disable();
		}
		else
		{
			deleteItem?.enable();
			if (deleteButton)
			{
				BX.data(deleteButton, 'slider-ignore-autobinding', true);
				deleteButton.querySelectorAll('*').forEach((element) => {
					BX.data(element, 'slider-ignore-autobinding', true);
				});
			}
		}
	}

	onViewClick(id)
	{
		if (id === undefined && this.getGridInstance().getRows().getSelectedIds().length === 0)
		{
			return;
		}
		// @TODO: path
		BX.SidePanel.Instance.open("/mail/message/" + id, {
			width: 1080,
			loader: 'view-mail-loader',
		});
	}

	onAssignLabelClick()
	{
		if (this.isAssignMenuOpening)
		{
			return;
		}

		const messageIds = this.getGridInstance().getRows().getSelectedIds();
		if (!messageIds.length)
		{
			return;
		}

		const bindElement = (window.event && window.event.target) ? window.event.target : document.body;
		this.showAssignMenu(bindElement, messageIds, this.resolveCommonMessageLabelIds(messageIds));
	}

	resolveMessageLabelIds(id)
	{
		const apiClient = this.getLabelApiClient();
		if (!apiClient)
		{
			return Promise.resolve([]);
		}

		return apiClient.messageLabels(id).catch(() => []);
	}

	// Labels of the whole selection: the group selector shows them as assigned, so a click removes
	// them everywhere. A failure is passed on instead of opening an empty "nothing assigned" state.
	resolveCommonMessageLabelIds(messageIds)
	{
		const apiClient = this.getLabelApiClient();
		if (!apiClient)
		{
			return Promise.resolve([]);
		}

		return apiClient.commonMessageLabels(messageIds);
	}

	resolveLabelScopeMailboxId(messageIds)
	{
		if (!this.isAllMailMode())
		{
			return this.mailboxId;
		}

		const mailboxIds = new Set(messageIds.map((messageId) => this.parseMailboxId(messageId)));

		return mailboxIds.size === 1 ? [...mailboxIds][0] : LABEL_SCOPE_ALL_MAILBOXES;
	}

	parseMailboxId(messageId)
	{
		const mailboxId = Number(String(messageId).split('-').pop());

		return Number.isInteger(mailboxId) && mailboxId > 0 ? mailboxId : LABEL_SCOPE_ALL_MAILBOXES;
	}

	showAssignMenu(bindElement, messageIds, currentLabelIds)
	{
		this.isAssignMenuOpening = true;

		return Runtime.loadExtension('mail.label.assign-menu')
			.then(({ AssignMenu }) => AssignMenu.show({
				bindElement,
				messageIds,
				currentLabelIds,
				mailboxId: this.resolveLabelScopeMailboxId(messageIds),
				onChange: (change) => this.onLabelAssignmentChanged(change),
			}))
			.catch(() => this.notify(Loc.getMessage('MAIL_MESSAGE_LIST_LABELS_LOAD_ERROR')))
			.finally(() => {
				this.isAssignMenuOpening = false;
			});
	}

	onLabelAssignmentChanged(change)
	{
		if (!change || change.assigned)
		{
			return;
		}

		const filter = BX.Main.filterManager.getById(this.filterId);
		if (!filter)
		{
			return;
		}

		const activeLabelId = parseInt(filter.getFilterFieldsValues()['LABEL_ID'], 10);
		if (activeLabelId > 0 && activeLabelId === change.labelId)
		{
			this.resetGridSelection();
			BX.Mail.Home.Grid.reloadTable();
		}
	}

	getLabelApiClient()
	{
		return (BX.Mail.Label && BX.Mail.Label.Core) ? BX.Mail.Label.Core.apiClient : null;
	}

	subscribeLabelsSliderClose()
	{
		this.labelsSliderCloseHandler = (sliderEvent) => this.handleLabelsSliderClose(sliderEvent);

		this.labelsEventTargets = new Set([this.getSidePanelEventTarget()]);
		if (BX.addCustomEvent)
		{
			this.labelsEventTargets.add(BX);
		}

		this.labelsEventTargets.forEach((target) => target.addCustomEvent(
			'SidePanel.Slider:onCloseComplete',
			this.labelsSliderCloseHandler,
		));

		// window.top.BX outlives this document, so its handler has to go away with the document.
		this.pageLeaveHandler = () => this.destroy();
		Event.bind(window, 'pagehide', this.pageLeaveHandler);
	}

	destroy()
	{
		this.destroyMigrationStates();

		if (!this.labelsSliderCloseHandler)
		{
			return;
		}

		this.labelsEventTargets.forEach((target) => target.removeCustomEvent(
			'SidePanel.Slider:onCloseComplete',
			this.labelsSliderCloseHandler,
		));
		this.labelsSliderCloseHandler = null;

		BX.removeCustomEvent(window, 'onPopupShow', this.panelPopupShowHandler);
		this.panelPopupShowHandler = null;

		Event.unbind(window, 'pagehide', this.pageLeaveHandler);
		this.pageLeaveHandler = null;
	}

	getSidePanelEventTarget()
	{
		if (window.top && window.top.BX && window.top.BX.addCustomEvent)
		{
			return window.top.BX;
		}

		return BX;
	}

	handleLabelsSliderClose(sliderEvent)
	{
		const url = sliderEvent?.getSlider?.()?.getUrl?.() ?? '';
		if (!url.includes(LABELS_SLIDER_URL))
		{
			return;
		}

		const apiClient = this.getLabelApiClient();
		if (!apiClient || !this.labelCollection)
		{
			return;
		}

		apiClient.list()
			.then((labels) => {
				this.labelCollection.setAll(labels);
				this.labelsVersion++;
			})
			.catch(() => {});
	}

	prepareLabelsSubMenu(menuItem)
	{
		const subMenu = menuItem.getSubMenu();
		if (
			subMenu
			&& !this.subMenuHasLoadingItem(subMenu)
			&& menuItem.labelsSubMenuVersion === this.labelsVersion
		)
		{
			return;
		}

		const rowId = String(menuItem.gridRowId ?? '');
		if (!this.labelCollection || rowId === '')
		{
			return;
		}

		const scopeMailboxId = this.resolveLabelScopeMailboxId([rowId]);
		const labels = this.getLabelsForScope(scopeMailboxId);
		const items = labels.length > 0
			? this.buildLabelsSubMenuItems(rowId, labels, [])
			: [this.buildEmptyLabelsItem()];

		const popup = BX.Main.PopupManager.getPopupById('menu-popup-popup-submenu-' + menuItem.getId());
		if (popup)
		{
			popup.destroy();
		}

		menuItem.destroySubMenu();
		menuItem.addSubMenu(items);
		menuItem.showSubMenu();
		menuItem.labelsSubMenuVersion = this.labelsVersion;

		if (labels.length > 0)
		{
			this.applyAssignedLabelMarks(menuItem, rowId);
		}
	}

	handleActionPanelPopupShow(popupWindow)
	{
		if (popupWindow?.uniquePopupId !== ACTION_PANEL_POPUP_ID)
		{
			return;
		}

		if (!popupWindow.bindElement?.dataset?.labelMenu)
		{
			return;
		}

		const menu = BX.Main.MenuManager.getMenuById(ACTION_PANEL_MENU_ID);
		if (!menu)
		{
			return;
		}

		const rowId = String(this.getGridInstance().getRows().getSelectedIds()[0] ?? '');
		if (!this.labelCollection || rowId === '')
		{
			return;
		}

		const scopeMailboxId = this.resolveLabelScopeMailboxId([rowId]);
		const labels = this.getLabelsForScope(scopeMailboxId);
		const items = labels.length > 0
			? this.buildLabelsSubMenuItems(rowId, labels, [])
			: [this.buildEmptyLabelsItem()];

		this.replaceMenuItems(menu, items);

		if (labels.length > 0)
		{
			this.applyAssignedLabelMarksToMenu(
				menu,
				rowId,
				() => BX.Main.MenuManager.getMenuById(ACTION_PANEL_MENU_ID) !== menu || !menu.isShown(),
			);
		}
	}

	replaceMenuItems(menu, items)
	{
		const staleItemIds = menu.getMenuItems().map((item) => item.getId());
		const addedItems = items.filter((item) => menu.addMenuItem(item, null) !== null);

		// The placeholder goes away last: removing the last item of a menu destroys its popup.
		if (addedItems.length > 0)
		{
			staleItemIds.forEach((itemId) => menu.removeMenuItem(itemId));
		}
	}

	getLabelsForScope(scopeMailboxId)
	{
		return this.labelCollection.getAll().filter(
			(label) => label.mailboxId === LABEL_SCOPE_ALL_MAILBOXES || label.mailboxId === scopeMailboxId,
		);
	}

	applyAssignedLabelMarks(menuItem, rowId)
	{
		const targetSubMenu = menuItem.getSubMenu();
		if (!targetSubMenu)
		{
			return;
		}

		this.applyAssignedLabelMarksToMenu(
			targetSubMenu,
			rowId,
			() => menuItem.getSubMenu() !== targetSubMenu,
		);
	}

	applyAssignedLabelMarksToMenu(menu, rowId, isStale)
	{
		this.resolveMessageLabelIds(rowId)
			.then((currentLabelIds) => {
				if (isStale())
				{
					return;
				}

				const assignedLabelIds = new Set((currentLabelIds || []).map((labelId) => Number(labelId)));
				menu.getMenuItems().forEach((item) => {
					const labelId = this.parseLabelItemId(item.getId());
					if (labelId !== null && !this.toggledLabelIds?.has(labelId))
					{
						this.setLabelItemChecked(item, assignedLabelIds.has(labelId));
					}
				});
			})
			.catch(() => {});
	}

	parseLabelItemId(itemId)
	{
		if (!Type.isString(itemId) || !itemId.startsWith(LABEL_ITEM_ID_PREFIX))
		{
			return null;
		}

		const labelId = Number(itemId.slice(LABEL_ITEM_ID_PREFIX.length));

		return Number.isInteger(labelId) ? labelId : null;
	}

	buildEmptyLabelsItem()
	{
		return {
			id: 'mail-label-empty',
			text: Loc.getMessage('MAIL_MESSAGE_LIST_LABELS_EMPTY'),
			disabled: true,
		};
	}

	subMenuHasLoadingItem(subMenu)
	{
		const items = subMenu.getMenuItems();
		for (let i = 0; i < items.length; i++)
		{
			if (items[i].getId() === 'loading')
			{
				return true;
			}
		}

		return false;
	}

	buildLabelsSubMenuItems(rowId, labels, currentLabelIds)
	{
		const assignedLabelIds = new Set((currentLabelIds || []).map((labelId) => Number(labelId)));
		// The marks arrive asynchronously, so a label the user has already toggled must keep his state.
		this.toggledLabelIds = new Set();
		const items = [];

		for (let i = 0; i < labels.length; i++)
		{
			const label = labels[i];
			const labelId = Number(label.id);
			const isAssigned = assignedLabelIds.has(labelId);

			items.push({
				id: LABEL_ITEM_ID_PREFIX + labelId,
				text: label.name,
				className: this.getLabelItemClassName(isAssigned),
				dataset: {
					testid: 'mail-message-list-label-item-' + labelId,
					preventCloseContextMenu: true,
				},
				onclick: (event, item) => this.onLabelToggleClick(event, item, labelId, rowId),
			});
		}

		return items;
	}

	getLabelItemClassName(isAssigned)
	{
		return isAssigned
			? 'mail-msg-list-label-item menu-popup-item-accept'
			: 'mail-msg-list-label-item';
	}

	onLabelToggleClick(event, item, labelId, rowId)
	{
		if (event)
		{
			event.stopPropagation();
		}

		const apiClient = this.getLabelApiClient();
		if (!apiClient)
		{
			return;
		}

		const wasAssigned = Dom.hasClass(item.getContainer(), 'menu-popup-item-accept');
		const willAssign = !wasAssigned;

		this.toggledLabelIds?.add(labelId);
		this.setLabelItemChecked(item, willAssign);

		const request = willAssign
			? apiClient.assign([labelId], [rowId])
			: apiClient.unassign([labelId], [rowId]);

		request
			.then(() => {
				this.onLabelAssignmentChanged({ labelId, assigned: willAssign });
			})
			.catch(() => {
				this.setLabelItemChecked(item, wasAssigned);
				this.notify(Loc.getMessage('MAIL_MESSAGE_LIST_LABEL_TOGGLE_ERROR'));
			});
	}

	setLabelItemChecked(item, checked)
	{
		const container = item.getContainer();
		if (!container)
		{
			return;
		}

		if (checked)
		{
			Dom.addClass(container, 'menu-popup-item-accept');
		}
		else
		{
			Dom.removeClass(container, 'menu-popup-item-accept');
		}
	}

	onDeleteImmediately(id)
	{
		let additionalOptions =
		{
			'deleteImmediately' : true,
		};
		this.onDeleteClick(id,additionalOptions);
	}

	onDeleteClick(id,additionalOptions)
	{
		if (this.refuseMigrationAction(id))
		{
			return;
		}

		const selected = this.getGridInstance().getRows().getSelected();
		if (id === undefined && selected.length === 0)
		{
			return;
		}

		const isAllMailMode = this.isAllMailMode();
		if (!isAllMailMode && !this.canDelete)
		{
			this.showDirsSlider();
			return;
		}

		let options = {
			params: (additionalOptions !== undefined) ? additionalOptions : {},
			keepRows: true,
			analyticsLabel: {
				'groupCount': selected.length,
				'bindings': this.getRowsBindings(id ? [this.getGridInstance().getRows().getById(id)] : selected),
			},
		};
		let selectedIds;

		if(id === undefined)
		{
			selectedIds = BX.Mail.Home.Grid.getSelectedIds();
		}
		else
		{
			selectedIds = [id];
		}

		selectedIds = this.filterRowsByClassName(this.disabledClassName, selectedIds, true);

		if (isAllMailMode)
		{
			if (selectedIds.length === 0)
			{
				return;
			}
			const deletable = selectedIds.filter((rowId) => this.canRowDelete(rowId));
			if (deletable.length === 0)
			{
				this.showDirsSlider(this.getRowMailboxId(selectedIds[0]));
				return;
			}
			selectedIds = deletable;
		}

		options.ids = selectedIds;

		if (this.userInterfaceManager.isCurrentFolderTrash || (additionalOptions !== undefined && additionalOptions['deleteImmediately']) )
		{
			const confirmPopup = this.getConfirmDeletePopup(options);
			confirmPopup.show();
		}
		else
		{
			BX.Mail.Home.Grid.hideRowByIds(selectedIds);

			const unseenRowsIdsCount = this.filterRowsByClassName('mail-msg-list-cell-unseen', selectedIds).length;

			if(this.getCurrentFolder() !== '')
			{
				BX.Mail.Home.Counters.updateCounters([
					{
						name: this.getCurrentFolder(),
						lower: true,
						count: unseenRowsIdsCount,
					},
				]);
			}

			this.runAction('delete', options,() =>
				BX.Mail.Home.Grid.reloadTable()
			);
			if(id === undefined)
			{
				this.resetGridSelection();
			}
		}
	}

	onMoveToFolderClick(event)
	{
		const folderOptions = event.currentTarget.dataset;
		const toFolderByPath = folderOptions.path;
		const toFolderByName = toFolderByPath;

		if(toFolderByPath === this.getCurrentFolder())
		{
			this.notify(Loc.getMessage('MESSAGES_ALREADY_EXIST_IN_FOLDER'));
			return;
		}

		let id = undefined;
		const popupSubmenu = BX.findParent(event.currentTarget, { className: 'popup-window' });
		if (popupSubmenu)
		{
			id = BX.data(popupSubmenu, 'grid-row-id');
		}
		if (this.refuseMigrationAction(id))
		{
			return;
		}
		const isDisabled = JSON.parse(folderOptions.isDisabled);

		if ((id === undefined && this.getGridInstance().getRows().getSelectedIds().length === 0) || isDisabled)
		{
			return;
		}
		let selected = this.getGridInstance().getRows().getSelected();
		let idsForMoving = (id ? [id] : this.getGridInstance().getRows().getSelectedIds());
		idsForMoving = this.filterRowsByClassName(this.disabledClassName, idsForMoving, true);
		if (!idsForMoving.length)
		{
			return;
		}

		// to hide the context menu
		BX.onCustomEvent('Grid::updated');

		let selectedIds;

		if(id === undefined)
		{
			selectedIds = BX.Mail.Home.Grid.getSelectedIds();
		}
		else
		{
			selectedIds = [id];
		}

		BX.Mail.Home.Grid.hideRowByIds(selectedIds);

		const unseenRowsIdsCount = this.filterRowsByClassName('mail-msg-list-cell-unseen', selectedIds).length;

		if(this.getCurrentFolder() !== '')
		{
			BX.Mail.Home.Counters.updateCounters([
				{
					name:toFolderByName,
					increase: true,
					count: unseenRowsIdsCount,
				},
				{
					name: this.getCurrentFolder(),
					lower: true,
					count: unseenRowsIdsCount,
				},
			]);
		}

		this.runAction(
			'moveToFolder',
			{
				keepRows: true,
				ids: idsForMoving,
				params: {
					folderPath: toFolderByPath,
				},
				analyticsLabel: {
					'groupCount': selected.length,
					'bindings': this.getRowsBindings(id ? [this.getGridInstance().getRows().getById(id)] : selected),
				},
			},
			()=> {
				BX.Mail.Home.Grid.reloadTable();
			},
		);

		if(id === undefined)
		{
			this.resetGridSelection();
		}
	}

	onReadClick(id)
	{
		if (this.refuseMigrationAction(id))
		{
			return;
		}

		let selected = [];
		let resultIds = [];

		if(id === undefined)
		{
			selected = this.getGridInstance().getRows().getSelected();
			resultIds = this.getGridInstance().getRows().getSelectedIds();
		}
		else
		{
			let selectedIds = this.getGridInstance().getRows().getSelectedIds();
			if(selectedIds.length === 1 && selectedIds[0]===id)
			{
				/*if the action is non-group, but one cell is selected,
				then the action was performed through the "Action panel"
				and the selection should be reset*/
				selected = this.getGridInstance().getRows().getSelected();
				resultIds = selectedIds;
				id = undefined;
			}
			else
			{
				resultIds = [id];
			}

		}
		if (id === undefined && selected.length === 0)
		{
			return;
		}
		const actionName = 'all' == id || this.isSelectedRowsHaveClass('mail-msg-list-cell-unseen', id) ? 'markAsSeen' : 'markAsUnseen';

		resultIds = this.filterRowsByClassName('mail-msg-list-cell-unseen', resultIds, actionName !== 'markAsSeen');
		resultIds = this.filterRowsByClassName(this.disabledClassName, resultIds, true);

		if (!resultIds.length)
		{
			return;
		}

		const handler = function() {
			this.userInterfaceManager.onMessagesRead(resultIds, { action: actionName });
			const currentFolder = this.getCurrentFolder();

			const oldMessagesCount = actionName !== 'markAsSeen'? this.isSelectedRowsHaveClass('mail-msg-list-cell-old') : 0;
			let countMessages = resultIds.length - oldMessagesCount;

			if(this.getCurrentFolder() !== '')
			{
				if (actionName === 'markAsSeen')
				{
					if ('all' === id)
					{
						countMessages = BX.Mail.Home.Counters.getCounter(currentFolder) - oldMessagesCount;
					}

					BX.Mail.Home.Counters.updateCounters([
						{
							name: currentFolder,
							lower: true,
							count: countMessages,
						},
					]);
				}
				else
				{
					BX.Mail.Home.Counters.updateCounters([
						{
							name: currentFolder,
							increase: true,
							count: countMessages,
						},
					]);
				}
			}

			if(id === undefined) {
				this.resetGridSelection();
			}

			const isAllMailMode = !!(BX.Mail.Home.MailboxSelector && BX.Mail.Home.MailboxSelector.isAllMailMode);
			if ('all' === id)
			{
				if (isAllMailMode)
				{
					resultIds['for_all_user_mailboxes'] = true;
				}
				else
				{
					resultIds['for_all'] = this.mailboxId + '-' + this.userInterfaceManager.getCurrentFolder();
				}
			}

			if (BX.Mail.Home.MailboxSelector)
			{
				BX.Mail.Home.MailboxSelector.handleMessagesAction(resultIds, actionName);
			}
			this.suppressNextCountersPull();

			this.runAction(actionName, {
				ids: resultIds,
				keepRows: true,
				successParams: actionName,
				analyticsLabel: {
					'groupCount': selected.length,
					'bindings': this.getRowsBindings(id ? [this.getGridInstance().getRows().getById(id)] : selected),
				},
			});

			return true;
		};
		handler.apply(this);
	}

	suppressNextCountersPull()
	{
		this.pendingCountersAction = true;
		clearTimeout(this.pendingCountersTimeout);
		this.pendingCountersTimeout = setTimeout(() => {
			this.pendingCountersAction = false;
		}, 5000);
	}

	onSpamClick(id)
	{
		if (this.refuseMigrationAction(id))
		{
			return;
		}

		const selected = this.getGridInstance().getRows().getSelected();
		if (id === undefined && selected.length === 0)
		{
			return;
		}

		const isAllMailMode = this.isAllMailMode();
		if (!isAllMailMode && !this.canMarkSpam)
		{
			this.showDirsSlider();
			return;
		}

		const actionName = this.isSelectedRowsHaveClass('js-spam', id) ? 'restoreFromSpam' : 'markAsSpam';
		let resultIds = this.filterRowsByClassName('js-spam', id, actionName !== 'restoreFromSpam');
		resultIds = this.filterRowsByClassName(this.disabledClassName, resultIds, true);
		if (!resultIds.length)
		{
			return;
		}

		const options = {
			keepRows: true,
			analyticsLabel: {
				'groupCount': selected.length,
				'bindings': this.getRowsBindings(id ? [this.getGridInstance().getRows().getById(id)] : selected),
			},
		};

		let selectedIds;

		if(id === undefined)
		{
			selectedIds = BX.Mail.Home.Grid.getSelectedIds();
		}
		else
		{
			selectedIds = [id];
		}

		if (isAllMailMode && actionName === 'markAsSpam')
		{
			if (selectedIds.length === 0)
			{
				return;
			}
			const spammable = selectedIds.filter((rowId) => this.canRowMarkSpam(rowId));
			if (spammable.length === 0)
			{
				this.showDirsSlider(this.getRowMailboxId(selectedIds[0]));
				return;
			}
			selectedIds = spammable;
		}

		options.ids = selectedIds;

		BX.Mail.Home.Grid.hideRowByIds(selectedIds);

		const unseenRowsIdsCount = this.filterRowsByClassName('mail-msg-list-cell-unseen', selectedIds).length;

		if (this.getCurrentFolder() !== '')
		{
			if (actionName === 'markAsSpam')
			{
				BX.Mail.Home.Counters.updateCounters([
					{
						name: this.userInterfaceManager.spamDir,
						increase: true,
						count: unseenRowsIdsCount,
					},
					{
						name: this.getCurrentFolder(),
						lower: true,
						count: unseenRowsIdsCount,
					},
				]);
			}
			else
			{
				BX.Mail.Home.Counters.updateCounters([
					{
						name: this.userInterfaceManager.spamDir,
						lower: true,
						count: unseenRowsIdsCount,
					},
					{
						name: this.userInterfaceManager.inboxDir,
						increase: true,
						count: unseenRowsIdsCount,
					},
				]);
			}
		}

		this.runAction(actionName, options,() =>
			BX.Mail.Home.Grid.reloadTable()
		);
		if(id === undefined)
		{
			this.resetGridSelection();
		}
	}

	getConfirmDeletePopup(options)
	{
		return new BX.UI.Dialogs.MessageBox({
			title: Loc.getMessage('MAIL_MESSAGE_LIST_CONFIRM_TITLE'),
			message: Loc.getMessage('MAIL_MESSAGE_LIST_CONFIRM_DELETE'),
			buttons: [
				new BX.UI.Button({
					color: BX.UI.Button.Color.DANGER,
					text: Loc.getMessage('MAIL_MESSAGE_LIST_CONFIRM_DELETE_BTN'),
					onclick: (function(button) {

						const unseenRowsIdsCount = this.filterRowsByClassName('mail-msg-list-cell-unseen', options.ids).length;

						BX.Mail.Home.Counters.updateCounters([
							{
								name: this.getCurrentFolder(),
								lower: true,
								count: unseenRowsIdsCount,
							},
						]);

						this.runAction('delete', options,() =>
							BX.Mail.Home.Grid.reloadTable()
						);
						button.getContext().close();
						BX.Mail.Home.Grid.hideRowByIds(options.ids);
					}).bind(this),
				}),
				new BX.UI.CancelButton({
					onclick: function(button) {
						button.getContext().close();
					},
				}),
			],
		});
	}

	resetGridSelection()
	{
		BX.onCustomEvent('Mail::resetGridSelection');
		this.getGridInstance().getRows().unselectAll();
		this.getGridInstance().adjustCheckAllCheckboxes();
		BX.Mail.Home.Grid.hidePanel();
	}

	isSelectedRowsHaveClass(className, id)
	{
		let selectedIds;
		if(id === undefined)
		{
			selectedIds = this.getGridInstance().getRows().getSelectedIds();
		}
		else
		{
			selectedIds = [id];
		}
		const ids = selectedIds.length ? selectedIds : (id ? [id] : []);

		let selectedLinesWithClassNumber = 0;

		for (let i = 0; i < ids.length; i++)
		{
			const row = this.getGridInstance().getRows().getById(ids[i]);
			if (row && row.node)
			{
				const columns = row.node.getElementsByClassName(className);
				if (columns && columns.length)
				{
					selectedLinesWithClassNumber++;
				}
			}
		}
		return selectedLinesWithClassNumber;
	}

	filterRowsByClassName(className, ids, isReversed)
	{
		let resIds = [];
		if ('all' == ids)
		{
			resIds = this.getGridInstance().getRows().getBodyChild().map(
				function(current) {
					return current.getId();
				},
			);
		}
		else if (Array.isArray(ids))
		{
			resIds = ids;
		}
		else
		{
			const selectedIds = this.getGridInstance().getRows().getSelectedIds();
			resIds = selectedIds.length ? selectedIds : (ids ? [ids] : []);
		}
		const resultIds = [];
		for (let i = resIds.length - 1; i >= 0; i--)
		{
			const row = this.getGridInstance().getRows().getById(resIds[i]);
			if (row && row.node)
			{
				const columns = row.node.getElementsByClassName(className);
				if (!isReversed && (columns && columns.length))
				{
					resultIds.push(resIds[i]);
				}
				else if (isReversed && !(columns && columns.length))
				{
					resultIds.push(resIds[i]);
				}
			}
		}
		return resultIds;
	}

	notify(text, delay)
	{
		top.BX.UI.Notification.Center.notify({
			autoHideDelay: delay > 0 ? delay : 2000,
			content: text ? text : Loc.getMessage('MAIL_MESSAGE_LIST_NOTIFY_SUCCESS'),
		});
	}

	updateCountersFromBackend()
	{
		const selector = BX.Mail.Home.MailboxSelector;
		const isAllMailMode = !!(selector && selector.isAllMailMode);

		BX.ajax.runComponentAction('bitrix:mail.client.message.list', 'getMailCounters', {
			mode: 'class',
			data: isAllMailMode ? {} : { mailboxId: this.mailboxId },
		}).then(
			function(response) {
				const result = response.data || {};
				const total = Number(result.total || 0);

				if (selector)
				{
					selector.updateAllMailBadge(total);
					if (result.mailboxes)
					{
						selector.updatePerMailboxBadges(result.mailboxes);
					}
				}

				if (isAllMailMode)
				{
					BX.Mail.Home.Counters.setCounters([
						{ path: Loc.getMessage('MAIL_VIRTUAL_FOLDER_KEY'), count: total }
					]);
					BX.Mail.Home.mailboxCounters.setCounters([
						{ path: 'unseenCountInAllMailboxes', count: total },
					]);
				}
				else if (result.folders && this.getCurrentFolder() === '')
				{
					BX.Mail.Home.Counters.setCounters(result.folders);
				}
			}.bind(this)
		);
	}

	runAction(actionName, options, actionOnSuccess)
	{
		options = options ? options : {};

		let selectedIds = [];

		if (options.ids)
		{
			selectedIds = options.ids;
		}
		if (!selectedIds.length && !selectedIds.for_all)
		{
			return;
		}
		if (!options.keepRows)
		{
			this.getGridInstance().tableFade();
		}
		const data = { ids: selectedIds };
		if (options.params)
		{
			const optionsKeys = Object.keys(Object(options.params));
			for (let nextIndex = 0, len = optionsKeys.length; nextIndex < len; nextIndex++)
			{
				const nextKey = optionsKeys[nextIndex];
				const desc = Object.getOwnPropertyDescriptor(options.params, nextKey);
				if (desc !== undefined && desc.enumerable)
				{
					data[nextKey] = options.params[nextKey];
				}
			}
		}

		BX.ajax.runAction('mail.message.' + actionName, {
			data: data,
			analyticsLabel: options.analyticsLabel,
		}).then(
			function() {
				if (options.onSuccess === false)
				{
					return;
				}

				this.updateCountersFromBackend();

				if (options.onSuccess && typeof (options.onSuccess) === "function")
				{
					options.onSuccess.bind(this, selectedIds, options.successParams)();
					return;
				}
				if (actionOnSuccess)
				{
					actionOnSuccess();
				}
			}.bind(this),
			function(response) {
				BX.Mail.Home.Counters.restoreFromCache();
				BX.Mail.Home.Grid.reloadTable();
				this.updateCountersFromBackend();
				options.onError && typeof (options.onError) === "function" ?
					options.onError().bind(this, response) :
					this.onErrorRequest(response);
			}.bind(this),
		);
	}

	onErrorRequest(response)
	{
		let options = {};
		this.checkErrorRights(response.errors);
		options.errorMessage = response.errors[0].message;
		this.notify(options.errorMessage);
	}

	checkErrorRights(errors)
	{
		if (this.isAllMailMode())
		{
			return;
		}
		for (let i = 0; i < errors.length; i++)
		{
			if (errors[i].code === this.ERROR_CODE_CAN_NOT_DELETE)
			{
				this.canDelete = false;
			}
			if (errors[i].code === this.ERROR_CODE_CAN_NOT_MARK_SPAM)
			{
				this.canMarkSpam = false;
			}
		}
	}

	isAllMailMode()
	{
		return !!(BX.Mail.Home.MailboxSelector && BX.Mail.Home.MailboxSelector.isAllMailMode);
	}

	/** The mailbox of a row comes from its `data-mailbox-id` attribute: the grid keeps its row data server-side. */
	getRowMailboxId(rowId)
	{
		const row = this.getGridInstance().getRows().getById(rowId);
		const mailboxId = Number(row?.getDataset?.()?.mailboxId ?? 0);

		return Number.isInteger(mailboxId) && mailboxId > 0 ? mailboxId : 0;
	}

	canRowDelete(rowId)
	{
		return !!this.mailboxCanDelete[this.getRowMailboxId(rowId)];
	}

	canRowMarkSpam(rowId)
	{
		return !!this.mailboxCanMarkSpam[this.getRowMailboxId(rowId)];
	}

	showDirsSlider(mailboxId)
	{
		const targetMailboxId = mailboxId ?? this.mailboxId;
		const url = BX.util.add_url_param("/mail/config/dirs", {
			mailboxId: targetMailboxId,
		});
		BX.SidePanel.Instance.open(url, {
			width: 640,
			cacheable: false,
			allowChangeHistory: false,
		});
		this.canDelete = true;
		this.canMarkSpam = true;
	}

	onDisabledGroupActionClick()
	{
	}

	getCurrentFolder()
	{
		return this.userInterfaceManager.getCurrentFolder();
	}

	getGridInstance()
	{
		return BX.Main.gridManager.getById(this.gridId).instance;
	}

	getDraftGridInstance()
	{
		return BX.Main.gridManager.getById('mail-internal-draft-list')?.instance || null;
	}

	getRowsBindings(rows)
	{
		return BX.util.array_unique(Array.prototype.concat.apply(
			[],
			rows.map(
				function(row) {
					if (!row || !row.node)
					{
						return null;
					}

					return Array.prototype.map.call(
						row.node.querySelectorAll('[class^="js-bind-"] [data-type]'),
						function(node) {
							return node.dataset.type;
						},
					);
				},
			),
		));
	}

	getCache(key)
	{
		if (!key)
		{
			return;
		}

		return this.cache[key] ? this.cache[key] : null;
	}

	setCache(key, value)
	{
		return this.cache[key] = value;
	}

	showICalMenuDropdown(event)
	{
		event.stopPropagation();
		event.preventDefault();

		const menu = event.currentTarget.dataset.menu;

		if (!menu)
		{
			return;
		}

		this.iCalMenuDropdown = BX.Main.MenuManager.create({
			id: 'mail-client-message-list-ical-dropdown-menu',
			autoHide: true,
			closeByEsc: true,
			items: JSON.parse(menu),
			zIndex: 7001,
			maxHeight: 400,
			maxWidth: 200,
			angle: {
				position: "top",
				offset: 40,
			},
			events: {
				onPopupClose: function() {
					this.removeICalMenuDropdown();
				}.bind(this),
			},
		});
		this.iCalMenuDropdown.popupWindow.setBindElement(event.currentTarget);
		this.iCalMenuDropdown.show();
	}

	removeICalMenuDropdown()
	{
		if (this.iCalMenuDropdown)
		{
			BX.Main.MenuManager.destroy(this.iCalMenuDropdown.id);
		}
	}

	onClickICalButton(event)
	{
		event.stopPropagation();
		event.preventDefault();

		const messageId = event.target.dataset.messageid || event.target.parentNode.dataset.messageid;
		const action = event.target.dataset.action || event.target.parentNode.dataset.action;
		const button = event.target;

		button.classList.add('ui-btn-wait');
		this.removeICalMenuDropdown();

		this.sendICal(messageId, action)
			.then(function() {
				button.classList.remove('ui-btn-wait');
				this.notify(Loc.getMessage(action === 'cancelled' ? 'MAIL_MESSAGE_ICAL_NOTIFY_REJECT' : 'MAIL_MESSAGE_ICAL_NOTIFY_ACCEPT'));
			}.bind(this))
			.catch(function() {
				button.classList.remove('ui-btn-wait');
				this.notify(Loc.getMessage('MAIL_MESSAGE_ICAL_NOTIFY_ERROR'));
			}.bind(this));
	}

	sendICal(messageId, action)
	{
		return new Promise(function(resolve, reject) {
			BX.ajax.runComponentAction('bitrix:mail.client', 'ical', {
				mode: 'ajax',
				data: { messageId, action },
			}).then(
				function() {
					resolve();
				}.bind(this),
				function() {
					reject();
				}.bind(this),
			);
		});
	}
}
