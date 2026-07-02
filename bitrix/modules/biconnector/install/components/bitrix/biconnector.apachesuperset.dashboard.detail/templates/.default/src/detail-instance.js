import { Dom, Event, Loc, Text, Type } from 'main.core';
import { EventEmitter } from 'main.core.events';
import type { MenuItemOptions } from 'main.popup';
import { Menu, MenuItem } from 'main.popup';
import { Loader } from 'main.loader';
import { DateTimeFormat } from 'main.date';
import type { DetailConfig } from './type/detail-config';
import type { FilterOptions } from './type/filter-options';
import type { DashboardEmbeddedParameters } from './type/dashboard-embedded-parameters';
import { DashboardManager } from 'biconnector.apache-superset-dashboard-manager';
import { ApacheSupersetEmbeddedLoader } from 'biconnector.apache-superset-embedded-loader';
import { ApacheSupersetAnalytics } from 'biconnector.apache-superset-analytics';
import { ApacheSupersetFeedbackForm } from 'biconnector.apache-superset-feedback-form';
import { ChatSelector } from './chat-selector';
import { AhaMoment } from 'biconnector.aha-moment';
import { SharePopup } from 'biconnector.share-popup';
import 'sidepanel';

export class DetailInstance
{
	#dashboardManager: DashboardManager;
	#dashboardNode: HTMLElement;
	#frameNode: HTMLElement;
	#editBtn: HTMLElement;

	#embeddedParams: DashboardEmbeddedParameters;
	#embeddedLoader: ApacheSupersetEmbeddedLoader;
	#embeddedDebugMode: boolean;
	#canExport: boolean;
	#canEdit: boolean;
	#canShare: boolean;
	#shareData: ?Object;

	#moreMenu: Menu;
	#infoAhaMoment: ?AhaMoment;
	#infoAhaMomentOptions: ?Object;
	#dashboardSavedEventName: string;
	#onDashboardSavedHandler: Function;
	#sharePopup: ?SharePopup;

