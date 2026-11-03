import { Loc, Type, Tag, Reflection, Dom, Text, Event, Runtime, clone } from 'main.core';
import { MenuManager, PopupManager } from 'main.popup';
import { DashboardManager } from 'biconnector.apache-superset-dashboard-manager';
import { EventEmitter } from 'main.core.events';
import { ApacheSupersetAnalytics, PermissionsAnalytics, PermissionsAnalyticsSource } from 'biconnector.apache-superset-analytics';
import type { DashboardAnalyticInfo } from 'biconnector.apache-superset-analytics';
import { Dialog } from 'ui.entity-selector';
import { Guide } from 'ui.tour';
import { ApacheSupersetMarketManager } from 'biconnector.apache-superset-market-manager';
import { TagFooter } from 'biconnector.entity-selector';
import { AirButtonStyle, Button, CancelButton, ButtonSize } from 'ui.buttons';
import 'ui.alerts';
import 'ui.forms';
import { Dialog as SystemDialog } from 'ui.system.dialog';
import { MessageBox, MessageBoxButtons } from 'ui.dialogs.messagebox';
import { AhaMoment } from 'biconnector.aha-moment';
import { SharePopup } from 'biconnector.share-popup';
import { resolveErrorHtml, getUserFacingErrorHtml } from 'biconnector.error-message';

type SelfHostedLicensePopup = {
	title: string,
	text: string,
	termKey: string,
	actionText: ?string,
	actionUrl: ?string,
};

type Props = {
	gridId: ?string,
	isNeedShowDraftGuide: boolean,
	selfHostedLicensePopup: ?SelfHostedLicensePopup,
	publishAhaMoment: ?Object,
	constructorButtonHint: ?Object,
	isAvailableDashboardCreation: boolean,
	isAvailableGroupCreation: boolean,
	isMarketExists: boolean,
	marketUrl: string,
	supersetStatus: string,
};

type LoginPopupParams = {
	dashboardId: number,
	type: string,
	editUrl: string,
	appId: string,
};

// The grid stays visibility:hidden for the first 10ms of its load animation.
const CONSTRUCTOR_HINT_VISIBILITY_FRAMES = 5;

/**
 * @namespace BX.BIConnector
 */
class SupersetDashboardGridManager
{
	#dashboardManager: DashboardManager = null;
	#grid: BX.Main.grid;
	#filter: BX.Main.Filter;
	#tagSelectorDialog: ?Dialog;
	#lastPinnedRowId: ?number;
	#publishAhaMoment: ?AhaMoment;
	#constructorButtonHint: ?AhaMoment;
	#constructorHintRowNode: ?HTMLElement = null;
	#constructorHintFrameId: ?number = null;
	#properties: Props;
	#sharePopups: Map<number, SharePopup> = new Map();
	constructor(props: Props)
	{
		this.#dashboardManager = new DashboardManager();
		this.#properties = props;

		this.#grid = BX.Main.gridManager.getById(props.gridId)?.instance;
		this.#filter = BX.Main.filterManager.getById(props.gridId);
		this.#subscribeToEvents();

		this.#colorPinnedRows();
		this.#initHints();
		this.#showConstructorButtonHint();
		this.#showSelfHostedLicensePopup();

		this.#replaceHistoryState();
	}

