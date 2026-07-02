import { ajax as Ajax, Loc, Tag, Text, Type, Uri, UI } from 'main.core';
import { BaseEvent, EventEmitter } from 'main.core.events';
import 'sidepanel';
import { DashboardExportMaster } from 'biconnector.dashboard-export-master';
import { DashboardRelatedEntitiesList } from 'biconnector.dashboard-related-items-list';
import type { Entity as DashboardRelatedEntity } from 'biconnector.dashboard-related-items-list';
import { DashboardGroup } from 'biconnector.dashboard-group';
import { AirButtonStyle, Button, ButtonSize } from 'ui.buttons';
import { Dialog } from 'ui.system.dialog';

import './css/main.css';

type DashboardInfo = {
	id: number,
	isEditable: boolean,
	type: 'SYSTEM' | 'MARKET' | 'CUSTOM',
	appId: string, // for analytic
	editLink: string,
	title: string,
};

type DeleteDashboardDialogOptions = {
	dashboardId: number | string,
	dashboardType: 'SYSTEM' | 'MARKET' | 'CUSTOM' | string,
};

type DeleteDashboardDialogResult = {
	status: 'deleted' | 'cancelled' | 'blocked',
};

export class DashboardManager
{
	static DASHBOARD_STATUS_LOAD = 'L';
	static DASHBOARD_STATUS_READY = 'R';
	static DASHBOARD_STATUS_FAILED = 'F';
	static DASHBOARD_STATUS_DRAFT = 'D';
	static DASHBOARD_STATUS_NOT_INSTALLED = 'N';

	static DASHBOARD_STATUS_COMPUTED_NOT_LOAD = 'NL';

	constructor()
	{
		this.subscribeOnEvents();
	}

	subscribeOnEvents()
	{
		BX.PULL && BX.PULL.extendWatch('superset_dashboard', true);
		EventEmitter.subscribe('onPullEvent-biconnector', (event: BaseEvent) => {
			const [eventName, eventData] = event.data;
			if (eventName !== 'onDashboardStatusUpdated' || !eventData)
			{
				return;
			}

			const dashboardList = eventData?.dashboardList;
			if (dashboardList)
			{
				EventEmitter.emit('BIConnector.Superset.DashboardManager:onDashboardBatchStatusUpdate', {
					dashboardList,
				});
			}
		});
	}

	processEditDashboard(
		dashboardInfo: DashboardInfo,
		onCloseProcessing: () => void = () => {},
		onCompleteProcessing: (popupType: string) => void = () => {},
		onFailProcessing: (popupType: string) => void = () => {},
	)
	{
		if (dashboardInfo.type === 'CUSTOM')
		{
			this.processLoginDashboard(dashboardInfo, onCloseProcessing, onCompleteProcessing, onFailProcessing);
		}
		else
		{
			this.processCopyDashboard(dashboardInfo, onCloseProcessing, onCompleteProcessing, onFailProcessing);
		}
	}

