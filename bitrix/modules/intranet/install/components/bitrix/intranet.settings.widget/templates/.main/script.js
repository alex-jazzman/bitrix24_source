/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, main_core_events, ui_buttons, ui_iconSet_actions, ui_iconSet_main, ui_icons_b24, ui_icons_crm, ui_popupcomponentsmaker) {
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
		constructor(options) {
			super();
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
		#updateElement() {
			const currentElement = this.getElement();
			this.#requisiteElement = null;
			this.#requisiteButton = null;
			main_core.Dom.replace(currentElement, this.getElement());
		}
		getElement() {
			if (!this.#requisiteElement) {
				this.#requisiteElement = main_core.Tag.render`
				<div class="intranet-settings-widget__business-card intranet-settings-widget_box" data-testid="settings-widget-block-requisite">
					<div class="intranet-settings-widget__business-card_head intranet-settings-widget_inner">
						<div class="intranet-settings-widget_icon-box --gray">
							<div class="ui-icon-set --customer-card-1"></div>
						</div>
						<div class="intranet-settings-widget__title" data-role="requisite-widget-title">
							${this.#isConnected ? main_core.Loc.getMessage('INTRANET_SETTINGS_WIDGET_SECTION_REQUISITE_SITE_TITLE') : main_core.Loc.getMessage('INTRANET_SETTINGS_WIDGET_SECTION_REQUISITE_TITLE')}
						</div>
						<i class="ui-icon-set --help" onclick="BX.Helper.show('redirect=detail&code=18213326')"></i>
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
			const onclickRequisitesSettings = () => {
				this.#getRequisitesPopup().show();
			};
			return main_core.Tag.render`
			<span onclick="${onclickRequisitesSettings}" class="intranet-settings-widget__requisite-btn">
				<i class='ui-icon-set --more-information'></i>
			</span>
		`;
		}
		#getRequisitesPopup() {
			if (!this.#requisitesPopup) {
				const onclickCopyLink = () => {
					if (BX.clipboard.copy(this.#publicUrl)) {
						BX.UI.Notification.Center.notify({
							content: main_core.Loc.getMessage('INTRANET_SETTINGS_WIDGET_COPIED_POPUP'),
							position: 'top-left',
							autoHideDelay: 3000
						});
					}
				};
				const onclickConfigureSite = () => {
					window.open(this.#editUrl, '_blank');
					this.#requisitesPopup.close();
					SettingsWidget.close();
				};
				let copyLinkButton = null;
				if (this.#publicUrl) {
					copyLinkButton = {
						html: `
							<div class="intranet-settings-widget__popup-item">
								<div class="ui-icon-set --link-3"></div> 
								<div class="intranet-settings-widget__popup-name">${main_core.Loc.getMessage('INTRANET_SETTINGS_WIDGET_COPY_LINK_BUTTON')}</div>
							</div>
						`,
						onclick: onclickCopyLink
					};
				}
				let configureSiteButton = null;
				if (this.#editUrl) {
					configureSiteButton = {
						html: `
							<div class="intranet-settings-widget__popup-item">
								<div class="ui-icon-set --paint-1"></div> 
								<div class="intranet-settings-widget__popup-name">${main_core.Loc.getMessage('INTRANET_SETTINGS_CONFIGURE_CUTAWAY_SITE_BUTTON')}</div>
							</div>
						`,
						onclick: onclickConfigureSite
					};
				}
				const onclickConfigureRequisites = () => {
					if (this.#requisitesPopup) {
						this.#requisitesPopup.close();
					}
					SettingsWidget.close();
					BX.SidePanel.Instance.open(`/crm/company/details/${this.#companyId}/?init_mode=edit&rqedit=y`);
				};
				const configureRequisiteButton = {
					html: `
						<div class="intranet-settings-widget__popup-item">
							<div class="ui-icon-set --pencil-40"></div>
							<div class="intranet-settings-widget__popup-name">${main_core.Loc.getMessage('INTRANET_SETTINGS_CONFIGURE_REQUISITE_BUTTON')}</div>
						</div>
					`,
					onclick: onclickConfigureRequisites
				};
				const popupWidth = 240;
				this.#requisitesPopup = BX.PopupMenu.create('requisites-settings', event.currentTarget, [copyLinkButton, configureRequisiteButton, configureSiteButton], {
					closeByEsc: true,
					autoHide: true,
					width: popupWidth,
					offsetLeft: -72,
					angle: {
						offset: popupWidth / 2 - 15
					},
					events: {
						onShow: () => {
							setTimeout(() => {
								main_core.Event.bindOnce(SettingsWidget.getInstance().getWidget().getPopup().getPopupContainer(), 'click', () => {
									this.#requisitesPopup.close();
								});
							}, 0);
						}
					}
				});
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
			SettingsWidget.close();
			window.open(this.#publicUrl, '_blank');
		}
		#handleCreateLanding() {
			this.#getRequisiteButton().setWaiting(true);
			this.#createLanding().then(() => {
				this.#requisitesPopup = null;
				this.#requisiteButton = null;
				this.#updateElement();
				if (!this.#isPublic) {
					const errorPopup = new Popup('public-landing-error', this.getElement().querySelector('[data-role="requisite-widget-title"]'), {
						autoHide: true,
						closeByEsc: true,
						angle: true,
						darkMode: true,
						content: main_core.Loc.getMessage('INTRANET_SETTINGS_WIDGET_CREATE_LANDING_ERROR'),
						events: {
							onShow: () => {
								setTimeout(() => {
									main_core.Event.bindOnce(SettingsWidget.getInstance().getWidget().getPopup().getPopupContainer(), 'click', () => {
										errorPopup.close();
									});
								}, 0);
							},
							onClose: () => {
								errorPopup.destroy();
							}
						}
					});
					errorPopup.show();
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
			SettingsWidget.close();
			BX.SidePanel.Instance.open(`/crm/company/details/${this.#companyId}/?init_mode=edit&rqedit=y`);
		}
		#handleCreateCompany() {
			SettingsWidget.close();
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
			this.#requisiteSection = new RequisiteSection(options.requisite);
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
			widgetLoader.clearBeforeInsertContent();
			this.#getItemsList().then(() => {
				this.#drawItemsList();
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
		static bindAndShow(button) {
			const instance = this.getInstance();
			if (instance) {
				main_core.Event.unbindAll(button);
				main_core.Event.bind(button, 'click', instance.toggle.bind(instance, button));
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
					BX.UI.Notification.Center.notify({
						content: main_core.Loc.getMessage('INTRANET_SETTINGS_WIDGET_LINK_COPIED_POPUP'),
						position: 'top-left',
						autoHideDelay: 3000
					});
				}
			};
			return main_core.Tag.render`<span class='ui-icon-set --link-3 intranet-settings-widget__header-btn' onclick="${onclickCopyLink}"></span>`;
		}
		#getEditHeaderIcon() {
			const onclickEditLink = () => {
				this.getWidget().close();
				BX.SidePanel.Instance.open(this.#settingsUrl + '?analyticContext=widget_settings_settings&page=portal&option=subDomainName');
			};
			return main_core.Tag.render`<span class='ui-icon-set --pencil-40 intranet-settings-widget__header-btn' onclick="${onclickEditLink}"></span>`;
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
			<span class="intranet-settings-widget__footer-item" onclick="${onclickOpenPartnerOrder}">
				${main_core.Loc.getMessage('INTRANET_SETTINGS_WIDGET_ORDER_PARTNER_LINK_MSGVER_1')}
			</span>
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
					<span class="intranet-settings-widget__footer-item" onclick="${onclickWhereToBegin}">
						${main_core.Loc.getMessage('INTRANET_SETTINGS_WIDGET_WHERE_TO_BEGIN_LINK')}
					</span>
					<span class="intranet-settings-widget__footer-item" onclick="${onclickSupport}">
						${main_core.Loc.getMessage('INTRANET_SETTINGS_WIDGET_SUPPORT_BUTTON')}
					</span>
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
		#getMainPageElement() {
			const onclick = () => {
				this.getWidget().close();
				BX.SidePanel.Instance.open(this.#mainPage.settingsPath);
				// todo: add vibe analytic context sub_section = from_widget_vibe_point
			};
			const element = main_core.Tag.render`
			<div onclick="${onclick}" class="intranet-settings-widget_box --clickable" data-testid="settings-widget-block-main-page">
				<div class="intranet-settings-widget_inner">
					<div class="intranet-settings-widget_icon-box --green">
						<div class="ui-icon-set --home-page"></div>
					</div>
					<div class="intranet-settings-widget__title">
						${main_core.Loc.getMessage('INTRANET_SETTINGS_WIDGET_WELCOME_PAGE_TITLE')}
					</div>
				</div>
				<div class="intranet-settings-widget__arrow-btn ui-icon-set --arrow-right"></div>
			</div>
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
			<button type="button" class="intranet-settings-widget__branch" onclick="${onclickOpen}" data-testid="settings-widget-block-filial-network">
			<span class="intranet-settings-widget__branch-icon_box">
				<span class="ui-icon-set intranet-settings-widget__branch-icon --filial-network"></span>
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
				<button type="button" onclick="${onclickClose}" class="intranet-settings-widget__close-btn">
					<span aria-hidden="true" class="ui-icon-set --arrow-left intranet-settings-widget__close-btn_icon"></span>
					<span class="intranet-settings-widget__close-btn_name">${main_core.Loc.getMessage('INTRANET_SETTINGS_WIDGET_BRANCH_LIST')}</span>
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
				<span class="ui-icon-set intranet-settings-widget__branch-lock-icon --lock"></span>
			</span>
		`;
			const element = main_core.Tag.render`
			<button type="button" class="intranet-settings-widget__branch" onclick="${onclickOpen}" data-testid="settings-widget-block-filial-network">
				<span class="intranet-settings-widget__branch-icon_box">
					<span class="ui-icon-set intranet-settings-widget__branch-icon --filial-network"></span>
					${!this.#holding.canBeHolding ? lockIcon : ''}
				</span>
				<span class="intranet-settings-widget__branch_content">
					<span class="intranet-settings-widget__title">${title}</span>
				</span>
				<span class="intranet-settings-widget__branch-btn_box">
					<span class="ui-btn ui-btn-light-border ui-btn-round ui-btn-xs ui-btn-no-caps intranet-setting__btn-light">${buttonText}</span>
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
			const onclick = () => {
				this.getWidget().close();
				BX.SidePanel.Instance.open(this.#settingsUrl + '?page=security&analyticContext=widget_settings_settings');
			};
			const element = main_core.Tag.render`
			<span onclick="${onclick}" class="intranet-settings-widget_box --clickable" data-testid="settings-widget-block-security">
				<div class="intranet-settings-widget_inner">
					<div class="intranet-settings-widget_icon-box ${this.#otp.IS_ACTIVE === 'Y' ? '--green' : '--yellow'}">
						<div class="ui-icon-set --shield"></div>
					</div>
					<div class="intranet-settings-widget__title">
						${main_core.Loc.getMessage('INTRANET_SETTINGS_WIDGET_SECTION_SECURITY_TITLE')}
					</div>
				</div>
				<div class="intranet-settings-widget__arrow-btn ui-icon-set --arrow-right"></div>
			</span>
		`;
			return this.#prepareElement(element);
		}
		#getGeneralSettingsElement() {
			const onclick = () => {
				this.getWidget().close();
				BX.SidePanel.Instance.open(this.#settingsUrl + '?analyticContext=widget_settings_settings');
			};
			const element = main_core.Tag.render`
			<span onclick="${onclick}" class="intranet-settings-widget_box --clickable" data-testid="settings-widget-block-general-settings">
				<div class="intranet-settings-widget_inner">
					<div class="intranet-settings-widget_icon-box --gray">
						<div class="ui-icon-set --settings-2"></div>
					</div>
					<div class="intranet-settings-widget__title">
						${main_core.Loc.getMessage('INTRANET_SETTINGS_WIDGET_SECTION_SETTINGS_TITLE')}
					</div>
				</div>
				<div class="intranet-settings-widget__arrow-btn ui-icon-set --arrow-right"></div>
			</span>
		`;
			return this.#prepareElement(element);
		}
		#getMigrateElement() {
			const onclick = () => {
				this.getWidget().close();
				BX.SidePanel.Instance.open(`${this.#marketUrl}category/migration/`);
			};
			const element = main_core.Tag.render`
			<div onclick="${onclick}" class="intranet-settings-widget_box --clickable" data-testid="settings-widget-block-migrate">
				<div class="intranet-settings-widget_inner">
					<div class="intranet-settings-widget_icon-box --gray">
						<div class="ui-icon-set --market-1"></div>
					</div>
					<div class="intranet-settings-widget__title">
						${main_core.Loc.getMessage('INTRANET_SETTINGS_WIDGET_SECTION_MIGRATION_TITLE')}
					</div>
				</div>
				<div class="intranet-settings-widget__arrow-btn ui-icon-set --arrow-right"></div>
			</div>
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

})(this.BX.Intranet = this.BX.Intranet || {}, BX, BX.Event, BX.UI, window, window, BX, BX, BX.UI);
//# sourceMappingURL=script.js.map