	#subscribeToEvents()
	{
		Event.bind(
			window,
			'popstate',
			(event) => {
				const filterState = event.state?.filter;

				if (!filterState || !Type.isPlainObject(filterState))
				{
					return;
				}

				const filterApi = this.getFilter().getApi();
				filterApi.extendFilter(filterState);
			},
		);

		EventEmitter.subscribe('SidePanel.Slider:onMessage', (event) => {
			const [sliderEvent] = event.getCompatData();

			if (sliderEvent.getEventId() === 'BIConnector.Superset.DashboardDetail:onDashboardBatchStatusUpdate')
			{
				const eventArgs = sliderEvent.getData();
				if (eventArgs.dashboardList)
				{
					this.onUpdatedDashboardBatchStatus(eventArgs.dashboardList);
				}
			}
			else if (
				sliderEvent.getEventId() === 'BIConnector.Superset.DashboardTagGrid:onTagChange'
				|| sliderEvent.getEventId() === 'BIConnector.Superset.DashboardTagGrid:onTagDelete'
			)
			{
				if (this.#tagSelectorDialog)
				{
					this.#tagSelectorDialog.destroy();
					this.#tagSelectorDialog = null;
				}

				const filterTagValues = this.getFilter().getFilterFieldsValues();
				if (Type.isUndefined(filterTagValues['TAGS.ID']) || filterTagValues['TAGS.ID'].length === 0)
				{
					this.getGrid().reload();

					return;
				}

				const { tagId, title } = sliderEvent.getData();
				const currentFilteredTags = filterTagValues['TAGS.ID'] ?? [];
				const currentFilteredTagLabels = filterTagValues['TAGS.ID_label'] ?? [];

				const index = currentFilteredTags.findIndex((id) => Text.toInteger(id) === Text.toInteger(tagId));
				if (sliderEvent.getEventId() === 'BIConnector.Superset.DashboardTagGrid:onTagDelete')
				{
					currentFilteredTags.splice(index, 1);
					currentFilteredTagLabels.splice(index, 1);
				}
				else
				{
					currentFilteredTagLabels[index] = title;
				}

				const filterApi = this.getFilter().getApi();
				filterApi.extendFilter({
					'TAGS.ID': currentFilteredTags,
					'TAGS.ID_label': currentFilteredTagLabels,
				});
			}
		});

		EventEmitter.subscribe('BIConnector.Superset.DashboardManager:onDashboardBatchStatusUpdate', (event) => {
			const data = event.getData();
			if (!data.dashboardList)
			{
				return;
			}

			const dashboardList = data.dashboardList;
			this.onUpdatedDashboardBatchStatus(dashboardList);
		});

		BX.PULL && BX.PULL.extendWatch('superset_dashboard', true);
		EventEmitter.subscribe('onPullEvent-biconnector', (event: BaseEvent) => {
			const [eventName, eventData] = event.data;
			if (eventName === 'onDashboardListChanged')
			{
				this.#onDashboardListChanged();
			}
			else if (eventName === 'onSupersetStatusUpdated')
			{
				const status = eventData?.status;
				if (status)
				{
					this.#onSupersetStatusChange(status);
				}
			}
		});

		EventEmitter.subscribe('BX.Rest.Configuration.Install:onFinish', () => {
			this.#grid.reload();
		});

		EventEmitter.subscribe('Grid::updated', (event) => {
			this.#initHints();
			this.#colorPinnedRows();

			this.#replaceHistoryState();

			if (event.getData()?.[0]?.getId() === this.#grid?.getId())
			{
				this.#clearConstructorHintRow();
				this.#showConstructorButtonHint();
			}
		});

		EventEmitter.subscribe('BIConnector.ExportMaster:onDashboardDataLoaded', () => {
			this.#grid.tableUnfade();
		});

		EventEmitter.subscribe('BX.BIConnector.Settings:onAfterSave', () => {
			this.#grid.reload();
		});

		EventEmitter.subscribe('BIConnector.CreateForm:onDashboardCreated', () => {
			this.#grid.reload();
		});

		EventEmitter.subscribe('BIConnector.AccessRights:onRightsSaved', () => {
			this.#grid.reload();
		});

		EventEmitter.subscribe('BIConnector.GroupPopup:onGroupSaved', (event: BaseEvent) => {
			const eventData = event.getData();
			const groupId = eventData?.group?.id;
			const isTitleEdited = eventData?.isTitleEdited;
			const isDashboardListEdited = eventData?.isDashboardListEdited;
			const isScopeListEdited = eventData?.isScopeListEdited;

			if (groupId && (isTitleEdited || isDashboardListEdited || isScopeListEdited))
			{
				PermissionsAnalytics.sendGroupActionAnalytics(
					PermissionsAnalyticsSource.grid,
					Type.isString(groupId) ? groupId.startsWith('new_') : false,
					isDashboardListEdited,
					isScopeListEdited,
				);
			}

			this.#grid.reload();
		});

		EventEmitter.subscribe(
			'BIConnector.GroupPopup.DashboardScopeSelector:onDialogHide',
			(event: BaseEvent) => {
				if (!event.getData()?.isScopeListEdited)
				{
					return;
				}

				PermissionsAnalytics.sendGroupDashboardScopeEditAnalytics(
					PermissionsAnalyticsSource.grid,
				);
			},
		);

		EventEmitter.subscribe(
			'BIConnector.GroupPopup.ScopeSelector:onDialogHide',
			(event: BaseEvent) => {
				if (!event.getData()?.isScopeListEdited)
				{
					return;
				}

				PermissionsAnalytics.sendGroupScopeEditAnalytics(
					PermissionsAnalyticsSource.grid,
				);
			},
		);

		EventEmitter.subscribe(
			'BIConnector.GroupPopup.DashboardSelector:onDialogHide',
			(event: BaseEvent) => {
				if (!event.getData()?.isDashboardListEdited)
				{
					return;
				}

				PermissionsAnalytics.sendGroupDashboardEditAnalytics(
					PermissionsAnalyticsSource.grid,
				);
			},
		);

		EventEmitter.subscribe(
			'BIConnector.GroupPopup.DashboardList:onDashboardRemove',
			() => {
				PermissionsAnalytics.sendGroupDashboardEditAnalytics(
					PermissionsAnalyticsSource.grid,
				);
			},
		);

		EventEmitter.subscribe('BIConnector.SharePopup:onShareActivated', (event) => {
			this.#updateShareLinkCell(event.getData().dashboardId, true);
		});

		EventEmitter.subscribe('BIConnector.SharePopup:onShareDeactivated', (event) => {
			this.#updateShareLinkCell(event.getData().dashboardId, false);
		});

		// The settings slider emits into the top window.
		const topEventBus = window.top?.BX?.Event?.EventEmitter ?? EventEmitter;
		topEventBus.subscribe('BIConnector.ShareSetting:onChange', (event: BaseEvent) => {
			const dashboardId = Text.toInteger(event.getData().dashboardId);

			// A cached popup keeps the link state from before the change.
			this.#sharePopups.get(dashboardId)?.hide();
			this.#sharePopups.delete(dashboardId);
			this.getGrid().reload();
		});
	}

	#initHints(): void
	{
		const manager = BX.UI.Hint.createInstance({
			popupParameters: {
				autoHide: true,
			},
		});
		manager.init(this.#grid.getContainer());
	}

	#onSupersetStatusChange(status: string): void
	{
		if (status === 'READY')
		{
			this.getGrid().reload();
		}

		if (
			status !== 'LOAD'
			&& status !== 'ERROR'
			&& status !== 'LIMIT_EXCEEDED'
		)
		{
			return;
		}

		const statusMap = {
			LOAD: DashboardManager.DASHBOARD_STATUS_LOAD,
			ERROR: DashboardManager.DASHBOARD_STATUS_COMPUTED_NOT_LOAD,
			LIMIT_EXCEEDED: DashboardManager.DASHBOARD_STATUS_COMPUTED_NOT_LOAD,
		};

		const grid = this.getGrid();
		const rows = grid.getRows().getBodyChild();
		for (const row: BX.Grid.Row of rows)
		{
			const dashboardId = row.getId();
			const dashboardStatus = statusMap[status];
			if (dashboardStatus)
			{
				this.updateDashboardStatus(dashboardId, dashboardStatus);
			}
		}
	}

	#onDashboardListChanged(): void
	{
		this.getGrid().reload();
	}

	/**
	 * Warning about the term of the license running out, shown to an administrator of a boxed portal. The texts and
	 * the decision to show it come resolved from the server; the only thing decided here is that a popup seen once
	 * does not come back.
	 */
	#showSelfHostedLicensePopup(): void
	{
		const popup = this.#properties.selfHostedLicensePopup;
		if (!Type.isPlainObject(popup))
		{
			return;
		}

		this.#properties.selfHostedLicensePopup = null;
		const rememberTerm = () => {
			BX.userOptions.save(
				'biconnector',
				'selfhost_license_expiry_popup',
				popup.termKey,
				true,
			);
		};

		MessageBox.create({
			title: popup.title,
			message: popup.text,
			// Without an address there is nothing to offer, and the window keeps its plain confirmation button.
			buttons: popup.actionUrl ? [this.#getLicenseRenewalButton(popup, rememberTerm)] : MessageBoxButtons.OK,
			onOk: (messageBox) => messageBox.close(),
			popupOptions: {
				// Named so that a test can find the window: the texts of the popup come from the server and change
				// with the license.
				id: 'biconnector-selfhost-license-popup',
				events: {
					// Written on any way out of the popup, the cross included: the term has been seen, and the next
					// opening of the grid must not warn about it again.
					onPopupClose: rememberTerm,
				},
			},
		}).show();
	}

	/**
	 * The call to action is an anchor and not a handler: the address is resolved by the server, and a click on it
	 * leaves for another tab without closing the window. `onPopupClose` therefore does not fire on that click, so
	 * the term is written down right here; a later close writes the same value again, which costs one request and
	 * changes nothing.
	 */
	#getLicenseRenewalButton(popup: SelfHostedLicensePopup, rememberTerm: () => void): Button
	{
		return new Button({
			text: popup.actionText,
			// The size and the colour of the buttons the message box builds for itself once it has a title.
			size: ButtonSize.MEDIUM,
			color: Button.Color.PRIMARY,
			link: popup.actionUrl,
			props: { target: '_blank', rel: 'noopener' },
			onclick: rememberTerm,
		});
	}

	#showDraftGuide(node: HTMLElement): void
	{
		if (!this.#properties.isNeedShowDraftGuide)
		{
			return;
		}

		const labelNode = node.querySelector('.dashboard-status-label.ui-label-default');
		const cellNode = labelNode ? labelNode.closest('.main-grid-cell') : null;
		const guide = new Guide({
			steps: [
				{
					target: cellNode ?? node,
					title: Loc.getMessage('BICONNECTOR_SUPERSET_DASHBOARD_GRID_DRAFT_GUIDE_TITLE'),
					text: Loc.getMessage('BICONNECTOR_SUPERSET_DASHBOARD_GRID_DRAFT_GUIDE_TEXT'),
					events: {
						onClose: () => {
							BX.userOptions.save('biconnector', 'draft_guide', 'is_over', true);
						},
					},
					rounded: false,
					position: 'bottom',
					areaPadding: 0,
				},
			],
			onEvents: true,
		});

		guide.start();
		this.#properties.isNeedShowDraftGuide = false;
	}

	#showPublishAhaMoment(dashboardId: number, dashboardType: string): void
	{
		const ahaMomentOptions = this.#properties.publishAhaMoment;
		if (!Type.isPlainObject(ahaMomentOptions) || ahaMomentOptions.canShow !== true)
		{
			return;
		}

		const row = this.#grid.getRows().getById(dashboardId);
		const bindElement = row?.node?.querySelector(
			'.main-grid-cell.main-grid-cell-action .main-grid-row-action-button',
		) ?? row?.node?.querySelector('.main-grid-cell.main-grid-cell-action');
		if (!Type.isDomNode(bindElement))
		{
			return;
		}

		const actions = [
			{
				text: ahaMomentOptions.laterButtonText ?? '',
				style: 'secondary',
			},
			{
				text: ahaMomentOptions.addButtonText ?? '',
				style: 'primary',
				onclick: () => {
					DashboardManager.openSettingsSlider(dashboardId, dashboardType);
				},
			},
		];

		if (!this.#publishAhaMoment)
		{
			this.#publishAhaMoment = new AhaMoment({
				...ahaMomentOptions,
				bindElement,
				popupAlignment: 'start',
				popupOffsetLeftAdjustment: -33,
				actions,
			});
		}
		else
		{
			this.#publishAhaMoment.setBindElement(bindElement);
			this.#publishAhaMoment.setActions(actions);
		}

		this.#publishAhaMoment.show();
	}

	#showConstructorButtonHint(): void
	{
		if (this.#constructorHintFrameId !== null)
		{
			cancelAnimationFrame(this.#constructorHintFrameId);
			this.#constructorHintFrameId = null;
		}

		// BX.SpotLight caches the target rect before its own visibility check and never retries,
		// so the target must already be visible when the hint is shown.
		let framesLeft = CONSTRUCTOR_HINT_VISIBILITY_FRAMES;
		const showWhenTargetIsVisible = () => {
			this.#constructorHintFrameId = null;

			const icon = this.#findConstructorButtonIcon();
			if (icon && framesLeft > 0 && Dom.style(icon, 'visibility') === 'hidden')
			{
				framesLeft--;
				this.#constructorHintFrameId = requestAnimationFrame(showWhenTargetIsVisible);

				return;
			}

			this.#showConstructorButtonHintNow();
		};

		showWhenTargetIsVisible();
	}

	#showConstructorButtonHintNow(): void
	{
		const hintOptions = this.#properties.constructorButtonHint;
		if (!Type.isPlainObject(hintOptions) || hintOptions.canShow !== true)
		{
			return;
		}

		// The hint is a one-shot: AhaMoment drops its own canShow as soon as the user has closed it.
		if (this.#constructorButtonHint && !this.#constructorButtonHint.canShow)
		{
			return;
		}

		// Our own popup counts as shown, so the guard must not fire while the hint is still up.
		if (!this.#constructorButtonHint?.isShown && PopupManager.isAnyPopupShown())
		{
			return;
		}

		const bindElement = this.#findConstructorButtonIcon();
		const rowNode = bindElement?.closest('.main-grid-row');
		if (!rowNode)
		{
			return;
		}

		if (this.#constructorButtonHint)
		{
			this.#constructorButtonHint.setBindElement(bindElement);
		}
		else
		{
			this.#constructorButtonHint = new AhaMoment({
				...hintOptions,
				bindElement,
			});
		}

		const wasShown = this.#constructorButtonHint.isShown;

		this.#clearConstructorHintRow();
		Dom.addClass(rowNode, 'biconnector-constructor-hint-row');
		this.#constructorHintRowNode = rowNode;

		this.#constructorButtonHint.show();

		if (!this.#constructorButtonHint.isShown)
		{
			this.#clearConstructorHintRow();

			return;
		}

		if (!wasShown)
		{
			// AhaMoment exposes no lifecycle callbacks; its popup is the only place that reports a close.
			this.#constructorButtonHint.popup?.subscribeOnce('onClose', () => {
				this.#clearConstructorHintRow();
			});
		}
	}

	#findConstructorButtonIcon(): ?HTMLElement
	{
		for (const row: BX.Grid.Row of this.#grid.getRows().getBodyChild())
		{
			const icon = row.getNode().querySelector('.dashboard-title-constructor-button i');
			if (icon)
			{
				return icon;
			}
		}

		return null;
	}

	#clearConstructorHintRow(): void
	{
		if (this.#constructorHintRowNode)
		{
			Dom.removeClass(this.#constructorHintRowNode, 'biconnector-constructor-hint-row');
			this.#constructorHintRowNode = null;
		}
	}

	#colorPinnedRows(): void
	{
		this.#lastPinnedRowId = 0;
		const rows = this.#grid.getRows().getBodyChild();
		for (const row: BX.Grid.Row of rows)
		{
			if (row.node.querySelector('.dashboard-unpin-icon'))
			{
				Dom.addClass(row.node, 'biconnector-dashboard-pinned');
				this.#lastPinnedRowId = row.getId();
			}
		}
	}

	onUpdatedDashboardBatchStatus(dashboardList: Array)
	{
		for (const dashboard of dashboardList)
		{
			this.updateDashboardStatus(dashboard.id, dashboard.status);
		}
	}

	getGrid(): BX.Main.grid
	{
		return this.#grid;
	}

	getFilter(): BX.Main.Filter
	{
		return this.#filter;
	}

	/**
	 * @param params LoginPopupParams
	 * @param openedFrom
	 */
	showLoginPopup(params: LoginPopupParams, openedFrom: string = 'unknown')
	{
		if (
			!Type.isNumber(params.dashboardId)
			|| !['CUSTOM', 'MARKET', 'SYSTEM'].includes(params.type)
			|| !Type.isStringFilled(params.editUrl)
		)
		{
			// noinspection JSIgnoredPromiseFromCall
			console.error('SupersetDashboardGridManager: showLoginPopup called with invalid params', params);

			return;
		}

		const grid = this.getGrid();
		if (params.type === 'CUSTOM')
		{
			grid.tableFade();
		}

		this.#dashboardManager.processEditDashboard(
			{
				id: params.dashboardId,
				type: params.type,
				editLink: params.editUrl,
				// The button leads to the constructor, so the copy opens ready for editing,
				// the same way a custom report does.
				openInEditMode: true,
			},
			() => {
				grid.tableUnfade();
			},
			(popupType) => {
				ApacheSupersetAnalytics.sendAnalytics('edit', 'report_edit', {
					c_sub_section: popupType,
					c_element: openedFrom,
					type: params.type.toLowerCase(),
					p1: ApacheSupersetAnalytics.buildAppIdForAnalyticRequest(params.appId),
					p2: params.dashboardId,
					status: 'success',
				});
			},
			(popupType) => {
				ApacheSupersetAnalytics.sendAnalytics('edit', 'report_edit', {
					c_sub_section: popupType,
					c_element: openedFrom,
					type: params.type.toLowerCase(),
					p1: ApacheSupersetAnalytics.buildAppIdForAnalyticRequest(params.appId),
					p2: params.dashboardId,
					status: 'error',
				});
			},
		);
	}

	showSharePopup(element: HTMLElement): void
	{
		if (element.dataset.banned === 'Y')
		{
			return;
		}

		const dashboardId = parseInt(element.dataset.dashboardId, 10);
		const shareDataRaw = element.dataset.share;
		let initialShareData = null;

		if (shareDataRaw && shareDataRaw !== '' && shareDataRaw !== '""')
		{
			try
			{
				initialShareData = JSON.parse(shareDataRaw);
			}
			catch
			{}
		}

		if (!this.#sharePopups.has(dashboardId))
		{
			this.#sharePopups.set(dashboardId, new SharePopup({
				dashboardId,
				dashboardTitle: element.dataset.title ?? '',
				initialShareData,
				type: (element.dataset.type ?? '').toLowerCase(),
				analyticsElement: 'grid_menu',
			}));
		}

		this.#sharePopups.get(dashboardId).show();
	}

	#updateShareLinkCell(dashboardId: number, isActive: boolean): void
	{
		const row = this.#grid.getRows().getById(dashboardId);
		if (!row)
		{
			return;
		}

		const cell = row.getCellById('SHARE_LINK');
		if (!cell)
		{
			return;
		}

		const link = cell.querySelector('.dashboard-share-link');
		if (!link || link.dataset.banned === 'Y')
		{
			return;
		}

		if (isActive)
		{
			Dom.removeClass(link, 'dashboard-share-link--inactive');
			Dom.addClass(link, 'dashboard-share-link--active');
			link.textContent = Loc.getMessage('BICONNECTOR_SUPERSET_DASHBOARD_GRID_SHARE_LINK_ACTIVE');
		}
		else
		{
			Dom.removeClass(link, 'dashboard-share-link--active');
			Dom.addClass(link, 'dashboard-share-link--inactive');
			link.textContent = Loc.getMessage('BICONNECTOR_SUPERSET_DASHBOARD_GRID_SHARE_LINK_INACTIVE');
		}
	}

	#isActiveGroupIdFilter(): boolean
	{
		const filterFieldsValues = this.getFilter().getFilterFieldsValues();
		const selectedGroups: string[] = filterFieldsValues['GROUPS.ID'] ?? [];

		return selectedGroups.length > 0;
	}

	/**
	 * @param event PointerEvent
	 */
	showCreationMenu(event: PointerEvent): void
	{
		const openedMenu: ?Menu = MenuManager.getMenuById('biconnector-creation-menu');
		if (openedMenu)
		{
			openedMenu.close();

			return;
		}

		const items = [];

		if (this.#properties.isAvailableDashboardCreation)
		{
			items.push(
				{
					text: Loc.getMessage('BICONNECTOR_APACHE_SUPERSET_DASHBOARD_LIST_MENU_ITEM_NEW_DASHBOARD'),
					onclick: () => {
						this.openCreationSlider();
						creationMenu.close();
					},
				},
			);
		}

		if (this.#properties.isAvailableGroupCreation)
		{
			items.push(
				{
					text: Loc.getMessage('BICONNECTOR_APACHE_SUPERSET_DASHBOARD_LIST_MENU_ITEM_NEW_GROUP'),
					onclick: () => {
						this.showCreationGroupPopup();
						creationMenu.close();
					},
					disabled: this.#isActiveGroupIdFilter(),
				},
			);
		}

		items.push(
			{
				text: Loc.getMessage('BICONNECTOR_APACHE_SUPERSET_DASHBOARD_LIST_MENU_ITEM_CREATE_DASHBOARD'),
				onclick: () => {
					this.showMarketSlider(this.#properties.isMarketExists, this.#properties.marketUrl);
					creationMenu.close();
				},
			},
			{
				text: Loc.getMessage('BICONNECTOR_APACHE_SUPERSET_DASHBOARD_LIST_MENU_ITEM_ORDER_DASHBOARD'),
				onclick: () => {
					BX.BIConnector.ApacheSupersetFeedbackForm.requestIntegrationFormOpen();
					creationMenu.close();
				},
			},
		);

		const creationMenu = MenuManager.create({
			id: 'biconnector-creation-menu',
			closeByEsc: false,
			closeIcon: false,
			cacheable: false,
			angle: true,
			offsetLeft: 20,
			items,
			autoHide: true,
			bindElement: event.target,
		});

		creationMenu.show();
	}

	restartDashboardLoad(dashboardId: number): void
	{
		const row = this.#grid.getRows().getById(dashboardId);
		if (row)
		{
			const btn = row.node.querySelector('#restart-dashboard-load-btn');
			if (Type.isDomNode(btn))
			{
				const isDisabled = btn.getAttribute('disabled');
				if (isDisabled)
				{
					return;
				}

				btn.setAttribute('disabled', 'true');
				Dom.addClass(btn, 'dashboard-status-label-error-btn__loading');
			}
		}

		this.#dashboardManager
			.restartDashboardImport(dashboardId)
			.then(
				(response) => {
					const dashboardIds = response?.data?.restartedDashboardIds;
					if (!dashboardIds)
					{
						return;
					}

					for (const restartedDashboardId of dashboardIds)
					{
						this.updateDashboardStatus(restartedDashboardId, DashboardManager.DASHBOARD_STATUS_LOAD);
					}
				},
			)
			.catch()
		;
	}

	updateDashboardStatus(dashboardId: number, status: string): void
	{
		const row = this.#grid.getRows().getById(dashboardId);
		if (row)
		{
			const labelWrapper = row.node.querySelector('.dashboard-status-label-wrapper');
			const label = labelWrapper.querySelector('.dashboard-status-label');
			const reloadBtn = labelWrapper.querySelector('#restart-dashboard-load-btn');

			let labelClass = '';
			let labelTitle = '';

			switch (status)
			{
				case DashboardManager.DASHBOARD_STATUS_READY:
					setTimeout(() => this.#grid.updateRow(dashboardId), 500);

					return;
				case DashboardManager.DASHBOARD_STATUS_DRAFT:
					labelClass = 'ui-label-default';
					labelTitle = Loc.getMessage('BICONNECTOR_SUPERSET_DASHBOARD_GRID_STATUS_DRAFT');
					break;
				case DashboardManager.DASHBOARD_STATUS_LOAD:
					labelClass = 'ui-label-primary';
					labelTitle = Loc.getMessage('BICONNECTOR_SUPERSET_DASHBOARD_GRID_STATUS_LOAD');
					break;
				case DashboardManager.DASHBOARD_STATUS_FAILED:
					labelClass = 'ui-label-danger';
					labelTitle = Loc.getMessage('BICONNECTOR_SUPERSET_DASHBOARD_GRID_STATUS_FAILED');
					break;
				case DashboardManager.DASHBOARD_STATUS_COMPUTED_NOT_LOAD:
					labelClass = 'ui-label-danger';
					labelTitle = Loc.getMessage('BICONNECTOR_SUPERSET_DASHBOARD_GRID_STATUS_NOT_LOAD');
					break;
			}

			if (this.#properties.supersetStatus === 'LIMIT_EXCEEDED')
			{
				labelClass = 'ui-label-danger';
				labelTitle = Loc.getMessage('BICONNECTOR_SUPERSET_DASHBOARD_GRID_STATUS_NOT_LOAD');
			}

			if (labelClass === '')
			{
				return;
			}

			if (reloadBtn)
			{
				reloadBtn.remove();
			}

			if (status === DashboardManager.DASHBOARD_STATUS_FAILED)
			{
				const createdReloadBtn = this.createReloadBtn(dashboardId);
				Dom.append(createdReloadBtn, labelWrapper);
			}

			const labelStatuses = [
				'ui-label-lightgreen',
				'ui-label-default',
				'ui-label-primary',
				'ui-label-danger',
			];
			Dom.addClass(label, labelClass);
			labelStatuses.forEach((uiStatus: string) => {
				if (uiStatus !== labelClass)
				{
					Dom.removeClass(label, uiStatus);
				}
			});

			label.querySelector('span').innerText = labelTitle;
		}
	}

	createReloadBtn(dashboardId: number): HTMLElement
	{
		return Tag.render`
			<div id="restart-dashboard-load-btn" onclick="BX.BIConnector.SupersetDashboardGridManager.Instance.restartDashboardLoad(${dashboardId})" class="dashboard-status-label-error-btn">
				<div class="ui-icon-set --refresh-5 dashboard-status-label-error-icon"></div>
			</div>
		`;
	}

	duplicateDashboard(dashboardId: number, analyticInfo: DashboardAnalyticInfo = null): void
	{
		const grid = this.getGrid();
		grid.tableFade();
		let copyFinished = false;
		const finishCopy = () => {
			if (copyFinished)
			{
				return;
			}

			copyFinished = true;
			try
			{
				grid.tableUnfade();
			}
			catch (cleanupError)
			{
				console.error(cleanupError);
			}
		};

		const runResultBranch = (branch: () => void) => {
			try
			{
				branch();
			}
			catch (handlerError)
			{
				setTimeout(() => {
					throw handlerError;
				}, 0);
			}
			finally
			{
				finishCopy();
			}
		};

		return this.#dashboardManager.duplicateDashboard(dashboardId)
			.then((response) => runResultBranch(() => {
				const gridRealtime: BX.Grid.Realtime = grid.getRealtime();
				const newDashboard = response.data.dashboard;

				const newRow = {
					id: newDashboard.id,
					columns: newDashboard.columns,
					actions: newDashboard.actions,
				};

				const firstDashboardRow = this.#grid
					.getRows()
					.getRowsByGroupId('D')
					.find((row) => !Dom.hasClass(row.node, 'biconnector-dashboard-pinned'))
				;
				if (firstDashboardRow)
				{
					newRow.insertBefore = firstDashboardRow?.getId();
				}
				else
				{
					newRow.insertAfter = 0;
				}

				gridRealtime.addRow(newRow);
				const newRowNode = this.#grid.getRows().getById(newDashboard.id).node;
				newRowNode.setAttribute('data-group-id', 'D');

				const editableData = grid.getParam('EDITABLE_DATA');
				if (BX.type.isPlainObject(editableData))
				{
					editableData[newDashboard.id] = { TITLE: newDashboard.title };
				}

				const counterTotalTextContainer = grid.getCounterTotal().querySelector('.main-grid-panel-content-text');
				counterTotalTextContainer.textContent++;

				this.#initHints();
				BX.UI.Notification.Center.notify({
					content: Loc.getMessage('BICONNECTOR_SUPERSET_DASHBOARD_GRID_COPY_NOTIFICATION_ADDED'),
				});

				if (analyticInfo !== null)
				{
					ApacheSupersetAnalytics.sendAnalytics('edit', 'report_copy', {
						type: analyticInfo.type,
						p1: ApacheSupersetAnalytics.buildAppIdForAnalyticRequest(analyticInfo.appId),
						p2: dashboardId,
						status: 'success',
						c_element: analyticInfo.from,
					});
				}
			}), (response) => runResultBranch(() => {
				this.#notifyError(
					response,
					Loc.getMessage('BICONNECTOR_SUPERSET_DASHBOARD_GRID_COPY_NOTIFICATION_ERROR'),
				);

				if (analyticInfo !== null)
				{
					ApacheSupersetAnalytics.sendAnalytics('edit', 'report_copy', {
						type: analyticInfo.type,
						p1: ApacheSupersetAnalytics.buildAppIdForAnalyticRequest(analyticInfo.appId),
						p2: dashboardId,
						status: 'error',
						c_element: analyticInfo.from,
					});
				}
			}))
		;
	}

	#notifyError(response: Object, fallbackMessage: string): void
	{
		BX.UI.Notification.Center.notify({
			content: resolveErrorHtml(response, fallbackMessage),
		});
	}

	exportDashboard(dashboardId: number): void
	{
		const grid = this.getGrid();
		grid.tableFade();

		return this.#dashboardManager.exportDashboard(dashboardId, 'grid_menu');
	}

	publish(dashboardId: number, options: ?Object = null): void
	{
		const publishOptions = Type.isPlainObject(options) ? options : {};
		const dashboardType = publishOptions.type ?? 'CUSTOM';

		this.#dashboardManager.toggleDraft(dashboardId, true)
			.then(() => {
				this.#grid.updateRow(dashboardId, null, null, () => {
					this.#showPublishAhaMoment(dashboardId, dashboardType);
				});
			})
			.catch(() => {
				BX.UI.Notification.Center.notify({
					content: Loc.getMessage('BICONNECTOR_SUPERSET_DASHBOARD_GRID_PUBLISH_NOTIFICATION_ERROR'),
				});
			})
		;
	}

	setDraft(dashboardId: number): void
	{
		this.#dashboardManager.toggleDraft(dashboardId, false)
			.then(() => {
				this.#sharePopups.delete(dashboardId);
				this.updateDashboardStatus(dashboardId, DashboardManager.DASHBOARD_STATUS_DRAFT);
				this.#grid.updateRow(dashboardId, null, null, (result) => {
					this.#showDraftGuide(this.#grid.getRows().getById(dashboardId).node);
				});
			})
			.catch(() => {
				BX.UI.Notification.Center.notify({
					content: Loc.getMessage('BICONNECTOR_SUPERSET_DASHBOARD_GRID_SET_DRAFT_NOTIFICATION_ERROR'),
				});
			})
		;
	}

	deleteDashboard(dashboardId: number, dashboardType: string): void
	{
		this.#dashboardManager.showDeleteDashboardDialog({
			dashboardId,
			dashboardType,
		})
			.then((result) => {
				if (result.status === 'deleted')
				{
					this.getGrid().reload();
				}
			})
			.catch(() => {})
		;
	}

	deleteGroup(groupId: number): void
	{
		const deletePopup = new SystemDialog({
			title: Loc.getMessage('BICONNECTOR_SUPERSET_DASHBOARD_GRID_DELETE_GROUP_POPUP_TITLE_MSGVER_1'),
			subtitle: Loc.getMessage('BICONNECTOR_SUPERSET_DASHBOARD_GRID_DELETE_GROUP_POPUP_DESC'),
			hasCloseButton: true,
			closeByEsc: true,
			hasOverlay: true,
			disableScrolling: true,
			centerButtons: [
				new Button({
					text: Loc.getMessage('BICONNECTOR_SUPERSET_DASHBOARD_GRID_DELETE_GROUP_POPUP_CAPTION_YES'),
					useAirDesign: true,
					size: ButtonSize.LARGE,
					style: AirButtonStyle.FILLED_ALERT,
					onclick: (button) => {
						PermissionsAnalytics.sendGroupDeleteAnalytics(PermissionsAnalyticsSource.grid);
						button.setWaiting();
						this.#dashboardManager.deleteGroup(groupId)
							.then(() => {
								this.getGrid().reload();
								deletePopup.hide();
							})
							.catch((response) => {
								deletePopup.hide();
								this.#notifyError(
									response,
									Loc.getMessage('BICONNECTOR_SUPERSET_DASHBOARD_GRID_DELETE_GROUP_ERROR'),
								);
							});
					},
				}),
				new CancelButton({
					text: Loc.getMessage('BICONNECTOR_SUPERSET_DASHBOARD_GRID_DELETE_GROUP_POPUP_CAPTION_NO'),
					size: ButtonSize.LARGE,
					useAirDesign: true,
					style: AirButtonStyle.PLAIN,
					onclick: (button) => deletePopup.hide(),
				}),
			],
		});

		deletePopup.show();
	}

	async openConstructorWorkspace(): Promise<void>
	{
		try
		{
			await this.#dashboardManager.openConstructorWorkspace();

			ApacheSupersetAnalytics.sendAnalytics(
				'edit',
				'constructor_open',
				{
					c_element: 'grid_toolbar',
					status: 'success',
				},
			);
		}
		catch
		{
			ApacheSupersetAnalytics.sendAnalytics(
				'edit',
				'constructor_open',
				{
					c_element: 'grid_toolbar',
					status: 'error',
				},
			);
		}
	}

	openCreationSlider(): void
	{
		const filterFieldsValues = this.getFilter().getFilterFieldsValues();
		const selectedGroups: string[] = filterFieldsValues['GROUPS.ID'] ?? [];

		this.#dashboardManager.openCreationSlider(selectedGroups);
	}

	notifyPermissionErrorOpenCreationSlider(): void
	{
		BX.UI.Notification.Center.notify({
			content: Loc.getMessage('BICONNECTOR_APACHE_SUPERSET_DASHBOARD_LIST_ERROR_OPEN_CREATE_DASHBOARD'),
		});
	}

	showMarketSlider(isMarketExists: boolean, marketUrl: string): void
	{
		ApacheSupersetMarketManager.openMarket(isMarketExists, marketUrl, 'menu');
	}

	showCreationGroupPopup(): void
	{
		if (this.#isActiveGroupIdFilter())
		{
			return;
		}

		this.#dashboardManager.showCreationGroupPopup();

		PermissionsAnalytics.sendClickGroupActionAnalytics(
			PermissionsAnalyticsSource.grid,
			true,
		);
	}

	#getTitleNameLink(dashboardId: number): ?HTMLElement
	{
		const titleCell = this.getGrid().getRows().getById(dashboardId)?.getCellById('TITLE');

		return titleCell?.querySelector('.biconnector-grid-title a');
	}

	showGroupSettingsPopup(groupId: number): void
	{
		PermissionsAnalytics.sendClickGroupActionAnalytics(
			PermissionsAnalyticsSource.grid,
			false,
		);

		this.#grid.tableFade();
		this.#dashboardManager.showGroupSettingsPopup(groupId)
			.then(() => {
				this.#grid.tableUnfade();
			})
			.catch(() => {
				this.#grid.tableUnfade();
			})
		;
	}

	handleGroupTitleClick(groupJson: Object): void
	{
		this.#pushHistoryState();

		// A group replaces the groups already in the filter instead of joining them, and a click on the group
		// the list is filtered by takes the condition off. One extendFilter() applies the filter once.
		const isFiltered = Boolean(groupJson.IS_FILTERED);
		this.getFilter().getApi().extendFilter({
			'GROUPS.ID': isFiltered ? [] : [String(groupJson.ID)],
			'GROUPS.ID_label': isFiltered ? [] : [groupJson.TITLE],
		});
	}

	handleTagClick(tagJson: string): void
	{
		const tag = JSON.parse(tagJson);
		this.handleFilterChange({
			fieldId: 'TAGS.ID',
			...tag,
		});
	}

	handleTagAddClick(dashboardId: number, preselectedIds: [], event: BaseEvent): void
	{
		const onTagsChange = () => {
			const tags = this.#tagSelectorDialog.getSelectedItems().map((item) => item.getId());
			this.#dashboardManager
				.setDashboardTags(dashboardId, tags)
				.then(
					() => {
						this.getGrid().updateRow(dashboardId, null, null, () => {
							const anchor = this.getGrid()
								.getRows()
								.getById(dashboardId)
								?.getCellById('TAGS')
							;

							if (anchor && this.#tagSelectorDialog)
							{
								this.#tagSelectorDialog.setTargetNode(anchor);
							}
						});
						const filterTagValues = this.getFilter().getFilterFieldsValues();
						const currentFilteredTags = filterTagValues['TAGS.ID'] ?? [];
						if (currentFilteredTags.length > 0)
						{
							const filtered = tags.filter((tagId) => currentFilteredTags.includes(String(tagId)));
							if (filtered.length === 0)
							{
								this.#tagSelectorDialog.destroy();

								this.#tagSelectorDialog = null;
							}
						}
					},
				)
				.catch((response) => {
					this.#notifyError(
						response,
						Loc.getMessage('BICONNECTOR_SUPERSET_DASHBOARD_GRID_SET_TAGS_ERROR'),
					);
				})
			;
		};
		const entityId = 'biconnector-superset-dashboard-tag';

		const preselectedItems = [];
		JSON.parse(preselectedIds).forEach((id) => preselectedItems.push([entityId, id]));
		this.#tagSelectorDialog = new Dialog({
			id: 'biconnector-superset-tag-widget',
			targetNode: event.getData().button,
			enableSearch: true,
			width: 350,
			height: 400,
			multiple: true,
			dropdownMode: true,
			compactView: true,
			context: entityId,
			clearUnavailableItems: true,
			entities: [
				{
					id: entityId,
					options: {
						dashboardId,
					},
				},
			],
			preselectedItems,
			searchOptions: {
				allowCreateItem: false,
			},
			footer: TagFooter,
			events: {
				onSearch: (event: BaseEvent) => {
					const query = event.getData().query;

					const footer: TagFooter = this.#tagSelectorDialog.getFooter();
					const footerWrapper = this.#tagSelectorDialog.getFooterContainer();
					if (Type.isStringFilled(query.trim()) && footer.canCreateTag())
					{
						Dom.show(footerWrapper.querySelector('#tags-widget-custom-footer-add-new'));
						Dom.show(footerWrapper.querySelector('#tags-widget-custom-footer-conjunction'));

						return;
					}

					Dom.hide(footerWrapper.querySelector('#tags-widget-custom-footer-add-new'));
					Dom.hide(footerWrapper.querySelector('#tags-widget-custom-footer-conjunction'));
				},
				'Search:onItemCreateAsync': (searchEvent: BaseEvent) => {
					return new Promise((resolve, reject) => {
						const { searchQuery } = searchEvent.getData();
						const name = searchQuery.getQuery();

						this.#dashboardManager.addTag(name)
							.then((result) => {
								const newTag = result.data;
								const item = this.#tagSelectorDialog.addItem({
									id: newTag.ID,
									entityId,
									title: name,
									tabs: 'all',
								});
								if (item)
								{
									item.select();
								}

								resolve();
							})
							.catch((result) => {
								const errors = Type.isArray(result?.errors) ? result.errors : [];
								const messages = errors
									.map((error) => getUserFacingErrorHtml(error))
									.filter((message) => message !== null)
								;
								if (messages.length === 0)
								{
									messages.push(
										Loc.getMessage('BICONNECTOR_SUPERSET_DASHBOARD_GRID_CREATE_TAG_ERROR'),
									);
								}

								const alert = Tag.render`
									<div class="dashboard-tag-already-exists-alert" role="alert">
										<div class='ui-alert ui-alert-xs ui-alert-danger'>
											<span class='ui-alert-message'>
												${messages.join('<br>')}
											</span>
										</div>
									</div>
								`;

								const footerContainer = this.#tagSelectorDialog.getFooterContainer();
								const previousAlert = footerContainer.querySelector('.dashboard-tag-already-exists-alert');
								if (previousAlert)
								{
									Dom.remove(previousAlert);
								}

								Dom.prepend(alert, footerContainer);
								setTimeout(
									() => {
										Dom.remove(alert);
									},
									8000,
								);

								reject();
							})
						;
					});
				},
				'Item:onSelect': Runtime.debounce(onTagsChange, 100, this),
				'Item:onDeselect': Runtime.debounce(onTagsChange, 100, this),
			},
		});

		this.#tagSelectorDialog.show();
	}

