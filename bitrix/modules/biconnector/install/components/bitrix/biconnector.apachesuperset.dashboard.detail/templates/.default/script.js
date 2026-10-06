/* eslint-disable */
this.BX = this.BX || {};
this.BX.BIConnector = this.BX.BIConnector || {};
this.BX.BIConnector.ApacheSuperset = this.BX.BIConnector.ApacheSuperset || {};
(function (exports, main_core, main_core_events, main_popup, main_loader, main_date, biconnector_apacheSupersetDashboardManager, biconnector_apacheSupersetEmbeddedLoader, biconnector_apacheSupersetAnalytics, biconnector_apacheSupersetFeedbackForm, ui_entitySelector, biconnector_ahaMoment, biconnector_sharePopup, sidepanel, ui_iconSet_outline, ui_lottie, biconnector_apacheSupersetDashboardSkeleton) {
	'use strict';

	class ChatSelector {
		#props;
		#dialog;
		#sendInProgress = false;
		constructor(props) {
			this.#props = props;
			this.#initDialog();
		}
		show() {
			this.#dialog.show();
		}
		#initDialog() {
			this.#dialog = new ui_entitySelector.Dialog({
				id: 'biconnector-chat-selector',
				multiple: true,
				targetNode: this.#props.targetNode,
				offsetTop: 14,
				context: 'biconnector-chat-selector',
				popupOptions: {
					className: 'biconnector-chat-selector'
				},
				entities: this.#getSelectorEntities(),
				header: this.#getHeader(),
				footer: this.#getFooter(),
				footerOptions: {
					containerClass: 'ui-selector-footer-default biconnector-send-to-chat-footer-wrapper'
				},
				enableSearch: true,
				dropdownMode: true,
				showAvatars: true,
				compactView: true,
				dynamicLoad: true,
				events: {
					'Item:onBeforeSelect': event => {
						const dialog = event.getTarget();
						dialog.deselectAll();
					}
				}
			});
		}
		#handleOnFooterLinkClick() {
			const item = this.#dialog.selectedItems.values()?.next()?.value;
			if (!(item instanceof ui_entitySelector.Item)) {
				return;
			}
			if (!main_core.Type.isFunction(this.#props.onSend)) {
				return;
			}
			if (this.#sendInProgress) {
				return;
			}
			this.#dialog.showLoader();
			const notificationStack = new BX.UI.Notification.Stack({
				id: 'send-dashboard',
				offsetX: 20,
				offsetY: 80
			});
			this.#sendInProgress = true;
			this.#props.onSend().then(response => {
				return main_core.ajax.runComponentAction('bitrix:biconnector.apachesuperset.dashboard.detail', 'sendDashboardToChat', {
					mode: 'ajax',
					data: {
						dialogId: item.id,
						content: response,
						dashboardName: this.#props.dashboardName,
						fileExtension: this.#props.fileExtension
					}
				});
			}).then(() => {
				this.#dialog.hideLoader();
				this.#dialog.hide();
				BX.UI.Notification.Center.notify({
					content: main_core.Loc.getMessage('SUPERSET_DASHBOARD_DETAIL_SHARE_SUCCESS'),
					stack: notificationStack,
					autoHideDelay: 3000
				});
				biconnector_apacheSupersetAnalytics.ApacheSupersetAnalytics.sendAnalytics('share', 'dashboard_share', {
					status: 'success',
					type: this.#props.dashboardType,
					p1: biconnector_apacheSupersetAnalytics.ApacheSupersetAnalytics.buildAppIdForAnalyticRequest(this.#props.appId),
					p2: this.#props.dashboardId,
					p3: `ext_${this.#props.fileExtension}`
				});
				this.#sendInProgress = false;
			}).catch(response => {
				this.#dialog.hideLoader();
				console.error(response);
				BX.UI.Notification.Center.notify({
					content: response.errors[0].message,
					stack: notificationStack
				});
				biconnector_apacheSupersetAnalytics.ApacheSupersetAnalytics.sendAnalytics('share', 'dashboard_share', {
					status: 'error',
					type: this.#props.dashboardType,
					p1: biconnector_apacheSupersetAnalytics.ApacheSupersetAnalytics.buildAppIdForAnalyticRequest(this.#props.appId),
					p2: this.#props.dashboardId,
					p3: `ext_${this.#props.fileExtension}`
				});
				this.#sendInProgress = false;
			});
		}
		#getHeader() {
			return main_core.Tag.render`
			<span class="biconnector-send-to-chat-header">
				${main_core.Loc.getMessage('SUPERSET_DASHBOARD_DETAIL_SHARE_RECEIVER')}
			</span>
		`;
		}
		#getFooter() {
			return [main_core.Tag.render`
				<div class="biconnector-send-to-chat-footer" onclick="${this.#handleOnFooterLinkClick.bind(this)}">
					<span class="ui-icon-set --send" style="--ui-icon-set__icon-size: 32px; --ui-icon-set__icon-color: #2FC6F6; margin-right: 10px;">
					</span>
					<span class="biconnector-send-to-chat-footer-text">
						${main_core.Loc.getMessage('SUPERSET_DASHBOARD_DETAIL_SHARE_SEND')}
					</span>
				</div>
			`];
		}
		#getSelectorEntities() {
			return [{
				id: 'im-chat',
				options: {
					searchableChatTypes: ['C', 'L', 'O'],
					fillDialog: false
				}
			}, {
				id: 'user',
				options: {
					fillDialog: false
				},
				filters: [{
					id: 'im.userDataFilter'
				}]
			}, {
				id: 'im-recent',
				options: {
					limit: 100
				}
			}];
		}
	}

	const COMPACT_HEADER_CLASS = 'dashboard-header--compact';
	const MEASURING_HEADER_CLASS = 'dashboard-header--measuring';
	const HEADER_FIT_SAFETY = 8;
	class DetailInstance {
		#dashboardManager;
		#dashboardNode;
		#frameNode;
		#embeddedParams;
		#embeddedLoader;
		#embeddedDebugMode;
		#canExport;
		#canEdit;
		#canShare;
		#shareData;
		#moreMenu;
		#infoAhaMoment;
		#infoAhaMomentOptions;
		#dashboardSavedEventName;
		#onDashboardSavedHandler;
		#sharePopup;
		#compactHintAbort;
		#headerNode;
		#headerTitleText;
		#headerButtons;
		#headerChromeWidth = 0;
		#buttonsExpandedWidth = 0;
		#headerResizeObserver;
		#headerTitleObserver;
		constructor(config) {
			this.#dashboardNode = document.getElementById(config.appNodeId);
			if (!main_core.Type.isDomNode(this.#dashboardNode)) {
				const errorMsg = `Cannot init superset dashboard. Node with ID ${config.appNodeId} does not exists`;
				throw new Error(errorMsg);
			}
			this.#dashboardManager = new biconnector_apacheSupersetDashboardManager.DashboardManager();
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
			if (!BX.BIConnector.LimitLockPopup) {
				this.#initFrame(this.#embeddedParams);
			}
			biconnector_apacheSupersetAnalytics.ApacheSupersetAnalytics.sendAnalytics('view', 'report_view', {
				c_element: config.analyticSource,
				status: 'success',
				type: this.#embeddedParams.type.toLowerCase(),
				p1: biconnector_apacheSupersetAnalytics.ApacheSupersetAnalytics.buildAppIdForAnalyticRequest(this.#embeddedParams.appId),
				p2: this.#embeddedParams.id,
				...(config.analyticScope && {
					p3: biconnector_apacheSupersetAnalytics.ApacheSupersetAnalytics.buildScopeForAnalyticRequest(config.analyticScope)
				}),
				p4: this.#embeddedParams.isUseExternalDatasets ?? false
			});
		}
		#subscribeEvents() {
			const eventBus = this.#getEventBus();
			if (main_core.Type.isFunction(eventBus?.unsubscribe)) {
				eventBus.unsubscribe(this.#dashboardSavedEventName, this.#onDashboardSavedHandler);
			}
			if (main_core.Type.isFunction(eventBus?.subscribe)) {
				eventBus.subscribe(this.#dashboardSavedEventName, this.#onDashboardSavedHandler);
			}
			main_core_events.EventEmitter.subscribe('BiConnector:DashboardSelector.onSelect', event => {
				main_core.Dom.clean(this.#frameNode);
				BX.BIConnector.ApacheSuperset.Dashboard.Detail.createSkeleton({
					container: this.#frameNode,
					status: biconnector_apacheSupersetDashboardManager.DashboardManager.DASHBOARD_STATUS_LOAD
				});
			});
			main_core_events.EventEmitter.subscribe('BiConnector:DashboardSelector.onSelectDataLoaded', event => {
				main_core.Dom.clean(this.#frameNode);
				this.#embeddedParams = event.data.credentials;
				this.#canEdit = this.#embeddedParams.canEdit;
				this.#canExport = this.#embeddedParams.canExport;
				this.#updateTitle(this.#embeddedParams.title);
				this.#canShare = this.#embeddedParams.canShare ?? false;
				this.#shareData = this.#embeddedParams.shareData ?? null;
				this.#sharePopup = null;
				let historyUrl = this.#embeddedParams.embeddedUrl;
				this.#initFrame(this.#embeddedParams);
				biconnector_apacheSupersetAnalytics.ApacheSupersetAnalytics.sendAnalytics('view', 'report_view', {
					c_element: 'selector',
					status: 'success',
					type: this.#embeddedParams.type.toLowerCase(),
					p1: biconnector_apacheSupersetAnalytics.ApacheSupersetAnalytics.buildAppIdForAnalyticRequest(this.#embeddedParams.appId),
					p2: this.#embeddedParams.id,
					p4: this.#embeddedParams.isUseExternalDatasets ?? false
				});
				top.window.history.pushState(null, '', historyUrl);
				this.#initHeaderButtons();
			});
			main_core_events.EventEmitter.subscribe('BiConnector:LimitPopup.Warning.onClose', event => {
				this.#initFrame(this.#embeddedParams);
				this.#initHeaderButtons();
			});
			main_core_events.EventEmitter.subscribe('BX.BIConnector.Settings:onAfterSave', () => {
				this.#reloadGridAfterSliderClose();
			});
			main_core_events.EventEmitter.subscribe('BIConnector.SharePopup:onShareActivated', event => {
				if (event.data.dashboardId === this.#embeddedParams.id) {
					this.#shareData = {
						...this.#shareData,
						isActive: true
					};
				}
			});
			main_core_events.EventEmitter.subscribe('BIConnector.SharePopup:onShareDeactivated', event => {
				if (event.data.dashboardId === this.#embeddedParams.id) {
					this.#shareData = {
						...this.#shareData,
						isActive: false
					};
				}
			});
			main_core.Event.bind(window, 'message', this.#postOptionsForFilter.bind(this));
			main_core.Event.bind(window, 'unload', this.#onWindowUnload.bind(this));
		}
		#getEventBus() {
			return window.top?.BX?.Event?.EventEmitter ?? main_core_events.EventEmitter;
		}
		#onWindowUnload() {
			const eventBus = this.#getEventBus();
			if (main_core.Type.isFunction(eventBus?.unsubscribe)) {
				eventBus.unsubscribe(this.#dashboardSavedEventName, this.#onDashboardSavedHandler);
			}
		}
		#onDashboardSaved(event) {
			const rawData = event && main_core.Type.isFunction(event.getData) ? event.getData() : null;
			const data = Array.isArray(rawData) ? rawData[0] : rawData;
			const dashboardId = main_core.Text.toNumber(data?.dashboard?.id);
			const title = data?.dashboard?.title;
			const isEditMode = data?.isEditMode === true;
			if (!isEditMode || dashboardId <= 0 || dashboardId !== this.#embeddedParams.id || !main_core.Type.isStringFilled(title)) {
				return;
			}
			this.#updateTitle(title);
		}
		#updateTitle(title) {
			this.#embeddedParams = {
				...this.#embeddedParams,
				title
			};
			BX.ajax?.UpdatePageTitle?.(title);
			BX.ajax?.UpdateWindowTitle?.(title);
			const titleNode = this.#dashboardNode.querySelector('#dashboard-selector-text');
			if (main_core.Type.isDomNode(titleNode)) {
				titleNode.textContent = title;
				titleNode.setAttribute('title', title);
			}
		}
		#initFrame(embeddedParams) {
			if (!embeddedParams.uuid || !embeddedParams.supersetDomain) {
				BX.BIConnector.ApacheSuperset.Dashboard.Detail.createSkeleton({
					container: this.#frameNode,
					supersetStatus: 'ERROR'
				});
				return;
			}
			const dashboardParams = {
				id: embeddedParams.uuid,
				// given by the Superset embedding UI
				supersetDomain: embeddedParams.supersetDomain,
				mountPoint: this.#frameNode,
				// any html element that can contain an iframe
				fetchGuestToken: embeddedParams.guestToken,
				debug: this.#embeddedDebugMode,
				dashboardUiConfig: {
					// dashboard UI config: hideTitle, hideTab, ...etc.
					hideTitle: true,
					hideTab: true,
					hideChartControls: true,
					filters: {
						expanded: true,
						visible: true,
						nativeFilters: embeddedParams.nativeFilters
					},
					urlParams: embeddedParams.urlParams ?? {}
				}
			};
			this.#embeddedLoader = new biconnector_apacheSupersetEmbeddedLoader.ApacheSupersetEmbeddedLoader(dashboardParams);
			this.#embeddedLoader.embedDashboard().catch(() => {
				main_core.Dom.clean(this.#frameNode);
				BX.BIConnector.ApacheSuperset.Dashboard.Detail.createSkeleton({
					container: this.#frameNode,
					supersetStatus: 'ERROR'
				});
			});
		}
		#initHeaderButtons() {
			this.#initMoreMenu();
			this.#initShareButton();
			this.#initInfoButton();
			this.#initAdaptiveHeader();
			this.#initCompactHints();
		}
		#initAdaptiveHeader() {
			const header = this.#dashboardNode.querySelector('.dashboard-header');
			const titleSection = this.#dashboardNode.querySelector('.dashboard-header-title-section');
			const titleText = this.#dashboardNode.querySelector('#dashboard-selector-text');
			const selector = this.#dashboardNode.querySelector('#dashboard-selector');
			const buttons = this.#dashboardNode.querySelector('.dashboard-header-buttons');
			if (!header || !titleSection || !titleText || !selector || !buttons) {
				return;
			}
			this.#headerResizeObserver?.disconnect();
			this.#headerTitleObserver?.disconnect();
			this.#headerNode = header;
			this.#headerTitleText = titleText;
			this.#headerButtons = buttons;
			this.#measureHeaderMetrics(titleSection, selector);
			this.#evaluateHeaderCompact();
			this.#headerResizeObserver = new ResizeObserver(() => this.#evaluateHeaderCompact());
			this.#headerResizeObserver.observe(header);
			this.#headerTitleObserver = new MutationObserver(() => this.#evaluateHeaderCompact());
			this.#headerTitleObserver.observe(titleText, {
				characterData: true,
				childList: true,
				subtree: true
			});
			if (document.fonts && document.fonts.ready) {
				document.fonts.ready.then(() => {
					if (!this.#headerNode) {
						return;
					}
					this.#measureHeaderMetrics(titleSection, selector);
					this.#evaluateHeaderCompact();
				});
			}
		}
		#measureHeaderMetrics(titleSection, selector) {
			const outer = (el, ...sides) => {
				if (!el) {
					return 0;
				}
				const cs = window.getComputedStyle(el);
				return el.getBoundingClientRect().width + sides.reduce((sum, side) => sum + (parseFloat(cs[side]) || 0), 0);
			};
			this.#headerNode.classList.add(MEASURING_HEADER_CLASS);
			const logoOuter = outer(titleSection.querySelector('.dashboard-header-logo'), 'marginRight');
			const chevronOuter = outer(selector.querySelector('.dashboard-header-selector-icon'), 'marginLeft', 'marginRight');
			this.#headerChromeWidth = logoOuter + chevronOuter + HEADER_FIT_SAFETY;
			this.#buttonsExpandedWidth = this.#headerButtons.getBoundingClientRect().width;
			this.#headerNode.classList.remove(MEASURING_HEADER_CLASS);
		}
		#evaluateHeaderCompact() {
			if (!this.#headerNode || !this.#headerTitleText) {
				return;
			}
			const needed = this.#headerChromeWidth + this.#headerTitleText.scrollWidth + this.#buttonsExpandedWidth;
			this.#headerNode.classList.toggle(COMPACT_HEADER_CLASS, needed > this.#headerNode.clientWidth);
		}
		#initCompactHints() {
			if (this.#compactHintAbort) {
				this.#compactHintAbort.abort();
			}
			this.#compactHintAbort = new AbortController();
			const {
				signal
			} = this.#compactHintAbort;
			let hintAnchor = null;
			const hide = () => {
				if (hintAnchor && BX?.UI?.Hint && main_core.Type.isFunction(BX.UI.Hint.hide)) {
					BX.UI.Hint.hide(hintAnchor);
					hintAnchor = null;
				}
			};
			const buttons = this.#dashboardNode.querySelectorAll('.dashboard-header-buttons [data-compact-hint]');
			buttons.forEach(button => {
				const label = button.querySelector('.dashboard-header-button-label');
				const hintText = button.getAttribute('data-compact-hint') || '';
				button.addEventListener('mouseenter', () => {
					if (!hintText || label && label.offsetWidth > 0) {
						return;
					}
					if (!BX?.UI?.Hint || !main_core.Type.isFunction(BX.UI.Hint.show)) {
						return;
					}
					hintAnchor = button;
					BX.UI.Hint.show(button, hintText, false, false);
				}, {
					signal
				});
				button.addEventListener('mouseleave', hide, {
					signal
				});
				button.addEventListener('click', hide, {
					signal
				});
			});
		}
		#alignMenuPopupToArrow(button, popup) {
			if (!popup || !main_core.Type.isFunction(popup.adjustPosition)) {
				return;
			}
			const buttonStyle = window.getComputedStyle(button);
			const paddingRight = parseFloat(buttonStyle.paddingRight) || 0;
			const dropdownArrowStyle = window.getComputedStyle(button, '::after');
			const dropdownArrowWidth = parseFloat(dropdownArrowStyle.width) || 8;
			const dropdownArrowCenter = button.offsetWidth - paddingRight - dropdownArrowWidth / 2;
			popup.setOffset({
				offsetLeft: Math.round(dropdownArrowCenter),
				offsetTop: 0
			});
			popup.bindOptions.forceBindPosition = true;
			popup.adjustPosition();
		}
		#initInfoButton() {
			const infoButton = this.#dashboardNode.querySelector('.dashboard-header-buttons-info');
			main_core.Event.unbindAll(infoButton);
			if (main_core.Type.isPlainObject(this.#infoAhaMomentOptions)) {
				if (!this.#infoAhaMoment) {
					this.#infoAhaMoment = new biconnector_ahaMoment.AhaMoment({
						...this.#infoAhaMomentOptions,
						bindElement: infoButton
					});
				} else {
					this.#infoAhaMoment.setBindElement(infoButton);
				}
				this.#infoAhaMoment.show();
			}
			main_core.Event.bind(infoButton, 'click', () => {
				this.#infoAhaMoment?.close();
				BX.SidePanel.Instance.open(`/bitrix/components/bitrix/biconnector.apachesuperset.dashboard.detail.info/slider.php?dashboard_id=${this.#embeddedParams.id}`, {
					width: 860,
					allowChangeHistory: false,
					cacheable: false
				});
			});
		}
		#onEditButtonClick() {
			const dashboardInfo = {
				id: this.#embeddedParams.id,
				editLink: this.#embeddedParams.editUrl,
				type: this.#embeddedParams.type
			};
			this.#dashboardManager.processEditDashboard(dashboardInfo, () => {}, popupType => {
				biconnector_apacheSupersetAnalytics.ApacheSupersetAnalytics.sendAnalytics('edit', 'report_edit', {
					c_sub_section: popupType,
					c_element: 'detail_button',
					type: this.#embeddedParams.type.toLowerCase(),
					p1: biconnector_apacheSupersetAnalytics.ApacheSupersetAnalytics.buildAppIdForAnalyticRequest(this.#embeddedParams.appId),
					p2: this.#embeddedParams.id,
					status: 'success'
				});
			}, popupType => {
				biconnector_apacheSupersetAnalytics.ApacheSupersetAnalytics.sendAnalytics('edit', 'report_edit', {
					c_sub_section: popupType,
					c_element: 'detail_button',
					type: this.#embeddedParams.type.toLowerCase(),
					p1: biconnector_apacheSupersetAnalytics.ApacheSupersetAnalytics.buildAppIdForAnalyticRequest(this.#embeddedParams.appId),
					p2: this.#embeddedParams.id,
					status: 'error'
				});
			});
			this.#reloadGridAfterSliderClose();
		}
		#reloadGridAfterSliderClose() {
			const slider = BX.SidePanel.Instance.getSliderByWindow(window);
			if (slider) {
				main_core_events.EventEmitter.subscribeOnce(slider, 'SidePanel.Slider:onClose', () => {
					if (!top.BX.Main || !top.BX.Main.gridManager) {
						return;
					}
					top.BX.Main.gridManager.data.forEach(grid => {
						if (grid.instance.getId() === 'biconnector_superset_dashboard_grid') {
							grid.instance.reload();
						}
					});
				});
			}
		}

		// eslint-disable-next-line max-lines-per-function

		#initShareButton() {
			const shareButton = this.#dashboardNode.querySelector('.dashboard-header-buttons-share');
			if (!shareButton) {
				return;
			}
			main_core.Event.unbindAll(shareButton);
			const menuItems = [];
			if (this.#canShare) {
				menuItems.push({
					id: 'share-link',
					title: main_core.Loc.getMessage('SUPERSET_DASHBOARD_DETAIL_SHARE_LINK_MSGVER_1'),
					html: main_core.Tag.render`
					<span class="dashboard-detail-menu-item">
						<span class="dashboard-detail-menu-item-content">
							<span class="dashboard-detail-menu-item-title">
								${main_core.Text.encode(main_core.Loc.getMessage('SUPERSET_DASHBOARD_DETAIL_SHARE_LINK_MSGVER_1'))}
							</span>
							<span class="dashboard-detail-menu-item-description">
								${main_core.Text.encode(main_core.Loc.getMessage('SUPERSET_DASHBOARD_DETAIL_SHARE_LINK_DESCRIPTION'))}
							</span>
						</span>
			
						<span class="ui-icon-set --o-link dashboard-detail-menu-item-icon"></span>
					</span>`,
					className: 'menu-popup-no-icon dashboard-detail-share-link-menu-item',
					onclick: (event, menuItem) => {
						menuItem.menuWindow.close();
						this.#showSharePopup();
					}
				});
			}
			menuItems.push({
				id: 'share-screenshot',
				title: main_core.Loc.getMessage('SUPERSET_DASHBOARD_DETAIL_SHARE_TO_CHAT_IMAGE_MSGVER_1'),
				html: main_core.Tag.render`
					<span class="dashboard-detail-menu-item">
						<span class="dashboard-detail-menu-item-content">
							<span class="dashboard-detail-menu-item-title">
								${main_core.Text.encode(main_core.Loc.getMessage('SUPERSET_DASHBOARD_DETAIL_SHARE_TO_CHAT_IMAGE_MSGVER_1'))}
							</span>
							<span class="dashboard-detail-menu-item-description">
								${main_core.Text.encode(main_core.Loc.getMessage('SUPERSET_DASHBOARD_DETAIL_SHARE_TO_CHAT_IMAGE_DESCRIPTION'))}
							</span>
						</span>
			
						<span class="ui-icon-set --o-image dashboard-detail-menu-item-icon"></span>
					</span>`,
				className: 'menu-popup-no-icon dashboard-detail-share-link-menu-item',
				onclick: (event, menuItem) => {
					menuItem.menuWindow.close();
					const moreButton = this.#dashboardNode.querySelector('.dashboard-header-buttons-more');
					const selector = new ChatSelector({
						targetNode: moreButton,
						dashboardName: main_core.Text.decode(this.#embeddedParams.title),
						fileExtension: 'jpeg',
						onSend: () => this.#embeddedLoader.getScreenshot(),
						dashboardId: this.#embeddedParams.id,
						dashboardType: this.#embeddedParams.type.toLowerCase(),
						appId: this.#embeddedParams.appId
					});
					selector.show();
					biconnector_apacheSupersetAnalytics.ApacheSupersetAnalytics.sendAnalytics('share', 'open_selector', {
						p3: 'ext_jpeg'
					});
				}
			}, {
				id: 'share-pdf',
				title: main_core.Loc.getMessage('SUPERSET_DASHBOARD_DETAIL_SHARE_TO_CHAT_PDF_MSGVER_1'),
				html: main_core.Tag.render`
					<span class="dashboard-detail-menu-item">
						<span class="dashboard-detail-menu-item-content">
							<span class="dashboard-detail-menu-item-title">
								${main_core.Text.encode(main_core.Loc.getMessage('SUPERSET_DASHBOARD_DETAIL_SHARE_TO_CHAT_PDF_MSGVER_1'))}
							</span>
							<span class="dashboard-detail-menu-item-description">
								${main_core.Text.encode(main_core.Loc.getMessage('SUPERSET_DASHBOARD_DETAIL_SHARE_TO_CHAT_PDF_DESCRIPTION'))}
							</span>
						</span>
			
						<span class="ui-icon-set --o-file dashboard-detail-menu-item-icon"></span>
					</span>`,
				className: 'menu-popup-no-icon dashboard-detail-share-link-menu-item',
				onclick: (event, menuItem) => {
					menuItem.menuWindow.close();
					const moreButton = this.#dashboardNode.querySelector('.dashboard-header-buttons-more');
					const selector = new ChatSelector({
						targetNode: moreButton,
						dashboardName: main_core.Text.decode(this.#embeddedParams.title),
						fileExtension: 'pdf',
						onSend: () => this.#embeddedLoader.getPdf(),
						dashboardId: this.#embeddedParams.id,
						dashboardType: this.#embeddedParams.type.toLowerCase(),
						appId: this.#embeddedParams.appId
					});
					selector.show();
					biconnector_apacheSupersetAnalytics.ApacheSupersetAnalytics.sendAnalytics('share', 'open_selector', {
						p3: 'ext_pdf'
					});
				}
			});
			const shareMenu = new main_popup.Menu({
				closeByEsc: false,
				closeIcon: false,
				cacheable: true,
				angle: {
					position: 'top'
				},
				bindElement: shareButton,
				events: {
					onShow: event => this.#alignMenuPopupToArrow(shareButton, event.getTarget())
				},
				autoHide: true,
				items: menuItems
			});
			main_core.Event.bind(shareButton, 'click', () => {
				shareMenu.show();
				biconnector_apacheSupersetAnalytics.ApacheSupersetAnalytics.sendAnalytics('share', 'click_share', {
					type: this.#embeddedParams.type.toLowerCase()
				});
			});
		}
		#showSharePopup() {
			if (!this.#sharePopup) {
				this.#sharePopup = new biconnector_sharePopup.SharePopup({
					dashboardId: this.#embeddedParams.id,
					dashboardTitle: this.#embeddedParams.title ?? '',
					embeddedLoader: this.#embeddedLoader,
					initialShareData: this.#shareData,
					urlParams: this.#embeddedParams.urlParams ?? null,
					type: (this.#embeddedParams.type ?? '').toLowerCase(),
					analyticsElement: 'detail_button'
				});
			}
			this.#sharePopup.show();
		}
		#initMoreMenu() {
			const moreButton = this.#dashboardNode.querySelector('.dashboard-header-buttons-more');
			if (this.#moreMenu) {
				main_core.Event.unbindAll(moreButton);
			}
			this.#moreMenu = new main_popup.Menu({
				closeByEsc: false,
				closeIcon: false,
				cacheable: true,
				angle: {
					position: 'top',
					offset: 43
				},
				items: this.#getMoreMenuItems(),
				toFrontOnShow: true,
				autoHide: true,
				bindElement: moreButton,
				className: 'more-popup',
				events: {
					onBeforeClose: () => {
						this.#moreMenu.getMenuItems().forEach(menuItem => {
							menuItem.closeSubMenu();
						});
					},
					onAfterShow: () => {
						const popupContainer = this.#getMoreMenu().getPopupWindow().getPopupContainer();
						const overHeight = popupContainer.getBoundingClientRect().top + popupContainer.offsetHeight;
						if (overHeight > window.innerHeight) {
							window.scrollTo({
								top: window.scrollY + (-window.innerHeight + overHeight),
								behavior: 'smooth'
							});
						}
					}
				}
			});
			main_core.Event.bind(moreButton, 'click', () => this.#moreMenu.show());
		}
		#getDownloadMenuItems() {
			return [{
				id: 'download-screenshot',
				title: main_core.Loc.getMessage('SUPERSET_DASHBOARD_DETAIL_DOWNLOAD_JPEG_MSGVER_1'),
				html: main_core.Tag.render`<span class="dashboard-detail-menu-item">
						<span>${main_core.Text.encode(main_core.Loc.getMessage('SUPERSET_DASHBOARD_DETAIL_DOWNLOAD_JPEG_MSGVER_1'))}</span>
						<span class="ui-icon-set --o-image dashboard-detail-menu-item-icon"></span>
						</span>`,
				className: 'menu-popup-no-icon',
				onclick: (event, menuItem) => {
					menuItem.disable();
					const loader = new main_loader.Loader({
						target: menuItem.layout.item,
						size: 30
					});
					loader.show();
					this.#embeddedLoader.getScreenshot().then(imageData => {
						const dashboardTitle = main_core.Text.decode(this.#embeddedParams.title);
						const datetime = main_date.DateTimeFormat.format('Y-m-d H-i-s');
						this.#downloadFile(imageData.replace('data:image/jpeg;base64,', ''), `${dashboardTitle} ${datetime}.jpeg`, 'image/jpeg');
						menuItem.enable();
						loader.hide();
						biconnector_apacheSupersetAnalytics.ApacheSupersetAnalytics.sendAnalytics('download', 'dashboard_download', {
							status: 'success',
							type: this.#embeddedParams.type.toLowerCase(),
							p1: biconnector_apacheSupersetAnalytics.ApacheSupersetAnalytics.buildAppIdForAnalyticRequest(this.#embeddedParams.appId),
							p2: this.#embeddedParams.id,
							p3: 'ext_jpeg'
						});
					}).catch(() => {
						menuItem.enable();
						loader.hide();
						BX.UI.Notification.Center.notify({
							content: main_core.Loc.getMessage('SUPERSET_DASHBOARD_DETAIL_DOWNLOAD_ERROR')
						});
						biconnector_apacheSupersetAnalytics.ApacheSupersetAnalytics.sendAnalytics('download', 'dashboard_download', {
							status: 'error',
							type: this.#embeddedParams.type.toLowerCase(),
							p1: biconnector_apacheSupersetAnalytics.ApacheSupersetAnalytics.buildAppIdForAnalyticRequest(this.#embeddedParams.appId),
							p2: this.#embeddedParams.id,
							p3: 'ext_jpeg'
						});
					});
				}
			}, {
				id: 'download-pdf',
				title: main_core.Loc.getMessage('SUPERSET_DASHBOARD_DETAIL_DOWNLOAD_PDF'),
				html: main_core.Tag.render`<span class="dashboard-detail-menu-item">
						<span>${main_core.Text.encode(main_core.Loc.getMessage('SUPERSET_DASHBOARD_DETAIL_DOWNLOAD_PDF'))}</span>
						<span class="ui-icon-set --o-file dashboard-detail-menu-item-icon"></span>
						</span>`,
				className: 'menu-popup-no-icon',
				onclick: (event, menuItem) => {
					menuItem.disable();
					const loader = new main_loader.Loader({
						target: menuItem.layout.item,
						size: 30
					});
					loader.show();
					this.#embeddedLoader.getPdf().then(imageData => {
						const dashboardTitle = main_core.Text.decode(this.#embeddedParams.title);
						const datetime = main_date.DateTimeFormat.format('Y-m-d H-i-s');
						this.#downloadFile(imageData, `${dashboardTitle} ${datetime}.pdf`, 'application/pdf');
						menuItem.enable();
						loader.hide();
						biconnector_apacheSupersetAnalytics.ApacheSupersetAnalytics.sendAnalytics('download', 'dashboard_download', {
							status: 'success',
							type: this.#embeddedParams.type.toLowerCase(),
							p1: biconnector_apacheSupersetAnalytics.ApacheSupersetAnalytics.buildAppIdForAnalyticRequest(this.#embeddedParams.appId),
							p2: this.#embeddedParams.id,
							p3: 'ext_pdf'
						});
					}).catch(() => {
						menuItem.enable();
						loader.hide();
						BX.UI.Notification.Center.notify({
							content: main_core.Loc.getMessage('SUPERSET_DASHBOARD_DETAIL_DOWNLOAD_ERROR')
						});
						biconnector_apacheSupersetAnalytics.ApacheSupersetAnalytics.sendAnalytics('download', 'dashboard_download', {
							status: 'error',
							type: this.#embeddedParams.type.toLowerCase(),
							p1: biconnector_apacheSupersetAnalytics.ApacheSupersetAnalytics.buildAppIdForAnalyticRequest(this.#embeddedParams.appId),
							p2: this.#embeddedParams.id,
							p3: 'ext_pdf'
						});
					});
				}
			}];
		}

		// eslint-disable-next-line max-lines-per-function
		#getMoreMenuItems() {
			const result = [];
			if (this.#canEdit && !BX.BIConnector.LimitLockPopup) {
				result.push({
					id: 'edit_dashboard',
					title: main_core.Loc.getMessage('SUPERSET_DASHBOARD_DETAIL_HEADER_EDIT_MSGVER_1'),
					html: main_core.Tag.render`<span class="dashboard-detail-menu-item">
						<span>${main_core.Text.encode(main_core.Loc.getMessage('SUPERSET_DASHBOARD_DETAIL_HEADER_EDIT_MSGVER_1'))}</span>
						<span class="ui-icon-set --edit-l dashboard-detail-menu-item-icon"></span>
						</span>`,
					className: 'menu-popup-no-icon',
					onclick: () => {
						this.#onEditButtonClick();
					}
				});
			}
			result.push({
				id: 'download',
				title: main_core.Loc.getMessage('SUPERSET_DASHBOARD_DETAIL_DOWNLOAD_IMAGE_MSGVER_1'),
				html: main_core.Tag.render`
					<span class="dashboard-detail-menu-item">
					<span>${main_core.Text.encode(main_core.Loc.getMessage('SUPERSET_DASHBOARD_DETAIL_DOWNLOAD_IMAGE_MSGVER_1'))}</span>
					<span class="ui-icon-set --o-download dashboard-detail-menu-item-icon no-chevron"></span>
					</span>`,
				className: 'menu-popup-no-icon dashboard-detail-download-menu-item',
				cacheable: true,
				items: this.#getDownloadMenuItems(),
				onclick: (event, menuItem) => {
					menuItem.showSubMenu();
				}
			}, {
				id: 'feedback',
				title: main_core.Loc.getMessage('SUPERSET_DASHBOARD_DETAIL_MORE_MENU_FEEDBACK'),
				html: main_core.Tag.render`<span class="dashboard-detail-menu-item">
						<span>${main_core.Text.encode(main_core.Loc.getMessage('SUPERSET_DASHBOARD_DETAIL_MORE_MENU_FEEDBACK'))}</span>
						<span class="ui-icon-set --o-message dashboard-detail-menu-item-icon"></span>
						</span>`,
				className: 'menu-popup-no-icon',
				onclick: () => {
					biconnector_apacheSupersetFeedbackForm.ApacheSupersetFeedbackForm.feedbackFormOpen();
				}
			}, {
				id: 'order_dashboard',
				title: main_core.Loc.getMessage('SUPERSET_DASHBOARD_DETAIL_MORE_MENU_ORDER_DASHBOARD'),
				html: main_core.Tag.render`<span class="dashboard-detail-menu-item">
						<span>${main_core.Text.encode(main_core.Loc.getMessage('SUPERSET_DASHBOARD_DETAIL_MORE_MENU_ORDER_DASHBOARD'))}</span>
						<span class="ui-icon-set --o-market dashboard-detail-menu-item-icon"></span>
						</span>`,
				className: 'menu-popup-no-icon',
				onclick: () => {
					biconnector_apacheSupersetFeedbackForm.ApacheSupersetFeedbackForm.requestIntegrationFormOpen();
				}
			});
			if (this.#canExport) {
				result.push({
					id: 'export',
					title: main_core.Loc.getMessage('SUPERSET_DASHBOARD_DETAIL_MORE_MENU_EXPORT'),
					html: main_core.Tag.render`<span class="dashboard-detail-menu-item">
						<span>${main_core.Text.encode(main_core.Loc.getMessage('SUPERSET_DASHBOARD_DETAIL_MORE_MENU_EXPORT'))}</span>
						<span class="ui-icon-set --o-share dashboard-detail-menu-item-icon"></span>
						</span>`,
					className: 'menu-popup-no-icon',
					onclick: () => {
						this.#moreMenu.getMenuItem('export').disable();
						this.#dashboardManager.exportDashboard(this.#embeddedParams.id, 'detail_button').finally(() => {
							this.#moreMenu.getMenuItem('export').enable();
						}).catch(() => {});
					}
				});
			}
			return result;
		}
		#downloadFile(base64Data, fileName, fileType) {
			const byteCharacters = atob(base64Data);
			const byteNumbers = Array.from({
				length: byteCharacters.length
			});
			for (let i = 0; i < byteCharacters.length; i++) {
				byteNumbers[i] = byteCharacters.codePointAt(i);
			}
			const byteArray = new Uint8Array(byteNumbers);
			const blob = new Blob([byteArray], {
				type: fileType
			});
			const link = document.createElement('a');
			link.href = window.URL.createObjectURL(blob);
			link.download = fileName;
			main_core.Dom.append(link, document.body);
			link.click();
			main_core.Dom.remove(link);
		}
		#getMoreMenu() {
			return this.#moreMenu;
		}
		#postOptionsForFilter(event) {
			if (event.origin === this.#embeddedParams.supersetDomain) {
				const {
					type,
					filterId
				} = event.data;
				if (type === 'superset-filter-request-options' && filterId) {
					event.source.postMessage({
						type: 'superset-filter-options',
						filterId,
						options: this.#getOptionsForFilter(filterId)
					}, event.origin);
				}
			}
		}
		#getOptionsForFilter(filterId) {
			return this.#embeddedParams.filters[filterId] || [];
		}
	}

	var metadata = {
		lottielabInfoHTML: "<!DOCTYPE html><html><meta http-equiv='refresh' content='0, URL=?info'></html><!-- "
	};
	var v$1 = "5.7.5";
	var fr$1 = 100;
	var ip$1 = 0;
	var op$1 = 300;
	var w$1 = 260;
	var h$1 = 155;
	var nm$1 = "Comp 1";
	var ddd$1 = 0;
	var assets$1 = [
		{
			id: "0",
			layers: [
				{
					ddd: 0,
					ind: 1,
					ty: 4,
					sr: 1,
					ks: {
						p: {
							a: 0,
							k: [
								1,
								1
							],
							ix: 2
						},
						o: {
							a: 0,
							k: 100,
							ix: 2
						}
					},
					ao: 0,
					shapes: [
						{
							ty: "gr",
							it: [
								{
									ty: "rc",
									d: 1,
									s: {
										a: 1,
										k: [
											{
												t: 206,
												s: [
													1.93,
													2.58
												],
												i: {
													x: [
														0.75
													],
													y: [
														0.75
													]
												},
												o: {
													x: [
														0.25
													],
													y: [
														0.25
													]
												}
											},
											{
												t: 231,
												s: [
													30.67,
													31.98
												],
												i: {
													x: [
														0.75
													],
													y: [
														0.75
													]
												},
												o: {
													x: [
														0.25
													],
													y: [
														0.25
													]
												}
											},
											{
												t: 244,
												s: [
													54.46,
													30
												],
												i: {
													x: [
														0.75
													],
													y: [
														0.75
													]
												},
												o: {
													x: [
														0.25
													],
													y: [
														0.25
													]
												}
											},
											{
												t: 255,
												s: [
													61.39,
													43.87
												],
												i: {
													x: [
														0.75
													],
													y: [
														0.75
													]
												},
												o: {
													x: [
														0.25
													],
													y: [
														0.25
													]
												}
											},
											{
												t: 300,
												s: [
													62.3,
													40.58
												]
											}
										],
										ix: 2
									},
									p: {
										a: 0,
										k: [
											0,
											0
										],
										ix: 2
									},
									r: {
										a: 0,
										k: 0,
										ix: 2
									}
								},
								{
									ty: "gf",
									o: {
										a: 0,
										k: 100,
										ix: 2
									},
									r: 1,
									bm: 0,
									g: {
										p: 2,
										k: {
											a: 0,
											k: [
												0,
												0.106,
												0.81,
												0.483,
												1,
												0.32,
												0.851,
												0.604,
												0,
												1,
												1,
												1
											],
											ix: 2
										}
									},
									s: {
										a: 0,
										k: [
											25,
											-19.5
										],
										ix: 2
									},
									e: {
										a: 0,
										k: [
											-27.5,
											20.5
										],
										ix: 2
									},
									t: 1
								},
								{
									ty: "tr",
									p: {
										a: 1,
										k: [
											{
												t: 198,
												s: [
													-0.81,
													37.37
												],
												i: {
													x: [
														0.75
													],
													y: [
														0.75
													]
												},
												o: {
													x: [
														0.25
													],
													y: [
														0.25
													]
												}
											},
											{
												t: 206,
												s: [
													0.36,
													35.95
												],
												i: {
													x: [
														0.75
													],
													y: [
														0.75
													]
												},
												o: {
													x: [
														0.25
													],
													y: [
														0.25
													]
												}
											},
											{
												t: 231,
												s: [
													14.73,
													21.25
												],
												i: {
													x: [
														0.75
													],
													y: [
														0.75
													]
												},
												o: {
													x: [
														0.25
													],
													y: [
														0.25
													]
												}
											},
											{
												t: 244,
												s: [
													26.62,
													22.24
												],
												i: {
													x: [
														0.75
													],
													y: [
														0.75
													]
												},
												o: {
													x: [
														0.25
													],
													y: [
														0.25
													]
												}
											},
											{
												t: 255,
												s: [
													30.09,
													15.3
												],
												i: {
													x: [
														0.75
													],
													y: [
														0.75
													]
												},
												o: {
													x: [
														0.25
													],
													y: [
														0.25
													]
												}
											},
											{
												t: 300,
												s: [
													30.55,
													16.95
												]
											}
										],
										ix: 2
									},
									o: {
										a: 0,
										k: 100,
										ix: 2
									}
								}
							]
						}
					],
					ip: 0,
					op: 301,
					st: 0
				},
				{
					ddd: 0,
					ind: 2,
					ty: 4,
					sr: 1,
					ks: {
						p: {
							a: 0,
							k: [
								1,
								1
							],
							ix: 2
						},
						o: {
							a: 0,
							k: 100,
							ix: 2
						}
					},
					ao: 0,
					shapes: [
						{
							ty: "rc",
							d: 1,
							s: {
								a: 0,
								k: [
									61,
									38
								],
								ix: 2
							},
							p: {
								a: 0,
								k: [
									29.5,
									18
								],
								ix: 2
							},
							r: {
								a: 0,
								k: 0,
								ix: 2
							}
						},
						{
							ty: "fl",
							c: {
								a: 0,
								k: [
									0,
									0,
									0
								],
								ix: 2
							},
							o: {
								a: 0,
								k: 0,
								ix: 2
							},
							r: 1,
							bm: 0
						}
					],
					ip: 0,
					op: 301,
					st: 0
				}
			]
		},
		{
			id: "1",
			layers: [
				{
					ddd: 0,
					ind: 3,
					ty: 4,
					sr: 1,
					ks: {
						p: {
							a: 0,
							k: [
								1,
								1
							],
							ix: 2
						},
						o: {
							a: 0,
							k: 100,
							ix: 2
						}
					},
					td: 1,
					ao: 0,
					shapes: [
						{
							ty: "gr",
							it: [
								{
									ty: "gr",
									it: [
										{
											ty: "gr",
											it: [
												{
													ty: "sh",
													d: 1,
													ks: {
														a: 0,
														k: {
															c: true,
															v: [
																[
																	58.53,
																	0.27
																],
																[
																	59.94,
																	1.84
																],
																[
																	59.46,
																	8.85
																],
																[
																	57.8,
																	10.3
																],
																[
																	56.35,
																	8.64
																],
																[
																	56.55,
																	5.72
																],
																[
																	42.19,
																	19.72
																],
																[
																	42.19,
																	19.73
																],
																[
																	35.83,
																	19.93
																],
																[
																	28.74,
																	12.55
																],
																[
																	25.29,
																	12.67
																],
																[
																	1.79,
																	36.05
																],
																[
																	0.23,
																	35.97
																],
																[
																	0.44,
																	34.12
																],
																[
																	23.94,
																	10.74
																],
																[
																	30.31,
																	10.52
																],
																[
																	37.4,
																	17.9
																],
																[
																	40.85,
																	17.78
																],
																[
																	40.85,
																	17.78
																],
																[
																	55.71,
																	3.28
																],
																[
																	51.35,
																	3.12
																],
																[
																	49.85,
																	1.5
																],
																[
																	51.47,
																	0
																],
																[
																	58.53,
																	0.27
																],
																[
																	58.53,
																	0.27
																]
															],
															i: [
																[
																	0,
																	0
																],
																[
																	0.056,
																	-0.826
																],
																[
																	0.16,
																	-2.337
																],
																[
																	0.859,
																	0.058
																],
																[
																	-0.059,
																	0.859
																],
																[
																	-0.066,
																	0.973
																],
																[
																	4.786,
																	-4.666
																],
																[
																	0.001,
																	-1e-3
																],
																[
																	1.722,
																	1.79
																],
																[
																	2.364,
																	2.457
																],
																[
																	1.046,
																	-1.039
																],
																[
																	7.833,
																	-7.793
																],
																[
																	0.373,
																	0.533
																],
																[
																	-0.491,
																	0.489
																],
																[
																	-7.834,
																	7.793
																],
																[
																	-1.727,
																	-1.794
																],
																[
																	-2.364,
																	-2.458
																],
																[
																	-1.047,
																	1.035
																],
																[
																	-1e-3,
																	0.001
																],
																[
																	-4.955,
																	4.832
																],
																[
																	1.454,
																	0.056
																],
																[
																	-0.033,
																	0.86
																],
																[
																	-0.859,
																	-0.033
																],
																[
																	-2.352,
																	-0.091
																],
																[
																	0,
																	0
																]
															],
															o: [
																[
																	0.827,
																	0.032
																],
																[
																	-0.16,
																	2.337
																],
																[
																	-0.059,
																	0.859
																],
																[
																	-0.858,
																	-0.059
																],
																[
																	0.066,
																	-0.973
																],
																[
																	-4.786,
																	4.667
																],
																[
																	-1e-3,
																	0.001
																],
																[
																	-1.93,
																	1.906
																],
																[
																	-2.364,
																	-2.457
																],
																[
																	-0.936,
																	-0.973
																],
																[
																	-7.833,
																	7.793
																],
																[
																	-0.491,
																	0.489
																],
																[
																	-0.372,
																	-0.533
																],
																[
																	7.834,
																	-7.793
																],
																[
																	1.93,
																	-1.916
																],
																[
																	2.364,
																	2.458
																],
																[
																	0.933,
																	0.97
																],
																[
																	0.001,
																	-1e-3
																],
																[
																	4.955,
																	-4.832
																],
																[
																	-1.454,
																	-0.056
																],
																[
																	-0.86,
																	-0.033
																],
																[
																	0.033,
																	-0.86
																],
																[
																	2.352,
																	0.091
																],
																[
																	0,
																	0
																],
																[
																	0,
																	0
																]
															]
														}
													}
												},
												{
													ty: "tr",
													o: {
														a: 0,
														k: 100,
														ix: 2
													}
												}
											]
										},
										{
											ty: "fl",
											c: {
												a: 0,
												k: [
													0,
													0,
													0
												],
												ix: 2
											},
											o: {
												a: 0,
												k: 100,
												ix: 2
											},
											r: 1,
											bm: 0
										},
										{
											ty: "tr",
											o: {
												a: 0,
												k: 100,
												ix: 2
											}
										}
									]
								},
								{
									ty: "tr",
									p: {
										a: 0,
										k: [
											29.97,
											18.2
										],
										ix: 2
									},
									a: {
										a: 0,
										k: [
											29.97,
											18.2
										],
										ix: 2
									},
									o: {
										a: 0,
										k: 100,
										ix: 2
									}
								}
							]
						}
					],
					ip: 0,
					op: 301,
					st: 0
				},
				{
					ddd: 0,
					refId: "0",
					w: 61,
					h: 38,
					ind: 4,
					ty: 0,
					sr: 1,
					ks: {
						p: {
							a: 0,
							k: [
								29.5,
								18
							],
							ix: 2
						},
						a: {
							a: 0,
							k: [
								29.5,
								18
							],
							ix: 2
						},
						o: {
							a: 0,
							k: 100,
							ix: 2
						}
					},
					ao: 0,
					ip: 0,
					op: 301,
					st: 0,
					tt: 1
				}
			]
		},
		{
			id: "2",
			layers: [
				{
					ddd: 0,
					ind: 5,
					ty: 4,
					sr: 1,
					ks: {
						p: {
							a: 0,
							k: [
								1,
								0
							],
							ix: 2
						},
						o: {
							a: 0,
							k: 100,
							ix: 2
						}
					},
					ao: 0,
					shapes: [
						{
							ty: "gr",
							it: [
								{
									ty: "gr",
									it: [
										{
											ty: "sh",
											d: 1,
											ks: {
												a: 0,
												k: {
													c: true,
													v: [
														[
															19.8,
															6.98
														],
														[
															10.08,
															0.01
														],
														[
															0,
															6.64
														],
														[
															0.78,
															7.37
														],
														[
															19.07,
															7.67
														],
														[
															19.8,
															6.98
														],
														[
															19.8,
															6.98
														]
													],
													i: [
														[
															0,
															0
														],
														[
															4.462,
															0.13
														],
														[
															0.408,
															-5.505
														],
														[
															-0.431,
															-8e-3
														],
														[
															-6.094,
															-0.099
														],
														[
															0,
															0.388
														],
														[
															0,
															0
														]
													],
													o: [
														[
															-0.382,
															-5.338
														],
														[
															-4.533,
															-0.134
														],
														[
															0,
															0.4
														],
														[
															6.094,
															0.099
														],
														[
															0.404,
															0.008
														],
														[
															0,
															0
														],
														[
															0,
															0
														]
													]
												}
											}
										},
										{
											ty: "fl",
											c: {
												a: 0,
												k: [
													1,
													1,
													1
												],
												ix: 2
											},
											o: {
												a: 0,
												k: 90,
												ix: 2
											},
											r: 1,
											bm: 0
										},
										{
											ty: "tr",
											p: {
												a: 0,
												k: [
													0.55,
													7.71
												],
												ix: 2
											},
											a: {
												a: 0,
												k: [
													9.9,
													3.84
												],
												ix: 2
											},
											o: {
												a: 0,
												k: 100,
												ix: 2
											}
										}
									]
								},
								{
									ty: "gr",
									it: [
										{
											ty: "sh",
											d: 1,
											ks: {
												a: 0,
												k: {
													c: true,
													v: [
														[
															2.48,
															0.77
														],
														[
															2.36,
															0.86
														],
														[
															2.36,
															0.86
														],
														[
															0.19,
															7.44
														],
														[
															5.64,
															12.19
														],
														[
															9.73,
															10.44
														],
														[
															11.2,
															6.35
														],
														[
															9.9,
															2.13
														],
														[
															9.9,
															2.13
														],
														[
															5.64,
															0.01
														],
														[
															3.92,
															0.2
														],
														[
															2.48,
															0.77
														],
														[
															2.48,
															0.77
														]
													],
													i: [
														[
															0,
															0
														],
														[
															0.037,
															-0.035
														],
														[
															0.001,
															-1e-3
														],
														[
															-0.569,
															-2.439
														],
														[
															-2.994,
															-0.1
														],
														[
															-0.935,
															1.106
														],
														[
															-0.033,
															1.504
														],
														[
															0.909,
															1.177
														],
														[
															0,
															0.001
														],
														[
															1.947,
															0.106
														],
														[
															0.575,
															-0.15
														],
														[
															0.347,
															-0.211
														],
														[
															0,
															0
														]
													],
													o: [
														[
															-0.045,
															0.029
														],
														[
															-1e-3,
															0.001
														],
														[
															-2.043,
															1.398
														],
														[
															0.585,
															2.5
														],
														[
															1.777,
															0.059
														],
														[
															0.945,
															-1.098
														],
														[
															0.034,
															-1.504
														],
														[
															0,
															-1e-3
														],
														[
															-0.913,
															-1.175
														],
														[
															-0.537,
															-0.029
														],
														[
															-0.591,
															0.15
														],
														[
															0,
															0
														],
														[
															0,
															0
														]
													]
												}
											}
										},
										{
											ty: "fl",
											c: {
												a: 0,
												k: [
													1,
													1,
													1
												],
												ix: 2
											},
											o: {
												a: 0,
												k: 90,
												ix: 2
											},
											r: 1,
											bm: 0
										},
										{
											ty: "tr",
											p: {
												a: 0,
												k: [
													0.67,
													-4.48
												],
												ix: 2
											},
											a: {
												a: 0,
												k: [
													5.6,
													6.1
												],
												ix: 2
											},
											o: {
												a: 0,
												k: 100,
												ix: 2
											}
										}
									]
								},
								{
									ty: "gr",
									it: [
										{
											ty: "gr",
											it: [
												{
													ty: "gr",
													it: [
														{
															ty: "sh",
															d: 1,
															ks: {
																a: 0,
																k: {
																	c: true,
																	v: [
																		[
																			9.63,
																			0.02
																		],
																		[
																			0,
																			8.87
																		],
																		[
																			0,
																			32.28
																		],
																		[
																			9.63,
																			41.8
																		],
																		[
																			32.02,
																			41.8
																		],
																		[
																			40.65,
																			32.92
																		],
																		[
																			40.65,
																			11.1
																		],
																		[
																			32.02,
																			1.61
																		],
																		[
																			9.63,
																			0.02
																		],
																		[
																			9.63,
																			0.02
																		]
																	],
																	i: [
																		[
																			0,
																			0
																		],
																		[
																			0,
																			-5.261
																		],
																		[
																			0,
																			-7.805
																		],
																		[
																			-5.277,
																			0
																		],
																		[
																			-7.464,
																			0.002
																		],
																		[
																			0,
																			4.903
																		],
																		[
																			0,
																			7.274
																		],
																		[
																			4.799,
																			0.341
																		],
																		[
																			7.464,
																			0.529
																		],
																		[
																			0,
																			0
																		]
																	],
																	o: [
																		[
																			-5.277,
																			-0.372
																		],
																		[
																			0,
																			7.804
																		],
																		[
																			0,
																			5.259
																		],
																		[
																			7.464,
																			-2e-3
																		],
																		[
																			4.799,
																			0
																		],
																		[
																			0,
																			-7.274
																		],
																		[
																			0,
																			-4.903
																		],
																		[
																			-7.464,
																			-0.529
																		],
																		[
																			0,
																			0
																		],
																		[
																			0,
																			0
																		]
																	]
																}
															}
														},
														{
															ty: "tr",
															o: {
																a: 0,
																k: 100,
																ix: 2
															}
														}
													]
												},
												{
													ty: "gr",
													it: [
														{
															ty: "sh",
															d: 1,
															ks: {
																a: 0,
																k: {
																	c: true,
																	v: [
																		[
																			32.02,
																			2.61
																		],
																		[
																			9.63,
																			1.07
																		],
																		[
																			1.08,
																			8.93
																		],
																		[
																			1.08,
																			32.3
																		],
																		[
																			9.63,
																			40.76
																		],
																		[
																			32.02,
																			40.8
																		],
																		[
																			39.7,
																			32.91
																		],
																		[
																			39.7,
																			11.05
																		],
																		[
																			32.02,
																			2.61
																		],
																		[
																			32.02,
																			2.61
																		]
																	],
																	i: [
																		[
																			0,
																			0
																		],
																		[
																			7.464,
																			0.516
																		],
																		[
																			0,
																			-4.669
																		],
																		[
																			0,
																			-7.79
																		],
																		[
																			-4.687,
																			-8e-3
																		],
																		[
																			-7.464,
																			-0.012
																		],
																		[
																			0,
																			4.364
																		],
																		[
																			0,
																			7.286
																		],
																		[
																			4.269,
																			0.295
																		],
																		[
																			0,
																			0
																		]
																	],
																	o: [
																		[
																			-7.464,
																			-0.516
																		],
																		[
																			-4.687,
																			-0.323
																		],
																		[
																			0,
																			7.79
																		],
																		[
																			0,
																			4.667
																		],
																		[
																			7.464,
																			0.012
																		],
																		[
																			4.269,
																			0.006
																		],
																		[
																			0,
																			-7.286
																		],
																		[
																			0,
																			-4.366
																		],
																		[
																			0,
																			0
																		],
																		[
																			0,
																			0
																		]
																	]
																}
															}
														},
														{
															ty: "tr",
															o: {
																a: 0,
																k: 100,
																ix: 2
															}
														}
													]
												},
												{
													ty: "fl",
													c: {
														a: 0,
														k: [
															1,
															1,
															1
														],
														ix: 2
													},
													o: {
														a: 0,
														k: 18,
														ix: 2
													},
													r: 1,
													bm: 0
												},
												{
													ty: "tr",
													o: {
														a: 0,
														k: 100,
														ix: 2
													}
												}
											]
										},
										{
											ty: "tr",
											p: {
												a: 0,
												k: [
													0,
													0
												],
												ix: 2
											},
											a: {
												a: 0,
												k: [
													20.32,
													20.9
												],
												ix: 2
											},
											o: {
												a: 0,
												k: 100,
												ix: 2
											}
										}
									]
								},
								{
									ty: "gr",
									it: [
										{
											ty: "sh",
											d: 1,
											ks: {
												a: 0,
												k: {
													c: true,
													v: [
														[
															0,
															8.87
														],
														[
															9.63,
															0.02
														],
														[
															32.02,
															1.61
														],
														[
															40.65,
															11.1
														],
														[
															40.65,
															32.92
														],
														[
															32.02,
															41.8
														],
														[
															9.63,
															41.8
														],
														[
															0,
															32.28
														],
														[
															0,
															8.87
														],
														[
															0,
															8.87
														],
														[
															0,
															8.87
														]
													],
													i: [
														[
															0,
															0
														],
														[
															-5.277,
															-0.374
														],
														[
															-7.464,
															-0.529
														],
														[
															0,
															-4.901
														],
														[
															0,
															-7.274
														],
														[
															4.799,
															-2e-3
														],
														[
															7.464,
															-2e-3
														],
														[
															0,
															5.261
														],
														[
															0,
															7.804
														],
														[
															0,
															0.001
														],
														[
															0,
															0
														]
													],
													o: [
														[
															0,
															-5.26
														],
														[
															7.464,
															0.529
														],
														[
															4.799,
															0.341
														],
														[
															0,
															7.274
														],
														[
															0,
															4.903
														],
														[
															-7.464,
															0.002
														],
														[
															-5.277,
															0
														],
														[
															0,
															-7.804
														],
														[
															0,
															-1e-3
														],
														[
															0,
															0
														],
														[
															0,
															0
														]
													]
												}
											}
										},
										{
											ty: "fl",
											c: {
												a: 0,
												k: [
													0.106,
													0.81,
													0.483
												],
												ix: 2
											},
											o: {
												a: 0,
												k: 78,
												ix: 2
											},
											r: 1,
											bm: 0
										},
										{
											ty: "tr",
											p: {
												a: 0,
												k: [
													0,
													0
												],
												ix: 2
											},
											a: {
												a: 0,
												k: [
													20.32,
													20.9
												],
												ix: 2
											},
											o: {
												a: 0,
												k: 100,
												ix: 2
											}
										}
									]
								},
								{
									ty: "tr",
									p: {
										a: 1,
										k: [
											{
												t: 151,
												s: [
													20.32,
													124.35
												],
												i: {
													x: [
														0.75
													],
													y: [
														0.75
													]
												},
												o: {
													x: [
														0.25
													],
													y: [
														0.25
													]
												}
											},
											{
												t: 173,
												s: [
													20.32,
													30.35
												]
											}
										],
										ix: 2
									},
									o: {
										a: 0,
										k: 100,
										ix: 2
									}
								}
							]
						}
					],
					ip: 0,
					op: 301,
					st: 0
				},
				{
					ddd: 0,
					ind: 6,
					ty: 4,
					sr: 1,
					ks: {
						p: {
							a: 0,
							k: [
								1,
								0
							],
							ix: 2
						},
						o: {
							a: 0,
							k: 100,
							ix: 2
						}
					},
					ao: 0,
					shapes: [
						{
							ty: "gr",
							it: [
								{
									ty: "gr",
									it: [
										{
											ty: "gr",
											it: [
												{
													ty: "gr",
													it: [
														{
															ty: "sh",
															d: 1,
															ks: {
																a: 0,
																k: {
																	c: true,
																	v: [
																		[
																			0,
																			12.67
																		],
																		[
																			1.1,
																			11.22
																		],
																		[
																			2.18,
																			11.14
																		],
																		[
																			3.27,
																			12.42
																		],
																		[
																			3.27,
																			16.49
																		],
																		[
																			2.18,
																			17.94
																		],
																		[
																			1.1,
																			18.04
																		],
																		[
																			0,
																			16.77
																		],
																		[
																			0,
																			12.67
																		],
																		[
																			0,
																			12.67
																		]
																	],
																	i: [
																		[
																			0,
																			0
																		],
																		[
																			-0.605,
																			0.043
																		],
																		[
																			-0.363,
																			0.026
																		],
																		[
																			0,
																			-0.75
																		],
																		[
																			0,
																			-1.357
																		],
																		[
																			0.6,
																			-0.051
																		],
																		[
																			0.363,
																			-0.031
																		],
																		[
																			0,
																			0.756
																		],
																		[
																			0,
																			1.367
																		],
																		[
																			0,
																			0
																		]
																	],
																	o: [
																		[
																			0,
																			-0.754
																		],
																		[
																			0.363,
																			-0.026
																		],
																		[
																			0.6,
																			-0.043
																		],
																		[
																			0,
																			1.357
																		],
																		[
																			0,
																			0.75
																		],
																		[
																			-0.363,
																			0.031
																		],
																		[
																			-0.605,
																			0.052
																		],
																		[
																			0,
																			-1.367
																		],
																		[
																			0,
																			0
																		],
																		[
																			0,
																			0
																		]
																	]
																}
															}
														},
														{
															ty: "tr",
															o: {
																a: 0,
																k: 100,
																ix: 2
															}
														}
													]
												},
												{
													ty: "gr",
													it: [
														{
															ty: "sh",
															d: 1,
															ks: {
																a: 0,
																k: {
																	c: true,
																	v: [
																		[
																			10.72,
																			6.53
																		],
																		[
																			11.77,
																			5.13
																		],
																		[
																			12.81,
																			5.07
																		],
																		[
																			13.84,
																			6.33
																		],
																		[
																			13.84,
																			15.61
																		],
																		[
																			12.81,
																			17.03
																		],
																		[
																			11.77,
																			17.12
																		],
																		[
																			10.72,
																			15.87
																		],
																		[
																			10.72,
																			6.52
																		],
																		[
																			10.72,
																			6.53
																		],
																		[
																			10.72,
																			6.53
																		]
																	],
																	i: [
																		[
																			0,
																			0
																		],
																		[
																			-0.577,
																			0.034
																		],
																		[
																			-0.346,
																			0.021
																		],
																		[
																			0,
																			-0.734
																		],
																		[
																			0,
																			-3.094
																		],
																		[
																			0.573,
																			-0.05
																		],
																		[
																			0.346,
																			-0.029
																		],
																		[
																			0,
																			0.738
																		],
																		[
																			0,
																			3.116
																		],
																		[
																			0,
																			-1e-3
																		],
																		[
																			0,
																			0
																		]
																	],
																	o: [
																		[
																			0,
																			-0.738
																		],
																		[
																			0.346,
																			-0.021
																		],
																		[
																			0.573,
																			-0.033
																		],
																		[
																			0,
																			3.094
																		],
																		[
																			0,
																			0.733
																		],
																		[
																			-0.346,
																			0.029
																		],
																		[
																			-0.577,
																			0.049
																		],
																		[
																			0,
																			-3.116
																		],
																		[
																			0,
																			0.001
																		],
																		[
																			0,
																			0
																		],
																		[
																			0,
																			0
																		]
																	]
																}
															}
														},
														{
															ty: "tr",
															o: {
																a: 0,
																k: 100,
																ix: 2
															}
														}
													]
												},
												{
													ty: "gr",
													it: [
														{
															ty: "sh",
															d: 1,
															ks: {
																a: 0,
																k: {
																	c: true,
																	v: [
																		[
																			6.49,
																			0.05
																		],
																		[
																			5.43,
																			1.45
																		],
																		[
																			5.43,
																			16.31
																		],
																		[
																			6.49,
																			17.57
																		],
																		[
																			7.56,
																			17.48
																		],
																		[
																			8.62,
																			16.05
																		],
																		[
																			8.62,
																			1.29
																		],
																		[
																			7.56,
																			0
																		],
																		[
																			6.49,
																			0.05
																		],
																		[
																			6.49,
																			0.05
																		]
																	],
																	i: [
																		[
																			0,
																			0
																		],
																		[
																			0,
																			-0.746
																		],
																		[
																			0,
																			-4.954
																		],
																		[
																			-0.591,
																			0.051
																		],
																		[
																			-0.355,
																			0.031
																		],
																		[
																			0,
																			0.741
																		],
																		[
																			0,
																			4.919
																		],
																		[
																			0.586,
																			-0.028
																		],
																		[
																			0.355,
																			-0.017
																		],
																		[
																			0,
																			0
																		]
																	],
																	o: [
																		[
																			-0.591,
																			0.028
																		],
																		[
																			0,
																			4.954
																		],
																		[
																			0,
																			0.746
																		],
																		[
																			0.355,
																			-0.031
																		],
																		[
																			0.586,
																			-0.051
																		],
																		[
																			0,
																			-4.919
																		],
																		[
																			0,
																			-0.74
																		],
																		[
																			-0.355,
																			0.017
																		],
																		[
																			0,
																			0
																		],
																		[
																			0,
																			0
																		]
																	]
																}
															}
														},
														{
															ty: "tr",
															o: {
																a: 0,
																k: 100,
																ix: 2
															}
														}
													]
												},
												{
													ty: "fl",
													c: {
														a: 0,
														k: [
															1,
															1,
															1
														],
														ix: 2
													},
													o: {
														a: 0,
														k: 90,
														ix: 2
													},
													r: 1,
													bm: 0
												},
												{
													ty: "tr",
													o: {
														a: 0,
														k: 100,
														ix: 2
													}
												}
											]
										},
										{
											ty: "tr",
											p: {
												a: 0,
												k: [
													-0.21,
													0.61
												],
												ix: 2
											},
											a: {
												a: 0,
												k: [
													6.92,
													9.02
												],
												ix: 2
											},
											o: {
												a: 0,
												k: 100,
												ix: 2
											}
										}
									]
								},
								{
									ty: "gr",
									it: [
										{
											ty: "gr",
											it: [
												{
													ty: "gr",
													it: [
														{
															ty: "sh",
															d: 1,
															ks: {
																a: 0,
																k: {
																	c: true,
																	v: [
																		[
																			6.08,
																			0.45
																		],
																		[
																			0,
																			8.16
																		],
																		[
																			0,
																			29.85
																		],
																		[
																			6.08,
																			36.77
																		],
																		[
																			22.69,
																			35.04
																		],
																		[
																			28.2,
																			27.36
																		],
																		[
																			28.2,
																			6.96
																		],
																		[
																			22.69,
																			0
																		],
																		[
																			6.08,
																			0.45
																		],
																		[
																			6.08,
																			0.45
																		],
																		[
																			6.08,
																			0.45
																		]
																	],
																	i: [
																		[
																			0,
																			0
																		],
																		[
																			0,
																			-4.173
																		],
																		[
																			0,
																			-7.229
																		],
																		[
																			-3.336,
																			0.348
																		],
																		[
																			-5.536,
																			0.578
																		],
																		[
																			0,
																			3.925
																		],
																		[
																			0,
																			6.799
																		],
																		[
																			3.063,
																			-0.083
																		],
																		[
																			5.536,
																			-0.148
																		],
																		[
																			-1e-3,
																			0
																		],
																		[
																			0,
																			0
																		]
																	],
																	o: [
																		[
																			-3.338,
																			0.089
																		],
																		[
																			0,
																			7.229
																		],
																		[
																			0,
																			4.173
																		],
																		[
																			5.536,
																			-0.578
																		],
																		[
																			3.063,
																			-0.318
																		],
																		[
																			0,
																			-6.799
																		],
																		[
																			0,
																			-3.925
																		],
																		[
																			-5.536,
																			0.148
																		],
																		[
																			0.001,
																			0
																		],
																		[
																			0,
																			0
																		],
																		[
																			0,
																			0
																		]
																	]
																}
															}
														},
														{
															ty: "tr",
															o: {
																a: 0,
																k: 100,
																ix: 2
															}
														}
													]
												},
												{
													ty: "gr",
													it: [
														{
															ty: "sh",
															d: 1,
															ks: {
																a: 0,
																k: {
																	c: true,
																	v: [
																		[
																			22.69,
																			0.8
																		],
																		[
																			6.08,
																			1.28
																		],
																		[
																			0.68,
																			8.13
																		],
																		[
																			0.68,
																			29.79
																		],
																		[
																			6.08,
																			35.94
																		],
																		[
																			22.69,
																			34.24
																		],
																		[
																			27.59,
																			27.41
																		],
																		[
																			27.59,
																			6.99
																		],
																		[
																			22.69,
																			0.8
																		],
																		[
																			22.69,
																			0.8
																		],
																		[
																			22.69,
																			0.8
																		]
																	],
																	i: [
																		[
																			0,
																			0
																		],
																		[
																			5.536,
																			-0.158
																		],
																		[
																			0,
																			-3.702
																		],
																		[
																			0,
																			-7.219
																		],
																		[
																			-2.962,
																			0.305
																		],
																		[
																			-5.536,
																			0.568
																		],
																		[
																			0,
																			3.492
																		],
																		[
																			0,
																			6.808
																		],
																		[
																			2.724,
																			-0.079
																		],
																		[
																			-1e-3,
																			0.001
																		],
																		[
																			0,
																			0
																		]
																	],
																	o: [
																		[
																			-5.536,
																			0.158
																		],
																		[
																			-2.964,
																			0.085
																		],
																		[
																			0,
																			7.219
																		],
																		[
																			0,
																			3.704
																		],
																		[
																			5.536,
																			-0.568
																		],
																		[
																			2.724,
																			-0.279
																		],
																		[
																			0,
																			-6.808
																		],
																		[
																			0,
																			-3.494
																		],
																		[
																			0.001,
																			-1e-3
																		],
																		[
																			0,
																			0
																		],
																		[
																			0,
																			0
																		]
																	]
																}
															}
														},
														{
															ty: "tr",
															o: {
																a: 0,
																k: 100,
																ix: 2
															}
														}
													]
												},
												{
													ty: "fl",
													c: {
														a: 0,
														k: [
															1,
															1,
															1
														],
														ix: 2
													},
													o: {
														a: 0,
														k: 18,
														ix: 2
													},
													r: 1,
													bm: 0
												},
												{
													ty: "tr",
													o: {
														a: 0,
														k: 100,
														ix: 2
													}
												}
											]
										},
										{
											ty: "tr",
											p: {
												a: 0,
												k: [
													0,
													0
												],
												ix: 2
											},
											a: {
												a: 0,
												k: [
													14.1,
													18.4
												],
												ix: 2
											},
											o: {
												a: 0,
												k: 100,
												ix: 2
											}
										}
									]
								},
								{
									ty: "gr",
									it: [
										{
											ty: "sh",
											d: 1,
											ks: {
												a: 0,
												k: {
													c: true,
													v: [
														[
															0,
															8.16
														],
														[
															6.08,
															0.45
														],
														[
															22.69,
															0
														],
														[
															28.2,
															6.96
														],
														[
															28.2,
															27.36
														],
														[
															22.69,
															35.04
														],
														[
															6.08,
															36.77
														],
														[
															0,
															29.85
														],
														[
															0,
															8.16
														],
														[
															0,
															8.16
														],
														[
															0,
															8.16
														]
													],
													i: [
														[
															0,
															0
														],
														[
															-3.338,
															0.089
														],
														[
															-5.536,
															0.148
														],
														[
															0,
															-3.925
														],
														[
															0,
															-6.799
														],
														[
															3.063,
															-0.32
														],
														[
															5.536,
															-0.578
														],
														[
															0,
															4.173
														],
														[
															0,
															7.229
														],
														[
															0.001,
															0
														],
														[
															0,
															0
														]
													],
													o: [
														[
															0,
															-4.173
														],
														[
															5.536,
															-0.148
														],
														[
															3.063,
															-0.083
														],
														[
															0,
															6.799
														],
														[
															0,
															3.925
														],
														[
															-5.536,
															0.578
														],
														[
															-3.336,
															0.348
														],
														[
															0,
															-7.229
														],
														[
															-1e-3,
															0
														],
														[
															0,
															0
														],
														[
															0,
															0
														]
													]
												}
											}
										},
										{
											ty: "fl",
											c: {
												a: 0,
												k: [
													0,
													0.46,
													1
												],
												ix: 2
											},
											o: {
												a: 0,
												k: 78,
												ix: 2
											},
											r: 1,
											bm: 0
										},
										{
											ty: "tr",
											p: {
												a: 0,
												k: [
													0,
													0
												],
												ix: 2
											},
											a: {
												a: 0,
												k: [
													14.1,
													18.4
												],
												ix: 2
											},
											o: {
												a: 0,
												k: 100,
												ix: 2
											}
										}
									]
								},
								{
									ty: "tr",
									p: {
										a: 1,
										k: [
											{
												t: 121,
												s: [
													135.85,
													122
												],
												i: {
													x: [
														0.75
													],
													y: [
														0.75
													]
												},
												o: {
													x: [
														0.25
													],
													y: [
														0.25
													]
												}
											},
											{
												t: 145,
												s: [
													135.6,
													83.6
												]
											}
										],
										ix: 2
									},
									o: {
										a: 0,
										k: 100,
										ix: 2
									}
								}
							]
						}
					],
					ip: 0,
					op: 301,
					st: 0
				},
				{
					ddd: 0,
					ind: 7,
					ty: 3,
					sr: 1,
					ks: {
						p: {
							a: 0,
							k: [
								86.62,
								61.16
							],
							ix: 2
						},
						o: {
							a: 0,
							k: 100,
							ix: 2
						}
					},
					ao: 0,
					ip: 0,
					op: 301,
					st: 0
				},
				{
					ddd: 0,
					refId: "3",
					w: 92,
					h: 24,
					ind: 8,
					ty: 0,
					sr: 1,
					ks: {
						p: {
							a: 0,
							k: [
								-47,
								-12
							],
							ix: 2
						},
						o: {
							a: 1,
							k: [
								{
									t: 173,
									s: [
										0
									],
									i: {
										x: [
											0.75
										],
										y: [
											0.75
										]
									},
									o: {
										x: [
											0.25
										],
										y: [
											0.25
										]
									}
								},
								{
									t: 182,
									s: [
										100
									]
								}
							],
							ix: 2
						}
					},
					ao: 0,
					ip: 0,
					op: 301,
					st: 0,
					parent: 7
				},
				{
					ddd: 0,
					ind: 9,
					ty: 4,
					sr: 1,
					ks: {
						p: {
							a: 0,
							k: [
								1,
								0
							],
							ix: 2
						},
						o: {
							a: 0,
							k: 100,
							ix: 2
						}
					},
					ao: 0,
					shapes: [
						{
							ty: "gr",
							it: [
								{
									ty: "sh",
									d: 1,
									ks: {
										a: 0,
										k: {
											c: true,
											v: [
												[
													9.98,
													0.21
												],
												[
													10.04,
													1.51
												],
												[
													4.51,
													9.09
												],
												[
													3.39,
													9.24
												],
												[
													0.28,
													6.26
												],
												[
													0.2,
													4.94
												],
												[
													1.34,
													4.79
												],
												[
													3.85,
													7.2
												],
												[
													8.88,
													0.33
												],
												[
													9.98,
													0.21
												],
												[
													9.98,
													0.21
												],
												[
													9.98,
													0.21
												]
											],
											i: [
												[
													0,
													0
												],
												[
													0.287,
													-0.39
												],
												[
													1.846,
													-2.527
												],
												[
													0.33,
													0.315
												],
												[
													1.036,
													0.993
												],
												[
													-0.297,
													0.406
												],
												[
													-0.337,
													-0.323
												],
												[
													-0.834,
													-0.803
												],
												[
													-1.679,
													2.291
												],
												[
													-0.319,
													-0.325
												],
												[
													0,
													-1e-3
												],
												[
													0,
													0
												]
											],
											o: [
												[
													0.318,
													0.325
												],
												[
													-1.846,
													2.527
												],
												[
													-0.292,
													0.398
												],
												[
													-1.036,
													-0.993
												],
												[
													-0.337,
													-0.323
												],
												[
													0.295,
													-0.405
												],
												[
													0.834,
													0.803
												],
												[
													1.679,
													-2.291
												],
												[
													0.288,
													-0.392
												],
												[
													0,
													0.001
												],
												[
													0,
													0
												],
												[
													0,
													0
												]
											]
										}
									}
								},
								{
									ty: "fl",
									c: {
										a: 0,
										k: [
											0.106,
											0.81,
											0.483
										],
										ix: 2
									},
									o: {
										a: 0,
										k: 78,
										ix: 2
									},
									r: 1,
									bm: 0
								},
								{
									ty: "tr",
									p: {
										a: 1,
										k: [
											{
												t: 0,
												s: [
													122.44,
													130.03
												],
												i: {
													x: [
														0.75
													],
													y: [
														0.75
													]
												},
												o: {
													x: [
														0.25
													],
													y: [
														0.25
													]
												}
											},
											{
												t: 89,
												s: [
													122.44,
													130.03
												],
												i: {
													x: [
														0.75
													],
													y: [
														0.75
													]
												},
												o: {
													x: [
														0.25
													],
													y: [
														0.25
													]
												}
											},
											{
												t: 114,
												s: [
													122.44,
													79.03
												]
											}
										],
										ix: 2
									},
									a: {
										a: 0,
										k: [
											5.12,
											4.72
										],
										ix: 2
									},
									o: {
										a: 1,
										k: [
											{
												t: 180,
												s: [
													100
												],
												i: {
													x: [
														0.75
													],
													y: [
														0.75
													]
												},
												o: {
													x: [
														0.25
													],
													y: [
														0.25
													]
												}
											},
											{
												t: 195,
												s: [
													0
												]
											}
										],
										ix: 2
									}
								}
							]
						}
					],
					ip: 0,
					op: 301,
					st: 0
				},
				{
					ddd: 0,
					ind: 10,
					ty: 4,
					sr: 1,
					ks: {
						p: {
							a: 0,
							k: [
								1,
								0
							],
							ix: 2
						},
						o: {
							a: 0,
							k: 100,
							ix: 2
						}
					},
					ao: 0,
					shapes: [
						{
							ty: "gr",
							it: [
								{
									ty: "sh",
									d: 1,
									ks: {
										a: 0,
										k: {
											c: true,
											v: [
												[
													9.98,
													0.24
												],
												[
													10.04,
													1.53
												],
												[
													4.51,
													8.9
												],
												[
													3.39,
													9
												],
												[
													0.28,
													5.91
												],
												[
													0.2,
													4.58
												],
												[
													1.34,
													4.48
												],
												[
													3.85,
													6.99
												],
												[
													8.88,
													0.31
												],
												[
													9.98,
													0.23
												],
												[
													9.98,
													0.24
												],
												[
													9.98,
													0.24
												]
											],
											i: [
												[
													0,
													0
												],
												[
													0.287,
													-0.38
												],
												[
													1.846,
													-2.456
												],
												[
													0.33,
													0.329
												],
												[
													1.036,
													1.033
												],
												[
													-0.297,
													0.394
												],
												[
													-0.336,
													-0.337
												],
												[
													-0.834,
													-0.835
												],
												[
													-1.679,
													2.226
												],
												[
													-0.319,
													-0.337
												],
												[
													0,
													-1e-3
												],
												[
													0,
													0
												]
											],
											o: [
												[
													0.318,
													0.337
												],
												[
													-1.846,
													2.456
												],
												[
													-0.292,
													0.386
												],
												[
													-1.036,
													-1.033
												],
												[
													-0.337,
													-0.337
												],
												[
													0.295,
													-0.394
												],
												[
													0.834,
													0.835
												],
												[
													1.679,
													-2.226
												],
												[
													0.288,
													-0.38
												],
												[
													0,
													0.001
												],
												[
													0,
													0
												],
												[
													0,
													0
												]
											]
										}
									}
								},
								{
									ty: "fl",
									c: {
										a: 0,
										k: [
											0.106,
											0.81,
											0.483
										],
										ix: 2
									},
									o: {
										a: 0,
										k: 78,
										ix: 2
									},
									r: 1,
									bm: 0
								},
								{
									ty: "tr",
									p: {
										a: 1,
										k: [
											{
												t: 62,
												s: [
													122.44,
													130.03
												],
												i: {
													x: [
														0.75
													],
													y: [
														0.75
													]
												},
												o: {
													x: [
														0.25
													],
													y: [
														0.25
													]
												}
											},
											{
												t: 80,
												s: [
													122.44,
													60.03
												]
											}
										],
										ix: 2
									},
									a: {
										a: 0,
										k: [
											5.12,
											4.61
										],
										ix: 2
									},
									o: {
										a: 1,
										k: [
											{
												t: 80,
												s: [
													100
												],
												i: {
													x: [
														0.75
													],
													y: [
														0.75
													]
												},
												o: {
													x: [
														0.25
													],
													y: [
														0.25
													]
												}
											},
											{
												t: 180,
												s: [
													100
												],
												i: {
													x: [
														0.75
													],
													y: [
														0.75
													]
												},
												o: {
													x: [
														0.25
													],
													y: [
														0.25
													]
												}
											},
											{
												t: 195,
												s: [
													0
												]
											}
										],
										ix: 2
									}
								}
							]
						}
					],
					ip: 0,
					op: 301,
					st: 0
				},
				{
					ddd: 0,
					ind: 11,
					ty: 4,
					sr: 1,
					ks: {
						p: {
							a: 0,
							k: [
								1,
								0
							],
							ix: 2
						},
						o: {
							a: 0,
							k: 100,
							ix: 2
						}
					},
					ao: 0,
					shapes: [
						{
							ty: "gr",
							it: [
								{
									ty: "sh",
									d: 1,
									ks: {
										a: 0,
										k: {
											c: true,
											v: [
												[
													9.98,
													0.25
												],
												[
													10.04,
													1.55
												],
												[
													4.51,
													8.71
												],
												[
													3.39,
													8.77
												],
												[
													0.28,
													5.55
												],
												[
													0.2,
													4.22
												],
												[
													1.34,
													4.16
												],
												[
													3.84,
													6.77
												],
												[
													8.88,
													0.29
												],
												[
													9.98,
													0.25
												],
												[
													9.98,
													0.25
												],
												[
													9.98,
													0.25
												]
											],
											i: [
												[
													0,
													0
												],
												[
													0.287,
													-0.37
												],
												[
													1.846,
													-2.384
												],
												[
													0.33,
													0.34
												],
												[
													1.036,
													1.073
												],
												[
													-0.295,
													0.384
												],
												[
													-0.334,
													-0.35
												],
												[
													-0.834,
													-0.868
												],
												[
													-1.679,
													2.16
												],
												[
													-0.319,
													-0.35
												],
												[
													-1e-3,
													0
												],
												[
													0,
													0
												]
											],
											o: [
												[
													0.318,
													0.35
												],
												[
													-1.846,
													2.384
												],
												[
													-0.292,
													0.374
												],
												[
													-1.036,
													-1.073
												],
												[
													-0.337,
													-0.348
												],
												[
													0.295,
													-0.382
												],
												[
													0.834,
													0.868
												],
												[
													1.679,
													-2.16
												],
												[
													0.288,
													-0.368
												],
												[
													0.001,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												]
											]
										}
									}
								},
								{
									ty: "fl",
									c: {
										a: 0,
										k: [
											0.106,
											0.81,
											0.483
										],
										ix: 2
									},
									o: {
										a: 0,
										k: 78,
										ix: 2
									},
									r: 1,
									bm: 0
								},
								{
									ty: "tr",
									p: {
										a: 1,
										k: [
											{
												t: 28,
												s: [
													122.44,
													130.03
												],
												i: {
													x: [
														0.75
													],
													y: [
														0.75
													]
												},
												o: {
													x: [
														0.25
													],
													y: [
														0.25
													]
												}
											},
											{
												t: 45,
												s: [
													122.44,
													41.52
												],
												i: {
													x: [
														0.75
													],
													y: [
														0.75
													]
												},
												o: {
													x: [
														0.25
													],
													y: [
														0.25
													]
												}
											},
											{
												t: 180,
												s: [
													122.44,
													41.52
												]
											}
										],
										ix: 2
									},
									a: {
										a: 0,
										k: [
											5.12,
											4.5
										],
										ix: 2
									},
									o: {
										a: 1,
										k: [
											{
												t: 45,
												s: [
													100
												],
												i: {
													x: [
														0.75
													],
													y: [
														0.75
													]
												},
												o: {
													x: [
														0.25
													],
													y: [
														0.25
													]
												}
											},
											{
												t: 180,
												s: [
													100
												],
												i: {
													x: [
														0.75
													],
													y: [
														0.75
													]
												},
												o: {
													x: [
														0.25
													],
													y: [
														0.25
													]
												}
											},
											{
												t: 195,
												s: [
													0
												]
											}
										],
										ix: 2
									}
								}
							]
						}
					],
					ip: 0,
					op: 301,
					st: 0
				},
				{
					ddd: 0,
					ind: 12,
					ty: 3,
					sr: 1,
					ks: {
						p: {
							a: 0,
							k: [
								85.67,
								60.93
							],
							ix: 2
						},
						o: {
							a: 0,
							k: 100,
							ix: 2
						}
					},
					ao: 0,
					ip: 0,
					op: 301,
					st: 0
				},
				{
					ddd: 0,
					refId: "4",
					w: 92,
					h: 48,
					ind: 13,
					ty: 0,
					sr: 1,
					ks: {
						p: {
							a: 0,
							k: [
								-46,
								-24
							],
							ix: 2
						},
						o: {
							a: 1,
							k: [
								{
									t: 37,
									s: [
										0
									],
									i: {
										x: [
											0.75
										],
										y: [
											0.75
										]
									},
									o: {
										x: [
											0.25
										],
										y: [
											0.25
										]
									}
								},
								{
									t: 52,
									s: [
										100
									],
									i: {
										x: [
											0.75
										],
										y: [
											0.75
										]
									},
									o: {
										x: [
											0.25
										],
										y: [
											0.25
										]
									}
								},
								{
									t: 180,
									s: [
										100
									],
									i: {
										x: [
											0.75
										],
										y: [
											0.75
										]
									},
									o: {
										x: [
											0.25
										],
										y: [
											0.25
										]
									}
								},
								{
									t: 195,
									s: [
										0
									]
								}
							],
							ix: 2
						}
					},
					ao: 0,
					ip: 0,
					op: 301,
					st: 0,
					parent: 12
				},
				{
					ddd: 0,
					ind: 14,
					ty: 4,
					sr: 1,
					ks: {
						p: {
							a: 0,
							k: [
								1,
								0
							],
							ix: 2
						},
						o: {
							a: 0,
							k: 100,
							ix: 2
						}
					},
					ao: 0,
					shapes: [
						{
							ty: "gr",
							it: [
								{
									ty: "sh",
									d: 1,
									ks: {
										a: 0,
										k: {
											c: true,
											v: [
												[
													0,
													6.71
												],
												[
													6.73,
													0.01
												],
												[
													100.14,
													4.2
												],
												[
													104.71,
													10.12
												],
												[
													104.71,
													52.56
												],
												[
													100.14,
													58.6
												],
												[
													6.73,
													65.32
												],
												[
													0,
													58.79
												],
												[
													0,
													6.71
												],
												[
													0,
													6.71
												]
											],
											i: [
												[
													0,
													0
												],
												[
													-3.699,
													-0.167
												],
												[
													-31.137,
													-1.398
												],
												[
													0,
													-3.153
												],
												[
													0,
													-14.146
												],
												[
													2.535,
													-0.181
												],
												[
													31.137,
													-2.241
												],
												[
													0,
													3.874
												],
												[
													0,
													17.36
												],
												[
													0,
													0
												]
											],
											o: [
												[
													0,
													-3.872
												],
												[
													31.137,
													1.398
												],
												[
													2.535,
													0.114
												],
												[
													0,
													14.146
												],
												[
													0,
													3.155
												],
												[
													-31.137,
													2.241
												],
												[
													-3.699,
													0.266
												],
												[
													0,
													-17.36
												],
												[
													0,
													0
												],
												[
													0,
													0
												]
											]
										}
									}
								},
								{
									ty: "fl",
									c: {
										a: 0,
										k: [
											1,
											1,
											1
										],
										ix: 2
									},
									o: {
										a: 0,
										k: 100,
										ix: 2
									},
									r: 1,
									bm: 0
								},
								{
									ty: "tr",
									p: {
										a: 1,
										k: [
											{
												t: 0,
												s: [
													83.37,
													160.69
												],
												i: {
													x: [
														0.75
													],
													y: [
														0.75
													]
												},
												o: {
													x: [
														0.25
													],
													y: [
														0.25
													]
												}
											},
											{
												t: 20,
												s: [
													83.85,
													61
												]
											}
										],
										ix: 2
									},
									a: {
										a: 0,
										k: [
											52.36,
											32.67
										],
										ix: 2
									},
									o: {
										a: 0,
										k: 100,
										ix: 2
									}
								}
							]
						}
					],
					ip: 0,
					op: 301,
					st: 0
				},
				{
					ddd: 0,
					ind: 15,
					ty: 3,
					sr: 1,
					ks: {
						p: {
							a: 0,
							k: [
								82.98,
								13.1
							],
							ix: 2
						},
						a: {
							a: 0,
							k: [
								58.86,
								13.1
							],
							ix: 2
						},
						o: {
							a: 0,
							k: 100,
							ix: 2
						}
					},
					ao: 0,
					ip: 0,
					op: 301,
					st: 0
				},
				{
					ddd: 0,
					refId: "5",
					w: 118,
					h: 28,
					ind: 16,
					ty: 0,
					sr: 1,
					ks: {
						p: {
							a: 0,
							k: [
								0,
								-1
							],
							ix: 2
						},
						o: {
							a: 0,
							k: 10,
							ix: 2
						}
					},
					ao: 0,
					ip: 0,
					op: 301,
					st: 0,
					parent: 15
				},
				{
					ddd: 0,
					ind: 17,
					ty: 4,
					sr: 1,
					ks: {
						p: {
							a: 0,
							k: [
								1,
								0
							],
							ix: 2
						},
						o: {
							a: 0,
							k: 100,
							ix: 2
						}
					},
					ao: 0,
					shapes: [
						{
							ty: "gr",
							it: [
								{
									ty: "gr",
									it: [
										{
											ty: "gr",
											it: [
												{
													ty: "sh",
													d: 1,
													ks: {
														a: 0,
														k: {
															c: true,
															v: [
																[
																	11.76,
																	0.05
																],
																[
																	0,
																	11.12
																],
																[
																	0,
																	90.34
																],
																[
																	11.76,
																	101.51
																],
																[
																	110.01,
																	93.05
																],
																[
																	117.73,
																	82.7
																],
																[
																	117.73,
																	19.75
																],
																[
																	110.01,
																	9.33
																],
																[
																	11.76,
																	0.05
																],
																[
																	11.76,
																	0.05
																]
															],
															i: [
																[
																	0,
																	0
																],
																[
																	0,
																	-6.73
																],
																[
																	0,
																	-26.404
																],
																[
																	-6.436,
																	0.555
																],
																[
																	-32.749,
																	2.821
																],
																[
																	0,
																	5.348
																],
																[
																	0,
																	20.983
																],
																[
																	4.293,
																	0.405
																],
																[
																	32.749,
																	3.094
																],
																[
																	0,
																	0
																]
															],
															o: [
																[
																	-6.436,
																	-0.608
																],
																[
																	0,
																	26.404
																],
																[
																	0,
																	6.73
																],
																[
																	32.749,
																	-2.821
																],
																[
																	4.293,
																	-0.37
																],
																[
																	0,
																	-20.983
																],
																[
																	0,
																	-5.348
																],
																[
																	-32.749,
																	-3.094
																],
																[
																	0,
																	0
																],
																[
																	0,
																	0
																]
															]
														}
													}
												},
												{
													ty: "tr",
													o: {
														a: 0,
														k: 100,
														ix: 2
													}
												}
											]
										},
										{
											ty: "gr",
											it: [
												{
													ty: "sh",
													d: 1,
													ks: {
														a: 0,
														k: {
															c: true,
															v: [
																[
																	110.01,
																	10.15
																],
																[
																	11.76,
																	1.04
																],
																[
																	1,
																	11.2
																],
																[
																	1,
																	90.27
																],
																[
																	11.76,
																	100.52
																],
																[
																	110.01,
																	92.23
																],
																[
																	117.09,
																	82.74
																],
																[
																	117.09,
																	19.7
																],
																[
																	110.01,
																	10.15
																],
																[
																	110.01,
																	10.15
																]
															],
															i: [
																[
																	0,
																	0
																],
																[
																	32.749,
																	3.037
																],
																[
																	0,
																	-6.159
																],
																[
																	0,
																	-26.358
																],
																[
																	-5.895,
																	0.498
																],
																[
																	-32.749,
																	2.763
																],
																[
																	0,
																	4.909
																],
																[
																	0,
																	21.012
																],
																[
																	3.937,
																	0.366
																],
																[
																	0,
																	0
																]
															],
															o: [
																[
																	-32.749,
																	-3.037
																],
																[
																	-5.895,
																	-0.547
																],
																[
																	0,
																	26.358
																],
																[
																	0,
																	6.159
																],
																[
																	32.749,
																	-2.763
																],
																[
																	3.937,
																	-0.333
																],
																[
																	0,
																	-21.012
																],
																[
																	0,
																	-4.909
																],
																[
																	0,
																	0
																],
																[
																	0,
																	0
																]
															]
														}
													}
												},
												{
													ty: "tr",
													o: {
														a: 0,
														k: 100,
														ix: 2
													}
												}
											]
										},
										{
											ty: "fl",
											c: {
												a: 0,
												k: [
													0.61,
													0.832,
													1
												],
												ix: 2
											},
											o: {
												a: 0,
												k: 80,
												ix: 2
											},
											r: 1,
											bm: 0
										},
										{
											ty: "tr",
											o: {
												a: 0,
												k: 100,
												ix: 2
											}
										}
									]
								},
								{
									ty: "tr",
									p: {
										a: 0,
										k: [
											81.98,
											50.78
										],
										ix: 2
									},
									a: {
										a: 0,
										k: [
											58.86,
											50.78
										],
										ix: 2
									},
									o: {
										a: 0,
										k: 100,
										ix: 2
									}
								}
							]
						}
					],
					ip: 0,
					op: 301,
					st: 0
				},
				{
					ddd: 0,
					ind: 18,
					ty: 3,
					sr: 1,
					ks: {
						p: {
							a: 0,
							k: [
								82.98,
								50.78
							],
							ix: 2
						},
						a: {
							a: 0,
							k: [
								58.86,
								50.78
							],
							ix: 2
						},
						o: {
							a: 0,
							k: 100,
							ix: 2
						}
					},
					ao: 0,
					ip: 0,
					op: 301,
					st: 0
				},
				{
					ddd: 0,
					refId: "6",
					w: 118,
					h: 103,
					ind: 19,
					ty: 0,
					sr: 1,
					ks: {
						p: {
							a: 0,
							k: [
								0,
								-1
							],
							ix: 2
						},
						o: {
							a: 0,
							k: 80,
							ix: 2
						}
					},
					ao: 0,
					ip: 0,
					op: 301,
					st: 0,
					parent: 18
				},
				{
					ddd: 0,
					ind: 20,
					ty: 4,
					sr: 1,
					ks: {
						p: {
							a: 0,
							k: [
								1,
								0
							],
							ix: 2
						},
						o: {
							a: 0,
							k: 100,
							ix: 2
						}
					},
					ao: 0,
					shapes: [
						{
							ty: "rc",
							d: 1,
							s: {
								a: 0,
								k: [
									152,
									102
								],
								ix: 2
							},
							p: {
								a: 0,
								k: [
									75,
									51
								],
								ix: 2
							},
							r: {
								a: 0,
								k: 0,
								ix: 2
							}
						},
						{
							ty: "fl",
							c: {
								a: 0,
								k: [
									0,
									0,
									0
								],
								ix: 2
							},
							o: {
								a: 0,
								k: 0,
								ix: 2
							},
							r: 1,
							bm: 0
						}
					],
					ip: 0,
					op: 301,
					st: 0
				}
			]
		},
		{
			id: "7",
			layers: [
				{
					ddd: 0,
					ind: 21,
					ty: 4,
					sr: 1,
					ks: {
						p: {
							a: 0,
							k: [
								1,
								0
							],
							ix: 2
						},
						o: {
							a: 0,
							k: 100,
							ix: 2
						}
					},
					td: 1,
					ao: 0,
					shapes: [
						{
							ty: "gr",
							it: [
								{
									ty: "gr",
									it: [
										{
											ty: "rc",
											d: 1,
											s: {
												a: 0,
												k: [
													151.7,
													102
												],
												ix: 2
											},
											p: {
												a: 0,
												k: [
													0,
													0
												],
												ix: 2
											},
											r: {
												a: 0,
												k: 0,
												ix: 2
											}
										},
										{
											ty: "fl",
											c: {
												a: 0,
												k: [
													0,
													0,
													0
												],
												ix: 2
											},
											o: {
												a: 0,
												k: 100,
												ix: 2
											},
											r: 1,
											bm: 0
										},
										{
											ty: "tr",
											p: {
												a: 0,
												k: [
													75.85,
													51
												],
												ix: 2
											},
											o: {
												a: 0,
												k: 100,
												ix: 2
											}
										}
									]
								},
								{
									ty: "tr",
									p: {
										a: 0,
										k: [
											74.85,
											51
										],
										ix: 2
									},
									a: {
										a: 0,
										k: [
											75.85,
											51
										],
										ix: 2
									},
									o: {
										a: 0,
										k: 100,
										ix: 2
									}
								}
							]
						}
					],
					ip: 0,
					op: 301,
					st: 0
				},
				{
					ddd: 0,
					refId: "2",
					w: 152,
					h: 102,
					ind: 22,
					ty: 0,
					sr: 1,
					ks: {
						p: {
							a: 0,
							k: [
								75,
								51
							],
							ix: 2
						},
						a: {
							a: 0,
							k: [
								75,
								51
							],
							ix: 2
						},
						o: {
							a: 0,
							k: 100,
							ix: 2
						}
					},
					ao: 0,
					ip: 0,
					op: 301,
					st: 0,
					tt: 1
				}
			]
		},
		{
			id: "3",
			layers: [
				{
					ddd: 0,
					ind: 23,
					ty: 4,
					sr: 1,
					ks: {
						p: {
							a: 0,
							k: [
								47,
								12
							],
							ix: 2
						},
						o: {
							a: 0,
							k: 100,
							ix: 2
						}
					},
					ao: 0,
					shapes: [
						{
							ty: "gr",
							it: [
								{
									ty: "sh",
									d: 1,
									ks: {
										a: 0,
										k: {
											c: true,
											v: [
												[
													0,
													0.49
												],
												[
													0.47,
													0
												],
												[
													90.67,
													0.62
												],
												[
													91,
													1.03
												],
												[
													90.67,
													1.44
												],
												[
													0.47,
													0.99
												],
												[
													0,
													0.49
												],
												[
													0,
													0.49
												]
											],
											i: [
												[
													0,
													0
												],
												[
													-0.26,
													-2e-3
												],
												[
													-30.065,
													-0.205
												],
												[
													0,
													-0.228
												],
												[
													0.183,
													0
												],
												[
													30.065,
													0.152
												],
												[
													0,
													0.274
												],
												[
													0,
													0
												]
											],
											o: [
												[
													0,
													-0.272
												],
												[
													30.065,
													0.205
												],
												[
													0.183,
													0
												],
												[
													0,
													0.228
												],
												[
													-30.065,
													-0.152
												],
												[
													-0.26,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												]
											]
										}
									}
								},
								{
									ty: "fl",
									c: {
										a: 0,
										k: [
											0.875,
											0.88,
											0.891
										],
										ix: 2
									},
									o: {
										a: 0,
										k: 68,
										ix: 2
									},
									r: 1,
									bm: 0
								},
								{
									ty: "tr",
									p: {
										a: 0,
										k: [
											-1,
											-11.11
										],
										ix: 2
									},
									a: {
										a: 0,
										k: [
											45.5,
											0.72
										],
										ix: 2
									},
									o: {
										a: 0,
										k: 100,
										ix: 2
									}
								}
							]
						}
					],
					ip: 0,
					op: 301,
					st: 0
				},
				{
					ddd: 0,
					ind: 24,
					ty: 4,
					sr: 1,
					ks: {
						p: {
							a: 0,
							k: [
								47,
								12
							],
							ix: 2
						},
						o: {
							a: 0,
							k: 100,
							ix: 2
						}
					},
					ao: 0,
					shapes: [
						{
							ty: "gr",
							it: [
								{
									ty: "sh",
									d: 1,
									ks: {
										a: 0,
										k: {
											c: true,
											v: [
												[
													0,
													3.57
												],
												[
													0.47,
													3.06
												],
												[
													90.67,
													0
												],
												[
													91,
													0.4
												],
												[
													90.67,
													0.83
												],
												[
													0.47,
													4.05
												],
												[
													0,
													3.57
												],
												[
													0,
													3.57
												]
											],
											i: [
												[
													0,
													0
												],
												[
													-0.26,
													0.01
												],
												[
													-30.065,
													1.02
												],
												[
													0,
													-0.228
												],
												[
													0.183,
													-8e-3
												],
												[
													30.065,
													-1.073
												],
												[
													0,
													0.272
												],
												[
													0,
													0
												]
											],
											o: [
												[
													0,
													-0.272
												],
												[
													30.065,
													-1.02
												],
												[
													0.183,
													-6e-3
												],
												[
													0,
													0.228
												],
												[
													-30.065,
													1.073
												],
												[
													-0.26,
													0.01
												],
												[
													0,
													0
												],
												[
													0,
													0
												]
											]
										}
									}
								},
								{
									ty: "fl",
									c: {
										a: 0,
										k: [
											0.875,
											0.88,
											0.891
										],
										ix: 2
									},
									o: {
										a: 0,
										k: 68,
										ix: 2
									},
									r: 1,
									bm: 0
								},
								{
									ty: "tr",
									p: {
										a: 0,
										k: [
											-1,
											9.81
										],
										ix: 2
									},
									a: {
										a: 0,
										k: [
											45.5,
											2.02
										],
										ix: 2
									},
									o: {
										a: 0,
										k: 100,
										ix: 2
									}
								}
							]
						}
					],
					ip: 0,
					op: 301,
					st: 0
				}
			]
		},
		{
			id: "4",
			layers: [
				{
					ddd: 0,
					ind: 25,
					ty: 4,
					sr: 1,
					ks: {
						p: {
							a: 0,
							k: [
								46,
								24
							],
							ix: 2
						},
						o: {
							a: 0,
							k: 100,
							ix: 2
						}
					},
					ao: 0,
					shapes: [
						{
							ty: "gr",
							it: [
								{
									ty: "sh",
									d: 1,
									ks: {
										a: 0,
										k: {
											c: true,
											v: [
												[
													0,
													3.57
												],
												[
													0.47,
													3.06
												],
												[
													90.67,
													0
												],
												[
													91,
													0.4
												],
												[
													90.67,
													0.83
												],
												[
													0.47,
													4.05
												],
												[
													0,
													3.57
												],
												[
													0,
													3.57
												]
											],
											i: [
												[
													0,
													0
												],
												[
													-0.26,
													0.01
												],
												[
													-30.065,
													1.02
												],
												[
													0,
													-0.228
												],
												[
													0.183,
													-8e-3
												],
												[
													30.065,
													-1.073
												],
												[
													0,
													0.272
												],
												[
													0,
													0
												]
											],
											o: [
												[
													0,
													-0.272
												],
												[
													30.065,
													-1.02
												],
												[
													0.183,
													-6e-3
												],
												[
													0,
													0.228
												],
												[
													-30.065,
													1.073
												],
												[
													-0.26,
													0.01
												],
												[
													0,
													0
												],
												[
													0,
													0
												]
											]
										}
									}
								},
								{
									ty: "fl",
									c: {
										a: 0,
										k: [
											0.875,
											0.88,
											0.891
										],
										ix: 2
									},
									o: {
										a: 0,
										k: 68,
										ix: 2
									},
									r: 1,
									bm: 0
								},
								{
									ty: "tr",
									p: {
										a: 0,
										k: [
											0,
											10.04
										],
										ix: 2
									},
									a: {
										a: 0,
										k: [
											45.5,
											2.02
										],
										ix: 2
									},
									o: {
										a: 0,
										k: 100,
										ix: 2
									}
								}
							]
						}
					],
					ip: 0,
					op: 301,
					st: 0
				},
				{
					ddd: 0,
					ind: 26,
					ty: 4,
					sr: 1,
					ks: {
						p: {
							a: 0,
							k: [
								46,
								24
							],
							ix: 2
						},
						o: {
							a: 0,
							k: 100,
							ix: 2
						}
					},
					ao: 0,
					shapes: [
						{
							ty: "gr",
							it: [
								{
									ty: "sh",
									d: 1,
									ks: {
										a: 0,
										k: {
											c: true,
											v: [
												[
													0,
													0.49
												],
												[
													0.47,
													0
												],
												[
													90.67,
													0.62
												],
												[
													91,
													1.03
												],
												[
													90.67,
													1.44
												],
												[
													0.47,
													0.99
												],
												[
													0,
													0.49
												],
												[
													0,
													0.49
												]
											],
											i: [
												[
													0,
													0
												],
												[
													-0.26,
													-2e-3
												],
												[
													-30.065,
													-0.205
												],
												[
													0,
													-0.228
												],
												[
													0.183,
													0
												],
												[
													30.065,
													0.152
												],
												[
													0,
													0.274
												],
												[
													0,
													0
												]
											],
											o: [
												[
													0,
													-0.272
												],
												[
													30.065,
													0.205
												],
												[
													0.183,
													0
												],
												[
													0,
													0.228
												],
												[
													-30.065,
													-0.152
												],
												[
													-0.26,
													0
												],
												[
													0,
													0
												],
												[
													0,
													0
												]
											]
										}
									}
								},
								{
									ty: "fl",
									c: {
										a: 0,
										k: [
											0.875,
											0.88,
											0.891
										],
										ix: 2
									},
									o: {
										a: 0,
										k: 68,
										ix: 2
									},
									r: 1,
									bm: 0
								},
								{
									ty: "tr",
									p: {
										a: 0,
										k: [
											0,
											-10.89
										],
										ix: 2
									},
									a: {
										a: 0,
										k: [
											45.5,
											0.72
										],
										ix: 2
									},
									o: {
										a: 0,
										k: 100,
										ix: 2
									}
								}
							]
						}
					],
					ip: 0,
					op: 301,
					st: 0
				},
				{
					ddd: 0,
					ind: 27,
					ty: 3,
					sr: 1,
					ks: {
						p: {
							a: 0,
							k: [
								54.59,
								43.05
							],
							ix: 2
						},
						a: {
							a: 0,
							k: [
								11.74,
								3.77
							],
							ix: 2
						},
						o: {
							a: 0,
							k: 100,
							ix: 2
						}
					},
					ao: 0,
					ip: 0,
					op: 301,
					st: 0
				},
				{
					ddd: 0,
					refId: "8",
					w: 24,
					h: 9,
					ind: 28,
					ty: 0,
					sr: 1,
					ks: {
						p: {
							a: 0,
							k: [
								0,
								-1
							],
							ix: 2
						},
						o: {
							a: 0,
							k: 80,
							ix: 2
						}
					},
					ao: 0,
					ip: 0,
					op: 301,
					st: 0,
					parent: 27
				},
				{
					ddd: 0,
					ind: 29,
					ty: 3,
					sr: 1,
					ks: {
						p: {
							a: 0,
							k: [
								17.04,
								45.04
							],
							ix: 2
						},
						a: {
							a: 0,
							k: [
								15.13,
								2.63
							],
							ix: 2
						},
						o: {
							a: 0,
							k: 100,
							ix: 2
						}
					},
					ao: 0,
					ip: 0,
					op: 301,
					st: 0
				},
				{
					ddd: 0,
					refId: "9",
					w: 31,
					h: 7,
					ind: 30,
					ty: 0,
					sr: 1,
					ks: {
						p: {
							a: 0,
							k: [
								0,
								-1
							],
							ix: 2
						},
						o: {
							a: 0,
							k: 50,
							ix: 2
						}
					},
					ao: 0,
					ip: 0,
					op: 301,
					st: 0,
					parent: 29
				},
				{
					ddd: 0,
					ind: 31,
					ty: 3,
					sr: 1,
					ks: {
						p: {
							a: 0,
							k: [
								54.59,
								23.51
							],
							ix: 2
						},
						a: {
							a: 0,
							k: [
								11.74,
								3.43
							],
							ix: 2
						},
						o: {
							a: 0,
							k: 100,
							ix: 2
						}
					},
					ao: 0,
					ip: 0,
					op: 301,
					st: 0
				},
				{
					ddd: 0,
					refId: "a",
					w: 24,
					h: 8,
					ind: 32,
					ty: 0,
					sr: 1,
					ks: {
						p: {
							a: 0,
							k: [
								0,
								-1
							],
							ix: 2
						},
						o: {
							a: 0,
							k: 80,
							ix: 2
						}
					},
					ao: 0,
					ip: 0,
					op: 301,
					st: 0,
					parent: 31
				},
				{
					ddd: 0,
					ind: 33,
					ty: 3,
					sr: 1,
					ks: {
						p: {
							a: 0,
							k: [
								13.68,
								24.08
							],
							ix: 2
						},
						a: {
							a: 0,
							k: [
								11.77,
								2.07
							],
							ix: 2
						},
						o: {
							a: 0,
							k: 100,
							ix: 2
						}
					},
					ao: 0,
					ip: 0,
					op: 301,
					st: 0
				},
				{
					ddd: 0,
					refId: "b",
					w: 25,
					h: 6,
					ind: 34,
					ty: 0,
					sr: 1,
					ks: {
						p: {
							a: 0,
							k: [
								-1,
								-1
							],
							ix: 2
						},
						o: {
							a: 0,
							k: 50,
							ix: 2
						}
					},
					ao: 0,
					ip: 0,
					op: 301,
					st: 0,
					parent: 33
				},
				{
					ddd: 0,
					ind: 35,
					ty: 3,
					sr: 1,
					ks: {
						p: {
							a: 0,
							k: [
								54.59,
								3.85
							],
							ix: 2
						},
						a: {
							a: 0,
							k: [
								11.74,
								3.52
							],
							ix: 2
						},
						o: {
							a: 0,
							k: 100,
							ix: 2
						}
					},
					ao: 0,
					ip: 0,
					op: 301,
					st: 0
				},
				{
					ddd: 0,
					refId: "c",
					w: 24,
					h: 9,
					ind: 36,
					ty: 0,
					sr: 1,
					ks: {
						p: {
							a: 0,
							k: [
								0,
								-1
							],
							ix: 2
						},
						o: {
							a: 0,
							k: 80,
							ix: 2
						}
					},
					ao: 0,
					ip: 0,
					op: 301,
					st: 0,
					parent: 35
				},
				{
					ddd: 0,
					ind: 37,
					ty: 3,
					sr: 1,
					ks: {
						p: {
							a: 0,
							k: [
								17.04,
								2.94
							],
							ix: 2
						},
						a: {
							a: 0,
							k: [
								15.13,
								2.24
							],
							ix: 2
						},
						o: {
							a: 0,
							k: 100,
							ix: 2
						}
					},
					ao: 0,
					ip: 0,
					op: 301,
					st: 0
				},
				{
					ddd: 0,
					refId: "d",
					w: 31,
					h: 6,
					ind: 38,
					ty: 0,
					sr: 1,
					ks: {
						p: {
							a: 0,
							k: [
								0,
								-1
							],
							ix: 2
						},
						o: {
							a: 0,
							k: 50,
							ix: 2
						}
					},
					ao: 0,
					ip: 0,
					op: 301,
					st: 0,
					parent: 37
				}
			]
		},
		{
			id: "8",
			layers: [
				{
					ddd: 0,
					ind: 39,
					ty: 4,
					sr: 1,
					ks: {
						p: {
							a: 0,
							k: [
								0,
								1
							],
							ix: 2
						},
						o: {
							a: 0,
							k: 100,
							ix: 2
						}
					},
					ao: 0,
					shapes: [
						{
							ty: "gr",
							it: [
								{
									ty: "sh",
									d: 1,
									ks: {
										a: 0,
										k: {
											c: true,
											v: [
												[
													0,
													4.34
												],
												[
													2.97,
													0.83
												],
												[
													20.74,
													0
												],
												[
													23.47,
													3.09
												],
												[
													20.74,
													6.48
												],
												[
													2.97,
													7.54
												],
												[
													0,
													4.34
												],
												[
													0,
													4.34
												]
											],
											i: [
												[
													0,
													0
												],
												[
													-1.636,
													0.077
												],
												[
													-5.923,
													0.277
												],
												[
													0,
													-1.779
												],
												[
													1.516,
													-0.091
												],
												[
													5.923,
													-0.354
												],
												[
													0,
													1.862
												],
												[
													0,
													0
												]
											],
											o: [
												[
													0,
													-1.862
												],
												[
													5.923,
													-0.277
												],
												[
													1.514,
													-0.071
												],
												[
													0,
													1.777
												],
												[
													-5.923,
													0.354
												],
												[
													-1.636,
													0.099
												],
												[
													0,
													0
												],
												[
													0,
													0
												]
											]
										}
									}
								},
								{
									ty: "fl",
									c: {
										a: 0,
										k: [
											0.875,
											0.88,
											0.891
										],
										ix: 2
									},
									o: {
										a: 0,
										k: 68,
										ix: 2
									},
									r: 1,
									bm: 0
								},
								{
									ty: "tr",
									p: {
										a: 0,
										k: [
											11.74,
											3.77
										],
										ix: 2
									},
									a: {
										a: 0,
										k: [
											11.74,
											3.77
										],
										ix: 2
									},
									o: {
										a: 0,
										k: 100,
										ix: 2
									}
								}
							]
						}
					],
					ip: 0,
					op: 301,
					st: 0
				}
			]
		},
		{
			id: "9",
			layers: [
				{
					ddd: 0,
					ind: 40,
					ty: 4,
					sr: 1,
					ks: {
						p: {
							a: 0,
							k: [
								0,
								1
							],
							ix: 2
						},
						o: {
							a: 0,
							k: 100,
							ix: 2
						}
					},
					ao: 0,
					shapes: [
						{
							ty: "gr",
							it: [
								{
									ty: "sh",
									d: 1,
									ks: {
										a: 0,
										k: {
											c: true,
											v: [
												[
													0,
													3.39
												],
												[
													1.88,
													1.33
												],
												[
													28.56,
													0
												],
												[
													30.25,
													1.78
												],
												[
													28.56,
													3.74
												],
												[
													1.88,
													5.25
												],
												[
													0,
													3.39
												],
												[
													0,
													3.39
												]
											],
											i: [
												[
													0,
													0
												],
												[
													-1.035,
													0.051
												],
												[
													-8.896,
													0.442
												],
												[
													0,
													-1.028
												],
												[
													0.935,
													-0.053
												],
												[
													8.896,
													-0.505
												],
												[
													0,
													1.087
												],
												[
													0,
													0
												]
											],
											o: [
												[
													0,
													-1.088
												],
												[
													8.896,
													-0.442
												],
												[
													0.933,
													-0.047
												],
												[
													0,
													1.028
												],
												[
													-8.896,
													0.505
												],
												[
													-1.033,
													0.059
												],
												[
													0,
													0
												],
												[
													0,
													0
												]
											]
										}
									}
								},
								{
									ty: "fl",
									c: {
										a: 0,
										k: [
											0,
											0.46,
											1
										],
										ix: 2
									},
									o: {
										a: 0,
										k: 78,
										ix: 2
									},
									r: 1,
									bm: 0
								},
								{
									ty: "tr",
									p: {
										a: 0,
										k: [
											15.13,
											2.63
										],
										ix: 2
									},
									a: {
										a: 0,
										k: [
											15.13,
											2.63
										],
										ix: 2
									},
									o: {
										a: 0,
										k: 100,
										ix: 2
									}
								}
							]
						}
					],
					ip: 0,
					op: 301,
					st: 0
				}
			]
		},
		{
			id: "a",
			layers: [
				{
					ddd: 0,
					ind: 41,
					ty: 4,
					sr: 1,
					ks: {
						p: {
							a: 0,
							k: [
								0,
								1
							],
							ix: 2
						},
						o: {
							a: 0,
							k: 100,
							ix: 2
						}
					},
					ao: 0,
					shapes: [
						{
							ty: "gr",
							it: [
								{
									ty: "sh",
									d: 1,
									ks: {
										a: 0,
										k: {
											c: true,
											v: [
												[
													0,
													3.54
												],
												[
													2.97,
													0.14
												],
												[
													20.73,
													0
												],
												[
													23.47,
													3.2
												],
												[
													20.73,
													6.48
												],
												[
													2.97,
													6.86
												],
												[
													0,
													3.54
												],
												[
													0,
													3.54
												]
											],
											i: [
												[
													0,
													0
												],
												[
													-1.638,
													0.014
												],
												[
													-5.92,
													0.047
												],
												[
													0,
													-1.781
												],
												[
													1.518,
													-0.032
												],
												[
													5.92,
													-0.124
												],
												[
													0,
													1.864
												],
												[
													0,
													0
												]
											],
											o: [
												[
													0,
													-1.866
												],
												[
													5.92,
													-0.047
												],
												[
													1.518,
													-0.012
												],
												[
													0,
													1.781
												],
												[
													-5.92,
													0.124
												],
												[
													-1.638,
													0.033
												],
												[
													0,
													0
												],
												[
													0,
													0
												]
											]
										}
									}
								},
								{
									ty: "fl",
									c: {
										a: 0,
										k: [
											0.875,
											0.88,
											0.891
										],
										ix: 2
									},
									o: {
										a: 0,
										k: 68,
										ix: 2
									},
									r: 1,
									bm: 0
								},
								{
									ty: "tr",
									p: {
										a: 0,
										k: [
											11.74,
											3.43
										],
										ix: 2
									},
									a: {
										a: 0,
										k: [
											11.74,
											3.43
										],
										ix: 2
									},
									o: {
										a: 0,
										k: 100,
										ix: 2
									}
								}
							]
						}
					],
					ip: 0,
					op: 301,
					st: 0
				}
			]
		},
		{
			id: "b",
			layers: [
				{
					ddd: 0,
					ind: 42,
					ty: 4,
					sr: 1,
					ks: {
						p: {
							a: 0,
							k: [
								1,
								1
							],
							ix: 2
						},
						o: {
							a: 0,
							k: 100,
							ix: 2
						}
					},
					ao: 0,
					shapes: [
						{
							ty: "gr",
							it: [
								{
									ty: "sh",
									d: 1,
									ks: {
										a: 0,
										k: {
											c: true,
											v: [
												[
													0,
													2.21
												],
												[
													1.88,
													0.22
												],
												[
													21.8,
													0
												],
												[
													23.53,
													1.87
												],
												[
													21.8,
													3.79
												],
												[
													1.88,
													4.14
												],
												[
													0,
													2.21
												],
												[
													0,
													2.21
												],
												[
													0,
													2.21
												]
											],
											i: [
												[
													0,
													0
												],
												[
													-1.035,
													0.012
												],
												[
													-6.641,
													0.072
												],
												[
													0,
													-1.043
												],
												[
													0.959,
													-0.018
												],
												[
													6.641,
													-0.119
												],
												[
													0,
													1.087
												],
												[
													0,
													0.001
												],
												[
													0,
													0
												]
											],
											o: [
												[
													0,
													-1.089
												],
												[
													6.641,
													-0.072
												],
												[
													0.957,
													-0.01
												],
												[
													0,
													1.041
												],
												[
													-6.641,
													0.119
												],
												[
													-1.033,
													0.018
												],
												[
													0,
													-1e-3
												],
												[
													0,
													0
												],
												[
													0,
													0
												]
											]
										}
									}
								},
								{
									ty: "fl",
									c: {
										a: 0,
										k: [
											0,
											0.46,
											1
										],
										ix: 2
									},
									o: {
										a: 0,
										k: 78,
										ix: 2
									},
									r: 1,
									bm: 0
								},
								{
									ty: "tr",
									p: {
										a: 0,
										k: [
											11.77,
											2.07
										],
										ix: 2
									},
									a: {
										a: 0,
										k: [
											11.77,
											2.07
										],
										ix: 2
									},
									o: {
										a: 0,
										k: 100,
										ix: 2
									}
								}
							]
						}
					],
					ip: 0,
					op: 301,
					st: 0
				}
			]
		},
		{
			id: "c",
			layers: [
				{
					ddd: 0,
					ind: 43,
					ty: 4,
					sr: 1,
					ks: {
						p: {
							a: 0,
							k: [
								0,
								1
							],
							ix: 2
						},
						o: {
							a: 0,
							k: 100,
							ix: 2
						}
					},
					ao: 0,
					shapes: [
						{
							ty: "gr",
							it: [
								{
									ty: "sh",
									d: 1,
									ks: {
										a: 0,
										k: {
											c: true,
											v: [
												[
													0,
													3.29
												],
												[
													2.98,
													0
												],
												[
													20.73,
													0.55
												],
												[
													23.47,
													3.86
												],
												[
													20.73,
													7.04
												],
												[
													2.98,
													6.73
												],
												[
													0,
													3.29
												],
												[
													0,
													3.29
												]
											],
											i: [
												[
													0,
													0
												],
												[
													-1.64,
													-0.051
												],
												[
													-5.919,
													-0.183
												],
												[
													0,
													-1.783
												],
												[
													1.518,
													0.026
												],
												[
													5.919,
													0.106
												],
												[
													0,
													1.868
												],
												[
													0,
													0
												]
											],
											o: [
												[
													0,
													-1.868
												],
												[
													5.919,
													0.183
												],
												[
													1.518,
													0.047
												],
												[
													0,
													1.781
												],
												[
													-5.919,
													-0.106
												],
												[
													-1.64,
													-0.029
												],
												[
													0,
													0
												],
												[
													0,
													0
												]
											]
										}
									}
								},
								{
									ty: "fl",
									c: {
										a: 0,
										k: [
											0.875,
											0.88,
											0.891
										],
										ix: 2
									},
									o: {
										a: 0,
										k: 68,
										ix: 2
									},
									r: 1,
									bm: 0
								},
								{
									ty: "tr",
									p: {
										a: 0,
										k: [
											11.74,
											3.52
										],
										ix: 2
									},
									a: {
										a: 0,
										k: [
											11.74,
											3.52
										],
										ix: 2
									},
									o: {
										a: 0,
										k: 100,
										ix: 2
									}
								}
							]
						}
					],
					ip: 0,
					op: 301,
					st: 0
				}
			]
		},
		{
			id: "d",
			layers: [
				{
					ddd: 0,
					ind: 44,
					ty: 4,
					sr: 1,
					ks: {
						p: {
							a: 0,
							k: [
								0,
								1
							],
							ix: 2
						},
						o: {
							a: 0,
							k: 100,
							ix: 2
						}
					},
					ao: 0,
					shapes: [
						{
							ty: "gr",
							it: [
								{
									ty: "sh",
									d: 1,
									ks: {
										a: 0,
										k: {
											c: true,
											v: [
												[
													0,
													1.92
												],
												[
													1.88,
													0
												],
												[
													28.56,
													0.75
												],
												[
													30.25,
													2.66
												],
												[
													28.56,
													4.48
												],
												[
													1.88,
													3.93
												],
												[
													0,
													1.92
												],
												[
													0,
													1.92
												]
											],
											i: [
												[
													0,
													0
												],
												[
													-1.035,
													-0.027
												],
												[
													-8.896,
													-0.249
												],
												[
													0,
													-1.027
												],
												[
													0.935,
													0.02
												],
												[
													8.896,
													0.186
												],
												[
													0,
													1.087
												],
												[
													0,
													0
												]
											],
											o: [
												[
													0,
													-1.087
												],
												[
													8.896,
													0.249
												],
												[
													0.933,
													0.026
												],
												[
													0,
													1.027
												],
												[
													-8.896,
													-0.186
												],
												[
													-1.033,
													-0.022
												],
												[
													0,
													0
												],
												[
													0,
													0
												]
											]
										}
									}
								},
								{
									ty: "fl",
									c: {
										a: 0,
										k: [
											0,
											0.46,
											1
										],
										ix: 2
									},
									o: {
										a: 0,
										k: 78,
										ix: 2
									},
									r: 1,
									bm: 0
								},
								{
									ty: "tr",
									p: {
										a: 0,
										k: [
											15.13,
											2.24
										],
										ix: 2
									},
									a: {
										a: 0,
										k: [
											15.13,
											2.24
										],
										ix: 2
									},
									o: {
										a: 0,
										k: 100,
										ix: 2
									}
								}
							]
						}
					],
					ip: 0,
					op: 301,
					st: 0
				}
			]
		},
		{
			id: "5",
			layers: [
				{
					ddd: 0,
					ind: 45,
					ty: 4,
					sr: 1,
					ks: {
						p: {
							a: 0,
							k: [
								0,
								1
							],
							ix: 2
						},
						o: {
							a: 0,
							k: 100,
							ix: 2
						}
					},
					ao: 0,
					shapes: [
						{
							ty: "gr",
							it: [
								{
									ty: "sh",
									d: 1,
									ks: {
										a: 0,
										k: {
											c: true,
											v: [
												[
													0,
													11.12
												],
												[
													11.76,
													0.05
												],
												[
													110.01,
													9.33
												],
												[
													117.73,
													19.75
												],
												[
													117.73,
													26.2
												],
												[
													0,
													19.25
												],
												[
													0,
													11.13
												],
												[
													0,
													11.12
												],
												[
													0,
													11.12
												]
											],
											i: [
												[
													0,
													0
												],
												[
													-6.436,
													-0.608
												],
												[
													-32.749,
													-3.094
												],
												[
													0,
													-5.348
												],
												[
													0,
													-2.152
												],
												[
													39.242,
													2.317
												],
												[
													0,
													2.708
												],
												[
													0,
													0.001
												],
												[
													0,
													0
												]
											],
											o: [
												[
													0,
													-6.73
												],
												[
													32.749,
													3.094
												],
												[
													4.293,
													0.405
												],
												[
													0,
													2.152
												],
												[
													-39.242,
													-2.317
												],
												[
													0,
													-2.708
												],
												[
													0,
													-1e-3
												],
												[
													0,
													0
												],
												[
													0,
													0
												]
											]
										}
									}
								},
								{
									ty: "fl",
									c: {
										a: 0,
										k: [
											0,
											0.46,
											1
										],
										ix: 2
									},
									o: {
										a: 0,
										k: 100,
										ix: 2
									},
									r: 1,
									bm: 0
								},
								{
									ty: "tr",
									p: {
										a: 0,
										k: [
											58.86,
											13.1
										],
										ix: 2
									},
									a: {
										a: 0,
										k: [
											58.86,
											13.1
										],
										ix: 2
									},
									o: {
										a: 0,
										k: 100,
										ix: 2
									}
								}
							]
						}
					],
					ip: 0,
					op: 301,
					st: 0
				}
			]
		},
		{
			id: "6",
			layers: [
				{
					ddd: 0,
					ind: 46,
					ty: 4,
					sr: 1,
					ks: {
						p: {
							a: 0,
							k: [
								0,
								1
							],
							ix: 2
						},
						o: {
							a: 0,
							k: 100,
							ix: 2
						}
					},
					ao: 0,
					shapes: [
						{
							ty: "gr",
							it: [
								{
									ty: "sh",
									d: 1,
									ks: {
										a: 0,
										k: {
											c: true,
											v: [
												[
													0,
													11.12
												],
												[
													11.76,
													0.05
												],
												[
													110.01,
													9.33
												],
												[
													117.73,
													19.75
												],
												[
													117.73,
													82.7
												],
												[
													110.01,
													93.05
												],
												[
													11.76,
													101.51
												],
												[
													0,
													90.34
												],
												[
													0,
													11.12
												],
												[
													0,
													11.12
												]
											],
											i: [
												[
													0,
													0
												],
												[
													-6.436,
													-0.608
												],
												[
													-32.749,
													-3.094
												],
												[
													0,
													-5.348
												],
												[
													0,
													-20.983
												],
												[
													4.293,
													-0.37
												],
												[
													32.749,
													-2.821
												],
												[
													0,
													6.73
												],
												[
													0,
													26.404
												],
												[
													0,
													0
												]
											],
											o: [
												[
													0,
													-6.73
												],
												[
													32.749,
													3.094
												],
												[
													4.293,
													0.405
												],
												[
													0,
													20.983
												],
												[
													0,
													5.348
												],
												[
													-32.749,
													2.821
												],
												[
													-6.436,
													0.555
												],
												[
													0,
													-26.404
												],
												[
													0,
													0
												],
												[
													0,
													0
												]
											]
										}
									}
								},
								{
									ty: "fl",
									c: {
										a: 0,
										k: [
											0.77,
											0.902,
											1
										],
										ix: 2
									},
									o: {
										a: 0,
										k: 100,
										ix: 2
									},
									r: 1,
									bm: 0
								},
								{
									ty: "tr",
									p: {
										a: 0,
										k: [
											58.86,
											50.78
										],
										ix: 2
									},
									a: {
										a: 0,
										k: [
											58.86,
											50.78
										],
										ix: 2
									},
									o: {
										a: 0,
										k: 100,
										ix: 2
									}
								}
							]
						}
					],
					ip: 0,
					op: 301,
					st: 0
				}
			]
		}
	];
	var layers$1 = [
		{
			ddd: 0,
			ind: 47,
			ty: 3,
			sr: 1,
			ks: {
				p: {
					a: 0,
					k: [
						142.02,
						71.83
					],
					ix: 2
				},
				a: {
					a: 0,
					k: [
						29.97,
						18.2
					],
					ix: 2
				},
				s: {
					a: 0,
					k: [
						127.97,
						127.97
					],
					ix: 2
				},
				o: {
					a: 0,
					k: 100,
					ix: 2
				}
			},
			ao: 0,
			ip: 0,
			op: 301,
			st: 0
		},
		{
			ddd: 0,
			refId: "1",
			w: 61,
			h: 38,
			ind: 4,
			ty: 0,
			sr: 1,
			ks: {
				p: {
					a: 0,
					k: [
						-1,
						-1
					],
					ix: 2
				},
				o: {
					a: 0,
					k: 100,
					ix: 2
				}
			},
			ao: 0,
			ip: 0,
			op: 301,
			st: 0,
			parent: 47
		},
		{
			ddd: 0,
			ind: 48,
			ty: 3,
			sr: 1,
			ks: {
				p: {
					a: 0,
					k: [
						130,
						62
					],
					ix: 2
				},
				a: {
					a: 0,
					k: [
						74.85,
						51
					],
					ix: 2
				},
				o: {
					a: 0,
					k: 100,
					ix: 2
				}
			},
			ao: 0,
			ip: 0,
			op: 301,
			st: 0
		},
		{
			ddd: 0,
			refId: "7",
			w: 152,
			h: 102,
			ind: 22,
			ty: 0,
			sr: 1,
			ks: {
				p: {
					a: 0,
					k: [
						-1,
						0
					],
					ix: 2
				},
				o: {
					a: 0,
					k: 100,
					ix: 2
				}
			},
			ao: 0,
			ip: 0,
			op: 301,
			st: 0,
			parent: 48
		}
	];
	var markers$1 = [
	];
	var DashboardLoadingAnimation = {
		metadata: metadata,
		v: v$1,
		fr: fr$1,
		ip: ip$1,
		op: op$1,
		w: w$1,
		h: h$1,
		nm: nm$1,
		ddd: ddd$1,
		assets: assets$1,
		layers: layers$1,
		markers: markers$1
	};

	var v = "5.4.3";
	var fr = 25;
	var ip = 0;
	var op = 28;
	var w = 1000;
	var h = 1000;
	var nm = "loading_1";
	var ddd = 0;
	var assets = [
	];
	var layers = [
		{
			ddd: 0,
			ind: 1,
			ty: 4,
			nm: "ball_3",
			sr: 1,
			ks: {
				o: {
					a: 0,
					k: 100,
					ix: 11
				},
				r: {
					a: 0,
					k: 0,
					ix: 10
				},
				p: {
					a: 1,
					k: [
						{
							i: {
								x: 0.667,
								y: 1
							},
							o: {
								x: 0.333,
								y: 0
							},
							n: "0p667_1_0p333_0",
							t: 12,
							s: [
								754.951,
								497.902,
								0
							],
							e: [
								754.951,
								415.902,
								0
							],
							to: [
								0,
								-13.666672706604,
								0
							],
							ti: [
								0,
								0,
								0
							]
						},
						{
							i: {
								x: 0.667,
								y: 1
							},
							o: {
								x: 0.333,
								y: 0
							},
							n: "0p667_1_0p333_0",
							t: 18,
							s: [
								754.951,
								415.902,
								0
							],
							e: [
								754.951,
								497.902,
								0
							],
							to: [
								0,
								0,
								0
							],
							ti: [
								0,
								-13.666672706604,
								0
							]
						},
						{
							t: 24
						}
					],
					ix: 2
				},
				a: {
					a: 0,
					k: [
						0,
						0,
						0
					],
					ix: 1
				},
				s: {
					a: 0,
					k: [
						100,
						100,
						100
					],
					ix: 6
				}
			},
			ao: 0,
			shapes: [
				{
					ty: "gr",
					it: [
						{
							d: 1,
							ty: "el",
							s: {
								a: 0,
								k: [
									127.049,
									127.049
								],
								ix: 2
							},
							p: {
								a: 0,
								k: [
									0,
									0
								],
								ix: 3
							},
							nm: "Ellipse Path 1",
							mn: "ADBE Vector Shape - Ellipse",
							hd: false
						},
						{
							ty: "fl",
							c: {
								a: 0,
								k: [
									0,
									0,
									0,
									1
								],
								ix: 4
							},
							o: {
								a: 0,
								k: 100,
								ix: 5
							},
							r: 1,
							bm: 0,
							nm: "Fill 1",
							mn: "ADBE Vector Graphic - Fill",
							hd: false
						},
						{
							ty: "tr",
							p: {
								a: 0,
								k: [
									0,
									0
								],
								ix: 2
							},
							a: {
								a: 0,
								k: [
									0,
									0
								],
								ix: 1
							},
							s: {
								a: 0,
								k: [
									100,
									100
								],
								ix: 3
							},
							r: {
								a: 0,
								k: 0,
								ix: 6
							},
							o: {
								a: 0,
								k: 100,
								ix: 7
							},
							sk: {
								a: 0,
								k: 0,
								ix: 4
							},
							sa: {
								a: 0,
								k: 0,
								ix: 5
							},
							nm: "Transform"
						}
					],
					nm: "Ellipse 1",
					np: 3,
					cix: 2,
					bm: 0,
					ix: 1,
					mn: "ADBE Vector Group",
					hd: false
				}
			],
			ip: 0,
			op: 101,
			st: 0,
			bm: 0
		},
		{
			ddd: 0,
			ind: 2,
			ty: 4,
			nm: "ball_2",
			sr: 1,
			ks: {
				o: {
					a: 0,
					k: 100,
					ix: 11
				},
				r: {
					a: 0,
					k: 0,
					ix: 10
				},
				p: {
					a: 1,
					k: [
						{
							i: {
								x: 0.667,
								y: 1
							},
							o: {
								x: 0.333,
								y: 0
							},
							n: "0p667_1_0p333_0",
							t: 6,
							s: [
								497.451,
								497.902,
								0
							],
							e: [
								497.451,
								415.902,
								0
							],
							to: [
								0,
								-13.666672706604,
								0
							],
							ti: [
								0,
								0,
								0
							]
						},
						{
							i: {
								x: 0.667,
								y: 1
							},
							o: {
								x: 0.333,
								y: 0
							},
							n: "0p667_1_0p333_0",
							t: 12,
							s: [
								497.451,
								415.902,
								0
							],
							e: [
								497.451,
								497.902,
								0
							],
							to: [
								0,
								0,
								0
							],
							ti: [
								0,
								-13.666672706604,
								0
							]
						},
						{
							t: 18
						}
					],
					ix: 2
				},
				a: {
					a: 0,
					k: [
						0,
						0,
						0
					],
					ix: 1
				},
				s: {
					a: 0,
					k: [
						100,
						100,
						100
					],
					ix: 6
				}
			},
			ao: 0,
			shapes: [
				{
					ty: "gr",
					it: [
						{
							d: 1,
							ty: "el",
							s: {
								a: 0,
								k: [
									127.049,
									127.049
								],
								ix: 2
							},
							p: {
								a: 0,
								k: [
									0,
									0
								],
								ix: 3
							},
							nm: "Ellipse Path 1",
							mn: "ADBE Vector Shape - Ellipse",
							hd: false
						},
						{
							ty: "fl",
							c: {
								a: 0,
								k: [
									0,
									0,
									0,
									1
								],
								ix: 4
							},
							o: {
								a: 0,
								k: 100,
								ix: 5
							},
							r: 1,
							bm: 0,
							nm: "Fill 1",
							mn: "ADBE Vector Graphic - Fill",
							hd: false
						},
						{
							ty: "tr",
							p: {
								a: 0,
								k: [
									0,
									0
								],
								ix: 2
							},
							a: {
								a: 0,
								k: [
									0,
									0
								],
								ix: 1
							},
							s: {
								a: 0,
								k: [
									100,
									100
								],
								ix: 3
							},
							r: {
								a: 0,
								k: 0,
								ix: 6
							},
							o: {
								a: 0,
								k: 100,
								ix: 7
							},
							sk: {
								a: 0,
								k: 0,
								ix: 4
							},
							sa: {
								a: 0,
								k: 0,
								ix: 5
							},
							nm: "Transform"
						}
					],
					nm: "Ellipse 1",
					np: 3,
					cix: 2,
					bm: 0,
					ix: 1,
					mn: "ADBE Vector Group",
					hd: false
				}
			],
			ip: 0,
			op: 101,
			st: 0,
			bm: 0
		},
		{
			ddd: 0,
			ind: 3,
			ty: 4,
			nm: "ball_1",
			sr: 1,
			ks: {
				o: {
					a: 0,
					k: 100,
					ix: 11
				},
				r: {
					a: 0,
					k: 0,
					ix: 10
				},
				p: {
					a: 1,
					k: [
						{
							i: {
								x: 0.667,
								y: 1
							},
							o: {
								x: 0.333,
								y: 0
							},
							n: "0p667_1_0p333_0",
							t: 0,
							s: [
								239.951,
								497.902,
								0
							],
							e: [
								239.951,
								415.902,
								0
							],
							to: [
								0,
								-13.6666669845581,
								0
							],
							ti: [
								0,
								0,
								0
							]
						},
						{
							i: {
								x: 0.667,
								y: 1
							},
							o: {
								x: 0.333,
								y: 0
							},
							n: "0p667_1_0p333_0",
							t: 6,
							s: [
								239.951,
								415.902,
								0
							],
							e: [
								239.951,
								497.902,
								0
							],
							to: [
								0,
								0,
								0
							],
							ti: [
								0,
								-13.6666669845581,
								0
							]
						},
						{
							t: 12
						}
					],
					ix: 2
				},
				a: {
					a: 0,
					k: [
						0,
						0,
						0
					],
					ix: 1
				},
				s: {
					a: 0,
					k: [
						100,
						100,
						100
					],
					ix: 6
				}
			},
			ao: 0,
			shapes: [
				{
					ty: "gr",
					it: [
						{
							d: 1,
							ty: "el",
							s: {
								a: 0,
								k: [
									127.049,
									127.049
								],
								ix: 2
							},
							p: {
								a: 0,
								k: [
									0,
									0
								],
								ix: 3
							},
							nm: "Ellipse Path 1",
							mn: "ADBE Vector Shape - Ellipse",
							hd: false
						},
						{
							ty: "fl",
							c: {
								a: 0,
								k: [
									0,
									0,
									0,
									1
								],
								ix: 4
							},
							o: {
								a: 0,
								k: 100,
								ix: 5
							},
							r: 1,
							bm: 0,
							nm: "Fill 1",
							mn: "ADBE Vector Graphic - Fill",
							hd: false
						},
						{
							ty: "tr",
							p: {
								a: 0,
								k: [
									0,
									0
								],
								ix: 2
							},
							a: {
								a: 0,
								k: [
									0,
									0
								],
								ix: 1
							},
							s: {
								a: 0,
								k: [
									100,
									100
								],
								ix: 3
							},
							r: {
								a: 0,
								k: 0,
								ix: 6
							},
							o: {
								a: 0,
								k: 100,
								ix: 7
							},
							sk: {
								a: 0,
								k: 0,
								ix: 4
							},
							sa: {
								a: 0,
								k: 0,
								ix: 5
							},
							nm: "Transform"
						}
					],
					nm: "Ellipse 1",
					np: 3,
					cix: 2,
					bm: 0,
					ix: 1,
					mn: "ADBE Vector Group",
					hd: false
				}
			],
			ip: 0,
			op: 101,
			st: 0,
			bm: 0
		}
	];
	var markers = [
	];
	var DotsAnimation = {
		v: v,
		fr: fr,
		ip: ip,
		op: op,
		w: w,
		h: h,
		nm: nm,
		ddd: ddd,
		assets: assets,
		layers: layers,
		markers: markers
	};

	class Skeleton {
		#dashboardManager;
		#periodicReload;
		#reloadInterval;
		constructor(options) {
			this.container = options.container ?? null;
			this.dashboardId = options.dashboardId;
			this.status = options.status;
			this.dashboardType = options.dashboardType;
			this.supersetStatus = options.supersetStatus;
			this.isFirstStartup = options.isFirstStartup;
			this.#dashboardManager = new biconnector_apacheSupersetDashboardManager.DashboardManager();
			this.#periodicReload = options.periodicReload ?? false;
			this.#reloadInterval = null;
			this.subscribeOnEvents();
			if (main_core.Type.isDomNode(this.container)) {
				biconnector_apacheSupersetDashboardSkeleton.SkeletonRenderer.render(this.container);
				this.#changeContent(this.#getContent(this.status));
			}
			if (this.supersetStatus === 'READY' && this.status === 'N') {
				this.#installDashboard();
			}
			if (this.#periodicReload) {
				this.#reloadInterval = setInterval(() => {
					window.location.reload();
				}, 10000);
			}
		}
		subscribeOnEvents() {
			// eslint-disable-next-line no-unused-expressions
			BX.PULL && BX.PULL.extendWatch('superset_dashboard', true);
			main_core_events.EventEmitter.subscribe('onPullEvent-biconnector', event => {
				const [eventName, eventData] = event.data;
				if (eventName === 'onSupersetStatusUpdated') {
					const status = eventData?.status;
					if (!status) {
						return;
					}
					switch (status) {
						case 'READY':
							this.#clearReloadInterval();
							setTimeout(this.#installDashboard.bind(this), 5000);
							break;
						case 'LOAD':
							this.#changeContent(this.#getLoadingContent());
							break;
						case 'ERROR':
							this.#clearReloadInterval();
							this.#changeContent(this.#getUnavailableSupersetHint());
							break;
						case 'LIMIT_EXCEEDED':
							this.#changeContent(this.#getLimitExceededHint());
							break;
					}
				}
			});
			main_core_events.EventEmitter.subscribe('BIConnector.Superset.DashboardManager:onDashboardBatchStatusUpdate', event => {
				const data = event.getData();
				if (!data.dashboardList) {
					return;
				}
				const dashboardList = data.dashboardList;
				if (BX.SidePanel?.Instance) {
					BX.SidePanel.Instance.postMessage(window, 'BIConnector.Superset.DashboardDetail:onDashboardBatchStatusUpdate', {
						dashboardList
					});
				}
				for (const dashboard of dashboardList) {
					if (Number(dashboard.id) === this.dashboardId) {
						this.#onDashboardStatusUpdated(dashboard.status);
					}
				}
			});
		}
		#installDashboard() {
			const dashboardManagerInstance = new biconnector_apacheSupersetDashboardManager.DashboardManager();
			biconnector_apacheSupersetDashboardManager.DashboardManager.installDashboard(this.dashboardId).then(() => dashboardManagerInstance.getDashboardEmbeddedData(this.dashboardId)).then(response => {
				const dashboard = response.data.dashboard;
				if (dashboard.embeddedUrl && dashboard.embeddedUrl !== window.location.href) {
					window.location.href = dashboard.embeddedUrl;
				}
			}).catch(() => {
				this.#changeContent(this.#getFailedContent());
				this.#clearReloadInterval();
			});
		}
		#onDashboardStatusUpdated(status) {
			switch (status) {
				case biconnector_apacheSupersetDashboardManager.DashboardManager.DASHBOARD_STATUS_DRAFT:
				case biconnector_apacheSupersetDashboardManager.DashboardManager.DASHBOARD_STATUS_READY:
					{
						window.location.reload();
						break;
					}
				case biconnector_apacheSupersetDashboardManager.DashboardManager.DASHBOARD_STATUS_LOAD:
					{
						this.#changeContent(this.#getLoadingContent());
						break;
					}
				case biconnector_apacheSupersetDashboardManager.DashboardManager.DASHBOARD_STATUS_FAILED:
					{
						this.#clearReloadInterval();
						this.#changeContent(this.#getFailedContent());
						break;
					}
			}
		}
		#clearReloadInterval() {
			if (this.#reloadInterval) {
				clearInterval(this.#reloadInterval);
				this.#reloadInterval = null;
			}
		}
		#changeContent(innerContent) {
			if (!this.container) {
				return;
			}
			const hint = this.container.querySelector('.biconnector-dashboard__hint_container');
			main_core.Dom.clean(hint);
			main_core.Dom.append(innerContent, hint);
		}
		#getContent() {
			if (this.supersetStatus === 'LIMIT_EXCEEDED') {
				return this.#getLimitExceededHint();
			}
			if (this.supersetStatus === 'ERROR') {
				return this.#getUnavailableSupersetHint();
			}
			if (this.status === biconnector_apacheSupersetDashboardManager.DashboardManager.DASHBOARD_STATUS_LOAD || this.status === biconnector_apacheSupersetDashboardManager.DashboardManager.DASHBOARD_STATUS_NOT_INSTALLED) {
				return this.#getLoadingContent();
			}
			if (this.status === biconnector_apacheSupersetDashboardManager.DashboardManager.DASHBOARD_STATUS_FAILED) {
				return this.#getFailedContent();
			}
			return '';
		}
		#getLoadingContent() {
			const loadingAnimationContainer = main_core.Tag.render`
			<div class="biconnector-dashboard__loading-animation"></div>
		`;
			ui_lottie.Lottie.loadAnimation({
				container: loadingAnimationContainer,
				renderer: 'svg',
				loop: false,
				autoplay: true,
				animationData: DashboardLoadingAnimation
			});
			let descriptionBlock = '';
			if (this.isFirstStartup) {
				const description = this.dashboardType === 'CUSTOM' ? main_core.Loc.getMessage('SUPERSET_DASHBOARD_DETAIL_HINT_DESC_CREATING') : main_core.Loc.getMessage('SUPERSET_DASHBOARD_DETAIL_HINT_DESC_MSGVER_2');
				descriptionBlock = main_core.Tag.render`
				<div class="biconnector-dashboard__hint_desc">
					${description.replaceAll('[br]', '<br>')}
				</div>
			`;
			}
			const title = this.dashboardType === 'CUSTOM' ? main_core.Loc.getMessage('SUPERSET_DASHBOARD_DETAIL_HINT_TITLE_CREATING') : main_core.Loc.getMessage('SUPERSET_DASHBOARD_DETAIL_HINT_TITLE_MSGVER_2');
			const container = main_core.Tag.render`
			<div class="biconnector-dashboard__hint biconnector-dashboard__hint__loading">
				${loadingAnimationContainer}
				<div class="biconnector-dashboard__hint_title">
					${title.replace('[dots]', '<span class="biconnector-dashboard__dots-animation"></span>')}
				</div>
				${descriptionBlock}
			</div>
		`;
			const dotsContainer = container.querySelector('.biconnector-dashboard__dots-animation');
			ui_lottie.Lottie.loadAnimation({
				container: dotsContainer,
				renderer: 'svg',
				loop: true,
				autoplay: true,
				animationData: DotsAnimation
			});
			return container;
		}
		#getFailedContent() {
			const reloadBtn = main_core.Tag.render`
			<button class="ui-btn ui-btn-sm biconnector-dashboard__error_btn ui-btn-primary">
				${main_core.Loc.getMessage('SUPERSET_DASHBOARD_DETAIL_ERROR_RELOAD_BTN')}
			</button>
		`;
			reloadBtn.onclick = () => {
				main_core.Dom.addClass(reloadBtn, 'ui-btn-wait');
				reloadBtn.setAttribute('disabled', 'true');
				this.#dashboardManager.restartDashboardImport(this.dashboardId).then(response => {
					const dashboardIds = response?.data?.restartedDashboardIds;
					if (!dashboardIds) {
						return;
					}
					for (const restartedDashboardId of dashboardIds) {
						if (Number(restartedDashboardId) === this.dashboardId) {
							this.#changeContent(this.#getLoadingContent());
						}
					}
				});
			};
			return main_core.Tag.render`
			<div class="biconnector-dashboard__hint biconnector-dashboard__hint__error">
				<div class="biconnector-dashboard__error__logo-wrapper">
					${this.#getErrorLogo()}
				</div>
				<div class="biconnector-dashboard__hint_desc biconnector-dashboard__error_desc">
					${main_core.Loc.getMessage('SUPERSET_DASHBOARD_DETAIL_ERROR_DESC')}
				</div>
				${reloadBtn}
			</div>
		`;
		}
		#getUnavailableSupersetHint() {
			return main_core.Tag.render`
			<div class="biconnector-dashboard__hint biconnector-dashboard__hint__unavailable">
				<div class="biconnector-dashboard__error__logo-wrapper">
					${this.#getErrorLogo()}
				</div>
				<div class="biconnector-dashboard__hint_title">
					${main_core.Loc.getMessage('SUPERSET_DASHBOARD_DETAIL_HINT_TITLE_UNAVAILABLE')}
				</div>
				<div class="biconnector-dashboard__hint_desc">
					${main_core.Loc.getMessage('SUPERSET_DASHBOARD_DETAIL_HINT_DESC_UNAVAILABLE')}
				</div>
			</div>
		`;
		}
		#getErrorLogo() {
			return main_core.Tag.render`
			<div class="biconnector-dashboard__error__logo"></div>
		`;
		}
		#getLimitExceededHint() {
			return main_core.Tag.render`
			<div class="biconnector-dashboard__hint biconnector-dashboard__limit__exceeded__warning">
				<div class="biconnector-dashboard__error__logo-wrapper">
					${this.#getWarningLogo()}
				</div>
				<div class="biconnector-dashboard__hint_title">
					${main_core.Loc.getMessage('SUPERSET_DASHBOARD_DETAIL_HINT_TITLE_LIMIT_EXCEEDED')}
				</div>
				<div class="biconnector-dashboard__hint_desc biconnector-dashboard__limit__exceeded__warning_desc">
					${main_core.Loc.getMessage('SUPERSET_DASHBOARD_DETAIL_HINT_DESC_LIMIT_EXCEEDED_MSGVER_1').replaceAll('[br]', '<br>')}
				</div>
			</div>
		`;
		}
		#getWarningLogo() {
			return main_core.Tag.render`
			<div class="biconnector-dashboard__limit__exceeded__warning__logo"></div>
		`;
		}
	}

	class Detail {
		static create(config) {
			new DetailInstance(config);
		}
		static createSkeleton(config) {
			new Skeleton(config);
		}
	}

	exports.Detail = Detail;

})(this.BX.BIConnector.ApacheSuperset.Dashboard = this.BX.BIConnector.ApacheSuperset.Dashboard || {}, BX, BX.Event, BX.Main, BX, BX.Main, BX.BIConnector, BX.BIConnector, BX.BIConnector, BX.BIConnector, BX.UI.EntitySelector, BX.BIConnector, BX.BIConnector, BX, window, BX.UI, BX.BIConnector);