	processCopyDashboard(
		dashboardInfo: DashboardInfo,
		onCloseProcessing: (popupType: string) => void = () => {},
		onCompleteProcessing: (popupType: string) => void = () => {},
		onFailProcessing: (popupType: string) => void = () => {},
	): void
	{
		const attentionText = dashboardInfo.type === 'SYSTEM'
			? Loc.getMessage('SUPERSET_DASHBOARD_DETAIL_LOGIN_POPUP_COPY_SYSTEM_DASHBOARD_ATTENTION')
			: Loc.getMessage('SUPERSET_DASHBOARD_DETAIL_LOGIN_POPUP_COPY_MARKET_DASHBOARD_ATTENTION_MSGVER_1')
		;
		const confirmContent = Tag.render`
			<div class="dashboard-login-popup-copy-attention">
				${attentionText}
			</div>
		`;

		const popupType = 'popup_copy';

		const continueBtn = new Button({
			text: Loc.getMessage('SUPERSET_DASHBOARD_DETAIL_LOGIN_POPUP_CONTINUE_BTN'),
			size: ButtonSize.LARGE,
			style: AirButtonStyle.FILLED,
			useAirDesign: true,
			onclick: () => {
				continueBtn.setWaiting(true);
				this.duplicateDashboard(dashboardInfo.id)
					.then((duplicateResponse) => {
						onCompleteProcessing(popupType);
						const dashboard = duplicateResponse.data.dashboard;
						if (!dashboard)
						{
							BX.UI.Notification.Center.notify({
								content: BX.util.htmlspecialchars(
									Loc.getMessage('SUPERSET_DASHBOARD_DETAIL_COPY_ERROR'),
								),
							});

							return null;
						}

						return this.getDashboardEmbeddedData(dashboard.id);
					})
					.then((embeddedResponse) => {
						EventEmitter.emit('BIConnector.DashboardManager:onCopyDashboard', {
							dashboard: embeddedResponse.data.dashboard,
						});
						const copiedDashboardInfo = {
							id: embeddedResponse.data.dashboard.id,
							editLink: embeddedResponse.data.dashboard.editUrl,
							type: embeddedResponse.data.dashboard.type,
						};
						this.processLoginDashboard(
							copiedDashboardInfo,
							() => {
								onCloseProcessing();
								popup.hide();
								EventEmitter.emit('BIConnector.DashboardManager:onEmbeddedDataLoaded');
							},
							onCompleteProcessing,
							onFailProcessing,
						);
					})
					.catch((response) => {
						onFailProcessing(popupType);
						if (response.errors && Type.isStringFilled(response.errors[0]?.message))
						{
							BX.UI.Notification.Center.notify({
								content: Text.encode(response.errors[0].message),
							});
						}
					});
			},
		});

		const popup = new Dialog({
			content: confirmContent,
			overlay: true,
			width: 400,
			hasOverlay: true,
			title: Loc.getMessage('SUPERSET_DASHBOARD_DETAIL_LOGIN_POPUP_TITLE'),
			centerButtons: [
				continueBtn,
				new Button({
					text: Loc.getMessage('SUPERSET_DASHBOARD_DETAIL_LOGIN_POPUP_CANCEL_BTN'),
					size: ButtonSize.LARGE,
					style: AirButtonStyle.PLAIN,
					useAirDesign: true,
					onclick: () => {
						popup.hide();
					},
				}),
			],
			events: {
				onHide: () => {
					onCloseProcessing('popup_copy');
				},
			},
		});

		popup.show();
	}

	processLoginDashboard(
		dashboardInfo: DashboardInfo,
		onCloseProcessing: (popupType: string) => void = () => {},
		onCompleteProcessing: (popupType: string) => void = () => {},
		onFailProcessing: (popupType: string) => void = () => {},
	): void
	{
		const popupType = 'popup_login';

		this.getEditUrl(dashboardInfo)
			.then((response) => {
				onCompleteProcessing(popupType);
				if (response)
				{
					window.open(response, '_blank').focus();
				}
			})
			.catch(() => {
				onFailProcessing(popupType);
				window.open(dashboardInfo.editLink, '_blank').focus();
			})
			.finally(() => {
				onCloseProcessing();
			});
	}

	duplicateDashboard(dashboardId: number | string): Promise
	{
		return Ajax.runAction('biconnector.dashboard.copy', {
			data: {
				id: dashboardId,
			},
		});
	}

	getDashboardUrlParameters(dashboardId: number | string): Promise
	{
		return Ajax.runAction('biconnector.dashboard.getDashboardUrlParameters', {
			data: {
				id: dashboardId,
			},
		});
	}

	getDashboardRelatedItems(dashboardId: number | string): Promise
	{
		return Ajax.runAction('biconnector.dashboard.getMarketDashboardRelatedItems', {
			data: {
				id: dashboardId,
			},
		});
	}

	getSupersetEntityLoginUrl(entityUrl: string): Promise
	{
		return Ajax.runAction('biconnector.dashboard.getSupersetEntityLoginUrl', {
			data: {
				entityUrl,
			},
		});
	}

	exportDashboard(
		dashboardId: number,
		openedFrom: string,
	): Promise
	{
		const exportMaster: DashboardExportMaster = new DashboardExportMaster({
			dashboardId,
			openedFrom,
		});

		/** @see BX.BIConnector.DashboardExportMaster.showPopup() */
		return exportMaster.showPopup();
	}

	deleteDashboard(dashboardId): Promise
	{
		return Ajax.runAction('biconnector.dashboard.delete', {
			data: {
				id: dashboardId,
			},
		});
	}