	handleCreatedByClick(ownerData: Object)
	{
		this.handleFilterChange({
			fieldId: 'CREATED_BY_ID',
			...ownerData,
		});
	}

	handleFilterChange(fieldData: Object)
	{
		const filterFieldsValues = this.getFilter().getFilterFieldsValues();
		let currentFilteredField = filterFieldsValues[fieldData.fieldId] ?? [];
		let currentFilteredFieldLabel = filterFieldsValues[`${fieldData.fieldId}_label`] ?? [];

		if (fieldData.IS_FILTERED)
		{
			currentFilteredField = currentFilteredField.filter((value) => parseInt(value, 10) !== fieldData.ID);
			currentFilteredFieldLabel = currentFilteredFieldLabel.filter((value) => value !== fieldData.TITLE);
		}
		else if (!currentFilteredField.includes(fieldData.ID))
		{
			currentFilteredField.push(fieldData.ID.toString());
			currentFilteredFieldLabel.push(fieldData.TITLE);
		}

		const filterApi = this.getFilter().getApi();
		const filterToExtend = {};
		filterToExtend[fieldData.fieldId] = currentFilteredField;
		filterToExtend[`${fieldData.fieldId}_label`] = currentFilteredFieldLabel;

		filterApi.extendFilter(filterToExtend);
	}

