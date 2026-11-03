/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, main_core_events, ui_a11y, ui_buttons, ui_iconSet_actions, ui_iconSet_main, ui_icons_b24, ui_icons_crm, ui_popupcomponentsmaker, intranet_widgetLoader, main_popup) {
	'use strict';

	class RequisiteSection extends main_core_events.EventEmitter {
		#companyId;
		#requisiteId;
		#isConnected;
		#isPublic;
		#publicUrl;
		#editUrl;
		#requisiteElement;
		#requisitesPopup;
		#requisiteButton;
		#closeSettingsWidget;
		#getSettingsPopup;
		#handleSettingsPopupClick = () => {
			this.#requisitesPopup?.close();
		};
		constructor(options, closeSettingsWidget, getSettingsPopup) {
			super();
			this.#closeSettingsWidget = closeSettingsWidget;
			this.#getSettingsPopup = getSettingsPopup;
			if (options) {
				this.#updateOptions(options);
				top.BX.addCustomEvent('onLocalStorageSet', params => {
					const eventName = params?.key ?? null;
					if (eventName === 'onCrmEntityUpdate' || eventName === 'onCrmEntityCreate' || eventName === 'BX.Crm.RequisiteSliderDetails:onSave') {
						this.#getRequisites().then(() => {
							this.#updateElement();
						});
					}
				});
			}
		}
		#updateOptions(options) {
			this.#companyId = options.companyId ?? 0;
			this.#requisiteId = options.requisiteId ?? 0;
			this.#isConnected = main_core.Type.isBoolean(options.isConnected) ? options.isConnected : false;
			this.#isPublic = main_core.Type.isBoolean(options.isPublic) ? options.isPublic : false;
			this.#publicUrl = main_core.Type.isString(options.publicUrl) ? options.publicUrl : '';
			this.#editUrl = main_core.Type.isString(options.editUrl) ? options.editUrl : '';
		}
		#updateElement(forceFocusRestore = false) {
			const currentElement = this.getElement();
			const activeElement = ui_a11y.FocusNavigator.getActiveElement(currentElement);
			const shouldMoveFocus = forceFocusRestore || activeElement !== null && currentElement.contains(activeElement);
			if (this.#requisitesPopup) {
				this.#requisitesPopup.destroy();
				this.#requisitesPopup = null;
			}
			this.#requisiteElement = null;
			this.#requisiteButton = null;
			const newElement = this.getElement();
			main_core.Dom.replace(currentElement, newElement);
			const settingsPopup = this.#getSettingsPopup();
			if (shouldMoveFocus && settingsPopup?.isShown()) {
				ui_a11y.FocusNavigator.focusTarget(this.#getRequisiteButton().getContainer(), {
					focusVisible: true
				});
			}
		}
		getElement() {
			if (!this.#requisiteElement) {
				const onclickHelp = () => {
					this.#closeSettingsWidget();
					BX.Helper.show('redirect=detail&code=18213326');
				};
				this.#requisiteElement = main_core.Tag.render`
				<div
					class="intranet-settings-widget__business-card intranet-settings-widget_box"
					data-testid="settings-widget-block-requisite"
				>
					<div class="intranet-settings-widget__business-card_head intranet-settings-widget_inner">
						<div class="intranet-settings-widget_icon-box --gray">
							<div class="ui-icon-set --customer-card-1" aria-hidden="true"></div>
						</div>
						<div class="intranet-settings-widget__title" data-role="requisite-widget-title">
							${this.#isConnected ? main_core.Loc.getMessage('INTRANET_SETTINGS_WIDGET_SECTION_REQUISITE_SITE_TITLE') : main_core.Loc.getMessage('INTRANET_SETTINGS_WIDGET_SECTION_REQUISITE_TITLE')}
						</div>
						<button
							type="button"
							class="intranet-settings-widget__requisite-help"
							aria-label="${main_core.Loc.getMessage('INTRANET_SETTINGS_WIDGET_REQUISITE_HELP_ARIA')}"
							data-testid="settings-widget-requisite-help"
							onclick="${onclickHelp}"
						>
							<span class="ui-icon-set --help" aria-hidden="true"></span>
						</button>
					</div>

					<div class="intranet-settings-widget__business-card_footer">
						${this.#getRequisiteButton().getContainer()}
						${this.#companyId ? this.#getRequisiteSettingsButton() : ''}
					</div>
				</div>
			`;
			}
			return this.#requisiteElement;
		}
		#getRequisiteSettingsButton() {
			const onclickRequisitesSettings = event => {
				this.#getRequisitesPopup(event.currentTarget).show();
			};
			return main_core.Tag.render`
			<button
				type="button"
				class="intranet-settings-widget__requisite-btn"
				aria-label="${main_core.Loc.getMessage('INTRANET_SETTINGS_WIDGET_REQUISITE_MORE_ARIA')}"
				aria-haspopup="menu"
				aria-expanded="false"
				data-testid="settings-widget-requisite-more"
				onclick="${onclickRequisitesSettings}"
			>
				<span class="ui-icon-set --more-information" aria-hidden="true"></span>
			</button>
		`;
		}
		#getRequisitesPopupEvents(bindElement) {
			return {
				onShow: () => {
					main_core.Dom.attr(bindElement, 'aria-expanded', 'true');
					setTimeout(() => {
						if (!this.#requisitesPopup?.isShown()) {
							return;
						}
						const settingsPopupContainer = this.#getSettingsPopup()?.getPopupContainer();
						if (settingsPopupContainer) {
							main_core.Event.unbind(settingsPopupContainer, 'click', this.#handleSettingsPopupClick);
							main_core.Event.bind(settingsPopupContainer, 'click', this.#handleSettingsPopupClick);
						}
					}, 0);
				},
				onClose: () => {
					this.#unbindSettingsPopupClick();
					main_core.Dom.attr(bindElement, 'aria-expanded', 'false');
					if (ui_a11y.FocusMonitor.Instance.getLastInputModality() === 'keyboard') {
						ui_a11y.FocusNavigator.focusTarget(bindElement, {
							focusVisible: true
						});
					}
				},
				onDestroy: () => {
					this.#unbindSettingsPopupClick();
					main_core.Dom.attr(bindElement, 'aria-expanded', 'false');
					this.#requisitesPopup = null;
				}
			};
		}
		#unbindSettingsPopupClick() {
			const settingsPopupContainer = this.#getSettingsPopup()?.getPopupContainer();
			if (settingsPopupContainer) {
				main_core.Event.unbind(settingsPopupContainer, 'click', this.#handleSettingsPopupClick);
			}
		}
		#getRequisitesPopup(bindElement) {
			if (!this.#requisitesPopup) {
				const onclickCopyLink = () => {
					if (BX.clipboard.copy(this.#publicUrl)) {
						const message = main_core.Loc.getMessage('INTRANET_SETTINGS_WIDGET_COPIED_POPUP');
						BX.UI.Notification.Center.notify({
							content: message,
							position: 'top-left',
							autoHideDelay: 3000
						});
						ui_a11y.LiveAnnouncer.announce(message, 'polite');
					}
				};
				const onclickConfigureSite = () => {
					window.open(this.#editUrl, '_blank');
					this.#requisitesPopup.close();
					this.#closeSettingsWidget();
				};
				let copyLinkButton = null;
				if (this.#publicUrl) {
					copyLinkButton = {
						attrs: {
							'data-testid': 'settings-widget-requisite-copy-link'
						},
						html: `
							<div class="intranet-settings-widget__popup-item">
								<div class="ui-icon-set --link-3"></div> 
								<div class="intranet-settings-widget__popup-name">
									${main_core.Loc.getMessage('INTRANET_SETTINGS_WIDGET_COPY_LINK_BUTTON')}
								</div>
							</div>
						`,
						onclick: onclickCopyLink
					};
				}
				let configureSiteButton = null;
				if (this.#editUrl) {
					configureSiteButton = {
						attrs: {
							'data-testid': 'settings-widget-requisite-configure-site'
						},
						html: `
							<div class="intranet-settings-widget__popup-item">
								<div class="ui-icon-set --paint-1"></div> 
								<div class="intranet-settings-widget__popup-name">
									${main_core.Loc.getMessage('INTRANET_SETTINGS_CONFIGURE_CUTAWAY_SITE_BUTTON')}
								</div>
							</div>
						`,
						onclick: onclickConfigureSite
					};
				}
				const onclickConfigureRequisites = () => {
					if (this.#requisitesPopup) {
						this.#requisitesPopup.close();
					}
					this.#closeSettingsWidget();
					BX.SidePanel.Instance.open(`/crm/company/details/${this.#companyId}/?init_mode=edit&rqedit=y`);
				};
				const configureRequisiteButton = {
					attrs: {
						'data-testid': 'settings-widget-requisite-configure'
					},
					html: `
						<div class="intranet-settings-widget__popup-item">
							<div class="ui-icon-set --pencil-40"></div>
							<div class="intranet-settings-widget__popup-name">
								${main_core.Loc.getMessage('INTRANET_SETTINGS_CONFIGURE_REQUISITE_BUTTON')}
							</div>
						</div>
					`,
					onclick: onclickConfigureRequisites
				};
				const popupWidth = 240;
				this.#requisitesPopup = main_popup.MenuManager.create('requisites-settings', bindElement, [copyLinkButton, configureRequisiteButton, configureSiteButton], {
					ariaLabel: main_core.Loc.getMessage('INTRANET_SETTINGS_WIDGET_REQUISITE_MORE_ARIA'),
					closeByEsc: true,
					autoHide: true,
					focusTrap: {
						initialFocus: 'container'
					},
					width: popupWidth,
					offsetLeft: -72,
					angle: {
						offset: popupWidth / 2 - 15
					},
					events: this.#getRequisitesPopupEvents(bindElement)
				});
				main_core.Dom.attr(this.#requisitesPopup.getMenuContainer(), 'data-testid', 'settings-widget-requisite-menu');
			}
			return this.#requisitesPopup;
		}
		#getButtonText() {
			if (this.#isConnected) {
				return main_core.Loc.getMessage('INTRANET_SETTINGS_WIDGET_REDIRECT_TO_REQUISITE_BUTTON');
			}
			if (this.#companyId > 0 && this.#requisiteId > 0) {
				return main_core.Loc.getMessage('INTRANET_SETTINGS_WIDGET_CREATE_LANDING');
			}
			return main_core.Loc.getMessage('INTRANET_SETTINGS_CONFIGURE_REQUISITE_BUTTON');
		}
		#getRequisiteButton() {
			if (!this.#requisiteButton) {
				this.#requisiteButton = new BX.UI.Button({
					id: 'requisite-btn',
					text: this.#getButtonText(),
					noCaps: true,
					onclick: this.#handleButtonOnclick.bind(this),
					className: 'ui-btn ui-btn-light-border ui-btn-round ui-btn-xs ui-btn-no-caps intranet-setting__btn-light'
				});
				main_core.Dom.attr(this.#requisiteButton.getContainer(), 'data-testid', 'settings-widget-requisite-primary');
			}
			return this.#requisiteButton;
		}
		#handleButtonOnclick() {
			if (this.#isConnected) {
				this.#handleOpenRequisite();
			} else if (this.#companyId > 0) {
				if (this.#requisiteId > 0) {
					this.#handleCreateLanding();
				} else {
					this.#handleEditRequisite();
				}
			} else {
				this.#handleCreateCompany();
			}
		}
		#handleOpenRequisite() {
			this.#closeSettingsWidget();
			window.open(this.#publicUrl, '_blank');
		}
		#handleCreateLanding() {
			const requisiteButton = this.#getRequisiteButton();
			const shouldRestoreFocus = ui_a11y.FocusNavigator.getActiveElement(this.getElement()) === requisiteButton.getContainer();
			requisiteButton.setWaiting(true);
			this.#createLanding().then(() => {
				this.#requisiteButton = null;
				this.#updateElement(shouldRestoreFocus);
				if (!this.#isPublic) {
					const message = main_core.Loc.getMessage('INTRANET_SETTINGS_WIDGET_CREATE_LANDING_ERROR');
					const errorPopup = new main_popup.Popup('public-landing-error', this.getElement().querySelector('[data-role="requisite-widget-title"]'), {
						autoHide: true,
						closeByEsc: true,
						focusTrap: false,
						angle: true,
						darkMode: true,
						ariaLabel: message,
						content: message,
						events: {
							onShow: () => {
								setTimeout(() => {
									main_core.Event.bindOnce(this.#getSettingsPopup().getPopupContainer(), 'click', () => {
										errorPopup.close();
									});
								}, 0);
							},
							onClose: () => {
								errorPopup.destroy();
							}
						}
					});
					main_core.Dom.attr(errorPopup.getPopupContainer(), 'data-testid', 'settings-widget-requisite-error');
					errorPopup.show();
					ui_a11y.LiveAnnouncer.announce(message, 'assertive');
				}
			});
		}
		#createLanding() {
			return new Promise(resolve => {
				main_core.ajax.runComponentAction('bitrix:intranet.settings.widget', 'createRequisiteLanding', {
					mode: 'class'
				}).then(({
					data: {
						isConnected,
						isPublic,
						publicUrl,
						editUrl
					}
				}) => {
					this.#isConnected = isConnected;
					this.#isPublic = isPublic;
					this.#publicUrl = publicUrl;
					this.#editUrl = editUrl;
					resolve();
				});
			});
		}
		#handleEditRequisite() {
			this.#closeSettingsWidget();
			BX.SidePanel.Instance.open(`/crm/company/details/${this.#companyId}/?init_mode=edit&rqedit=y`);
		}
		#handleCreateCompany() {
			this.#closeSettingsWidget();
			BX.SidePanel.Instance.open('/crm/company/details/0/?mycompany=y&rqedit=y');
		}
		#getRequisites() {
			return new Promise(resolve => {
				main_core.ajax.runComponentAction('bitrix:intranet.settings.widget', 'getRequisites', {
					mode: 'class'
				}).then(({
					data: {
						requisite
					}
				}) => {
					this.#updateOptions(requisite);
					resolve();
				});
			});
		}
	}

	class SettingsWidget extends main_core_events.EventEmitter {
		#widgetPopup;
		#target;
		#otp;
		static #instance = null;
		#marketUrl;
		#theme;
		#holding = null;
		#holdingWidget;
		#isBitrix24 = false;
		#isFreeLicense = false;
		#isAdmin;
		#requisite;
		#requisiteSection;
		#settingsUrl;
		#isRenameable;
		#mainPage;
		constructor(options) {
			super();
			this.setEventNamespace('BX.Intranet.SettingsWidget');
			this.#marketUrl = options.marketUrl;
			this.#isBitrix24 = options.isBitrix24;
			this.#isFreeLicense = options.isFreeLicense;
			this.#isAdmin = options.isAdmin;
			this.#requisite = options.requisite;
			this.#settingsUrl = options.settingsPath;
			this.#isRenameable = options.isRenameable;
			this.#mainPage = options.mainPage;
			this.#requisiteSection = new RequisiteSection(options.requisite, () => this.getWidget().close(), () => this.getWidget().getPopup());
			this.#setOptions(options);
		}
		#setOptions(options) {
			options.theme ? this.#theme = options.theme : null;
			options.otp ? this.#otp = options.otp : null;
			options.holding ? this.#setHoldingOptions(options.holding) : null;
		}
		#setHoldingOptions(options) {
			if (!main_core.Type.isPlainObject(options)) {
				this.#holding = null;
				return;
			}
			this.#holding = {
				isHolding: options.isHolding ?? false,
				affiliate: options.affiliate ?? null,
				canBeHolding: options.canBeHolding ?? false,
				canBeAffiliate: options.canBeAffiliate ?? false
			};
		}
		setTarget(target) {
			this.#target = target;
			return this;
		}
		setWidgetLoader(widgetLoader) {
			this.#widgetPopup = new ui_popupcomponentsmaker.PopupComponentsMaker({
				width: 374,
				popupLoader: widgetLoader.getPopup(),
				useAngle: false
			});
			this.#widgetPopup.getPopup().subscribe('onClose', () => {
				main_core.Event.unbindAll(this.getWidget().getPopup().getPopupContainer(), 'click');
				this.#updateAriaExpanded(false);
			});
			const popup = this.#widgetPopup.getPopup();
			const popupContainer = popup.getPopupContainer();
			const loadingFocusTarget = ui_a11y.FocusNavigator.getActiveElement(popupContainer);
			const shouldSetInitialFocus = popup.isShown() && ui_a11y.FocusMonitor.Instance.getLastInputModality() === 'keyboard' && loadingFocusTarget !== null && popupContainer.contains(loadingFocusTarget);
			widgetLoader.clearBeforeInsertContent();
			this.#getItemsList().then(() => {
				this.#drawItemsList();
				const currentFocusTarget = ui_a11y.FocusNavigator.getActiveElement(popupContainer);
				if (shouldSetInitialFocus && popup.isShown() && currentFocusTarget !== null && currentFocusTarget === loadingFocusTarget && popupContainer.contains(currentFocusTarget)) {
					ui_a11y.FocusNavigator.focusContainer(popupContainer);
				}
			});
			return this;
		}
		static bindWidget(widgetLoader) {
			const instance = this.getInstance();
			if (instance) {
				instance.setWidgetLoader(widgetLoader);
			}
			return instance;
		}
		static bind(button) {
			const instance = this.getInstance();
			if (instance) {
				main_core.Event.unbindAll(button);
				main_core.Event.bind(button, 'click', instance.toggle.bind(instance, button));
			}
			return instance;
		}
		static bindAndShow(button) {
			const instance = this.bind(button);
			if (instance) {
				instance.show(button);
			}
			return instance;
		}
		static init(options) {
			if (this.#instance === null) {
				this.#instance = new this(options);
			}
			return this.#instance;
		}
		static getInstance() {
			return this.#instance;
		}
		static close() {
			const instance = this.getInstance();
			if (instance) {
				instance.getWidget().close();
			}
		}
		toggle(targetNode) {
			const popup = this.getWidget().getPopup();
			if (popup.isShown()) {
				popup.close();
				this.#updateAriaExpanded(false);
			} else {
				this.show(targetNode);
			}
		}
		show(targetNode) {
			const popup = this.getWidget().getPopup();
			popup.setBindElement(targetNode);
			popup.show();
			if (popup.getPopupContainer().getBoundingClientRect().left < 30) {
				main_core.Dom.style(popup.getPopupContainer(), {
					left: '30px'
				});
			}
			this.setTarget(targetNode);
			this.#updateAriaExpanded(true);
		}
		getWidget() {
			return this.#widgetPopup;
		}
		#getItemsList(reload = false) {
			if (reload === true || typeof this.#theme === 'undefined') {
				return new Promise(resolve => {
					main_core.ajax.runComponentAction('bitrix:intranet.settings.widget', 'getData', {
						mode: 'class'
					}).then(({
						data: {
							theme,
							otp,
							holding
						}
					}) => {
						this.#theme = theme;
						this.#otp = otp;
						this.#setHoldingOptions(holding);
						resolve();
					});
				});
			}
			return Promise.resolve();
		}
		#drawItemsList() {
			const container = this.getWidget().getPopup().getPopupContainer();
			main_core.Dom.append(this.#getHeader(), container);
			const content = [this.#requisite && this.#isAdmin ? this.#getRequisitesElement() : null, this.#mainPage.isAvailable ? this.#getMainPageElement() : null, this.#isAdmin ? this.#getSecurityAndSettingsElement() : null, this.#isBitrix24 ? this.#getHoldingsElement() : null, this.#isAdmin ? this.#getMigrateElement() : null];
			content.forEach(element => {
				main_core.Dom.append(element, container);
			});
			if (this.#isAdmin) {
				main_core.Dom.append(this.#getFooter(), container);
			}
		}
		#getLinkHeaderIcon() {
			const onclickCopyLink = () => {
				if (BX.clipboard.copy(window.location.origin)) {
					const message = main_core.Loc.getMessage('INTRANET_SETTINGS_WIDGET_LINK_COPIED_POPUP');
					BX.UI.Notification.Center.notify({
						content: message,
						position: 'top-left',
						autoHideDelay: 3000
					});
					ui_a11y.LiveAnnouncer.announce(message, 'polite');
				}
			};
			return main_core.Tag.render`
			<button
				type="button"
				class="intranet-settings-widget__header-btn"
				aria-label="${main_core.Loc.getMessage('INTRANET_SETTINGS_WIDGET_COPY_PORTAL_LINK_ARIA')}"
				data-autofocus
				data-testid="settings-widget-copy-link"
				onclick="${onclickCopyLink}"
			>
				<span class="ui-icon-set --link-3" aria-hidden="true"></span>
			</button>
		`;
		}
		#getEditHeaderIcon() {
			const settingsUrl = `${this.#settingsUrl}?analyticContext=widget_settings_settings&page=portal&option=subDomainName`;
			const onclickEditLink = this.#openSidePanel.bind(this, settingsUrl);
			return main_core.Tag.render`
			<a
				class="intranet-settings-widget__header-btn"
				href="${settingsUrl}"
				aria-label="${main_core.Loc.getMessage('INTRANET_SETTINGS_WIDGET_RENAME_PORTAL_ARIA')}"
				data-autofocus
				data-testid="settings-widget-rename"
				onclick="${onclickEditLink}"
			>
				<span class="ui-icon-set --pencil-40" aria-hidden="true"></span>
			</a>
		`;
		}
		#getHeader() {
			const header = main_core.Tag.render`
				<div class="intranet-settings-widget__header">
					<div class="intranet-settings-widget__header_inner">
						<span class="intranet-settings-widget__header-name">${window.location.host}</span>
						${this.#isRenameable ? this.#getEditHeaderIcon() : this.#getLinkHeaderIcon()}
					</div>
				</div>
			`;
			this.#applyTheme(header, this.#theme);
			const adaptedEmptyHeader = new ui_popupcomponentsmaker.PopupComponentsMakerItem({
				withoutBackground: true,
				html: header
			}).getContainer();
			main_core.Dom.addClass(adaptedEmptyHeader, '--widget-header');
			main_core_events.EventEmitter.subscribe('BX.Intranet.Bitrix24:ThemePicker:onThemeApply', ({
				data: {
					theme
				}
			}) => {
				this.#applyTheme(header, theme);
			});
			return adaptedEmptyHeader;
		}
		#applyTheme(container, theme) {
			const previewImage = `url('${main_core.Text.encode(theme.previewImage)}')`;
			main_core.Dom.style(container, 'backgroundImage', previewImage);
			main_core.Dom.removeClass(container, 'bitrix24-dark-theme bitrix24-light-theme');
			const themeClass = String(theme.id).indexOf('dark:') === 0 ? 'bitrix24-dark-theme' : 'bitrix24-light-theme';
			main_core.Dom.addClass(container, themeClass);
		}
		#getFooter() {
			const onclickOpenPartnerOrder = () => {
				this.getWidget().close();
				BX.UI.InfoHelper.show('info_implementation_request');
			};
			const partnerOrder = main_core.Tag.render`
			<button
				type="button"
				class="intranet-settings-widget__footer-item"
				data-testid="settings-widget-order"
				onclick="${onclickOpenPartnerOrder}"
			>
				${main_core.Loc.getMessage('INTRANET_SETTINGS_WIDGET_ORDER_PARTNER_LINK_MSGVER_1')}
			</button>
		`;
			const onclickWhereToBegin = () => {
				if (top.BX.Helper) {
					this.getWidget().close();
					top.BX.Helper.show('redirect=detail&code=18371844');
				}
			};
			const onclickSupport = () => {
				if (top.BX.Helper) {
					this.getWidget().close();
					if (this.#isFreeLicense) {
						BX.UI.InfoHelper.show('limit_support_bitrix');
					} else {
						BX.Helper.show('redirect=detail&code=12925062');
					}
				}
			};
			return main_core.Tag.render`
				<div class="intranet-settings-widget__footer">
					${this.#isBitrix24 ? partnerOrder : ''}
					<button
						type="button"
						class="intranet-settings-widget__footer-item"
						data-testid="settings-widget-getting-started"
						onclick="${onclickWhereToBegin}"
					>
						${main_core.Loc.getMessage('INTRANET_SETTINGS_WIDGET_WHERE_TO_BEGIN_LINK')}
					</button>
					<button
						type="button"
						class="intranet-settings-widget__footer-item"
						data-testid="settings-widget-support"
						onclick="${onclickSupport}"
					>
						${main_core.Loc.getMessage('INTRANET_SETTINGS_WIDGET_SUPPORT_BUTTON')}
					</button>
				</div>
			`;
		}
		#prepareElement(element) {
			const item = this.getWidget().getItem({
				html: element
			});
			const node = item.getContainer();
			main_core.Dom.addClass(node, '--widget-item');
			return node;
		}
		#openSidePanel(url, event) {
			if (event.ctrlKey || event.metaKey) {
				return;
			}
			event.preventDefault();
			this.getWidget().close();
			BX.SidePanel.Instance.open(url);
		}
		#getMainPageElement() {
			const onclick = this.#openSidePanel.bind(this, this.#mainPage.settingsPath);
			const element = main_core.Tag.render`
			<a
				class="intranet-settings-widget_box --clickable"
				href="${this.#mainPage.settingsPath}"
				data-testid="settings-widget-main-page"
				onclick="${onclick}"
			>
				<span class="intranet-settings-widget_inner">
					<span class="intranet-settings-widget_icon-box --green">
						<span class="ui-icon-set --home-page" aria-hidden="true"></span>
					</span>
					<span class="intranet-settings-widget__title">
						${main_core.Loc.getMessage('INTRANET_SETTINGS_WIDGET_WELCOME_PAGE_TITLE')}
					</span>
				</span>
				<span class="intranet-settings-widget__arrow-btn ui-icon-set --arrow-right" aria-hidden="true"></span>
			</a>
		`;
			return this.#prepareElement(element);
		}
		#getRequisitesElement() {
			return this.#prepareElement(this.#requisiteSection.getElement());
		}
		#getHoldingsElement() {
			if (this.#isBitrix24 !== true || this.#holding === null) {
				return null;
			}
			if (!main_core.Type.isPlainObject(this.#holding.affiliate)) {
				return this.#getEmptyHoldingsElement();
			}
			const affiliate = this.#holding.affiliate;
			const onclickOpen = () => {
				this.getWidget().close();
				this.#getHoldingWidget().show(this.#target);
			};
			const element = main_core.Tag.render`
			<button
				type="button"
				class="intranet-settings-widget__branch"
				data-testid="settings-widget-affiliate"
				onclick="${onclickOpen}"
			>
					<span class="intranet-settings-widget__branch-icon_box">
						<span class="ui-icon-set intranet-settings-widget__branch-icon --filial-network" aria-hidden="true"></span>
					</span>
					<span class="intranet-settings-widget__branch_content">
						<span class="intranet-settings-widget__branch-title">
							${affiliate.isHolding ? main_core.Loc.getMessage('INTRANET_SETTINGS_WIDGET_MAIN_BRANCH') : main_core.Loc.getMessage('INTRANET_SETTINGS_WIDGET_SECONDARY_BRANCH')}
						</span>
						<span class="intranet-settings-widget__title">
							${affiliate.name}
						</span>
					</span>
					<span class="intranet-settings-widget__branch-btn_box">
						<span class="ui-btn ui-btn-light-border ui-btn-round ui-btn-xs ui-btn-no-caps intranet-setting__btn-light">
							${main_core.Loc.getMessage('INTRANET_SETTINGS_WIDGET_BRANCHES')}
						</span>
					</span>
				</button>
			`;
			return this.#prepareElement(element);
		}
		#getHoldingWidget() {
			if (!this.#holdingWidget) {
				this.#holdingWidget = BX.Intranet.HoldingWidget.getInstance();
				const onclickClose = () => {
					this.#holdingWidget.getWidget().close();
					this.show(this.#target);
				};
				const holdingWidgetCloseBtn = main_core.Tag.render`
				<button
					type="button"
					class="intranet-settings-widget__close-btn"
					data-testid="settings-widget-holding-back"
					onclick="${onclickClose}"
				>
					<span aria-hidden="true" class="ui-icon-set --arrow-left intranet-settings-widget__close-btn_icon"></span>
					<span class="intranet-settings-widget__close-btn_name">
						${main_core.Loc.getMessage('INTRANET_SETTINGS_WIDGET_BRANCH_LIST')}
					</span>
				</button>
			`;
				this.#holdingWidget.getWidget().getPopup().getContentContainer().prepend(holdingWidgetCloseBtn);
			}
			return this.#holdingWidget;
		}
		#getEmptyHoldingsElement() {
			if (!main_core.Type.isPlainObject(this.#holding)) {
				return null;
			}
			const title = this.#isAdmin ? main_core.Loc.getMessage('INTRANET_SETTINGS_WIDGET_FILIAL_NETWORK') : main_core.Loc.getMessage('INTRANET_SETTINGS_WIDGET_FILIAL_NETWORK_UNAVAILABLE');
			const buttonText = this.#isAdmin ? main_core.Loc.getMessage('INTRANET_SETTINGS_WIDGET_FILIAL_SETTINGS') : main_core.Loc.getMessage('INTRANET_SETTINGS_WIDGET_FILIAL_ABOUT');
			const onclickOpen = () => {
				this.getWidget().close();
				if (this.#holding.canBeHolding) {
					this.#getHoldingWidget().show(this.#target);
				} else {
					BX.UI.InfoHelper.show('limit_office_multiple_branches');
				}
			};
			const lockIcon = main_core.Tag.render`
			<span class="intranet-settings-widget__branch-lock-icon_box">
				<span class="ui-icon-set intranet-settings-widget__branch-lock-icon --lock" aria-hidden="true"></span>
			</span>
		`;
			const element = main_core.Tag.render`
			<button
				type="button"
				class="intranet-settings-widget__branch"
				data-testid="settings-widget-holding"
				onclick="${onclickOpen}"
			>
				<span class="intranet-settings-widget__branch-icon_box">
					<span class="ui-icon-set intranet-settings-widget__branch-icon --filial-network" aria-hidden="true"></span>
					${!this.#holding.canBeHolding ? lockIcon : ''}
				</span>
				<span class="intranet-settings-widget__branch_content">
					<span class="intranet-settings-widget__title">${title}</span>
				</span>
				<span class="intranet-settings-widget__branch-btn_box">
					<span
						class="ui-btn ui-btn-light-border ui-btn-round ui-btn-xs ui-btn-no-caps intranet-setting__btn-light"
					>
						${buttonText}
					</span>
				</span>
			</button>
		`;
			return this.#prepareElement(element);
		}
		#getSecurityAndSettingsElement() {
			return main_core.Tag.render`
			<div class="intranet-settings-widget_inline-box">
				${this.#getSecurityElement()}
				${this.#getGeneralSettingsElement()}
			</div>
		`;
		}
		#getSecurityElement() {
			const settingsUrl = `${this.#settingsUrl}?page=security&analyticContext=widget_settings_settings`;
			const onclick = this.#openSidePanel.bind(this, settingsUrl);
			const element = main_core.Tag.render`
			<a
				class="intranet-settings-widget_box --clickable"
				href="${settingsUrl}"
				data-testid="settings-widget-security"
				onclick="${onclick}"
			>
				<span class="intranet-settings-widget_inner">
					<span class="intranet-settings-widget_icon-box ${this.#otp.IS_ACTIVE === 'Y' ? '--green' : '--yellow'}">
						<span class="ui-icon-set --shield" aria-hidden="true"></span>
					</span>
					<span class="intranet-settings-widget__title">
						${main_core.Loc.getMessage('INTRANET_SETTINGS_WIDGET_SECTION_SECURITY_TITLE')}
					</span>
				</span>
				<span class="intranet-settings-widget__arrow-btn ui-icon-set --arrow-right" aria-hidden="true"></span>
			</a>
		`;
			return this.#prepareElement(element);
		}
		#getGeneralSettingsElement() {
			const settingsUrl = `${this.#settingsUrl}?analyticContext=widget_settings_settings`;
			const onclick = this.#openSidePanel.bind(this, settingsUrl);
			const element = main_core.Tag.render`
			<a
				class="intranet-settings-widget_box --clickable"
				href="${settingsUrl}"
				data-testid="settings-widget-general"
				onclick="${onclick}"
			>
				<span class="intranet-settings-widget_inner">
					<span class="intranet-settings-widget_icon-box --gray">
						<span class="ui-icon-set --settings-2" aria-hidden="true"></span>
					</span>
					<span class="intranet-settings-widget__title">
						${main_core.Loc.getMessage('INTRANET_SETTINGS_WIDGET_SECTION_SETTINGS_TITLE')}
					</span>
				</span>
				<span class="intranet-settings-widget__arrow-btn ui-icon-set --arrow-right" aria-hidden="true"></span>
			</a>
		`;
			return this.#prepareElement(element);
		}
		#getMigrateElement() {
			const marketUrl = `${this.#marketUrl}category/migration/`;
			const onclick = this.#openSidePanel.bind(this, marketUrl);
			const element = main_core.Tag.render`
			<a
				class="intranet-settings-widget_box --clickable"
				href="${marketUrl}"
				data-testid="settings-widget-migrate"
				onclick="${onclick}"
			>
				<span class="intranet-settings-widget_inner">
					<span class="intranet-settings-widget_icon-box --gray">
						<span class="ui-icon-set --market-1" aria-hidden="true"></span>
					</span>
					<span class="intranet-settings-widget__title">
						${main_core.Loc.getMessage('INTRANET_SETTINGS_WIDGET_SECTION_MIGRATION_TITLE')}
					</span>
				</span>
				<span class="intranet-settings-widget__arrow-btn ui-icon-set --arrow-right" aria-hidden="true"></span>
			</a>
		`;
			return this.#prepareElement(element);
		}
		#updateAriaExpanded(expanded) {
			if (this.#target) {
				main_core.Dom.attr(this.#target, 'aria-expanded', expanded);
			}
		}
	}

	exports.SettingsWidget = SettingsWidget;

})(this.BX.Intranet = this.BX.Intranet || {}, BX, BX.Event, BX.UI.Accessibility, BX.UI, window, window, BX, BX, BX.UI, BX.Intranet, BX.Main);
//# sourceMappingURL=script.js.map