	showDeleteDashboardDialog(
		options: DeleteDashboardDialogOptions,
	): Promise<DeleteDashboardDialogResult>
	{
		const dashboardId = options?.dashboardId;
		const dashboardType = options?.dashboardType ?? '';

		if (dashboardType !== 'MARKET')
		{
			return this.showDeleteConfirmationPopup(dashboardId, dashboardType);
		}

		let isPopupClosedByUser = false;
		let isPopupClosingBySystem = false;

		const loadingPopup = new Dialog({
			content: Tag.render`
				<div class="dashboard-delete-loading-popup">
					<div class="dashboard-delete-loading-popup-spinner-wrapper">
						<div class="dashboard-delete-loading-popup-spinner"></div>
					</div>
					<div class="dashboard-delete-loading-popup-text">
						${Text.encode(Loc.getMessage('SUPERSET_DASHBOARD_DELETE_POPUP_LOAD'))}
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
					if (!isPopupClosingBySystem)
					{
						isPopupClosedByUser = true;
					}

					isPopupClosingBySystem = false;
				},
			},
		});

		const hideLoadingPopup = (): void => {
			isPopupClosingBySystem = true;
			loadingPopup.hide();
		};

		loadingPopup.show();

		return this.getDashboardRelatedItems(dashboardId)
			.then((result) => {
				if (isPopupClosedByUser)
				{
					return { status: 'cancelled' };
				}

				hideLoadingPopup();

				if (result.data && result.data.length > 0)
				{
					return this.showRelatedEntitiesToDelete(result.data);
				}

				return this.showDeleteConfirmationPopup(dashboardId, dashboardType);
			})
			.catch((response) => {
				if (isPopupClosedByUser)
				{
					return { status: 'cancelled' };
				}

				hideLoadingPopup();
				this.notifyDeleteError(response);

				return Promise.reject(response);
			})
		;
	}

	showDeleteConfirmationPopup(
		dashboardId: number | string,
		dashboardType: string,
	): Promise<DeleteDashboardDialogResult>
	{
		const message = dashboardType === 'CUSTOM'
			? Loc.getMessage('SUPERSET_DASHBOARD_DELETE_POPUP_MESSAGE_CUSTOM')
			: Loc.getMessage('SUPERSET_DASHBOARD_DELETE_POPUP_MESSAGE_MARKET')
		;

		return new Promise((resolve, reject) => {
			let isResolved = false;
			let isDeleteInProgress = false;

			const resolveOnce = (result: DeleteDashboardDialogResult): void => {
				if (isResolved)
				{
					return;
				}

				isResolved = true;
				resolve(result);
			};

			const rejectOnce = (response: Object): void => {
				if (isResolved)
				{
					return;
				}

				isResolved = true;
				reject(response);
			};

			const deletePopup = new Dialog({
				title: Loc.getMessage('SUPERSET_DASHBOARD_DELETE_POPUP_TITLE'),
				content: message,
				width: 400,
				hasCloseButton: true,
				hasOverlay: true,
				closeByEsc: true,
				disableScrolling: true,
				centerButtons: [
					new Button({
						text: Loc.getMessage('SUPERSET_DASHBOARD_DELETE_POPUP_CAPTION_NO'),
						size: ButtonSize.LARGE,
						useAirDesign: true,
						style: AirButtonStyle.FILLED,
						onclick: () => deletePopup.hide(),
					}),
					new Button({
						text: Loc.getMessage('SUPERSET_DASHBOARD_DELETE_POPUP_CAPTION_YES'),
						useAirDesign: true,
						size: ButtonSize.LARGE,
						style: AirButtonStyle.PLAIN,
						onclick: (button) => {
							isDeleteInProgress = true;
							button.setWaiting();
							this.deleteDashboard(dashboardId)
								.then(() => {
									resolveOnce({ status: 'deleted' });
									deletePopup.hide();
								})
								.catch((response) => {
									isDeleteInProgress = false;
									this.notifyDeleteError(response);
									rejectOnce(response);
									deletePopup.hide();
								})
							;
						},
					}),
				],
				events: {
					onHide: () => {
						if (!isDeleteInProgress)
						{
							resolveOnce({ status: 'cancelled' });
						}
					},
				},
			});

			deletePopup.show();
		});
	}

	showRelatedEntitiesToDelete(
		entities: DashboardRelatedEntity[],
	): Promise<DeleteDashboardDialogResult>
	{
		const list = new DashboardRelatedEntitiesList(entities, {
			onOpen: (url: string, onDone: ?Function) => {
				this.openRelatedEntity(url, onDone);
			},
		});

		return new Promise((resolve) => {
			let isResolved = false;

			const popup = new Dialog({
				content: Tag.render`
					<div class="market-dashboard-delete-popup">
						<div class="market-dashboard-delete-popup-text">
							${Loc.getMessage('SUPERSET_DASHBOARD_DELETE_RELATED_OBJECTS_TEXT', {
								'[link]': '<a class="biconnector-grid-scope-hint-more" onclick="top.BX.Helper.show(`redirect=detail&code=26703788`)">',
								'[/link]': '</a>',
							})}
						</div>
						${list.render()}
					</div>
				`,
				width: 540,
				closeByEsc: true,
				hasOverlay: true,
				disableScrolling: true,
				title: Loc.getMessage('SUPERSET_DASHBOARD_DELETE_RELATED_OBJECTS_TITLE'),
				centerButtons: [
					new Button({
						text: Loc.getMessage('SUPERSET_DASHBOARD_DELETE_RELATED_OBJECTS_OK_BTN'),
						onclick: () => {
							popup.hide();
						},
						useAirDesign: true,
						size: ButtonSize.LARGE,
						style: AirButtonStyle.FILLED,
					}),
				],
				events: {
					onHide: () => {
						if (!isResolved)
						{
							isResolved = true;
							resolve({ status: 'blocked' });
						}
					},
				},
			});

			popup.show();
		});
	}

	openRelatedEntity(url: string, onDone: ?Function = null): void
	{
		const tab = window.open('about:blank', '_blank');

		const openUrl = (targetUrl: string): void => {
			if (tab)
			{
				tab.location.href = targetUrl;
			}
			else
			{
				window.open(targetUrl, '_blank');
			}

			if (onDone)
			{
				onDone();
			}
		};

		this.getSupersetEntityLoginUrl(url)
			.then((result) => {
				openUrl(result.data);
			})
			.catch(() => {
				openUrl(url);
			})
		;
	}

	notifyDeleteError(response: Object): void
	{
		const message = Type.isStringFilled(response?.errors?.[0]?.message)
			? response.errors[0].message
			: Loc.getMessage('SUPERSET_DASHBOARD_DELETE_ERROR')
		;

		BX.UI.Notification.Center.notify({
			content: Text.encode(message),
		});
	}

	openDiscussionChat(dashboardId: number): Promise
	{
		return Ajax.runAction('biconnector.dashboard.openDiscussionChat', {
			data: {
				id: dashboardId,
			},
		});
	}

	deleteGroup(dashboardId): Promise
	{
		return Ajax.runAction('biconnector.group.delete', {
			data: {
				id: dashboardId,
			},
		});
	}

	showGroupSettingsPopup(groupId): Promise
	{
		return new Promise((resolve, reject) => {
			Ajax
				.runAction('biconnector.group.loadSettingsData', { data: { groupIdCode: groupId } })
				.then((response: {}) => {
					const dashboards = new Map(
						Object
							.entries(response.data.dashboards ?? [])
							.map(([key, value]) => [Number(key), value]),
					);

					DashboardGroup.open({
						groupId,
						groups: response.data.groups,
						dashboards,
						saveEnabled: true,
						user: response.data.user,
					});
					resolve(response);
				})
				.catch((response) => {
					if (response.errors)
					{
						UI.Notification.Center.notify({
							content: Text.encode(response.errors[0].message),
						});
					}
					reject(response);
				})
			;
		});
	}

	renameDashboard(dashboardId: number, title: string): Promise
	{
		return Ajax.runAction('biconnector.dashboard.rename', {
			data: {
				id: dashboardId,
				title,
			},
		});
	}

	restartDashboardImport(dashboardId: number): Promise
	{
		return Ajax.runAction('biconnector.dashboard.restartImport', {
			data: {
				id: dashboardId,
			},
		}).then(
			(response) => {
				const dashboardIds = response?.data?.restartedDashboardIds;
				if (!dashboardIds)
				{
					return;
				}

				const dashboardList = [];
				for (const restartedDashboardId of dashboardIds)
				{
					dashboardList.push({
						id: Number(restartedDashboardId),
						status: 'L',
					});
				}

				EventEmitter.emit(window, 'BIConnector.Superset.DashboardManager:onDashboardBatchStatusUpdate', {
					dashboardList,
				});
			},
		);
	}

	setDashboardTags(dashboardId: number, tags: {}): Promise
	{
		return Ajax.runAction('biconnector.dashboard.setDashboardTags', {
			data: {
				id: dashboardId,
				tags,
			},
		});
	}

	addTag(title: string): Promise
	{
		return Ajax.runAction('biconnector.dashboardTag.add', {
			data: {
				title,
			},
		});
	}

	static openSettingsSlider(dashboardId: number = null, dashboardType: ?string = null)
	{
		const isCustomDashboard = Type.isStringFilled(dashboardType) && dashboardType === 'CUSTOM';
		let componentLink = '/bitrix/components/bitrix/biconnector.apachesuperset.setting/slider.php';

		const isDashboardSettings = dashboardId !== null;
		if (isDashboardSettings)
		{
			componentLink = isCustomDashboard
				? '/bitrix/components/bitrix/biconnector.apachesuperset.dashboard.edit/slider.php'
				: '/bitrix/components/bitrix/biconnector.apachesuperset.dashboard.setting/slider.php'
			;
		}

		const sliderLink = new Uri(componentLink);
		if (isDashboardSettings)
		{
			if (isCustomDashboard)
			{
				sliderLink.setQueryParam('dashboardId', Text.toNumber(dashboardId));
			}
			else
			{
				sliderLink.setQueryParam('DASHBOARD_ID', Text.toNumber(dashboardId));
			}
		}

		BX.SidePanel.Instance.open(
			sliderLink.toString(),
			{
				width: 790,
				allowChangeHistory: false,
				cacheable: false,
			},
		);
	}

	static openDatasetListSlider()
	{
		BX.SidePanel.Instance.open(
			'/bi/table/',
			{
				cacheable: false,
				allowChangeHistory: true,
				allowChangeTitle: true,
			},
		);
	}

	static installDashboard(dashboardId: number): Promise
	{
		return BX.ajax.runAction('biconnector.dashboard.installDashboard', {
			data: {
				id: dashboardId,
			},
		});
	}

	openCreationSlider(groupIds: number[] = [], dashboardId: number = 0): void
	{
		const componentLink = '/bitrix/components/bitrix/biconnector.apachesuperset.dashboard.edit/slider.php';
		const sliderLink = new Uri(componentLink);
		if (groupIds.length > 0)
		{
			sliderLink.setQueryParam('groupIds', groupIds);
		}

		if (dashboardId > 0)
		{
			sliderLink.setQueryParam('dashboardId', Text.toNumber(dashboardId));
		}

		BX.SidePanel.Instance.open(
			sliderLink.toString(),
			{
				width: 790,
				allowChangeHistory: false,
				cacheable: false,
			},
		);
	}

	showCreationGroupPopup(): void
	{
		this.showGroupSettingsPopup('new_G0');
	}

	getEditUrl(dashboardInfo: DashboardInfo): Promise
	{
		return new Promise((resolve, reject) => {
			Ajax.runAction(
				'biconnector.dashboard.getEditUrl',
				{
					data: {
						id: dashboardInfo.id,
						editUrl: dashboardInfo.editLink,
					},
				},
			)
				.then((response) => {
					const data = response.data;
					if (data)
					{
						resolve(data);
					}
				})
				.catch((e) => {
					reject(e);
				});
		});
	}

	addToTopMenu(dashboardId: number): Promise
	{
		return Ajax.runAction('biconnector.dashboard.addToTopMenu', {
			data: {
				dashboardId,
			},
		});
	}

	deleteFromTopMenu(dashboardId: number): Promise
	{
		return Ajax.runAction('biconnector.dashboard.deleteFromTopMenu', {
			data: {
				dashboardId,
			},
		});
	}

	pin(dashboardId: number): Promise
	{
		return Ajax.runAction('biconnector.dashboard.pin', {
			data: {
				dashboardId,
			},
		});
	}

	unpin(dashboardId: number): Promise
	{
		return Ajax.runAction('biconnector.dashboard.unpin', {
			data: {
				dashboardId,
			},
		});
	}

	getDashboardEmbeddedData(dashboardId: number): Promise
	{
		return BX.ajax.runAction('biconnector.dashboard.getDashboardEmbeddedData', {
			data: {
				id: dashboardId,
			},
		});
	}

	toggleDraft(dashboardId: number, publish: boolean): Promise
	{
		return BX.ajax.runAction('biconnector.dashboard.toggleDraft', {
			data: {
				id: dashboardId,
				publish: publish ? 1 : 0,
			},
		});
	}

	createEventOpenNotInstalledDashboard(dashboardId: number, fallbackUrl: string): void
	{
		this.getDashboardEmbeddedData(dashboardId)
			.then((response) => {
				const dashboard = response.data.dashboard;
				if (dashboard?.embeddedUrl)
				{
					window.open(dashboard.embeddedUrl, '_blank');
				}
				else
				{
					window.open(fallbackUrl, '_blank');
				}
			})
			.catch(() => {
				window.open(fallbackUrl, '_blank');
			});
	}
}
