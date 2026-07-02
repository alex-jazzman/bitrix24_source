/* eslint-disable */
(function (main_core, main_popup, main_date, biconnector_apacheSupersetDashboardManager, main_core_events, biconnector_apacheSupersetAnalytics, ui_entitySelector, ui_tour, biconnector_apacheSupersetMarketManager, biconnector_entitySelector, ui_buttons, ui_alerts, ui_forms, ui_system_dialog, biconnector_ahaMoment, ui_system_typography, biconnector_sharePopup) {
	'use strict';

	/**
	 * @namespace BX.BIConnector
	 */
	class SupersetDashboardGridManager {
		#dashboardManager = null;
		#grid;
		#filter;
		#tagSelectorDialog;
		#lastPinnedRowId;
		#publishAhaMoment;
		#properties;
		#sharePopups = new Map();
		constructor(props) {
			this.#dashboardManager = new biconnector_apacheSupersetDashboardManager.DashboardManager();
			this.#properties = props;
			this.#grid = BX.Main.gridManager.getById(props.gridId)?.instance;
			this.#filter = BX.Main.filterManager.getById(props.gridId);
			this.#subscribeToEvents();
			this.#colorPinnedRows();
			this.#initHints();
			this.#replaceHistoryState();
		}
		#subscribeToEvents() {
			main_core.Event.bind(document.getElementById('biconnector-dataset-typing-warning-details'), 'click', event => {
				event.preventDefault();
				this.openDatasetTypingSettings();
			});
			main_core.Event.bind(window, 'popstate', event => {
				const filterState = event.state?.filter;
				if (!filterState || !main_core.Type.isPlainObject(filterState)) {
					return;
				}
				const filterApi = this.getFilter().getApi();
				filterApi.extendFilter(filterState);
				filterApi.apply();
			});
			main_core_events.EventEmitter.subscribe('SidePanel.Slider:onMessage', event => {
				const [sliderEvent] = event.getCompatData();
				if (sliderEvent.getEventId() === 'BIConnector.Superset.DashboardDetail:onDashboardBatchStatusUpdate') {
					const eventArgs = sliderEvent.getData();
					if (eventArgs.dashboardList) {
						this.onUpdatedDashboardBatchStatus(eventArgs.dashboardList);
					}
				} else if (sliderEvent.getEventId() === 'BIConnector.Superset.DashboardTagGrid:onTagChange' || sliderEvent.getEventId() === 'BIConnector.Superset.DashboardTagGrid:onTagDelete') {
					if (this.#tagSelectorDialog) {
						this.#tagSelectorDialog.destroy();
						this.#tagSelectorDialog = null;
					}
					const filterTagValues = this.getFilter().getFilterFieldsValues();
					if (main_core.Type.isUndefined(filterTagValues['TAGS.ID']) || filterTagValues['TAGS.ID'].length === 0) {
						this.getGrid().reload();
						return;
					}
					const {
						tagId,
						title
					} = sliderEvent.getData();
					const currentFilteredTags = filterTagValues['TAGS.ID'] ?? [];
					const currentFilteredTagLabels = filterTagValues['TAGS.ID_label'] ?? [];
					const index = currentFilteredTags.findIndex(id => main_core.Text.toInteger(id) === main_core.Text.toInteger(tagId));
					if (sliderEvent.getEventId() === 'BIConnector.Superset.DashboardTagGrid:onTagDelete') {
						currentFilteredTags.splice(index, 1);
						currentFilteredTagLabels.splice(index, 1);
					} else {
						currentFilteredTagLabels[index] = title;
					}
					const filterApi = this.getFilter().getApi();
					filterApi.extendFilter({
						'TAGS.ID': currentFilteredTags,
						'TAGS.ID_label': currentFilteredTagLabels
					});
					filterApi.apply();
				}
			});
			main_core_events.EventEmitter.subscribe('BIConnector.Superset.DashboardManager:onDashboardBatchStatusUpdate', event => {
				const data = event.getData();
				if (!data.dashboardList) {
					return;
				}
				const dashboardList = data.dashboardList;
				this.onUpdatedDashboardBatchStatus(dashboardList);
			});
			BX.PULL && BX.PULL.extendWatch('superset_dashboard', true);
			main_core_events.EventEmitter.subscribe('onPullEvent-biconnector', event => {
				const [eventName, eventData] = event.data;
				if (eventName === 'onSupersetStatusUpdated') {
					const status = eventData?.status;
					if (status) {
						this.#onSupersetStatusChange(status);
					}
				}
			});
			main_core_events.EventEmitter.subscribe('BX.Rest.Configuration.Install:onFinish', () => {
				this.#grid.reload();
			});
			main_core_events.EventEmitter.subscribe('Grid::updated', () => {
				this.#initHints();
				this.#colorPinnedRows();
				this.#replaceHistoryState();
			});
			main_core_events.EventEmitter.subscribe('BIConnector.ExportMaster:onDashboardDataLoaded', () => {
				this.#grid.tableUnfade();
			});
			main_core_events.EventEmitter.subscribe('BIConnector.DashboardManager:onEmbeddedDataLoaded', () => {
				this.#grid.reload();
			});
			main_core_events.EventEmitter.subscribe('BX.BIConnector.Settings:onAfterSave', event => {
				const data = event.getData();
				if (data?.datasetTypingEnabled === true) {
					const warning = document.getElementById('biconnector-dataset-typing-warning');
					if (warning) {
						warning.remove();
					}
				}
				this.#grid.reload();
			});
			main_core_events.EventEmitter.subscribe('BIConnector.CreateForm:onDashboardCreated', () => {
				this.#grid.reload();
			});
			main_core_events.EventEmitter.subscribe('BIConnector.AccessRights:onRightsSaved', () => {
				this.#grid.reload();
			});
			main_core_events.EventEmitter.subscribe('BIConnector.GroupPopup:onGroupSaved', event => {
				const eventData = event.getData();
				const groupId = eventData?.group?.id;
				const isTitleEdited = eventData?.isTitleEdited;
				const isDashboardListEdited = eventData?.isDashboardListEdited;
				const isScopeListEdited = eventData?.isScopeListEdited;
				if (groupId && (isTitleEdited || isDashboardListEdited || isScopeListEdited)) {
					biconnector_apacheSupersetAnalytics.PermissionsAnalytics.sendGroupActionAnalytics(biconnector_apacheSupersetAnalytics.PermissionsAnalyticsSource.grid, main_core.Type.isString(groupId) ? groupId.startsWith('new_') : false, isDashboardListEdited, isScopeListEdited);
				}
				this.#grid.reload();
			});
			main_core_events.EventEmitter.subscribe('BIConnector.GroupPopup.DashboardScopeSelector:onDialogHide', event => {
				if (!event.getData()?.isScopeListEdited) {
					return;
				}
				biconnector_apacheSupersetAnalytics.PermissionsAnalytics.sendGroupDashboardScopeEditAnalytics(biconnector_apacheSupersetAnalytics.PermissionsAnalyticsSource.grid);
			});
			main_core_events.EventEmitter.subscribe('BIConnector.GroupPopup.ScopeSelector:onDialogHide', event => {
				if (!event.getData()?.isScopeListEdited) {
					return;
				}
				biconnector_apacheSupersetAnalytics.PermissionsAnalytics.sendGroupScopeEditAnalytics(biconnector_apacheSupersetAnalytics.PermissionsAnalyticsSource.grid);
			});
			main_core_events.EventEmitter.subscribe('BIConnector.GroupPopup.DashboardSelector:onDialogHide', event => {
				if (!event.getData()?.isDashboardListEdited) {
					return;
				}
				biconnector_apacheSupersetAnalytics.PermissionsAnalytics.sendGroupDashboardEditAnalytics(biconnector_apacheSupersetAnalytics.PermissionsAnalyticsSource.grid);
			});
			main_core_events.EventEmitter.subscribe('BIConnector.GroupPopup.DashboardList:onDashboardRemove', () => {
				biconnector_apacheSupersetAnalytics.PermissionsAnalytics.sendGroupDashboardEditAnalytics(biconnector_apacheSupersetAnalytics.PermissionsAnalyticsSource.grid);
			});
			main_core_events.EventEmitter.subscribe('BIConnector.SharePopup:onShareActivated', event => {
				this.#updateShareLinkCell(event.getData().dashboardId, true);
			});
			main_core_events.EventEmitter.subscribe('BIConnector.SharePopup:onShareDeactivated', event => {
				this.#updateShareLinkCell(event.getData().dashboardId, false);
			});
		}
		#initHints() {
			const manager = BX.UI.Hint.createInstance({
				popupParameters: {
					autoHide: true
				}
			});
			manager.init(this.#grid.getContainer());
		}
		#onSupersetStatusChange(status) {
			if (status === 'READY') {
				this.getGrid().reload();
			}
			if (status !== 'LOAD' && status !== 'ERROR' && status !== 'LIMIT_EXCEEDED') {
				return;
			}
			const statusMap = {
				LOAD: biconnector_apacheSupersetDashboardManager.DashboardManager.DASHBOARD_STATUS_LOAD,
				ERROR: biconnector_apacheSupersetDashboardManager.DashboardManager.DASHBOARD_STATUS_COMPUTED_NOT_LOAD,
				LIMIT_EXCEEDED: biconnector_apacheSupersetDashboardManager.DashboardManager.DASHBOARD_STATUS_COMPUTED_NOT_LOAD
			};
			const grid = this.getGrid();
			const rows = grid.getRows().getBodyChild();
			for (const row of rows) {
				const dashboardId = row.getId();
				const dashboardStatus = statusMap[status];
				if (dashboardStatus) {
					this.updateDashboardStatus(dashboardId, dashboardStatus);
				}
			}
		}
		#showDraftGuide(node) {
			if (!this.#properties.isNeedShowDraftGuide) {
				return;
			}
			const labelNode = node.querySelector('.dashboard-status-label.ui-label-default');
			const cellNode = labelNode ? labelNode.closest('.main-grid-cell') : null;
			const guide = new ui_tour.Guide({
				steps: [{
					target: cellNode ?? node,
					title: main_core.Loc.getMessage('BICONNECTOR_SUPERSET_DASHBOARD_GRID_DRAFT_GUIDE_TITLE'),
					text: main_core.Loc.getMessage('BICONNECTOR_SUPERSET_DASHBOARD_GRID_DRAFT_GUIDE_TEXT'),
					events: {
						onClose: () => {
							BX.userOptions.save('biconnector', 'draft_guide', 'is_over', true);
						}
					},
					rounded: false,
					position: 'bottom',
					areaPadding: 0
				}],
				onEvents: true
			});
			guide.start();
			this.#properties.isNeedShowDraftGuide = false;
		}
		#showPublishAhaMoment(dashboardId, dashboardType) {
			const ahaMomentOptions = this.#properties.publishAhaMoment;
			if (!main_core.Type.isPlainObject(ahaMomentOptions) || ahaMomentOptions.canShow !== true) {
				return;
			}
			const row = this.#grid.getRows().getById(dashboardId);
			const bindElement = row?.node?.querySelector('.main-grid-cell.main-grid-cell-action .main-grid-row-action-button') ?? row?.node?.querySelector('.main-grid-cell.main-grid-cell-action');
			if (!main_core.Type.isDomNode(bindElement)) {
				return;
			}
			const actions = [{
				text: ahaMomentOptions.laterButtonText ?? '',
				style: 'secondary'
			}, {
				text: ahaMomentOptions.addButtonText ?? '',
				style: 'primary',
				onclick: () => {
					biconnector_apacheSupersetDashboardManager.DashboardManager.openSettingsSlider(dashboardId, dashboardType);
				}
			}];
			if (!this.#publishAhaMoment) {
				this.#publishAhaMoment = new biconnector_ahaMoment.AhaMoment({
					...ahaMomentOptions,
					bindElement,
					popupAlignment: 'start',
					popupOffsetLeftAdjustment: -33,
					actions
				});
			} else {
				this.#publishAhaMoment.setBindElement(bindElement);
				this.#publishAhaMoment.setActions(actions);
			}
			this.#publishAhaMoment.show();
		}
		#colorPinnedRows() {
			this.#lastPinnedRowId = 0;
			const rows = this.#grid.getRows().getBodyChild();
			for (const row of rows) {
				if (row.node.querySelector('.dashboard-unpin-icon')) {
					main_core.Dom.addClass(row.node, 'biconnector-dashboard-pinned');
					this.#lastPinnedRowId = row.getId();
				}
			}
		}
		onUpdatedDashboardBatchStatus(dashboardList) {
			for (const dashboard of dashboardList) {
				this.updateDashboardStatus(dashboard.id, dashboard.status);
			}
		}
		getGrid() {
			return this.#grid;
		}
		getFilter() {
			return this.#filter;
		}

		/**
		 * @param params LoginPopupParams
		 * @param openedFrom
		 */
		showLoginPopup(params, openedFrom = 'unknown') {
			if (!main_core.Type.isNumber(params.dashboardId) || !['CUSTOM', 'MARKET', 'SYSTEM'].includes(params.type) || !main_core.Type.isStringFilled(params.editUrl)) {
				// noinspection JSIgnoredPromiseFromCall
				console.error('SupersetDashboardGridManager: showLoginPopup called with invalid params', params);
				return;
			}
			const grid = this.getGrid();
			if (params.type === 'CUSTOM') {
				grid.tableFade();
			}
			this.#dashboardManager.processEditDashboard({
				id: params.dashboardId,
				type: params.type,
				editLink: params.editUrl
			}, () => {
				grid.tableUnfade();
			}, popupType => {
				biconnector_apacheSupersetAnalytics.ApacheSupersetAnalytics.sendAnalytics('edit', 'report_edit', {
					c_sub_section: popupType,
					c_element: openedFrom,
					type: params.type.toLowerCase(),
					p1: biconnector_apacheSupersetAnalytics.ApacheSupersetAnalytics.buildAppIdForAnalyticRequest(params.appId),
					p2: params.dashboardId,
					status: 'success'
				});
			}, popupType => {
				biconnector_apacheSupersetAnalytics.ApacheSupersetAnalytics.sendAnalytics('edit', 'report_edit', {
					c_sub_section: popupType,
					c_element: openedFrom,
					type: params.type.toLowerCase(),
					p1: biconnector_apacheSupersetAnalytics.ApacheSupersetAnalytics.buildAppIdForAnalyticRequest(params.appId),
					p2: params.dashboardId,
					status: 'error'
				});
			});
		}
		showSharePopup(element) {
			const dashboardId = parseInt(element.dataset.dashboardId, 10);
			const shareDataRaw = element.dataset.share;
			let initialShareData = null;
			if (shareDataRaw && shareDataRaw !== '' && shareDataRaw !== '""') {
				try {
					initialShareData = JSON.parse(shareDataRaw);
				} catch {}
			}
			if (!this.#sharePopups.has(dashboardId)) {
				this.#sharePopups.set(dashboardId, new biconnector_sharePopup.SharePopup({
					dashboardId,
					dashboardTitle: element.dataset.title ?? '',
					initialShareData,
					type: (element.dataset.type ?? '').toLowerCase(),
					analyticsElement: 'grid_menu'
				}));
			}
			this.#sharePopups.get(dashboardId).show();
		}
		#updateShareLinkCell(dashboardId, isActive) {
			const row = this.#grid.getRows().getById(dashboardId);
			if (!row) {
				return;
			}
			const cell = row.getCellById('SHARE_LINK');
			if (!cell) {
				return;
			}
			const link = cell.querySelector('.dashboard-share-link');
			if (!link) {
				return;
			}
			if (isActive) {
				main_core.Dom.removeClass(link, 'dashboard-share-link--inactive');
				main_core.Dom.addClass(link, 'dashboard-share-link--active');
				link.textContent = main_core.Loc.getMessage('BICONNECTOR_SUPERSET_DASHBOARD_GRID_SHARE_LINK_ACTIVE');
			} else {
				main_core.Dom.removeClass(link, 'dashboard-share-link--active');
				main_core.Dom.addClass(link, 'dashboard-share-link--inactive');
				link.textContent = main_core.Loc.getMessage('BICONNECTOR_SUPERSET_DASHBOARD_GRID_SHARE_LINK_INACTIVE');
			}
		}
		#isActiveGroupIdFilter() {
			const filterFieldsValues = this.getFilter().getFilterFieldsValues();
			const selectedGroups = filterFieldsValues['GROUPS.ID'] ?? [];
			return selectedGroups.length > 0;
		}

		/**
		 * @param event PointerEvent
		 */
		showCreationMenu(event) {
			const openedMenu = main_popup.MenuManager.getMenuById('biconnector-creation-menu');
			if (openedMenu) {
				openedMenu.close();
				return;
			}
			const items = [];
			if (this.#properties.isAvailableDashboardCreation) {
				items.push({
					text: main_core.Loc.getMessage('BICONNECTOR_APACHE_SUPERSET_DASHBOARD_LIST_MENU_ITEM_NEW_DASHBOARD'),
					onclick: () => {
						this.openCreationSlider();
						creationMenu.close();
					}
				});
			}
			if (this.#properties.isAvailableGroupCreation) {
				items.push({
					text: main_core.Loc.getMessage('BICONNECTOR_APACHE_SUPERSET_DASHBOARD_LIST_MENU_ITEM_NEW_GROUP'),
					onclick: () => {
						this.showCreationGroupPopup();
						creationMenu.close();
					},
					disabled: this.#isActiveGroupIdFilter()
				});
			}
			items.push({
				text: main_core.Loc.getMessage('BICONNECTOR_APACHE_SUPERSET_DASHBOARD_LIST_MENU_ITEM_CREATE_DASHBOARD'),
				onclick: () => {
					this.showMarketSlider(this.#properties.isMarketExists, this.#properties.marketUrl);
					creationMenu.close();
				}
			}, {
				text: main_core.Loc.getMessage('BICONNECTOR_APACHE_SUPERSET_DASHBOARD_LIST_MENU_ITEM_ORDER_DASHBOARD'),
				onclick: () => {
					BX.BIConnector.ApacheSupersetFeedbackForm.requestIntegrationFormOpen();
					creationMenu.close();
				}
			});
			const creationMenu = main_popup.MenuManager.create({
				id: 'biconnector-creation-menu',
				closeByEsc: false,
				closeIcon: false,
				cacheable: false,
				angle: true,
				offsetLeft: 20,
				items,
				autoHide: true,
				bindElement: event.target
			});
			creationMenu.show();
		}
		restartDashboardLoad(dashboardId) {
			const row = this.#grid.getRows().getById(dashboardId);
			if (row) {
				const btn = row.node.querySelector('#restart-dashboard-load-btn');
				if (main_core.Type.isDomNode(btn)) {
					const isDisabled = btn.getAttribute('disabled');
					if (isDisabled) {
						return;
					}
					btn.setAttribute('disabled', 'true');
					main_core.Dom.addClass(btn, 'dashboard-status-label-error-btn__loading');
				}
			}
			this.#dashboardManager.restartDashboardImport(dashboardId).then(response => {
				const dashboardIds = response?.data?.restartedDashboardIds;
				if (!dashboardIds) {
					return;
				}
				for (const restartedDashboardId of dashboardIds) {
					this.updateDashboardStatus(restartedDashboardId, biconnector_apacheSupersetDashboardManager.DashboardManager.DASHBOARD_STATUS_LOAD);
				}
			}).catch();
		}
		updateDashboardStatus(dashboardId, status) {
			const row = this.#grid.getRows().getById(dashboardId);
			if (row) {
				const labelWrapper = row.node.querySelector('.dashboard-status-label-wrapper');
				const label = labelWrapper.querySelector('.dashboard-status-label');
				const reloadBtn = labelWrapper.querySelector('#restart-dashboard-load-btn');
				let labelClass = '';
				let labelTitle = '';
				switch (status) {
					case biconnector_apacheSupersetDashboardManager.DashboardManager.DASHBOARD_STATUS_READY:
						setTimeout(() => this.#grid.updateRow(dashboardId), 500);
						return;
					case biconnector_apacheSupersetDashboardManager.DashboardManager.DASHBOARD_STATUS_DRAFT:
						labelClass = 'ui-label-default';
						labelTitle = main_core.Loc.getMessage('BICONNECTOR_SUPERSET_DASHBOARD_GRID_STATUS_DRAFT');
						break;
					case biconnector_apacheSupersetDashboardManager.DashboardManager.DASHBOARD_STATUS_LOAD:
						labelClass = 'ui-label-primary';
						labelTitle = main_core.Loc.getMessage('BICONNECTOR_SUPERSET_DASHBOARD_GRID_STATUS_LOAD');
						break;
					case biconnector_apacheSupersetDashboardManager.DashboardManager.DASHBOARD_STATUS_FAILED:
						labelClass = 'ui-label-danger';
						labelTitle = main_core.Loc.getMessage('BICONNECTOR_SUPERSET_DASHBOARD_GRID_STATUS_FAILED');
						break;
					case biconnector_apacheSupersetDashboardManager.DashboardManager.DASHBOARD_STATUS_COMPUTED_NOT_LOAD:
						labelClass = 'ui-label-danger';
						labelTitle = main_core.Loc.getMessage('BICONNECTOR_SUPERSET_DASHBOARD_GRID_STATUS_NOT_LOAD');
						break;
				}
				if (this.#properties.supersetStatus === 'LIMIT_EXCEEDED') {
					labelClass = 'ui-label-danger';
					labelTitle = main_core.Loc.getMessage('BICONNECTOR_SUPERSET_DASHBOARD_GRID_STATUS_NOT_LOAD');
				}
				if (labelClass === '') {
					return;
				}
				if (reloadBtn) {
					reloadBtn.remove();
				}
				if (status === biconnector_apacheSupersetDashboardManager.DashboardManager.DASHBOARD_STATUS_FAILED) {
					const createdReloadBtn = this.createReloadBtn(dashboardId);
					main_core.Dom.append(createdReloadBtn, labelWrapper);
				}
				const labelStatuses = ['ui-label-lightgreen', 'ui-label-default', 'ui-label-primary', 'ui-label-danger'];
				main_core.Dom.addClass(label, labelClass);
				labelStatuses.forEach(uiStatus => {
					if (uiStatus !== labelClass) {
						main_core.Dom.removeClass(label, uiStatus);
					}
				});
				label.querySelector('span').innerText = labelTitle;
			}
		}
		createReloadBtn(dashboardId) {
			return main_core.Tag.render`
			<div id="restart-dashboard-load-btn" onclick="BX.BIConnector.SupersetDashboardGridManager.Instance.restartDashboardLoad(${dashboardId})" class="dashboard-status-label-error-btn">
				<div class="ui-icon-set --refresh-5 dashboard-status-label-error-icon"></div>
			</div>
		`;
		}
		duplicateDashboard(dashboardId, analyticInfo = null) {
			const grid = this.getGrid();
			grid.tableFade();
			return this.#dashboardManager.duplicateDashboard(dashboardId).then(response => {
				const gridRealtime = grid.getRealtime();
				const newDashboard = response.data.dashboard;
				const newRow = {
					id: newDashboard.id,
					columns: newDashboard.columns,
					actions: newDashboard.actions
				};
				const firstDashboardRow = this.#grid.getRows().getRowsByGroupId('D').find(row => !main_core.Dom.hasClass(row.node, 'biconnector-dashboard-pinned'));
				if (firstDashboardRow) {
					newRow.insertBefore = firstDashboardRow?.getId();
				} else {
					newRow.insertAfter = 0;
				}
				gridRealtime.addRow(newRow);
				const newRowNode = this.#grid.getRows().getById(newDashboard.id).node;
				newRowNode.setAttribute('data-group-id', 'D');
				const editableData = grid.getParam('EDITABLE_DATA');
				if (BX.type.isPlainObject(editableData)) {
					editableData[newDashboard.id] = {
						TITLE: newDashboard.title
					};
				}
				grid.tableUnfade();
				const counterTotalTextContainer = grid.getCounterTotal().querySelector('.main-grid-panel-content-text');
				counterTotalTextContainer.textContent++;
				this.#initHints();
				BX.UI.Notification.Center.notify({
					content: main_core.Loc.getMessage('BICONNECTOR_SUPERSET_DASHBOARD_GRID_COPY_NOTIFICATION_ADDED')
				});
				if (analyticInfo !== null) {
					biconnector_apacheSupersetAnalytics.ApacheSupersetAnalytics.sendAnalytics('edit', 'report_copy', {
						type: analyticInfo.type,
						p1: biconnector_apacheSupersetAnalytics.ApacheSupersetAnalytics.buildAppIdForAnalyticRequest(analyticInfo.appId),
						p2: dashboardId,
						status: 'success',
						c_element: analyticInfo.from
					});
				}
			}).catch(response => {
				grid.tableUnfade();
				if (response.errors) {
					this.#notifyErrors(response.errors);
				}
				if (analyticInfo !== null) {
					biconnector_apacheSupersetAnalytics.ApacheSupersetAnalytics.sendAnalytics('edit', 'report_copy', {
						type: analyticInfo.type,
						p1: biconnector_apacheSupersetAnalytics.ApacheSupersetAnalytics.buildAppIdForAnalyticRequest(analyticInfo.appId),
						p2: dashboardId,
						status: 'error',
						c_element: analyticInfo.from
					});
				}
			});
		}
		#notifyErrors(errors) {
			if (errors[0] && errors[0].message) {
				BX.UI.Notification.Center.notify({
					content: main_core.Text.encode(errors[0].message)
				});
			}
		}
		exportDashboard(dashboardId) {
			const grid = this.getGrid();
			grid.tableFade();
			return this.#dashboardManager.exportDashboard(dashboardId, 'grid_menu');
		}
		publish(dashboardId, options = null) {
			const publishOptions = main_core.Type.isPlainObject(options) ? options : {};
			const dashboardType = publishOptions.type ?? 'CUSTOM';
			this.#dashboardManager.toggleDraft(dashboardId, true).then(() => {
				this.#grid.updateRow(dashboardId, null, null, () => {
					this.#showPublishAhaMoment(dashboardId, dashboardType);
				});
			}).catch(() => {
				BX.UI.Notification.Center.notify({
					content: main_core.Loc.getMessage('BICONNECTOR_SUPERSET_DASHBOARD_GRID_PUBLISH_NOTIFICATION_ERROR')
				});
			});
		}
		setDraft(dashboardId) {
			this.#dashboardManager.toggleDraft(dashboardId, false).then(() => {
				this.#sharePopups.delete(dashboardId);
				this.updateDashboardStatus(dashboardId, biconnector_apacheSupersetDashboardManager.DashboardManager.DASHBOARD_STATUS_DRAFT);
				this.#grid.updateRow(dashboardId, null, null, result => {
					this.#showDraftGuide(this.#grid.getRows().getById(dashboardId).node);
				});
			}).catch(() => {
				BX.UI.Notification.Center.notify({
					content: main_core.Loc.getMessage('BICONNECTOR_SUPERSET_DASHBOARD_GRID_SET_DRAFT_NOTIFICATION_ERROR')
				});
			});
		}
		deleteDashboard(dashboardId, dashboardType) {
			this.#dashboardManager.showDeleteDashboardDialog({
				dashboardId,
				dashboardType
			}).then(result => {
				if (result.status === 'deleted') {
					this.getGrid().reload();
				}
			}).catch(() => {});
		}
		deleteGroup(groupId) {
			const deletePopup = new ui_system_dialog.Dialog({
				title: main_core.Loc.getMessage('BICONNECTOR_SUPERSET_DASHBOARD_GRID_DELETE_GROUP_POPUP_TITLE_MSGVER_1'),
				subtitle: main_core.Loc.getMessage('BICONNECTOR_SUPERSET_DASHBOARD_GRID_DELETE_GROUP_POPUP_DESC'),
				hasCloseButton: true,
				closeByEsc: true,
				hasOverlay: true,
				disableScrolling: true,
				centerButtons: [new ui_buttons.Button({
					text: main_core.Loc.getMessage('BICONNECTOR_SUPERSET_DASHBOARD_GRID_DELETE_GROUP_POPUP_CAPTION_YES'),
					useAirDesign: true,
					size: ui_buttons.ButtonSize.LARGE,
					style: ui_buttons.AirButtonStyle.FILLED_ALERT,
					onclick: button => {
						biconnector_apacheSupersetAnalytics.PermissionsAnalytics.sendGroupDeleteAnalytics(biconnector_apacheSupersetAnalytics.PermissionsAnalyticsSource.grid);
						button.setWaiting();
						this.#dashboardManager.deleteGroup(groupId).then(() => {
							this.getGrid().reload();
							deletePopup.hide();
						}).catch(response => {
							deletePopup.hide();
							if (response.errors) {
								this.#notifyErrors(response.errors);
							}
						});
					}
				}), new ui_buttons.CancelButton({
					text: main_core.Loc.getMessage('BICONNECTOR_SUPERSET_DASHBOARD_GRID_DELETE_GROUP_POPUP_CAPTION_NO'),
					size: ui_buttons.ButtonSize.LARGE,
					useAirDesign: true,
					style: ui_buttons.AirButtonStyle.PLAIN,
					onclick: button => deletePopup.hide()
				})]
			});
			deletePopup.show();
		}
		openCreationSlider() {
			const filterFieldsValues = this.getFilter().getFilterFieldsValues();
			const selectedGroups = filterFieldsValues['GROUPS.ID'] ?? [];
			this.#dashboardManager.openCreationSlider(selectedGroups);
		}
		notifyPermissionErrorOpenCreationSlider() {
			BX.UI.Notification.Center.notify({
				content: main_core.Loc.getMessage('BICONNECTOR_APACHE_SUPERSET_DASHBOARD_LIST_ERROR_OPEN_CREATE_DASHBOARD')
			});
		}
		openDatasetTypingSettings() {
			BX.SidePanel.Instance.open('/bitrix/components/bitrix/biconnector.apachesuperset.setting/slider.php', {
				width: 790,
				allowChangeHistory: false,
				cacheable: false,
				data: {
					focusSection: 'DATASET_SETTINGS_SECTION'
				}
			});
		}
		showMarketSlider(isMarketExists, marketUrl) {
			biconnector_apacheSupersetMarketManager.ApacheSupersetMarketManager.openMarket(isMarketExists, marketUrl, 'menu');
		}
		showCreationGroupPopup() {
			if (this.#isActiveGroupIdFilter()) {
				return;
			}
			this.#dashboardManager.showCreationGroupPopup();
			biconnector_apacheSupersetAnalytics.PermissionsAnalytics.sendClickGroupActionAnalytics(biconnector_apacheSupersetAnalytics.PermissionsAnalyticsSource.grid, true);
		}
		#buildDashboardTitleEditor(id, title, onCancel, onSave) {
			const input = main_core.Tag.render`
			<input class="main-grid-editor main-grid-editor-text" type="text">
		`;
			input.value = title;
			const saveInputValue = () => {
				const value = input.value;
				main_core.Dom.removeClass(input, 'dashboard-title-input-danger');
				if (value.trim() === '') {
					BX.UI.Notification.Center.notify({
						content: main_core.Loc.getMessage('BICONNECTOR_SUPERSET_DASHBOARD_GRID_CHANGE_TITLE_ERROR_EMPTY')
					});
					main_core.Dom.addClass(input, 'dashboard-title-input-danger');
					return;
				}
				main_core.Dom.style(buttons, 'display', 'none');
				main_core.Dom.attr(input, 'disabled', true);
				onSave(input.value);
			};
			main_core.Event.bind(input, 'keydown', event => {
				if (event.keyCode === 13) {
					saveInputValue();
					event.preventDefault();
				} else if (event.keyCode === 27) {
					onCancel();
					event.preventDefault();
				}
			});
			const applyButton = main_core.Tag.render`
			<a>
				<i
					class="ui-icon-set --check"
					style="--ui-icon-set__icon-size: 21px; --ui-icon-set__icon-color: var(--ui-color-palette-gray-40);"
				></i>
			</a>
		`;
			const cancelButton = main_core.Tag.render`
			<a>
				<i
					class="ui-icon-set --cross-60"
					style="--ui-icon-set__icon-size: 21px; --ui-icon-set__icon-color: var(--ui-color-palette-gray-40);"
				></i>
			</a>
		`;
			const buttons = main_core.Tag.render`
			<div class="dashboard-title-wrapper__buttons">
				${applyButton}
				${cancelButton}
			</div>
		`;
			main_core.Event.bind(cancelButton, 'click', () => {
				onCancel();
			});
			main_core.Event.bind(applyButton, 'click', saveInputValue);
			return main_core.Tag.render`
			<div class="dashboard-title-wrapper__item dashboard-title-edit">
				${input}
				<div class="dashboard-title-wrapper__buttons-wrapper">
					${buttons}
				</div>
			</div>
		`;
		}
		#getTitlePreview(dashboardId) {
			const grid = this.getGrid();
			const row = grid.getRows().getById(dashboardId);
			if (!row) {
				return null;
			}
			const wrapper = row.getCellById('TITLE')?.querySelector('.dashboard-title-wrapper');
			if (!wrapper) {
				return null;
			}
			const previewSection = wrapper.querySelector('.dashboard-title-preview');
			if (previewSection) {
				return previewSection;
			}
			return null;
		}
		showGroupSettingsPopup(groupId) {
			biconnector_apacheSupersetAnalytics.PermissionsAnalytics.sendClickGroupActionAnalytics(biconnector_apacheSupersetAnalytics.PermissionsAnalyticsSource.grid, false);
			this.#grid.tableFade();
			this.#dashboardManager.showGroupSettingsPopup(groupId).then(() => {
				this.#grid.tableUnfade();
			}).catch(() => {
				this.#grid.tableUnfade();
			});
		}
		renameDashboard(dashboardId) {
			const grid = this.getGrid();
			const row = grid.getRows().getById(dashboardId);
			if (!row) {
				return;
			}
			const rowNode = row.getNode();
			main_core.Dom.removeClass(rowNode, 'dashboard-title-edited');
			const wrapper = row.getCellById('TITLE')?.querySelector('.dashboard-title-wrapper');
			if (!wrapper) {
				return;
			}
			const editor = this.#buildDashboardTitleEditor(dashboardId, row.getEditData().TITLE, () => {
				this.cancelRenameDashboard(dashboardId);
			}, innerTitle => {
				const oldTitle = this.#getTitlePreview(dashboardId).querySelector('a').innerText;
				this.#getTitlePreview(dashboardId).querySelector('a').innerText = innerTitle;
				const rowEditData = row.getEditData();
				rowEditData.TITLE = innerTitle;
				const editableData = grid.getParam('EDITABLE_DATA');
				if (BX.type.isPlainObject(editableData)) {
					editableData[row.getId()] = rowEditData;
				}
				main_core.Dom.addClass(rowNode, 'dashboard-title-edited');
				const msg = main_core.Loc.getMessage('BICONNECTOR_SUPERSET_DASHBOARD_GRID_CHANGE_TITLE_SUCCESS', {
					'#NEW_TITLE#': main_core.Text.encode(innerTitle)
				});
				BX.UI.Notification.Center.notify({
					content: msg
				});
				this.cancelRenameDashboard(dashboardId);
				this.#setDateModifyNow(dashboardId);
				this.#dashboardManager.renameDashboard(dashboardId, innerTitle).catch(response => {
					if (response.errors) {
						this.#notifyErrors(response.errors);
					}
					this.#getTitlePreview(dashboardId).querySelector('a').innerText = oldTitle;
					rowEditData.TITLE = oldTitle;
				});
			});
			const preview = wrapper.querySelector('.dashboard-title-preview');
			if (preview) {
				main_core.Dom.style(preview, 'display', 'none');
			}
			main_core.Dom.append(editor, wrapper);
			const editBtn = row.getCellById('EDIT_URL')?.querySelector('a');
			const actionsClickHandler = () => {
				main_core.Event.unbind(row.getActionsButton(), 'click', actionsClickHandler);
				if (editBtn) {
					main_core.Event.unbind(editBtn, 'click', actionsClickHandler);
				}
				this.cancelRenameDashboard(dashboardId);
			};
			main_core.Event.bind(row.getActionsButton(), 'click', actionsClickHandler);
			if (editBtn) {
				main_core.Event.bind(editBtn, 'click', actionsClickHandler);
			}
		}
		cancelRenameDashboard(dashboardId) {
			const row = this.getGrid().getRows().getById(dashboardId);
			if (!row) {
				return;
			}
			const editSection = row.getCellById('TITLE')?.querySelector('.dashboard-title-edit');
			const previewSection = row.getCellById('TITLE')?.querySelector('.dashboard-title-preview');
			if (editSection) {
				main_core.Dom.remove(editSection);
			}
			if (previewSection) {
				main_core.Dom.style(previewSection, 'display', 'flex');
			}
		}
		#setDateModifyNow(dashboardId) {
			const dateModifyCell = this.#grid.getRows().getById(dashboardId)?.getCellById('DATE_MODIFY');
			if (!dateModifyCell) {
				return;
			}
			const cellContent = dateModifyCell.querySelector('.main-grid-cell-content span');
			const date = main_date.DateTimeFormat.format(main_date.DateTimeFormat.getFormat('FORMAT_DATETIME'), Math.floor(Date.now() / 1000));
			const readableDate = main_core.Loc.getMessage('BICONNECTOR_SUPERSET_DASHBOARD_GRID_DATE_MODIFY_NOW');
			const newCellContent = main_core.Tag.render`
			<span data-hint="${date}" data-hint-no-icon data-hint-interactivity>${readableDate}</span>
		`;
			main_core.Dom.replace(cellContent, newCellContent);
			this.#initHints();
		}
		handleGroupTitleClick(groupJson) {
			const filterFieldsValues = this.getFilter().getFilterFieldsValues();
			const currentFilteredGroups = filterFieldsValues['GROUPS.ID'] ?? [];
			const isAlreadyFilteredByGroup = currentFilteredGroups.length > 0;
			if (isAlreadyFilteredByGroup) {
				const filterApi = this.getFilter().getApi();
				filterApi.extendFilter({
					'GROUPS.ID': [],
					'GROUPS.ID_label': []
				});
			}
			this.#pushHistoryState();
			this.handleFilterChange({
				fieldId: 'GROUPS.ID',
				...groupJson
			});
		}
		handleTagClick(tagJson) {
			const tag = JSON.parse(tagJson);
			this.handleFilterChange({
				fieldId: 'TAGS.ID',
				...tag
			});
		}
		handleTagAddClick(dashboardId, preselectedIds, event) {
			const onTagsChange = () => {
				const tags = this.#tagSelectorDialog.getSelectedItems().map(item => item.getId());
				this.#dashboardManager.setDashboardTags(dashboardId, tags).then(() => {
					this.getGrid().updateRow(dashboardId, null, null, () => {
						const anchor = this.getGrid().getRows().getById(dashboardId)?.getCellById('TAGS');
						if (anchor && this.#tagSelectorDialog) {
							this.#tagSelectorDialog.setTargetNode(anchor);
						}
					});
					const filterTagValues = this.getFilter().getFilterFieldsValues();
					const currentFilteredTags = filterTagValues['TAGS.ID'] ?? [];
					if (currentFilteredTags.length > 0) {
						const filtered = tags.filter(tagId => currentFilteredTags.includes(String(tagId)));
						if (filtered.length === 0) {
							this.#tagSelectorDialog.destroy();
							this.#tagSelectorDialog = null;
						}
					}
				}).catch(response => {
					if (response.errors) {
						this.#notifyErrors(response.errors);
					}
				});
			};
			const entityId = 'biconnector-superset-dashboard-tag';
			const preselectedItems = [];
			JSON.parse(preselectedIds).forEach(id => preselectedItems.push([entityId, id]));
			this.#tagSelectorDialog = new ui_entitySelector.Dialog({
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
				entities: [{
					id: entityId,
					options: {
						dashboardId
					}
				}],
				preselectedItems,
				searchOptions: {
					allowCreateItem: false
				},
				footer: biconnector_entitySelector.TagFooter,
				events: {
					onSearch: event => {
						const query = event.getData().query;
						const footer = this.#tagSelectorDialog.getFooter();
						const footerWrapper = this.#tagSelectorDialog.getFooterContainer();
						if (main_core.Type.isStringFilled(query.trim()) && footer.canCreateTag()) {
							main_core.Dom.show(footerWrapper.querySelector('#tags-widget-custom-footer-add-new'));
							main_core.Dom.show(footerWrapper.querySelector('#tags-widget-custom-footer-conjunction'));
							return;
						}
						main_core.Dom.hide(footerWrapper.querySelector('#tags-widget-custom-footer-add-new'));
						main_core.Dom.hide(footerWrapper.querySelector('#tags-widget-custom-footer-conjunction'));
					},
					'Search:onItemCreateAsync': searchEvent => {
						return new Promise((resolve, reject) => {
							const {
								searchQuery
							} = searchEvent.getData();
							const name = searchQuery.getQuery();
							this.#dashboardManager.addTag(name).then(result => {
								const newTag = result.data;
								const item = this.#tagSelectorDialog.addItem({
									id: newTag.ID,
									entityId,
									title: name,
									tabs: 'all'
								});
								if (item) {
									item.select();
								}
								resolve();
							}).catch(result => {
								const errors = result.errors;
								errors.forEach(error => {
									const alert = main_core.Tag.render`
										<div class="dashboard-tag-already-exists-alert">
											<div class='ui-alert ui-alert-xs ui-alert-danger'> 
												<span class='ui-alert-message'>
													${error.message}
												</span> 
											</div>
										</div>
									`;
									main_core.Dom.prepend(alert, this.#tagSelectorDialog.getFooterContainer());
									setTimeout(() => {
										main_core.Dom.remove(alert);
									}, 3000);
									reject();
								});
							});
						});
					},
					'Item:onSelect': main_core.Runtime.debounce(onTagsChange, 100, this),
					'Item:onDeselect': main_core.Runtime.debounce(onTagsChange, 100, this)
				}
			});
			this.#tagSelectorDialog.show();
		}
		handleCreatedByClick(ownerData) {
			this.handleFilterChange({
				fieldId: 'CREATED_BY_ID',
				...ownerData
			});
		}
		handleFilterChange(fieldData) {
			const filterFieldsValues = this.getFilter().getFilterFieldsValues();
			let currentFilteredField = filterFieldsValues[fieldData.fieldId] ?? [];
			let currentFilteredFieldLabel = filterFieldsValues[`${fieldData.fieldId}_label`] ?? [];
			if (fieldData.IS_FILTERED) {
				currentFilteredField = currentFilteredField.filter(value => parseInt(value, 10) !== fieldData.ID);
				currentFilteredFieldLabel = currentFilteredFieldLabel.filter(value => value !== fieldData.TITLE);
			} else if (!currentFilteredField.includes(fieldData.ID)) {
				currentFilteredField.push(fieldData.ID.toString());
				currentFilteredFieldLabel.push(fieldData.TITLE);
			}
			const filterApi = this.getFilter().getApi();
			const filterToExtend = {};
			filterToExtend[fieldData.fieldId] = currentFilteredField;
			filterToExtend[`${fieldData.fieldId}_label`] = currentFilteredFieldLabel;
			filterApi.extendFilter(filterToExtend);
			filterApi.apply();
		}
		addToTopMenu(dashboardId, url, restrictionCode = null) {
			BX.UI.Notification.Center.notify({
				content: main_core.Loc.getMessage('BICONNECTOR_SUPERSET_DASHBOARD_GRID_ADD_TO_TOP_MENU_SUCCESS')
			});
			this.#switchTopMenuAction(dashboardId, true, url, restrictionCode);
			return this.#dashboardManager.addToTopMenu(dashboardId).then(response => {}).catch(response => {
				this.#grid.updateRow(dashboardId);
				BX.UI.Notification.Center.notify({
					content: main_core.Loc.getMessage('BICONNECTOR_SUPERSET_DASHBOARD_GRID_ADD_TO_TOP_MENU_ERROR')
				});
			});
		}
		deleteFromTopMenu(dashboardId, url, restrictionCode = null) {
			BX.UI.Notification.Center.notify({
				content: main_core.Loc.getMessage('BICONNECTOR_SUPERSET_DASHBOARD_GRID_DELETE_FROM_TOP_MENU_SUCCESS')
			});
			this.#switchTopMenuAction(dashboardId, false, url, restrictionCode);
			return this.#dashboardManager.deleteFromTopMenu(dashboardId).then(response => {}).catch(response => {
				this.#grid.updateRow(dashboardId);
				BX.UI.Notification.Center.notify({
					content: main_core.Loc.getMessage('BICONNECTOR_SUPERSET_DASHBOARD_GRID_DELETE_FROM_TOP_MENU_ERROR')
				});
			});
		}
		#switchTopMenuAction(dashboardId, isInTopMenu, url = '/', restrictionCode = null) {
			const row = this.#grid.getRows().getById(dashboardId);
			const rowActions = row?.getActions();
			for (const [index, action] of rowActions.entries()) {
				if (isInTopMenu && action.ACTION_ID === 'addToTopMenu') {
					rowActions[index].ACTION_ID = 'deleteFromTopMenu';
					rowActions[index].onclick = `BX.BIConnector.SupersetDashboardGridManager.Instance.deleteFromTopMenu(${dashboardId}, \`${url}\`, \`${restrictionCode}\`)`;
					rowActions[index].text = main_core.Loc.getMessage('BICONNECTOR_SUPERSET_DASHBOARD_GRID_ACTION_ITEM_DELETE_FROM_TOP_MENU');
				} else if (!isInTopMenu && action.ACTION_ID === 'deleteFromTopMenu') {
					rowActions[index].ACTION_ID = 'addToTopMenu';
					rowActions[index].onclick = `BX.BIConnector.SupersetDashboardGridManager.Instance.addToTopMenu(${dashboardId}, \`${url}\`, \`${restrictionCode}\`)`;
					rowActions[index].text = main_core.Loc.getMessage('BICONNECTOR_SUPERSET_DASHBOARD_GRID_ACTION_ITEM_ADD_TO_TOP_MENU');
				}
			}
			row.setActions(rowActions);
			const titleCell = row?.getCellById('TITLE');
			let dashboardTitle = '';
			if (titleCell) {
				const titleWrapper = titleCell.querySelector('.dashboard-title-wrapper__item');
				dashboardTitle = titleWrapper.querySelector('a').innerText;
			}
			const onClick = restrictionCode ? `top.BX.UI.InfoHelper.show('${restrictionCode}');` : `window.open(\`${url}\`, '_blank');`;
			const isLocked = restrictionCode ? true : false;
			const menu = BX.Main.interfaceButtonsManager.getById('biconnector_superset_menu');
			if (isInTopMenu && dashboardTitle) {
				menu.addMenuItem({
					ID: `biconnector_superset_menu_dashboard_${dashboardId}`,
					TEXT: dashboardTitle,
					ON_CLICK: onClick,
					IS_LOCKED: isLocked,
					// TODO: Temporary workaround for compatibility with main 25.300.0, remove after that version is released
					id: `biconnector_superset_menu_dashboard_${dashboardId}`,
					text: dashboardTitle,
					onClick,
					isLocked
				});
				const menuItem = menu.getItemById(`biconnector_superset_menu_dashboard_${dashboardId}`);
				const firstMenuItem = menu.getVisibleItems();
				main_core.Dom.insertBefore(menuItem, firstMenuItem[0]);
			} else {
				const menuItem = menu.getItemById(`biconnector_superset_menu_dashboard_${dashboardId}`);
				menu.deleteMenuItem(menuItem);
			}
		}
		pin(dashboardId) {
			return this.#dashboardManager.pin(dashboardId).then(() => {
				this.#grid.reload();
			}).catch(() => {});
		}
		unpin(dashboardId) {
			return this.#dashboardManager.unpin(dashboardId).then(() => {
				this.#grid.reload();
			}).catch(() => {});
		}
		#isWindowHistoryReady() {
			return window && window.history && main_core.Type.isFunction(window.history.pushState) && main_core.Type.isFunction(window.history.replaceState);
		}
		#replaceHistoryState() {
			if (!this.#isWindowHistoryReady()) {
				return;
			}
			const state = history.state ?? {};
			const filter = this.getFilter();
			const filterState = main_core.clone(filter.getFilterFieldsValues());
			history.replaceState({
				...state,
				filter: filterState
			}, '', window.location.href);
		}
		#pushHistoryState() {
			if (!this.#isWindowHistoryReady()) {
				return;
			}
			const state = history.state ?? {};
			const filter = this.getFilter();
			const filterState = main_core.clone(filter.getFilterFieldsValues());
			history.pushState({
				...state,
				filter: filterState
			}, '', window.location.href);
		}
	}
	main_core.Reflection.namespace('BX.BIConnector').SupersetDashboardGridManager = SupersetDashboardGridManager;

})(BX, BX.Main, BX.Main, BX.BIConnector, BX.Event, BX.BIConnector, BX.UI.EntitySelector, BX.UI.Tour, BX.BIConnector, BX.BIConnector.EntitySelector, BX.UI, BX.UI, BX, BX.UI.System, BX.BIConnector, BX.UI.System.Typography, BX.BIConnector);
//# sourceMappingURL=script.js.map