	constructor(config: DetailConfig)
	{
		this.#dashboardNode = document.getElementById(config.appNodeId);
		if (!Type.isDomNode(this.#dashboardNode))
		{
			const errorMsg = `Cannot init superset dashboard. Node with ID ${config.appNodeId} does not exists`;
			throw new Error(errorMsg);
		}
		this.#dashboardManager = new DashboardManager();
		this.#canExport = config.canExport === 'Y';
		this.#canEdit = config.canEdit === 'Y';
		this.#canShare = config.canShare === 'Y';
		this.#shareData = config.shareData ?? null;
		this.#embeddedParams = config.dashboardEmbeddedParams;
		this.#embeddedDebugMode = config.embeddedDebugMode;
		this.#infoAhaMomentOptions = config.infoAhaMoment ?? null;
		this.#dashboardSavedEventName = 'BIConnector.CreateForm:onDashboardSaved';
		this.#onDashboardSavedHandler = this.#onDashboardSaved.bind(this);

		this.#frameNode = this.#dashboardNode.querySelector('.dashboard-iframe');
		this.#subscribeEvents();
		this.#initHeaderButtons();

		if (!BX.BIConnector.LimitLockPopup)
		{
			this.#initFrame(this.#embeddedParams);
		}

		ApacheSupersetAnalytics.sendAnalytics('view', 'report_view', {
			c_element: config.analyticSource,
			status: 'success',
			type: this.#embeddedParams.type.toLowerCase(),
			p1: ApacheSupersetAnalytics.buildAppIdForAnalyticRequest(this.#embeddedParams.appId),
			p2: this.#embeddedParams.id,
			...(config.analyticScope && { p3: ApacheSupersetAnalytics.buildScopeForAnalyticRequest(config.analyticScope) }),
			p4: this.#embeddedParams.isUseExternalDatasets ?? false,
		});
	}

	#subscribeEvents()
	{
		const eventBus = this.#getEventBus();
		if (Type.isFunction(eventBus?.unsubscribe))
		{
			eventBus.unsubscribe(this.#dashboardSavedEventName, this.#onDashboardSavedHandler);
		}

		if (Type.isFunction(eventBus?.subscribe))
		{
			eventBus.subscribe(this.#dashboardSavedEventName, this.#onDashboardSavedHandler);
		}

		EventEmitter.subscribe('BiConnector:DashboardSelector.onSelect', (event) => {
			Dom.clean(this.#frameNode);
			BX.BIConnector.ApacheSuperset.Dashboard.Detail.createSkeleton({
				container: this.#frameNode,
				status: DashboardManager.DASHBOARD_STATUS_LOAD,
			});
		});

		EventEmitter.subscribe('BiConnector:DashboardSelector.onSelectDataLoaded', (event) => {
			Dom.clean(this.#frameNode);
			this.#embeddedParams = event.data.credentials;
			this.#canEdit = this.#embeddedParams.canEdit;
			this.#canExport = this.#embeddedParams.canExport;
			this.#updateTitle(this.#embeddedParams.title);
			this.#canShare = this.#embeddedParams.canShare ?? false;
			this.#shareData = this.#embeddedParams.shareData ?? null;
			this.#sharePopup = null;

			let historyUrl = this.#embeddedParams.embeddedUrl;
			this.#initFrame(this.#embeddedParams);

			ApacheSupersetAnalytics.sendAnalytics('view', 'report_view', {
				c_element: 'selector',
				status: 'success',
				type: this.#embeddedParams.type.toLowerCase(),
				p1: ApacheSupersetAnalytics.buildAppIdForAnalyticRequest(this.#embeddedParams.appId),
				p2: this.#embeddedParams.id,
				p4: this.#embeddedParams.isUseExternalDatasets ?? false,
			});

			top.window.history.pushState(null, '', historyUrl);
			this.#initHeaderButtons();
		});

		EventEmitter.subscribe('BiConnector:LimitPopup.Warning.onClose', (event) => {
			this.#initFrame(this.#embeddedParams);
			this.#initHeaderButtons();
		});

		EventEmitter.subscribe('BX.BIConnector.Settings:onAfterSave', () => {
			this.#reloadGridAfterSliderClose();
		});

		EventEmitter.subscribe('BIConnector.SharePopup:onShareActivated', (event) => {
			if (event.data.dashboardId === this.#embeddedParams.id)
			{
				this.#shareData = {
					...this.#shareData,
					isActive: true,
				};
			}
		});

		EventEmitter.subscribe('BIConnector.SharePopup:onShareDeactivated', (event) => {
			if (event.data.dashboardId === this.#embeddedParams.id)
			{
				this.#shareData = {
					...this.#shareData,
					isActive: false,
				};
			}
		});

		Event.bind(window, 'message', this.#postOptionsForFilter.bind(this));
		Event.bind(window, 'unload', this.#onWindowUnload.bind(this));
	}

	#getEventBus(): Object
	{
		return window.top?.BX?.Event?.EventEmitter ?? EventEmitter;
	}

	#onWindowUnload(): void
	{
		const eventBus = this.#getEventBus();
		if (Type.isFunction(eventBus?.unsubscribe))
		{
			eventBus.unsubscribe(this.#dashboardSavedEventName, this.#onDashboardSavedHandler);
		}
	}

	#onDashboardSaved(event: Object): void
	{
		const rawData = event && Type.isFunction(event.getData) ? event.getData() : null;
		const data = Array.isArray(rawData) ? rawData[0] : rawData;
		const dashboardId = Text.toNumber(data?.dashboard?.id);
		const title = data?.dashboard?.title;
		const isEditMode = data?.isEditMode === true;

		if (!isEditMode || dashboardId <= 0 || dashboardId !== this.#embeddedParams.id || !Type.isStringFilled(title))
		{
			return;
		}

		this.#updateTitle(title);
	}

	#updateTitle(title: string): void
	{
		this.#embeddedParams = {
			...this.#embeddedParams,
			title,
		};

		BX.ajax?.UpdatePageTitle?.(title);
		BX.ajax?.UpdateWindowTitle?.(title);

		const titleNode = this.#dashboardNode.querySelector('#dashboard-selector-text');
		if (Type.isDomNode(titleNode))
		{
			titleNode.textContent = title;
			titleNode.setAttribute('title', title);
		}
	}

	#initFrame(embeddedParams: DashboardEmbeddedParameters)
	{
		if (!embeddedParams.uuid || !embeddedParams.supersetDomain)
		{
			BX.BIConnector.ApacheSuperset.Dashboard.Detail.createSkeleton({
				container: this.#frameNode,
				supersetStatus: 'ERROR',
			});

			return;
		}

		const dashboardParams = {
			id: embeddedParams.uuid, // given by the Superset embedding UI
			supersetDomain: embeddedParams.supersetDomain,
			mountPoint: this.#frameNode, // any html element that can contain an iframe
			fetchGuestToken: embeddedParams.guestToken,
			debug: this.#embeddedDebugMode,
			dashboardUiConfig: { // dashboard UI config: hideTitle, hideTab, ...etc.
				hideTitle: true,
				hideTab: true,
				hideChartControls: true,
				filters: {
					expanded: true,
					visible: true,
					nativeFilters: embeddedParams.nativeFilters,
				},
				urlParams: embeddedParams.urlParams ?? {},
			},
		};

		this.#embeddedLoader = new ApacheSupersetEmbeddedLoader(dashboardParams);
		this.#embeddedLoader.embedDashboard()
			.catch(() => {
				Dom.clean(this.#frameNode);
				BX.BIConnector.ApacheSuperset.Dashboard.Detail.createSkeleton({
					container: this.#frameNode,
					supersetStatus: 'ERROR',
				});
			})
		;
	}

	#initHeaderButtons()
	{
		this.#initMoreMenu();
		this.#initDownloadButton();
		this.#initShareButton();
		this.#initGptButton();
		this.#initInfoButton();

		this.#editBtn = this.#dashboardNode.querySelector('.dashboard-header-buttons-edit');
		Event.unbindAll(this.#editBtn);

		if (this.#canEdit)
		{
			this.#enableEditButton();
			Event.bind(this.#editBtn, 'click', this.#onEditButtonClick.bind(this));
		}
		else
		{
			this.#disableEditButton();
			Event.unbindAll(this.#editBtn);
		}

		if (BX.BIConnector.LimitLockPopup)
		{
			this.#disableEditButton();
			Event.unbindAll(this.#editBtn);
		}
	}

	#initInfoButton()
	{
		const infoButton = this.#dashboardNode.querySelector('.dashboard-header-buttons-info');
		Event.unbindAll(infoButton);

		if (Type.isPlainObject(this.#infoAhaMomentOptions))
		{
			if (!this.#infoAhaMoment)
			{
				this.#infoAhaMoment = new AhaMoment({
					...this.#infoAhaMomentOptions,
					bindElement: infoButton,
				});
			}
			else
			{
				this.#infoAhaMoment.setBindElement(infoButton);
			}

			this.#infoAhaMoment.show();
		}

		Event.bind(infoButton, 'click', () => {
			this.#infoAhaMoment?.close();

			BX.SidePanel.Instance.open(`/bitrix/components/bitrix/biconnector.apachesuperset.dashboard.detail.info/slider.php?dashboard_id=${this.#embeddedParams.id}`, {
				width: 860,
				allowChangeHistory: false,
				cacheable: false,
			});
		});
	}

	#onEditButtonClick()
	{
		this.#muteEditButton();

		const dashboardInfo = {
			id: this.#embeddedParams.id,
			editLink: this.#embeddedParams.editUrl,
			type: this.#embeddedParams.type,
		};

		this.#dashboardManager.processEditDashboard(
			dashboardInfo,
			() => {
				this.#unmuteEditButton();
			},
			(popupType) => {
				ApacheSupersetAnalytics.sendAnalytics('edit', 'report_edit', {
					c_sub_section: popupType,
					c_element: 'detail_button',
					type: this.#embeddedParams.type.toLowerCase(),
					p1: ApacheSupersetAnalytics.buildAppIdForAnalyticRequest(this.#embeddedParams.appId),
					p2: this.#embeddedParams.id,
					status: 'success',
				});
			},
			(popupType) => {
				ApacheSupersetAnalytics.sendAnalytics('edit', 'report_edit', {
					c_sub_section: popupType,
					c_element: 'detail_button',
					type: this.#embeddedParams.type.toLowerCase(),
					p1: ApacheSupersetAnalytics.buildAppIdForAnalyticRequest(this.#embeddedParams.appId),
					p2: this.#embeddedParams.id,
					status: 'error',
				});
			},
		);

		this.#reloadGridAfterSliderClose();
	}

	#reloadGridAfterSliderClose()
	{
		const slider = BX.SidePanel.Instance.getSliderByWindow(window);
		if (slider)
		{
			EventEmitter.subscribeOnce(slider, 'SidePanel.Slider:onClose', () => {
				if (!top.BX.Main || !top.BX.Main.gridManager)
				{
					return;
				}

				top.BX.Main.gridManager.data.forEach((grid) => {
					if (grid.instance.getId() === 'biconnector_superset_dashboard_grid')
					{
						grid.instance.reload();
					}
				});
			});
		}
	}

	#muteEditButton()
	{
		this.#disableEditButton();
		Dom.addClass(this.#editBtn, 'ui-btn-wait');
	}

	#unmuteEditButton()
	{
		this.#enableEditButton();
		Dom.removeClass(this.#editBtn, 'ui-btn-wait');
	}

	#disableEditButton()
	{
		this.#editBtn.setAttribute('disabled', 'true');
	}

	#enableEditButton()
	{
		this.#editBtn.removeAttribute('disabled');
	}

	// eslint-disable-next-line max-lines-per-function
	#initDownloadButton(): void
	{
		const downloadButton = this.#dashboardNode.querySelector('.dashboard-header-buttons-download');
		Event.unbindAll(downloadButton);
		const downloadMenu = new Menu({
			closeByEsc: false,
			closeIcon: false,
			cacheable: true,
			angle: {
				position: 'top',
			},
			bindElement: this.#getRectForButtonArrow(downloadButton),
			autoHide: true,
			items: [
				{
					id: 'download-screenshot',
					text: Loc.getMessage('SUPERSET_DASHBOARD_DETAIL_DOWNLOAD_IMAGE'),
					title: Loc.getMessage('SUPERSET_DASHBOARD_DETAIL_DOWNLOAD_IMAGE'),
					onclick: (event, menuItem) => {
						menuItem.disable();
						const loader = new Loader({
							target: menuItem.layout.item,
							size: 30,
						});
						loader.show();
						this.#embeddedLoader.getScreenshot()
							.then((imageData: string) => {
								const dashboardTitle = Text.decode(this.#embeddedParams.title);
								const datetime = DateTimeFormat.format('Y-m-d H-i-s');
								this.#downloadFile(
									imageData.replace('data:image/jpeg;base64,', ''),
									`${dashboardTitle} ${datetime}.jpeg`,
									'image/jpeg',
								);
								menuItem.enable();
								loader.hide();
								ApacheSupersetAnalytics.sendAnalytics('download', 'dashboard_download', {
									status: 'success',
									type: this.#embeddedParams.type.toLowerCase(),
									p1: ApacheSupersetAnalytics.buildAppIdForAnalyticRequest(this.#embeddedParams.appId),
									p2: this.#embeddedParams.id,
									p3: 'ext_jpeg',
								});
							})
							.catch(() => {
								menuItem.enable();
								loader.hide();
								BX.UI.Notification.Center.notify({
									content: Loc.getMessage('SUPERSET_DASHBOARD_DETAIL_DOWNLOAD_ERROR'),
								});
								ApacheSupersetAnalytics.sendAnalytics('download', 'dashboard_download', {
									status: 'error',
									type: this.#embeddedParams.type.toLowerCase(),
									p1: ApacheSupersetAnalytics.buildAppIdForAnalyticRequest(this.#embeddedParams.appId),
									p2: this.#embeddedParams.id,
									p3: 'ext_jpeg',
								});
							})
						;
					},
				},
				{
					id: 'download-pdf',
					text: Loc.getMessage('SUPERSET_DASHBOARD_DETAIL_DOWNLOAD_PDF'),
					title: Loc.getMessage('SUPERSET_DASHBOARD_DETAIL_DOWNLOAD_PDF'),
					onclick: (event, menuItem) => {
						menuItem.disable();
						const loader = new Loader({
							target: menuItem.layout.item,
							size: 30,
						});
						loader.show();
						this.#embeddedLoader.getPdf()
							.then((imageData: string) => {
								const dashboardTitle = Text.decode(this.#embeddedParams.title);
								const datetime = DateTimeFormat.format('Y-m-d H-i-s');
								this.#downloadFile(
									imageData,
									`${dashboardTitle} ${datetime}.pdf`,
									'application/pdf',
								);
								menuItem.enable();
								loader.hide();
								ApacheSupersetAnalytics.sendAnalytics('download', 'dashboard_download', {
									status: 'success',
									type: this.#embeddedParams.type.toLowerCase(),
									p1: ApacheSupersetAnalytics.buildAppIdForAnalyticRequest(this.#embeddedParams.appId),
									p2: this.#embeddedParams.id,
									p3: 'ext_pdf',
								});
							})
							.catch(() => {
								menuItem.enable();
								loader.hide();
								BX.UI.Notification.Center.notify({
									content: Loc.getMessage('SUPERSET_DASHBOARD_DETAIL_DOWNLOAD_ERROR'),
								});
								ApacheSupersetAnalytics.sendAnalytics('download', 'dashboard_download', {
									status: 'error',
									type: this.#embeddedParams.type.toLowerCase(),
									p1: ApacheSupersetAnalytics.buildAppIdForAnalyticRequest(this.#embeddedParams.appId),
									p2: this.#embeddedParams.id,
									p3: 'ext_pdf',
								});
							})
						;
					},
				},
			],
		});

		Event.bind(downloadButton, 'click', () => {
			downloadMenu.show();
			ApacheSupersetAnalytics.sendAnalytics('download', 'click_download', {
				type: this.#embeddedParams.type.toLowerCase(),
			});
		});
	}

	#initShareButton()
	{
		const shareButton = this.#dashboardNode.querySelector('.dashboard-header-buttons-share');
		if (!shareButton)
		{
			return;
		}

		Event.unbindAll(shareButton);

		const menuItems = [];

		if (this.#canShare)
		{
			menuItems.push({
				id: 'share-link',
				text: Loc.getMessage('SUPERSET_DASHBOARD_DETAIL_SHARE_LINK'),
				title: Loc.getMessage('SUPERSET_DASHBOARD_DETAIL_SHARE_LINK'),
				onclick: (event, menuItem: MenuItem) => {
					menuItem.menuWindow.close();
					this.#showSharePopup();
				},
			});
		}

		menuItems.push(
			{
				id: 'share-screenshot',
				text: Loc.getMessage('SUPERSET_DASHBOARD_DETAIL_SHARE_TO_CHAT_IMAGE'),
				title: Loc.getMessage('SUPERSET_DASHBOARD_DETAIL_SHARE_TO_CHAT_IMAGE'),
				onclick: (event, menuItem: MenuItem) => {
					menuItem.menuWindow.close();
					const moreButton = this.#dashboardNode.querySelector('.dashboard-header-buttons-more');
					const selector: ChatSelector = new ChatSelector({
						targetNode: moreButton,
						dashboardName: Text.decode(this.#embeddedParams.title),
						fileExtension: 'jpeg',
						onSend: () => this.#embeddedLoader.getScreenshot(),
						dashboardId: this.#embeddedParams.id,
						dashboardType: this.#embeddedParams.type.toLowerCase(),
						appId: this.#embeddedParams.appId,
					});
					selector.show();
					ApacheSupersetAnalytics.sendAnalytics('share', 'open_selector', {
						p3: 'ext_jpeg',
					});
				},
			},
			{
				id: 'share-pdf',
				text: Loc.getMessage('SUPERSET_DASHBOARD_DETAIL_SHARE_TO_CHAT_PDF'),
				title: Loc.getMessage('SUPERSET_DASHBOARD_DETAIL_SHARE_TO_CHAT_PDF'),
				onclick: (event, menuItem: MenuItem) => {
					menuItem.menuWindow.close();
					const moreButton = this.#dashboardNode.querySelector('.dashboard-header-buttons-more');
					const selector: ChatSelector = new ChatSelector({
						targetNode: moreButton,
						dashboardName: Text.decode(this.#embeddedParams.title),
						fileExtension: 'pdf',
						onSend: () => this.#embeddedLoader.getPdf(),
						dashboardId: this.#embeddedParams.id,
						dashboardType: this.#embeddedParams.type.toLowerCase(),
						appId: this.#embeddedParams.appId,
					});
					selector.show();
					ApacheSupersetAnalytics.sendAnalytics('share', 'open_selector', {
						p3: 'ext_pdf',
					});
				},
			},
		);

		const shareMenu = new Menu({
			closeByEsc: false,
			closeIcon: false,
			cacheable: true,
			angle: {
				position: 'top',
			},
			bindElement: this.#getRectForButtonArrow(shareButton),
			autoHide: true,
			items: menuItems,
		});

		Event.bind(shareButton, 'click', () => {
			shareMenu.show();
			ApacheSupersetAnalytics.sendAnalytics('share', 'click_share', {
				type: this.#embeddedParams.type.toLowerCase(),
			});
		});
	}

	#showSharePopup()
	{
		if (!this.#sharePopup)
		{
			this.#sharePopup = new SharePopup({
				dashboardId: this.#embeddedParams.id,
				dashboardTitle: this.#embeddedParams.title ?? '',
				embeddedLoader: this.#embeddedLoader,
				initialShareData: this.#shareData,
				urlParams: this.#embeddedParams.urlParams ?? null,
				type: (this.#embeddedParams.type ?? '').toLowerCase(),
				analyticsElement: 'detail_button',
			});
		}

		this.#sharePopup.show();
	}

	#initMoreMenu()
	{
		const moreButton = this.#dashboardNode.querySelector('.dashboard-header-buttons-more');
		if (this.#moreMenu)
		{
			Event.unbindAll(moreButton);
		}

		this.#moreMenu = new Menu({
			closeByEsc: false,
			closeIcon: false,
			cacheable: true,
			angle: {
				position: 'top',
				offset: 43,
			},
			items: this.#getMoreMenuItems(),
			toFrontOnShow: true,
			autoHide: true,
			bindElement: moreButton,
			className: 'more-popup',
			events: {
				onBeforeClose: () => {
					this.#moreMenu.getMenuItems().forEach((menuItem) => {
						menuItem.closeSubMenu();
					});
				},
				onAfterShow: () => {
					const popupContainer = this.#getMoreMenu().getPopupWindow().getPopupContainer();
					const overHeight = popupContainer.getBoundingClientRect().top + popupContainer.offsetHeight;

					if (overHeight > window.innerHeight)
					{
						window.scrollTo({
							top: window.scrollY + (-window.innerHeight + overHeight),
							behavior: 'smooth',
						});
					}
				},
			},
		});

		Event.bind(moreButton, 'click', () => this.#moreMenu.show());
	}

	// eslint-disable-next-line max-lines-per-function
	#getMoreMenuItems(): MenuItemOptions[]
	{
		const result = [
			{
				id: 'order_dashboard',
				text: Loc.getMessage('SUPERSET_DASHBOARD_DETAIL_MORE_MENU_ORDER_DASHBOARD'),
				title: Loc.getMessage('SUPERSET_DASHBOARD_DETAIL_MORE_MENU_ORDER_DASHBOARD'),
				onclick: () => {
					ApacheSupersetFeedbackForm.requestIntegrationFormOpen();
				},
			},
			{
				id: 'feedback',
				text: Loc.getMessage('SUPERSET_DASHBOARD_DETAIL_MORE_MENU_FEEDBACK'),
				title: Loc.getMessage('SUPERSET_DASHBOARD_DETAIL_MORE_MENU_FEEDBACK'),
				onclick: () => {
					ApacheSupersetFeedbackForm.feedbackFormOpen();
				},
			},
		];

		if (this.#canExport)
		{
			result.push({
				id: 'export',
				text: Loc.getMessage('SUPERSET_DASHBOARD_DETAIL_MORE_MENU_EXPORT'),
				title: Loc.getMessage('SUPERSET_DASHBOARD_DETAIL_MORE_MENU_EXPORT'),
				onclick: () => {
					this.#moreMenu.getMenuItem('export').disable();
					this.#dashboardManager.exportDashboard(this.#embeddedParams.id, 'detail_button')
						.finally(() => {
							this.#moreMenu.getMenuItem('export').enable();
						})
						.catch(() => {})
					;
				},
			});
		}

		return result;
	}

	#downloadFile(base64Data: string, fileName: string, fileType: string): void
	{
		const byteCharacters = atob(base64Data);
		const byteNumbers = Array.from({ length: byteCharacters.length });
		for (let i = 0; i < byteCharacters.length; i++)
		{
			byteNumbers[i] = byteCharacters.codePointAt(i);
		}

		const byteArray = new Uint8Array(byteNumbers);
		const blob = new Blob([byteArray], { type: fileType });
		const link = document.createElement('a');
		link.href = window.URL.createObjectURL(blob);
		link.download = fileName;
		Dom.append(link, document.body);
		link.click();
		Dom.remove(link);
	}

	#getMoreMenu(): Menu
	{
		return this.#moreMenu;
	}

	#initGptButton(): void
	{
		const gptBtn = this.#dashboardNode.querySelector('#bitrixgpt-btn');
		if (!gptBtn)
		{
			return;
		}

		Event.unbindAll(gptBtn);
		Event.bind(gptBtn, 'click', this.#onGptButtonClick.bind(this));
	}

	// Scaffold for the BitrixGPT button. The previous wiring talked to
	// `Controller\Superset::loadDashboardDataAction`, which dispatched to
	// `/data` in bx-superset; both layers were removed when /meta absorbed
	// the drill-down path (`chart_ids` parameter). The next iteration will
	// hand the dashboard off through the MCP tool set instead — keeping the
	// click handler + #showGptResult panel here as scaffolding so we don't
	// re-author them from scratch.
	async #onGptButtonClick(): Promise<void>
	{
		/*
		const gptBtn = this.#dashboardNode.querySelector('#bitrixgpt-btn');
		Dom.addClass(gptBtn, 'ui-btn-wait');

		try
		{
			const appliedFilters = await this.#embeddedLoader.getAppliedFilters();

			const response = await BX.ajax.runAction('biconnector.superset.loadDashboardData', {
				data: {
					dashboardId: this.#embeddedParams.id,
					appliedFilters: JSON.stringify(appliedFilters),
				},
			});

			this.#showGptResult(response.data);
		}
		catch (error)
		{
			console.error('BitrixGPT load failed:', error);
		}
		finally
		{
			Dom.removeClass(gptBtn, 'ui-btn-wait');
		}
		*/
	}

	#showGptResult(data: Object): void
	{
		let panel = this.#dashboardNode.querySelector('.dashboard-gpt-panel');
		if (!panel)
		{
			panel = Dom.create('div', {
				attrs: { className: 'dashboard-gpt-panel' },
				style: {
					position: 'fixed',
					right: '0',
					top: '0',
					width: '400px',
					height: '100vh',
					backgroundColor: '#fff',
					borderLeft: '1px solid #e0e0e0',
					zIndex: '1000',
					overflow: 'auto',
					padding: '20px',
					boxShadow: '-2px 0 8px rgba(0,0,0,0.1)',
				},
			});

			const closeBtn = Dom.create('div', {
				attrs: { className: 'ui-icon-set --cross-60' },
				style: { cursor: 'pointer', float: 'right' },
				events: {
					click: () => Dom.remove(panel),
				},
			});

			panel.appendChild(closeBtn);
			this.#dashboardNode.appendChild(panel);
		}

		const content = panel.querySelector('.dashboard-gpt-panel-content')
			|| Dom.create('div', { attrs: { className: 'dashboard-gpt-panel-content' } });

		if (!content.parentNode)
		{
			panel.appendChild(content);
		}

		const pre = Dom.create('pre', {
			style: {
				whiteSpace: 'pre-wrap',
				wordBreak: 'break-word',
				fontSize: '12px',
				lineHeight: '1.4',
			},
			text: JSON.stringify(data, null, 2),
		});

		content.innerHTML = '';
		content.appendChild(pre);
	}

	#postOptionsForFilter(event): void
	{
		if (event.origin === this.#embeddedParams.supersetDomain)
		{
			const { type, filterId } = event.data;

			if (type === 'superset-filter-request-options' && filterId)
			{
				event.source.postMessage({
					type: 'superset-filter-options',
					filterId,
					options: this.#getOptionsForFilter(filterId),
				}, event.origin);
			}
		}
	}

	#getOptionsForFilter(filterId): FilterOptions[]
	{
		return this.#embeddedParams.filters[filterId] || [];
	}

	#getRectForButtonArrow(button: HTMLElement): Object
	{
		const buttonRect = button.getBoundingClientRect();

		const buttonStyle = window.getComputedStyle(button);
		const paddingRight = parseFloat(buttonStyle.paddingRight) || 0;

		const arrowStyle = window.getComputedStyle(button, '::after');
		const arrowWidth = parseFloat(arrowStyle.width) || 0;

		const arrowCenterX = buttonRect.right - (paddingRight + arrowWidth / 2);

		return {
			top: buttonRect.top,
			bottom: buttonRect.bottom,
			left: arrowCenterX,
			right: arrowCenterX,
		};
	}
}