	addToTopMenu(dashboardId: number, url: string, restrictionCode: ?string = null): Promise
	{
		BX.UI.Notification.Center.notify({
			content: Loc.getMessage('BICONNECTOR_SUPERSET_DASHBOARD_GRID_ADD_TO_TOP_MENU_SUCCESS'),
		});
		this.#switchTopMenuAction(dashboardId, true, url, restrictionCode);

		return this.#dashboardManager.addToTopMenu(dashboardId)
			.then((response) => {
				this.#grid.updateRow(dashboardId);
			})
			.catch((response) => {
				this.#grid.updateRow(dashboardId);
				BX.UI.Notification.Center.notify({
					content: Loc.getMessage('BICONNECTOR_SUPERSET_DASHBOARD_GRID_ADD_TO_TOP_MENU_ERROR'),
				});
			})
		;
	}

	deleteFromTopMenu(dashboardId: number, url: string, restrictionCode: ?string = null): Promise
	{
		BX.UI.Notification.Center.notify({
			content: Loc.getMessage('BICONNECTOR_SUPERSET_DASHBOARD_GRID_DELETE_FROM_TOP_MENU_SUCCESS'),
		});
		this.#switchTopMenuAction(dashboardId, false, url, restrictionCode);

		return this.#dashboardManager.deleteFromTopMenu(dashboardId)
			.then((response) => {
				this.#grid.updateRow(dashboardId);
			})
			.catch((response) => {
				this.#grid.updateRow(dashboardId);
				BX.UI.Notification.Center.notify({
					content: Loc.getMessage('BICONNECTOR_SUPERSET_DASHBOARD_GRID_DELETE_FROM_TOP_MENU_ERROR'),
				});
			})
		;
	}

