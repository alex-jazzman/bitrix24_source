/* eslint-disable */
this.BX = this.BX || {};
this.BX.Calendar = this.BX.Calendar || {};
this.BX.Calendar.Sync = this.BX.Calendar.Sync || {};
(function (exports, ui_designTokens, ui_fonts_opensans, ui_iconSet_actions, main_core, calendar_sync_manager, ui_tilegrid, ui_forms, calendar_util, ui_qrauthorization, main_core_events, ui_dialogs_messagebox, calendar_entry, main_popup, ui_alerts) {
	'use strict';

	class StatusBlock {
		constructor(options) {
			this.status = options.status;
			this.connections = options.connections;
			this.withStatusLabel = options.withStatusLabel;
			this.popupWithUpdateButton = options.popupWithUpdateButton;
			this.popupId = options.popupId;
		}
		static createInstance(options) {
			return new this(options);
		}
		setStatus(status) {
			this.status = status;
			return this;
		}
		setConnections(connections) {
			this.connections = connections;
			return this;
		}
		getContent() {
			let statusInfoBlock;
			if (this.status === 'success') {
				statusInfoBlock = main_core.Tag.render`
				<div id="status-info-block" class="ui-alert ui-alert-success calendar-sync-status-info">
					<span class="ui-alert-message">${main_core.Loc.getMessage('SYNC_STATUS_SUCCESS')}</span>
				</div>
			`;
			} else if (this.status === 'failed') {
				statusInfoBlock = main_core.Tag.render`
				<div id="status-info-block" class="ui-alert ui-alert-danger calendar-sync-status-info">
					<span class="ui-alert-message">${main_core.Loc.getMessage('SYNC_STATUS_ALERT')}</span>
				</div>
			`;
			} else {
				statusInfoBlock = main_core.Tag.render`
				<div id="status-info-block" class="ui-alert ui-alert-primary calendar-sync-status-info">
					<span class="ui-alert-message">${main_core.Loc.getMessage('SYNC_STATUS_NOT_CONNECTED')}</span>
				</div>
			`;
			}
			statusInfoBlock.addEventListener('mouseenter', () => {
				this.handlerMouseEnter(statusInfoBlock);
			});
			statusInfoBlock.addEventListener('mouseleave', () => {
				this.handlerMouseLeave();
			});
			this.statusBlock = main_core.Tag.render`
			<div class="calendar-sync-status-block" id="calendar-sync-status-block">
				${this.getStatusTextLabel()}
				${statusInfoBlock}
			</div>
		`;
			return this.statusBlock;
		}
		getStatusTextLabel() {
			return this.withStatusLabel ? main_core.Tag.render`
				<div class="calendar-sync-status-subtitle">
					<span data-hint=""></span>
					<span class="calendar-sync-status-text">${main_core.Loc.getMessage('LABEL_STATUS_INFO')}:</span>
				</div>` : '';
		}
		handlerMouseEnter(statusBlock) {
			clearTimeout(this.statusBlockEnterTimeout);
			this.buttonEnterTimeout = setTimeout(() => {
				this.statusBlockEnterTimeout = null;
				this.showPopup(statusBlock);
			}, 500);
		}
		handlerMouseLeave() {
			if (this.statusBlockEnterTimeout !== null) {
				clearTimeout(this.statusBlockEnterTimeout);
				this.statusBlockEnterTimeout = null;
				return;
			}
			this.statusBlockLeaveTimeout = setTimeout(() => {
				this.hidePopup();
			}, 500);
		}
		showPopup(node) {
			if (this.status !== 'not_connected') {
				this.popup = this.getPopup(node);
				this.popup.show();
				this.addPopupHandlers();
			}
		}
		hidePopup() {
			if (this.popup) {
				this.popup.hide();
			}
		}
		addPopupHandlers() {
			this.popup.getPopup().getPopupContainer().addEventListener('mouseenter', () => {
				clearTimeout(this.statusBlockEnterTimeout);
				clearTimeout(this.statusBlockLeaveTimeout);
			});
			this.popup.getPopup().getPopupContainer().addEventListener('mouseleave', () => {
				this.hidePopup();
			});
		}
		getPopup(node) {
			return calendar_sync_manager.SyncStatusPopup.createInstance({
				connections: this.connections,
				withUpdateButton: this.popupWithUpdateButton,
				node: node,
				id: this.popupId
			});
		}
		refresh(status, connections) {
			this.status = status;
			this.connections = connections;
			return this;
		}
	}

	class AuxiliarySyncPanel {
		MAIN_SYNC_SLIDER_NAME = 'calendar:auxiliary-sync-slider';
		SLIDER_WIDTH = 684;
		LOADER_NAME = "calendar:loader";
		cache = new main_core.Cache.MemoryCache();
		constructor(options) {
			this.status = options.status;
			this.connectionsProviders = options.connectionsProviders;
			this.userId = options.userId;
			this.statusBlockEnterTimeout = null;
			this.statusBlockLeaveTimeout = null;
		}
		openSlider() {
			BX.SidePanel.Instance.open(this.MAIN_SYNC_SLIDER_NAME, {
				contentCallback: slider => {
					return new Promise((resolve, reject) => {
						resolve(this.getContent());
					});
				},
				allowChangeHistory: false,
				events: {
					onLoad: () => {
						this.setGridContent();
					}
					// onMessage: (event) => {
					// 	if (event.getEventId() === 'refreshSliderGrid')
					// 	{
					// 		this.refreshData();
					// 	}
					// },
					// onClose: (event) => {
					// 	BX.SidePanel.Instance.postMessageTop(window.top.BX.SidePanel.Instance.getTopSlider(), "refreshCalendarGrid", {});
					// },
				},
				cacheable: false,
				width: this.SLIDER_WIDTH,
				loader: this.LOADER_NAME
			});
		}
		getContent() {
			return main_core.Tag.render`
			<div class="calendar-sync-wrap">
				${this.getHeader()}
				${this.getMobileHeader()}
				${this.getMobileContentWrapper()}
				${this.getWebHeader()}
				${this.getWebContentWrapper()}
			</div>
		`;
		}
		getHeader() {
			return main_core.Tag.render`
			<div class="calendar-sync-header">
				${this.getMainHeader()}
				${this.getStatusBlockContent(this.getConnections())}
			</div>
		`;
		}
		getMainHeader() {
			return this.cache.remember('calendar-syncPanel-mainHeader', () => {
				return main_core.Tag.render`
				<span class="calendar-sync-header-text">${main_core.Loc.getMessage('SYNC_CALENDAR_HEADER_NEW')}</span>
			`;
			});
		}
		getMobileContentWrapper() {
			return this.cache.remember('calendar-syncPanel-mobileContentWrapper', () => {
				return main_core.Tag.render`
			<div id="calendar-sync-mobile" class="calendar-sync-mobile"></div>
		`;
			});
		}
		getWebContentWrapper() {
			return this.cache.remember('calendar-syncPanel-webContentWrapper', () => {
				return main_core.Tag.render`
				<div id="calendar-sync-web" class="calendar-sync-web"></div>
			`;
			});
		}
		getMobileHeader() {
			return this.cache.remember('calendar-syncPanel-mobileHeader', () => {
				return main_core.Tag.render`
				<div class="calendar-sync-title">${main_core.Loc.getMessage('SYNC_MOBILE_HEADER')}</div>
			`;
			});
		}
		getWebHeader() {
			return this.cache.remember('calendar-syncPanel-webHeader', () => {
				return main_core.Tag.render`
				<div class="calendar-sync-title">${main_core.Loc.getMessage('SYNC_WEB_HEADER')}</div>
		`;
			});
		}
		getStatusBlockContent(connections) {
			this.statusBlock = StatusBlock.createInstance({
				status: this.status,
				connections: connections,
				withStatusLabel: true,
				popupWithUpdateButton: true,
				popupId: 'calendar-syncPanel-status'
			});
			this.statusBlockContent = this.statusBlock.getContent();
			return this.statusBlockContent;
		}
		getConnections() {
			const connections = [];
			const items = Object.values(this.connectionsProviders);
			items.forEach(item => {
				const itemConnections = item.getConnections();
				if (itemConnections.length > 0) {
					itemConnections.forEach(connection => {
						if (calendar_sync_manager.ConnectionItem.isConnectionItem(connection) && connection.getConnectStatus() === true) {
							connections.push(connection);
						}
					});
				}
			});
			return connections;
		}
		setGridContent() {
			const items = Object.values(this.connectionsProviders);
			this.showWebGridContent(items.filter(item => {
				return item.mainPanel === false && item.getViewClassification() === 'web';
			}));
			this.showMobileGridContent(items.filter(item => {
				return item.mainPanel === false && item.getViewClassification() === 'mobile';
			}));
		}
		showWebGridContent(items) {
			const wrapper = this.getWebContentWrapper();
			main_core.Dom.clean(wrapper);
			const grid = new BX.TileGrid.Grid({
				id: 'calendar_sync',
				items: items,
				container: wrapper,
				sizeRatio: "55%",
				itemMinWidth: 180,
				tileMargin: 7,
				itemType: 'BX.Calendar.Sync.Interface.GridUnit',
				userId: this.userId
			});
			grid.draw();
		}
		showMobileGridContent(items) {
			const wrapper = this.getMobileContentWrapper();
			main_core.Dom.clean(wrapper);
			const grid = new BX.TileGrid.Grid({
				id: 'calendar_sync',
				items: items,
				container: wrapper,
				sizeRatio: "55%",
				itemMinWidth: 180,
				tileMargin: 7,
				itemType: 'BX.Calendar.Sync.Interface.GridUnit'
			});
			grid.draw();
		}
		refresh(status, connectionsProviders) {
			this.status = status;
			this.connectionsProviders = connectionsProviders;
			this.blockStatusContent = this.statusBlock.refresh(status, this.getConnections()).getContent();
			main_core.Dom.replace(document.querySelector('#calendar-sync-status-block'), this.blockStatusContent);
			this.setGridContent();
		}
	}

	class SyncPanelUnit {
		COUNTER_FAILED = 1;
		logoClassName = '';
		constructor(options) {
			this.options = options;
			this.connectionProvider = this.options.connectionProvider;
		}
		getConnectionTemplate() {
			if (!this.connectionTemplate) {
				this.connectionTemplate = this.connectionProvider.getClassTemplateItem().createInstance(this.connectionProvider, this.connectionProvider.getConnection());
			}
			return this.connectionTemplate;
		}
		renderTo(outerWrapper) {
			if (main_core.Type.isElementNode(outerWrapper)) {
				main_core.Dom.append(this.getContent(), outerWrapper);
			}
		}
		getContent() {
			this.unitNode = main_core.Tag.render`
			<div class="calendar-sync__calendar-item">
				<div class="calendar-sync__calendar-item--logo">
					${this.getLogoNode()}
				</div>
				<div class="calendar-sync__calendar-item--container">
					<div class="calendar-sync__calendar-item--title">
						${this.getTitle()}
						${this.getSyncInfoWrap()}
					</div>
					${this.getButtonsWrap()}
				</div>
			</div>
		`;
			return this.unitNode;
		}
		getLogoNode() {
			return main_core.Tag.render`<div class="calendar-sync__calendar-item--logo-image ${this.connectionProvider.getSyncPanelLogo()}"></div>`;
		}
		getTitle() {
			return this.connectionProvider.getSyncPanelTitle();
		}
		getSyncInfoWrap() {
			this.syncInfoWrap = main_core.Tag.render`
			<div class="calendar-sync__account-info">
				<div class="calendar-sync__account-info--icon --animate"></div>
				<span data-role="sync_info_text" />
			</div>
		`;
			return this.syncInfoWrap;
		}
		setSyncStatus(mode) {
			this.unitNode.className = 'calendar-sync__calendar-item';
			this.syncInfoWrap.className = 'calendar-sync__account-info';
			switch (mode) {
				case this.connectionProvider.STATUS_REFUSED:
					main_core.Dom.addClass(this.unitNode, '--refused');
					this.setSyncInfoStatusText(main_core.Loc.getMessage('CAL_SYNC_INFO_STATUS_REFUSED'), false);
					break;
				case this.connectionProvider.STATUS_SUCCESS:
					main_core.Dom.addClass(this.unitNode, '--complete');
					this.setSyncInfoStatusText(this.formatSyncTime(this.connectionProvider.getSyncDate()));
					break;
				case this.connectionProvider.STATUS_FAILED:
					if (this.connectionProvider.doSupportReconnectionScenario()) {
						main_core.Dom.addClass(this.unitNode, '--error-reconnect');
						main_core.Dom.addClass(this.syncInfoWrap, '--error-reconnect');
						const connectionType = this.connectionProvider.getFailedConnectionName();
						this.setSyncInfoStatusText(main_core.Loc.getMessage('CAL_SYNC_INFO_STATUS_ERROR_RECONNECT', {
							'#TYPE#': connectionType === 'iCloud' ? 'iCloud' : main_core.Text.capitalize(connectionType)
						}), false);
					} else {
						main_core.Dom.addClass(this.unitNode, '--error');
						this.setSyncInfoStatusText(main_core.Loc.getMessage('CAL_SYNC_INFO_STATUS_ERROR'));
					}
					break;
				case this.connectionProvider.STATUS_PENDING:
					main_core.Dom.addClass(this.unitNode, '--pending');
					this.setSyncInfoStatusText('');
					break;
				case this.connectionProvider.STATUS_SYNCHRONIZING:
					main_core.Dom.addClass(this.unitNode, '--active');
					this.setSyncInfoStatusText(main_core.Loc.getMessage('CAL_SYNC_INFO_STATUS_SYNCHRONIZING'));
					break;
				case this.connectionProvider.STATUS_NOT_CONNECTED:
					if (this.connectionProvider.isGoogleApplicationRefused) {
						main_core.Dom.addClass(this.unitNode, '--off');
						this.setSyncInfoStatusText(main_core.Loc.getMessage('CAL_SYNC_INFO_STATUS_REFUSED'), false);
					} else {
						this.setSyncInfoStatusText('');
					}
					break;
			}
			this.refreshButton();
		}
		setSyncInfoStatusText(text, upperCase = true) {
			const syncInfoStatusText = this.syncInfoWrap.querySelector('[data-role="sync_info_text"]');
			if (main_core.Type.isElementNode(syncInfoStatusText)) {
				syncInfoStatusText.innerHTML = upperCase ? main_core.Text.encode(text).toUpperCase() : main_core.Text.encode(text);
			}
		}
		getButtonsWrap() {
			if (!main_core.Type.isElementNode(this.buttonsWrap)) {
				this.buttonsWrap = main_core.Tag.render`<div class="calendar-sync__calendar-item--buttons">
				${this.getButton()}
				${this.getMoreButton()}
			</div>`;
			}
			return this.buttonsWrap;
		}
		refreshButton() {
			main_core.Dom.clean(this.buttonsWrap);
			main_core.Dom.append(this.getButton(), this.buttonsWrap);
			main_core.Dom.append(this.getMoreButton(), this.buttonsWrap);
		}
		getButton() {
			if (this.connectionProvider.isGoogleApplicationRefused) {
				return null;
			}
			switch (this.connectionProvider.getStatus()) {
				case this.connectionProvider.STATUS_SUCCESS:
					this.button = main_core.Tag.render`
					<a data-role="status-success" class="ui-btn ui-btn-icon-success ui-btn-link">
						${main_core.Loc.getMessage('CAL_BUTTON_STATUS_SUCCESS')}
					</a>
				`;
					break;
				case this.connectionProvider.STATUS_FAILED:
					if (this.connectionProvider.doSupportReconnectionScenario()) {
						const failedConnectionsCount = this.connectionProvider.getFailedConnectionsCount();
						this.button = main_core.Tag.render`
						<button data-role="status-failed-reconnect" class="ui-btn ui-btn-light-border ui-btn-round">
							<div class="ui-icon-set --refresh-6 calendar-sync__calendar-item_buttons-error"></div>
								${main_core.Loc.getMessage('CAL_BUTTON_STATUS_FAILED_RECONNECT')}
							<div class="calendar-sync__calendar-item_buttons-counter">${failedConnectionsCount}</div>
						</button>
					`;
						main_core.Event.bind(this.button, 'click', () => this.getConnectionTemplate().reconnect());
					} else {
						this.button = main_core.Tag.render`
						<a data-role="status-failed" class="ui-btn ui-btn-icon-fail ui-btn-link">
							${main_core.Loc.getMessage('CAL_BUTTON_STATUS_FAILED')}
						</a>
					`;
					}
					break;
				case this.connectionProvider.STATUS_PENDING:
					this.button = main_core.Tag.render`
					<a data-role="status-pending" class="ui-btn ui-btn-disabled ui-btn-link">
						${main_core.Loc.getMessage('CAL_BUTTON_STATUS_PENDING')}
					</a>
				`;
					break;
				case this.connectionProvider.STATUS_NOT_CONNECTED:
					this.button = main_core.Tag.render`
					<a data-role="status-not_connected" class="ui-btn ui-btn-success ui-btn-round">
						${main_core.Loc.getMessage('CAL_BUTTON_STATUS_NOT_CONNECTED')}
					</a>
				`;
					main_core.Event.bind(this.button, 'click', this.handleItemClick.bind(this));
					break;
				case this.connectionProvider.STATUS_SYNCHRONIZING:
					this.button = main_core.Tag.render`
					<a data-role="status-not_connected" class="ui-btn ui-btn-success ui-btn-round ui-btn-clock ui-btn-disabled">
						${main_core.Loc.getMessage('CAL_BUTTON_STATUS_SUCCESS')}
					</a>
				`;
					break;
			}
			return this.button;
		}
		getMoreButton() {
			this.moreButton = main_core.Tag.render`
			<div
				data-role="more-button" 
				class="ui-btn ui-btn-round ui-btn-light-border calendar-sync__calendar-item--more"
			></div>
		`;
			main_core.Event.bind(this.moreButton, 'click', this.handleItemClick.bind(this));
			return this.moreButton;
		}
		async handleItemClick(e) {
			const status = this.connectionProvider.getStatus();
			if ([this.connectionProvider.STATUS_SUCCESS, this.connectionProvider.STATUS_FAILED, this.connectionProvider.STATUS_REFUSED].includes(status)) {
				if (this.connectionProvider.hasMenu()) {
					this.connectionProvider.showMenu(getComputedStyle(this.moreButton).display === 'none' ? this.button : this.moreButton);
				} else if (this.connectionProvider.getConnectStatus()) {
					this.connectionProvider.openActiveConnectionSlider(this.connectionProvider.getConnection());
				} else {
					this.connectionProvider.openInfoConnectionSlider();
				}
			} else if (status === this.connectionProvider.STATUS_NOT_CONNECTED) {
				main_core.Dom.addClass(this.button, 'ui-btn-wait');
				await this.getConnectionTemplate().handleConnectButton();
				main_core.Dom.removeClass(this.button, 'ui-btn-wait');
			}
		}
		formatSyncTime(date) {
			const now = new Date();
			let timestamp = date;
			if (main_core.Type.isDate(date)) {
				timestamp = Math.round(date.getTime() / 1000);
				const secondsAgo = parseInt((now - date) / 1000, 10);
				if (secondsAgo < 60) {
					return main_core.Loc.getMessage('CAL_JUST');
				}
			}
			if (timestamp === null) {
				return main_core.Loc.getMessage('CAL_JUST');
			}
			return BX.date.format([["tommorow", "tommorow, H:i:s"], ["i", "iago"], ["H", "Hago"], ["d", "dago"], ["m100", "mago"], ["m", "mago"], ["-", ""]], timestamp);
		}
	}

	class SyncPanel {
		MAIN_SYNC_SLIDER_NAME = 'calendar:sync-slider';
		HELPDESK_CODE = 11828176;
		SLIDER_WIDTH = 770;
		LOADER_NAME = "calendar:loader";
		cache = new main_core.Cache.MemoryCache();
		constructor(options) {
			this.status = options.status;
			this.connectionsProviders = options.connectionsProviders;
			this.userId = options.userId;
			this.BX = window.top.BX || window.BX;
		}
		openSlider() {
			BX.SidePanel.Instance.open(this.MAIN_SYNC_SLIDER_NAME, {
				contentCallback: slider => {
					return new Promise((resolve, reject) => {
						resolve(this.getContent());
					});
				},
				allowChangeHistory: false,
				events: {
					onLoad: () => {
						this.displayConnectionUnits();
						this.allowBitrix24IfEnabled();
					}
				},
				cacheable: false,
				width: this.SLIDER_WIDTH,
				loader: this.LOADER_NAME
			});
		}
		getContent() {
			return main_core.Tag.render`
			<div class="calendar-sync__wrapper calendar-sync__scope">
				${this.getHeaderWrapper()}
				<div class="calendar-sync__content">
				${this.getUnitsContentWrapper()}
				${this.getFooterWrapper()}
				</div>
			</div>
		`;
		}
		getHeaderWrapper() {
			return main_core.Tag.render`
			<div class="calendar-sync__header">
				<div class="calendar-sync__header-logo"></div>
				<div class="calendar-sync__header-container">
					<div class="calendar-sync__header-title">${main_core.Loc.getMessage('CAL_SYNC_TITLE_NEW')}</div>
					<div class="calendar-sync__header-sub-title">${main_core.Loc.getMessage('CAL_SYNC_SUB_TITLE')}</div>
				</div>
			</div>
		`;
		}
		getUnitsContentWrapper() {
			this.unitsContentWrapper = main_core.Tag.render`
			<div class="calendar-sync__calendar-list">
			</div>
		`;
			return this.unitsContentWrapper;
		}
		getFooterWrapper() {
			return main_core.Tag.render`
			<div class="calendar-sync__content-block --space-bottom --space-left">
				${this.getExtraInfoWithCheckIcon()}
			</div>
			<div class="calendar-sync__content-block --space-bottom --space-left--double">
				${this.getOpenAuxiliaryPanelLink()}
			</div>
			<div class="calendar-sync__content-block --space-left--double">
				${this.getOpenHelpLink()}
			</div>
		`;
		}
		getExtraInfoWithCheckIcon() {
			const alreadyConnected = Object.values(this.connectionsProviders).filter(item => {
				return item.mainPanel && item.status;
			}).length > 0;
			return main_core.Tag.render`
			<div class="calendar-sync__content-text --icon-check${alreadyConnected ? ' --disabled' : ''}">
				${main_core.Loc.getMessage('CAL_SYNC_INFO_PROMO')}
			</div>
		`;
		}
		getOpenAuxiliaryPanelLink() {
			const link = main_core.Tag.render`
			<div class="calendar-sync__content-link">
				${main_core.Loc.getMessage('CAL_OPEN_AUXILIARY_PANEL')}
			</div>
		`;
			main_core.Event.bind(link, 'click', () => {
				this.auxiliarySyncPanel = new AuxiliarySyncPanel({
					connectionsProviders: this.connectionsProviders,
					userId: this.userId,
					status: this.status
				});
				this.auxiliarySyncPanel.openSlider();
			});
			return link;
		}
		getOpenHelpLink() {
			const link = main_core.Tag.render`
			<div class="calendar-sync__content-link">${main_core.Loc.getMessage('CAL_SHOW_SYNC_HELP')}</divclass>
		`;
			main_core.Event.bind(link, 'click', () => {
				if (this.BX.Helper) {
					this.BX.Helper.show("redirect=detail&code=" + this.HELPDESK_CODE);
				}
			});
			return link;
		}
		getConnections() {
			const connections = [];
			const items = Object.values(this.connectionsProviders);
			items.forEach(item => {
				const itemConnections = item.getConnections();
				if (itemConnections.length > 0) {
					itemConnections.forEach(connection => {
						if (calendar_sync_manager.ConnectionItem.isConnectionItem(connection) && connection.getConnectStatus() === true) {
							connections.push(connection);
						}
					});
				}
			});
			return connections;
		}
		displayConnectionUnits() {
			const items = Object.values(this.connectionsProviders).filter(item => {
				return item.mainPanel || item.connected;
			});
			this.renderConnectionUnits(items);
		}
		renderConnectionUnits(providers) {
			main_core.Dom.clean(this.unitsContentWrapper);
			providers.forEach(provider => {
				const interfaceUnit = new SyncPanelUnit({
					connectionProvider: provider
				});
				provider.setInterfaceUnit(interfaceUnit);
				interfaceUnit.renderTo(this.unitsContentWrapper);
				interfaceUnit.setSyncStatus(provider.getStatus());
			});
		}
		showWebGridContent(items) {
			const wrapper = this.getWebContentWrapper();
			main_core.Dom.clean(wrapper);
			const grid = new BX.TileGrid.Grid({
				id: 'calendar_sync',
				items: items,
				container: wrapper,
				sizeRatio: "55%",
				itemMinWidth: 180,
				tileMargin: 7,
				itemType: 'BX.Calendar.Sync.Interface.GridUnit',
				userId: this.userId
			});
			grid.draw();
		}
		refresh(status, connectionsProviders) {
			this.status = status;
			this.connectionsProviders = connectionsProviders;
			main_core.Dom.replace(document.querySelector('#calendar-sync-status-block'), this.blockStatusContent);
			this.displayConnectionUnits();
			this.auxiliarySyncPanel?.refresh(status, connectionsProviders);
		}
		allowBitrix24IfEnabled() {
			if (BX.Calendar.Util.isBitrix24Enabled() === true && typeof window.BXDesktopSystem !== 'undefined') {
				window.BXDesktopSystem.AllowFrame('https://www.bitrix24.com/');
			}
		}
	}

	class GridUnit extends BX.TileGrid.Item {
		constructor(item) {
			super({
				id: item.type
			});
			this.item = item;
		}
		getContent() {
			this.gridUnit = main_core.Tag.render`<div class="calendar-sync-item ${this.getAdditionalContentClass()}" style="${this.getContentStyles()}">
			<div class="calendar-item-content">
				${this.getImage()}
				${this.getTitle()}
				${this.isActive() ? this.getStatus() : ''}
			</div>
		</div>`;
			this.gridUnit.addEventListener('click', this.onClick.bind(this));
			return this.gridUnit;
		}
		getTitle() {
			if (!this.layout.title) {
				this.layout.title = main_core.Tag.render`
				<div class="calendar-sync-item-title">${BX.util.htmlspecialchars(this.item.getGridTitle())}</div>`;
			}
			return this.layout.title;
		}
		getImage() {
			return main_core.Tag.render`
			<div class="calendar-sync-item-image">
				<div class="calendar-sync-item-image-item" style="background-image: ${'url(' + this.item.getGridIcon() + ')'}"></div>
			</div>`;
		}
		getStatus() {
			if (this.isActive()) {
				return main_core.Tag.render`
				<div class="calendar-sync-item-status"></div>
			`;
			}
			return '';
		}
		isActive() {
			return this.item.getConnectStatus();
		}
		getAdditionalContentClass() {
			if (this.isActive()) {
				if (this.item.getSyncStatus()) {
					return 'calendar-sync-item-selected';
				} else {
					return 'calendar-sync-item-failed';
				}
			} else {
				return '';
			}
		}
		getContentStyles() {
			if (this.isActive()) {
				return 'background-color:' + this.item.getGridColor() + ';';
			} else {
				return '';
			}
		}
		onClick() {
			if (this.item.hasMenu()) {
				this.item.showMenu(this.gridUnit);
			} else if (this.item.getConnectStatus()) {
				this.item.openActiveConnectionSlider(this.item.getConnection());
			} else {
				this.item.openInfoConnectionSlider();
			}
		}
	}

	class ConnectionControls {
		userName = null;
		server = null;
		connectionName = null;
		constructor(options = null) {
			this.addButtonText = main_core.Loc.getMessage('CAL_UPPER_CONNECT');
			this.removeButtonText = main_core.Loc.getMessage('CAL_UPPER_DISCONNECT');
			this.saveButtonText = main_core.Loc.getMessage('CAL_UPPER_SAVE');
			if (options !== null) {
				this.userName = BX.util.htmlspecialchars(options.userName);
				this.server = BX.util.htmlspecialchars(options.server);
				this.connectionName = BX.util.htmlspecialchars(options.connectionName);
			}
		}
		getWrapper() {
			return main_core.Tag.render`
			<div class="calendar-sync-slider-section calendar-sync-slider-section-form"></div>
		`;
		}
		getForm() {
			return main_core.Tag.render`
			<form class="calendar-sync-slider-form" action="">
				<div class="calendar-sync-slider-field">
					<div class="ui-ctl ui-ctl-w100 ui-ctl-textbox">
						<input type="text" class="ui-ctl-element" placeholder=\"${main_core.Loc.getMessage('CAL_TEXT_NAME')}\" name="name" value="${this.connectionName || ''}">
					</div>
				</div>
				<div class="calendar-sync-slider-field">
					<div class="ui-ctl ui-ctl-w100 ui-ctl-textbox">
						<input type="text" class="ui-ctl-element" placeholder=\"${main_core.Loc.getMessage('CAL_TEXT_SERVER_ADDRESS')}\" name="server" value="${this.server || ''}">
					</div>
				</div>
				<div class="calendar-sync-slider-field">
					<div class="ui-ctl ui-ctl-w100 ui-ctl-textbox">
						<input type="text" class="ui-ctl-element" placeholder=\"${main_core.Loc.getMessage('CAL_TEXT_USER_NAME')}\" name="user_name" value="${this.userName || ''}">
					</div>
				</div>
				<div class="calendar-sync-slider-field">
					<div class="ui-ctl ui-ctl-w100 ui-ctl-textbox">
						<input type="password" class="ui-ctl-element" name="password" placeholder=\"${main_core.Loc.getMessage('CAL_TEXT_PASSWORD')}\">
					</div>
				</div>
			</form>
		`;
		}
		getAddButton() {
			return main_core.Tag.render`
			<button id="connect-button" class="ui-btn ui-btn-light-border">${this.addButtonText}</button>
		`;
		}
		getDisconnectButton() {
			return main_core.Tag.render`
			<button id="disconnect-button" class="calendar-sync-slider-btn ui-btn ui-btn-light-border">${this.removeButtonText}</button>
		`;
		}
		getSaveButton() {
			return main_core.Tag.render`
			<button id="edit-connect-button" class="calendar-sync-slider-btn ui-btn ui-btn-light-border">${this.saveButtonText}</button>
		`;
		}
		getButtonWrapper() {
			return main_core.Tag.render`
			<div class="calendar-sync-slider-form-btn"></div>
		`;
		}
	}

	class MobileSyncBanner {
		zIndex = 3100;
		DOM = {};
		QRC = null;
		constructor(options = {}) {
			this.type = options.type;
			this.helpDeskCode = options.helpDeskCode || '11828176';
			this.alreadyConnectedToNew = this.type === 'android' ? calendar_util.Util.isGoogleConnected() : calendar_util.Util.isIcloudConnected();
			this.qrAuth = null;
		}
		show() {
			this.qrAuth ??= new ui_qrauthorization.QrAuthorization({
				title: main_core.Loc.getMessage('SYNC_BANNER_MOBILE_TITLE'),
				content: main_core.Loc.getMessage('SYNC_MOBILE_NOTICE'),
				intent: this.type ? 'calendar_sync_slider' : 'calendar_sync_banner',
				showFishingWarning: true,
				showBottom: false
			});
			this.qrAuth.show();
		}
	}

	class InterfaceTemplate extends main_core_events.EventEmitter {
		COUNTER_FAILED = 1;
		static SLIDER_WIDTH = 606;
		sliderWidth = 840;
		static SLIDER_PREFIX = 'calendar:connection-sync-';
		IS_UPDATING = false;
		constructor(options) {
			super();
			this.setEventNamespace('BX.Calendar.Sync.Interface.InterfaceTemplate');
			this.title = options.title;
			this.helpdeskCode = options.helpDeskCode;
			this.titleInfoHeader = options.titleInfoHeader;
			this.descriptionInfoHeader = options.descriptionInfoHeader;
			this.titleActiveHeader = options.titleActiveHeader;
			this.descriptionActiveHeader = options.descriptionActiveHeader;
			this.sliderIconClass = options.sliderIconClass;
			this.iconPath = options.iconPath;
			this.iconLogoClass = options.iconLogoClass || '';
			this.color = options.color;
			this.provider = options.provider;
			this.connection = options.connection;
			this.popupWithUpdateButton = options.popupWithUpdateButton;
		}
		static createInstance(provider, connection = null) {
			return new this(provider, connection);
		}
		getInfoConnectionContent() {
			return main_core.Tag.render`
			<div class="calendar-sync-wrap calendar-sync-wrap-detail">
				<div class="calendar-sync-header">
					<span class="calendar-sync-header-text">${this.getHeaderTitle()}</span>
				</div>
				${this.getContentInfoBody()}
			</div>
		`;
		}
		getContentActiveBodyHeader() {
			const timestamp = this.connection.getSyncDate().getTime() / 1000;
			const syncTime = timestamp ? `${calendar_util.Util.formatDateUsable(timestamp)} ${BX.date.format(calendar_util.Util.getTimeFormatShort(), timestamp)}` : '';
			return main_core.Tag.render`
			<div class="calendar-sync__account ${this.getSyncStatusClassName()}">
				<div class="calendar-sync__account-logo">
					<div class="calendar-sync__account-logo--image ${this.getLogoIconClass()}"></div>
				</div>
				<div class="calendar-sync__account-content">
					${BX.util.htmlspecialchars(this.connection.getConnectionName())}
					${this.getAccountInfo(syncTime)}
				</div>
				${this.getActionButton()}
			</div>
		`;
		}
		getAccountInfo(syncTime) {
			if (this.connection.status === false && this.provider.getStatus() === 'failed' && this.provider.doSupportReconnectionScenario()) {
				const connectionType = main_core.Text.encode(this.provider.getFailedConnectionName());
				return main_core.Tag.render`
				<div class="calendar-sync__account-info calendar-sync__account-info-template-reconnection">
					<div class="calendar-sync__account-info--icon --animate"></div>
					${main_core.Loc.getMessage('CAL_SYNC_INFO_STATUS_ERROR_RECONNECT', {
				'#TYPE#': connectionType === 'iCloud' ? 'iCloud' : main_core.Text.capitalize(connectionType)
			})}
				</div>
			`;
			}
			return main_core.Tag.render`
			<div class="calendar-sync__account-info">
				<div class="calendar-sync__account-info--icon --animate"></div>
				${syncTime}
			</div>
		`;
		}
		getActiveConnectionContent() {
			this.disconnectButton = this.getDisconnectButton();
			return main_core.Tag.render`
			<div class="calendar-sync-wrap calendar-sync-wrap-detail">
				<div class="calendar-sync-header">
					<span class="calendar-sync-header-text">${this.getHeaderTitle()}</span>
				</div>
				<div class="calendar-sync__scope">
					<div class="calendar-sync__content --border-radius">
						<div class="calendar-sync__content-block --space-bottom">
							${this.getContentActiveBody()}
						</div>
					</div>
				</div>
				<div class="calendar-sync__disconnect-button-container">
					${this.disconnectButton}
				</div>
			</div>
		`;
		}
		getActionButton() {
			if (this.connection.status === false && this.provider.getStatus() === 'failed' && this.provider.doSupportReconnectionScenario()) {
				this.getReconnectActionButton();
			} else if (this.provider.getStatus() === 'pending') {
				this.getPendingActionButton();
			} else {
				this.getRefreshActionButton();
			}
			return this.actionButton;
		}
		getReconnectActionButton() {
			this.actionButton = main_core.Tag.render`
			<button class="ui-btn ui-btn-primary ui-btn-round calendar-sync__account-btn">
				<div class="ui-icon-set --refresh-4"></div>
				${main_core.Loc.getMessage('CAL_BUTTON_STATUS_FAILED_RECONNECT')}
				<div class="calendar-sync__account-counter">${this.COUNTER_FAILED}</div>
			</button>
		`;
			main_core.Event.bind(this.actionButton, 'click', () => this.reconnect());
		}
		getPendingActionButton() {
			this.actionButton = main_core.Tag.render`
			<button class="ui-btn ui-btn-primary ui-btn-clock ui-btn-round calendar-sync__account-btn">
				<div class="calendar-sync__account-counter">${this.COUNTER_FAILED}</div>
			</button>
		`;
		}
		getRefreshActionButton() {
			const {
				root,
				icon
			} = main_core.Tag.render`
			<button class="ui-btn ui-btn-primary ui-btn-round calendar-sync__account-btn">
				<div ref="icon" class="ui-icon-set --refresh-4"></div>
				${main_core.Loc.getMessage('CAL_REFRESH')}
			</button>
		`;
			this.actionButton = root;
			this.actionButtonIcon = icon;
			main_core.Event.bind(this.actionButton, 'click', () => this.updateConnection());
		}
		updateConnection() {
			if (this.IS_UPDATING) {
				return;
			}
			this.onUpdateConnectionStart();
			return new Promise(resolve => {
				BX.ajax.runAction('calendar.api.syncajax.updateConnection', {
					data: {
						type: 'user',
						requestUid: calendar_util.Util.registerRequestId()
					}
				}).then(response => {
					main_core_events.EventEmitter.emit('BX.Calendar.Sync.Interface.InterfaceTemplate:onRefresh', {
						data: response.data,
						event: {
							doRefreshMainSlider: true
						}
					});
					this.onUpdateConnectionEnd();
					resolve();
				});
			});
		}
		onUpdateConnectionStart() {
			this.IS_UPDATING = true;
			main_core.Dom.addClass(this.actionButtonIcon, '--hidden');
			main_core.Dom.addClass(this.actionButton, 'ui-btn-clock');
			main_core.Dom.addClass(this.disconnectButton, 'ui-btn-disabled');
			main_core.Dom.addClass(this.sectionListNode, '--disabled');
		}
		onUpdateConnectionEnd() {
			this.IS_UPDATING = false;
			main_core.Dom.removeClass(this.actionButtonIcon, '--hidden');
			main_core.Dom.removeClass(this.actionButton, 'ui-btn-clock');
			main_core.Dom.removeClass(this.disconnectButton, 'ui-btn-disabled');
			main_core.Dom.removeClass(this.sectionListNode, '--disabled');
			this.provider.closeSlider();
		}
		getContentInfoBody() {
			return main_core.Tag.render`
			${this.getContentInfoBodyHeader()}
		`;
		}
		getContentActiveBody() {
			return main_core.Tag.render`
			${this.getContentActiveBodyHeader()}
			${this.getContentActiveBodySectionsHeader()}
			${this.getContentActiveBodySectionsManager()}
		`;
		}
		showHelp(event) {
			if (top.BX.Helper) {
				top.BX.Helper.show(`redirect=detail&code=${this.helpdeskCode}`);
				event.preventDefault();
			}
		}
		getHelpdeskLink() {
			return `https://helpdesk.bitrix24.ru/open/${this.helpdeskCode}`;
		}
		getHeaderTitle() {
			return this.title;
		}
		getLogoIconClass() {
			return this.iconLogoClass;
		}
		getContentInfoBodyHeader() {
			if (!this.infoBodyHeader) {
				this.infoBodyHeader = main_core.Tag.render`
				<div class="calendar-sync-slider-section calendar-sync-slider-section-flex-wrap">
					<div class="calendar-sync-slider-header-icon ${this.sliderIconClass}"></div>
					<div class="calendar-sync-slider-header">
						<div class="calendar-sync-slider-title">
							${this.titleInfoHeader}
						</div>
						<div class="calendar-sync-slider-info">
							<span class="calendar-sync-slider-info-text">
								${this.descriptionInfoHeader}
							</span>
						</div>
						${this.getContentInfoBodyHeaderHelper()}
					</div>
				</div>
			`;
			}
			return this.infoBodyHeader;
		}
		getContentInfoBodyHeaderHelper() {
			return main_core.Tag.render`
			<div class="calendar-sync-slider-info">
				<span class="calendar-sync-slider-info-text">
					<a class="calendar-sync-slider-info-link" href="javascript:void(0);" onclick="${this.showHelp.bind(this)}">
						${main_core.Loc.getMessage('CAL_TEXT_ABOUT_WORK_SYNC')}
					</a>
				</span>
			</div>
		`;
		}
		getContentInfoWarning() {
			const mobileSyncButton = this.getMobileSyncControlButton();
			if (this.alreadyConnectedToNew) {
				main_core.Event.bind(mobileSyncButton, 'click', this.handleMobileButtonOtherSyncInfo.bind(this));
			} else {
				main_core.Event.bind(mobileSyncButton, 'click', this.handleMobileButtonConnectClick.bind(this));
			}
			return main_core.Tag.render`
			<div class="calendar-sync-slider-section-warning calendar-sync-slider-section-col">
				<div class="ui-alert ui-alert-warning ui-alert-icon-info">
					<span class="ui-alert-message">${this.warningText}
					</span>
				</div>
				<div class="calendar-sync-button-warning">${mobileSyncButton}</div>
			</div>
		`;
		}
		getMobileSyncControlButton() {
			return main_core.Tag.render`
			<button class="ui-btn ui-btn-success ui-btn-sm ui-btn-round">
				${this.mobileSyncButtonText}
			</button>
		`;
		}
		setProvider(provider) {
			this.provider = provider;
		}

		// TODO: move logic to provider
		sendRequestRemoveConnection(id) {
			BX.ajax.runAction('calendar.api.syncajax.removeConnection', {
				data: {
					connectionId: id,
					removeCalendars: 'Y' //by default
				}
			}).then(() => {
				BX.reload();
			});
		}
		runUpdateInfo() {
			BX.ajax.runAction('calendar.api.calendarajax.setSectionStatus', {
				data: {
					sectionStatus: this.sectionStatusObject
				}
			}).then(response => {
				this.emit('reDrawCalendarGrid', {});
			});
		}
		refresh(connection) {
			this.connection = connection;
			if (this.connection) {
				this.statusBlock?.setStatus(this.connection.getStatus()).setConnections([this.connection]);
			}
			main_core.Dom.replace(document.getElementById('status-info-block'), this.statusBlock?.getContent());
		}
		async reconnect() {
			if (!this.provider.doSupportReconnectionScenario()) {
				return;
			}
			this.provider.startReconnecting();
			await this.handleConnectButton();
			this.provider.closeSlider();
		}
		async handleConnectButton() {}
		getDisconnectButton() {
			// <button class="ui-btn ui-btn-primary ui-btn-round calendar-sync__account-btn">
			// 	<div class="ui-icon-set --refresh-4"></div>
			// 	${Loc.getMessage('CAL_SYNC_DISCONNECT_BUTTON')}
			// 	<div class="calendar-sync__account-counter">${this.COUNTER_FAILED}</div>
			// </button>
			//
			// <button class="ui-btn ui-btn-primary ui-btn-clock ui-btn-round">${Loc.getMessage('CAL_SYNC_DISCONNECT_BUTTON')}</button>
			const button = main_core.Tag.render`
			<button class="ui-btn ui-btn-light-border ui-btn-round calendar-sync__account-btn">
				${main_core.Loc.getMessage('CAL_SYNC_DISCONNECT_BUTTON')}
			</button>
		`;
			main_core.Event.bind(button, 'click', this.handleDisconnectButton.bind(this));
			return button;
		}
		getSyncStatusClassName() {
			return this.provider.getStatus() === 'success' || this.connection.status === true ? '--complete' : this.provider.doSupportReconnectionScenario() ? '--error-reconnect' : '--error';
		}
		getContentActiveBodySectionsHeader() {
			return main_core.Tag.render`
			<div class="calendar-sync__account-desc">${main_core.Loc.getMessage('CAL_SYNC_SELECTED_LIST_TITLE')}</div>
		`;
		}
		getContentActiveBodySectionsManager() {
			this.sectionListNode = main_core.Tag.render`
			<div class="calendar-sync__account-check-list">
				${this.getContentActiveBodySections()}
			</div>
		`;
			return this.sectionListNode;
		}
		getContentActiveBodySections() {
			const sectionList = [];
			this.sectionList.forEach(section => {
				sectionList.push(main_core.Tag.render`
				<label class="calendar-sync__account-check-list-label">
					<input type="checkbox" class="calendar-sync__account-check-list-input"
						value="${BX.util.htmlspecialchars(section.ID)}" 
						onclick="${this.onClickCheckSection.bind(this)}" ${section.ACTIVE === 'Y' ? 'checked' : ''}/>
					<span class="calendar-sync__account-check-list-text">${BX.util.htmlspecialchars(section.NAME)}</span>
				</label>
			`);
			});
			return sectionList;
		}
		showUpdateSectionListNotification() {
			calendar_util.Util.showNotification(main_core.Loc.getMessage('CAL_SYNC_CALENDAR_LIST_UPDATED'));
		}
		handleDisconnectButton(event) {
			if (main_core.Type.isElementNode(this.disconnectButton)) {
				main_core.Dom.addClass(this.disconnectButton, ['ui-btn-clock', 'ui-btn-disabled']);
			}
			event.preventDefault();
			// this.provider.removeConnection();
			this.sendRequestRemoveConnection(this.connection.getId());
		}
		deactivateConnection(id) {
			BX.ajax.runAction('calendar.api.syncajax.deactivateConnection', {
				data: {
					connectionId: id,
					removeCalendars: 'N' //by default
				}
			}).then(() => {
				this.provider.closeSlider();
				this.provider.setStatus(this.provider.STATUS_NOT_CONNECTED);
				this.provider.getInterfaceUnit().refreshButton();
				this.provider.getInterfaceUnit().setSyncStatus(this.provider.STATUS_NOT_CONNECTED);
				this.emit('reDrawCalendarGrid', {});
			});
		}
	}

	class CaldavInterfaceTemplate extends InterfaceTemplate {
		constructor(options) {
			super(options);
		}
		getContentInfoBody() {
			let options = null;
			if (this.connection !== null) {
				options = {
					server: this.connection.addParams.server,
					userName: this.connection.addParams.userName,
					connectionName: this.connection.connectionName
				};
			}
			const formObject = new ConnectionControls(options);
			const formBlock = formObject.getWrapper();
			const form = formObject.getForm();
			const button = formObject.getAddButton();
			const buttonWrapper = formObject.getButtonWrapper();
			const bodyHeader = this.getContentInfoBodyHeader();
			button.addEventListener('click', event => {
				main_core.Dom.addClass(button, ['ui-btn-clock', 'ui-btn-disabled']);
				event.preventDefault();
				this.sendRequestAddConnection(form);
			});
			main_core.Dom.append(button, buttonWrapper);
			main_core.Dom.append(buttonWrapper, form);
			main_core.Dom.append(form, formBlock);
			return main_core.Tag.render`
			${bodyHeader}
			${formBlock}
		`;
		}
		getContentActiveBody() {
			const formObject = new ConnectionControls({
				server: this.connection.addParams.server,
				userName: this.connection.addParams.userName,
				connectionName: this.connection.connectionName
			});
			const formBlock = formObject.getWrapper();
			const form = formObject.getForm();
			const bodyHeader = this.getContentActiveBodyHeader();
			main_core.Dom.append(form, formBlock);
			return main_core.Tag.render`
			${bodyHeader}
			${formBlock}
		`;
		}
		sendRequestAddConnection(form) {
			const fd = new FormData(form);
			BX.ajax.runAction('calendar.api.syncajax.addConnection', {
				data: {
					name: fd.get('name'),
					server: fd.get('server'),
					userName: fd.get('user_name'),
					pass: fd.get('password')
				}
			}).then(response => {
				BX.reload();
			}, response => {
				const button = form.querySelector('#connect-button');
				this.showAlertPopup(response.errors[0], button);
			});
		}
		showAlertPopup(alert, button) {
			let message = '';
			if (alert.code === 'incorrect_parameters') {
				message = main_core.Loc.getMessage('CAL_TEXT_ALERT_INCORRECT_PARAMETERS');
			} else if (alert.code === 'tech_problem') {
				message = main_core.Loc.getMessage('CAL_TEXT_ALERT_TECH_PROBLEM');
			} else {
				message = main_core.Loc.getMessage('CAL_TEXT_ALERT_DEFAULT');
			}
			const messageBox = new BX.UI.Dialogs.MessageBox({
				message: message,
				title: alert.message,
				buttons: BX.UI.Dialogs.MessageBoxButtons.OK,
				okCaption: main_core.Loc.getMessage('CAL_TEXT_BUTTON_RETURN_TO_SETTINGS'),
				minWidth: 358,
				mediumButtonSize: false,
				popupOptions: {
					zIndex: 3021,
					height: 166,
					width: 358,
					className: 'calendar-alert-popup-connection'
				},
				onOk: () => {
					main_core.Dom.removeClass(button, ['ui-btn-clock', 'ui-btn-disabled']);
					return true;
				}
			});
			messageBox.show();
		}
		async handleConnectButton() {
			this.provider.openInfoConnectionSlider(this.provider.getFirstFailedConnection());
		}
	}

	class CaldavTemplate extends CaldavInterfaceTemplate {
		constructor(provider, connection = null) {
			super({
				title: main_core.Loc.getMessage("CALENDAR_TITLE_CALDAV"),
				helpDeskCode: '5697365',
				titleInfoHeader: main_core.Loc.getMessage('CAL_CONNECT_CALDAV_CALENDAR'),
				descriptionInfoHeader: main_core.Loc.getMessage('CAL_CALDAV_CONNECT_DESCRIPTION'),
				titleActiveHeader: main_core.Loc.getMessage('CAL_CALDAV_CALENDAR_IS_CONNECT'),
				descriptionActiveHeader: main_core.Loc.getMessage('CAL_CALDAV_SELECTED_DESCRIPTION'),
				sliderIconClass: 'calendar-sync-slider-header-icon-caldav',
				iconPath: '/bitrix/images/calendar/sync/caldav.svg',
				color: '#1eae43',
				provider: provider,
				connection: connection,
				popupWithUpdateButton: true
			});
		}
	}

	class ExchangeTemplate extends InterfaceTemplate {
		constructor(provider, connection = null) {
			super({
				title: main_core.Loc.getMessage('CALENDAR_TITLE_EXCHANGE'),
				helpDeskCode: '9860971',
				titleInfoHeader: main_core.Loc.getMessage('CAL_CONNECT_EXCHANGE_CALENDAR'),
				descriptionInfoHeader: main_core.Loc.getMessage('CAL_EXCHANGE_CONNECT_DESCRIPTION'),
				titleActiveHeader: main_core.Loc.getMessage('CAL_EXCHANGE_CALENDAR_IS_CONNECT'),
				descriptionActiveHeader: main_core.Loc.getMessage('CAL_EXCHANGE_SELECTED_DESCRIPTION'),
				sliderIconClass: 'calendar-sync-slider-header-icon-office',
				iconLogoClass: '--exchange',
				iconPath: '/bitrix/images/calendar/sync/exchange.svg',
				color: '#54d0df',
				provider: provider,
				connection: connection,
				popupWithUpdateButton: true
			});
		}
		getContentActiveBody() {
			return main_core.Tag.render`
			${this.getContentActiveBodyHeader()}
			${this.getContentBody()}
			${this.getHelpdeskBlock()}
		`;
		}
		getActiveConnectionContent() {
			return main_core.Tag.render`
			<div class="calendar-sync-wrap calendar-sync-wrap-detail">
				<div class="calendar-sync-header">
					<span class="calendar-sync-header-text">${this.getHeaderTitle()}</span>
				</div>
				<div class="calendar-sync__scope">
					<div class="calendar-sync__content --border-radius">
						<div class="calendar-sync__content-block --space-bottom">
							${this.getContentActiveBody()}
						</div>
					</div>
				</div>
			</div>
		`;
		}
		getContentActiveBodyHeader() {
			const timestamp = this.connection.getSyncDate().getTime() / 1000;
			const syncTime = timestamp ? calendar_util.Util.formatDateUsable(timestamp) + ' ' + BX.date.format(calendar_util.Util.getTimeFormatShort(), timestamp) : '';
			return main_core.Tag.render`
			<div class="calendar-sync__account ${this.getSyncStatusClassName()}">
				<div class="calendar-sync__account-logo">
					<div class="calendar-sync__account-logo--image ${this.getLogoIconClass()}"></div>
				</div>
				<div class="calendar-sync__account-content">
					${BX.util.htmlspecialchars(this.connection.getConnectionName())}
					<div class="calendar-sync__account-info">
						<div class="calendar-sync__account-info--icon --animate"></div>
						${syncTime}
					</div>
				</div>
				${this.getActionButton()}
			</div>
		`;
		}
		getActionButton() {
			this.getRefreshActionButton();
			return this.actionButton;
		}
		getContentBody() {
			return main_core.Tag.render`
			<div class="calendar-sync__account-desc">
				${main_core.Loc.getMessage('CAL_EXCHANGE_SELECTED_DESCRIPTION')}
			</div>
		`;
		}
		getHelpdeskBlock() {
			return main_core.Tag.render`
			<div>
				<a class="calendar-sync-slider-info-link" href="javascript:void(0);" onclick="${this.showHelp.bind(this)}">
					${main_core.Loc.getMessage('CAL_TEXT_ABOUT_WORK_SYNC')}
				</a>
			</div>
		`;
		}
	}

	class SyncWizard extends main_core_events.EventEmitter {
		TYPE = 'undefined';
		SLIDER_NAME = 'calendar:sync-wizard-slider';
		SLIDER_WIDTH = 450;
		LOADER_NAME = "calendar:loader";
		cache = new main_core.Cache.MemoryCache();
		syncStagesList = [];
		accountName = '';
		HELPDESK_CODE = 11828176;
		MIN_UPDATE_STATE_DELAY = 1500; // in ms
		CONFETTI_DELAY = 1000;
		constructor(options = {}) {
			super();
			this.setEventNamespace('BX.Calendar.Sync.Interface.SyncWizard');
			this.BX = window.top.BX || window.BX;
			this.pullWizardEventHandler = this.handlePullNewEvent.bind(this);
			this.lastUpdateStateTimestamp = Date.now();
			this.logoIconClass = '';
			this.mode = main_core.Type.isStringFilled(options.mode) ? this.getValidatedMode(options.mode) : 'default';
		}
		getValidatedMode(mode) {
			if (['default', 'reconnect'].includes(mode)) {
				return mode;
			}
			return 'default';
		}
		openSlider() {
			const content = this.getContent();
			if (this.mode !== 'reconnect') {
				BX.SidePanel.Instance.open(this.SLIDER_NAME, {
					contentCallback: slider => {
						return new Promise((resolve, reject) => {
							resolve(content);
						});
					},
					allowChangeHistory: false,
					events: {
						onLoad: () => {
							this.displaySyncStages();
							this.bindButtonsHandlers();
						},
						onDestroy: this.handleCloseWizard.bind(this)
					},
					cacheable: false,
					width: this.SLIDER_WIDTH,
					loader: this.LOADER_NAME
				});
			}
			this.slider = BX.SidePanel.Instance.getTopSlider();
			this.syncIsFinished = false;
			this.errorStatus = false;
		}
		getContent() {
			return main_core.Tag.render`
			<div class="calendar-sync__wrapper calendar-sync__scope">
				<div class="calendar-sync__content --border-radius">
					<div class="calendar-sync__content-block --space-bottom">
						${this.getTitleWrapper()}
						${this.getSyncStagesWrapper()}
						${this.getInfoStatusWrapper()}
						${this.getErrorWrapper()}
						${this.getFinalCheckWrapper()}
						${this.getHelpLinkWrapper()}
						${this.getButtonWrapper()}
					</div>
				</div>
			</div>
		`;
		}
		getTitleWrapper() {
			this.syncTitleWrapper = main_core.Tag.render`
			<div class="calendar-sync__account">
				<div class="calendar-sync__account-logo">
					<div class="calendar-sync__account-logo--image ${this.getLogoIconClass()}"></div>
				</div>
				<div class="calendar-sync__account-content">
					${this.getAccountNameNode()}
					<div class="calendar-sync__account-info">
						<div class="calendar-sync__account-info--icon --animate"></div>
						${this.getActiveStatusNode()}
					</div>
				</div>
			</div>
		`;
			return this.syncTitleWrapper;
		}
		getSyncStagesWrapper() {
			this.syncStagesWrapper = main_core.Tag.render`<div class="calendar-sync-stages-wrap"></div>`;
			return this.syncStagesWrapper;
		}
		getInfoStatusWrapper() {
			this.infoStatusWrapper = main_core.Tag.render`
			<div class="calendar-sync__content-block --space-bottom-xl" style="display: none;">
				<div class="calendar-sync__notification">
					<div class="calendar-sync__notification-title">${main_core.Loc.getMessage('CAL_INFO_STATUS_CONG_1')}</div>
					<div class="calendar-sync__notification-message">${main_core.Loc.getMessage('CAL_INFO_STATUS_CONG_2')}</div>
				</div>
			</div>
		`;
			return this.infoStatusWrapper;
		}
		getErrorWrapper() {
			this.errorWrapper = main_core.Tag.render`
			<div class="calendar-sync__content-block --space-bottom-xl" style="display: none;">
				<div class="calendar-sync__error">
					<div class="calendar-sync__notification-message">
						<div class="calendar-sync__notification-message-inner">
							${main_core.Loc.getMessage('CAL_ERROR_WARN_1')}
						</div>
						${main_core.Loc.getMessage('CAL_ERROR_WARN_2')}</div>
				</div>
			</div>
		`;
			return this.errorWrapper;
		}
		getHelpLinkWrapper() {
			this.helpLinkWrapper = main_core.Tag.render`
			<div class="calendar-sync__content-block" style="display: none;"></div>
		`;
			return this.helpLinkWrapper;
		}
		getFinalCheckWrapper() {
			this.finalCheckWrapper = main_core.Tag.render`
			<div class="calendar-sync__content-block" style="display: none;"></div>
		`;
			return this.finalCheckWrapper;
		}
		getButtonWrapper() {
			this.buttonWrapper = main_core.Tag.render`
			<div style="display: none" class="calendar-sync__content-block --align-center">
				<a class="ui-btn ui-btn-lg ui-btn-primary ui-btn-round" data-role="continue_btn">
					${main_core.Loc.getMessage('CAL_BUTTON_CONTINUE')}
				</a>
				<a style="display: none" class="ui-btn ui-btn-lg ui-btn-light-border ui-btn-round" data-role="everything_is_fine_btn">
					${main_core.Loc.getMessage('CAL_BUTTON_EVERYTHING_IS_FINE')}
				</a>
				<a style="display: none" class="ui-btn ui-btn-lg ui-btn-light-border ui-btn-round" data-role="close_button">
					${main_core.Loc.getMessage('CAL_ERROR_CLOSE')}
				</a>
			</div>
		`;
			return this.buttonWrapper;
		}
		getNewEventCardWrapper() {
			this.newEventCardWrapper = main_core.Tag.render`
			<div class="calendar-sync__content-block --space-bottom" style="display: none;"></div>
		`;
			return this.newEventCardWrapper;
		}
		getSkeletonWrapper() {
			this.skeletonWrapper = main_core.Tag.render`
			<div class="calendar-sync__content-block --space-bottom">
					<div class="calendar-sync__balloon --skeleton">
						<div class="calendar-sync__balloon__skeleton-box">
							<div class="calendar-sync__balloon__skeleton-inline-box">
								<div class="calendar-sync__balloon__skeleton-circle"></div>
								<div class="calendar-sync__balloon__skeleton-line"></div>
							</div>
							<div class="calendar-sync__balloon__skeleton-line"></div>
						</div>
						<div class="calendar-sync__content-text">${this.getSkeletonTitle()}</div>
					</div>
				</div>
		`;
			return this.skeletonWrapper;
		}
		getSkeletonTitle() {
			return '';
		}
		getExtraInfoWithCheckIcon() {
			const alreadyConnected = Object.values(this.connectionsProviders).filter(item => {
				return item.mainPanel && item.status;
			}).length > 0;
			return main_core.Tag.render`
			<div class="calendar-sync__content-text --icon-check${alreadyConnected ? ' --disabled' : ''}">
				${main_core.Loc.getMessage('CAL_SYNC_INFO_PROMO')}
			</div>
		`;
		}
		getAccountNameNode() {
			if (!main_core.Type.isElementNode(this.accountNameNode)) {
				this.accountNameNode = main_core.Tag.render`
			<div class="calendar-sync__account-title">${this.getAccountName()}</div>
		`;
			}
			return this.accountNameNode;
		}
		setAccountName(value) {
			this.accountName = value;
		}
		getAccountName() {
			return this.accountName;
		}
		getActiveStatusNode() {
			if (!main_core.Type.isElementNode(this.activeStatusNode)) {
				this.activeStatusNode = main_core.Tag.render`
				<span class="calendar-active-status-node-carousel">
					<span class="calendar-active-status-node-phrase">
						${main_core.Loc.getMessage('CAL_STATUS_SYNC_IN_PROGRESS')}
					</span>
				</span>
			`;
				this.startStatusCarousel(this.activeStatusNode);
			}
			return this.activeStatusNode;
		}
		startStatusCarousel(statusNode) {
			const progressStatuses = [main_core.Loc.getMessage('CAL_STATUS_SYNC_IN_PROGRESS_STATUSES_FIRST'), main_core.Loc.getMessage('CAL_STATUS_SYNC_IN_PROGRESS_STATUSES_SECOND')];
			let dotCycle = 1;
			this.statusCarouselInterval = setInterval(() => {
				const currentPhraseNode = statusNode.firstElementChild;
				if (!main_core.Type.isElementNode(currentPhraseNode)) {
					clearInterval(this.statusCarouselInterval);
					return;
				}
				if (this.countDots(currentPhraseNode.innerText) < 3) {
					currentPhraseNode.innerText += '.';
					statusNode.style.width = currentPhraseNode.offsetWidth + 1 + 'px';
					return;
				}
				if (dotCycle < 2) {
					dotCycle++;
					currentPhraseNode.innerText = currentPhraseNode.innerText.slice(0, -3);
					return;
				}
				dotCycle = 1;
				if (progressStatuses.length > 0) {
					const status = progressStatuses.shift();
					this.animateNextStatus(statusNode, status);
				} else {
					const almostDoneStatus = main_core.Loc.getMessage('CAL_STATUS_SYNC_IN_PROGRESS_ALMOST_DONE');
					this.animateNextStatus(statusNode, almostDoneStatus);
					statusNode.style.width = '';
					clearInterval(this.statusCarouselInterval);
				}
			}, 900);
		}
		animateNextStatus(carousel, phraseText) {
			const currentPhraseNode = carousel.firstElementChild;
			const nextPhraseNode = main_core.Tag.render`
			<span class="calendar-active-status-node-phrase">${phraseText}</span>
		`;
			carousel.append(nextPhraseNode);
			const maxWidth = Math.max(nextPhraseNode.offsetWidth, currentPhraseNode.offsetWidth);
			carousel.style.width = maxWidth + 1 + 'px';
			currentPhraseNode.style.transition = ''; // turn on animation
			currentPhraseNode.style.transform = `translateX(-${currentPhraseNode.offsetWidth}px)`;
			nextPhraseNode.style.transform = `translateX(-${currentPhraseNode.offsetWidth}px)`;
			setTimeout(() => {
				currentPhraseNode.remove();
				nextPhraseNode.style.transition = 'none'; // turn off animation
				nextPhraseNode.style.transform = '';
			}, 300);
		}
		countDots(string) {
			return (string.match(/\./g) || []).length;
		}
		setSyncStages() {
			this.syncStagesList = [];
		}
		getSyncStages() {
			return this.syncStagesList;
		}
		getHelpDeskCode() {
			return this.HELPDESK_CODE;
		}
		displaySyncStages() {
			main_core.Dom.clean(this.syncStagesWrapper);
			this.getSyncStages().forEach(stage => {
				stage.renderTo(this.syncStagesWrapper);
			});
		}
		bindButtonsHandlers() {
			const continueButton = this.buttonWrapper.querySelector('.ui-btn[data-role="continue_btn"]');
			if (main_core.Type.isElementNode(continueButton)) {
				main_core.Event.bind(continueButton, 'click', this.handleContinueButtonClick.bind(this));
			}
			const eifButton = this.buttonWrapper.querySelector('.ui-btn[data-role="everything_is_fine_btn"]');
			if (main_core.Type.isElementNode(eifButton)) {
				main_core.Event.bind(eifButton, 'click', this.handleFinalCloseButtonClick.bind(this));
			}
		}
		handleContinueButtonClick() {
			this.showFinalStage();
		}
		showFinalStage() {
			this.syncIsFinished = true;
			const eifButton = this.buttonWrapper.querySelector('.ui-btn[data-role="everything_is_fine_btn"]');
			if (main_core.Type.isElementNode(eifButton)) {
				eifButton.style.display = '';
			}
			const continueButton = this.buttonWrapper.querySelector('.ui-btn[data-role="continue_btn"]');
			if (main_core.Type.isElementNode(continueButton)) {
				continueButton.style.display = 'none';
			}
			this.showFinalCheckWrapper();
			this.showHelpLinkWrapper();
			this.hideSyncStagesWrapper();
			this.hideInfoStatusWrapper();
			calendar_util.Util.getBX().Event.EventEmitter.subscribe('onPullEvent-calendar', this.pullWizardEventHandler);
			this.emit('startWizardWaitingMode');
		}
		isSyncFinished() {
			return this.syncIsFinished;
		}
		handleFinalCloseButtonClick() {
			BX.SidePanel.Instance.getOpenSliders().forEach(slider => {
				if (['calendar:sync-slider', 'calendar:section-slider', this.SLIDER_NAME].includes(slider.getUrl())) {
					slider.close();
				}
			});
		}
		handleUpdateState(stateData) {
			const currentTimestamp = Date.now();
			if (currentTimestamp - this.lastUpdateStateTimestamp > this.MIN_UPDATE_STATE_DELAY) {
				this.updateState(stateData);
			} else {
				setTimeout(() => {
					this.handleUpdateState(stateData);
				}, this.MIN_UPDATE_STATE_DELAY);
			}
		}
		updateState(stateData) {
			if (this.errorStatus) {
				return;
			}
			if (stateData.stage === 'connection_created' && stateData.accountName && main_core.Type.isElementNode(this.accountNameNode)) {
				this.setAccountName(stateData.accountName);
				this.accountNameNode.innerHTML = main_core.Text.encode(stateData.accountName);
			}
			this.lastUpdateStateTimestamp = Date.now();
		}
		setActiveStatusFinished() {
			this.activeStatusNode.style.width = '';
			clearInterval(this.statusCarouselInterval);
			this.syncIsFinished = true;
			if (main_core.Type.isElementNode(this.activeStatusNode)) {
				this.activeStatusNode.innerHTML = main_core.Text.encode(main_core.Loc.getMessage('CAL_STATUS_SYNC_SUCCESS').toUpperCase());
				main_core.Dom.remove(this.syncTitleWrapper.querySelector('.calendar-sync__account-info--icon'));
			}
		}
		showButtonWrapper() {
			if (main_core.Type.isElementNode(this.buttonWrapper)) {
				this.buttonWrapper.style.display = '';
			}
		}
		hideButtonWrapper() {
			if (main_core.Type.isElementNode(this.buttonWrapper)) {
				this.buttonWrapper.style.display = 'none';
			}
		}
		showInfoStatusWrapper() {
			if (main_core.Type.isElementNode(this.infoStatusWrapper)) {
				this.infoStatusWrapper.style.display = '';
			}
		}
		hideInfoStatusWrapper() {
			if (main_core.Type.isElementNode(this.infoStatusWrapper)) {
				this.infoStatusWrapper.style.display = 'none';
			}
		}
		showErrorWrapper() {
			if (main_core.Type.isElementNode(this.errorWrapper)) {
				this.errorWrapper.style.display = '';
			}
		}
		hideErrorWrapper() {
			if (main_core.Type.isElementNode(this.errorWrapper)) {
				this.errorWrapper.style.display = 'none';
			}
		}
		showFinalCheckWrapper() {
			if (main_core.Type.isElementNode(this.finalCheckWrapper)) {
				this.finalCheckWrapper.style.display = '';
			}
		}
		hideFinalCheckWrapper() {
			if (main_core.Type.isElementNode(this.finalCheckWrapper)) {
				this.finalCheckWrapper.style.display = 'none';
			}
		}
		showSyncStagesWrapper() {
			if (main_core.Type.isElementNode(this.syncStagesWrapper)) {
				this.syncStagesWrapper.style.display = '';
			}
		}
		hideSyncStagesWrapper() {
			if (main_core.Type.isElementNode(this.syncStagesWrapper)) {
				this.syncStagesWrapper.style.display = 'none';
			}
		}
		showHelpLinkWrapper() {
			if (main_core.Type.isElementNode(this.helpLinkWrapper)) {
				this.helpLinkWrapper.style.display = '';
			}
		}
		hideHelpLinkWrapper() {
			if (main_core.Type.isElementNode(this.helpLinkWrapper)) {
				this.helpLinkWrapper.style.display = 'none';
			}
		}
		handlePullNewEvent(event) {
			if (event && main_core.Type.isFunction(event.getData)) {
				const data = {
					command: event.getData()[0],
					...event.getData()[1]
				};
				if (data.command === 'edit_event' && data.newEvent) {
					if (main_core.Type.isElementNode(this.finalCheckWrapper)) {
						const syncBalloon = this.finalCheckWrapper.querySelector('.calendar-sync__balloon');
						if (main_core.Type.isElementNode(syncBalloon) && main_core.Dom.hasClass(syncBalloon, '--progress')) {
							main_core.Dom.removeClass(syncBalloon, '--progress');
							main_core.Dom.addClass(syncBalloon, '--done');
						}
					}
					const entry = new calendar_entry.Entry({
						data: data.fields
					});
					this.displayNewEvent(entry);
					calendar_util.Util.getBX().Event.EventEmitter.unsubscribe('onPullEvent-calendar', this.pullWizardEventHandler);
					const eifButton = this.buttonWrapper.querySelector('.ui-btn[data-role="everything_is_fine_btn"]');
					if (main_core.Type.isElementNode(eifButton)) {
						eifButton.innerHTML = main_core.Text.encode(main_core.Loc.getMessage('CAL_BUTTON_KEEP_GOING'));
						main_core.Dom.addClass(eifButton, 'ui-btn-primary');
						main_core.Dom.removeClass(eifButton, 'ui-btn-light-border');
					}
					this.emit('endWizardWaitingMode');
				}
			}
		}
		displayNewEvent(entry) {
			// Hide skeleton
			if (main_core.Type.isElementNode(this.skeletonWrapper)) {
				main_core.Dom.remove(this.skeletonWrapper);
			}
			if (main_core.Type.isElementNode(this.newEventCardWrapper)) {
				this.newEventCardWrapper.style.display = '';
				main_core.Dom.clean(this.newEventCardWrapper);
				this.newEventCardWrapper.appendChild(this.getNewEventCard(entry));
			}
		}
		getNewEventCard(entry) {
			const from = new Date(entry.from.getTime() - (parseInt(entry.data['~USER_OFFSET_FROM']) || 0) * 1000);
			const to = new Date(entry.to.getTime() - (parseInt(entry.data['~USER_OFFSET_TO']) || 0) * 1000);
			const fromTimestamp = from.getTime();
			const dateFrom = BX.date.format(calendar_util.Util.getDayMonthFormat(), fromTimestamp / 1000);
			const timeFrom = calendar_util.Util.formatTime(from.getHours(), from.getMinutes());
			const timeTo = calendar_util.Util.formatTime(to.getHours(), to.getMinutes());
			const timeField = entry.isFullDay() ? main_core.Loc.getMessage('CAL_WIZARD_FULL_DAY') : timeFrom + ' - ' + timeTo;
			this.newEventCard = main_core.Tag.render`
			<div class="calendar-sync__balloon --calendar ${entry.isFullDay() ? '--fullday-event' : ''}">
				<div class="calendar-sync__content-text">
					${dateFrom}
					<span class="calendar-date-year">
						${BX.date.format('Y', fromTimestamp / 1000)}
					</span>
				</div>
				<div class="calendar-sync__content-text">${BX.date.format('l', fromTimestamp / 1000)}</div>
				<div class="calendar-sync__time-box">
					<div class="calendar-sync__time">
						<div class="calendar-sync__time-date">${timeFrom}</div>
						<div class="calendar-sync__time-line"></div>
					</div>
					<div class="calendar-sync__time-notification-box">
						<div class="calendar-sync__content-text">${main_core.Text.encode(entry.getName())}</div>
						<div class="calendar-sync__content-text">${timeField}</div>
					</div>
					<div class="calendar-sync__time">
						<div class="calendar-sync__time-date">${timeTo}</div>
						<div class="calendar-sync__time-line"></div>
					</div>
				</div>
			</div>
		`;
			return this.newEventCard;
		}
		handleCloseWizard() {
			this.slider = null;
			clearInterval(this.statusCarouselInterval);
			calendar_util.Util.getBX().Event.EventEmitter.unsubscribe('onPullEvent-calendar', this.pullWizardEventHandler);
			this.emit('onClose');
		}
		showConfetti() {
			setTimeout(() => {
				const bx = calendar_util.Util.getBX();
				bx.UI.Confetti.fire({
					particleCount: 240,
					spread: 170,
					origin: {
						y: 0.3,
						x: 0.9
					},
					zIndex: bx.SidePanel.Instance.getTopSlider().getZindex() + 1
				});
			}, this.CONFETTI_DELAY);
		}
		getLogoIconClass() {
			return this.logoIconClass;
		}
		getSlider() {
			return this.slider;
		}
		setErrorState() {
			this.errorStatus = true;
			clearInterval(this.statusCarouselInterval);
			this.showErrorWrapper();
			this.hideInfoStatusWrapper();
			this.hideSyncStagesWrapper();
			this.showButtonWrapper();
			main_core.Dom.addClass(this.syncTitleWrapper, '--error');
			if (main_core.Type.isElementNode(this.activeStatusNode)) {
				this.activeStatusNode.innerHTML = main_core.Text.encode(main_core.Loc.getMessage('CAL_STATUS_SYNC_ERROR').toUpperCase());
			}
			const closeButton = this.buttonWrapper.querySelector('.ui-btn[data-role="close_button"]');
			if (main_core.Type.isElementNode(closeButton)) {
				closeButton.style.display = '';
				main_core.Event.bind(closeButton, 'click', () => {
					BX.SidePanel.Instance.getOpenSliders().forEach(slider => {
						if (['calendar:sync-slider', 'calendar:section-slider', this.SLIDER_NAME].includes(slider.getUrl())) {
							slider.close();
						}
					});
					BX.reload();
				});
			}
			const continueButton = this.buttonWrapper.querySelector('.ui-btn[data-role="continue_btn"]');
			if (main_core.Type.isElementNode(continueButton)) {
				continueButton.style.display = 'none';
			}
		}
	}

	class SyncStageUnit {
		constructor(options) {
			this.name = options.name || '';
			this.title = options.title || '';
			this.doneStatus = false;
		}
		renderTo(outerWrapper) {
			if (main_core.Type.isElementNode(outerWrapper)) {
				outerWrapper.appendChild(this.getContent());
			}
			main_core_events.EventEmitter.emit('BX.Calendar.Sync.Interface.SyncStageUnit:onRenderDone');
		}
		getContent() {
			this.contentNode = main_core.Tag.render`
			<div class="calendar-sync__content-block --space-bottom-xl">
				<div class="calendar-sync__content-text --icon-check --disabled">${this.title}</div>
			</div>
		`;
			return this.contentNode;
		}
		setDone() {
			this.doneStatus = true;
			main_core.Dom.removeClass(this.contentNode?.querySelector('.--icon-check'), '--disabled');
		}
		setUndone() {
			this.doneStatus = false;
			main_core.Dom.addClass(this.contentNode?.querySelector('.--icon-check'), '--disabled');
		}
	}

	class GoogleSyncWizard extends SyncWizard {
		TYPE = 'google';
		SLIDER_NAME = 'calendar:sync-wizard-google';
		STAGE_1_CODE = 'google-to-b24';
		STAGE_2_CODE = 'b24-to-google';
		STAGE_3_CODE = 'b24-events-to-google';
		GOOGLE_ON_MOBILE_HELPDESK = 15_456_338;
		constructor(options = {}) {
			super(options);
			this.setEventNamespace('BX.Calendar.Sync.Interface.GoogleSyncWizard');
			this.setAccountName(main_core.Loc.getMessage('CALENDAR_TITLE_GOOGLE'));
			this.setSyncStages();
			this.logoIconClass = '--google';
		}
		getHelpLinkWrapper() {
			let link = '';
			this.helpLinkWrapper = main_core.Tag.render`
			<div class="calendar-sync__content-block --align-center --space-bottom" style="display: none;">
				${link = main_core.Tag.render`<a href="#" class="calendar-sync__content-link">
					${main_core.Loc.getMessage('CAL_SYNC_NO_GOOGLE_ON_PHONE')}
				</a>`}
			</div>
		`;
			main_core.Event.bind(link, 'click', () => {
				const helper = calendar_util.Util.getBX().Helper;
				if (helper) {
					helper.show(`redirect=detail&code=${this.GOOGLE_ON_MOBILE_HELPDESK}`);
				}
			});
			return this.helpLinkWrapper;
		}
		getFinalCheckWrapper() {
			this.finalCheckWrapper = main_core.Tag.render`
			<div style="display: none;">
				<div class="calendar-sync__content-block --space-bottom">
					<div class="calendar-sync__balloon --progress">
						<div class="calendar-sync__content-text calendar-sync__content-title --show-for-progress">${main_core.Loc.getMessage('CAL_SYNC_LETS_CHECK')}</div>
						<div class="calendar-sync__content-text calendar-sync__content-subtitle --show-for-progress">${main_core.Loc.getMessage('CAL_SYNC_CREATE_EVENT_GOOGLE')}</div>
						<div class="calendar-sync__content-text calendar-sync__content-title --show-for-done">${main_core.Loc.getMessage('CAL_SYNC_NEW_EVENT_ADDED_GOOGLE')}</div>
						<div class="calendar-sync__content-text calendar-sync__content-subtitle --show-for-done">${main_core.Loc.getMessage('CAL_SYNC_NEW_EVENT_YOULL_SEE')}</div>
						<div class="calendar-sync__balloon--icon"></div>
					</div>
				</div>
				${this.getSkeletonWrapper()}
				${this.getNewEventCardWrapper()}
			</div>
		`;
			return this.finalCheckWrapper;
		}
		setSyncStages() {
			this.syncStagesList = [new SyncStageUnit({
				name: this.STAGE_1_CODE,
				title: main_core.Loc.getMessage('CAL_SYNC_STAGE_GOOGLE_1')
			}), new SyncStageUnit({
				name: this.STAGE_2_CODE,
				title: main_core.Loc.getMessage('CAL_SYNC_STAGE_GOOGLE_2')
			}), new SyncStageUnit({
				name: this.STAGE_3_CODE,
				title: main_core.Loc.getMessage('CAL_SYNC_STAGE_GOOGLE_3')
			})];
		}
		updateState(stateData) {
			super.updateState(stateData);
			this.getSyncStages().forEach(stage => {
				if (stateData.stage === 'connection_created' && stage.name === this.STAGE_1_CODE) {
					stage.setDone();
				} else if (stateData.stage === 'import_finished' && (stage.name === this.STAGE_1_CODE || stage.name === this.STAGE_2_CODE)) {
					stage.setDone();
				} else if (stateData.stage === 'export_finished') {
					stage.setDone();
					if (stage.name === this.STAGE_3_CODE) {
						if (this.mode === 'reconnecting') {
							this.handleCloseWizard();
						} else {
							this.setActiveStatusFinished();
							this.showButtonWrapper();
							this.showInfoStatusWrapper();
						}
						this.showConfetti();
						this.emit('onConnectionCreated');
					}
				}
			});
		}
		getSkeletonTitle() {
			return main_core.Loc.getMessage('CAL_SYNC_NEW_EVENT_GOOGLE_TITLE');
		}
	}

	class GoogleTemplate extends InterfaceTemplate {
		HANDLE_CONNECTION_DELAY = 500;
		constructor(provider, connection = null) {
			super({
				title: main_core.Loc.getMessage("CALENDAR_TITLE_GOOGLE"),
				helpDeskCode: '6030429',
				titleInfoHeader: main_core.Loc.getMessage('CAL_CONNECT_GOOGLE_CALENDAR'),
				descriptionInfoHeader: main_core.Loc.getMessage('CAL_GOOGLE_CONNECT_DESCRIPTION'),
				titleActiveHeader: main_core.Loc.getMessage('CAL_GOOGLE_CALENDAR_IS_CONNECT'),
				descriptionActiveHeader: main_core.Loc.getMessage('CAL_GOOGLE_SELECTED_DESCRIPTION'),
				sliderIconClass: 'calendar-sync-slider-header-icon-google',
				iconPath: '/bitrix/images/calendar/sync/google.svg',
				iconLogoClass: '--google',
				color: '#387ced',
				provider: provider,
				connection: connection,
				popupWithUpdateButton: true
			});
			this.sectionStatusObject = {};
			this.sectionList = [];
			this.handleSuccessConnectionDebounce = main_core.Runtime.debounce(this.handleSuccessConnection, this.HANDLE_CONNECTION_DELAY, this);
		}
		async createConnection() {
			const syncLink = await this.provider.getSyncLink();
			BX.util.popup(syncLink, 500, 600);
			main_core.Event.bind(window, 'hashchange', this.handleSuccessConnectionDebounce);
			main_core.Event.bind(window, 'message', this.handleSuccessConnectionDebounce);
		}
		handleSuccessConnection(event) {
			if (window.location.hash === '#googleAuthSuccess' || event.data.title === 'googleAuthSuccess') {
				calendar_util.Util.removeHash();
				this.provider.setWizardSyncMode(true);
				this.provider.saveConnection();
				this.openSyncWizard();
				this.provider.setStatus(this.provider.STATUS_SYNCHRONIZING);
				this.provider.getInterfaceUnit().setSyncStatus(this.provider.STATUS_SYNCHRONIZING);
				this.provider.getInterfaceUnit().refreshButton();
				if (this.provider.isReconnecting()) {
					this.provider.emit('onReconnecting');
				}
				main_core.Event.unbind(window, 'hashchange', this.handleSuccessConnectionDebounce);
				main_core.Event.unbind(window, 'message', this.handleSuccessConnectionDebounce);
			}
		}
		getSectionsForGoogle() {
			return new Promise(resolve => {
				BX.ajax.runAction('calendar.api.syncajax.getAllSectionsForGoogle', {
					data: {
						connectionId: this.connection.addParams.id
					}
				}).then(response => {
					this.sectionList = response.data;
					resolve(response.data);
				}, response => {
					resolve(response.errors);
				});
			});
		}
		onClickCheckSection(event) {
			this.sectionStatusObject[event.target.value] = event.target.checked;
			this.runUpdateInfo();
			this.showUpdateSectionListNotification();
		}
		showAlertPopup() {
			const messageBox = new ui_dialogs_messagebox.MessageBox({
				useAirDesign: true,
				className: this.id,
				message: main_core.Loc.getMessage('GOOGLE_IS_NOT_CALDAV_SETTINGS_WARNING_MESSAGE'),
				width: 500,
				offsetLeft: 60,
				offsetTop: 5,
				padding: 7,
				onOk: () => {
					messageBox.close();
				},
				okCaption: 'OK',
				buttons: BX.UI.Dialogs.MessageBoxButtons.OK,
				popupOptions: {
					zIndexAbsolute: 4020,
					autoHide: true,
					animation: 'fading-slide'
				}
			});
			messageBox.show();
		}
		async handleConnectButton() {
			if (this.provider.hasSetSyncGoogleSettings()) {
				await this.createConnection();
			} else {
				this.provider.endReconnecting();
				this.showAlertPopup();
			}
		}
		openSyncWizard() {
			if (!this.wizard) {
				const mode = this.provider.isStartedReconnecting ? 'reconnect' : 'default';
				this.wizard = new GoogleSyncWizard({
					mode
				});
				this.wizard.openSlider();
				this.provider.setActiveWizard(this.wizard);
			}
		}
		sendRequestRemoveConnection(id) {
			this.deactivateConnection(id);
		}
	}

	class IcloudAuthDialog extends main_core_events.EventEmitter {
		zIndex = 3100;
		DOM = {};
		appPasswordTemplate = 'xxxx-xxxx-xxxx-xxxx';
		constructor(options = {}) {
			super();
			this.type = options.type;
			this.setEventNamespace('BX.Calendar.Sync.Icloud');
			this.keyHandler = this.handleKeyPress.bind(this);
			this.checkOutsideClickClose = this.checkOutsideClickClose.bind(this);
			this.outsideMouseDownClose = this.outsideMouseDownClose.bind(this);
			this.initAlertBlock();
		}
		show() {
			this.popup = new main_popup.Popup({
				className: 'calendar-sync__auth-popup calendar-sync__scope',
				titleBar: main_core.Loc.getMessage('CAL_ICLOUD_AUTH_TITLE'),
				draggable: {
					restrict: true
				},
				content: this.getContainer(),
				width: 475,
				animation: 'fading-slide',
				zIndexAbsolute: this.zIndex,
				cacheable: false,
				closeByEsc: true,
				closeIcon: true,
				contentBackground: "#fff",
				overlay: {
					opacity: 15
				},
				lightShadow: true,
				buttons: [new BX.UI.Button({
					text: main_core.Loc.getMessage('CAL_ICLOUD_CONNECT_BUTTON'),
					className: `ui-btn ui-btn-md ui-btn-success ui-btn-round`,
					events: {
						click: this.authorize.bind(this)
					}
				}), new BX.UI.Button({
					text: main_core.Loc.getMessage('EC_SEC_SLIDER_CANCEL'),
					className: 'ui-btn ui-btn-md ui-btn-light-border ui-btn-round',
					events: {
						click: this.close.bind(this)
					}
				})],
				events: {
					onPopupClose: this.close.bind(this)
				}
			});
			this.popup.show();
			main_core.Event.bind(document, 'keydown', this.keyHandler);
			main_core.Event.bind(document, 'mouseup', this.checkOutsideClickClose);
			main_core.Event.bind(document, 'mousedown', this.outsideMouseDownClose);
		}
		authorize() {
			if (this.isFormDataValid()) {
				const saveBtn = this.popup.getButtons()[0];
				saveBtn.setClocking(true);
				saveBtn.setDisabled(true);
				const cancelButton = this.popup.getButtons()[1];
				cancelButton.setDisabled(true);
				if (this.DOM.container.contains(this.DOM.alertBlock)) {
					main_core.Dom.remove(this.DOM.alertBlock);
				}
				this.emit('onSubmit', new main_core_events.BaseEvent({
					data: {
						appleId: this.DOM.appleIdInput.value.toString().trim(),
						appPassword: this.DOM.appPasswordInput.value.toString().trim()
					}
				}));
			} else {
				this.highlightInvalidFormData();
			}
		}
		isFormDataValid() {
			return this.DOM.appleIdInput.value.toString().trim() !== '' && this.DOM.appPasswordInput.value.toString().trim() !== '';
		}
		highlightInvalidFormData() {
			const saveBtn = this.popup.getButtons()[0];
			saveBtn.setClocking(false);
			saveBtn.setDisabled(false);
			const cancelButton = this.popup.getButtons()[1];
			cancelButton.setDisabled(false);
			if (this.DOM.appleIdInput.value.toString().trim() === '') {
				this.highlightInvalidAppleIdInput();
			}
			if (this.DOM.appPasswordInput.value.toString().trim() === '') {
				this.highlightInvalidPasswordInput();
			}
		}
		highlightInvalidAppleIdInput() {
			main_core.Dom.addClass(this.DOM.appleIdInput, 'calendar-field-string-error');
			const clearInvalidation = () => {
				main_core.Dom.removeClass(this.DOM.appleIdInput, 'calendar-field-string-error');
				main_core.Event.unbind(this.DOM.appleIdInput, 'change', clearInvalidation);
				main_core.Event.unbind(this.DOM.appleIdInput, 'keyup', clearInvalidation);
			};
			main_core.Event.bind(this.DOM.appleIdInput, 'change', clearInvalidation);
			main_core.Event.bind(this.DOM.appleIdInput, 'keyup', clearInvalidation);
		}
		highlightInvalidPasswordInput() {
			main_core.Dom.addClass(this.DOM.appPasswordInput, 'calendar-field-string-error');
			const clearInvalidation = () => {
				main_core.Dom.removeClass(this.DOM.appPasswordInput, 'calendar-field-string-error');
				main_core.Event.unbind(this.DOM.appPasswordInput, 'change', clearInvalidation);
				main_core.Event.unbind(this.DOM.appPasswordInput, 'keyup', clearInvalidation);
			};
			main_core.Event.bind(this.DOM.appPasswordInput, 'change', clearInvalidation);
			main_core.Event.bind(this.DOM.appPasswordInput, 'keyup', clearInvalidation);
			this.DOM.appPasswordInput.focus();
		}
		enableSaveButton() {
			const saveBtn = this.popup.getButtons()[0];
			saveBtn.setDisabled(false);
			const cancelButton = this.popup.getButtons()[1];
			cancelButton.setDisabled(false);
		}
		getContainer() {
			this.DOM.container = main_core.Tag.render`
			<div>
				${this.getAppleInfoBlock()}
				<div class="calendar-sync__auth-popup--row" id="calendar-apple-id-block">
					${this.getAppleIdTitle()}
					${this.getAppleIdInput()}
					${this.getAppleIdError()}
				</div>
				<div class="calendar-sync__auth-popup--row" id="calendar-apple-pass-block">
					<div class="calendar-sync__auth-popup--label-block">
						${this.getAppPasswordTitle()}
						${this.getLearnMoreButton()}
					</div>
					<div class="ui-ctl ui-ctl-w100 ui-ctl-after-icon">
						${this.getAppPasswordInput()}
						${this.getShowHidePasswordIcon()}
					</div>
					${this.getAppPasswordError()}
				</div>
			</div>
		`;
			return this.DOM.container;
		}
		getAppleInfoBlock() {
			if (!this.DOM.appleInfo) {
				this.DOM.appleInfo = main_core.Tag.render`
				<div class="calendar-sync__auth-popup--info">
					<div class="calendar-sync__auth-popup--logo-image --icloud"></div>
					<div class="calendar-sync__auth-popup--logo-text">${main_core.Loc.getMessage('CAL_ICLOUD_INFO_BLOCK')}</div>
				</div>
			`;
			}
			return this.DOM.appleInfo;
		}
		getAppleIdTitle() {
			if (!this.DOM.appleIdTitle) {
				this.DOM.appleIdTitle = main_core.Tag.render`
			<p class="calendar-sync__auth-popup--label-text">
				${main_core.Loc.getMessage('CAL_ICLOUD_APPLE_ID_PLACEHOLDER')}
			</p>
			`;
			}
			return this.DOM.appleIdTitle;
		}
		getAppPasswordTitle() {
			if (!this.DOM.appPasswordTitle) {
				this.DOM.appPasswordTitle = main_core.Tag.render`
				<p class="calendar-sync__auth-popup--label-text">
					${main_core.Loc.getMessage('CAL_ICLOUD_PASS_PLACEHOLDER')}
				</p>
			`;
			}
			return this.DOM.appPasswordTitle;
		}
		getAppleIdError() {
			if (!this.DOM.appleIdError) {
				this.DOM.appleIdError = main_core.Tag.render`
				<div class="calendar-sync__auth-popup--label-text --error">
					${main_core.Loc.getMessage('CAL_ICLOUD_APPLE_ID_ERROR')}
				</div>
			`;
			}
			return this.DOM.appleIdError;
		}
		getAppPasswordError() {
			if (!this.DOM.appPasswordError) {
				this.DOM.appPasswordError = main_core.Tag.render`
				<div class="calendar-sync__auth-popup--label-text --error">
					${main_core.Loc.getMessage('CAL_ICLOUD_APP_PASSWORD_ERROR', {
				'#LINK_START#': '<a href="#" data-role="open-helpdesk-password">',
				'#LINK_END#': '</a>'
			})}
				</div>
			`;
				const link = this.DOM.appPasswordError.querySelector('a[data-role="open-helpdesk-password"]');
				if (link) {
					main_core.Event.bind(link, 'click', this.openHelpDesk.bind(this));
				}
			}
			return this.DOM.appPasswordError;
		}
		getAppleIdInput() {
			if (!this.DOM.appleIdInput) {
				this.DOM.appleIdInput = main_core.Tag.render`
				<input
					type="text"
					placeholder="${main_core.Loc.getMessage('CAL_ICLOUD_AUTH_EMAIL_PLACEHOLDER')}"
					class="calendar-field-string ui-ctl-element"
				/>
			`;
				this.DOM.appleIdInput.onfocus = () => {
					if (main_core.Dom.hasClass(this.DOM.appleIdInput, 'calendar-field-string-error')) {
						main_core.Dom.removeClass(this.DOM.appleIdInput, 'calendar-field-string-error');
						main_core.Dom.removeClass(this.DOM.appleIdError, 'show');
					}
				};
				this.DOM.appleIdInput.onblur = () => {
					if (!this.validateAppleIdInput() && !main_core.Dom.hasClass(this.DOM.appleIdInput, 'calendar-field-string-error')) {
						main_core.Dom.addClass(this.DOM.appleIdInput, 'calendar-field-string-error');
						main_core.Dom.addClass(this.DOM.appleIdError, 'show');
					}
				};
			}
			return this.DOM.appleIdInput;
		}
		getAppPasswordInput() {
			if (!this.DOM.appPasswordInput) {
				this.DOM.appPasswordInput = main_core.Tag.render`
				<input
					type="password"
					placeholder="${main_core.Loc.getMessage('CAL_ICLOUD_AUTH_APPPASS_PLACEHOLDER')}"
					class="calendar-field-string ui-ctl-element"
					required maxlength="19"
				/>
			`;
				main_core.Event.bind(this.DOM.appPasswordInput, 'input', this.validateAppPasswordInput.bind(this));
			}
			return this.DOM.appPasswordInput;
		}
		getShowHidePasswordIcon() {
			if (!this.DOM.showHidePasswordIcon) {
				this.DOM.showHidePasswordIcon = main_core.Tag.render`
				<div class="ui-ctl-after calendar-sync__auth-popup--icon-adjust-password"></div>
			`;
				main_core.Event.bind(this.DOM.showHidePasswordIcon, 'click', this.switchPasswordVisibility.bind(this));
			}
			return this.DOM.showHidePasswordIcon;
		}
		getLearnMoreButton() {
			if (!this.DOM.learnMoreButton) {
				this.DOM.learnMoreButton = main_core.Tag.render`
				<span class="calendar-sync__auth-popup--learn-more">${main_core.Loc.getMessage('CAL_ICLOUD_AUTH_APPPASS_ABOUT')}</span>
			`;
				main_core.Event.bind(this.DOM.learnMoreButton, 'click', this.openHelpDesk.bind(this));
			}
			return this.DOM.learnMoreButton;
		}
		initAlertBlock() {
			if (!this.DOM.alertBlock) {
				this.DOM.alertBlock = main_core.Tag.render`
				<div class="ui-alert ui-alert-danger calendar-sync__auth-error">
									<span class="ui-alert-message">${main_core.Loc.getMessage('CAL_ICLOUD_AUTH_ERROR')}</span>
				</div>
			`;
			}
		}
		showErrorAuthorizationAlert() {
			this.highlightInvalidAppleIdInput();
			this.highlightInvalidPasswordInput();
			this.enableSaveButton();
			if (!this.DOM.container.contains(this.DOM.alertBlock)) {
				main_core.Dom.append(this.DOM.alertBlock, this.DOM.container);
			}
		}
		validateAppleIdInput() {
			const emailRegExp = /^[a-zA-Z\d.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z\d-]+(?:\.[a-zA-Z\d-]+)*$/;
			const input = this.DOM.appleIdInput.value.toString().trim();
			if (input === '') {
				return true;
			}
			return emailRegExp.test(input);
		}
		validateAppPasswordInput() {
			const appPasswordRegExp = /^[a-z]{4}-[a-z]{4}-[a-z]{4}-[a-z]{4}$/;
			const input = this.completeWithTemplate(this.DOM.appPasswordInput.value.toString().trim());
			if (appPasswordRegExp.test(input)) {
				main_core.Dom.removeClass(this.DOM.appPasswordInput, 'calendar-field-string-error');
				main_core.Dom.removeClass(this.DOM.appPasswordError, 'show');
			} else {
				main_core.Dom.addClass(this.DOM.appPasswordInput, 'calendar-field-string-error');
				main_core.Dom.addClass(this.DOM.appPasswordError, 'show');
			}
		}
		switchPasswordVisibility() {
			if (main_core.Dom.hasClass(this.DOM.showHidePasswordIcon, '--hide')) {
				this.DOM.appPasswordInput.type = 'password';
				main_core.Dom.removeClass(this.DOM.showHidePasswordIcon, '--hide');
			} else {
				this.DOM.appPasswordInput.type = 'text';
				main_core.Dom.addClass(this.DOM.showHidePasswordIcon, '--hide');
			}
		}
		clearForm() {
			this.DOM.appPasswordInput.value = '';
			this.DOM.appleIdInput.value = '';
			if (main_core.Dom.hasClass(this.DOM.appleIdInput, 'calendar-field-string-error')) {
				main_core.Dom.removeClass(this.DOM.appleIdInput, 'calendar-field-string-error');
			}
			if (main_core.Dom.hasClass(this.DOM.appPasswordInput, 'calendar-field-string-error')) {
				main_core.Dom.removeClass(this.DOM.appPasswordInput, 'calendar-field-string-error');
			}
			if (main_core.Dom.hasClass(this.DOM.appleIdError, 'show')) {
				main_core.Dom.removeClass(this.DOM.appleIdError, 'show');
			}
			if (main_core.Dom.hasClass(this.DOM.appPasswordError, 'show')) {
				main_core.Dom.removeClass(this.DOM.appPasswordError, 'show');
			}
		}
		completeWithTemplate(password) {
			const addition = this.appPasswordTemplate.slice(password.length, this.appPasswordTemplate.length);
			password += addition;
			return password;
		}
		openHelpDesk() {
			const helpDeskCode = '15426356';
			top.BX.Helper.show('redirect=detail&code=' + helpDeskCode);
		}
		handleKeyPress(e) {
			if (e.keyCode === calendar_util.Util.getKeyCode('enter')) {
				this.authorize();
			} else if (e.keyCode === calendar_util.Util.getKeyCode('escape')) {
				this.close();
			}
		}
		checkOutsideClickClose(e) {
			let target = e.target || e.srcElement;
			this.outsideMouseUp = !target.closest('div.popup-window');
			if (this.outsideMouseUp && this.outsideMouseDown && this.checkTopSlider()) {
				this.close();
			}
		}
		outsideMouseDownClose(e) {
			let target = e.target || e.srcElement;
			this.outsideMouseDown = !target.closest('div.popup-window');
		}
		close() {
			if (this.popup) {
				this.popup.destroy();
			}
			main_core.Event.unbind(document, 'keydown', this.keyHandler);
			main_core.Event.unbind(document, 'mouseup', this.checkOutsideClickClose);
			main_core.Event.unbind(document, 'mousedown', this.outsideMouseDownClose);
			this.clearForm();
		}
		checkTopSlider() {
			return !calendar_util.Util.getBX().SidePanel.Instance.getTopSlider();
		}
	}

	class IcloudSyncWizard extends SyncWizard {
		TYPE = 'icloud';
		SLIDER_NAME = 'calendar:sync-wizard-icloud';
		STAGE_1_CODE = 'icloud-to-b24';
		STAGE_2_CODE = 'b24-events-to-icloud';
		STAGE_3_CODE = 'b24-to-icloud';
		constructor(options = {}) {
			super(options);
			this.setEventNamespace('BX.Calendar.Sync.Interface.IcloudSyncWizard');
			this.setAccountName(main_core.Loc.getMessage('CALENDAR_TITLE_ICLOUD'));
			this.setSyncStages();
			this.logoIconClass = '--icloud';
		}
		getHelpLinkWrapper() {
			return '';
		}
		getFinalCheckWrapper() {
			this.finalCheckWrapper = main_core.Tag.render`
			<div style="display: none;">
				<div class="calendar-sync__content-block --space-bottom">
					<div class="calendar-sync__balloon --progress">
						<div class="calendar-sync__content-text calendar-sync__content-title --show-for-progress">${main_core.Loc.getMessage('CAL_SYNC_LETS_CHECK')}</div>
						<div class="calendar-sync__content-text calendar-sync__content-subtitle --show-for-progress">${main_core.Loc.getMessage('CAL_SYNC_CREATE_EVENT_ICLOUD')}</div>
						<div class="calendar-sync__content-text calendar-sync__content-title --show-for-done">${main_core.Loc.getMessage('CAL_SYNC_NEW_EVENT_ADDED_FROM_ICLOUD')}</div>
						<div class="calendar-sync__content-text calendar-sync__content-subtitle --show-for-done">${main_core.Loc.getMessage('CAL_SYNC_NEW_EVENT_YOULL_SEE')}</div>
						<div class="calendar-sync__balloon--icon"></div>
					</div>
				</div>
				${this.getSkeletonWrapper()}
				${this.getNewEventCardWrapper()}
			</div>
		`;
			return this.finalCheckWrapper;
		}
		setSyncStages() {
			this.syncStagesList = [new SyncStageUnit({
				name: this.STAGE_1_CODE,
				title: main_core.Loc.getMessage('CAL_SYNC_STAGE_ICLOUD_1')
			}), new SyncStageUnit({
				name: this.STAGE_2_CODE,
				title: main_core.Loc.getMessage('CAL_SYNC_STAGE_ICLOUD_2')
			}), new SyncStageUnit({
				name: this.STAGE_3_CODE,
				title: main_core.Loc.getMessage('CAL_SYNC_STAGE_ICLOUD_3')
			})];
		}
		updateState(stateData) {
			super.updateState(stateData);
			this.getSyncStages().forEach(stage => {
				if (stateData.stage === 'connection_created' && stage.name === this.STAGE_1_CODE) {
					stage.setDone();
				} else if (stateData.stage === 'import_finished' && (stage.name === this.STAGE_1_CODE || stage.name === this.STAGE_2_CODE)) {
					stage.setDone();
				} else if (stateData.stage === 'export_finished') {
					stage.setDone();
					if (stage.name === this.STAGE_3_CODE) {
						if (this.mode === 'reconnecting') {
							this.handleCloseWizard();
						} else {
							this.setActiveStatusFinished();
							this.showButtonWrapper();
							this.showInfoStatusWrapper();
						}
						this.showConfetti();
						this.emit('onConnectionCreated');
					}
				}
			});
		}
		getSkeletonTitle() {
			return main_core.Loc.getMessage('CAL_SYNC_NEW_EVENT_ICLOUD_TITLE');
		}
	}

	class WarnSyncIcloudDialog {
		zIndex = 3100;
		DOM = {};
		constructor(options = {}) {
			this.authDialog = options.authDialog;
		}
		show() {
			this.popup = new main_popup.Popup({
				className: 'calendar-sync__auth-popup calendar-sync__scope',
				titleBar: main_core.Loc.getMessage('CAL_ICLOUD_ALERT_OTHER_APPLE_SYNC_TITLE'),
				width: 500,
				draggable: {
					restrict: true
				},
				content: this.getContainer(),
				cacheable: false,
				closeByEsc: true,
				closeIcon: true,
				contentBackground: '#fff',
				overlay: {
					opacity: 15
				},
				buttons: [new BX.UI.Button({
					text: main_core.Loc.getMessage('CAL_ICLOUD_ALERT_OTHER_APPLE_SYNC_LEARN_MORE'),
					className: 'ui-btn ui-btn-md ui-btn-primary',
					events: {
						click: this.openHelpDesk.bind(this)
					}
				}), new BX.UI.Button({
					text: main_core.Loc.getMessage('CAL_BUTTON_CONTINUE'),
					className: 'ui-btn ui-btn-md ui-btn-light',
					events: {
						click: this.openAuthDialog.bind(this)
					}
				})],
				events: {
					onPopupClose: this.close.bind(this)
				}
			});
			this.popup.show();
		}
		getContainer() {
			this.DOM.container = main_core.Tag.render`
			<div>
				${this.getAlertInformation()}
			</div>
		`;
			return this.DOM.container;
		}
		getAlertInformation() {
			this.DOM.alertBlock = new ui_alerts.Alert({
				text: main_core.Loc.getMessage('CAL_ICLOUD_ALERT_OTHER_APPLE_SYNC_INFO'),
				color: ui_alerts.Alert.Color.WARNING,
				icon: ui_alerts.Alert.Icon.INFO
			});
			const container = this.DOM.alertBlock.getContainer();
			const text = container.querySelector('.ui-alert-message');
			main_core.Dom.addClass(text, 'calendar-sync__alert-popup--text');
			return container;
		}
		openHelpDesk() {
			const helpDeskCode = '16020988';
			top.BX.Helper.show(`redirect=detail&code=${helpDeskCode}`);
		}
		disableConnection() {
			BX.ajax.runAction('calendar.api.syncajax.disableIphoneOrMacConnection').then(() => {
				this.authDialog.show();
				this.close();
				calendar_util.Util.setIphoneConnectionStatus(false);
				calendar_util.Util.setMacConnectionStatus(false);
			});
		}
		openAuthDialog() {
			this.authDialog.show();
			this.close();
		}
		close() {
			if (this.popup) {
				this.popup.destroy();
			}
		}
	}

	class IcloudTemplate extends InterfaceTemplate {
		constructor(provider, connection = null) {
			super({
				title: main_core.Loc.getMessage("CALENDAR_TITLE_ICLOUD"),
				helpDeskCode: '6030429',
				titleInfoHeader: main_core.Loc.getMessage('CAL_CONNECT_ICLOUD_CALENDAR'),
				descriptionInfoHeader: main_core.Loc.getMessage('CAL_ICLOUD_CONNECT_DESCRIPTION'),
				titleActiveHeader: main_core.Loc.getMessage('CAL_CALENDAR_IS_CONNECT'),
				descriptionActiveHeader: main_core.Loc.getMessage('CAL_ICLOUD_SELECTED_DESCRIPTION'),
				sliderIconClass: 'calendar-sync-slider-header-icon-icloud',
				iconPath: '/bitrix/images/calendar/sync/icloud.svg',
				iconLogoClass: '--icloud',
				color: '#95a0af',
				provider: provider,
				connection: connection,
				popupWithUpdateButton: true
			});
			this.sectionStatusObject = {};
			this.sectionList = [];
		}
		createConnection(data) {
			this.provider.setWizardSyncMode(true);
			this.provider.getInterfaceUnit().setSyncStatus(this.provider.STATUS_SYNCHRONIZING);
			BX.ajax.runAction('calendar.api.syncajax.createIcloudConnection', {
				data: {
					appleId: data.appleId,
					appPassword: data.appPassword
				}
			}).then(response => {
				const result = response.data;
				if (result.status === 'success' && result.connectionId) {
					this.openSyncWizard(data.appleId);
					void this.syncCalendarsWithIcloud(result.connectionId);
				}
			}, () => {
				this.authDialog.showErrorAuthorizationAlert();
			});
		}
		syncCalendarsWithIcloud(connectionId) {
			this.authDialog.close();
			return new Promise(resolve => {
				BX.ajax.runAction('calendar.api.syncajax.syncIcloudConnection', {
					data: {
						connectionId: connectionId
					}
				}).then(response => {
					this.provider.setStatus(this.provider.STATUS_SUCCESS);
					this.provider.getInterfaceUnit().setSyncStatus(this.provider.STATUS_SUCCESS);
					if (connectionId) {
						this.provider.getConnection().setId(connectionId);
						this.provider.getConnection().setStatus(true);
						this.provider.getConnection().setConnected(true);
						this.provider.getConnection().setSyncDate(new Date());
					}
					resolve(response.data);
				}, response => {
					this.provider.setStatus(this.provider.STATUS_FAILED);
					this.provider.setWizardState({
						status: this.provider.ERROR_CODE,
						vendorName: this.provider.type
					});
					resolve(response.errors);
				});
			});
		}
		getSectionsForIcloud() {
			return new Promise(resolve => {
				BX.ajax.runAction('calendar.api.syncajax.getAllSectionsForIcloud', {
					data: {
						connectionId: this.connection.addParams.id
					}
				}).then(response => {
					this.sectionList = response.data;
					resolve(response.data);
				}, response => {
					resolve(response.errors);
				});
			});
		}
		onClickCheckSection(event) {
			this.sectionStatusObject[event.target.value] = event.target.checked;
			this.runUpdateInfo();
			this.showUpdateSectionListNotification();
		}
		async handleConnectButton() {
			this.initPopup();
			if (calendar_util.Util.isIphoneConnected() || calendar_util.Util.isMacConnected()) {
				this.alertSyncPopup.show();
			} else {
				this.authDialog.show();
			}
		}
		initPopup() {
			if (!this.authDialog) {
				this.authDialog = new IcloudAuthDialog();
				main_core_events.EventEmitter.unsubscribeAll('BX.Calendar.Sync.Icloud:onSubmit');
				main_core_events.EventEmitter.subscribe('BX.Calendar.Sync.Icloud:onSubmit', e => {
					this.createConnection(e.data);
				});
			}
			if (!this.alertSyncPopup) {
				this.alertSyncPopup = new WarnSyncIcloudDialog({
					authDialog: this.authDialog
				});
			}
		}
		openSyncWizard(appleId) {
			this.provider.setWizardSyncMode(true);
			const mode = this.provider.isStartedReconnecting ? 'reconnect' : 'default';
			this.wizard = new IcloudSyncWizard({
				mode
			});
			this.wizard.openSlider();
			this.provider.setActiveWizard(this.wizard);
			main_core_events.EventEmitter.subscribeOnce('BX.Calendar.Sync.Interface.SyncStageUnit:onRenderDone', () => {
				this.wizard.updateState({
					stage: 'connection_created',
					vendorName: 'icloud',
					accountName: appleId
				});
			});
		}
		sendRequestRemoveConnection(id) {
			this.deactivateConnection(id);
		}
	}

	class Office365SyncWizard extends SyncWizard {
		TYPE = 'office365';
		SLIDER_NAME = 'calendar:sync-wizard-office365';
		STAGE_1_CODE = 'office365-to-b24';
		STAGE_2_CODE = 'sections_sync_finished';
		STAGE_3_CODE = 'events_sync_finished';
		constructor(options = {}) {
			super(options);
			this.setEventNamespace('BX.Calendar.Sync.Interface.Office365SyncWizard');
			this.setAccountName(main_core.Loc.getMessage('CALENDAR_TITLE_OFFICE365'));
			this.setSyncStages();
			this.logoIconClass = '--office365';
		}
		getHelpLinkWrapper() {
			return '';
		}
		getFinalCheckWrapper() {
			this.finalCheckWrapper = main_core.Tag.render`
			<div style="display: none;">
				<div class="calendar-sync__content-block --space-bottom">
					<div class="calendar-sync__balloon --progress">
						<div class="calendar-sync__content-text calendar-sync__content-title --show-for-progress">${main_core.Loc.getMessage('CAL_SYNC_LETS_CHECK')}</div>
						<div class="calendar-sync__content-text calendar-sync__content-subtitle --show-for-progress">${main_core.Loc.getMessage('CAL_SYNC_CREATE_EVENT_OFFICE365')}</div>
						<div class="calendar-sync__content-text calendar-sync__content-title --show-for-done">${main_core.Loc.getMessage('CAL_SYNC_NEW_EVENT_ADDED_FROM_OFFICE365')}</div>
						<div class="calendar-sync__content-text calendar-sync__content-subtitle --show-for-done">${main_core.Loc.getMessage('CAL_SYNC_NEW_EVENT_YOULL_SEE')}</div>
						<div class="calendar-sync__balloon--icon"></div>
					</div>
				</div>
				${this.getSkeletonWrapper()}
				${this.getNewEventCardWrapper()}
			</div>
		`;
			return this.finalCheckWrapper;
		}
		setSyncStages() {
			this.syncStagesList = [new SyncStageUnit({
				name: this.STAGE_1_CODE,
				title: main_core.Loc.getMessage('CAL_SYNC_STAGE_OFFICE365_1')
			}), new SyncStageUnit({
				name: this.STAGE_2_CODE,
				title: main_core.Loc.getMessage('CAL_SYNC_STAGE_OFFICE365_2')
			}), new SyncStageUnit({
				name: this.STAGE_3_CODE,
				title: main_core.Loc.getMessage('CAL_SYNC_STAGE_OFFICE365_3')
			})];
		}
		updateState(stateData) {
			super.updateState(stateData);
			this.getSyncStages().forEach(stage => {
				if (stateData.stage === 'connection_created' && stage.name === this.STAGE_1_CODE) {
					stage.setDone();
				} else if (stateData.stage === 'import_finished' && (stage.name === this.STAGE_1_CODE || stage.name === this.STAGE_2_CODE)) {
					stage.setDone();
				} else if (stateData.stage === 'export_finished') {
					stage.setDone();
					if (this.mode === 'reconnecting') {
						this.handleCloseWizard();
					} else {
						this.setActiveStatusFinished();
						this.showButtonWrapper();
						this.showInfoStatusWrapper();
					}
					this.showConfetti();
					this.emit('onConnectionCreated');
				}
			});
		}
		getSkeletonTitle() {
			return main_core.Loc.getMessage('CAL_SYNC_NEW_EVENT_OFFICE365_TITLE');
		}
	}

	class Office365template extends InterfaceTemplate {
		HANDLE_CONNECTION_DELAY = 500;
		constructor(provider, connection = null) {
			super({
				title: main_core.Loc.getMessage("CALENDAR_TITLE_OFFICE365"),
				helpDeskCode: '6030429',
				titleInfoHeader: main_core.Loc.getMessage('CAL_CONNECT_OFFICE365_CALENDAR'),
				descriptionInfoHeader: main_core.Loc.getMessage('CAL_OFFICE365_CONNECT_DESCRIPTION'),
				titleActiveHeader: main_core.Loc.getMessage('CAL_OFFICE365_CALENDAR_IS_CONNECT'),
				descriptionActiveHeader: main_core.Loc.getMessage('CAL_OFFICE365_SELECTED_DESCRIPTION'),
				sliderIconClass: 'calendar-sync-slider-header-icon-office365',
				iconPath: '/bitrix/images/calendar/sync/office365.svg',
				iconLogoClass: '--office365',
				color: '#fc1d1d',
				provider: provider,
				connection: connection,
				popupWithUpdateButton: true
			});
			this.sectionStatusObject = {};
			this.sectionList = [];
			this.handleSuccessConnectionDebounce = main_core.Runtime.debounce(this.handleSuccessConnection, this.HANDLE_CONNECTION_DELAY, this);
		}
		async createConnection() {
			const syncLink = await this.provider.getSyncLink();
			BX.util.popup(syncLink, 500, 600);
			main_core.Event.bind(window, 'hashchange', this.handleSuccessConnectionDebounce);
		}
		handleSuccessConnection(event) {
			if (window.location.hash === '#office365AuthSuccess') {
				calendar_util.Util.removeHash();
				this.provider.setWizardSyncMode(true);
				this.provider.saveConnection();
				this.openSyncWizard();
				this.provider.setStatus(this.provider.STATUS_SYNCHRONIZING);
				this.provider.getInterfaceUnit().setSyncStatus(this.provider.STATUS_SYNCHRONIZING);
				this.provider.getInterfaceUnit().refreshButton();
				if (this.provider.isReconnecting()) {
					this.provider.emit('onReconnecting');
				}
				main_core.Event.unbind(window, 'hashchange', this.handleSuccessConnectionDebounce);
			}
		}
		onClickCheckSection(event) {
			this.sectionStatusObject[event.target.value] = event.target.checked;
			this.runUpdateInfo();
			this.showUpdateSectionListNotification();
		}
		async handleConnectButton() {
			if (this.provider.hasSetSyncOffice365Settings()) {
				await this.createConnection();
			} else {
				this.showAlertPopup();
			}
		}
		openSyncWizard() {
			const mode = this.provider.isStartedReconnecting ? 'reconnect' : 'default';
			this.wizard = new Office365SyncWizard({
				mode
			});
			this.wizard.openSlider();
			this.provider.setActiveWizard(this.wizard);
		}
		getSectionsForOffice365() {
			return new Promise(resolve => {
				BX.ajax.runAction('calendar.api.syncajax.getAllSectionsForOffice365', {
					data: {
						connectionId: this.connection.addParams.id
					}
				}).then(response => {
					this.sectionList = response.data;
					resolve(response.data);
				}, response => {
					resolve(response.errors);
				});
			});
		}
		sendRequestRemoveConnection(id) {
			this.deactivateConnection(id);
		}
		showAlertPopup() {
			const messageBox = new ui_dialogs_messagebox.MessageBox({
				useAirDesign: true,
				className: this.id,
				message: main_core.Loc.getMessage('OFFICE365_IS_NOT_CALDAV_SETTINGS_WARNING_MESSAGE'),
				width: 500,
				offsetLeft: 60,
				offsetTop: 5,
				padding: 7,
				onOk: () => {
					messageBox.close();
				},
				okCaption: 'OK',
				buttons: BX.UI.Dialogs.MessageBoxButtons.OK,
				popupOptions: {
					zIndexAbsolute: 4020,
					autoHide: true,
					animation: 'fading-slide'
				}
			});
			messageBox.show();
		}
	}

	class MacTemplate extends InterfaceTemplate {
		constructor(provider, connection = null) {
			super({
				title: main_core.Loc.getMessage("CALENDAR_TITLE_MAC"),
				helpDeskCode: '5684075',
				titleInfoHeader: main_core.Loc.getMessage('CAL_CONNECT_MAC_CALENDAR_TITLE'),
				descriptionInfoHeader: main_core.Loc.getMessage('CAL_MAC_CONNECT_DESCRIPTION'),
				titleActiveHeader: main_core.Loc.getMessage('CAL_MAC_CALENDAR_IS_CONNECT_TITLE'),
				descriptionActiveHeader: main_core.Loc.getMessage('CAL_MAC_SELECTED_DESCRIPTION'),
				sliderIconClass: 'calendar-sync-slider-header-icon-mac',
				iconPath: '/bitrix/images/calendar/sync/mac.svg',
				color: '#ff5752',
				provider: provider,
				connection: connection,
				popupWithUpdateButton: false
			});
			this.alreadyConnectedToNew = calendar_util.Util.isIcloudConnected();
			if (this.alreadyConnectedToNew) {
				this.warningText = main_core.Loc.getMessage('CAL_SYNC_WARNING_IPHONE_AND_MAC_CONNECTED');
				this.mobileSyncButtonText = main_core.Loc.getMessage('CALENDAR_CHECK_ICLOUD_SETTINGS');
			} else {
				this.warningText = main_core.Loc.getMessage('CAL_SYNC_WARNING_IPHONE_AND_MAC');
				this.mobileSyncButtonText = main_core.Loc.getMessage('CALENDAR_CONNECT_ICLOUD');
			}
		}
		getPortalAddress() {
			return this.portalAddress;
		}
		getContentInfoBody() {
			return main_core.Tag.render`
			${this.getContentInfoBodyHeader()}
			${this.getContentInfoWarning()}
		`;
		}
		getActiveConnectionContent() {
			return main_core.Tag.render`
			<div class="calendar-sync-wrap calendar-sync-wrap-detail">
				<div class="calendar-sync-header">
					<span class="calendar-sync-header-text">${this.getHeaderTitle()}</span>
				</div>
				${this.getContentActiveBody()}
			</div>
		`;
		}
		getContentActiveBody() {
			return main_core.Tag.render`
			${this.getContentActiveBodyHeader()}
			<div class="calendar-sync-slider-section calendar-sync-slider-section-banner">
				${this.getContentBodyConnect()}
			</div>
		`;
		}
		getContentActiveBodyHeader() {
			const timestamp = this.connection.getSyncDate().getTime() / 1000;
			const syncTime = timestamp ? calendar_util.Util.formatDateUsable(timestamp) + ' ' + BX.date.format(calendar_util.Util.getTimeFormatShort(), timestamp) : '';
			return main_core.Tag.render`
			<div class="calendar-sync-slider-section">
				<div class="calendar-sync-slider-header-icon ${this.sliderIconClass}"></div>
				<div class="calendar-sync-slider-header">
				<div class="calendar-sync-slider-title">${this.titleActiveHeader}</div>
				<div class="calendar-sync-slider-info">
					<span class="calendar-sync-slider-info-text">${main_core.Loc.getMessage('CAL_SYNC_LAST_SYNC_DATE')}</span>
					<span class="calendar-sync-slider-info-time">${syncTime}</span>
				</div>
					<a class="calendar-sync-slider-link" href="javascript:void(0);" onclick="${this.showHelp.bind(this)}">${main_core.Loc.getMessage('CAL_TEXT_ABOUT_WORK_SYNC')}</a>
				</div>
			</div>`;
		}
		getContentInfoBodyHeaderHelper() {
			if (!this.headerHelper) {
				this.headerHelper = main_core.Tag.render`
				<div class="calendar-sync-slider-info">
					<span class="calendar-sync-slider-info-text">
						<a class="calendar-sync-slider-info-link">
							${main_core.Loc.getMessage('CAL_CONNECT_PC')}
						</a>
					</span>
				</div>
			`;
				main_core.Event.bind(this.headerHelper, 'click', this.showExtendedInfoMacOs.bind(this));
			}
			return this.headerHelper;
		}
		showExtendedInfoMacOs() {
			this.headerHelper.style.display = 'none';
			main_core.Dom.append(this.getContentBodyConnect(), this.infoBodyHeader);
		}
		getContentBodyConnect() {
			return main_core.Tag.render`
			<div class="calendar-sync-slider-section calendar-sync-slider-section-col">
				<div class="calendar-sync-slider-header calendar-sync-slider-header-divide">
					<div class="calendar-sync-slider-subtitle">${main_core.Loc.getMessage('CAL_MAC_INSTRUCTION_HEADER')}</div>
				</div>
				<div class="calendar-sync-slider-info">
					<span class="calendar-sync-slider-info-text">${main_core.Loc.getMessage('CAL_MAC_INSTRUCTION_DESCRIPTION')}:</span>
					<ol class="calendar-sync-slider-info-list">
						<li class="calendar-sync-slider-info-item">
							<span class="calendar-sync-slider-info-text">${main_core.Loc.getMessage('CAL_MAC_INSTRUCTION_POINT_FIRST')}</span>
						</li>
						<li class="calendar-sync-slider-info-item">
							<span class="calendar-sync-slider-info-text">${main_core.Loc.getMessage('CAL_MAC_INSTRUCTION_POINT_SECOND')}</span>
						</li>
						<li class="calendar-sync-slider-info-item">
							<span class="calendar-sync-slider-info-text">${main_core.Loc.getMessage('CAL_MAC_INSTRUCTION_POINT_THIRD')}</span>
						</li>
						<li class="calendar-sync-slider-info-item">
							<span class="calendar-sync-slider-info-text">${main_core.Loc.getMessage('CAL_MAC_INSTRUCTION_POINT_FOURTH')}</span>
						</li>
						<li class="calendar-sync-slider-info-item">
							<span class="calendar-sync-slider-info-text">${main_core.Loc.getMessage('CAL_MAC_INSTRUCTION_POINT_FIFTH', {
			'#PORTAL_ADDRESS#': this.provider.getPortalAddress()
		})}</span>
						</li>
						<li class="calendar-sync-slider-info-item">
							<span class="calendar-sync-slider-info-text">${main_core.Loc.getMessage('CAL_MAC_INSTRUCTION_POINT_SIXTH')}</span>
						</li>
						<li class="calendar-sync-slider-info-item">
							<span class="calendar-sync-slider-info-text">${main_core.Loc.getMessage('CAL_MAC_INSTRUCTION_POINT_SEVENTH')}</span>
						</li>
					</ol>
					<span class="calendar-sync-slider-info-text">${main_core.Loc.getMessage('CAL_MAC_INSTRUCTION_CONCLUSION')}</span>
					<div class="calendar-sync-slider-info" style="margin-top: 20px">
						<span class="calendar-sync-slider-info-text">
							<a class="calendar-sync-slider-info-link" href="javascript:void(0);" onclick="${this.showHelp.bind(this)}">
								${main_core.Loc.getMessage('CAL_TEXT_ABOUT_WORK_SYNC')}
							</a>
						</span>
					</div>
				</div>
			</div>
		`;
		}
		handleMobileButtonConnectClick() {
			BX.SidePanel.Instance.getOpenSliders().forEach(slider => {
				if (['calendar:auxiliary-sync-slider', 'calendar:item-sync-connect-mac'].includes(slider.getUrl())) {
					slider.close();
				}
			});
			const calendarContext = calendar_util.Util.getCalendarContext();
			if (calendarContext) {
				calendarContext.syncInterface.getIcloudProvider().getInterfaceUnit().getConnectionTemplate().handleConnectButton();
			}
		}
		handleMobileButtonOtherSyncInfo() {
			BX.SidePanel.Instance.getOpenSliders().forEach(slider => {
				if (['calendar:auxiliary-sync-slider', 'calendar:item-sync-connect-mac'].includes(slider.getUrl())) {
					slider.close();
				}
			});
			const calendarContext = calendar_util.Util.getCalendarContext();
			if (calendarContext) {
				const connectionProvider = calendarContext.syncInterface.getIcloudProvider().getInterfaceUnit().connectionProvider;
				connectionProvider.openActiveConnectionSlider(connectionProvider.getConnection());
			}
		}
	}

	class OutlookTemplate extends InterfaceTemplate {
		constructor(provider, connection = null) {
			super({
				title: main_core.Loc.getMessage("CALENDAR_TITLE_MAC"),
				helpDeskCode: '5684075',
				titleInfoHeader: main_core.Loc.getMessage('CAL_CONNECT_MAC_CALENDAR_TITLE'),
				descriptionInfoHeader: main_core.Loc.getMessage('CAL_MAC_CONNECT_DESCRIPTION'),
				titleActiveHeader: main_core.Loc.getMessage('CAL_MAC_CALENDAR_IS_CONNECT_TITLE'),
				descriptionActiveHeader: main_core.Loc.getMessage('CAL_MAC_SELECTED_DESCRIPTION'),
				sliderIconClass: 'calendar-sync-slider-header-icon-mac',
				iconPath: '/bitrix/images/calendar/sync/mac.svg',
				color: '#ff5752',
				provider: provider,
				connection: connection,
				popupWithUpdateButton: false
			});
		}
	}

	class YandexTemplate extends CaldavInterfaceTemplate {
		constructor(provider, connection = null) {
			super({
				title: main_core.Loc.getMessage("CALENDAR_TITLE_YANDEX"),
				helpDeskCode: '12925048',
				titleInfoHeader: main_core.Loc.getMessage('CAL_CONNECT_YANDEX_CALENDAR'),
				descriptionInfoHeader: main_core.Loc.getMessage('CAL_YANDEX_CONNECT_DESCRIPTION'),
				titleActiveHeader: main_core.Loc.getMessage('CAL_YANDEX_CALENDAR_IS_CONNECT'),
				descriptionActiveHeader: main_core.Loc.getMessage('CAL_YANDEX_SELECTED_DESCRIPTION'),
				sliderIconClass: 'calendar-sync-slider-header-icon-yandex',
				iconPath: '/bitrix/images/calendar/sync/yandex.svg',
				iconLogoClass: '--yandex',
				color: '#f9c500',
				provider: provider,
				connection: connection,
				popupWithUpdateButton: true
			});
		}
	}

	class MobileInterfaceTemplate extends InterfaceTemplate {
		constructor(options) {
			super(options);
			this.banner = new MobileSyncBanner({
				type: this.provider.getType(),
				helpDeskCode: options.helpDeskCode
			});
			if (this.status) {
				this.syncDate = main_core.Type.isDate(this.data.syncDate) ? this.data.syncDate : calendar_util.Util.parseDate(this.data.syncDate);
			}
		}
		getContentInfoBody() {
			return main_core.Tag.render`
			${this.getContentInfoBodyHeader()}
			${this.getContentInfoWarning()}
		`;
		}
		getContentInfoBodyHeaderHelper() {
			if (!this.headerHelper) {
				this.headerHelper = main_core.Tag.render`
				<div class="calendar-sync-slider-info">
					${this.getContentInfoBodyHeaderHelperConnect()}
				</div>
			`;
			}
			return this.headerHelper;
		}
		getContentInfoBodyHeaderHelperConnect() {
			if (!this.headerHelperConnect) {
				this.headerHelperConnect = main_core.Tag.render`
				<div class="calendar-sync-slider-info-text">
					<a class="calendar-sync-slider-info-link">
						${main_core.Loc.getMessage('CAL_CONNECT_PHONE')}
					</a>
				</div>
			`;
				main_core.Event.bind(this.headerHelperConnect, 'click', this.showMobileSyncBanner.bind(this));
			}
			return this.headerHelperConnect;
		}
		showMobileSyncBanner() {
			this.banner.show();
		}
		getContentActiveBody() {
			return main_core.Tag.render`
			${this.getContentActiveBodyHeader()}			
			${this.getContentInfoWarning()}
		`;
		}
		getContentActiveBodyHeader() {
			const timestamp = this.connection.getSyncDate().getTime() / 1000;
			const syncTime = timestamp ? calendar_util.Util.formatDateUsable(timestamp) + ' ' + BX.date.format(calendar_util.Util.getTimeFormatShort(), timestamp) : '';
			return main_core.Tag.render`
			<div class="calendar-sync-slider-section">
				<div class="calendar-sync-slider-header-icon ${this.sliderIconClass}"></div>
				<div class="calendar-sync-slider-header">
					<div class="calendar-sync-slider-title">${this.titleActiveHeader}</div>
					<div class="calendar-sync-slider-info">
						<span class="calendar-sync-slider-info-text">${main_core.Loc.getMessage('CAL_SYNC_LAST_SYNC_DATE')}</span>
						<span class="calendar-sync-slider-info-time">${syncTime}</span>
					</div>
					<div class="calendar-sync-slider-desc">${main_core.Loc.getMessage('CAL_SYNC_DISABLE')}</div>
					${this.getContentInfoBodyHeaderHelper()}
				</div>
			</div>`;
		}
		getActiveConnectionContent() {
			return main_core.Tag.render`
			<div class="calendar-sync-wrap calendar-sync-wrap-detail">
				<div class="calendar-sync-header" style="justify-content: start;">
					<span class="calendar-sync-header-text">${this.getHeaderTitle()}</span>
					${this.getHeaderHint()}
				</div>
				${this.getContentActiveBody()}
			</div>
		`;
		}
		getInfoConnectionContent() {
			return main_core.Tag.render`
			<div class="calendar-sync-wrap calendar-sync-wrap-detail">
				<div class="calendar-sync-header" style="justify-content: start;">
					<span class="calendar-sync-header-text">${this.getHeaderTitle()}</span>
					${this.getHeaderHint()}
				</div>
				${this.getContentInfoBody()}
			</div>
		`;
		}
		getHeaderHint() {
			this.hintNode ??= BX.UI.Hint.createNode(main_core.Loc.getMessage('CAL_TEXT_ABOUT_WORK_SYNC'));
			main_core.Event.bind(this.hintNode, 'click', this.showHelp.bind(this));
			return this.hintNode;
		}
	}

	class AndroidTemplate extends MobileInterfaceTemplate {
		constructor(provider, connection = null) {
			super({
				title: main_core.Loc.getMessage("CALENDAR_TITLE_ANDROID"),
				helpDeskCode: '5686179',
				titleInfoHeader: main_core.Loc.getMessage('CAL_CONNECT_ANDROID_CALENDAR_TITLE'),
				descriptionInfoHeader: main_core.Loc.getMessage('CAL_ANDROID_CONNECT_DESCRIPTION'),
				titleActiveHeader: main_core.Loc.getMessage('CAL_SYNC_CONNECTED_ANDROID_TITLE'),
				descriptionActiveHeader: main_core.Loc.getMessage('CAL_ANDROID_SELECTED_DESCRIPTION'),
				sliderIconClass: 'calendar-sync-slider-header-icon-android',
				iconPath: '/bitrix/images/calendar/sync/android.svg',
				color: '#9ece03',
				provider: provider,
				connection: connection,
				popupWithUpdateButton: false
			});
			this.alreadyConnectedToNew = calendar_util.Util.isGoogleConnected();
			if (this.alreadyConnectedToNew) {
				this.warningText = main_core.Loc.getMessage('CAL_SYNC_WARNING_ANDROID_CONNECTED');
				this.mobileSyncButtonText = main_core.Loc.getMessage('CALENDAR_CHECK_GOOGLE_SETTINGS');
			} else {
				this.warningText = main_core.Loc.getMessage('CAL_SYNC_WARNING_ANDROID');
				this.mobileSyncButtonText = main_core.Loc.getMessage('CALENDAR_CONNECT_GOOGLE');
			}
		}
		handleMobileButtonConnectClick() {
			BX.SidePanel.Instance.getOpenSliders().forEach(slider => {
				if (['calendar:auxiliary-sync-slider', 'calendar:item-sync-connect-android'].includes(slider.getUrl())) {
					slider.close();
				}
			});
			const calendarContext = calendar_util.Util.getCalendarContext();
			if (calendarContext) {
				calendarContext.syncInterface.getGoogleProvider().getInterfaceUnit().getConnectionTemplate().handleConnectButton();
			}
		}
		handleMobileButtonOtherSyncInfo() {
			BX.SidePanel.Instance.getOpenSliders().forEach(slider => {
				if (['calendar:auxiliary-sync-slider', 'calendar:item-sync-connect-android'].includes(slider.getUrl())) {
					slider.close();
				}
			});
			const calendarContext = calendar_util.Util.getCalendarContext();
			if (calendarContext) {
				const connectionProvider = calendarContext.syncInterface.getGoogleProvider().getInterfaceUnit().connectionProvider;
				connectionProvider.openActiveConnectionSlider(connectionProvider.getConnection());
			}
		}
	}

	class IphoneTemplate extends MobileInterfaceTemplate {
		constructor(provider, connection = null) {
			super({
				title: main_core.Loc.getMessage("CALENDAR_TITLE_IPHONE"),
				helpDeskCode: '5686207',
				titleInfoHeader: main_core.Loc.getMessage('CAL_CONNECT_IPHONE_CALENDAR_TITLE'),
				descriptionInfoHeader: main_core.Loc.getMessage('CAL_IPHONE_CONNECT_DESCRIPTION'),
				titleActiveHeader: main_core.Loc.getMessage('CAL_SYNC_CONNECTED_IPHONE_TITLE'),
				descriptionActiveHeader: main_core.Loc.getMessage('CAL_IPHONE_SELECTED_DESCRIPTION'),
				sliderIconClass: 'calendar-sync-slider-header-icon-iphone',
				iconPath: '/bitrix/images/calendar/sync/iphone.svg',
				color: '#2fc6f6',
				provider: provider,
				connection: connection,
				popupWithUpdateButton: false
			});
			this.alreadyConnectedToNew = calendar_util.Util.isIcloudConnected();
			if (this.alreadyConnectedToNew) {
				this.warningText = main_core.Loc.getMessage('CAL_SYNC_WARNING_IPHONE_AND_MAC_CONNECTED');
				this.mobileSyncButtonText = main_core.Loc.getMessage('CALENDAR_CHECK_ICLOUD_SETTINGS');
			} else {
				this.warningText = main_core.Loc.getMessage('CAL_SYNC_WARNING_IPHONE_AND_MAC');
				this.mobileSyncButtonText = main_core.Loc.getMessage('CALENDAR_CONNECT_ICLOUD');
			}
			// this.warningText = this.alreadyConnectedToNew
			// 	? Loc.getMessage('CAL_SYNC_WARNING_IPHONE_AND_MAC_CONNECTED')
			// 	: Loc.getMessage('CAL_SYNC_WARNING_IPHONE_AND_MAC');
		}
		handleMobileButtonConnectClick() {
			BX.SidePanel.Instance.getOpenSliders().forEach(slider => {
				if (['calendar:auxiliary-sync-slider', 'calendar:item-sync-connect-iphone'].includes(slider.getUrl())) {
					slider.close();
				}
			});
			const calendarContext = calendar_util.Util.getCalendarContext();
			if (calendarContext) {
				calendarContext.syncInterface.getIcloudProvider().getInterfaceUnit().getConnectionTemplate().handleConnectButton();
			}
		}
		handleMobileButtonOtherSyncInfo() {
			BX.SidePanel.Instance.getOpenSliders().forEach(slider => {
				if (['calendar:auxiliary-sync-slider', 'calendar:item-sync-connect-iphone'].includes(slider.getUrl())) {
					slider.close();
				}
			});
			const calendarContext = calendar_util.Util.getCalendarContext();
			if (calendarContext) {
				const connectionProvider = calendarContext.syncInterface.getIcloudProvider().getInterfaceUnit().connectionProvider;
				connectionProvider.openActiveConnectionSlider(connectionProvider.getConnection());
			}
		}
	}

	class IcalSyncPopup {
		LINK_LENGTH = 112;
		constructor(options) {
			this.link = this.getIcalLink(options);
		}
		static createInstance(options) {
			return new this(options);
		}
		show() {
			this.createPopup().show();
			this.startSync();
		}
		startSync() {
			BX.ajax.get(this.link + '&check=Y', "", result => {
				setTimeout(() => {
					if (!result || result.length <= 0 || result.toUpperCase().indexOf('BEGIN:VCALENDAR') === -1) {
						this.showPopupWithSyncDataError();
					}
				}, 300);
			});
		}
		getContent() {
			return main_core.Tag.render`
			<div class="calendar-ical-popup-wrapper">
				<h3>${main_core.Loc.getMessage('EC_JS_EXPORT_TILE')}</h3>
				<div class="calendar-ical-popup-label-text"><span>${main_core.Loc.getMessage('EC_EXP_TEXT')}</span></div>
				${this.getLinkBlock()}
			</div>
		`;
		}
		createPopup() {
			return this.popup = new main_popup.Popup({
				width: 400,
				zIndexOptions: 4000,
				autoHide: false,
				closeByEsc: true,
				draggable: {
					restrict: true
				},
				closeIcon: {
					right: "12px",
					top: "10px"
				},
				className: "bxc-popup-window",
				content: this.getContent(),
				buttons: [new BX.UI.Button({
					text: main_core.Loc.getMessage('EC_JS_ICAL_COPY_ICAL_SYNC_LINK'),
					color: BX.UI.Button.Color.PRIMARY,
					onclick: () => {
						this.copyLink(event);
					}
				}), new BX.UI.Button({
					text: main_core.Loc.getMessage('EC_SEC_SLIDER_CLOSE'),
					color: BX.UI.Button.Color.LINK,
					onclick: () => {
						this.popup.close();
					}
				})]
			});
		}
		getIcalLink(options) {
			return options.calendarPath + (options.calendarPath.indexOf('?') >= 0 ? '&' : '?') + 'action=export' + options.sectionLink;
		}
		getLinkBlock() {
			return main_core.Tag.render`
				<div class="calendar-ical-popup-link-block">
					<a class="ui-link ui-link-primary " target="_blank" href="${BX.util.htmlspecialchars(this.link)}">
						${BX.util.htmlspecialchars(this.getShortenLink(this.link))}
					</a>
				</div>
			`;
		}
		static checkPathes(options) {
			return !!options.sectionLink || !!options.calendarPath;
		}
		static showPopupWithPathesError() {
			BX.UI.Dialogs.MessageBox.alert(main_core.Loc.getMessage('EC_JS_ICAL_ERROR_WITH_PATHES'));
		}
		showPopupWithSyncDataError() {
			BX.UI.Dialogs.MessageBox.alert(main_core.Loc.getMessage('EC_EDEV_EXP_WARN'));
		}
		copyLink(event) {
			window.BX.clipboard.copy(this.link) ? this.#showSuccessCopyNotification() : this.#showFailedCopyNotification();
			event.preventDefault();
			event.stopPropagation();
		}
		getShortenLink(link) {
			return link.length < this.LINK_LENGTH ? link : link.substr(0, 105) + '...' + link.slice(-7);
		}
		#showSuccessCopyNotification() {
			this.#showResultNotification(main_core.Loc.getMessage('EC_JS_ICAL_COPY_ICAL_SYNC_LINK_SUCCESS'));
		}
		#showFailedCopyNotification() {
			this.#showResultNotification(main_core.Loc.getMessage('EC_JS_ICAL_COPY_ICAL_SYNC_LINK_FAILED'));
		}
		#showResultNotification(message) {
			calendar_util.Util.showNotification(message);
		}
	}

	class AfterSyncTour {
		constructor(options = {}) {
			this.options = options;
		}
		static createInstance(options) {
			return new this(options);
		}
		loadExtension() {
			return new Promise(resolve => {
				main_core.Runtime.loadExtension('ui.tour').then(exports => {
					if (exports && exports['Guide'] && exports['Manager']) {
						resolve();
					} else {
						console.error(`Extension "ui.tour" not found`);
					}
				});
			});
		}
		show() {
			this.loadExtension().then(() => {
				this.guide = new BX.UI.Tour.Guide({
					steps: [{
						target: this.getTarget(),
						title: main_core.Loc.getMessage('CAL_AFTER_SYNC_AHA_TITLE'),
						text: main_core.Loc.getMessage('CAL_AFTER_SYNC_AHA_TEXT')
					}],
					onEvents: true
				});
				this.guide.start();
			});
		}
		getTarget() {
			let target;
			const view = this.options.view;
			const viewWrap = view.getContainer();
			if (view.getName() === 'month') {
				target = viewWrap.querySelectorAll(".calendar-grid-today")[0];
			} else if (view.getName() === 'day' || view.getName() === 'week') {
				const dayCode = calendar_util.Util.getDayCode(new Date());
				target = viewWrap.querySelector('div[data-bx-calendar-timeline-day="' + dayCode + '"] .calendar-grid-cell-inner');
			} else {
				target = document.querySelector('span[data-role="addButton"]');
			}
			return target;
		}
	}

	exports.AfterSyncTour = AfterSyncTour;
	exports.AndroidTemplate = AndroidTemplate;
	exports.AuxiliarySyncPanel = AuxiliarySyncPanel;
	exports.CaldavTemplate = CaldavTemplate;
	exports.ConnectionControls = ConnectionControls;
	exports.ExchangeTemplate = ExchangeTemplate;
	exports.GoogleSyncWizard = GoogleSyncWizard;
	exports.GoogleTemplate = GoogleTemplate;
	exports.GridUnit = GridUnit;
	exports.IcalSyncPopup = IcalSyncPopup;
	exports.IcloudAuthDialog = IcloudAuthDialog;
	exports.IcloudTemplate = IcloudTemplate;
	exports.IphoneTemplate = IphoneTemplate;
	exports.MacTemplate = MacTemplate;
	exports.MobileSyncBanner = MobileSyncBanner;
	exports.Office365template = Office365template;
	exports.OutlookTemplate = OutlookTemplate;
	exports.SyncPanel = SyncPanel;
	exports.SyncPanelUnit = SyncPanelUnit;
	exports.YandexTemplate = YandexTemplate;

})(this.BX.Calendar.Sync.Interface = this.BX.Calendar.Sync.Interface || {}, window, BX, window, BX, BX.Calendar.Sync.Manager, BX, BX, BX.Calendar, BX.UI, BX.Event, BX.UI.Dialogs, BX.Calendar, BX.Main, BX.UI);
//# sourceMappingURL=syncinterface.bundle.js.map
