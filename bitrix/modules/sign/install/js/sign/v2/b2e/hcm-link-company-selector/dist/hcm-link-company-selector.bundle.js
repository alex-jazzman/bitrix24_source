/* eslint-disable */
this.BX = this.BX || {};
this.BX.Sign = this.BX.Sign || {};
this.BX.Sign.V2 = this.BX.Sign.V2 || {};
(function (exports, main_core, main_core_events, ui_entitySelector, sign_v2_api, humanresources_hcmlink_companyConnectPage) {
	'use strict';

	class HcmLinkCompanySelector extends main_core_events.EventEmitter {
		#isAvailable = false;
		#companyId = null;
		#selectedId = null;
		#lastSavedId = undefined;
		#dialog = null;
		#loader = null;
		isLayoutExisted = false;
		#api;
		#ui = {
			container: HTMLDivElement = null,
			active: HTMLButtonElement = null,
			inactive: HTMLButtonElement = null,
			unselect: HTMLButtonElement = null,
			dropdownButton: HTMLSpanElement = null,
			loaderContainer: HTMLElement = null,
			info: {
				title: HTMLSpanElement = null,
				subtitle: HTMLDivElement = null
			}
		};
		#integrationList = [];
		constructor() {
			super();
			this.#api = new sign_v2_api.Api();
			this.setEventNamespace('sign.v2.b2e.hcm-link-company-selector');
		}
		setAvailability(value) {
			this.#isAvailable = value;
		}
		setCompanyId(id) {
			if (!this.#isAvailable && !this.isLayoutExisted) {
				return;
			}
			if (this.#companyId === id && this.isLayoutExisted) {
				return;
			}
			this.#companyId = id;
			this.#selectedId = null;
			this.#dialog = null;
			if (!this.#companyId) {
				this.hide();
				return;
			}
			this.#showLoader();
			this.#api.checkCompanyHrIntegration(this.#companyId).then(data => {
				this.#getLoader().destroy();
				if (data.length <= 0) {
					this.#ui.inactive.style.display = 'flex';
					this.emit('integrations:loaded', {
						hasIntegrations: false
					});
					return;
				}
				this.#integrationList = data;
				if (this.#lastSavedId === null) {
					this.#lastSavedId = undefined;
					this.#ui.unselect.style.display = 'flex';
					this.emit('integrations:loaded', {
						hasIntegrations: true
					});
					return;
				}
				let itemToSelect = data[0];
				if (this.#lastSavedId) {
					itemToSelect = this.#integrationList.find(item => item.id === this.#lastSavedId) ?? data[0];
				}
				this.#select(itemToSelect);
				this.#ui.active.style.display = 'flex';
				this.emit('integrations:loaded', {
					hasIntegrations: true
				});
			});
		}
		setLastSavedId(integrationId) {
			this.#lastSavedId = integrationId;
		}
		getSelectedId() {
			return this.#selectedId;
		}
		hide() {
			if (!this.#isAvailable || !this.#ui.container) {
				return;
			}
			BX.hide(this.#ui.container);
			this.#dialog?.hide();
		}
		show() {
			if (!this.#isAvailable && !this.isLayoutExisted) {
				return;
			}
			if (!this.#companyId) {
				BX.hide(this.#ui.active);
				BX.hide(this.#ui.unselect);
			}
			main_core.Dom.style(this.#ui.container, {
				display: 'flex'
			});
		}
		render() {
			if (this.#ui.container) {
				return this.#ui.container;
			}
			this.#ui.info.title = main_core.Tag.render`
			<span class="sign-document-b2e-company__hcmlink-select-text"></span>
		`;
			this.#ui.info.subtitle = main_core.Tag.render`
			<div class="sign-document-b2e-company__hcmlink-select-subtitle"></div>
		`;
			this.#ui.active = main_core.Tag.render`
			<div class="sign-document-b2e-company__hcmlink-select --active" data-companies="[]">
				<div class="sign-document-b2e-company__hcmlink-name-container">
					<div class="sign-document-b2e-company__hcmlink-select-header">
						${this.#ui.info.title}
						<span class="sign-document-b2e-company-info-dropdown-btn"
							onclick="${() => {
			this.#showDialog();
		}}"></span>
						${this.#ui.dropdownButton}
					</div>
					${this.#ui.info.subtitle}	
				</div>		
			</div>
		`;
			this.#ui.unselect = main_core.Tag.render`
			<div class="sign-document-b2e-company__hcmlink-select --inactive">
				<div class="sign-document-b2e-company__hcmlink-name-container">
					<span class="sign-document-b2e-company__hcmlink-select-text">
						${main_core.Loc.getMessage('SIGN_B2E_INTEGRATION_INTEGRATION_UNSELECTED')}
					</span>
				</div>
				<button class="ui-btn ui-btn-xs ui-btn-round ui-btn-light-border"
					onclick="${() => this.#showDialog()}">
					${main_core.Loc.getMessage('SIGN_B2E_COMPANIES_SELECT_BUTTON')}
				</button>
			</div>
		`;
			this.#ui.inactive = main_core.Tag.render`
			<div class="sign-document-b2e-company__hcmlink-select --inactive">
				<div class="sign-document-b2e-company__hcmlink-name-container">
					<span class="sign-document-b2e-company__hcmlink-select-text">
						${main_core.Loc.getMessage('SIGN_B2E_COMPANY_INTEGRATION_TITLE')}
					</span>
				</div>
				<button class="ui-btn ui-btn-xs ui-btn-round ui-btn-light-border"
					onclick="${() => this.#showIntegrationMarketSlider()}">
					${main_core.Loc.getMessage('SIGN_B2E_COMPANY_INTEGRATION_BUTTON_CONNECT')}
				</button>
			</div>
		`;
			this.#ui.loaderContainer = main_core.Tag.render`
			<div class="sign-document-b2e-company__hcmlink-loader"><div>
		`;
			this.#ui.icon = main_core.Tag.render`<div class="sign-document-b2e-company__hcmlink-info-img"></div>`;
			this.#ui.container = main_core.Tag.render`
			<div class="sign-document-b2e-company__hcmlink">
				${this.#ui.icon}
				${this.#ui.loaderContainer}
				${this.#ui.active}
				${this.#ui.inactive}
				${this.#ui.unselect}
			</div>
		`;
			this.hide();
			return this.#ui.container;
		}
		#select(item) {
			this.#selectedId = item?.id ?? null;
			BX.hide(this.#ui.unselect);
			BX.hide(this.#ui.inactive);
			this.#ui.active.style.display = 'flex';
			this.#setIntegrationTitle(this.#selectedId);
			main_core.Dom.addClass(this.#ui.icon, '--active');
			this.emit('selected', {
				id: this.#selectedId,
				availableSettings: this.#getCompanyById(this.#selectedId)?.availableSettings ?? {}
			});
		}
		#deselect(item) {
			main_core.Dom.removeClass(this.#ui.icon, '--active');
			this.#selectedId = null;
			BX.hide(this.#ui.active);
			BX.hide(this.#ui.inactive);
			this.#ui.unselect.style.display = 'flex';
			this.emit('selected', {
				id: this.#selectedId,
				availableSettings: {}
			});
		}
		#getCompanyById(id) {
			return this.#integrationList.find(company => company.id === id);
		}
		#showDialog() {
			this.#getDialog()?.show();
		}
		#getDialog() {
			if (this.#dialog) {
				return this.#dialog;
			}
			const items = this.#integrationList.map(integration => {
				return {
					id: integration.id,
					entityId: 'hrm-integration',
					title: integration.title,
					subtitle: integration.subtitle,
					tabs: 'hrm-integrations'
				};
			});
			this.#dialog = new ui_entitySelector.Dialog({
				targetNode: this.#ui.container,
				width: 425,
				height: 363,
				items,
				tabs: [{
					id: 'hrm-integrations',
					title: main_core.Loc.getMessage('SIGN_B2E_INTEGRATION_TAB')
				}],
				showAvatars: false,
				dropdownMode: true,
				multiple: false,
				enableSearch: true,
				events: {
					'Item:OnSelect': event => {
						this.#select(event.data.item);
					},
					'Item:OnDeselect': event => {
						this.#deselect(event.data.item);
					}
				},
				hideOnSelect: true,
				hideOnDeselect: true
			});
			if (this.#selectedId) {
				const item = this.#dialog.getItems().find(item => item.id === this.#selectedId);
				item?.select();
			}
			return this.#dialog;
		}
		#getLoader() {
			if (this.#loader) {
				return this.#loader;
			}
			this.#loader = new BX.Loader({
				target: this.#ui.container,
				mode: 'inline',
				size: 40
			});
			return this.#loader;
		}
		#showLoader() {
			BX.hide(this.#ui.active);
			BX.hide(this.#ui.inactive);
			BX.hide(this.#ui.unselect);
			this.#getLoader().show(this.#ui.loaderContainer);
			this.#ui.container.style.display = 'flex';
			main_core.Dom.removeClass(this.#ui.icon, '--active');
		}

		// refactor later
		#showIntegrationMarketSlider() {
			humanresources_hcmlink_companyConnectPage.CompanyConnectPage.openSlider({}, {
				onCloseHandler: () => this.setCompanyId(this.#companyId)
			});
		}
		#setIntegrationTitle(itemId) {
			if (main_core.Type.isNumber(itemId)) {
				const item = this.#integrationList.find(integration => integration.id === itemId);
				if (item && main_core.Type.isDomNode(this.#ui.info.title) && main_core.Type.isDomNode(this.#ui.info.subtitle)) {
					this.#ui.info.title.innerHTML = item?.title ?? '';
					this.#ui.info.subtitle.innerHTML = item?.subtitle?.toUpperCase() ?? '';
				}
			}
		}
	}

	exports.HcmLinkCompanySelector = HcmLinkCompanySelector;

})(this.BX.Sign.V2.B2e = this.BX.Sign.V2.B2e || {}, BX, BX.Event, BX.UI.EntitySelector, BX.Sign.V2, BX.Humanresources.Hcmlink);
//# sourceMappingURL=hcm-link-company-selector.bundle.js.map