	#switchTopMenuAction(dashboardId: number, isInTopMenu: boolean, url: string = '/', restrictionCode: ?string = null)
	{
		const row = this.#grid.getRows().getById(dashboardId);
		const rowActions = row?.getActions();
		for (const [index, action] of rowActions.entries())
		{
			if (isInTopMenu && action.ACTION_ID === 'addToTopMenu')
			{
				rowActions[index].ACTION_ID = 'deleteFromTopMenu';
				rowActions[index].onclick = `BX.BIConnector.SupersetDashboardGridManager.Instance.deleteFromTopMenu(${dashboardId}, \`${url}\`, \`${restrictionCode}\`)`;
				rowActions[index].text = Loc.getMessage('BICONNECTOR_SUPERSET_DASHBOARD_GRID_ACTION_ITEM_DELETE_FROM_TOP_MENU');
			}
			else if (!isInTopMenu && action.ACTION_ID === 'deleteFromTopMenu')
			{
				rowActions[index].ACTION_ID = 'addToTopMenu';
				rowActions[index].onclick = `BX.BIConnector.SupersetDashboardGridManager.Instance.addToTopMenu(${dashboardId}, \`${url}\`, \`${restrictionCode}\`)`;
				rowActions[index].text = Loc.getMessage('BICONNECTOR_SUPERSET_DASHBOARD_GRID_ACTION_ITEM_ADD_TO_TOP_MENU');
			}
		}
		row.setActions(rowActions);

		const dashboardTitle = this.#getTitleNameLink(dashboardId)?.innerText ?? row.getEditData().TITLE ?? '';

		const onClick = restrictionCode
			? `top.BX.UI.InfoHelper.show('${restrictionCode}');`
			: `window.open(\`${url}\`, '_blank');`
		;
		const isLocked = restrictionCode ? true : false;

		const menu: BX.Main.interfaceButtons = BX.Main.interfaceButtonsManager.getById('biconnector_superset_menu');
		if (isInTopMenu && dashboardTitle)
		{
			menu.addMenuItem({
				ID: `biconnector_superset_menu_dashboard_${dashboardId}`,
				TEXT: dashboardTitle,
				ON_CLICK: onClick,
				IS_LOCKED: isLocked,

				// TODO: Temporary workaround for compatibility with main 25.300.0, remove after that version is released
				id: `biconnector_superset_menu_dashboard_${dashboardId}`,
				text: dashboardTitle,
				onClick,
				isLocked,
			});
			const menuItem = menu.getItemById(`biconnector_superset_menu_dashboard_${dashboardId}`);
			const firstMenuItem = menu.getVisibleItems();
			Dom.insertBefore(menuItem, firstMenuItem[0]);
		}
		else
		{
			const menuItem = menu.getItemById(`biconnector_superset_menu_dashboard_${dashboardId}`);
			menu.deleteMenuItem(menuItem);
		}
	}

