/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, main_core_events, sidepanel, biconnector_dashboardExportMaster, biconnector_dashboardRelatedItemsList, biconnector_dashboardGroup, ui_buttons, ui_system_dialog) {
	'use strict';

	class DashboardManager {
		static DASHBOARD_STATUS_LOAD = 'L';
		static DASHBOARD_STATUS_READY = 'R';
		static DASHBOARD_STATUS_FAILED = 'F';
		static DASHBOARD_STATUS_DRAFT = 'D';
		static DASHBOARD_STATUS_NOT_INSTALLED = 'N';
		static DASHBOARD_STATUS_COMPUTED_NOT_LOAD = 'NL';
		constructor() {
			this.subscribeOnEvents();
		}
		subscribeOnEvents() {
			BX.PULL && BX.PULL.extendWatch('superset_dashboard', true);
			main_core_events.EventEmitter.subscribe('onPullEvent-biconnector', event => {
				const [eventName, eventData] = event.data;
				if (eventName !== 'onDashboardStatusUpdated' || !eventData) {
					return;
				}
				const dashboardList = eventData?.dashboardList;
				if (dashboardList) {
					main_core_events.EventEmitter.emit('BIConnector.Superset.DashboardManager:onDashboardBatchStatusUpdate', {
						dashboardList
					});
				}
			});
		}
		processEditDashboard(dashboardInfo, onCloseProcessing = () => {}, onCompleteProcessing = () => {}, onFailProcessing = () => {}) {
			if (dashboardInfo.type === 'CUSTOM') {
				this.processLoginDashboard(dashboardInfo, onCloseProcessing, onCompleteProcessing, onFailProcessing);
			} else {
				this.processCopyDashboard(dashboardInfo, onCloseProcessing, onCompleteProcessing, onFailProcessing);
			}
		}
		processCopyDashboard(dashboardInfo, onCloseProcessing = () => {}, onCompleteProcessing = () => {}, onFailProcessing = () => {}) {
			const attentionText = dashboardInfo.type === 'SYSTEM' ? main_core.Loc.getMessage('SUPERSET_DASHBOARD_DETAIL_LOGIN_POPUP_COPY_SYSTEM_DASHBOARD_ATTENTION') : main_core.Loc.getMessage('SUPERSET_DASHBOARD_DETAIL_LOGIN_POPUP_COPY_MARKET_DASHBOARD_ATTENTION_MSGVER_1');
			const confirmContent = main_core.Tag.render`
			<div class="dashboard-login-popup-copy-attention">
				${attentionText}
			</div>
		`;
			const popupType = 'popup_copy';
			const continueBtn = new ui_buttons.Button({
				text: main_core.Loc.getMessage('SUPERSET_DASHBOARD_DETAIL_LOGIN_POPUP_CONTINUE_BTN'),
				size: ui_buttons.ButtonSize.LARGE,
				style: ui_buttons.AirButtonStyle.FILLED,
				useAirDesign: true,
				onclick: () => {
					continueBtn.setWaiting(true);
					this.duplicateDashboard(dashboardInfo.id).then(duplicateResponse => {
						onCompleteProcessing(popupType);
						const dashboard = duplicateResponse.data.dashboard;
						if (!dashboard) {
							BX.UI.Notification.Center.notify({
								content: BX.util.htmlspecialchars(main_core.Loc.getMessage('SUPERSET_DASHBOARD_DETAIL_COPY_ERROR'))
							});
							return null;
						}
						return this.getDashboardEmbeddedData(dashboard.id);
					}).then(embeddedResponse => {
						main_core_events.EventEmitter.emit('BIConnector.DashboardManager:onCopyDashboard', {
							dashboard: embeddedResponse.data.dashboard
						});
						const copiedDashboardInfo = {
							id: embeddedResponse.data.dashboard.id,
							editLink: embeddedResponse.data.dashboard.editUrl,
							type: embeddedResponse.data.dashboard.type
						};
						this.processLoginDashboard(copiedDashboardInfo, () => {
							onCloseProcessing();
							popup.hide();
							main_core_events.EventEmitter.emit('BIConnector.DashboardManager:onEmbeddedDataLoaded');
						}, onCompleteProcessing, onFailProcessing);
					}).catch(response => {
						onFailProcessing(popupType);
						if (response.errors && main_core.Type.isStringFilled(response.errors[0]?.message)) {
							BX.UI.Notification.Center.notify({
								content: main_core.Text.encode(response.errors[0].message)
							});
						}
					});
				}
			});
			const popup = new ui_system_dialog.Dialog({
				content: confirmContent,
				overlay: true,
				width: 400,
				hasOverlay: true,
				title: main_core.Loc.getMessage('SUPERSET_DASHBOARD_DETAIL_LOGIN_POPUP_TITLE'),
				centerButtons: [continueBtn, new ui_buttons.Button({
					text: main_core.Loc.getMessage('SUPERSET_DASHBOARD_DETAIL_LOGIN_POPUP_CANCEL_BTN'),
					size: ui_buttons.ButtonSize.LARGE,
					style: ui_buttons.AirButtonStyle.PLAIN,
					useAirDesign: true,
					onclick: () => {
						popup.hide();
					}
				})],
				events: {
					onHide: () => {
						onCloseProcessing('popup_copy');
					}
				}
			});
			popup.show();
		}
		processLoginDashboard(dashboardInfo, onCloseProcessing = () => {}, onCompleteProcessing = () => {}, onFailProcessing = () => {}) {
			const popupType = 'popup_login';
			this.getEditUrl(dashboardInfo).then(response => {
				onCompleteProcessing(popupType);
				if (response) {
					window.open(response, '_blank').focus();
				}
			}).catch(() => {
				onFailProcessing(popupType);
				window.open(dashboardInfo.editLink, '_blank').focus();
			}).finally(() => {
				onCloseProcessing();
			});
		}
		duplicateDashboard(dashboardId) {
			return main_core.ajax.runAction('biconnector.dashboard.copy', {
				data: {
					id: dashboardId
				}
			});
		}
		getDashboardUrlParameters(dashboardId) {
			return main_core.ajax.runAction('biconnector.dashboard.getDashboardUrlParameters', {
				data: {
					id: dashboardId
				}
			});
		}
		getDashboardRelatedItems(dashboardId) {
			return main_core.ajax.runAction('biconnector.dashboard.getMarketDashboardRelatedItems', {
				data: {
					id: dashboardId
				}
			});
		}
		getSupersetEntityLoginUrl(entityUrl) {
			return main_core.ajax.runAction('biconnector.dashboard.getSupersetEntityLoginUrl', {
				data: {
					entityUrl
				}
			});
		}
		exportDashboard(dashboardId, openedFrom) {
			const exportMaster = new biconnector_dashboardExportMaster.DashboardExportMaster({
				dashboardId,
				openedFrom
			});

			/** @see BX.BIConnector.DashboardExportMaster.showPopup() */
			return exportMaster.showPopup();
		}
		deleteDashboard(dashboardId) {
			return main_core.ajax.runAction('biconnector.dashboard.delete', {
				data: {
					id: dashboardId
				}
			});
		}
		showDeleteDashboardDialog(options) {
			const dashboardId = options?.dashboardId;
			const dashboardType = options?.dashboardType ?? '';
			if (dashboardType !== 'MARKET') {
				return this.showDeleteConfirmationPopup(dashboardId, dashboardType);
			}
			let isPopupClosedByUser = false;
			let isPopupClosingBySystem = false;
			const loadingPopup = new ui_system_dialog.Dialog({
				content: main_core.Tag.render`
				<div class="dashboard-delete-loading-popup">
					<div class="dashboard-delete-loading-popup-spinner-wrapper">
						<div class="dashboard-delete-loading-popup-spinner"></div>
					</div>
					<div class="dashboard-delete-loading-popup-text">
						${main_core.Text.encode(main_core.Loc.getMessage('SUPERSET_DASHBOARD_DELETE_POPUP_LOAD'))}
					</div>
				</div>
			`,
				width: 400,
				height: 176,
				title: ' ',
				hasCloseButton: true,
				hasOverlay: true,
				disableScrolling: true,
				hasVerticalPadding: false,
				hasHorizontalPadding: false,
				events: {
					onHide: () => {
						if (!isPopupClosingBySystem) {
							isPopupClosedByUser = true;
						}
						isPopupClosingBySystem = false;
					}
				}
			});
			const hideLoadingPopup = () => {
				isPopupClosingBySystem = true;
				loadingPopup.hide();
			};
			loadingPopup.show();
			return this.getDashboardRelatedItems(dashboardId).then(result => {
				if (isPopupClosedByUser) {
					return {
						status: 'cancelled'
					};
				}
				hideLoadingPopup();
				if (result.data && result.data.length > 0) {
					return this.showRelatedEntitiesToDelete(result.data);
				}
				return this.showDeleteConfirmationPopup(dashboardId, dashboardType);
			}).catch(response => {
				if (isPopupClosedByUser) {
					return {
						status: 'cancelled'
					};
				}
				hideLoadingPopup();
				this.notifyDeleteError(response);
				return Promise.reject(response);
			});
		}
		showDeleteConfirmationPopup(dashboardId, dashboardType) {
			const message = dashboardType === 'CUSTOM' ? main_core.Loc.getMessage('SUPERSET_DASHBOARD_DELETE_POPUP_MESSAGE_CUSTOM') : main_core.Loc.getMessage('SUPERSET_DASHBOARD_DELETE_POPUP_MESSAGE_MARKET');
			return new Promise((resolve, reject) => {
				let isResolved = false;
				let isDeleteInProgress = false;
				const resolveOnce = result => {
					if (isResolved) {
						return;
					}
					isResolved = true;
					resolve(result);
				};
				const rejectOnce = response => {
					if (isResolved) {
						return;
					}
					isResolved = true;
					reject(response);
				};
				const deletePopup = new ui_system_dialog.Dialog({
					title: main_core.Loc.getMessage('SUPERSET_DASHBOARD_DELETE_POPUP_TITLE'),
					content: message,
					width: 400,
					hasCloseButton: true,
					hasOverlay: true,
					closeByEsc: true,
					disableScrolling: true,
					centerButtons: [new ui_buttons.Button({
						text: main_core.Loc.getMessage('SUPERSET_DASHBOARD_DELETE_POPUP_CAPTION_NO'),
						size: ui_buttons.ButtonSize.LARGE,
						useAirDesign: true,
						style: ui_buttons.AirButtonStyle.FILLED,
						onclick: () => deletePopup.hide()
					}), new ui_buttons.Button({
						text: main_core.Loc.getMessage('SUPERSET_DASHBOARD_DELETE_POPUP_CAPTION_YES'),
						useAirDesign: true,
						size: ui_buttons.ButtonSize.LARGE,
						style: ui_buttons.AirButtonStyle.PLAIN,
						onclick: button => {
							isDeleteInProgress = true;
							button.setWaiting();
							this.deleteDashboard(dashboardId).then(() => {
								resolveOnce({
									status: 'deleted'
								});
								deletePopup.hide();
							}).catch(response => {
								isDeleteInProgress = false;
								this.notifyDeleteError(response);
								rejectOnce(response);
								deletePopup.hide();
							});
						}
					})],
					events: {
						onHide: () => {
							if (!isDeleteInProgress) {
								resolveOnce({
									status: 'cancelled'
								});
							}
						}
					}
				});
				deletePopup.show();
			});
		}
		showRelatedEntitiesToDelete(entities) {
			const list = new biconnector_dashboardRelatedItemsList.DashboardRelatedEntitiesList(entities, {
				onOpen: (url, onDone) => {
					this.openRelatedEntity(url, onDone);
				}
			});
			return new Promise(resolve => {
				let isResolved = false;
				const popup = new ui_system_dialog.Dialog({
					content: main_core.Tag.render`
					<div class="market-dashboard-delete-popup">
						<div class="market-dashboard-delete-popup-text">
							${main_core.Loc.getMessage('SUPERSET_DASHBOARD_DELETE_RELATED_OBJECTS_TEXT', {
					'[link]': '<a class="biconnector-grid-scope-hint-more" onclick="top.BX.Helper.show(`redirect=detail&code=26703788`)">',
					'[/link]': '</a>'
				})}
						</div>
						${list.render()}
					</div>
				`,
					width: 540,
					closeByEsc: true,
					hasOverlay: true,
					disableScrolling: true,
					title: main_core.Loc.getMessage('SUPERSET_DASHBOARD_DELETE_RELATED_OBJECTS_TITLE'),
					centerButtons: [new ui_buttons.Button({
						text: main_core.Loc.getMessage('SUPERSET_DASHBOARD_DELETE_RELATED_OBJECTS_OK_BTN'),
						onclick: () => {
							popup.hide();
						},
						useAirDesign: true,
						size: ui_buttons.ButtonSize.LARGE,
						style: ui_buttons.AirButtonStyle.FILLED
					})],
					events: {
						onHide: () => {
							if (!isResolved) {
								isResolved = true;
								resolve({
									status: 'blocked'
								});
							}
						}
					}
				});
				popup.show();
			});
		}
		openRelatedEntity(url, onDone = null) {
			const tab = window.open('about:blank', '_blank');
			const openUrl = targetUrl => {
				if (tab) {
					tab.location.href = targetUrl;
				} else {
					window.open(targetUrl, '_blank');
				}
				if (onDone) {
					onDone();
				}
			};
			this.getSupersetEntityLoginUrl(url).then(result => {
				openUrl(result.data);
			}).catch(() => {
				openUrl(url);
			});
		}
		notifyDeleteError(response) {
			const message = main_core.Type.isStringFilled(response?.errors?.[0]?.message) ? response.errors[0].message : main_core.Loc.getMessage('SUPERSET_DASHBOARD_DELETE_ERROR');
			BX.UI.Notification.Center.notify({
				content: main_core.Text.encode(message)
			});
		}
		openDiscussionChat(dashboardId) {
			return main_core.ajax.runAction('biconnector.dashboard.openDiscussionChat', {
				data: {
					id: dashboardId
				}
			});
		}
		deleteGroup(dashboardId) {
			return main_core.ajax.runAction('biconnector.group.delete', {
				data: {
					id: dashboardId
				}
			});
		}
		showGroupSettingsPopup(groupId) {
			return new Promise((resolve, reject) => {
				main_core.ajax.runAction('biconnector.group.loadSettingsData', {
					data: {
						groupIdCode: groupId
					}
				}).then(response => {
					const dashboards = new Map(Object.entries(response.data.dashboards ?? []).map(([key, value]) => [Number(key), value]));
					biconnector_dashboardGroup.DashboardGroup.open({
						groupId,
						groups: response.data.groups,
						dashboards,
						saveEnabled: true,
						user: response.data.user
					});
					resolve(response);
				}).catch(response => {
					if (response.errors) {
						main_core.UI.Notification.Center.notify({
							content: main_core.Text.encode(response.errors[0].message)
						});
					}
					reject(response);
				});
			});
		}
		renameDashboard(dashboardId, title) {
			return main_core.ajax.runAction('biconnector.dashboard.rename', {
				data: {
					id: dashboardId,
					title
				}
			});
		}
		restartDashboardImport(dashboardId) {
			return main_core.ajax.runAction('biconnector.dashboard.restartImport', {
				data: {
					id: dashboardId
				}
			}).then(response => {
				const dashboardIds = response?.data?.restartedDashboardIds;
				if (!dashboardIds) {
					return;
				}
				const dashboardList = [];
				for (const restartedDashboardId of dashboardIds) {
					dashboardList.push({
						id: Number(restartedDashboardId),
						status: 'L'
					});
				}
				main_core_events.EventEmitter.emit(window, 'BIConnector.Superset.DashboardManager:onDashboardBatchStatusUpdate', {
					dashboardList
				});
			});
		}
		setDashboardTags(dashboardId, tags) {
			return main_core.ajax.runAction('biconnector.dashboard.setDashboardTags', {
				data: {
					id: dashboardId,
					tags
				}
			});
		}
		addTag(title) {
			return main_core.ajax.runAction('biconnector.dashboardTag.add', {
				data: {
					title
				}
			});
		}
		static openSettingsSlider(dashboardId = null, dashboardType = null) {
			const isCustomDashboard = main_core.Type.isStringFilled(dashboardType) && dashboardType === 'CUSTOM';
			let componentLink = '/bitrix/components/bitrix/biconnector.apachesuperset.setting/slider.php';
			const isDashboardSettings = dashboardId !== null;
			if (isDashboardSettings) {
				componentLink = isCustomDashboard ? '/bitrix/components/bitrix/biconnector.apachesuperset.dashboard.edit/slider.php' : '/bitrix/components/bitrix/biconnector.apachesuperset.dashboard.setting/slider.php';
			}
			const sliderLink = new main_core.Uri(componentLink);
			if (isDashboardSettings) {
				if (isCustomDashboard) {
					sliderLink.setQueryParam('dashboardId', main_core.Text.toNumber(dashboardId));
				} else {
					sliderLink.setQueryParam('DASHBOARD_ID', main_core.Text.toNumber(dashboardId));
				}
			}
			BX.SidePanel.Instance.open(sliderLink.toString(), {
				width: dashboardId === null ? 600 : 790,
				allowChangeHistory: false,
				cacheable: false
			});
		}
		static openDatasetListSlider() {
			BX.SidePanel.Instance.open('/bi/table/', {
				cacheable: false,
				allowChangeHistory: true,
				allowChangeTitle: true
			});
		}
		static installDashboard(dashboardId) {
			return BX.ajax.runAction('biconnector.dashboard.installDashboard', {
				data: {
					id: dashboardId
				}
			});
		}
		openCreationSlider(groupIds = [], dashboardId = 0) {
			const componentLink = '/bitrix/components/bitrix/biconnector.apachesuperset.dashboard.edit/slider.php';
			const sliderLink = new main_core.Uri(componentLink);
			if (groupIds.length > 0) {
				sliderLink.setQueryParam('groupIds', groupIds);
			}
			if (dashboardId > 0) {
				sliderLink.setQueryParam('dashboardId', main_core.Text.toNumber(dashboardId));
			}
			BX.SidePanel.Instance.open(sliderLink.toString(), {
				width: 790,
				allowChangeHistory: false,
				cacheable: false
			});
		}
		showCreationGroupPopup() {
			this.showGroupSettingsPopup('new_G0');
		}
		getEditUrl(dashboardInfo) {
			return new Promise((resolve, reject) => {
				main_core.ajax.runAction('biconnector.dashboard.getEditUrl', {
					data: {
						id: dashboardInfo.id,
						editUrl: dashboardInfo.editLink
					}
				}).then(response => {
					const data = response.data;
					if (data) {
						resolve(data);
					}
				}).catch(e => {
					reject(e);
				});
			});
		}
		addToTopMenu(dashboardId) {
			return main_core.ajax.runAction('biconnector.dashboard.addToTopMenu', {
				data: {
					dashboardId
				}
			});
		}
		deleteFromTopMenu(dashboardId) {
			return main_core.ajax.runAction('biconnector.dashboard.deleteFromTopMenu', {
				data: {
					dashboardId
				}
			});
		}
		pin(dashboardId) {
			return main_core.ajax.runAction('biconnector.dashboard.pin', {
				data: {
					dashboardId
				}
			});
		}
		unpin(dashboardId) {
			return main_core.ajax.runAction('biconnector.dashboard.unpin', {
				data: {
					dashboardId
				}
			});
		}
		getDashboardEmbeddedData(dashboardId) {
			return BX.ajax.runAction('biconnector.dashboard.getDashboardEmbeddedData', {
				data: {
					id: dashboardId
				}
			});
		}
		toggleDraft(dashboardId, publish) {
			return BX.ajax.runAction('biconnector.dashboard.toggleDraft', {
				data: {
					id: dashboardId,
					publish: publish ? 1 : 0
				}
			});
		}
		createEventOpenNotInstalledDashboard(dashboardId, fallbackUrl) {
			this.getDashboardEmbeddedData(dashboardId).then(response => {
				const dashboard = response.data.dashboard;
				if (dashboard?.embeddedUrl) {
					window.open(dashboard.embeddedUrl, '_blank');
				} else {
					window.open(fallbackUrl, '_blank');
				}
			}).catch(() => {
				window.open(fallbackUrl, '_blank');
			});
		}
	}

	exports.DashboardManager = DashboardManager;

})(this.BX.BIConnector = this.BX.BIConnector || {}, BX, BX.Event, BX, BX.BIConnector, BX.BIConnector, BX.BIConnector, BX.UI, BX.UI.System);