	pin(dashboardId: number): void
	{
		return this.#dashboardManager.pin(dashboardId)
			.then(() => {
				this.#grid.reload();
			})
			.catch(() => {})
		;
	}

	unpin(dashboardId: number): void
	{
		return this.#dashboardManager.unpin(dashboardId)
			.then(() => {
				this.#grid.reload();
			})
			.catch(() => {})
		;
	}

	#isWindowHistoryReady(): boolean
	{
		return (
			window
			&& window.history
			&& Type.isFunction(window.history.pushState)
			&& Type.isFunction(window.history.replaceState)
		);
	}

	#replaceHistoryState(): void
	{
		if (!this.#isWindowHistoryReady())
		{
			return;
		}

		const state = history.state ?? {};

		const filter = this.getFilter();
		const filterState = clone(filter.getFilterFieldsValues());
		history.replaceState({ ...state, filter: filterState }, '', window.location.href);
	}

	#pushHistoryState(): void
	{
		if (!this.#isWindowHistoryReady())
		{
			return;
		}

		const state = history.state ?? {};

		const filter = this.getFilter();
		const filterState = clone(filter.getFilterFieldsValues());
		history.pushState({ ...state, filter: filterState }, '', window.location.href);
	}

	openDashboardInConstructor(params: LoginPopupParams): void
	{
		// System and market reports cannot be edited in place: the shared flow offers a copy
		// and opens the copy instead.
		if (params.type !== 'CUSTOM')
		{
			this.showLoginPopup(params, 'grid_row');

			return;
		}

		if (!Type.isNumber(params.dashboardId) || !Type.isStringFilled(params.editUrl))
		{
			return;
		}

		const grid = this.getGrid();
		grid.tableFade();

		const sendAnalytics = (status: string) => {
			ApacheSupersetAnalytics.sendAnalytics('edit', 'report_edit', {
				c_sub_section: 'popup_login',
				c_element: 'grid_row',
				type: params.type.toLowerCase(),
				p1: ApacheSupersetAnalytics.buildAppIdForAnalyticRequest(params.appId),
				p2: params.dashboardId,
				status,
			});
		};

		this.#dashboardManager.openDashboardInConstructor({
			id: params.dashboardId,
			type: params.type,
			editLink: params.editUrl,
		})
			.then(() => {
				sendAnalytics('success');
			})
			.catch(() => {
				sendAnalytics('error');
			})
			.finally(() => {
				grid.tableUnfade();
			});
	}
}

Reflection.namespace('BX.BIConnector').SupersetDashboardGridManager = SupersetDashboardGridManager;
